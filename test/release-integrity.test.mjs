/**
 * AndroJack MCP – release integrity
 *
 * Guards the two kinds of drift that shipped in earlier releases:
 *   - version strings out of sync across manifests (v2.0.0 shipped with
 *     src/version.ts bumped but package.json and configs stale)
 *   - documentation claiming counts the code does not have (v1.7.x claimed
 *     31 validator rules; 28 existed)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const pkg = JSON.parse(read('package.json'));
const { ANDROJACK_VERSION } = await import('../build/version.js');
const { TOOL_NAMES } = await import('../build/server-factory.js');
const { ANDROID_RULES } = await import('../build/rules/android-rules.js');

test('REL-01 version is identical across package, runtime, manifests, and registry files', () => {
  assert.equal(ANDROJACK_VERSION, pkg.version);
  for (const file of ['manifest.json', 'server.json', '.mcp/server.json']) {
    const json = JSON.parse(read(file));
    assert.equal(json.version, pkg.version, `${file} version`);
    for (const p of json.packages ?? []) assert.equal(p.version, pkg.version, `${file} packages[].version`);
  }
});

test('REL-02 every IDE config pins the current package version', () => {
  for (const name of readdirSync(new URL('config/', root))) {
    const text = read(`config/${name}`);
    const pins = [...text.matchAll(/androjack-mcp(?:@|%40)(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
    assert.ok(pins.length > 0, `${name} has no version pin`);
    for (const v of pins) assert.equal(v, pkg.version, `${name} pins ${v}`);
  }
});

test('REL-03 README install commands and badges pin the current version', () => {
  const readme = read('README.md');
  const current = readme.slice(0, readme.indexOf('## 📋 Changelog'));
  const pins = [...current.matchAll(/androjack-mcp(?:@|%40)(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
  assert.ok(pins.length > 5);
  for (const v of pins) assert.equal(v, pkg.version);
  for (const b64 of current.matchAll(/(?:params|config)=([A-Za-z0-9+/=]{20,})\)/g)) {
    const decoded = Buffer.from(b64[1], 'base64').toString('utf8');
    assert.match(decoded, new RegExp(`androjack-mcp@${pkg.version.replace(/\./g, '\\.')}`), decoded);
  }
});

test('REL-04 README current-state counts match the code', () => {
  const readme = read('README.md');
  const current = readme.slice(0, readme.indexOf('## 📋 Changelog'));
  for (const m of current.matchAll(/\b(\d+)\s+(?:specialized\s+)?[Tt]ools\b/g)) {
    assert.equal(Number(m[1]), TOOL_NAMES.length, `README says "${m[0]}"`);
  }
  for (const m of current.matchAll(/\b(\d+)\s+(?:validator\s+)?rules\b/g)) {
    assert.equal(Number(m[1]), ANDROID_RULES.length, `README says "${m[0]}"`);
  }
});

test('REL-05 CHANGELOG top entry is the current version', () => {
  const first = read('CHANGELOG.md').match(/^## \[(\d+\.\d+\.\d+)\]/m);
  assert.equal(first?.[1], pkg.version);
});

test('REL-06 tool descriptions never hardcode a rule count that differs from the engine', async () => {
  const src = read('src/server-factory.ts');
  for (const m of src.matchAll(/\b(\d+)\s+Android-specific rules/g)) {
    assert.equal(Number(m[1]), ANDROID_RULES.length);
  }
});
