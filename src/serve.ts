#!/usr/bin/env node
/**
 * AndroJack MCP – HTTP Serve Entry Point
 *
 * Starts the Streamable HTTP server for Android Studio and any
 * httpUrl-based MCP client.
 *
 * Usage:
 *   npx androjack-mcp@2.1.0 serve                 # localhost:3000
 *   npx androjack-mcp@2.1.0 serve --port 8080     # custom port
 *   npx androjack-mcp@2.1.0 serve --stateless     # no sessions (load-balancer friendly)
 *   ANDROJACK_HTTP_TOKEN=… npx androjack-mcp@2.1.0 serve --host 0.0.0.0 --allow-remote
 *
 * Android Studio setup:
 *   File → Settings → Tools → AI → MCP Servers → Enable MCP Servers
 *   Paste the config snippet printed below → OK
 */

import chalk from "chalk";
import { createAndroJackServer, TOOL_NAMES } from "./server-factory.js";
import { checkBindPolicy, startHttpServer } from "./http-server.js";
import { docCache } from "./cache.js";
import { isDirectExecution } from "./cli-entry.js";

const gradient = (_colors: string[]) => (value: string) => chalk.bold.hex("#3DDC84")(value);

// ── Parse CLI args ────────────────────────────────────────────────────────────

function normalizeServeArgs(rawArgs: string[]): string[] {
  return rawArgs[0] === "serve" ? rawArgs.slice(1) : rawArgs;
}

export interface ServeArgs {
  port: number;
  host: string;
  cacheTtlHours: number;
  noCache: boolean;
  allowRemote: boolean;
  stateless: boolean;
}

function parseInteger(flag: string, raw: string | undefined, min: number, max: number): number {
  const value = Number(raw);
  if (raw === undefined || raw.trim() === "" || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid value for ${flag}: "${raw ?? ""}". Expected an integer between ${min} and ${max}.`);
  }
  return value;
}

/**
 * Parses serve flags. v2.0 used bare parseInt, so "--port abc" became NaN
 * and "--cache-ttl -5" silently disabled caching; both now fail fast.
 */
export function parseArgs(args: string[]): ServeArgs {
  let port      = parseInteger("PORT", process.env["PORT"] ?? "3000", 0, 65535);
  let host      = process.env["HOST"] ?? "127.0.0.1";
  let cacheTtl  = 24;
  let noCache   = false;
  let allowRemote = process.env["ANDROJACK_ALLOW_REMOTE_HTTP"] === "1";
  let stateless = process.env["ANDROJACK_HTTP_STATELESS"] === "1";

  const valueOf = (i: number, a: string): [string | undefined, number] =>
    a.includes("=") ? [a.slice(a.indexOf("=") + 1), i] : [args[i + 1], i + 1];

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    const name = a.split("=")[0];
    if (name === "--port")      { const [v, j] = valueOf(i, a); port = parseInteger("--port", v, 0, 65535); i = j; continue; }
    if (name === "--host")      { const [v, j] = valueOf(i, a); if (!v) throw new Error("--host requires a value"); host = v; i = j; continue; }
    if (name === "--cache-ttl") { const [v, j] = valueOf(i, a); cacheTtl = parseInteger("--cache-ttl", v, 0, 24 * 30); i = j; continue; }
    if (a === "--no-cache")     { noCache = true; continue; }
    if (a === "--allow-remote") { allowRemote = true; continue; }
    if (a === "--stateless")    { stateless = true; continue; }
    throw new Error(`Unknown serve option "${a}". See: npx androjack-mcp --help`);
  }

  return { port, host, cacheTtlHours: cacheTtl, noCache, allowRemote, stateless };
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return normalized === "127.0.0.1" || normalized === "localhost" || normalized === "::1" || normalized === "[::1]";
}

/**
 * Re-exported for callers/tests; the policy itself lives in http-server.ts so
 * that every entry point (serve, --http, programmatic) enforces it.
 */
export function assertSafeBindHost(
  host: string,
  allowRemote: boolean,
  env: NodeJS.ProcessEnv = process.env
): void {
  checkBindPolicy(host, allowRemote, env);
}

// ── Banner ────────────────────────────────────────────────────────────────────

function printBanner(host: string, port: number, noCache: boolean, cacheTtlHours: number, stateless: boolean): void {
  const g = gradient(["#3DDC84", "#7F52FF"]);
  const url = `http://${host}:${port}/mcp`;

  console.error("");
  console.error(g("  ╔══════════════════════════════════════════════════════╗"));
  console.error(g("  ║                                                      ║"));
  console.error(g("  ║    🤖  AndroJack MCP  –  HTTP Server                 ║"));
  console.error(g("  ║    The Jack of All Android Trades                    ║"));
  console.error(g(`  ║    ${`${TOOL_NAMES.length} tools · Documentation-grounded · Read-only`.padEnd(50)}║`));
  console.error(g("  ║                                                      ║"));
  console.error(g("  ╚══════════════════════════════════════════════════════╝"));
  console.error("");
  console.error(chalk.bold("  Server"));
  console.error(`  ${chalk.dim("Endpoint")}   ${chalk.cyan(url)}`);
  console.error(`  ${chalk.dim("Discovery")}  ${chalk.dim(`http://${host}:${port}/.well-known/mcp`)}`);
  console.error(`  ${chalk.dim("Transport")}  ${chalk.green(`Streamable HTTP (MCP 2025-11-25${stateless ? ", stateless" : ""})`)}`);
  console.error(`  ${chalk.dim("Auth")}       ${process.env["ANDROJACK_HTTP_TOKEN"]?.trim() ? chalk.green("bearer token required") : chalk.dim("none (loopback)")}`);
  console.error(`  ${chalk.dim("Cache")}      ${noCache ? chalk.yellow("disabled (--no-cache)") : chalk.green(`${cacheTtlHours}h LRU per URL`)}`);
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
  console.error(`  ${chalk.dim("Then type")} ${chalk.bold("/mcp")} ${chalk.dim(`in Gemini chat to verify all ${TOOL_NAMES.length} tools are listed.`)}`);
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
  const { port, host, cacheTtlHours, noCache, allowRemote, stateless } = parseArgs(args);
  assertSafeBindHost(host, allowRemote);

  // Configure cache
  if (noCache) {
    docCache.clear();
    docCache.setTtl(0);
  } else {
    docCache.setTtl(cacheTtlHours * 60 * 60 * 1000);
  }

  printBanner(host, port, noCache, cacheTtlHours, stateless);

  // Each HTTP session gets a fresh McpServer — pass factory, not instance
  await startHttpServer(createAndroJackServer, { port, host, stateless, allowRemote });

  // Periodic cache stats — every 5 minutes in hosted mode
  if (!isLoopbackHost(host) && !noCache) {
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
