/**
 * AndroJack MCP – release integrity
 *
 * Guards two kinds of drift:
 *   - version strings out of sync across manifests, configs, and badges
 *   - documentation claiming counts or tool names the code does not have
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

test('REL-07 every tool name mentioned in src or docs is a real registered tool', async () => {
  const { readdirSync, statSync } = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const known = new Set([...TOOL_NAMES, 'androjack_grounding_gate']);
  const rootDir = fileURLToPath(root);
  const files = [];
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.') || ['node_modules', 'build', 'release-2.1.0'].includes(name)) continue;
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|md)$/.test(name)) files.push(p);
    }
  })(rootDir);
  // Historical records legitimately name the bad references they document.
  const historical = new Set(['CHANGELOG.md', path.join('docs', 'agent-context', 'bugs.md')]);
  const unknown = [];
  for (const file of files) {
    if (historical.has(path.relative(rootDir, file))) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/`(android_[a-z0-9_]+)`|\*\*(android_[a-z0-9_]+)\*\*|"(android_[a-z0-9_]+)"/g)) {
      const name = m[1] ?? m[2] ?? m[3];
      if (!known.has(name)) unknown.push(`${path.relative(rootDir, file)}: ${name}`);
    }
  }
  assert.deepEqual(unknown, []);
});
