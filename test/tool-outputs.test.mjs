import test from 'node:test';
import assert from 'node:assert';
import { android17Compliance } from '../build/tools/android17-compliance.js';
import { androidDeveloperVerification } from '../build/tools/developer-verification.js';
import { architectureReference } from '../build/tools/architecture.js';
import { androidNavigation3Guide } from '../build/tools/navigation3.js';
import { androidTestingGuide } from '../build/tools/testing.js';
import { androidBuildAndPublish } from '../build/tools/build-publish.js';
import { androidDebugger } from '../build/tools/debugger.js';

test('android17Compliance - overview contents', async () => {
  const result = await android17Compliance('overview');
  assert.ok(result.includes('# Android 17 / API 37 Compliance Reference'));
  assert.ok(result.includes('Static Final Field Reflection'));
  assert.ok(result.includes('ACCESS_LOCAL_NETWORK'));
  assert.ok(result.includes('https://developer.android.com/about/versions/17'));
});

test('android17Compliance - specific topic: handoff', async () => {
  const result = await android17Compliance('handoff');
  assert.ok(result.includes('# Android 17 — Handoff API'));
  assert.ok(result.includes('android.intent.action.HANDOFF'));
});

test('android17Compliance - specific topic: checklist', async () => {
  const result = await android17Compliance('checklist');
  assert.ok(result.includes('# Android 17 / API 37 Compliance Checklist'));
  assert.ok(result.includes('[ ] Search codebase for `field.isAccessible = true`'));
});

test('android17Compliance - specific topic: npu', async () => {
  const result = await android17Compliance('npu');
  assert.ok(result.includes('# Android 17 — NPU Access'));
  assert.ok(result.includes('android.hardware.neural_processing_unit'));
});

test('androidDeveloperVerification - overview contents', async () => {
  const result = await androidDeveloperVerification('overview');
  assert.ok(result.includes('# Android Developer Verification Program'));
  assert.ok(result.includes('September 30, 2026'));
  assert.ok(result.includes('Brazil, Indonesia, Singapore, Thailand') || result.includes('Brazil, Indonesia,'));
});

test('androidDeveloperVerification - timeline topic', async () => {
  const result = await androidDeveloperVerification('timeline');
  assert.ok(result.includes('## Timeline'));
  assert.ok(result.includes('March 2026'));
  assert.ok(result.includes('September 30, 2026'));
});

test('androidDeveloperVerification - registration topic', async () => {
  const result = await androidDeveloperVerification('how do I register');
  assert.ok(result.includes('Registration Steps'));
  assert.ok(result.includes('Play Console'));
  assert.ok(result.includes('Android Developer Console'));
});

test('androidDeveloperVerification - enterprise topic', async () => {
  const result = await androidDeveloperVerification('enterprise managed devices');
  assert.ok(result.includes('Enterprise & Managed Devices'));
  assert.ok(result.includes('exempt'));
});

test('androidDeveloperVerification - studio topic', async () => {
  const result = await androidDeveloperVerification('android studio ide integration');
  assert.ok(result.includes('Android Studio Integration'));
  assert.ok(result.includes('signed App Bundle'));
});

test('architectureReference - fragment (maintenance mode)', async () => {
  const result = await architectureReference('fragment');
  assert.ok(result.includes('Compose-First Notice'));
  assert.ok(result.includes('View-based pattern'));
});

test('architectureReference - mvvm (standard topic)', async () => {
  const result = await architectureReference('mvvm');
  assert.ok(result.includes('AndroJack Architecture Reference'));
  assert.ok(result.includes('mvvm'));
});

test('architectureReference - fallback search', async () => {
  const result = await architectureReference('nonexistent_topic');
  assert.ok(result.includes('No direct guide mapped') || result.includes('Could not fetch guide'));
});

test('androidNavigation3Guide - overview', async () => {
  const result = await androidNavigation3Guide('overview');
  assert.ok(result.includes('Navigation 3 — Official Reference'));
  assert.ok(result.includes('rememberNavBackStack'));
});

test('androidNavigation3Guide - scenes', async () => {
  const result = await androidNavigation3Guide('scenes');
  assert.ok(result.includes('Scenes API'));
  assert.ok(result.includes('TwoPaneSceneStrategy'));
});

test('androidNavigation3Guide - migration', async () => {
  const result = await androidNavigation3Guide('migration');
  assert.ok(result.includes('Migrating from Navigation 2'));
  assert.ok(result.includes('navController'));
});

test('androidTestingGuide - compose testing', async () => {
  const result = await androidTestingGuide('compose testing');
  assert.ok(result.includes('Compose UI Testing'));
  assert.ok(result.includes('waitUntil'));
});

test('androidTestingGuide - unit tests', async () => {
  const result = await androidTestingGuide('unit tests');
  assert.ok(result.includes('Unit Testing'));
  assert.ok(result.includes('StandardTestDispatcher'));
});

test('androidTestingGuide - pyramid', async () => {
  const result = await androidTestingGuide('pyramid');
  assert.ok(result.includes('Test Pyramid Strategy'));
  assert.ok(result.includes('70% unit'));
});

test('androidBuildAndPublish - r8', async () => {
  const result = await androidBuildAndPublish('r8');
  assert.ok(result.includes('R8 / ProGuard'));
});

test('androidBuildAndPublish - version catalog', async () => {
  const result = await androidBuildAndPublish('version catalog');
  assert.ok(result.includes('libs.versions.toml'));
  assert.ok(result.includes('[versions]'));
});

test('androidBuildAndPublish - ksp', async () => {
  const result = await androidBuildAndPublish('ksp');
  assert.ok(result.includes('Migrate to KSP'));
});

test('androidBuildAndPublish - android studio', async () => {
  const result = await androidBuildAndPublish('android studio');
  assert.ok(result.includes('Android Studio'));
  assert.ok(result.includes('Quail'));
});

test('androidDebugger - basic parsing and execution', async () => {
  const stacktrace = 'java.lang.NullPointerException: Attempt to invoke virtual method on a null object reference\n' +
                     '\tat android.app.Activity.findViewById(Activity.java:1234)';
  const result = await androidDebugger(stacktrace);
  assert.ok(result.includes('NullPointerException') || result.includes('Error Debugger') || result.includes('Fetch failed'));
});

test('androidDebugger - error handling for short input', async () => {
  const result = await androidDebugger('short');
  assert.ok(result.includes('ERROR: Provide a valid Android stacktrace'));
});
