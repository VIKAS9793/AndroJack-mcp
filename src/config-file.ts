/**
 * AndroJack MCP — safe IDE config file handling for the installer.
 *
 * IDE MCP config files are user-owned and often hand-edited: VS Code and
 * Cursor accept JSONC (comments, trailing commas), files may be symlinks into
 * a dotfiles repo, and they may hold other servers' credentials. The installer
 * must never lose any of that.
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Removes // and /* *\/ comments and trailing commas outside of strings, then
 * parses. Throws if the result is not valid JSON.
 */
export function parseJsonc(text: string): unknown {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i]!;
    if (c === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < n && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    out += c;
    i++;
  }
  const withoutTrailingCommas = out.replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(withoutTrailingCommas.trim() === "" ? "{}" : withoutTrailingCommas);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Writes a file atomically (temp file + rename in the same directory),
 * preserving the existing file's permissions, and writing through a symlink
 * to its target instead of replacing the link.
 */
export function writeFileAtomic(filePath: string, contents: string): string {
  const target = fs.existsSync(filePath) ? fs.realpathSync(filePath) : filePath;
  const dir = path.dirname(target);
  const mode = fs.existsSync(target) ? fs.statSync(target).mode & 0o777 : 0o600;
  const tmp = path.join(dir, `.${path.basename(target)}.androjack-${process.pid}-${Date.now()}.tmp`);
  try {
    fs.writeFileSync(tmp, contents, { encoding: "utf-8", mode });
    fs.renameSync(tmp, target);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
  return target;
}
