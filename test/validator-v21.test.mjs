/**
 * AndroJack MCP – v2.1 validator, registry, and catalogue regression tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const { runRules, maskComments, isRuleGatedOut, ANDROID_RULES } = await import('../build/rules/android-rules.js');
const { validateAndroidCode } = await import('../build/tools/validator.js');
const { findInRegistry } = await import('../build/tools/component.js');
const { pickVersionsFromMetadata, compareVersions } = await import('../build/tools/gradle.js');
const { DOC_INDEX, matchDocIndex } = await import('../build/docs-index.js');
const { ALLOWED_DOMAINS } = await import('../build/constants.js');

const ids = (violations) => violations.map((v) => v.ruleId);

// ── Comment masking (agent fix-loop) ────────────────────────────────────────

test('VAL-01 banned APIs mentioned only in comments do not fail validation', () => {
  const code = [
    '// Replaced AsyncTask with coroutines',
    '/* Previously: GlobalScope.launch { } */',
    '/* outer /* nested TestCoroutineDispatcher */ still comment AsyncTask */',
    'class Repo(private val scope: CoroutineScope) {',
    '    fun load() = scope.launch { }',
    '}',
  ].join('\n');
  const report = validateAndroidCode(code, 'kotlin');
  assert.equal(report.verdict, 'PASS', JSON.stringify(report.violations));
});

test('VAL-02 real usages are still caught, with exact line and column', () => {
  const code = 'val a = 1\n// GlobalScope.launch in comment\n    GlobalScope.launch { }';
  const v = runRules(code, { language: 'kotlin' }).find((x) => x.ruleId === 'GLOBALSCOPE_LAUNCH');
  assert.ok(v);
  assert.equal(v.line, 3);
  assert.equal(v.column, 5);
});

test('VAL-03 "//" inside a string literal is not treated as a comment', () => {
  const code = 'val url = "https://example.com"; GlobalScope.launch { }';
  assert.ok(ids(runRules(code, { language: 'kotlin' })).includes('GLOBALSCOPE_LAUNCH'));
});

test('VAL-04 masking preserves length and newlines', () => {
  const code = 'a // x\n/* y\n z */ b';
  const masked = maskComments(code, 'kotlin');
  assert.equal(masked.length, code.length);
  assert.equal(masked.split('\n').length, code.split('\n').length);
  assert.match(masked, /^a\s+\n\s+\n\s+b$/);
});

test('VAL-05 XML comments are masked', () => {
  const code = '<!-- android:screenOrientation="portrait" -->\n<activity android:name=".A" />';
  assert.equal(runRules(code, { language: 'xml', targetSdk: 36 }).length, 0);
});

// ── Rule pattern fixes ──────────────────────────────────────────────────────

test('VAL-06 kapt is detected in Kotlin DSL and plugin declarations', () => {
  for (const code of [
    'kapt("com.google.dagger:hilt-compiler:2.57")',
    'plugins { kotlin("kapt") }',
    'plugins { id("kotlin-kapt") }',
    "kapt 'com.google.dagger:hilt-compiler:2.57'",
  ]) {
    assert.ok(ids(runRules(code, { language: 'gradle' })).includes('GRADLE_KAPT_NEW_PROJECT'), code);
  }
  assert.ok(!ids(runRules('ksp("com.google.dagger:hilt-compiler:2.57")', { language: 'gradle' })).includes('GRADLE_KAPT_NEW_PROJECT'));
});

test('VAL-07 API 37 rules fire for targetSdk 37 but not 36', () => {
  const code = 'field.isAccessible = true\nSystem.load(path)\nval nsd: NsdManager';
  const at36 = ids(runRules(code, { language: 'kotlin', targetSdk: 36 }));
  const at37 = ids(runRules(code, { language: 'kotlin', targetSdk: 37 }));
  for (const id of ['API37_STATIC_FINAL_REFLECTION', 'API37_NATIVE_LIB_SYSTEM_LOAD', 'API37_LOCAL_NETWORK_ACCESS']) {
    assert.ok(!at36.includes(id), `${id} should not fire at 36`);
    assert.ok(at37.includes(id), `${id} should fire at 37`);
  }
});

test('VAL-08 orientation lock is enforced from targetSdk 36 (Android 16), not 30', () => {
  const code = '<activity android:screenOrientation="portrait" />';
  assert.ok(!ids(runRules(code, { language: 'xml', targetSdk: 33 })).includes('XML_SCREEN_ORIENTATION_LOCK'));
  assert.ok(ids(runRules(code, { language: 'xml', targetSdk: 36 })).includes('XML_SCREEN_ORIENTATION_LOCK'));
});

test('VAL-09 CameraX versions before 1.5.2 are flagged; 1.5.2+ are not', () => {
  const bad = ['1.4.2', '1.5.0', '1.5.1', '1.3.0-alpha01'];
  const good = ['1.5.2', '1.6.0', '1.10.0'];
  for (const v of bad) {
    assert.ok(ids(runRules(`implementation("androidx.camera:camera-core:${v}")`, { language: 'gradle' })).includes('CAMERAX_ANDROID17_CRASH'), v);
  }
  for (const v of good) {
    assert.ok(!ids(runRules(`implementation("androidx.camera:camera-core:${v}")`, { language: 'gradle' })).includes('CAMERAX_ANDROID17_CRASH'), v);
  }
});

test('VAL-10 minSdkBelow is enforced (was declared but ignored in v2.0)', () => {
  const rule = { id: 'X', severity: 'info', languages: ['kotlin'], pattern: /x/g, message: '', replacement: '', docUrl: '', minSdkBelow: 26 };
  assert.equal(isRuleGatedOut(rule, { language: 'kotlin', minSdk: 21 }), false);
  assert.equal(isRuleGatedOut(rule, { language: 'kotlin', minSdk: 26 }), true);
  assert.equal(isRuleGatedOut(rule, { language: 'kotlin' }), false, 'unknown minSdk stays conservative');
});

test('VAL-11 rule ids are unique and every rule has an https doc URL', () => {
  const seen = new Set();
  for (const r of ANDROID_RULES) {
    assert.ok(!seen.has(r.id), `duplicate ${r.id}`);
    seen.add(r.id);
    assert.match(r.docUrl, /^https:\/\//, r.id);
  }
});

test('VAL-12 concurrent validations do not share regex state', async () => {
  const code = 'GlobalScope.launch { }\n'.repeat(50);
  const results = await Promise.all(Array.from({ length: 20 }, () => Promise.resolve(validateAndroidCode(code, 'kotlin'))));
  for (const r of results) assert.equal(r.counts.error, 50);
});

test('VAL-13 structured report shape', () => {
  const r = validateAndroidCode('GlobalScope.launch { }', 'kotlin', 24, 37);
  assert.deepEqual(Object.keys(r).sort(), ['counts', 'language', 'minSdk', 'rulesEvaluated', 'targetSdk', 'verdict', 'violations']);
  assert.equal(r.verdict, 'FAIL');
  assert.equal(r.rulesEvaluated, ANDROID_RULES.length);
  assert.equal(r.minSdk, 24);
});

test('VAL-14 50 KB input validates quickly (line lookup is no longer O(n²))', () => {
  const code = 'GlobalScope.launch { }\n'.repeat(2200);
  const start = performance.now();
  const r = validateAndroidCode(code, 'kotlin');
  assert.equal(r.counts.error, 2200);
  assert.ok(performance.now() - start < 1500, `took ${performance.now() - start}ms`);
});

// ── Component registry false positives ──────────────────────────────────────

test('REG-01 generic names no longer map to deprecated components', () => {
  for (const q of ['Row', 'Task', 'io', 'Flow', 'Builder', 'Column']) {
    assert.equal(findInRegistry(q), null, `"${q}" matched ${JSON.stringify(findInRegistry(q)?.[0])}`);
  }
});

test('REG-02 exact, simple-name, and qualified-suffix lookups still resolve', () => {
  assert.equal(findInRegistry('asynctask')?.[0], 'AsyncTask');
  assert.equal(findInRegistry('ProgressDialog')?.[0], 'android.widget.ProgressDialog');
  assert.equal(findInRegistry('Notification.Builder')?.[0], 'android.app.Notification.Builder');
});

// ── Gradle version selection ────────────────────────────────────────────────

test('GRD-01 stable version is chosen even when <release> is an alpha', () => {
  const xml = `<metadata><versioning><latest>2.11.0-alpha03</latest><release>2.11.0-alpha03</release><versions>
    <version>2.9.0</version><version>2.10.0</version><version>2.10.1</version><version>2.11.0-alpha03</version>
  </versions></versioning></metadata>`;
  assert.deepEqual(pickVersionsFromMetadata(xml), { stable: '2.10.1', prerelease: '2.11.0-alpha03' });
});

test('GRD-02 version comparison is numeric, and releases sort after their pre-releases', () => {
  assert.ok(compareVersions('2.10.0', '2.9.0') > 0);
  assert.ok(compareVersions('1.0.0', '1.0.0-rc01') > 0);
  assert.ok(compareVersions('1.0.0-beta01', '1.0.0-alpha13') > 0);
});

// ── Curated documentation index ─────────────────────────────────────────────

test('IDX-01 every curated doc URL is https, allowlisted, and unique', () => {
  const urls = new Set();
  for (const entry of DOC_INDEX) {
    const u = new URL(entry.url);
    assert.equal(u.protocol, 'https:');
    assert.ok(ALLOWED_DOMAINS.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`)), entry.url);
    assert.ok(!urls.has(entry.url), `duplicate ${entry.url}`);
    urls.add(entry.url);
    assert.ok(entry.keywords.every((k) => k === k.toLowerCase()), `keywords must be lower-case: ${entry.title}`);
  }
});

test('IDX-02 common queries resolve to the right official page', () => {
  const expectations = {
    'LazyColumn performance': '/develop/ui/compose/lists',
    'Navigation 3 NavDisplay': '/guide/navigation/navigation-3',
    'Hilt ViewModel injection': '/training/dependency-injection/hilt-android',
    'migrate kapt to ksp': '/build/migrate-to-ksp',
    'AppFunctions agent': '/ai/appfunctions',
    'ACCESS_LOCAL_NETWORK permission': '/privacy-and-security/local-network-permission',
  };
  for (const [query, path] of Object.entries(expectations)) {
    const top = matchDocIndex(query, 3).map((m) => new URL(m.url).pathname);
    assert.ok(top.includes(path), `${query} → ${top.join(', ')}`);
  }
  assert.deepEqual(matchDocIndex('zzzz qqqq', 3), []);
});

test('GRD-03 Maven Central version lists skip prereleases too', async () => {
  const { pickStableVersion } = await import('../build/tools/gradle.js');
  assert.equal(pickStableVersion(['2.11.0', '3.0.0-RC1', '2.12.0-beta02', '2.9.0']), '2.11.0');
  assert.equal(pickStableVersion(['1.0.0-alpha01']), null);
});
