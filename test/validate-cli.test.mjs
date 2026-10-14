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

test('CLI-06 build/, .gradle/, node_modules/ and symlinks are skipped', async () => {
  const root = await makeProject({
    'build/gen/G.kt': 'GlobalScope.launch { }',
    'node_modules/x/N.kt': 'GlobalScope.launch { }',
    'outside/O.kt': 'GlobalScope.launch { }',
    'src/ok.kt': 'class Ok',
  });
  try {
    await symlink(path.join(root, 'outside'), path.join(root, 'src', 'link'));
    const r = await run(['src', 'build', 'node_modules'], root);
    assert.equal(r.code, 0, r.stdout);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
