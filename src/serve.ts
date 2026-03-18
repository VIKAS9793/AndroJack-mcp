#!/usr/bin/env node
/**
 * AndroJack MCP – HTTP Serve Entry Point
 *
 * Starts the Streamable HTTP server for Android Studio and any
 * httpUrl-based MCP client.
 *
 * Usage:
 *   npx androjack-mcp@1.6.4 serve                 # localhost:3000
 *   npx androjack-mcp@1.6.4 serve --port 8080     # custom port
 *   npx androjack-mcp@1.6.4 serve --host 0.0.0.0  # expose on LAN (add your own auth)
 *
 * Android Studio setup:
 *   File → Settings → Tools → AI → MCP Servers → Enable MCP Servers
 *   Paste the config snippet printed below → OK
 */

import chalk from "chalk";
import { createAndroJackServer } from "./server-factory.js";
import { startHttpServer } from "./http-server.js";
import { docCache } from "./cache.js";
import { isDirectExecution } from "./cli-entry.js";

const gradient = (_colors: string[]) => (value: string) => chalk.bold.hex("#3DDC84")(value);

// ── Parse CLI args ────────────────────────────────────────────────────────────

function normalizeServeArgs(rawArgs: string[]): string[] {
  return rawArgs[0] === "serve" ? rawArgs.slice(1) : rawArgs;
}

function parseArgs(args: string[]): {
  port: number;
  host: string;
  cacheTtlHours: number;
  noCache: boolean;
  allowRemote: boolean;
} {
  let port      = parseInt(process.env["PORT"] ?? "3000", 10);
  let host      = process.env["HOST"] ?? "127.0.0.1";
  let cacheTtl  = 24;
  let noCache   = false;
  let allowRemote = process.env["ANDROJACK_ALLOW_REMOTE_HTTP"] === "1";

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--port"      && args[i + 1]) { port     = parseInt(args[++i]!, 10); }
    if (a.startsWith("--port="))            { port     = parseInt(a.split("=")[1]!, 10); }
    if (a === "--host"      && args[i + 1]) { host     = args[++i]!; }
    if (a.startsWith("--host="))            { host     = a.split("=")[1]!; }
    if (a === "--cache-ttl" && args[i + 1]) { cacheTtl = parseInt(args[++i]!, 10); }
    if (a.startsWith("--cache-ttl="))       { cacheTtl = parseInt(a.split("=")[1]!, 10); }
    if (a === "--no-cache")                 { noCache  = true; }
    if (a === "--allow-remote")             { allowRemote = true; }
  }

  return { port, host, cacheTtlHours: cacheTtl, noCache, allowRemote };
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return normalized === "127.0.0.1" || normalized === "localhost" || normalized === "::1" || normalized === "[::1]";
}

function assertSafeBindHost(host: string, allowRemote: boolean): void {
  if (isLoopbackHost(host) || allowRemote) {
    return;
  }

  throw new Error(
    `Refusing to bind HTTP transport to non-loopback host "${host}" without --allow-remote. ` +
    `Keep AndroJack local by default, or pass --allow-remote only behind a trusted network boundary.`
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────

function printBanner(host: string, port: number, noCache: boolean): void {
  const g = gradient(["#3DDC84", "#7F52FF"]);
  const url = `http://${host}:${port}/mcp`;

  console.error("");
  console.error(g("  ╔══════════════════════════════════════════════════════╗"));
  console.error(g("  ║                                                      ║"));
  console.error(g("  ║    🤖  AndroJack MCP  –  HTTP Server                 ║"));
  console.error(g("  ║    The Jack of All Android Trades                    ║"));
  console.error(g("  ║    21 tools · Documentation-grounded · Read-only     ║"));
  console.error(g("  ║                                                      ║"));
  console.error(g("  ╚══════════════════════════════════════════════════════╝"));
  console.error("");
  console.error(chalk.bold("  Server"));
  console.error(`  ${chalk.dim("Endpoint")}   ${chalk.cyan(url)}`);
  console.error(`  ${chalk.dim("Discovery")}  ${chalk.dim(`http://${host}:${port}/.well-known/mcp`)}`);
  console.error(`  ${chalk.dim("Transport")}  ${chalk.green("Streamable HTTP (MCP 2025-03-26)")}`);
  console.error(`  ${chalk.dim("Cache")}      ${noCache ? chalk.yellow("disabled (--no-cache)") : chalk.green("24h LRU per URL")}`);
  console.error("");
  console.error(chalk.bold("  Android Studio Setup"));
  console.error(`  ${chalk.dim("Path")}  ${chalk.dim("File → Settings → Tools → AI → MCP Servers → Enable MCP Servers")}`);
  console.error("");
  console.error(chalk.bold("  Paste this into your mcp.json:"));
  console.error("");
  console.error(chalk.cyan(JSON.stringify(
    { mcpServers: { androjack: { httpUrl: url, timeout: 30000 } } },
    null, 4
  ).split("\n").map(l => "  " + l).join("\n")));
  console.error("");
  console.error(`  ${chalk.dim("Then type")} ${chalk.bold("/mcp")} ${chalk.dim("in Gemini chat to verify all 21 tools are listed.")}`);
  console.error("");
  console.error(chalk.dim("  Not affiliated with or endorsed by Google LLC or the Android Open Source Project."));
  console.error(chalk.dim("  Documentation sourced under CC-BY 4.0 from developer.android.com."));
  console.error("");
  console.error(chalk.dim("  Press Ctrl+C to stop."));
  console.error("");
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export async function main(rawArgs: string[] = process.argv.slice(2)): Promise<void> {
  const args = normalizeServeArgs(rawArgs);
  const { port, host, cacheTtlHours, noCache, allowRemote } = parseArgs(args);
  assertSafeBindHost(host, allowRemote);

  // Configure cache
  if (noCache) {
    docCache.clear();
    docCache.setTtl(0);
  } else {
    docCache.setTtl(cacheTtlHours * 60 * 60 * 1000);
  }

  printBanner(host, port, noCache);

  // Each HTTP session gets a fresh McpServer — pass factory, not instance
  await startHttpServer(createAndroJackServer, { port, host });

  // Periodic cache stats — every 5 minutes in hosted mode
  if (host !== "127.0.0.1" && !noCache) {
    setInterval(() => {
      const s = docCache.stats();
      process.stderr.write(
        `AndroJack cache stats – size:${s.size} hits:${s.hits} misses:${s.misses} ` +
        `evictions:${s.evictions} hitRate:${s.hitRatePercent}%\n`
      );
    }, 5 * 60 * 1000);
  }
}

if (isDirectExecution(import.meta.url)) {
  main().catch((err) => {
    process.stderr.write(`AndroJack serve error: ${err}\n`);
    process.exit(1);
  });
}
