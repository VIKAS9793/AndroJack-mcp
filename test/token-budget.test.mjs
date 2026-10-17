/**
 * AndroJack MCP – token budgeting: session dedupe, single untrusted notice,
 * and bounded memory for cached documentation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = await import('@modelcontextprotocol/sdk/inMemory.js');
const { createAndroJackServer } = await import('../build/server-factory.js');
const { docCache, LRUCache } = await import('../build/cache.js');

const realFetch = globalThis.fetch;
const page = (body) => new Response(`<html><body><main>${body}</main></body></html>`, { status: 200, headers: { 'content-type': 'text/html' } });

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createAndroJackServer();
  await server.connect(a);
  const client = new Client({ name: 'tb', version: '1' });
  await client.connect(b);
  return client;
}
const text = (r) => r.content.map((c) => c.text ?? '').join('');

test('TOK-01 a repeated identical result is not resent within a session; refresh resends it', async () => {
  const c = await connect();
  try {
    const first = text(await c.callTool({ name: 'android_api17_compliance', arguments: { topic: 'overview' } }));
    const repeat = text(await c.callTool({ name: 'android_api17_compliance', arguments: { topic: 'overview' } }));
    const refreshed = text(await c.callTool({ name: 'android_api17_compliance', arguments: { topic: 'overview', refresh: true } }));
    assert.ok(first.length > 2000);
    assert.ok(repeat.length < 400, repeat);
    assert.match(repeat, /refresh: true/);
    assert.equal(refreshed, first);
  } finally {
    await c.close();
  }
});

test('TOK-02 dedupe is per session: a new session gets full content', async () => {
  const c1 = await connect();
  const c2 = await connect();
  try {
    const a = text(await c1.callTool({ name: 'android_navigation3_guide', arguments: {} }));
    const b = text(await c2.callTool({ name: 'android_navigation3_guide', arguments: {} }));
    assert.equal(a, b);
  } finally {
    await c1.close();
    await c2.close();
  }
});

test('TOK-03 small and code-specific tools are never deduped and expose no refresh flag', async () => {
  const c = await connect();
  try {
    const { tools } = await c.listTools();
    for (const name of ['android_code_validator', 'android_component_status', 'android_api_level_check']) {
      const tool = tools.find((t) => t.name === name);
      assert.ok(!('refresh' in (tool.inputSchema.properties ?? {})), name);
    }
    const args = { code: 'GlobalScope.launch { }\n'.repeat(40) };
    const v1 = await c.callTool({ name: 'android_code_validator', arguments: args });
    const v2 = await c.callTool({ name: 'android_code_validator', arguments: args });
    assert.equal(text(v1), text(v2));
    assert.equal(v2.structuredContent.verdict, 'FAIL');
  } finally {
    await c.close();
  }
});

test('TOK-04 a doc page already excerpted is not re-excerpted by a different query; notice appears once', async () => {
  docCache.clear();
  globalThis.fetch = async () => page('Lazy lists and lazy grids. LazyColumn renders only visible items. '.repeat(30));
  const c = await connect();
  try {
    const first = text(await c.callTool({ name: 'android_official_search', arguments: { query: 'LazyColumn' } }));
    assert.equal((first.match(/fetched live from an external website/g) ?? []).length, 1, 'notice once per response');
    assert.ok((first.match(/<UNTRUSTED_EXTERNAL_CONTENT /g) ?? []).length >= 1, 'excerpts still wrapped');
    const overlapping = text(await c.callTool({ name: 'android_official_search', arguments: { query: 'lazy list grid' } }));
    assert.match(overlapping, /already provided earlier in this session/);
    assert.ok(!/<UNTRUSTED_EXTERNAL_CONTENT [^>]*develop\/ui\/compose\/lists/.test(overlapping), 'lists page must not be re-excerpted');
    const refreshed = text(await c.callTool({ name: 'android_official_search', arguments: { query: 'lazy list grid', refresh: true } }));
    assert.match(refreshed, /develop\/ui\/compose\/lists">/);
  } finally {
    globalThis.fetch = realFetch;
    await c.close();
  }
});

test('TOK-05 the documentation cache is bounded by bytes, not just entries', () => {
  const cache = new LRUCache(1000, 10_000);
  for (let i = 0; i < 50; i++) cache.set(`k${i}`, 'x'.repeat(1_000)); // 2,000 bytes each
  assert.ok(cache.stats().bytes <= 10_000, JSON.stringify(cache.stats()));
  assert.ok(cache.stats().size <= 5);
  assert.equal(cache.get('k49'), 'x'.repeat(1_000), 'most recent entry kept');
  cache.set('huge', 'y'.repeat(5_000)); // 10,000 bytes > quarter budget: not cached
  assert.equal(cache.get('huge'), undefined);
  cache.set('k49', 'z');
  assert.ok(cache.stats().bytes <= 10_000);
});
