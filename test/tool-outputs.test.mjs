import test from 'node:test';
import assert from 'node:assert';
import { android17Compliance } from '../build/tools/android17-compliance.js';

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
