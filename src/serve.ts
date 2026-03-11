#!/usr/bin/env node
/**
 * AndroJack MCP HTTP serve entry point.
 *
 * Starts the Streamable HTTP server used by Android Studio and other httpUrl-based MCP clients.
 */

import chalk from "chalk";
import gradient from "gradient-string";

import { docCache } from "./cache.js";
import { startHttpServer } from "./http-server.js";
import { createAndroJackServer } from "./server-factory.js";

function parseArgs(): { port: number; host: string; cacheTtlHours: number; noCache: boolean } {
  const args = process.argv.slice(2);
  let port = parseInt(process.env["PORT"] ?? "3000", 10);
  let host = process.env["HOST"] ?? "127.0.0.1";
  let cacheTtlHours = 24;
  let noCache = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg === "--port" && args[i + 1]) port = parseInt(args[++i]!, 10);
    if (arg.startsWith("--port=")) port = parseInt(arg.split("=")[1]!, 10);
    if (arg === "--host" && args[i + 1]) host = args[++i]!;
    if (arg.startsWith("--host=")) host = arg.split("=")[1]!;
    if (arg === "--cache-ttl" && args[i + 1]) cacheTtlHours = parseInt(args[++i]!, 10);
    if (arg.startsWith("--cache-ttl=")) cacheTtlHours = parseInt(arg.split("=")[1]!, 10);
    if (arg === "--no-cache") noCache = true;
  }

  return { port, host, cacheTtlHours, noCache };
}

function printBanner(host: string, port: number, noCache: boolean): void {
  const color = gradient(["#3DDC84", "#7F52FF"]);
  const endpoint = `http://${host}:${port}/mcp`;
  const discovery = `http://${host}:${port}/.well-known/mcp`;

  console.error("");
  console.error(color("  ================================================"));
  console.error(color("    AndroJack MCP - HTTP Server"));
  console.error(color("    21 tools | Documentation-grounded | Read-only"));
  console.error(color("  ================================================"));
  console.error("");
  console.error(chalk.bold("  Server"));
  console.error(`  ${chalk.dim("Endpoint")}   ${chalk.cyan(endpoint)}`);
  console.error(`  ${chalk.dim("Discovery")}  ${chalk.dim(discovery)}`);
  console.error(`  ${chalk.dim("Transport")}  ${chalk.green("Streamable HTTP")}`);
  console.error(`  ${chalk.dim("Cache")}      ${noCache ? chalk.yellow("disabled (--no-cache)") : chalk.green("enabled")}`);
  console.error("");
  console.error(chalk.bold("  Android Studio Setup"));
  console.error(`  ${chalk.dim("Path")}  ${chalk.dim("File -> Settings -> Tools -> AI -> MCP Servers -> Enable MCP Servers")}`);
  console.error("");
  console.error(chalk.bold("  Paste this into your mcp.json:"));
  console.error("");
  console.error(chalk.cyan(JSON.stringify(
    { mcpServers: { androjack: { httpUrl: endpoint, timeout: 30000 } } },
    null,
    4
  ).split("\n").map((line) => `  ${line}`).join("\n")));
  console.error("");
  console.error(`  ${chalk.dim("Then type")} ${chalk.bold("/mcp")} ${chalk.dim("in Gemini chat to verify all 21 tools are listed.")}`);
  console.error("");
  console.error(chalk.dim("  Not affiliated with or endorsed by Google LLC or the Android Open Source Project."));
  console.error(chalk.dim("  Documentation is sourced from official Android and Kotlin references."));
  console.error("");
}

async function main(): Promise<void> {
  const { port, host, cacheTtlHours, noCache } = parseArgs();

  if (noCache) {
    docCache.clear();
    docCache.setTtl(0);
  } else {
    docCache.setTtl(cacheTtlHours * 60 * 60 * 1000);
  }

  printBanner(host, port, noCache);

  const server = createAndroJackServer();

  process.env["PORT"] = String(port);
  process.env["HOST"] = host;

  await startHttpServer(server);

  if (host !== "127.0.0.1" && !noCache) {
    setInterval(() => {
      const stats = docCache.stats();
      process.stderr.write(
        `AndroJack cache stats - size:${stats.size} hits:${stats.hits} misses:${stats.misses} ` +
        `evictions:${stats.evictions} hitRate:${stats.hitRatePercent}%\n`
      );
    }, 5 * 60 * 1000);
  }
}

main().catch((err) => {
  process.stderr.write(`AndroJack serve error: ${err}\n`);
  process.exit(1);
});
