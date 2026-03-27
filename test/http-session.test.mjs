/**
 * AndroJack MCP – HTTP Session Isolation Tests
 *
 * Verifies that each new MCP initialize request creates a FRESH
 * McpServer instance (fixes session-reuse vulnerability found in v1.6.3).
 *
 * Run: npm test   (or: node --test test/http-session.test.mjs)
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// We can't import TypeScript directly; import from the built output.
const { startHttpServer } = await import("../build/http-server.js");
const { createAndroJackServer } = await import("../build/server-factory.js");

const INIT_BODY = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "0.0.1" },
  },
});

function makeInitRequest(host, port) {
  return fetch(`http://${host}:${port}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: INIT_BODY,
  });
}

// ── Test 1: Two separate initialize requests → two distinct server instances ──

await test("two initialize requests create two distinct McpServer instances", async () => {
  let callCount = 0;
  const trackingFactory = () => {
    callCount++;
    return createAndroJackServer();
  };

  const handle = await startHttpServer(trackingFactory, { port: 0, host: "127.0.0.1" });
  const { port } = handle.address;

  try {
    // First initialize
    const r1 = await makeInitRequest("127.0.0.1", port);
    if (r1.status !== 200) {
      console.error("DEBUG: 406 response body:", await r1.text());
    }
    assert.equal(r1.status, 200, `First init returned ${r1.status}`);
    await r1.body?.cancel();

    // Second initialize (no mcp-session-id header → new session)
    const r2 = await makeInitRequest("127.0.0.1", port);
    assert.equal(r2.status, 200, `Second init returned ${r2.status}`);
    await r2.body?.cancel();

    assert.equal(callCount, 2, `Expected 2 server creations, got ${callCount}`);
  } finally {
    handle.close();
  }
});

// ── Test 2: Subsequent request on existing session does not create a new server ─

await test("subsequent request on existing session reuses transport, not new server", async () => {
  let callCount = 0;
  const trackingFactory = () => {
    callCount++;
    return createAndroJackServer();
  };

  const handle = await startHttpServer(trackingFactory, { port: 0, host: "127.0.0.1" });
  const { port } = handle.address;

  try {
    // Establish session via initialize
    const r1 = await makeInitRequest("127.0.0.1", port);
    assert.equal(r1.status, 200);
    const sessionId = r1.headers.get("mcp-session-id");
    await r1.body?.cancel();
    assert.ok(sessionId, "Expected mcp-session-id header on initialize response");

    const countAfterFirst = callCount;

    // Second request reusing the session ID — server should NOT be re-created
    const r2 = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "ping" }),
    });
    await r2.body?.cancel();

    assert.equal(callCount, countAfterFirst, "Server factory should not be called again for existing session");
  } finally {
    handle.close();
  }
});

// ── Test 3: DELETE /mcp removes the session, server is not recreated ──────────

await test("DELETE removes session cleanly, counter unchanged", async () => {
  let callCount = 0;
  const trackingFactory = () => {
    callCount++;
    return createAndroJackServer();
  };

  const handle = await startHttpServer(trackingFactory, { port: 0, host: "127.0.0.1" });
  const { port } = handle.address;

  try {
    const r1 = await makeInitRequest("127.0.0.1", port);
    const sessionId = r1.headers.get("mcp-session-id");
    await r1.body?.cancel();

    const del = await fetch(`http://127.0.0.1:${port}/mcp`, {
      method: "DELETE",
      headers: { "mcp-session-id": sessionId ?? "" },
    });
    assert.equal(del.status, 200, `DELETE returned ${del.status}`);
    await del.body?.cancel();

    // Counter should remain at 1 (no new server created for DELETE)
    assert.equal(callCount, 1);
  } finally {
    handle.close();
  }
});
