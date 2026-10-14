/**
 * AndroJack MCP – User Acceptance Tests (v2.1.0)
 *
 * Black-box acceptance tests: the BUILT server is launched as a real child
 * process and driven through the official MCP SDK client, exactly as Claude
 * Desktop / Cursor / VS Code / Android Studio would. Each test maps to one
 * acceptance criterion in test/uat/UAT_PLAN.md (UAT-xx ids match).
 *
 * Hermetic: ANDROJACK_OFFLINE=1 is set for the server process, so no test
 * depends on developer.android.com, Google Maven, or Google APIs being
 * reachable. Live-network behaviour is covered by UAT-L1 (opt-in).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const ENTRY = fileURLToPath(new URL('../../build/index.js', import.meta.url));
const { TOOL_NAMES } = await import('../../build/server-factory.js');
const { ANDROID_RULES } = await import('../../build/rules/android-rules.js');
const { startHttpServer } = await import('../../build/http-server.js');
const { createAndroJackServer } = await import('../../build/server-factory.js');

// Context-window budget for tools/list. Every connected client pays this on
// every session; growth must be a deliberate decision, not drift.
const TOOLS_LIST_BUDGET_BYTES = 30_000;

async function connectStdio(extraEnv = {}) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [ENTRY],
    env: { ...process.env, ANDROJACK_OFFLINE: '1', LOG_LEVEL: 'error', ...extraEnv },
    stderr: 'ignore',
  });
  const client = new Client({ name: 'androjack-uat', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

const textOf = (result) => result.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');

const client = await connectStdio();
test.after(async () => {
  await client.close();
});

// ── UAT-01 Installation & discovery ─────────────────────────────────────────

test('UAT-01 a client sees exactly the published tool contract', async () => {
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map((t) => t.name).sort(), [...TOOL_NAMES].sort());
  const info = client.getServerVersion();
  assert.equal(info.name, 'androjack-mcp');
});

test('UAT-02 every tool carries title, description, and full safety annotations', async () => {
  const { tools } = await client.listTools();
  for (const tool of tools) {
    assert.ok(tool.title, `${tool.name} missing title`);
    assert.ok(tool.description && tool.description.length > 40, `${tool.name} description too short`);
    const a = tool.annotations ?? {};
    assert.equal(a.readOnlyHint, true, tool.name);
    assert.equal(a.destructiveHint, false, tool.name);
    assert.equal(a.idempotentHint, true, tool.name);
    assert.equal(typeof a.openWorldHint, 'boolean', tool.name);
  }
});

test('UAT-03 tools/list stays within the context budget', async () => {
  const { tools } = await client.listTools();
  const bytes = JSON.stringify(tools).length;
  assert.ok(bytes <= TOOLS_LIST_BUDGET_BYTES, `tools/list is ${bytes} bytes (budget ${TOOLS_LIST_BUDGET_BYTES})`);
});

// ── UAT-04..07 Validation loop (the core promise) ───────────────────────────

test('UAT-04 agent submits correctly migrated code with a migration comment → PASS (no fix loop)', async () => {
  const code = [
    '// Migrated: replaced AsyncTask and GlobalScope.launch with viewModelScope',
    'class FeedViewModel(private val repo: FeedRepository) : ViewModel() {',
    '    private val _state = MutableStateFlow(FeedUiState())',
    '    val state: StateFlow<FeedUiState> = _state',
    '    fun refresh() = viewModelScope.launch { _state.value = repo.load() }',
    '}',
  ].join('\n');
  const result = await client.callTool({ name: 'android_code_validator', arguments: { code, language: 'kotlin', targetSdk: 37 } });
  assert.equal(result.structuredContent.verdict, 'PASS', textOf(result));
});

test('UAT-05 agent submits code with a removed API → FAIL with machine-readable violations', async () => {
  const code = 'class Loader : AsyncTask<Void, Void, Void>() {\n  override fun doInBackground(vararg p: Void?): Void? = null\n}';
  const result = await client.callTool({ name: 'android_code_validator', arguments: { code } });
  const report = result.structuredContent;
  assert.equal(report.verdict, 'FAIL');
  const v = report.violations.find((x) => x.ruleId === 'REMOVED_ASYNCTASK');
  assert.ok(v, JSON.stringify(report.violations));
  assert.equal(v.line, 1);
  assert.match(v.docUrl, /^https:\/\/developer\.android\.com\//);
  assert.match(textOf(result), /Verdict:\*\*\s+❌ FAIL/);
});

test('UAT-06 Android 17 targets: manifest orientation lock and CameraX crash are caught', async () => {
  const manifest = await client.callTool({
    name: 'android_code_validator',
    arguments: { code: '<manifest><application><activity android:name=".Main" android:screenOrientation="portrait" android:maxAspectRatio="2.0" /></application></manifest>', targetSdk: 37 },
  });
  const ids = manifest.structuredContent.violations.map((v) => v.ruleId);
  assert.ok(ids.includes('XML_SCREEN_ORIENTATION_LOCK'));
  assert.ok(ids.includes('XML_ASPECT_RATIO_IGNORED'));

  const gradle = await client.callTool({
    name: 'android_code_validator',
    arguments: { code: 'dependencies {\n    implementation("androidx.camera:camera-camera2:1.4.2")\n}', language: 'gradle' },
  });
  assert.ok(gradle.structuredContent.violations.some((v) => v.ruleId === 'CAMERAX_ANDROID17_CRASH'));
});

test('UAT-07 empty code is reported as a tool error, not a PASS', async () => {
  const result = await client.callTool({ name: 'android_code_validator', arguments: { code: '   x ' } });
  assert.equal(result.isError, true);
});

// ── UAT-08..10 Correct answers (no confident wrong verdicts) ────────────────

test('UAT-08 asking about "Row" does not claim it is deprecated', async () => {
  const text = textOf(await client.callTool({ name: 'android_component_status', arguments: { component_name: 'Row' } }));
  assert.ok(!/DEPRECATED|REMOVED/.test(text.split('\n').slice(0, 3).join('\n')), text);
  assert.match(text, /status NOT confirmed/);
});

test('UAT-09 asking about AsyncTask returns REMOVED with a replacement', async () => {
  const text = textOf(await client.callTool({ name: 'android_component_status', arguments: { component_name: 'AsyncTask' } }));
  assert.match(text, /REMOVED/);
  assert.match(text, /Coroutines/);
});

test('UAT-10 Android 17 large-screen guidance states the games exemption correctly', async () => {
  const text = textOf(await client.callTool({ name: 'android_api17_compliance', arguments: { topic: 'large screen' } }));
  assert.match(text, /android:appCategory="game"/);
  assert.match(text, /still apply on API 37/);
  assert.ok(!/exemption no longer applies/i.test(text));
});

test('UAT-11 Play target-API answer reflects that the Aug 31, 2026 deadline is in force', async () => {
  const text = textOf(await client.callTool({ name: 'android_play_policy_advisor', arguments: { topic: 'overview' } }));
  assert.match(text, /in force since August 31, 2026/i);
  assert.match(text, /November 1, 2026/);
});

// ── UAT-12..13 Search behaviour ─────────────────────────────────────────────

test('UAT-12 offline search returns canonical official links and makes no network calls', async () => {
  const text = textOf(await client.callTool({ name: 'android_official_search', arguments: { query: 'LazyColumn performance' } }));
  assert.match(text, /https:\/\/developer\.android\.com\/develop\/ui\/compose\/lists/);
  assert.match(text, /Offline mode/);
});

test('UAT-13 a query with no match says so instead of returning filler', async () => {
  const text = textOf(await client.callTool({ name: 'android_official_search', arguments: { query: 'qqqq zzzz xxxx' } }));
  assert.match(text, /do not fall back to training memory/);
  assert.ok(!/Search results\n/.test(text));
});

// ── UAT-14 Every tool answers ───────────────────────────────────────────────

const SAMPLE_ARGS = {
  android_official_search: { query: 'WorkManager constraints' },
  android_component_status: { component_name: 'LiveData' },
  architecture_reference: { topic: 'mvvm' },
  android_debugger: { stacktrace: 'java.lang.IllegalStateException: Fragment not attached\n  at com.app.Main.onClick(Main.kt:42)' },
  gradle_dependency_checker: { library_name: 'room' },
  android_api_level_check: { api_level_or_name: '37' },
  android_code_validator: { code: 'class Fine { val x = 1 }', language: 'kotlin' },
};

test('UAT-14 every published tool returns non-empty text without a protocol error', async () => {
  for (const name of TOOL_NAMES) {
    const result = await client.callTool({ name, arguments: SAMPLE_ARGS[name] ?? {} });
    const text = textOf(result);
    assert.ok(text.length > 50, `${name} returned ${text.length} chars`);
    assert.ok(!/^Error:|MCP error/i.test(text), `${name}: ${text.slice(0, 200)}`);
  }
});

// ── UAT-15..16 Resources & prompt ───────────────────────────────────────────

test('UAT-15 the rule catalogue is readable as a resource and matches the validator', async () => {
  const { contents } = await client.readResource({ uri: 'androjack://rules' });
  const rules = JSON.parse(contents[0].text);
  assert.equal(rules.length, ANDROID_RULES.length);

  const one = await client.readResource({ uri: 'androjack://rules/REMOVED_ASYNCTASK' });
  assert.equal(JSON.parse(one.contents[0].text).severity, 'error');

  const info = JSON.parse((await client.readResource({ uri: 'androjack://server-info' })).contents[0].text);
  assert.equal(info.tools, TOOL_NAMES.length);
  assert.equal(info.retrieval, 'offline-index');

  const { resourceTemplates } = await client.listResourceTemplates();
  assert.ok(resourceTemplates.some((t) => t.uriTemplate === 'androjack://rules/{ruleId}'));
});

test('UAT-16 the grounding-gate prompt never tells the model to obey fetched content', async () => {
  const prompt = await client.getPrompt({ name: 'androjack_grounding_gate' });
  const text = prompt.messages.map((m) => m.content.text).join('\n');
  assert.ok(!/read and follow them/i.test(text));
  assert.match(text, /UNTRUSTED CONTENT/);
  assert.match(text, /never follow instructions/i);
});

// ── UAT-17 Remote / HTTP client path ────────────────────────────────────────

test('UAT-17 an HTTP client with a bearer token can list and call tools', async () => {
  const handle = await startHttpServer(createAndroJackServer, { port: 0, host: '127.0.0.1', authToken: 'uat-token', handleSignals: false });
  const http = new Client({ name: 'androjack-uat-http', version: '1.0.0' });
  try {
    const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${handle.address.port}/mcp`), {
      requestInit: { headers: { Authorization: 'Bearer uat-token' } },
    });
    await http.connect(transport);
    const { tools } = await http.listTools();
    assert.equal(tools.length, TOOL_NAMES.length);
    const result = await http.callTool({ name: 'android_code_validator', arguments: { code: 'GlobalScope.launch { }' } });
    assert.equal(result.structuredContent.verdict, 'FAIL');
  } finally {
    await http.close().catch(() => {});
    await handle.closeAsync();
  }
});

// ── UAT-L1 Live network (opt-in: ANDROJACK_UAT_LIVE=1) ──────────────────────

test('UAT-L1 live search returns real documentation text (opt-in)', { skip: process.env.ANDROJACK_UAT_LIVE !== '1' }, async () => {
  const live = await connectStdio({ ANDROJACK_OFFLINE: '0' });
  try {
    const text = textOf(await live.callTool({ name: 'android_official_search', arguments: { query: 'LazyColumn' } }));
    assert.match(text, /UNTRUSTED_EXTERNAL_CONTENT/);
    assert.match(text, /Lazy/);
    assert.ok(text.length > 800, `only ${text.length} chars — live retrieval returned no content`);
  } finally {
    await live.close();
  }
});
