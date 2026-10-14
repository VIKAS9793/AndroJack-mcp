/**
 * AndroJack MCP – v2.1 HTTP transport hardening tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const { startHttpServer, isAuthorized } = await import('../build/http-server.js');
const { createAndroJackServer, TOOL_NAMES } = await import('../build/server-factory.js');
const { assertSafeBindHost, parseArgs } = await import('../build/serve.js');

const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
const INIT = {
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'uat', version: '1.0.0' } },
};

async function start(opts = {}) {
  return startHttpServer(createAndroJackServer, { port: 0, host: '127.0.0.1', handleSignals: false, ...opts });
}
const base = (h) => `http://127.0.0.1:${h.address.port}`;

test('HTTP-01 bearer token is required when configured', async () => {
  const h = await start({ authToken: 's3cret' });
  try {
    const anon = await fetch(`${base(h)}/mcp`, { method: 'POST', headers: HEADERS, body: JSON.stringify(INIT) });
    assert.equal(anon.status, 401);
    const wrong = await fetch(`${base(h)}/mcp`, { method: 'POST', headers: { ...HEADERS, Authorization: 'Bearer nope' }, body: JSON.stringify(INIT) });
    assert.equal(wrong.status, 401);
    const ok = await fetch(`${base(h)}/mcp`, { method: 'POST', headers: { ...HEADERS, Authorization: 'Bearer s3cret' }, body: JSON.stringify(INIT) });
    assert.equal(ok.status, 200);
    await ok.body?.cancel();
  } finally {
    await h.closeAsync();
  }
});

test('HTTP-02 isAuthorized is a no-op without a configured token', () => {
  assert.equal(isAuthorized(undefined, undefined), true);
  assert.equal(isAuthorized('Bearer x', 'x'), true);
  assert.equal(isAuthorized('bearer   x ', 'x'), true);
  assert.equal(isAuthorized('Basic eA==', 'x'), false);
});

test('HTTP-03 idle sessions are evicted (no permanent 503 lock-out)', async () => {
  const h = await start({ sessionIdleMs: 150 });
  try {
    const r = await fetch(`${base(h)}/mcp`, { method: 'POST', headers: HEADERS, body: JSON.stringify(INIT) });
    assert.equal(r.status, 200);
    await r.body?.cancel();
    assert.equal(h.activeSessions(), 1);
    await delay(500);
    assert.equal(h.activeSessions(), 0);
  } finally {
    await h.closeAsync();
  }
});

test('HTTP-04 unknown session id returns 404 (DELETE and POST)', async () => {
  const h = await start();
  try {
    const del = await fetch(`${base(h)}/mcp`, { method: 'DELETE', headers: { 'mcp-session-id': 'nope' } });
    assert.equal(del.status, 404);
    const post = await fetch(`${base(h)}/mcp`, {
      method: 'POST',
      headers: { ...HEADERS, 'mcp-session-id': 'nope' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    });
    assert.equal(post.status, 404);
  } finally {
    await h.closeAsync();
  }
});

test('HTTP-05 discovery reports the real tool count and auth requirement', async () => {
  const h = await start({ authToken: 't' });
  try {
    const wk = await (await fetch(`${base(h)}/.well-known/mcp`)).json();
    assert.equal(wk.tools, TOOL_NAMES.length);
    assert.equal(wk.auth_required, true);
    const health = await (await fetch(`${base(h)}/healthz`)).json();
    assert.equal(health.status, 'ok');
  } finally {
    await h.closeAsync();
  }
});

test('HTTP-06 stateless mode serves tools/list without a session', async () => {
  const h = await start({ stateless: true });
  try {
    const init = await fetch(`${base(h)}/mcp`, { method: 'POST', headers: HEADERS, body: JSON.stringify(INIT) });
    assert.equal(init.status, 200);
    assert.equal(init.headers.get('mcp-session-id'), null);
    await init.body?.cancel();

    const list = await fetch(`${base(h)}/mcp`, {
      method: 'POST',
      headers: { ...HEADERS, 'mcp-protocol-version': '2025-11-25' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    });
    assert.equal(list.status, 200);
    const body = await list.json();
    assert.equal(body.result.tools.length, TOOL_NAMES.length);

    const get = await fetch(`${base(h)}/mcp`, { method: 'GET', headers: HEADERS });
    assert.equal(get.status, 405);
    assert.equal(h.activeSessions(), 0);
  } finally {
    await h.closeAsync();
  }
});

test('HTTP-07 remote bind policy: refuse key-without-token, allow with token', () => {
  assert.throws(() => assertSafeBindHost('0.0.0.0', false, {}), /--allow-remote/);
  assert.throws(
    () => assertSafeBindHost('0.0.0.0', true, { ANDROJACK_DEVELOPER_KNOWLEDGE_API_KEY: 'k' }),
    /ANDROJACK_HTTP_TOKEN/
  );
  assert.doesNotThrow(() => assertSafeBindHost('0.0.0.0', true, { ANDROJACK_DEVELOPER_KNOWLEDGE_API_KEY: 'k', ANDROJACK_HTTP_TOKEN: 't' }));
  assert.doesNotThrow(() => assertSafeBindHost('127.0.0.1', false, {}));
});

test('HTTP-08 serve flags are validated instead of becoming NaN', () => {
  assert.throws(() => parseArgs(['--port', 'abc']), /--port/);
  assert.throws(() => parseArgs(['--port=70000']), /--port/);
  assert.throws(() => parseArgs(['--cache-ttl', '-5']), /--cache-ttl/);
  assert.throws(() => parseArgs(['--prot', '80']), /Unknown serve option/);
  assert.equal(parseArgs(['--port=8080', '--stateless']).port, 8080);
  assert.equal(parseArgs(['--stateless']).stateless, true);
});

test('HTTP-09 invalid port is rejected by startHttpServer', async () => {
  await assert.rejects(start({ port: 70000 }), /Invalid port/);
});
