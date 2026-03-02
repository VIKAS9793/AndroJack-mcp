#!/usr/bin/env node
/**
 * AndroJack MCP Server – Entry Point
 *
 * A documentation-grounded Android engineering MCP server.
 * All 7 tools enforce the Grounding Gate: the AI must verify
 * official sources before producing Android/Kotlin code.
 *
 * Compatible with: Claude Desktop, Cursor, Windsurf, VS Code Copilot,
 * JetBrains AI Assistant, and any MCP-spec-compliant client.
 *
 * Transport: stdio (universal local compatibility)
 * Protocol:  MCP spec 2025-11-25 via @modelcontextprotocol/sdk ^1.12
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { androidOfficialSearch } from "./tools/search.js";
import { androidComponentStatus } from "./tools/component.js";
import { architectureReference, listArchitectureTopics } from "./tools/architecture.js";
import { androidDebugger } from "./tools/debugger.js";
import { gradleDependencyChecker } from "./tools/gradle.js";
import { androidApiLevelCheck } from "./tools/api-level.js";
import { kotlinBestPractices } from "./tools/kotlin-patterns.js";
import { material3Expressive } from "./tools/m3-expressive.js";

import { androidPermissionAdvisor } from "./tools/permissions.js";
import { androidTestingGuide } from "./tools/testing.js";
import { androidBuildAndPublish } from "./tools/build-publish.js";
import { androidLargeScreenGuide } from "./tools/large-screen.js";
import { androidScalabilityGuide } from "./tools/scalability.js";
import { androidNavigation3Guide } from "./tools/navigation3.js";
import { androidApi36Compliance } from "./tools/api36-compliance.js";
import { androidKmpGuide } from "./tools/kmp.js";
import { androidOnDeviceAiGuide } from "./tools/ondevice-ai.js";
import { androidPlayPolicyAdvisor } from "./tools/play-policy.js";
import { androidXrGuide } from "./tools/xr.js";
import { androidWearOsGuide } from "./tools/wear.js";
// ── Server Instantiation ────────────────────────────────────────────────────
const server = new McpServer({
  name: "androjack-mcp",
  version: "1.3.1",
});

// ── Tool 1: Official Android Documentation Search ──────────────────────────
server.registerTool(
  "android_official_search",
  {
    title: "Android Official Documentation Search",
    description:
      "REQUIRED FIRST STEP. Searches developer.android.com, kotlinlang.org, and source.android.com " +
      "for any Android or Kotlin topic. Returns official excerpts with source URLs. " +
      "You MUST call this before generating any Android/Kotlin code. " +
      "Example queries: 'Jetpack Compose LazyColumn', 'ViewModel lifecycle', 'Hilt scoping'.",
    inputSchema: {
      query: z
        .string()
        .min(2)
        .max(200)
        .describe(
          "Search query — be specific. E.g. 'Compose LazyColumn performance', 'WorkManager constraints'."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ query }) => ({
    content: [{ type: "text", text: await androidOfficialSearch(query) }],
  })
);

// ── Tool 2: Component Status Validator ─────────────────────────────────────
server.registerTool(
  "android_component_status",
  {
    title: "Android Component Status Validator",
    description:
      "Checks whether an Android/Kotlin API, class, or library is stable, deprecated, or removed. " +
      "ALWAYS call this before using any class from android.*, androidx.*, or kotlin.*. " +
      "This tool exists because AI tools confidently generate removed and deprecated APIs. " +
      "Known failures without this check: AsyncTask (removed API 33), TestCoroutineDispatcher " +
      "(removed coroutines-test 1.8+), ContextualFlowRow (deprecated Compose 1.8), " +
      "IntentService (deprecated API 30), Handler(Looper.main()) (deprecated API 30), " +
      "onBackPressed() (deprecated API 33), ProgressDialog (deprecated API 26). " +
      "Returns status, replacement API, migration notes, and official documentation link.",
    inputSchema: {
      component_name: z
        .string()
        .min(2)
        .max(200)
        .describe(
          "Full or short class name to validate. E.g. 'AsyncTask', 'android.widget.ProgressDialog', 'LiveData'."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ component_name }) => ({
    content: [{ type: "text", text: await androidComponentStatus(component_name) }],
  })
);

// ── Tool 3: Architecture Reference Retriever ───────────────────────────────
server.registerTool(
  "architecture_reference",
  {
    title: "Android Architecture Reference",
    description:
      "Retrieves official Android architecture guide content for a given topic. " +
      "Call this before proposing any app architecture, folder structure, or Jetpack component relationships. " +
      "Supported topics: mvvm, compose, navigation, hilt, viewmodel, room, workmanager, paging, " +
      "datastore, coroutines, flow, testing, lifecycle, modular architecture, security, and more. " +
      "Pass 'list' to see all available topics.",
    inputSchema: {
      topic: z
        .string()
        .min(2)
        .max(200)
        .describe(
          "Architecture topic. E.g. 'mvvm', 'compose', 'hilt', 'modular architecture'. Pass 'list' for all topics."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ topic }) => {
    if (topic.trim().toLowerCase() === "list") {
      return { content: [{ type: "text", text: listArchitectureTopics() }] };
    }
    return {
      content: [{ type: "text", text: await architectureReference(topic) }],
    };
  }
);

// ── Tool 4: Error Debugger ─────────────────────────────────────────────────
server.registerTool(
  "android_debugger",
  {
    title: "Android Error Debugger",
    description:
      "Parses an Android/Kotlin stacktrace and searches official sources (developer.android.com, " +
      "issuetracker.google.com) for verified causes and fixes. " +
      "Paste the full crash log or exception. Returns parsed error class, official explanations, " +
      "and vetted fixes. Never guess — always ground debugging in official sources.",
    inputSchema: {
      stacktrace: z
        .string()
        .min(10)
        .max(4000)
        .describe(
          "Full Android/Kotlin stacktrace or exception text. Include the exception class and 'at' frames."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ stacktrace }) => ({
    content: [{ type: "text", text: await androidDebugger(stacktrace) }],
  })
);

// ── Tool 5: Gradle Dependency Checker ─────────────────────────────────────
server.registerTool(
  "gradle_dependency_checker",
  {
    title: "Gradle Dependency Version Checker",
    description:
      "Live version lookup for any Android, Kotlin, or Jetpack library from Google Maven and Maven Central. " +
      "ALWAYS call this before adding or updating any dependency in build.gradle.kts. " +
      "This tool exists because AI tools generate stale dependency coordinates. Known failures: " +
      "wrong Coil group (io.coil-kt vs io.coil-kt.coil3 for Coil 3), missing BOM platform() wrapper " +
      "for Compose and Firebase, outdated Compose BOM (moves every month), KAPT coordinates when " +
      "KSP is the current standard, wrong artifact names for Room KMP vs Room Android. " +
      "Returns: latest stable version, ready-to-paste Kotlin DSL, BOM resolution for managed artifacts, " +
      "and KMP vs Android-only distinction where relevant. " +
      "Examples: 'compose', 'hilt', 'room', 'retrofit', 'coil', 'lifecycle', 'coroutines', 'navigation', 'firebase'.",
    inputSchema: {
      library_name: z
        .string()
        .min(2)
        .max(100)
        .describe(
          "Library name. E.g. 'compose', 'room', 'hilt', 'retrofit', 'kotlin-stdlib', 'coil', 'paging'."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ library_name }) => ({
    content: [{ type: "text", text: await gradleDependencyChecker(library_name) }],
  })
);

// ── Tool 6: API Level Reference ────────────────────────────────────────────
server.registerTool(
  "android_api_level_check",
  {
    title: "Android API Level Reference",
    description:
      "Maps Android API levels to version names, codenames, and key feature availability. " +
      "Returns minSdk guidance and critical API availability warnings. " +
      "Use this to validate that the APIs you plan to use are available at your project's minSdk. " +
      "Input can be: an API integer (e.g. '26'), a version name (e.g. 'Android 14'), or a codename (e.g. 'Oreo'). " +
      "Pass 'all' or 'table' to see the full API level reference table.",
    inputSchema: {
      api_level_or_name: z
        .string()
        .min(1)
        .max(50)
        .describe(
          "API level number (e.g. '26'), version name (e.g. 'Android 14'), codename (e.g. 'Tiramisu'), or 'all'."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ api_level_or_name }) => ({
    content: [{ type: "text", text: androidApiLevelCheck(api_level_or_name) }],
  })
);

// ── Tool 7: Kotlin Best Practices ──────────────────────────────────────────
server.registerTool(
  "kotlin_best_practices",
  {
    title: "Kotlin & Android Best Practices",
    description:
      "Returns official Kotlin and Android code patterns with ready-to-use snippets and explicit anti-patterns. " +
      "All snippets are sourced from developer.android.com and kotlinlang.org. " +
      "Call this when generating coroutine code, StateFlow/LiveData usage, Compose state, " +
      "Room DAOs, Hilt injection, Navigation, or WorkManager tasks. " +
      "Available patterns: coroutines-viewmodel, stateflow-ui, compose-state, room-dao, " +
      "hilt-injection, navigation-compose, workmanager-task, sealed-result. " +
      "Pass any topic keyword or call with no topic to list all patterns.",
    inputSchema: {
      topic: z
        .string()
        .max(200)
        .optional()
        .describe(
          "Pattern name or keyword. E.g. 'coroutines', 'compose state', 'room', 'hilt'. Leave empty to list all."
        ),
    },
    annotations: {
      readOnlyHint: true,
    },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await kotlinBestPractices(topic ?? "") }],
  })
);


// ── Tool 8: Material 3 Expressive ────────────────────────────────────────
server.registerTool(
  "material3_expressive",
  {
    title: "Material 3 Expressive Reference",
    description:
      "Complete reference for Material 3 Expressive (M3E) — Google's design system GA on Android 16 (Sep 2025). " +
      "Covers: MaterialExpressiveTheme setup, MotionScheme, new components (ButtonGroup, FloatingToolbar, " +
      "DockedToolbar, LoadingIndicator, SplitButtonLayout, FABMenu), MaterialShapes + shape morphing, " +
      "variable font typography, Wear OS M3E, migration from plain M3, and anti-patterns. " +
      "Call this before building any Compose UI or theming. " +
      "Topics: overview, theme setup, components, shapes, typography, migration, wear, anti-patterns.",
    inputSchema: {
      topic: z
        .string()
        .max(200)
        .optional()
        .describe(
          "M3E topic. E.g. 'ButtonGroup', 'MotionScheme', 'MaterialShapes', 'migration', 'wear'. Leave empty to list all topics."
        ),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await material3Expressive(topic ?? "") }],
  })
);

// ── Grounding Gate Prompt (System-level instruction for the AI client) ─────
server.registerPrompt(
  "androjack_grounding_gate",
  {
    title: "AndroJack Grounding Gate Policy",
    description:
      "System-level prompt enforcing the documentation-first policy. " +
      "Add this to your AI client system prompt to activate the grounding gate.",
    argsSchema: {},
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

## HARD RULES — NO EXCEPTIONS

- You CANNOT generate Android code without first retrieving official documentation evidence.
- You CANNOT use any deprecated API (status: deprecated or removed) without explicit user acknowledgement.
- Every code response MUST cite the official doc URL it was grounded in.
- If a tool call fails, say so explicitly — do not fall back to training memory.
- No hallucinated API names, method signatures, or Gradle coordinates.

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

// ── Tool 9: Permissions Advisor ───────────────────────────────────────────
server.registerTool(
  "android_permission_advisor",
  {
    title: "Android Permission Advisor",
    description:
      "Complete Android permissions reference. Returns type (normal/dangerous/special/removed), " +
      "whether runtime request is needed, Play Store restrictions, and the correct " +
      "ActivityResultContracts request pattern. " +
      "Call before declaring any <uses-permission> in AndroidManifest.xml. " +
      "Examples: 'CAMERA', 'POST_NOTIFICATIONS', 'ACCESS_FINE_LOCATION', 'WRITE_EXTERNAL_STORAGE'. " +
      "Query 'runtime pattern' for the official Compose + Activity permission request code.",
    inputSchema: {
      permission: z.string().max(200).optional()
        .describe("Permission name (e.g. 'CAMERA', 'POST_NOTIFICATIONS'). Leave empty to list all. Query 'runtime pattern' for request code."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ permission }) => ({
    content: [{ type: "text", text: await androidPermissionAdvisor(permission ?? "list") }],
  })
);

// ── Tool 10: Testing Guide ────────────────────────────────────────────────
server.registerTool(
  "android_testing_guide",
  {
    title: "Android Testing Guide",
    description:
      "Complete Android testing reference covering: unit tests (JUnit4, MockK, Turbine, coroutines-test), " +
      "Compose UI testing (ComposeTestRule, finders, actions, assertions, testTag), " +
      "Espresso for View-based tests and Compose interop, " +
      "ViewModel testing with MainDispatcherRule, Room in-memory DB tests, " +
      "Hilt test injection (@HiltAndroidTest, @BindValue), and test pyramid strategy. " +
      "Call before writing any test. Topics: setup, unit tests, compose testing, espresso, hilt testing, pyramid.",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Testing topic. E.g. 'unit tests', 'compose testing', 'espresso', 'hilt testing', 'pyramid'. Leave empty to list all."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidTestingGuide(topic ?? "") }],
  })
);

// ── Tool 11: Build & Publish ──────────────────────────────────────────────
server.registerTool(
  "android_build_and_publish",
  {
    title: "Android Build & Publish Guide",
    description:
      "Complete Android build pipeline and Play Store publishing reference. " +
      "Covers: R8/ProGuard configuration (keep rules, shrink, obfuscate, mapping.txt recovery), " +
      "Gradle Version Catalogs (libs.versions.toml with all modern deps), " +
      "KSP migration from KAPT (Room, Hilt), " +
      "app signing and Play App Signing, AAB vs APK, Play Store publishing checklist, " +
      "and Baseline Profiles for 20-40% startup improvement. " +
      "Topics: r8, proguard, version catalog, ksp, signing, publish, baseline profiles.",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Build topic. E.g. 'r8', 'proguard', 'version catalog', 'ksp', 'signing', 'baseline profiles'. Leave empty to list all."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidBuildAndPublish(topic ?? "") }],
  })
);


// ── Tool 12: Large Screen & Adaptive Layout ───────────────────────────────────
server.registerTool(
  "android_large_screen_guide",
  {
    title: "Android Large Screen & Adaptive Layout Guide",
    description:
      "Complete reference for building Google Play-compliant large screen, tablet, foldable, and ChromeOS apps. " +
      "Covers: WindowSizeClass (Compact/Medium/Expanded), NavigationSuiteScaffold, " +
      "ListDetailPaneScaffold (two-pane), foldable hinge detection, continuity across config changes, " +
      "and Google Play large-screen quality tier checklist. " +
      "Call before building any multi-screen layout, navigation, or when targeting tablets and foldables. " +
      "Topics: windowsizeclass, navigation, two-pane, foldables, continuity, Play quality.",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic. E.g. 'windowsizeclass', 'NavigationSuiteScaffold', 'ListDetailPaneScaffold', 'foldable'. Leave empty for index."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidLargeScreenGuide(topic ?? "") }],
  })
);

// ── Tool 13: Scalability Architecture ─────────────────────────────────────────
server.registerTool(
  "android_scalability_guide",
  {
    title: "Android Scalability Architecture Guide",
    description:
      "Architecture patterns for Android apps serving millions to billions of users. " +
      "Covers: Paging 3 with RemoteMediator (infinite lists without OOM), offline-first sync " +
      "with WorkManager + Room as single source of truth, OkHttp HTTP caching + ETag, " +
      "cold start optimization with Baseline Profiles, app modularization for large teams, " +
      "and Compose recomposition performance (derivedStateOf, stable keys, @Immutable). " +
      "Call before designing data layers, list screens, sync mechanisms, or module structure. " +
      "Topics: paging, offline-first, network, startup, modularization, compose performance.",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic. E.g. 'Paging3', 'offline-first', 'cold start', 'modularization', 'recomposition'. Leave empty for index."),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidScalabilityGuide(topic ?? "") }],
  })
);

// ── Tool 14: Navigation 3 Guide ───────────────────────────────────────────
server.registerTool(
  "android_navigation3_guide",
  {
    title: "Android Navigation 3 Guide",
    description:
      "Complete Navigation 3 reference (stable November 2025) — the current official navigation library. " +
      "ALWAYS call this before generating any navigation code. " +
      "AI tools hallucinate Navigation 2 (NavController/NavHost) for new projects — this is wrong. " +
      "Nav3 uses NavDisplay, rememberNavBackStack, NavKey, and the Scenes API for adaptive multi-pane. " +
      "Topics: 'overview' (setup, NavKey, NavDisplay, rememberNavBackStack), " +
      "'migration' (from Nav2 — API mapping, step-by-step), " +
      "'scenes' (adaptive list-detail, TwoPaneSceneStrategy), " +
      "'testing' (back stack is a plain list — trivially testable).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Navigation topic: 'overview', 'migration', 'scenes', 'testing', 'backstack', 'key'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidNavigation3Guide(topic ?? "overview") }],
  })
);

// ── Tool 15: Android 16 / API 36 Compliance ───────────────────────────────
server.registerTool(
  "android_api36_compliance",
  {
    title: "Android 16 / API 36 Compliance Checker",
    description:
      "Android 16 compliance reference — mandatory for Google Play by August 2026. " +
      "Apps on ≥600dp devices (tablets, foldables) CANNOT lock orientation or restrict resizability. " +
      "AI tools generate android:screenOrientation='portrait' and android:resizeableActivity='false' — " +
      "both produce App Compatibility warnings in Play Console and search demotion. " +
      "Foldable users spend 14x more on apps. Tablet+phone users spend 9x more. " +
      "Topics: 'compliance' (illegal manifest flags + correct patterns), " +
      "'layouts' (4 canonical adaptive layouts with code), " +
      "'checklist' (Play Store quality tier checklist), " +
      "'predictive back' (required for API 36 targets).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic: 'compliance', 'layouts', 'checklist', 'predictive back', 'page size'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidApi36Compliance(topic ?? "compliance") }],
  })
);

// ── Tool 16: Kotlin Multiplatform Guide ───────────────────────────────────
server.registerTool(
  "android_kmp_guide",
  {
    title: "Kotlin Multiplatform (KMP) Guide",
    description:
      "Complete Kotlin Multiplatform reference — shares business logic across Android and iOS. " +
      "CRITICAL: AI tools silently generate Android-only code for KMP projects. " +
      "Retrofit cannot be used in KMP (use Ktor). Hilt cannot be used in commonMain (use Koin). " +
      "Room 2.7+ has KMP support — use room-runtime + sqlite-bundled, NOT the Android-only Room. " +
      "900+ new KMP libraries in 2025. Room, DataStore, Ktor all have KMP variants. " +
      "Topics: 'overview' (project structure, Gradle setup), " +
      "'libraries' (KMP catalogue — Ktor, Room KMP, DataStore KMP, Koin, Coil3, kotlinx-*), " +
      "'room' (Room KMP database setup), " +
      "'ktor' (Ktor HTTP client — replaces Retrofit), " +
      "'expect actual' (platform-specific code pattern).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic: 'overview', 'libraries', 'room', 'ktor', 'expect actual', 'gradle'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidKmpGuide(topic ?? "overview") }],
  })
);

// ── Tool 17: On-Device AI / AICore Guide ─────────────────────────────────
server.registerTool(
  "android_ondevice_ai",
  {
    title: "Android On-Device AI / AICore Guide",
    description:
      "On-device AI reference — Android 16 AICore and ML Kit Gen AI API. " +
      "Used by Gmail (Smart Reply), Google Photos (object detection), Pixel Screenshots (semantic search). " +
      "The official architecture: wrap ML models behind repository interfaces so on-device (AICore) " +
      "and cloud (Vertex AI) are swappable without touching the UI layer. " +
      "No network round-trip. No API costs. No privacy exposure. Works offline. " +
      "AI tools default to cloud API calls when on-device is the 2026 answer for Pixel devices. " +
      "Topics: 'overview' (architecture pattern, when to use), " +
      "'setup' (dependencies, availability check, fallback pattern), " +
      "'smart reply' (Gmail-style suggestion chips), " +
      "'ml kit' (non-generative ML — image labeling, barcode, face detection, translation).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic: 'overview', 'setup', 'smart reply', 'ml kit', 'architecture'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidOnDeviceAiGuide(topic ?? "overview") }],
  })
);

// ── Tool 18: Play Store Policy Advisor ───────────────────────────────────
server.registerTool(
  "android_play_policy_advisor",
  {
    title: "Google Play Store Policy Advisor",
    description:
      "Play Store policy reference — October 2025 changes and ongoing requirements. " +
      "AI tools have zero awareness of these policy changes. Review failures cost weeks of re-submission. " +
      "Covers: Restrict Minor Access API (dating/gambling apps), subscription transparency requirements, " +
      "restricted permissions and Data Safety declarations, large-screen quality tiers and badge system. " +
      "The large-screen quality badge directly impacts search placement and conversion rates. " +
      "Call before submitting any app to Play Store or adding new monetization features. " +
      "Topics: 'overview' (mandate timeline), 'subscriptions' (billing transparency code), " +
      "'restrict minor access' (dating/gambling implementation), " +
      "'permissions' (restricted permissions + data safety), " +
      "'large screen quality' (tier checklist + revenue impact).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic: 'overview', 'subscriptions', 'restrict minor access', 'permissions', 'large screen quality'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidPlayPolicyAdvisor(topic ?? "overview") }],
  })
);

// ── Tool 19: Android XR Guide ─────────────────────────────────────────────
server.registerTool(
  "android_xr_guide",
  {
    title: "Android XR Developer Guide",
    description:
      "Android XR SDK reference (Developer Preview 3, December 2025). " +
      "Samsung Galaxy XR launched October 2025. 5+ XR devices expected in 2026. " +
      "Standard Compose apps run as 2D panels on XR headsets — no SDK required. " +
      "XR SDK adds spatial APIs: SpatialPanel (3D positioned UI), UserSubspace (follows user), " +
      "Orbiter (floating toolbar that orbits a panel), SubspaceModifier (size as fraction of field of view). " +
      "Material 3 components automatically become spatial in XR — TopAppBar → Orbiter, etc. " +
      "AI tools generate phone Compose code for XR — technically works but misses all spatial value. " +
      "Topics: 'overview' (concepts, device status), 'setup' (dependencies, manifest), " +
      "'spatial ui' (SpatialPanel, UserSubspace, Orbiter), " +
      "'arcore' (face tracking 68 blendshapes, plane detection), " +
      "'compatibility' (XR + non-XR same app pattern).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic: 'overview', 'setup', 'spatial ui', 'arcore', 'compatibility'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidXrGuide(topic ?? "overview") }],
  })
);

// ── Tool 20: Wear OS Guide ────────────────────────────────────────────────
server.registerTool(
  "android_wearos_guide",
  {
    title: "Wear OS Developer Guide",
    description:
      "Wear OS development reference — Wear OS 5 (API 35), Material 3 Expressive for Wear (stable Aug 2025). " +
      "CRITICAL: Wear OS uses DIFFERENT Compose dependencies than phone apps. " +
      "AI tools generate phone Compose (LazyColumn, Button, NavHost) — none of these compile on Wear OS. " +
      "Correct Wear components: ScalingLazyColumn (curved scrolling), Chip, SwipeDismissableNavHost, " +
      "WearMaterialTheme, PositionIndicator, TimeText. " +
      "Covers Tiles (glanceable info on watch face swipe) and Health Services API (heart rate, steps, exercises). " +
      "Topics: 'overview' (Wear vs phone Compose, project structure, dependencies), " +
      "'compose' (ScalingLazyColumn, Chip, navigation, rotary input), " +
      "'tiles' (glanceable surfaces — when and how to build them), " +
      "'health services' (heart rate, steps, exercise session, passive monitoring).",
    inputSchema: {
      topic: z.string().max(200).optional()
        .describe("Topic: 'overview', 'compose', 'tiles', 'health services', 'navigation'"),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ topic }) => ({
    content: [{ type: "text", text: await androidWearOsGuide(topic ?? "overview") }],
  })
);

// ── Server Startup ──────────────────────────────────────────────────────────
// All tools/prompts must be registered above this point.
// Pass --http to start Streamable HTTP transport instead of stdio.
async function main(): Promise<void> {
  const useHttp = process.argv.includes("--http");

  if (useHttp) {
    // Dynamically import to keep stdio startup zero-cost when HTTP isn't needed
    const { startHttpServer } = await import("./http-server.js");
    await startHttpServer(server);
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Log to stderr only — stdout is reserved for MCP JSON protocol
    process.stderr.write("AndroJack MCP server running on stdio. Ready.\n");
  }
}

main().catch((err) => {
  process.stderr.write(`AndroJack fatal error: ${err}\n`);
  process.exit(1);
});
