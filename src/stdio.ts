#!/usr/bin/env node
/**
 * AndroJack MCP Server – stdio Entrypoint
 *
 * Thin entry point: creates one server instance (or delegates to HTTP)
 * and connects it to the appropriate transport.
 *
 * Compatible with: Claude Desktop, Cursor, Windsurf, VS Code Copilot,
 * JetBrains AI Assistant, AWS Kiro, and any MCP-spec-compliant client.
 *
 * Transport: stdio (universal local compatibility) — or Streamable HTTP
 *            when --http flag is present.
 * Protocol:  MCP spec 2025-11-25 via @modelcontextprotocol/sdk ^1.27.1
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isDirectExecution } from "./cli-entry.js";
import { createAndroJackServer } from "./server-factory.js";

export async function main(): Promise<void> {
  const useHttp = process.argv.includes("--http");

  if (useHttp) {
    // Dynamically import to keep stdio startup zero-cost when HTTP isn't needed
    const { startHttpServer } = await import("./http-server.js");
    await startHttpServer(createAndroJackServer);
  } else {
    const server = createAndroJackServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Log to stderr only — stdout is reserved for MCP JSON protocol
    process.stderr.write("AndroJack MCP server running on stdio. Ready.\n");
  }
}

if (isDirectExecution(import.meta.url)) {
  main().catch((err) => {
    process.stderr.write(`AndroJack fatal error: ${err}\n`);
    process.exit(1);
  });
}
