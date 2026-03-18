import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");
const cliPath = path.join(repoRoot, "build", "index.js");
const installEntryPath = path.join(repoRoot, "build", "install.js");
const pkg = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8"));

function runNode(scriptPath, args, options = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 5000,
    env: { ...process.env, ...options.env },
    ...options,
  });
}

function runCli(args, options) {
  return runNode(cliPath, args, options);
}

test("prints help for --help", () => {
  const result = runCli(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /npx androjack-mcp install/);
  assert.equal(result.stderr, "");
});

test("prints the package version for --version", () => {
  const result = runCli(["--version"]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), pkg.version);
  assert.equal(result.stderr, "");
});

test("routes install --list without starting stdio", () => {
  const result = runCli(["install", "--list"]);
  assert.equal(result.status, 0);
  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  assert.doesNotMatch(combinedOutput, /server running on stdio/i);
  assert.match(combinedOutput, /Claude Desktop|Cursor|Windsurf/);
});

test("rejects unknown commands instead of falling through to stdio", () => {
  const result = runCli(["--helpo"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command or flag/);
  assert.match(result.stderr, /Usage:/);
});

test("install --auto stays idle in a clean environment", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "androjack-install-"));
  const homeDir = path.join(tempRoot, "home");
  const projectDir = path.join(tempRoot, "project");
  const appDataDir = path.join(homeDir, "AppData", "Roaming");
  const localAppDataDir = path.join(homeDir, "AppData", "Local");

  mkdirSync(projectDir, { recursive: true });
  mkdirSync(appDataDir, { recursive: true });
  mkdirSync(localAppDataDir, { recursive: true });

  try {
    const result = runCli(["install", "--auto"], {
      cwd: projectDir,
      timeout: 10000,
      env: {
        HOME: homeDir,
        USERPROFILE: homeDir,
        APPDATA: appDataDir,
        LOCALAPPDATA: localAppDataDir,
      },
    });

    assert.equal(result.status, 0);
    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    assert.match(combinedOutput, /No IDEs auto-detected/);
    assert.equal(existsSync(path.join(projectDir, ".cursor", "mcp.json")), false);
    assert.equal(existsSync(path.join(projectDir, ".vscode", "mcp.json")), false);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("install --ide=cursor writes the workspace config instead of starting stdio", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "androjack-ide-"));
  const homeDir = path.join(tempRoot, "home");
  const projectDir = path.join(tempRoot, "project");
  const appDataDir = path.join(homeDir, "AppData", "Roaming");
  const localAppDataDir = path.join(homeDir, "AppData", "Local");
  const configPath = path.join(projectDir, ".cursor", "mcp.json");

  mkdirSync(projectDir, { recursive: true });
  mkdirSync(appDataDir, { recursive: true });
  mkdirSync(localAppDataDir, { recursive: true });

  try {
    const result = runCli(["install", "--ide=cursor"], {
      cwd: projectDir,
      timeout: 10000,
      env: {
        HOME: homeDir,
        USERPROFILE: homeDir,
        APPDATA: appDataDir,
        LOCALAPPDATA: localAppDataDir,
      },
    });

    assert.equal(result.status, 0);
    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    assert.doesNotMatch(combinedOutput, /server running on stdio/i);
    assert.equal(existsSync(configPath), true);
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    assert.deepEqual(config.mcpServers.androjack.args, ["-y", `${pkg.name}@${pkg.version}`]);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("serve rejects remote binding without --allow-remote", () => {
  const result = runCli(["serve", "--host", "0.0.0.0"]);
  assert.equal(result.status, 1);
  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  assert.match(combinedOutput, /--allow-remote/);
  assert.doesNotMatch(combinedOutput, /gradient-string|ERR_MODULE_NOT_FOUND/);
});

test("direct installer entry still works", () => {
  const result = runNode(installEntryPath, ["--list"]);
  assert.equal(result.status, 0);
  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  assert.match(combinedOutput, /Cursor|Claude Desktop|Windsurf/);
});
