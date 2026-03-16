import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const serverFactory = readFileSync(path.join(ROOT, "src", "server-factory.ts"), "utf8");
const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");
const manifest = JSON.parse(readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

const registerToolCount = (serverFactory.match(/server\.registerTool\(/g) ?? []).length;
const annotationCount = (serverFactory.match(/annotations:\s*TOOL_ANNOTATIONS/g) ?? []).length;

assert(registerToolCount === 21, `Expected 21 tool registrations, found ${registerToolCount}.`);
assert(annotationCount === 21, `Expected 21 TOOL_ANNOTATIONS usages, found ${annotationCount}.`);
assert(serverFactory.includes("readOnlyHint: true"), "TOOL_ANNOTATIONS must include readOnlyHint: true.");
assert(serverFactory.includes("destructiveHint: false"), "TOOL_ANNOTATIONS must include destructiveHint: false.");

const canonicalTitles = [
  "Search Android Docs",
  "Check Component Status",
  "Android Architecture Reference",
  "Check Gradle Dependencies",
  "Android API Level Check",
  "Kotlin Best Practices",
  "Android Issue Tracker Search",
  "Validate Android Code",
  "Material 3 Expressive Guide",
  "Navigation 3 Guide",
  "Android Testing Guide",
  "Android 16 API Compliance",
  "Android Permissions Advisor",
  "Play Store Policy Advisor",
  "Large Screen & Foldable Guide",
  "Kotlin Multiplatform Guide",
  "On-Device AI Guide",
  "Android Scalability Guide",
  "Build & Publish Guide",
  "Android XR Guide",
  "Wear OS Guide",
];

for (const title of canonicalTitles) {
  assert(serverFactory.includes(`title: "${title}"`), `Missing canonical tool title: ${title}`);
}

const forbiddenPhrases = [
  "REQUIRED FIRST STEP",
  "ALWAYS call",
  "must call this first",
  "Hard gate",
  "mandatory validation loop",
  "mandatory, automatic grounding",
];

for (const phrase of forbiddenPhrases) {
  assert(!serverFactory.includes(phrase), `Connector tool metadata still includes coercive phrase: ${phrase}`);
  assert(!readme.includes(phrase), `README still includes reviewer-risk phrase: ${phrase}`);
}

const requiredHeadingPatterns = [
  /^##\s+What AndroJack Is Not$/m,
  /^##\s+.*Examples$/m,
  /^##\s+.*Privacy Policy$/m,
  /^##\s+.*Infrastructure & Rate Limiting$/m,
  /^##\s+.*FAQ$/m,
  /^##\s+.*Troubleshooting$/m,
];

for (const pattern of requiredHeadingPatterns) {
  assert(pattern.test(readme), `README is missing required section matching ${pattern}.`);
}

assert(!readme.includes("20 tools"), 'README still contains stale "20 tools" wording.');
assert(readme.includes("https://androjack-web.netlify.app/privacy"), "README must reference the canonical privacy policy URL.");

assert(manifest.manifest_version === "0.3", 'manifest.json must set "manifest_version" to "0.3".');
assert(typeof manifest.name === "string" && manifest.name.length > 0, "manifest.json must include name.");
assert(typeof manifest.display_name === "string" && manifest.display_name.length > 0, "manifest.json must include display_name.");
assert(manifest.version === "1.6.1", 'manifest.json must include version "1.6.1".');
assert(typeof manifest.description === "string" && manifest.description.length > 0, "manifest.json must include description.");
assert(Array.isArray(manifest.privacy_policies) && manifest.privacy_policies.length > 0, "manifest.json must include privacy_policies.");
assert(typeof manifest.icon === "string" && manifest.icon.length > 0, "manifest.json must include icon.");
assert(typeof manifest.support === "string" && manifest.support.length > 0, "manifest.json must include support URL.");
assert(manifest.server?.type === "node", 'manifest.json server.type must be "node".');
assert(typeof manifest.server?.entry_point === "string" && manifest.server.entry_point.length > 0, "manifest.json must include server.entry_point.");
assert(typeof manifest.server?.mcp_config?.command === "string" && manifest.server.mcp_config.command.length > 0, "manifest.json must include server.mcp_config.command.");
assert(Array.isArray(manifest.compatibility?.platforms) && manifest.compatibility.platforms.length > 0, "manifest.json must include compatibility.platforms.");
assert(typeof manifest.compatibility?.runtimes?.node === "string" && manifest.compatibility.runtimes.node.length > 0, "manifest.json must include compatibility.runtimes.node.");
assert(manifest.tools_generated === true, "manifest.json must include tools_generated: true.");
assert(manifest.prompts_generated === true, "manifest.json must include prompts_generated: true.");

assert(existsSync(path.join(ROOT, "assets", "icon.png")), "assets/icon.png must exist.");

if (failures.length > 0) {
  process.stderr.write("Connector readiness audit failed:\n");
  for (const failure of failures) {
    process.stderr.write(`- ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write("CONNECTOR_READINESS_PASS\n");
