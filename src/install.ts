#!/usr/bin/env node
/**
 * AndroJack MCP â€“ Interactive Installer
 *
 * Detects OS, installed IDEs, and config file locations automatically.
 * Supports both automated (--auto) and guided interactive installation.
 *
 * Usage:
 *   npx androjack-mcp@1.6.0 install           â†’ interactive guided mode
 *   npx androjack-mcp@1.6.0 install --auto    â†’ auto-detect and install to all found IDEs
 *   npx androjack-mcp@1.6.0 install --ide cursor   â†’ target a specific IDE
 *   npx androjack-mcp@1.6.0 install --list    â†’ list all supported IDEs and their status
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import figlet from "figlet";
import chalk from "chalk";
import ora from "ora";
import * as clack from "@clack/prompts";

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface IdeTarget {
  id: string;
  name: string;
  configPaths: string[];   // ordered by preference
  configKey: "mcpServers" | "servers"; // JSON structure key
  format: "standard" | "vscode";
  oneClickUrl?: string;
  notes?: string;
}

interface InstallResult {
  ide: string;
  success: boolean;
  path?: string;
  message: string;
}

// â”€â”€ AndroJack server config block (reused for all IDEs) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SERVER_CONFIG_STANDARD = {
  command: "npx",
  args: ["-y", "androjack-mcp@1.6.0"],
  env: {},
  autoApprove: [],
  disabled: false,
};

const SERVER_CONFIG_VSCODE = {
  type: "stdio",
  command: "npx",
  args: ["-y", "androjack-mcp@1.6.0"],
};

// â”€â”€ IDE Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const HOME = os.homedir();
const PLATFORM = process.platform; // darwin | linux | win32

function getConfigPaths(platform: string): IdeTarget[] {
  const appdata = process.env.APPDATA ?? path.join(HOME, "AppData", "Roaming");
  const localappdata = process.env.LOCALAPPDATA ?? path.join(HOME, "AppData", "Local");
  void localappdata; // reserved for future use

  return [
    // â”€â”€ Claude Desktop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "claude",
      name: "Claude Desktop",
      configPaths:
        platform === "darwin"
          ? [path.join(HOME, "Library", "Application Support", "Claude", "claude_desktop_config.json")]
          : platform === "win32"
            ? [path.join(appdata, "Claude", "claude_desktop_config.json")]
            : [path.join(HOME, ".config", "Claude", "claude_desktop_config.json")],
      configKey: "mcpServers",
      format: "standard",
      notes: "Restart Claude Desktop after install. Look for ðŸ”¨ in chat input.",
    },

    // â”€â”€ Cursor IDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "cursor",
      name: "Cursor",
      configPaths: [
        path.join(process.cwd(), ".cursor", "mcp.json"),     // project-level (preferred)
        path.join(HOME, ".cursor", "mcp.json"),              // global
      ],
      configKey: "mcpServers",
      format: "standard",
      notes: "Check Settings â†’ MCP for green dot confirmation.",
    },

    // â”€â”€ Windsurf (Codeium) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "windsurf",
      name: "Windsurf",
      configPaths: [
        path.join(HOME, ".codeium", "windsurf", "mcp_config.json"),
        path.join(HOME, ".windsurf", "mcp_config.json"),
      ],
      configKey: "mcpServers",
      format: "standard",
      notes: "Restart Windsurf â†’ Cascade panel shows AndroJack tools.",
    },

    // â”€â”€ VS Code (GitHub Copilot) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "vscode",
      name: "VS Code (GitHub Copilot)",
      configPaths: [
        path.join(process.cwd(), ".vscode", "mcp.json"),     // workspace (preferred)
        ...(platform === "darwin"
          ? [path.join(HOME, "Library", "Application Support", "Code", "User", "settings.json")]
          : platform === "win32"
            ? [path.join(appdata, "Code", "User", "settings.json")]
            : [path.join(HOME, ".config", "Code", "User", "settings.json")]),
      ],
      configKey: "servers",
      format: "vscode",
      notes: "VS Code 1.99+ required. Copilot Chat â†’ Agent mode to access tools.",
    },

    // â”€â”€ AWS Kiro IDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "kiro",
      name: "AWS Kiro",
      configPaths: [
        path.join(process.cwd(), ".kiro", "settings", "mcp.json"),   // project-level
        path.join(HOME, ".kiro", "settings", "mcp.json"),            // global
      ],
      configKey: "mcpServers",
      format: "standard",
      oneClickUrl: (() => {
        const name = encodeURIComponent("androjack");
        const config = encodeURIComponent(
          JSON.stringify({ command: "npx", args: ["-y", "androjack-mcp@1.6.0"], disabled: false, autoApprove: [] })
        );
        return `https://kiro.dev/launch/mcp/add?name=${name}&config=${config}`;
      })(),
      notes: "Or use the one-click Kiro install link in the README.",
    },

    // â”€â”€ Google Antigravity IDE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "antigravity",
      name: "Google Antigravity IDE",
      configPaths: [
        path.join(HOME, ".gemini", "antigravity", "mcp_config.json"),
      ],
      configKey: "mcpServers",
      format: "standard",
      notes:
        "After saving: Antigravity Agent pane â†’ '...' â†’ MCP Servers â†’ Manage â†’ Refresh.",
    },

    // â”€â”€ JetBrains (Android Studio / IntelliJ) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    {
      id: "jetbrains",
      name: "JetBrains AI (Android Studio / IntelliJ)",
      configPaths: [
        ...(platform === "darwin"
          ? [
            path.join(HOME, "Library", "Application Support", "JetBrains", "AndroidStudio2024.3", "mcp.json"),
            path.join(HOME, "Library", "Application Support", "JetBrains", "IdeaIC2024.3", "mcp.json"),
          ]
          : platform === "win32"
            ? [
              path.join(appdata, "JetBrains", "AndroidStudio2024.3", "mcp.json"),
              path.join(appdata, "JetBrains", "IdeaIC2024.3", "mcp.json"),
            ]
            : [
              path.join(HOME, ".config", "JetBrains", "AndroidStudio2024.3", "mcp.json"),
              path.join(HOME, ".config", "JetBrains", "IdeaIC2024.3", "mcp.json"),
            ]),
      ],
      configKey: "mcpServers",
      format: "standard",
      notes:
        "Or add manually: Android Studio â†’ Settings â†’ Tools â†’ AI Assistant â†’ MCP Servers â†’ +",
    },
  ];
}

// â”€â”€ Config helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildConfig(target: IdeTarget): Record<string, unknown> {
  if (target.format === "vscode") {
    return { servers: { androjack: SERVER_CONFIG_VSCODE } };
  }
  return { mcpServers: { androjack: SERVER_CONFIG_STANDARD } };
}

function mergeConfig(existing: Record<string, unknown>, target: IdeTarget): Record<string, unknown> {
  const key = target.configKey as string;
  const serverBlock =
    target.format === "vscode" ? SERVER_CONFIG_VSCODE : SERVER_CONFIG_STANDARD;

  const existingBlock = (existing[key] as Record<string, unknown>) ?? {};
  return {
    ...existing,
    [key]: { ...existingBlock, androjack: serverBlock },
  };
}

function installToPath(configPath: string, target: IdeTarget): InstallResult {
  try {
    const dir = path.dirname(configPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let finalConfig: Record<string, unknown>;

    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      let existing: Record<string, unknown> = {};
      try {
        existing = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        fs.writeFileSync(configPath + ".backup", raw);
      }
      finalConfig = mergeConfig(existing, target);
    } else {
      finalConfig = buildConfig(target);
    }

    fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2) + "\n", "utf-8");

    return {
      ide: target.name,
      success: true,
      path: configPath,
      message: `Installed to ${configPath}`,
    };
  } catch (err) {
    return {
      ide: target.name,
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

// â”€â”€ IDE Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function detectInstalledIdes(targets: IdeTarget[]): IdeTarget[] {
  return targets.filter((target) => {
    return target.configPaths.some((p) => fs.existsSync(path.dirname(path.dirname(p))));
  });
}

function alreadyInstalled(target: IdeTarget): string | null {
  for (const p of target.configPaths) {
    if (!fs.existsSync(p)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(p, "utf-8")) as Record<string, unknown>;
      const key = target.configKey as string;
      const servers = json[key] as Record<string, unknown> | undefined;
      if (servers?.["androjack"]) return p;
    } catch {
      // ignore
    }
  }
  return null;
}

// â”€â”€ Install to best path for a target â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function installTarget(target: IdeTarget): InstallResult {
  const existingPath = target.configPaths.find((p) => fs.existsSync(p));
  const chosenPath = existingPath ?? target.configPaths[0];
  return installToPath(chosenPath, target);
}

// â”€â”€ TTY Detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Returns true when running inside a real terminal (VS Code integrated terminal,
 * Cursor, Android Studio, IntelliJ, macOS Terminal, Windows Terminal, etc.).
 * Returns false in CI, piped output, or IDE task runners that don't allocate a
 * PTY (e.g. IntelliJ "Run" tool window without 'Emulate terminal').
 */
function hasTty(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

// â”€â”€ Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function printBanner(): void {
  const art = figlet.textSync("AndroJack", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
  });

  // Gradient: cyan â†’ blue â†’ purple line by line
  const lines = art.split("\n");
  const gradientColors = [
    "#00D4FF", "#00C4F0", "#00B0E0",
    "#4090D0", "#6070C8", "#7B2FBE",
  ];
  const colored = lines
    .map((line, i) => {
      const hex = gradientColors[Math.min(i, gradientColors.length - 1)];
      return chalk.bold.hex(hex)(line);
    })
    .join("\n");

  console.log(colored);

  // Android-flavored tagline
  const fixes = [
    chalk.hex("#00D4FF")("Gradle"),
    chalk.hex("#4090D0")("ViewModel"),
    chalk.hex("#7B2FBE")("Room"),
    chalk.hex("#E040FB")("Compose"),
    chalk.hex("#FF6D00")("Navigation"),
    chalk.hex("#00C853")("Hilt"),
    chalk.hex("#FFD600")("WorkManager"),
  ];
  console.log(
    chalk.bold("  MCP Installer") +
    chalk.dim("  Â·  Fixes: ") +
    fixes.join(chalk.dim(" Â· "))
  );
  console.log(
    chalk.dim("  The Jack of All Android Trades\n")
  );
}

// â”€â”€ Status table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function printStatusTable(targets: IdeTarget[]): void {
  console.log(chalk.bold.underline("  IDE Detection Results\n"));
  for (const t of targets) {
    const installed = alreadyInstalled(t);
    const detected = detectInstalledIdes([t]).length > 0;

    let icon: string;
    let label: string;

    if (installed) {
      icon = chalk.green("  âœ“");
      label = chalk.green("already installed") + chalk.dim(` â†’ ${installed}`);
    } else if (detected) {
      icon = chalk.cyan("  â—‰");
      label = chalk.cyan("detected, not configured");
    } else {
      icon = chalk.dim("  â—‹");
      label = chalk.dim("not found");
    }

    console.log(`${icon}  ${chalk.bold(t.name)}  ${label}`);
  }
  console.log();
}

// â”€â”€ Non-interactive (legacy) output helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function legacyOk(msg: string): void {
  process.stdout.write(chalk.green("  âœ… ") + msg + "\n");
}

function legacyFail(msg: string): void {
  process.stdout.write(chalk.red("  âŒ ") + msg + "\n");
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand || subcommand === "install") {
    const targets = getConfigPaths(PLATFORM);
    const autoFlag = args.includes("--auto");
    const listFlag = args.includes("--list");
    const ideFlag = args.find((a) => a.startsWith("--ide="))?.split("=")[1] ?? null;

    // â”€â”€ --list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (listFlag) {
      printBanner();
      printStatusTable(targets);
      return;
    }

    // â”€â”€ --ide=<id> â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (ideFlag) {
      printBanner();
      const target = targets.find((t) => t.id === ideFlag);
      if (!target) {
        console.error(chalk.red(`  âŒ Unknown IDE: "${ideFlag}". Supported: ${targets.map((t) => t.id).join(", ")}`));
        process.exit(1);
      }
      const result = installTarget(target);
      if (result.success) {
        legacyOk(result.message);
        if (target.notes) console.log(chalk.dim(`     â†’ ${target.notes}`));
      } else {
        legacyFail(result.message);
      }
      if (target.oneClickUrl) console.log(chalk.yellow(`     One-click install: ${target.oneClickUrl}`));
      return;
    }

    // â”€â”€ --auto â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (autoFlag) {
      printBanner();
      const spinner = ora({
        text: chalk.dim("Scanning system for installed IDEsâ€¦"),
        color: "cyan",
      }).start();

      await new Promise((r) => setTimeout(r, 600));
      const detected = detectInstalledIdes(targets);
      spinner.stop();

      if (detected.length === 0) {
        console.log(chalk.yellow("  No IDEs auto-detected. Run without --auto for guided install."));
        return;
      }

      console.log(chalk.bold(`  Found: ${detected.map((t) => t.name).join(", ")}\n`));

      for (const target of detected) {
        const existing = alreadyInstalled(target);
        if (existing) {
          console.log(chalk.green(`  â­  ${target.name}`) + chalk.dim(` â€” already installed at ${existing}`));
          continue;
        }

        const s = ora({ text: chalk.dim(`Installing for ${target.name}â€¦`), color: "cyan" }).start();
        await new Promise((r) => setTimeout(r, 400));
        const result = installTarget(target);
        if (result.success) {
          s.succeed(chalk.green(`${target.name}`) + chalk.dim(` â†’ ${result.path}`));
          if (target.notes) console.log(chalk.dim(`       â†’ ${target.notes}`));
        } else {
          s.fail(chalk.red(`${target.name}: ${result.message}`));
        }
      }

      const successes = detected.filter((t) => installTarget(t).success).length;
      console.log(chalk.bold.green(`\n  Done. ${successes} installation(s) completed.`));
      return;
    }

    // â”€â”€ Interactive guided mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    printBanner();

    // â”€â”€ TTY guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // If stdin/stdout are not a real TTY (CI, IDE task runner without PTY,
    // piped output), fall back to --auto instead of crashing.
    if (!hasTty()) {
      console.log(
        chalk.yellow("  âš   No interactive terminal detected.") +
        chalk.dim(" Falling back to --auto mode.\n")
      );
      console.log(
        chalk.dim(
          "  Tip: to get the full arrow-key UI, run this in an integrated terminal\n" +
          "  (VS Code Â· Cursor Â· Android Studio Â· IntelliJ Â· Windows Terminal).\n" +
          "  Or run:  " + chalk.white("npx androjack-mcp@1.6.0 install --auto") + chalk.dim("  to skip the menu.\n")
        )
      );

      const detected = detectInstalledIdes(targets);
      if (detected.length === 0) {
        console.log(chalk.yellow("  No IDEs detected. Exiting."));
        return;
      }
      console.log(chalk.bold(`  Auto-installing to: ${detected.map((t) => t.name).join(", ")}\n`));
      for (const target of detected) {
        const alreadyAt = alreadyInstalled(target);
        if (alreadyAt) {
          console.log(chalk.green(`  â­  ${target.name}`) + chalk.dim(` â€” already installed`));
          continue;
        }
        const s = ora({ text: chalk.dim(`Writing config for ${target.name}â€¦`), color: "cyan" }).start();
        await new Promise((r) => setTimeout(r, 350));
        const result = installTarget(target);
        if (result.success) {
          s.succeed(chalk.green(`${target.name}`) + chalk.dim(` â†’ ${result.path}`));
          if (target.notes) console.log(chalk.dim(`       â†’ ${target.notes}`));
        } else {
          s.fail(chalk.red(`${target.name}: ${result.message}`));
        }
      }
      console.log(chalk.bold.green("\n  Done."));
      return;
    }

    // Scan spinner
    const scanSpinner = ora({
      text: chalk.dim("Scanning system for installed IDEsâ€¦"),
      color: "cyan",
    }).start();
    await new Promise((r) => setTimeout(r, 700));
    scanSpinner.succeed(chalk.dim("System scan complete."));
    console.log();

    // Status table
    printStatusTable(targets);

    clack.intro(chalk.bold.hex("#00D4FF")("  AndroJack MCP  ") + chalk.dim("Installer"));

    // â”€â”€ Mode select â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const mode = await clack.select<string>({
      message: "Select installation mode:",
      options: [
        {
          value: "auto",
          label: "Auto-install to all detected IDEs",
          hint: "Recommended",
        },
        {
          value: "pick",
          label: "Pick specific IDEs",
          hint: "Choose from a list",
        },
        {
          value: "snippet",
          label: "Show manual config snippet",
          hint: "Copy & paste JSON",
        },
        {
          value: "quit",
          label: "Quit",
        },
      ],
    });

    if (clack.isCancel(mode) || mode === "quit") {
      clack.outro(chalk.dim("Installer exited. Run again anytime."));
      return;
    }

    // â”€â”€ Auto mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (mode === "auto") {
      const detected = detectInstalledIdes(targets);

      if (detected.length === 0) {
        clack.log.warn("No IDEs detected on this system. Use 'Pick specific IDEs' to install manually.");
        clack.outro(chalk.dim("No changes made."));
        return;
      }

      clack.log.info(
        `Detected: ${detected.map((t) => chalk.cyan(t.name)).join(", ")}`
      );

      // Y/N confirm
      const confirmed = await clack.confirm({
        message: `Install AndroJack MCP to ${chalk.bold(String(detected.length))} IDE(s)?`,
        initialValue: true,
      });

      if (clack.isCancel(confirmed) || !confirmed) {
        clack.outro(chalk.dim("Installation cancelled."));
        return;
      }

      const results: InstallResult[] = [];

      for (const target of detected) {
        const alreadyAt = alreadyInstalled(target);
        if (alreadyAt) {
          // Y/N: overwrite already-installed?
          const overwrite = await clack.confirm({
            message: `${chalk.yellow(target.name)} is already installed. Overwrite?`,
            initialValue: false,
          });
          if (clack.isCancel(overwrite) || !overwrite) {
            clack.log.info(`Skipped ${target.name}`);
            continue;
          }
        }

        const s = ora({ text: chalk.dim(`Writing config for ${target.name}â€¦`), color: "cyan" }).start();
        await new Promise((r) => setTimeout(r, 350));
        const result = installTarget(target);
        results.push(result);

        if (result.success) {
          s.succeed(chalk.green(`${target.name}`) + chalk.dim(` â†’ ${result.path}`));
          if (target.notes) clack.log.info(chalk.dim(target.notes));
        } else {
          s.fail(chalk.red(`${target.name}: ${result.message}`));
        }
      }

      const ok = results.filter((r) => r.success).length;
      const fail = results.filter((r) => !r.success).length;
      clack.outro(
        chalk.bold.green(`âœ“ ${ok} installed`) +
        (fail > 0 ? chalk.red(`  âœ— ${fail} failed`) : "") +
        chalk.dim("  Run  npx androjack-mcp@1.6.0 install --list  to verify.")
      );
      return;
    }

    // â”€â”€ Pick specific IDEs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (mode === "pick") {
      const chosen = await clack.multiselect<string>({
        message: "Select IDEs to install (Space to toggle, Enter to confirm):",
        options: targets.map((t) => {
          const installed = alreadyInstalled(t);
          const detected = detectInstalledIdes([t]).length > 0;
          return {
            value: t.id,
            label: t.name,
            hint: installed
              ? chalk.green("already installed")
              : detected
                ? chalk.cyan("detected")
                : chalk.dim("not found"),
          };
        }),
        required: true,
      });

      if (clack.isCancel(chosen)) {
        clack.outro(chalk.dim("Installation cancelled."));
        return;
      }

      const selected = targets.filter((t) => (chosen as string[]).includes(t.id));

      // Y/N confirm
      const confirmed = await clack.confirm({
        message: `Install AndroJack MCP to ${chalk.bold(String(selected.length))} IDE(s)?`,
        initialValue: true,
      });

      if (clack.isCancel(confirmed) || !confirmed) {
        clack.outro(chalk.dim("Installation cancelled."));
        return;
      }

      const results: InstallResult[] = [];

      for (const target of selected) {
        const alreadyAt = alreadyInstalled(target);
        if (alreadyAt) {
          const overwrite = await clack.confirm({
            message: `${chalk.yellow(target.name)} is already installed. Overwrite?`,
            initialValue: false,
          });
          if (clack.isCancel(overwrite) || !overwrite) {
            clack.log.info(`Skipped ${target.name}`);
            continue;
          }
        }

        const s = ora({ text: chalk.dim(`Writing config for ${target.name}â€¦`), color: "cyan" }).start();
        await new Promise((r) => setTimeout(r, 350));
        const result = installTarget(target);
        results.push(result);

        if (result.success) {
          s.succeed(chalk.green(`${target.name}`) + chalk.dim(` â†’ ${result.path}`));
          if (target.notes) clack.log.info(chalk.dim(target.notes));
          if (target.oneClickUrl) clack.log.info(chalk.yellow(`One-click: ${target.oneClickUrl}`));
        } else {
          s.fail(chalk.red(`${target.name}: ${result.message}`));
        }
      }

      const ok = results.filter((r) => r.success).length;
      const fail = results.filter((r) => !r.success).length;
      clack.outro(
        chalk.bold.green(`âœ“ ${ok} installed`) +
        (fail > 0 ? chalk.red(`  âœ— ${fail} failed`) : "") +
        chalk.dim("  Run  npx androjack-mcp@1.6.0 install --list  to verify.")
      );
      return;
    }

    // â”€â”€ Manual snippet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (mode === "snippet") {
      const snippet = {
        mcpServers: { androjack: SERVER_CONFIG_STANDARD },
      };
      const vsSnippet = {
        servers: { androjack: SERVER_CONFIG_VSCODE },
      };

      clack.note(
        chalk.bold("Standard MCP config (Claude, Cursor, Windsurf, Kiro, JetBrains, Antigravity):\n") +
        chalk.cyan(JSON.stringify(snippet, null, 2)) +
        chalk.bold("\n\nVS Code .vscode/mcp.json:\n") +
        chalk.cyan(JSON.stringify(vsSnippet, null, 2)),
        "Manual Config Snippets"
      );

      clack.outro(chalk.dim("Paste the snippet into your IDE's MCP config file and restart the IDE."));
      return;
    }
  }
}

main().catch((err) => {
  console.error(chalk.red.bold("  Installer error:"), err);
  process.exit(1);
});
