#!/usr/bin/env node
/**
 * AndroJack MCP – HTTP Serve Entry Point
 *
 * Starts the Streamable HTTP server for Android Studio and any
 * httpUrl-based MCP client.
 *
 * Usage:
 *   npx androjack-mcp serve                 # localhost:3000
 *   npx androjack-mcp serve --port 8080     # custom port
 *   npx androjack-mcp serve --host 0.0.0.0  # expose on LAN (add your own auth)
 *
 * Android Studio setup:
 *   File → Settings → Tools → AI → MCP Servers → Enable MCP Servers
 *   Paste the config snippet printed below → OK
 */

import chalk from "chalk";
import gradient from "gradient-string";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ── Tool imports ──────────────────────────────────────────────────────────────
import { androidOfficialSearch }   from "./tools/search.js";
import { androidComponentStatus }  from "./tools/component.js";
import { architectureReference, listArchitectureTopics } from "./tools/architecture.js";
import { androidDebugger }         from "./tools/debugger.js";
import { gradleDependencyChecker } from "./tools/gradle.js";
import { androidApiLevelCheck }    from "./tools/api-level.js";
import { kotlinBestPractices }     from "./tools/kotlin-patterns.js";
import { material3Expressive }     from "./tools/m3-expressive.js";
import { androidPermissionAdvisor }from "./tools/permissions.js";
import { androidTestingGuide }     from "./tools/testing.js";
import { androidBuildAndPublish }  from "./tools/build-publish.js";
import { androidLargeScreenGuide } from "./tools/large-screen.js";
import { androidScalabilityGuide } from "./tools/scalability.js";
import { androidNavigation3Guide } from "./tools/navigation3.js";
import { androidApi36Compliance }  from "./tools/api36-compliance.js";
import { androidKmpGuide }         from "./tools/kmp.js";
import { androidOnDeviceAiGuide }  from "./tools/ondevice-ai.js";
import { androidPlayPolicyAdvisor }from "./tools/play-policy.js";
import { androidXrGuide }          from "./tools/xr.js";
import { androidWearOsGuide }      from "./tools/wear.js";
import { androidCodeValidator }    from "./tools/validator.js";

import { startHttpServer }         from "./http-server.js";
import { docCache }                from "./cache.js"; // Simple LRU export
// ── Parse CLI args ────────────────────────────────────────────────────────────

function parseArgs(): { port: number; host: string; cacheTtlHours: number; noCache: boolean } {
  const args    = process.argv.slice(2);
  let port      = parseInt(process.env["PORT"] ?? "3000", 10);
  let host      = process.env["HOST"] ?? "127.0.0.1";
  let cacheTtl  = 24;
  let noCache   = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--port"      && args[i + 1]) { port     = parseInt(args[++i]!, 10); }
    if (a.startsWith("--port="))            { port     = parseInt(a.split("=")[1]!, 10); }
    if (a === "--host"      && args[i + 1]) { host     = args[++i]!; }
    if (a.startsWith("--host="))            { host     = a.split("=")[1]!; }
    if (a === "--cache-ttl" && args[i + 1]) { cacheTtl = parseInt(args[++i]!, 10); }
    if (a.startsWith("--cache-ttl="))       { cacheTtl = parseInt(a.split("=")[1]!, 10); }
    if (a === "--no-cache")                 { noCache  = true; }
  }

  return { port, host, cacheTtlHours: cacheTtl, noCache };
}

// ── Banner ────────────────────────────────────────────────────────────────────

function printBanner(host: string, port: number, noCache: boolean): void {
  const g = gradient(["#3DDC84", "#7F52FF"]);
  const url = `http://${host}:${port}/mcp`;

  console.error("");
  console.error(g("  ╔══════════════════════════════════════════════════════╗"));
  console.error(g("  ║                                                      ║"));
  console.error(g("  ║    🤖  AndroJack MCP  —  HTTP Server                 ║"));
  console.error(g("  ║    The Jack of All Android Trades                    ║"));
  console.error(g("  ║    20 tools · Documentation-grounded · Read-only     ║"));
  console.error(g("  ║                                                      ║"));
  console.error(g("  ╚══════════════════════════════════════════════════════╝"));
  console.error("");
  console.error(chalk.bold("  Server"));
  console.error(`  ${chalk.dim("Endpoint")}   ${chalk.cyan(url)}`);
  console.error(`  ${chalk.dim("Discovery")}  ${chalk.dim(`http://${host}:${port}/.well-known/mcp`)}`);
  console.error(`  ${chalk.dim("Transport")}  ${chalk.green("Streamable HTTP (MCP 2025-03-26)")}`);
  console.error(`  ${chalk.dim("Cache")}      ${noCache ? chalk.yellow("disabled (--no-cache)") : chalk.green("24h LRU per URL")}`);
  console.error("");
  console.error(chalk.bold("  Android Studio Setup"));
  console.error(`  ${chalk.dim("Path")}  ${chalk.dim("File → Settings → Tools → AI → MCP Servers → Enable MCP Servers")}`);
  console.error("");
  console.error(chalk.bold("  Paste this into your mcp.json:"));
  console.error("");
  console.error(chalk.cyan(JSON.stringify(
    { mcpServers: { androjack: { httpUrl: url, timeout: 30000 } } },
    null, 4
  ).split("\n").map(l => "  " + l).join("\n")));
  console.error("");
  console.error(`  ${chalk.dim("Then type")} ${chalk.bold("/mcp")} ${chalk.dim("in Gemini chat to verify all 20 tools are listed.")}`);
  console.error("");
  console.error(chalk.dim("  Not affiliated with or endorsed by Google LLC or the Android Open Source Project."));
  console.error(chalk.dim("  Documentation sourced under CC-BY 4.0 from developer.android.com."));
  console.error("");
  console.error(chalk.dim("  Press Ctrl+C to stop."));
  console.error("");
}

// ── Server setup ──────────────────────────────────────────────────────────────

function buildServer(): McpServer {
  const server = new McpServer({
    name:    "androjack-mcp",
    version: "1.5.1",
  });

  // Tool 1
  server.registerTool("android_official_search", {
    title: "Android Official Documentation Search",
    description:
      "REQUIRED FIRST STEP. Searches developer.android.com, kotlinlang.org, and source.android.com " +
      "for any Android or Kotlin topic. Returns official excerpts with source URLs. " +
      "You MUST call this before generating any Android/Kotlin code.",
    inputSchema: { query: z.string().min(2).max(200).describe("Search query") },
    annotations: { readOnlyHint: true },
  }, async ({ query }) => ({ content: [{ type: "text", text: await androidOfficialSearch(query) }] }));

  // Tool 2
  server.registerTool("android_component_status", {
    title: "Android Component Status Validator",
    description: "Validates whether an Android/Jetpack component is stable, deprecated, or removed. " +
      "Checks the component registry and official release notes. Prevents use of removed APIs.",
    inputSchema: { component: z.string().min(1).max(100).describe("Component name, e.g. 'AsyncTask', 'NavHost'") },
    annotations: { readOnlyHint: true },
  }, async ({ component }) => ({ content: [{ type: "text", text: await androidComponentStatus(component) }] }));

  // Tool 3
  server.registerTool("android_architecture_reference", {
    title: "Android Architecture Reference",
    description: "Returns official Android architecture guidance for MVVM, MVI, ViewModel, StateFlow, " +
      "Hilt, Repository pattern, and modularization. Grounded in Android Architecture docs.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Architecture topic, e.g. 'mvvm', 'viewmodel', 'hilt'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: topic ? await architectureReference(topic) : await listArchitectureTopics() }] }));

  // Tool 4
  server.registerTool("android_debugger", {
    title: "Android Debug Assistant",
    description: "Diagnoses common Android errors, crashes, and build failures. " +
      "Identifies root causes for NullPointerException in Compose, Gradle sync failures, " +
      "ProGuard obfuscation crashes, and lifecycle-related bugs.",
    inputSchema: { error: z.string().min(5).max(2000).describe("Error message, stack trace, or symptom description") },
    annotations: { readOnlyHint: true },
  }, async ({ error }) => ({ content: [{ type: "text", text: await androidDebugger(error) }] }));

  // Tool 5
  server.registerTool("gradle_dependency_checker", {
    title: "Gradle Dependency Checker",
    description: "Looks up the latest stable version of any Android/Kotlin/Jetpack library from " +
      "Maven Central and Google Maven. Prevents use of outdated or yanked versions. " +
      "Also checks for known dependency conflicts.",
    inputSchema: { library: z.string().min(2).max(200).describe("Library name or group:artifact, e.g. 'compose-bom', 'retrofit'") },
    annotations: { readOnlyHint: true },
  }, async ({ library }) => ({ content: [{ type: "text", text: await gradleDependencyChecker(library) }] }));

  // Tool 6
  server.registerTool("android_api_level_check", {
    title: "Android API Level Checker",
    description: "Returns the minimum API level for any Android API, feature, or permission. " +
      "Prevents calling APIs without version guards. Covers API 16 through API 36 (Android 16).",
    inputSchema: { feature: z.string().min(2).max(200).describe("Feature or API name, e.g. 'WindowInsets', 'BubbleMetadata'") },
    annotations: { readOnlyHint: true },
  }, async ({ feature }) => ({ content: [{ type: "text", text: await androidApiLevelCheck(feature) }] }));

  // Tool 7
  server.registerTool("kotlin_best_practices", {
    title: "Kotlin Best Practices for Android",
    description: "Returns Kotlin idioms, coroutine patterns, and Flow best practices grounded in " +
      "kotlinlang.org and Android Kotlin guides. Covers structured concurrency, sealed classes, " +
      "extension functions, and Kotlin 2.x features.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Kotlin topic, e.g. 'coroutines', 'flow', 'sealed classes'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await kotlinBestPractices(topic ?? "overview") }] }));

  // Tool 8
  server.registerTool("material3_expressive", {
    title: "Material 3 Expressive Guide",
    description: "Returns Material 3 Expressive component and theming guidance. Covers MaterialExpressiveTheme, " +
      "MotionScheme, ButtonGroup, FloatingToolbar, LoadingIndicator, and MaterialShapes. " +
      "Prevents use of deprecated M3 patterns replaced by M3 Expressive.",
    inputSchema: {
      component: z.string().max(200).optional().describe("M3E component or topic, e.g. 'ButtonGroup', 'MotionScheme'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ component }) => ({ content: [{ type: "text", text: await material3Expressive(component ?? "overview") }] }));

  // Tool 9
  server.registerTool("android_permission_advisor", {
    title: "Android Permission Advisor",
    description: "Returns the correct permission declaration, runtime request pattern, and rationale UI " +
      "for any Android permission. Covers dangerous permissions, special app access, " +
      "and Android 13+ granular media permissions.",
    inputSchema: { permission: z.string().min(2).max(200).describe("Permission name, e.g. 'CAMERA', 'READ_MEDIA_IMAGES'") },
    annotations: { readOnlyHint: true },
  }, async ({ permission }) => ({ content: [{ type: "text", text: await androidPermissionAdvisor(permission) }] }));

  // Tool 10
  server.registerTool("android_testing_guide", {
    title: "Android Testing Guide",
    description: "Returns official testing patterns for unit tests, instrumented tests, Compose UI tests, " +
      "and Espresso. Covers StandardTestDispatcher, turbine, and Hilt testing setup.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Testing topic, e.g. 'compose', 'viewmodel', 'hilt', 'coroutines'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidTestingGuide(topic ?? "overview") }] }));

  // Tool 11
  server.registerTool("android_build_and_publish", {
    title: "Android Build & Publish Guide",
    description: "Returns guidance for Gradle build configuration, app signing, ProGuard/R8 rules, " +
      "Play Store publishing, and App Bundle setup.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic, e.g. 'signing', 'proguard', 'bundle', 'release'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidBuildAndPublish(topic ?? "overview") }] }));

  // Tool 12
  server.registerTool("android_large_screen_guide", {
    title: "Android Large Screen & Foldable Guide",
    description: "Returns guidance for adaptive layouts, WindowSizeClass, foldable support, " +
      "and large-screen app quality requirements. Covers Compose adaptive APIs.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic, e.g. 'windowsizeclass', 'foldable', 'adaptive'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidLargeScreenGuide(topic ?? "overview") }] }));

  // Tool 13
  server.registerTool("android_scalability_guide", {
    title: "Android Scalability Guide",
    description: "Returns patterns for scalable Android architecture: modularization, baseline profiles, " +
      "offline-first sync, and performance optimization.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic, e.g. 'modularization', 'offline-first', 'performance'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidScalabilityGuide(topic ?? "overview") }] }));

  // Tool 14
  server.registerTool("android_navigation3_guide", {
    title: "Android Navigation 3 Guide",
    description: "Returns Navigation 3 (stable Nov 2025) setup, NavDisplay, NavBackStack, " +
      "NavKey patterns, and migration from Navigation 2. AI tools still generate Nav2 — this corrects them.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'setup', 'backstack', 'deep-links', 'migration', 'adaptive'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidNavigation3Guide(topic ?? "overview") }] }));

  // Tool 15
  server.registerTool("android_api36_compliance", {
    title: "Android API 36 Compliance Checker",
    description: "Returns Android 16 / API 36 compliance requirements: orientation/resizability restrictions, " +
      "16 KB page size alignment, and Play Store August 2026 mandate.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'orientation', 'page-size', 'play-mandate', 'overview'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidApi36Compliance(topic ?? "overview") }] }));

  // Tool 16
  server.registerTool("android_kmp_guide", {
    title: "Kotlin Multiplatform Guide",
    description: "Returns KMP project setup, shared module structure, Room KMP, Ktor, DataStore KMP, " +
      "expect/actual patterns, and Compose Multiplatform guidance.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'setup', 'room', 'ktor', 'datastore', 'expect-actual'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidKmpGuide(topic ?? "overview") }] }));

  // Tool 17
  server.registerTool("android_ondevice_ai_guide", {
    title: "Android On-Device AI Guide",
    description: "Returns AICore, ML Kit Gen AI API, Gemini Nano, and MediaPipe integration guidance. " +
      "Covers repository pattern for on-device AI, hardware requirements, and fallback strategies.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'aicore', 'ml-kit', 'mediapipe', 'gemini-nano', 'repository'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidOnDeviceAiGuide(topic ?? "overview") }] }));

  // Tool 18
  server.registerTool("android_play_policy_advisor", {
    title: "Android Play Policy Advisor",
    description: "Returns Play Store policy requirements: age-gating, health app certification, " +
      "loan app compliance, subscription UI rules, and October 2025 policy changes.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'age-gating', 'health', 'loan', 'subscription', 'data-safety'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidPlayPolicyAdvisor(topic ?? "overview") }] }));

  // Tool 19
  server.registerTool("android_xr_guide", {
    title: "Android XR Guide",
    description: "Returns Android XR SDK DP3 guidance: Subspace, SpatialPanel, UserSubspace, " +
      "ARCore for XR, and Compose XR spatial UI patterns.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'setup', 'spatial-ui', 'arcore', 'subspace', 'overview'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidXrGuide(topic ?? "overview") }] }));

  // Tool 20
  server.registerTool("android_wearos_guide", {
    title: "Wear OS Guide",
    description: "Returns Wear OS Compose guidance: ScalingLazyColumn, Tiles, Complications, " +
      "Health Services API, ambient mode, and M3 for Wear.",
    inputSchema: {
      topic: z.string().max(200).optional().describe("Topic: 'overview', 'compose', 'tiles', 'health services'"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ topic }) => ({ content: [{ type: "text", text: await androidWearOsGuide(topic ?? "overview") }] }));

  // Tool 21 — Android Code Validator (Level 3 Loop-Back)
  server.registerTool("android_code_validator", {
    title: "Android Code Validator",
    description:
      "CALL THIS AFTER GENERATING EVERY ANDROID CODE BLOCK. " +
      "Level 3 loop-back gate: validates AI-generated Kotlin, XML, and Gradle against 24 Android rules. " +
      "Detects removed APIs (AsyncTask, TestCoroutineDispatcher), deprecated patterns " +
      "(ContextualFlowRow, NavController in new code, SharedPreferences, LiveData in new code), " +
      "Android 16 violations (orientation locks, resizeableActivity=false), " +
      "and structural issues (GlobalScope.launch, runBlocking in UI). " +
      "Returns PASS/WARN/FAIL verdict with line-level violations, replacements, and official doc URLs. " +
      "If verdict is FAIL: fix all errors and re-run before returning code to the user.",
    inputSchema: {
      code:      z.string().min(1).max(50_000).describe("The code block to validate"),
      language:  z.enum(["kotlin", "xml", "gradle"]).optional()
                  .describe("File type — auto-detected from content if omitted"),
      minSdk:    z.number().int().min(1).max(40).optional().describe("App minSdk (e.g. 24)"),
      targetSdk: z.number().int().min(1).max(40).optional().describe("App targetSdk (e.g. 36)"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ code, language, minSdk, targetSdk }) => ({
    content: [{ type: "text", text: await androidCodeValidator(code, language, minSdk, targetSdk) }],
  }));

  // Grounding Gate Prompt — same as stdio mode; required for Level 2+3 enforcement over HTTP
  server.registerPrompt(
    "androjack_grounding_gate",
    {
      title: "AndroJack Grounding Gate Policy",
      description:
        "System-level prompt enforcing the documentation-first policy. " +
        "Add this to your AI client system prompt to activate the grounding gate.",
    },
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are AndroJack, a documentation-grounded Android engineering assistant.

## WHY THIS POLICY EXISTS

Android AI tools have a measurable trust crisis. The Stack Overflow 2025 Developer Survey
(49,000 developers) found that trust in AI accuracy collapsed from 40% to 29% in a single
year. 35% of Stack Overflow visits are now triggered by developers debugging AI-generated code.
The root cause: AI models predict tokens from stale training data.

For Android specifically, this means:
- Navigation 2 code generated for projects that need Navigation 3 (stable Nov 2025)
- TestCoroutineDispatcher generated — removed from coroutines-test 1.8+, causes CI flakiness
- ContextualFlowRow generated — deprecated in Compose 1.8, AI still confidently generates it
- AsyncTask, Handler(Looper.main()), IntentService generated — all removed from the platform
- Stale Gradle coordinates that differ from what Google Maven actually serves today
- android:screenOrientation locks — illegal on ≥600dp devices under Android 16 / API 36

You do not generate from training memory. You fetch from official sources first, every time.

## MANDATORY GROUNDING GATE — ENFORCE FOR EVERY RESPONSE

Before writing ANY Android or Kotlin code, you MUST follow this sequence:

1. **SEARCH** — Call \`android_official_search\` with the relevant topic.
2. **VALIDATE** — Call \`android_component_status\` for EVERY API class or component you plan to use.
3. **ARCHITECTURE** — Call \`architecture_reference\` before proposing any app structure or patterns.
4. **DEPENDENCIES** — Call \`gradle_dependency_checker\` for every library before adding it.
5. **API LEVEL** — Call \`android_api_level_check\` if you are unsure about minSdk compatibility.
6. **PATTERNS** — Call \`kotlin_best_practices\` for idiomatic coroutine, Flow, or Compose patterns.
7. **DEBUG** — Call \`android_debugger\` for any stacktrace before proposing a fix.
8. **VALIDATE OUTPUT** — Call \`android_code_validator\` on EVERY code block you generate before returning it to the user. If verdict is FAIL, fix all errors and re-run until PASS or WARN.

## HARD RULES — NO EXCEPTIONS

- You CANNOT generate Android code without first retrieving official documentation evidence.
- You CANNOT return code to the user without first passing it through \`android_code_validator\`.
- You CANNOT use any deprecated API (status: deprecated or removed) without explicit user acknowledgement.
- Every code response MUST cite the official doc URL it was grounded in.
- If a tool call fails, say so explicitly — do not fall back to training memory.
- No hallucinated API names, method signatures, or Gradle coordinates.

## NEGATIVE CONSTRAINTS BY API LEVEL

These are hard prohibitions. Generate none of the following without explicit user override:

**All targets (universal):**
- NEVER generate \`AsyncTask\` — removed API 33, crashes on modern devices
- NEVER generate \`TestCoroutineDispatcher\` — removed coroutines-test 1.8+, breaks CI
- NEVER generate \`TestCoroutineScope\` — removed, use \`runTest { }\` block
- NEVER generate \`GlobalScope.launch\` or \`GlobalScope.async\` — leaks coroutines
- NEVER generate \`ContextualFlowRow\` or \`ContextualFlowColumn\` — deprecated Compose 1.8
- NEVER generate \`Thread.sleep()\` in tests — causes flaky test failures
- NEVER generate \`startActivityForResult()\` — use \`registerForActivityResult()\`
- NEVER generate \`IntentService\` — deprecated API 30, use WorkManager or coroutines
- NEVER generate \`runBlocking { }\` on a UI/main thread — causes ANR

**targetSdk ≥ 36 (Android 16 mandate, Play Store August 2026):**
- NEVER generate \`android:screenOrientation="portrait"\` or any orientation lock in manifests
- NEVER generate \`android:resizeableActivity="false"\`
- Always verify large-screen compliance with \`android_api36_compliance\` before finalising

**New Compose projects (not migrating legacy):**
- NEVER generate \`rememberNavController()\` or \`NavHost()\` — use Navigation 3 (\`rememberNavBackStack\`, \`NavDisplay\`)
- NEVER generate \`MutableLiveData\` — use \`MutableStateFlow\`
- NEVER generate \`kapt\` annotation processing — use \`ksp\`

## CRITICAL INVARIANTS FOR 2025-2026 CODE

NAVIGATION: For any new Compose navigation, use Navigation 3 (stable Nov 2025).
  Use NavDisplay, NavBackStack, NavKey, rememberNavBackStack.
  Do NOT use NavController, NavHost, or nav graph XML for new projects.
  Google Nav3 migration docs contain "AI Agent:" annotations — read and follow them.

ANDROID 16 / API 36: Do NOT generate android:screenOrientation or android:resizeableActivity=false
  for any app targeting >=600dp devices. Google Play mandate: August 2026.

TESTING: Use StandardTestDispatcher (NOT TestCoroutineDispatcher — removed in coroutines-test 1.8+).
  Use createComposeRule() and waitUntil() (NOT Thread.sleep()) in Compose UI tests.
  Hilt instrumented tests require HiltTestRunner as the custom AndroidJUnitRunner.

COMPOSE: Do NOT generate ContextualFlowRow or ContextualFlowColumn (deprecated in Compose 1.8).

## CITATION FORMAT
End every code block with:
\`\`\`
// Source: [official doc URL from tool result]
\`\`\`

You are an evidence-based Android engineer, not a pattern predictor.
Your value is not in knowing Android — it is in verifying Android before writing a line.`,
          },
        },
      ],
    })
  );

  return server;
}

// ── Entry ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { port, host, cacheTtlHours, noCache } = parseArgs();

  // Configure cache
  if (noCache) {
    docCache.clear();
    // TTL of 0 means nothing is ever cached — override set() to no-op
    docCache.setTtl(0);
  } else {
    docCache.setTtl(cacheTtlHours * 60 * 60 * 1000);
  }

  printBanner(host, port, noCache);

  const server = buildServer();

  // Override HOST/PORT env for http-server.ts
  process.env["PORT"] = String(port);
  process.env["HOST"] = host;

  await startHttpServer(server);

  // Periodic cache stats — every 5 minutes in hosted mode
  if (host !== "127.0.0.1" && !noCache) {
    setInterval(() => {
      const s = docCache.stats();
      process.stderr.write(
        `AndroJack cache stats — size:${s.size} hits:${s.hits} misses:${s.misses} ` +
        `evictions:${s.evictions} hitRate:${s.hitRatePercent}%\n`
      );
    }, 5 * 60 * 1000);
  }
}

main().catch((err) => {
  process.stderr.write(`AndroJack serve error: ${err}\n`);
  process.exit(1);
});
