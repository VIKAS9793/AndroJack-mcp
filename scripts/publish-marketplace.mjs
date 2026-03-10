import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const vsixPath = path.resolve(process.cwd(), `${pkg.name}-${pkg.version}.vsix`);

if (!fs.existsSync(vsixPath)) {
  console.error(`Publish aborted: expected VSIX not found at ${vsixPath}`);
  process.exit(1);
}

const result = spawnSync("npx", ["@vscode/vsce", "publish", "--packagePath", vsixPath], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
