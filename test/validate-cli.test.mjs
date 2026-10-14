/**
 * AndroJack MCP – `androjack-mcp validate` CLI tests (CI gate)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ENTRY = fileURLToPath(new URL('../build/index.js', import.meta.url));
const { parseValidateArgs, languageForFile } = await import('../build/validate-cli.js');
const { ANDROID_RULES } = await import('../build/rules/android-rules.js');

function run(args, cwd) {
  return new Promise((resolve) => {
    execFile(process.execPath, [ENTRY, 'validate', ...args], { cwd, env: { ...process.env, ANDROJACK_OFFLINE: '1' } },
      (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr }));
  });
}

async function makeProject(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'androjack-cli-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content);
  }
  return root;
}

test('CLI-01 clean project exits 0', async () => {
  const root = await makeProject({ 'app/src/main/kotlin/A.kt': '// AsyncTask was replaced\nclass A' });
  try {
    const r = await run(['.'], root);
    assert.equal(r.code, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /0 error\(s\)/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-02 errors exit 1 and report file:line:col', async () => {
  const root = await makeProject({ 'src/B.kt': 'class B {\n  fun f() = GlobalScope.launch { }\n}' });
  try {
    const r = await run(['src'], root);
    assert.equal(r.code, 1);
    assert.match(r.stdout, /src\/B\.kt:2:\d+: error GLOBALSCOPE_LAUNCH/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-03 --fail-on=warning promotes warnings; --fail-on=never always exits 0', async () => {
  const root = await makeProject({ 'build.gradle.kts': 'dependencies {\n  kapt("x:y:1.0")\n}' });
  try {
    assert.equal((await run(['.'], root)).code, 0, 'warning alone should pass by default');
    assert.equal((await run(['.', '--fail-on=warning'], root)).code, 1);
    assert.equal((await run(['.', '--fail-on', 'never'], root)).code, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-04 SARIF output is valid 2.1.0 with rules and located results', async () => {
  const root = await makeProject({ 'src/C.kt': 'GlobalScope.launch { }' });
  try {
    const r = await run(['.', '--format=sarif'], root);
    const sarif = JSON.parse(r.stdout);
    assert.equal(sarif.version, '2.1.0');
    const run0 = sarif.runs[0];
    assert.equal(run0.tool.driver.rules.length, ANDROID_RULES.length);
    const result = run0.results.find((x) => x.ruleId === 'GLOBALSCOPE_LAUNCH');
    assert.equal(result.level, 'error');
    assert.equal(result.locations[0].physicalLocation.artifactLocation.uri, 'src/C.kt');
    assert.equal(result.locations[0].physicalLocation.region.startLine, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-05 JSON output carries totals and per-file reports', async () => {
  const root = await makeProject({ 'a.xml': '<activity android:screenOrientation="portrait" />' });
  try {
    const r = await run(['.', '--format=json', '--target-sdk=36'], root);
    const json = JSON.parse(r.stdout);
    assert.equal(json.totals.error, 1);
    assert.equal(json.files[0].file, 'a.xml');
    assert.equal(json.files[0].verdict, 'FAIL');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-06 Gradle output dirs, node_modules and walked symlinks are skipped; nested build packages are not', async () => {
  const root = await makeProject({
    'app/build.gradle.kts': 'plugins { id("com.android.application") }',
    'app/build/gen/G.kt': 'GlobalScope.launch { }',
    'node_modules/x/N.kt': 'GlobalScope.launch { }',
    'outside/O.kt': 'GlobalScope.launch { }',
    'app/src/com/example/build/Ok.kt': 'class Ok',
  });
  try {
    await symlink(path.join(root, 'outside'), path.join(root, 'app', 'src', 'link'));
    const r = await run(['app'], root);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /2 file\(s\) checked/);
    assert.match(r.stderr, /skipped 1 symlink/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-06b an explicitly named path is always checked, even a symlink or a build dir', async () => {
  const root = await makeProject({ 'real/Bad.kt': 'GlobalScope.launch { }', 'build/Gen.kt': 'GlobalScope.launch { }' });
  try {
    await symlink(path.join(root, 'real'), path.join(root, 'linked'));
    assert.equal((await run(['linked'], root)).code, 1);
    assert.equal((await run(['build'], root)).code, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-06c a scan that checks nothing, or skips an oversized file, does not pass', async () => {
  const root = await makeProject({ 'docs/README.md': '# no code', 'big/Huge.kt': '// ' + 'x'.repeat(1024 * 1024 + 10) });
  try {
    const empty = await run(['docs'], root);
    assert.equal(empty.code, 2);
    assert.match(empty.stderr, /nothing was checked/);
    const big = await run(['big', '--fail-on=never'], root);
    assert.equal(big.code, 2);
    assert.match(big.stderr, /could not be checked/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI-06d the committed fixture app produces findings (used by the CI dogfood step)', async () => {
  const fixture = fileURLToPath(new URL('./fixtures/sample-app', import.meta.url));
  const r = await run([fixture, '--format=json', '--target-sdk=37']);
  const json = JSON.parse(r.stdout);
  const files = json.files.map((f) => f.file);
  assert.ok(files.some((f) => f.endsWith('com/example/build/Feed.kt')), files.join(','));
  assert.ok(!files.some((f) => f.includes('app/build/generated')), 'module-root build output must be skipped');
  const feed = json.files.find((f) => f.file.endsWith('Feed.kt'));
  assert.deepEqual(feed.violations.map((v) => v.ruleId), ['GLOBALSCOPE_LAUNCH'], 'comment must not trigger REMOVED_ASYNCTASK');
});

test('CLI-07 usage errors exit 2', async () => {
  assert.equal((await run(['--format=xml'])).code, 2);
  assert.equal((await run(['--target-sdk=abc'])).code, 2);
  assert.equal((await run(['--bogus'])).code, 2);
  assert.equal((await run(['/definitely/not/here'])).code, 2);
});

test('CLI-08 argument parsing and language mapping', () => {
  assert.deepEqual(parseValidateArgs([]).paths, ['.']);
  assert.equal(parseValidateArgs(['--target-sdk', '37']).targetSdk, 37);
  assert.equal(languageForFile('app/build.gradle.kts'), 'gradle');
  assert.equal(languageForFile('settings.gradle'), 'gradle');
  assert.equal(languageForFile('Main.kt'), 'kotlin');
  assert.equal(languageForFile('script.main.kts'), 'kotlin');
  assert.equal(languageForFile('AndroidManifest.xml'), 'xml');
  assert.equal(languageForFile('README.md'), null);
});
