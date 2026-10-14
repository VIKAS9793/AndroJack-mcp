/**
 * AndroJack MCP – `androjack-mcp validate` (CI / pre-commit gate)
 *
 * Runs the same rule engine as the android_code_validator MCP tool against
 * files on disk, so the rules an agent was held to inside the IDE are also
 * enforced on the pull request — including code no agent touched.
 *
 * Why this matters (v2.1): Google's first-party agent stack (Android skills,
 * Android CLI, Developer Knowledge MCP) is advisory — it shapes what an
 * agent generates. Nothing in it fails a build. This command is the
 * enforcement half: deterministic rule IDs, exit codes, and SARIF output that
 * GitHub code scanning renders inline on the PR.
 *
 * Usage:
 *   npx androjack-mcp validate app/src            # text report, exit 1 on errors
 *   npx androjack-mcp validate . --format=sarif > androjack.sarif
 *   npx androjack-mcp validate . --target-sdk=37 --fail-on=warning
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { ANDROID_RULES, type Language, type Severity } from "./rules/android-rules.js";
import { validateAndroidCode, type ValidationReport } from "./tools/validator.js";
import { ANDROJACK_VERSION } from "./version.js";

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_FILES = 20_000;
const SKIP_DIRS = new Set([".git", ".gradle", ".idea", "build", "node_modules", ".kotlin", ".cxx", "out"]);

export type OutputFormat = "text" | "json" | "sarif";
export type FailOn = "error" | "warning" | "never";

export interface ValidateOptions {
  paths: string[];
  format: OutputFormat;
  failOn: FailOn;
  minSdk?: number;
  targetSdk?: number;
}

export interface FileReport {
  file: string;
  report: ValidationReport;
}

export function languageForFile(file: string): Language | null {
  const base = path.basename(file).toLowerCase();
  if (base.endsWith(".gradle.kts") || base.endsWith(".gradle")) return "gradle";
  if (base.endsWith(".kt") || base.endsWith(".kts")) return "kotlin";
  if (base.endsWith(".xml")) return "xml";
  return null;
}

function parseSdk(flag: string, raw: string | undefined): number {
  const value = Number(raw);
  if (!raw || !Number.isInteger(value) || value < 1 || value > 99) {
    throw new UsageError(`${flag} expects an integer API level, got "${raw ?? ""}".`);
  }
  return value;
}

export class UsageError extends Error {}

export function parseValidateArgs(args: string[]): ValidateOptions {
  const opts: ValidateOptions = { paths: [], format: "text", failOn: "error" };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    const [flag, inline] = arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
    const value = () => inline ?? args[++i];

    switch (flag) {
      case "--format": {
        const v = value();
        if (v !== "text" && v !== "json" && v !== "sarif") throw new UsageError(`--format must be text, json, or sarif (got "${v ?? ""}").`);
        opts.format = v;
        break;
      }
      case "--fail-on": {
        const v = value();
        if (v !== "error" && v !== "warning" && v !== "never") throw new UsageError(`--fail-on must be error, warning, or never (got "${v ?? ""}").`);
        opts.failOn = v;
        break;
      }
      case "--min-sdk":
        opts.minSdk = parseSdk("--min-sdk", value());
        break;
      case "--target-sdk":
        opts.targetSdk = parseSdk("--target-sdk", value());
        break;
      default:
        if (arg.startsWith("--")) throw new UsageError(`Unknown validate option "${arg}".`);
        opts.paths.push(arg);
    }
  }

  if (opts.paths.length === 0) opts.paths.push(".");
  return opts;
}

async function collectFiles(target: string, out: string[]): Promise<void> {
  if (out.length >= MAX_FILES) return;
  const stat = await fs.lstat(target);
  if (stat.isSymbolicLink()) return; // never follow links out of the tree
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return;
    const entries = await fs.readdir(target);
    entries.sort();
    for (const entry of entries) await collectFiles(path.join(target, entry), out);
    return;
  }
  if (stat.isFile() && languageForFile(target) && stat.size <= MAX_FILE_BYTES) out.push(target);
}

export async function validatePaths(opts: ValidateOptions, cwd = process.cwd()): Promise<FileReport[]> {
  const files: string[] = [];
  for (const p of opts.paths) {
    const abs = path.resolve(cwd, p);
    try {
      await collectFiles(abs, files);
    } catch (err) {
      throw new UsageError(`Cannot read "${p}": ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const reports: FileReport[] = [];
  for (const file of files) {
    const code = await fs.readFile(file, "utf8");
    const report = validateAndroidCode(code, languageForFile(file) ?? undefined, opts.minSdk, opts.targetSdk);
    reports.push({ file: path.relative(cwd, file).split(path.sep).join("/") || path.basename(file), report });
  }
  return reports;
}

export function totals(reports: FileReport[]): Record<Severity, number> {
  return reports.reduce(
    (acc, r) => {
      acc.error += r.report.counts.error;
      acc.warning += r.report.counts.warning;
      acc.info += r.report.counts.info;
      return acc;
    },
    { error: 0, warning: 0, info: 0 } as Record<Severity, number>
  );
}

export function exitCodeFor(reports: FileReport[], failOn: FailOn): number {
  const t = totals(reports);
  if (failOn === "never") return 0;
  if (t.error > 0) return 1;
  if (failOn === "warning" && t.warning > 0) return 1;
  return 0;
}

export function renderText(reports: FileReport[]): string {
  const lines: string[] = [];
  for (const { file, report } of reports) {
    for (const v of report.violations) {
      lines.push(`${file}:${v.line}:${v.column}: ${v.severity} ${v.ruleId}: ${v.message}`);
      lines.push(`    fix: ${v.replacement}`);
      lines.push(`    see: ${v.docUrl}`);
    }
  }
  const t = totals(reports);
  lines.push(
    `AndroJack ${ANDROJACK_VERSION}: ${reports.length} file(s) checked against ${ANDROID_RULES.length} rules — ` +
    `${t.error} error(s), ${t.warning} warning(s), ${t.info} info.`
  );
  return lines.join("\n") + "\n";
}

export function renderJson(reports: FileReport[]): string {
  return JSON.stringify({
    tool: "androjack-mcp",
    version: ANDROJACK_VERSION,
    rules: ANDROID_RULES.length,
    totals: totals(reports),
    files: reports.map(({ file, report }) => ({ file, ...report })),
  }, null, 2) + "\n";
}

const SARIF_LEVEL: Record<Severity, "error" | "warning" | "note"> = {
  error: "error",
  warning: "warning",
  info: "note",
};

/** SARIF 2.1.0 — accepted by GitHub code scanning (upload-sarif). */
export function renderSarif(reports: FileReport[]): string {
  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [{
      tool: {
        driver: {
          name: "AndroJack",
          version: ANDROJACK_VERSION,
          informationUri: "https://github.com/VIKAS9793/androjack-mcp",
          rules: ANDROID_RULES.map((r) => ({
            id: r.id,
            shortDescription: { text: r.message },
            fullDescription: { text: `${r.message} Fix: ${r.replacement}` },
            helpUri: r.docUrl,
            help: { text: r.replacement },
            defaultConfiguration: { level: SARIF_LEVEL[r.severity] },
          })),
        },
      },
      results: reports.flatMap(({ file, report }) =>
        report.violations.map((v) => ({
          ruleId: v.ruleId,
          level: SARIF_LEVEL[v.severity],
          message: { text: `${v.message} Fix: ${v.replacement}` },
          locations: [{
            physicalLocation: {
              artifactLocation: { uri: file },
              region: { startLine: v.line, startColumn: v.column },
            },
          }],
        }))
      ),
    }],
  };
  return JSON.stringify(sarif, null, 2) + "\n";
}

export async function main(args: string[]): Promise<void> {
  let opts: ValidateOptions;
  try {
    opts = parseValidateArgs(args);
  } catch (err) {
    process.stderr.write(`androjack validate: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 2;
    return;
  }

  let reports: FileReport[];
  try {
    reports = await validatePaths(opts);
  } catch (err) {
    process.stderr.write(`androjack validate: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 2;
    return;
  }

  const render = opts.format === "sarif" ? renderSarif : opts.format === "json" ? renderJson : renderText;
  process.stdout.write(render(reports));
  process.exitCode = exitCodeFor(reports, opts.failOn);
}
