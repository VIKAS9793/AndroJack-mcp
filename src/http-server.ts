/**
 * AndroJack MCP – Streamable HTTP Transport
 *
 * Runs the same MCP server over HTTP instead of stdio.
 * Spec: MCP 2025-11-25 Streamable HTTP transport.
 *
 * Usage:
 *   node build/index.js --http              # default port 3000
 *   PORT=8080 node build/index.js --http    # custom port
 *
 * Config for Claude Desktop / Cursor (remote team instance):
 *   {
 *     "mcpServers": {
 *       "androjack": {
 *         "type": "streamable-http",
 *         "url": "http://localhost:3000/mcp"
 *       }
 *     }
 *   }
 *
 * Security note: bind to 127.0.0.1 by default (loopback only).
 * To expose on LAN, set HOST=0.0.0.0 and add your own auth layer.
 */

import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = "127.0.0.1";
const MCP_PATH = "/mcp";
const WELL_KNOWN_PATH = "/.well-known/mcp";

// Per-session transports — Streamable HTTP is session-aware (MCP-Session-Id header)
const sessions = new Map<string, StreamableHTTPServerTransport>();

/**
 * Starts the Streamable HTTP server and connects the provided MCP server to it.
 * Exported so index.ts can dynamically import it only when --http is passed.
 */
export async function startHttpServer(server: McpServer): Promise<void> {
  const port = parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
  const host = process.env.HOST ?? DEFAULT_HOST;

  const httpServer = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

    // ── .well-known/mcp — capability discovery (MCP 2025-11-25) ──────────
    if (url.pathname === WELL_KNOWN_PATH && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: "androjack-mcp",
          version: "1.6.0",
          description:
            "Documentation-grounded Android engineering MCP server with 21 read-only verification tools " +
            "for official-source Android and Kotlin guidance.",
          mcp_endpoint: `http://${host}:${port}${MCP_PATH}`,
          spec_version: "2025-11-25",
          tools: 21,
          read_only: true,
          auth_required: false,
        })
      );
      return;
    }

    // ── /mcp — Streamable HTTP transport endpoint ─────────────────────────
    if (url.pathname !== MCP_PATH) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`AndroJack MCP endpoint is ${MCP_PATH}. Use ${WELL_KNOWN_PATH} for discovery.`);
      return;
    }

    // Only POST and GET are valid for Streamable HTTP
    if (req.method !== "POST" && req.method !== "GET" && req.method !== "DELETE") {
      res.writeHead(405, { Allow: "GET, POST, DELETE" });
      res.end();
      return;
    }

    // DELETE — client signals session teardown
    if (req.method === "DELETE") {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      if (sessionId && sessions.has(sessionId)) {
        await sessions.get(sessionId)!.close();
        sessions.delete(sessionId);
      }
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && sessions.has(sessionId)) {
        // Resume existing session
        transport = sessions.get(sessionId)!;
      } else if (!sessionId) {
        // New session — only valid if this is an Initialize request
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

        const newSessionId = randomUUID();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
          onsessioninitialized: (id) => {
            sessions.set(id, transport);
            process.stderr.write(`AndroJack HTTP: session opened [${id}]\n`);
          },
        });

        transport.onclose = () => {
          sessions.delete(newSessionId);
          process.stderr.write(`AndroJack HTTP: session closed [${newSessionId}]\n`);
        };

        // Connect the shared McpServer to this session's transport
        await server.connect(transport);

        // Handle the Initialize request on the new transport
        await transport.handleRequest(req, res, parsed);
        return;
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Unknown session ID");
        return;
      }

      await transport.handleRequest(req, res);
    } catch (err) {
      process.stderr.write(`AndroJack HTTP error: ${err}\n`);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(
          "AndroJack MCP could not complete this request. Retry the MCP session. " +
          "If the problem continues, restart the local server and review stderr logs."
        );
      }
    }
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, host, () => resolve());
    httpServer.once("error", reject);
  });

  process.stderr.write(
    `AndroJack MCP server running on http://${host}:${port}${MCP_PATH}\n` +
    `Discovery:  http://${host}:${port}${WELL_KNOWN_PATH}\n`
  );

  // Graceful shutdown
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, async () => {
      process.stderr.write(`\nAndroJack HTTP: shutting down (${sig})…\n`);
      for (const t of sessions.values()) await t.close().catch(() => { });
      httpServer.close(() => process.exit(0));
    });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
