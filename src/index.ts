#!/usr/bin/env node
/**
 * AndroJack MCP - CLI router
 *
 * Keeps command dispatch cheap so install/help/version do not trigger
 * stdio server bootstrap or tool registration unless they are needed.
 */

import { ANDROJACK_VERSION } from "./version.js";

function writeHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(
    [
      `AndroJack MCP v${ANDROJACK_VERSION}`,
      "",
      "Usage:",
      "  npx androjack-mcp install                Interactive IDE installer",
      "  npx androjack-mcp install --auto         Auto-install to all detected IDEs",
      "  npx androjack-mcp install --ide=cursor   Install to a specific IDE",
      "  npx androjack-mcp serve                  Start the Streamable HTTP server",
      "  npx androjack-mcp serve --allow-remote   Permit non-loopback HTTP binding",
      "  npx androjack-mcp --http                 Start Streamable HTTP from stdio entrypoint",
      "  npx androjack-mcp                        Start the stdio MCP server",
      "  npx androjack-mcp --help                 Show this help",
      "  npx androjack-mcp --version              Show the current version",
      "",
    ].join("\n")
  );
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "install") {
    const { main: runInstaller } = await import("./install.js");
    await runInstaller(args.slice(1));
    return;
  }

  if (command === "serve") {
    const { main: runServe } = await import("./serve.js");
    await runServe(args.slice(1));
    return;
  }

  if (command === "--help" || command === "-h" || command === "help") {
    writeHelp();
    return;
  }

  if (command === "--version" || command === "-v" || command === "version") {
    process.stdout.write(`${ANDROJACK_VERSION}\n`);
    return;
  }

  if (args.includes("--http")) {
    const { main: runStdio } = await import("./stdio.js");
    await runStdio();
    return;
  }

  if (args.length > 0) {
    process.stderr.write(`Unknown command or flag: ${args[0]}\n\n`);
    writeHelp(process.stderr);
    process.exitCode = 1;
    return;
  }

  const { main: runStdio } = await import("./stdio.js");
  await runStdio();
}

main().catch((err) => {
  process.stderr.write(`AndroJack fatal error: ${err}\n`);
  process.exit(1);
});
