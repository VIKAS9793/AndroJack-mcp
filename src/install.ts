#!/usr/bin/env node
/**
 * AndroJack MCP – Smart Installer
 *
 * Detects OS, installed IDEs, and config file locations automatically.
 * Supports both automated (--auto) and guided interactive installation.
 *
 * Usage:
 *   npx androjack-mcp install           → interactive guided mode
 *   npx androjack-mcp install --auto    → auto-detect and install to all found IDEs
 *   npx androjack-mcp install --ide cursor   → target a specific IDE
 *   npx androjack-mcp install --list    → list all supported IDEs and their status
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

// ── Types ───────────────────────────────────────────────────────────────────

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

// ── AndroJack server config block (reused for all IDEs) ───────────────────

const SERVER_CONFIG_STANDARD = {
  command: "npx",
  args: ["-y", "androjack-mcp"],
  env: {},
  autoApprove: [],
  disabled: false,
};

const SERVER_CONFIG_VSCODE = {
  type: "stdio",
  command: "npx",
  args: ["-y", "androjack-mcp"],
};

// ── IDE Definitions ─────────────────────────────────────────────────────────

const HOME = os.homedir();
const PLATFORM = process.platform; // darwin | linux | win32

function getConfigPaths(platform: string): IdeTarget[] {
  const appdata = process.env.APPDATA ?? path.join(HOME, "AppData", "Roaming");
  const localappdata = process.env.LOCALAPPDATA ?? path.join(HOME, "AppData", "Local");

  return [
    // ── Claude Desktop ──────────────────────────────────────────────────────
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
      notes: "Restart Claude Desktop after install. Look for 🔨 in chat input.",
    },

    // ── Cursor IDE ──────────────────────────────────────────────────────────
    {
      id: "cursor",
      name: "Cursor",
      configPaths: [
        path.join(process.cwd(), ".cursor", "mcp.json"),     // project-level (preferred)
        path.join(HOME, ".cursor", "mcp.json"),              // global
      ],
      configKey: "mcpServers",
      format: "standard",
      notes: "Check Settings → MCP for green dot confirmation.",
    },

    // ── Windsurf (Codeium) ──────────────────────────────────────────────────
    {
      id: "windsurf",
      name: "Windsurf",
      configPaths: [
        path.join(HOME, ".codeium", "windsurf", "mcp_config.json"),
        path.join(HOME, ".windsurf", "mcp_config.json"),
      ],
      configKey: "mcpServers",
      format: "standard",
      notes: "Restart Windsurf → Cascade panel shows AndroJack tools.",
    },

    // ── VS Code (GitHub Copilot) ─────────────────────────────────────────────
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
      notes: "VS Code 1.99+ required. Copilot Chat → Agent mode to access tools.",
    },

    // ── AWS Kiro IDE ─────────────────────────────────────────────────────────
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
          JSON.stringify({ command: "npx", args: ["-y", "androjack-mcp"], disabled: false, autoApprove: [] })
        );
        return `https://kiro.dev/launch/mcp/add?name=${name}&config=${config}`;
      })(),
      notes: "Or use the one-click Kiro install link in the README.",
    },

    // ── Google Antigravity IDE (standalone, launched Nov 18 2025 with Gemini 3) ────
    // NOT Firebase Studio / Project IDX — those are separate Google products.
    // Confirmed config path from real usage: ~/.gemini/antigravity/mcp_config.json
    {
      id: "antigravity",
      name: "Google Antigravity IDE",
      configPaths: [
        path.join(HOME, ".gemini", "antigravity", "mcp_config.json"),
      ],
      configKey: "mcpServers",
      format: "standard",
      notes:
        "After saving: Antigravity Agent pane → '...' → MCP Servers → Manage → Refresh.",
    },

    // ── JetBrains (Android Studio / IntelliJ) ────────────────────────────────
    {
      id: "jetbrains",
      name: "JetBrains AI Assistant (Android Studio / IntelliJ)",
      configPaths: [
        // JetBrains stores MCP config inside IDE-version-specific dirs
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
        "Or add manually: Android Studio → Settings → Tools → AI Assistant → MCP Servers → +",
    },
  ];
}

// ── Config helpers ──────────────────────────────────────────────────────────

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

    // Create directory if needed
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
        // Corrupted JSON — back it up and overwrite
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
      message: `✅ Installed to ${configPath}`,
    };
  } catch (err) {
    return {
      ide: target.name,
      success: false,
      message: `❌ Failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ── IDE Detection ────────────────────────────────────────────────────────────

function detectInstalledIdes(targets: IdeTarget[]): IdeTarget[] {
  return targets.filter((target) => {
    // Check if any of the config's parent dirs exist (suggests IDE is installed)
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

// ── Output helpers ────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function banner(): void {
  console.log(`
${BOLD}${CYAN}╔══════════════════════════════════════════════════╗
║  🤖 AndroJack MCP — Smart Installer              ║
║  The Jack of All Android Trades                  ║
╚══════════════════════════════════════════════════╝${RESET}
`);
}

function printStatus(targets: IdeTarget[]): void {
  console.log(`${BOLD}IDE Installation Status:${RESET}\n`);
  for (const t of targets) {
    const installed = alreadyInstalled(t);
    const icon = installed ? `${GREEN}✓${RESET}` : `${DIM}○${RESET}`;
    const status = installed ? `${GREEN}installed${RESET} → ${DIM}${installed}${RESET}` : `${DIM}not installed${RESET}`;
    console.log(`  ${icon}  ${BOLD}${t.name}${RESET}  —  ${status}`);
  }
  console.log();
}

// ── Prompt helper ────────────────────────────────────────────────────────────

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

// ── Install to best path for a target ───────────────────────────────────────

function installTarget(target: IdeTarget): InstallResult {
  // For project-level configs, use first path. For global, prefer existing or first.
  const existingPath = target.configPaths.find((p) => fs.existsSync(p));
  const chosenPath = existingPath ?? target.configPaths[0];
  return installToPath(chosenPath, target);
}

// ── Main entry point ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand || subcommand === "install") {
    banner();
    const targets = getConfigPaths(PLATFORM);
    const autoFlag = args.includes("--auto");
    const listFlag = args.includes("--list");
    const ideFlag = args.find((a) => a.startsWith("--ide="))?.split("=")[1] ?? null;

    // ── --list ──────────────────────────────────────────────────────────────
    if (listFlag) {
      printStatus(targets);
      return;
    }

    // ── --ide=<id> ──────────────────────────────────────────────────────────
    if (ideFlag) {
      const target = targets.find((t) => t.id === ideFlag);
      if (!target) {
        console.error(`❌ Unknown IDE: "${ideFlag}". Supported: ${targets.map((t) => t.id).join(", ")}`);
        process.exit(1);
      }
      const result = installTarget(target);
      console.log(result.message);
      if (result.success && target.notes) console.log(`   ${DIM}→ ${target.notes}${RESET}`);
      if (target.oneClickUrl) console.log(`   ${YELLOW}One-click install: ${target.oneClickUrl}${RESET}`);
      return;
    }

    // ── --auto ──────────────────────────────────────────────────────────────
    if (autoFlag) {
      console.log(`${BOLD}Auto-detecting installed IDEs on ${PLATFORM}...${RESET}\n`);
      const detected = detectInstalledIdes(targets);

      if (detected.length === 0) {
        console.log(`${YELLOW}No IDEs auto-detected. Run without --auto for guided install.${RESET}`);
        return;
      }

      console.log(`Found: ${detected.map((t) => t.name).join(", ")}\n`);
      const results: InstallResult[] = [];

      for (const target of detected) {
        const existing = alreadyInstalled(target);
        if (existing) {
          console.log(`${GREEN}⏭  ${target.name}${RESET} — already installed at ${DIM}${existing}${RESET}`);
          continue;
        }
        const result = installTarget(target);
        results.push(result);
        console.log(result.message);
        if (result.success && target.notes) console.log(`   ${DIM}→ ${target.notes}${RESET}`);
      }

      const successes = results.filter((r) => r.success).length;
      console.log(`\n${BOLD}${GREEN}Done. ${successes} new installation(s) completed.${RESET}`);
      return;
    }

    // ── Interactive guided mode ─────────────────────────────────────────────
    console.log(`${BOLD}Platform detected:${RESET} ${PLATFORM}\n`);
    printStatus(targets);

    console.log(`${BOLD}Select installation mode:${RESET}`);
    console.log(`  ${CYAN}1${RESET}  Auto-install to all detected IDEs`);
    console.log(`  ${CYAN}2${RESET}  Choose specific IDEs`);
    console.log(`  ${CYAN}3${RESET}  Show manual config snippets`);
    console.log(`  ${CYAN}q${RESET}  Quit\n`);

    const choice = await prompt("Your choice: ");

    if (choice === "1") {
      const detected = detectInstalledIdes(targets);
      for (const target of detected) {
        const result = installTarget(target);
        console.log(result.message);
        if (result.success && target.notes) console.log(`   ${DIM}→ ${target.notes}${RESET}`);
      }
    } else if (choice === "2") {
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        const installed = alreadyInstalled(t);
        const status = installed ? `${GREEN}(already installed)${RESET}` : "";
        console.log(`  ${CYAN}${i + 1}${RESET}  ${t.name} ${status}`);
      }
      const input = await prompt("\nEnter numbers (e.g. 1 3 5) or 'all': ");
      const selected =
        input.trim() === "all"
          ? targets
          : input
              .split(/\s+/)
              .map((n) => targets[parseInt(n, 10) - 1])
              .filter(Boolean);

      for (const target of selected) {
        const result = installTarget(target);
        console.log(result.message);
        if (result.success && target.notes) console.log(`   ${DIM}→ ${target.notes}${RESET}`);
        if (target.oneClickUrl) console.log(`   ${YELLOW}One-click: ${target.oneClickUrl}${RESET}`);
      }
    } else if (choice === "3") {
      const snippet = {
        mcpServers: {
          androjack: SERVER_CONFIG_STANDARD,
        },
      };
      console.log(`\n${BOLD}Paste this into your IDE's MCP config file:${RESET}\n`);
      console.log(JSON.stringify(snippet, null, 2));
      console.log(`\n${DIM}For VS Code .vscode/mcp.json, use the "servers" key instead of "mcpServers".${RESET}`);
    } else {
      console.log("Exiting.");
    }
  }
}

main().catch((err) => {
  console.error("Installer error:", err);
  process.exit(1);
});
