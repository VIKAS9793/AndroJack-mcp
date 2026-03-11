import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUILD_ROOT = path.join(ROOT, ".connector-build");
const STAGING_DIR = path.join(BUILD_ROOT, "staging");
const DEFAULT_BUNDLE_PATH = path.join(BUILD_ROOT, "AndroJack-mcp-connector-2026-03.mcpb");

function log(message) {
  process.stdout.write(`${message}\n`);
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function resolveRequiredPath(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!existsSync(fullPath)) {
    fail(`Missing required file or directory: ${relativePath}`);
  }
  return fullPath;
}

function resolveMcpbBinary() {
  const candidates = [
    path.join(ROOT, "node_modules", ".bin", process.platform === "win32" ? "mcpb.cmd" : "mcpb"),
    process.platform === "win32" && process.env.APPDATA
      ? path.join(process.env.APPDATA, "npm", "mcpb.cmd")
      : null,
    process.env.HOME ? path.join(process.env.HOME, ".npm-global", "bin", "mcpb") : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) {
      return candidate;
    }
  }

  return "mcpb";
}

function resolveNpmBinary() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function run(command, args, cwd = ROOT) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(command),
  });

  if (result.error) {
    fail(`Failed to run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} exited with status ${result.status}`);
  }
}

function cleanStage() {
  rmSync(BUILD_ROOT, { recursive: true, force: true });
  mkdirSync(STAGING_DIR, { recursive: true });
}

function copyToStage(relativePath) {
  const source = resolveRequiredPath(relativePath);
  const destination = path.join(STAGING_DIR, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });

  if (statSync(source).isDirectory()) {
    cpSync(source, destination, { recursive: true });
  } else {
    copyFileSync(source, destination);
  }
}

function stageConnectorBundle() {
  cleanStage();

  [
    "manifest.json",
    "package.json",
    "package-lock.json",
    "LICENSE",
    "assets/icon.png",
    "build",
  ].forEach(copyToStage);
}

function installProductionDependencies() {
  run(resolveNpmBinary(), ["ci", "--omit=dev", "--ignore-scripts"], STAGING_DIR);

  const stagedLockfile = path.join(STAGING_DIR, "package-lock.json");
  if (existsSync(stagedLockfile)) {
    unlinkSync(stagedLockfile);
  }
}

function validateStagedManifest() {
  run(resolveMcpbBinary(), ["validate", "manifest.json"], STAGING_DIR);
}

function packStagedBundle(bundlePath = DEFAULT_BUNDLE_PATH) {
  run(resolveMcpbBinary(), ["pack", STAGING_DIR, bundlePath], ROOT);
}

function inspectBundle(bundlePath = DEFAULT_BUNDLE_PATH) {
  if (!existsSync(bundlePath)) {
    fail(`Bundle not found: ${bundlePath}`);
  }
  run(resolveMcpbBinary(), ["info", bundlePath], ROOT);
}

function summarizeStage() {
  const entries = readdirSync(STAGING_DIR);
  log(`Staged connector bundle at ${STAGING_DIR}`);
  log(`Top-level staged entries: ${entries.join(", ")}`);
}

function main() {
  const command = process.argv[2] ?? "validate";
  const bundleArg = process.argv[3] ? path.resolve(ROOT, process.argv[3]) : DEFAULT_BUNDLE_PATH;

  if (command === "stage") {
    stageConnectorBundle();
    installProductionDependencies();
    summarizeStage();
    return;
  }

  if (command === "validate") {
    stageConnectorBundle();
    installProductionDependencies();
    validateStagedManifest();
    summarizeStage();
    return;
  }

  if (command === "pack") {
    stageConnectorBundle();
    installProductionDependencies();
    validateStagedManifest();
    packStagedBundle(bundleArg);
    inspectBundle(bundleArg);
    return;
  }

  if (command === "info") {
    inspectBundle(bundleArg);
    return;
  }

  fail(`Unknown command "${command}". Use stage, validate, pack, or info.`);
}

main();
