/**
 * AndroJack MCP – installer must never lose a user's existing MCP config.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, symlink, stat, chmod, rm, lstat, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const { installToPath } = await import('../build/install.js');
const { parseJsonc } = await import('../build/config-file.js');

const cursor = { id: 'cursor', name: 'Cursor', configKey: 'mcpServers', format: 'standard' };
const vscode = { id: 'vscode', name: 'VS Code', configKey: 'servers', format: 'vscode' };

async function tmp() { return mkdtemp(path.join(tmpdir(), 'androjack-install-')); }

test('INS-01 JSONC configs (comments, trailing commas) are merged, other servers kept', async () => {
  const dir = await tmp();
  try {
    const file = path.join(dir, 'mcp.json');
    await writeFile(file, '{\n  // my servers\n  "servers": {\n    "github": { "command": "gh-mcp", }, /* keep */\n  },\n}\n');
    const r = installToPath(file, vscode);
    assert.equal(r.success, true, r.message);
    const json = JSON.parse(await readFile(file, 'utf8'));
    assert.deepEqual(Object.keys(json.servers).sort(), ['androjack', 'github']);
    assert.match(await readFile(`${file}.androjack-backup`, 'utf8'), /\/\/ my servers/, 'original bytes kept in backup');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('INS-02 an unparseable config is never overwritten', async () => {
  const dir = await tmp();
  try {
    const file = path.join(dir, 'mcp.json');
    const original = '{ "mcpServers": { "a": { "command": "x" } '; // truncated
    await writeFile(file, original);
    const r = installToPath(file, cursor);
    assert.equal(r.success, false);
    assert.match(r.message, /Not modified/);
    assert.equal(await readFile(file, 'utf8'), original);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('INS-03 a non-object server block is not clobbered', async () => {
  const dir = await tmp();
  try {
    const file = path.join(dir, 'mcp.json');
    await writeFile(file, '{ "mcpServers": "managed-elsewhere" }');
    const r = installToPath(file, cursor);
    assert.equal(r.success, false);
    assert.equal(await readFile(file, 'utf8'), '{ "mcpServers": "managed-elsewhere" }');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('INS-04 symlinked configs are written through the link; permissions are preserved', async () => {
  const dir = await tmp();
  try {
    await mkdir(path.join(dir, 'dotfiles'));
    const real = path.join(dir, 'dotfiles', 'mcp.json');
    const link = path.join(dir, 'mcp.json');
    await writeFile(real, '{ "mcpServers": { "a": { "command": "x", "env": { "TOKEN": "secret" } } } }');
    await chmod(real, 0o600);
    await symlink(real, link);
    const r = installToPath(link, cursor);
    assert.equal(r.success, true, r.message);
    assert.ok((await lstat(link)).isSymbolicLink(), 'link preserved');
    const json = JSON.parse(await readFile(real, 'utf8'));
    assert.ok(json.mcpServers.a && json.mcpServers.androjack);
    assert.equal((await stat(real)).mode & 0o777, 0o600);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('INS-05 parseJsonc keeps // and /* inside strings', () => {
  const v = parseJsonc('{ "url": "https://x//y", "glob": "/* not a comment */", }');
  assert.deepEqual(v, { url: 'https://x//y', glob: '/* not a comment */' });
});
