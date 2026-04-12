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
 * Usage:
 *   node build/index.js --http              # default port 3000
 *   PORT=8080 node build/index.js --http    # custom port
 */

import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import { ANDROJACK_VERSION } from "./version.js";

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const MCP_PATH = "/mcp";
const WELL_KNOWN_PATH = "/.well-known/mcp";
const MAX_REQUEST_BODY_BYTES = 1024 * 1024;
const MAX_ACTIVE_SESSIONS = 64;

// ── Types ──────────────────────────────────────────────────────────────────

type HttpError = Error & { statusCode?: number };

interface Session {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

export interface HttpServerHandle {
  close(): void;
  address: { host: string; port: number };
}

export interface HttpServerOptions {
  port?: number;
  host?: string;
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
 * Security controls (all preserved from v1.6.3):
 *   - Loopback-only bind host by default
 *   - Explicit --allow-remote required for non-loopback (enforced in serve.ts)
 *   - Host header validation
 *   - Origin header validation
 *   - Body size cap (1 MiB)
 *   - Active session cap (64)
 *   - Per-session server isolation (introduced in v1.6.4, refactored in v1.7.1)
 */
export async function startHttpServer(
  createServer: () => McpServer,
  opts?: HttpServerOptions
): Promise<HttpServerHandle> {
  const port = opts?.port ?? parseInt(process.env["PORT"] ?? String(DEFAULT_PORT), 10);
  const host = opts?.host ?? process.env["HOST"] ?? DEFAULT_HOST;

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
          tools: 22,
          read_only: true,
          auth_required: false,
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
        await session.transport.close();
        sessions.delete(sessionId);
        process.stderr.write(`AndroJack HTTP: session deleted [${sessionId}]\n`);
      }
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        // ── Resume existing session — reuse only this session's transport ──
        const { transport } = sessions.get(sessionId)!;
        await transport.handleRequest(req, res);
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
          onsessioninitialized: (id) => {
            sessions.set(id, { server: mcpServer, transport });
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

      // Unknown session ID
      res.writeHead(400, { "Content-Type": "text/plain" });
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

  // Graceful shutdown
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, async () => {
      process.stderr.write(`\nAndroJack HTTP: shutting down (${sig})…\n`);
      for (const { transport } of sessions.values()) await transport.close().catch(() => { });
      httpServer.close(() => process.exit(0));
    });
  }

  return {
    close: () => {
      for (const { transport } of sessions.values()) transport.close().catch(() => { });
      httpServer.close();
    },
    address: { host: advertisedHost, port: advertisedPort },
  };
}
