/**
 * AndroJack MCP – Streamable HTTP Transport
 *
 * Runs the MCP server over HTTP instead of stdio.
 * Spec: MCP 2025-11-25 Streamable HTTP transport.
 *
 * Security: each new initialize request creates a FRESH McpServer +
 * StreamableHTTPServerTransport pair. Sessions are never shared —
 * this prevents cross-session state leakage that existed in v1.6.3.
 *
 * v2.1 hardening:
 *   - Idle sessions are evicted (default 30 min). v2.0 kept every session
 *     until the client sent DELETE, so 64 abandoned initializes — from a
 *     crashed IDE or a hostile local page — locked the server at 503.
 *   - Optional bearer-token auth (ANDROJACK_HTTP_TOKEN), compared in
 *     constant time. Required by serve.ts for remote binds that would
 *     otherwise expose a configured Google API key as an open proxy.
 *   - Stateless mode: each POST gets a throwaway server + transport, no
 *     Mcp-Session-Id. Matches the direction of MCP spec 2026-07-28 and lets
 *     the server run behind a round-robin load balancer.
 *   - DELETE for an unknown session returns 404 (spec), not 200.
 *   - Signal handlers are installed once per process, not once per server.
 *
 * Usage:
 *   node build/index.js --http              # default port 3000
 *   PORT=8080 node build/index.js --http    # custom port
 */

import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { ANDROJACK_VERSION } from "./version.js";
import { TOOL_NAMES } from "./server-factory.js";
import { isDeveloperKnowledgeEnabled } from "./integrations/developer-knowledge.js";

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const MCP_PATH = "/mcp";
const WELL_KNOWN_PATH = "/.well-known/mcp";
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const MAX_ACTIVE_SESSIONS = 64;
const DEFAULT_SESSION_IDLE_MS = 30 * 60 * 1000;
const SESSION_SWEEP_INTERVAL_MS = 60 * 1000;
const HEALTH_PATH = "/healthz";

// ── Types ──────────────────────────────────────────────────────────────────

type HttpError = Error & { statusCode?: number };

interface Session {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  lastSeenAt: number;
}

export interface HttpServerHandle {
  close(): void;
  closeAsync(): Promise<void>;
  address: { host: string; port: number };
  activeSessions(): number;
}

export interface HttpServerOptions {
  port?: number;
  host?: string;
  /** Bearer token required on /mcp. Defaults to ANDROJACK_HTTP_TOKEN. */
  authToken?: string;
  /** Evict sessions idle longer than this. Defaults to ANDROJACK_HTTP_SESSION_IDLE_MS or 30 min. */
  sessionIdleMs?: number;
  /** Serve without sessions: fresh server per request, GET/DELETE → 405. */
  stateless?: boolean;
  /** Install SIGINT/SIGTERM handlers (default true). Tests pass false. */
  handleSignals?: boolean;
  /** Permit a non-loopback bind. Defaults to ANDROJACK_ALLOW_REMOTE_HTTP=1. */
  allowRemote?: boolean;
}

/**
 * Remote-bind policy, enforced inside startHttpServer so no entry point can
 * skip it (v2.1 review: `--http` previously bypassed the check in serve.ts).
 * Throws on a violation; returns a warning string for an unauthenticated
 * remote bind, or undefined.
 */
export function checkBindPolicy(
  host: string,
  allowRemote: boolean,
  env: NodeJS.ProcessEnv = process.env
): string | undefined {
  if (isLoopbackHost(host)) return undefined;

  if (!allowRemote) {
    throw new Error(
      `Refusing to bind HTTP transport to non-loopback host "${host}" without --allow-remote ` +
      `(or ANDROJACK_ALLOW_REMOTE_HTTP=1). Keep AndroJack local by default.`
    );
  }

  const hasToken = Boolean(env["ANDROJACK_HTTP_TOKEN"]?.trim());
  if (!hasToken && isDeveloperKnowledgeEnabled(env)) {
    throw new Error(
      `Refusing remote bind: a Google Developer Knowledge API key is configured but ANDROJACK_HTTP_TOKEN is not set. ` +
      `Set ANDROJACK_HTTP_TOKEN so clients must send "Authorization: Bearer <token>".`
    );
  }

  return hasToken
    ? undefined
    : `⚠️  AndroJack is listening on "${host}" without authentication. Set ANDROJACK_HTTP_TOKEN to require a bearer token.`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function createHttpError(statusCode: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function isWildcardHost(host: string): boolean {
  return host === "0.0.0.0" || host === "::";
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return normalized === "127.0.0.1" || normalized === "localhost" || normalized === "::1" || normalized === "[::1]";
}

function buildAllowedOrigins(host: string, port: number): Set<string> {
  const allowedHosts = new Set<string>();
  const addHost = (hostname: string) => {
    allowedHosts.add(hostname.toLowerCase());
  };

  addHost(host);
  if (isLoopbackHost(host) || isWildcardHost(host)) {
    addHost("127.0.0.1");
    addHost("localhost");
    addHost("[::1]");
  }

  const origins = new Set<string>();
  for (const allowedHost of allowedHosts) {
    origins.add(`http://${allowedHost}:${port}`);
    origins.add(`https://${allowedHost}:${port}`);
  }

  return origins;
}

function validateOriginHeader(originHeader: string | undefined, allowedOrigins: Set<string>): void {
  if (!originHeader) {
    return;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(originHeader);
  } catch {
    throw createHttpError(403, "Invalid Origin header");
  }

  const normalizedOrigin = `${parsedOrigin.protocol}//${parsedOrigin.host}`.toLowerCase();
  if (!allowedOrigins.has(normalizedOrigin)) {
    throw createHttpError(403, `Origin "${originHeader}" is not allowed.`);
  }
}

function validateHostHeader(hostHeader: string | undefined, bindHost: string): void {
  if (!hostHeader || isWildcardHost(bindHost)) {
    return;
  }

  let parsedHost: URL;
  try {
    parsedHost = new URL(`http://${hostHeader}`);
  } catch {
    throw createHttpError(400, "Invalid Host header");
  }

  const normalizedHost = parsedHost.hostname.toLowerCase();
  const allowedHosts = new Set<string>([bindHost.toLowerCase()]);
  if (isLoopbackHost(bindHost)) {
    allowedHosts.add("127.0.0.1");
    allowedHosts.add("localhost");
    allowedHosts.add("::1");
    allowedHosts.add("[::1]");
  }

  if (!allowedHosts.has(normalizedHost)) {
    throw createHttpError(403, `Host "${hostHeader}" is not allowed.`);
  }
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** Constant-time bearer check — hashing first equalises buffer lengths. */
export function isAuthorized(authorizationHeader: string | undefined, expectedToken: string | undefined): boolean {
  if (!expectedToken) return true;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader ?? "");
  if (!match) return false;
  return timingSafeEqual(digest(match[1]!.trim()), digest(expectedToken));
}

function parseIdleMs(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

// Signal handlers are process-global; track live servers and install once.
const liveServers = new Set<() => Promise<void>>();
let signalHandlersInstalled = false;

function installSignalHandlers(): void {
  if (signalHandlersInstalled) return;
  signalHandlersInstalled = true;
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, async () => {
      process.stderr.write(`\nAndroJack HTTP: shutting down (${sig})…\n`);
      await Promise.allSettled([...liveServers].map((close) => close()));
      process.exit(0);
    });
  }
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        req.destroy(createHttpError(413, "Request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Starts the Streamable HTTP server.
 *
 * @param createServer - Factory called once per MCP initialize request.
 *   Each call MUST return a new McpServer instance — never share instances
 *   across sessions.
 * @param opts - Optional port/host overrides (fall back to env vars / defaults).
 * @returns A handle with close() and the bound address.
 *
 * Security controls (v2.1 additions marked +):
 *   - Loopback-only bind host by default
 *   - Explicit --allow-remote required for non-loopback (enforced in serve.ts)
 *   - Host header validation
 *   - Origin header validation
 *   - Body size cap (1 MiB)
 *   - Active session cap (64)
 *   - Per-session server isolation (introduced in v1.6.4, refactored in v1.7.1)
 *   + Idle-session eviction, optional bearer auth, stateless mode, 404 on unknown session
 */
export async function startHttpServer(
  createServer: () => McpServer,
  opts?: HttpServerOptions
): Promise<HttpServerHandle> {
  const port = opts?.port ?? parseInt(process.env["PORT"] ?? String(DEFAULT_PORT), 10);
  const host = opts?.host ?? process.env["HOST"] ?? DEFAULT_HOST;
  const authToken = opts?.authToken ?? (process.env["ANDROJACK_HTTP_TOKEN"]?.trim() || undefined);
  const sessionIdleMs = opts?.sessionIdleMs ?? parseIdleMs(process.env["ANDROJACK_HTTP_SESSION_IDLE_MS"]) ?? DEFAULT_SESSION_IDLE_MS;
  const stateless = opts?.stateless ?? false;

  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid port "${port}". Use an integer between 0 and 65535.`);
  }

  const allowRemote = opts?.allowRemote ?? process.env["ANDROJACK_ALLOW_REMOTE_HTTP"] === "1";
  const bindWarning = checkBindPolicy(host, allowRemote);
  if (bindWarning) process.stderr.write(bindWarning + "\n");

  let advertisedPort = port;
  let advertisedHost = host;
  let allowedOrigins = buildAllowedOrigins(host, port);

  // Per-session state: each session owns its own server + transport pair
  const sessions = new Map<string, Session>();

  const httpServer = http.createServer(async (req, res) => {
    try {
      validateHostHeader(req.headers.host, host);
      validateOriginHeader(req.headers.origin as string | undefined, allowedOrigins);
    } catch (err) {
      const statusCode = typeof (err as HttpError).statusCode === "number" ? (err as HttpError).statusCode! : 403;
      res.writeHead(statusCode, { "Content-Type": "text/plain" });
      res.end(err instanceof Error ? err.message : "Forbidden");
      return;
    }

    const url = new URL(req.url ?? "/", "http://localhost");

    // ── /healthz — liveness probe for containers / load balancers ──────────
    if (url.pathname === HEALTH_PATH && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", version: ANDROJACK_VERSION, sessions: sessions.size }));
      return;
    }

    // ── .well-known/mcp — capability discovery ─────────────────────────────
    if (url.pathname === WELL_KNOWN_PATH && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: "androjack-mcp",
          version: ANDROJACK_VERSION,
          description:
            "Documentation-grounded Android engineering MCP server. " +
            "Forces AI tools to verify official docs before generating Android/Kotlin code.",
          mcp_endpoint: `http://${advertisedHost}:${advertisedPort}${MCP_PATH}`,
          spec_version: "2025-11-25",
          transport: stateless ? "streamable-http (stateless)" : "streamable-http",
          tools: TOOL_NAMES.length,
          read_only: true,
          auth_required: Boolean(authToken),
        })
      );
      return;
    }

    // ── /mcp — Streamable HTTP transport endpoint ──────────────────────────
    if (url.pathname !== MCP_PATH) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`AndroJack MCP: endpoint is ${MCP_PATH}`);
      return;
    }

    if (!isAuthorized(req.headers.authorization, authToken)) {
      res.writeHead(401, { "Content-Type": "text/plain", "WWW-Authenticate": 'Bearer realm="androjack"' });
      res.end("Unauthorized");
      return;
    }

    if (stateless) {
      await handleStatelessRequest(req, res);
      return;
    }

    if (req.method !== "POST" && req.method !== "GET" && req.method !== "DELETE") {
      res.writeHead(405, { Allow: "GET, POST, DELETE" });
      res.end();
      return;
    }

    // ── DELETE — client signals session teardown ───────────────────────────
    if (req.method === "DELETE") {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        sessions.delete(sessionId);
        await session.transport.close();
        process.stderr.write(`AndroJack HTTP: session deleted [${sessionId}]\n`);
        res.writeHead(200);
        res.end();
        return;
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Unknown session ID");
      return;
    }

    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        // ── Resume existing session — reuse only this session's transport ──
        const session = sessions.get(sessionId)!;
        session.lastSeenAt = Date.now();
        await session.transport.handleRequest(req, res);
        return;
      }

      if (!sessionId) {
        // ── New session — only valid for MCP Initialize requests ───────────
        if (sessions.size >= MAX_ACTIVE_SESSIONS) {
          res.writeHead(503, { "Content-Type": "text/plain" });
          res.end("Too many active MCP sessions");
          return;
        }

        const body = await readBody(req);
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Invalid JSON");
          return;
        }

        if (!isInitializeRequest(parsed)) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("First request must be an MCP Initialize request");
          return;
        }

        // ── Create a fresh server + transport pair for this session ────────
        const newSessionId = randomUUID();
        const mcpServer = createServer();  // <-- fresh instance per session
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
          maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
          onsessioninitialized: (id) => {
            sessions.set(id, { server: mcpServer, transport, lastSeenAt: Date.now() });
            process.stderr.write(`AndroJack HTTP: session opened [${id}]\n`);
          },
        });

        transport.onclose = () => {
          sessions.delete(newSessionId);
          process.stderr.write(`AndroJack HTTP: session closed [${newSessionId}]\n`);
        };

        // Connect this session's fresh server to its own transport
        await mcpServer.connect(transport);

        // Handle the Initialize request on the new transport
        await transport.handleRequest(req, res, parsed);
        return;
      }

      // Unknown (or evicted) session ID — 404 tells spec-compliant clients
      // to start a new session with a fresh initialize.
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Unknown session ID");
    } catch (err) {
      process.stderr.write(`AndroJack HTTP error: ${err}\n`);
      if (!res.headersSent) {
        const statusCode = typeof (err as HttpError).statusCode === "number"
          ? (err as HttpError).statusCode!
          : 500;
        res.writeHead(statusCode, { "Content-Type": "text/plain" });
        res.end(err instanceof Error ? err.message : "Internal server error");
      }
    }
  });

  let statelessInFlight = 0;

  async function handleStatelessRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST", "Content-Type": "text/plain" });
      res.end("Stateless mode accepts POST only.");
      return;
    }
    if (statelessInFlight >= MAX_ACTIVE_SESSIONS) {
      res.writeHead(503, { "Content-Type": "text/plain", "Retry-After": "1" });
      res.end("Too many concurrent MCP requests");
      return;
    }
    statelessInFlight++;
    let released = false;
    const release = () => {
      if (!released) { released = true; statelessInFlight--; }
    };
    const mcpServer = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
    });
    res.on("close", () => {
      release();
      transport.close().catch(() => { });
      mcpServer.close().catch(() => { });
    });
    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      process.stderr.write(`AndroJack HTTP (stateless) error: ${err}\n`);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal server error");
      }
    }
  }

  // ── Idle-session eviction ────────────────────────────────────────────────
  const sweepTimer = setInterval(() => {
    const cutoff = Date.now() - sessionIdleMs;
    for (const [id, session] of sessions) {
      if (session.lastSeenAt < cutoff) {
        sessions.delete(id);
        session.transport.close().catch(() => { });
        process.stderr.write(`AndroJack HTTP: session evicted after idle timeout [${id}]\n`);
      }
    }
  }, Math.min(SESSION_SWEEP_INTERVAL_MS, sessionIdleMs));
  sweepTimer.unref();

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, host, () => resolve());
    httpServer.once("error", reject);
  });

  const address = httpServer.address();
  if (address && typeof address === "object") {
    advertisedHost = address.family === "IPv6" ? `[${address.address}]` : address.address;
    advertisedPort = address.port;
    allowedOrigins = buildAllowedOrigins(host, advertisedPort);
  }

  process.stderr.write(
    `AndroJack MCP server running on http://${advertisedHost}:${advertisedPort}${MCP_PATH}\n` +
    `Discovery:  http://${advertisedHost}:${advertisedPort}${WELL_KNOWN_PATH}\n`
  );

  const closeAll = async (): Promise<void> => {
    clearInterval(sweepTimer);
    liveServers.delete(closeAll);
    const transports = [...sessions.values()].map((session) => session.transport);
    sessions.clear();
    await Promise.allSettled(transports.map((transport) => transport.close()));
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  };
  liveServers.add(closeAll);
  if (opts?.handleSignals !== false) installSignalHandlers();

  return {
    close: () => {
      void closeAll();
    },
    closeAsync: closeAll,
    address: { host: advertisedHost, port: advertisedPort },
    activeSessions: () => sessions.size,
  };
}
