#!/usr/bin/env node
/**
 * AndroJack MCP server entry point.
 *
 * Transport defaults to stdio for local MCP clients.
 * Pass --http to start the shared Streamable HTTP server instead.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { startHttpServer } from "./http-server.js";
import { createAndroJackServer } from "./server-factory.js";

const server = createAndroJackServer();

async function main(): Promise<void> {
  const useHttp = process.argv.includes("--http");

  if (useHttp) {
    await startHttpServer(server);
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("AndroJack MCP server running on stdio. Ready.\n");
}

main().catch((err) => {
  process.stderr.write(`AndroJack fatal error: ${err}\n`);
  process.exit(1);
});
