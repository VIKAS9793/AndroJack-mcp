import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
import { androidCodeValidator } from "./tools/validator.js";

const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
} as const;

const GROUNDING_GATE_TEXT = `You are AndroJack, a documentation-grounded Android engineering assistant.

You are a verification layer, not a pattern predictor. For Android and Kotlin work, use official evidence before you rely on memory.

Before writing Android or Kotlin code:
1. Search official docs with android_official_search for the relevant topic.
2. Check every API or library choice with android_component_status.
3. Use architecture_reference before proposing app structure or Jetpack patterns.
4. Check every dependency with gradle_dependency_checker before adding it.
5. Use android_api_level_check when API availability or minSdk compatibility matters.
6. Use kotlin_best_practices for coroutines, Flow, Compose state, and idiomatic Kotlin patterns.
7. Use android_debugger for stack traces or crash analysis.
8. Run android_code_validator on every code block before returning it.

Hard rules:
- Do not invent Android APIs, Gradle coordinates, or lifecycle guidance.
- Do not rely on deprecated or removed APIs without explicit user acknowledgement.
- If a tool call fails, say so instead of falling back to memory.
- Cite the official source URL that informed the answer.

Validation expectations:
- Prefer Navigation 3 for new Compose navigation work.
- Avoid removed or deprecated APIs such as AsyncTask, IntentService, TestCoroutineDispatcher, and ContextualFlowRow.
- Avoid Android 16 large-screen violations such as orientation locks or resizeableActivity=false for applicable apps.
- Treat android_code_validator as the final quality gate before code reaches the user.`;

export function createAndroJackServer(): McpServer {
  const server = new McpServer({
    name: "androjack-mcp",
    version: "1.6.0",
  });

  server.registerTool(
    "android_official_search",
    {
      title: "Search Android Docs",
      description:
        "Searches developer.android.com, kotlinlang.org, and source.android.com for Android or Kotlin topics. " +
        "Use it when you need an official-source starting point for an API, pattern, or platform behavior, " +
        "and it returns excerpts with source URLs.",
      inputSchema: {
        query: z
          .string()
          .min(2)
          .max(200)
          .describe(
            "Search query. Example: 'Jetpack Compose LazyColumn performance' or 'WorkManager constraints'."
          ),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ query }) => ({
      content: [{ type: "text", text: await androidOfficialSearch(query) }],
    })
  );

  server.registerTool(
    "android_component_status",
    {
      title: "Check Component Status",
      description:
        "Checks whether an Android, Jetpack, or Kotlin component is stable, deprecated, or removed. " +
        "Use it when evaluating a specific API or library choice, and it returns status, replacements, " +
        "migration notes, and an official documentation link.",
      inputSchema: {
        component_name: z
          .string()
          .min(2)
          .max(200)
          .describe(
            "Full or short class name to validate. Example: 'AsyncTask', 'android.widget.ProgressDialog', or 'LiveData'."
          ),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ component_name }) => ({
      content: [{ type: "text", text: await androidComponentStatus(component_name) }],
    })
  );

  server.registerTool(
    "architecture_reference",
    {
      title: "Android Architecture Reference",
      description:
        "Returns official Android architecture guidance for topics such as MVVM, navigation, Hilt, Room, WorkManager, " +
        "Paging, and modular architecture. Use it when proposing app structure or Jetpack component relationships.",
      inputSchema: {
        topic: z
          .string()
          .min(2)
          .max(200)
          .describe("Architecture topic. Example: 'mvvm', 'compose', 'hilt', or 'modular architecture'."),
      },
      annotations: TOOL_ANNOTATIONS,
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

  server.registerTool(
    "android_debugger",
    {
      title: "Android Issue Tracker Search",
      description:
        "Parses Android or Kotlin stack traces and looks up verified causes and fixes from official sources. " +
        "Use it when diagnosing crashes, ANRs, build failures, or issue-tracker-backed regressions.",
      inputSchema: {
        stacktrace: z
          .string()
          .min(10)
          .max(4000)
          .describe("Full Android or Kotlin stack trace or exception text, including the exception class."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ stacktrace }) => ({
      content: [{ type: "text", text: await androidDebugger(stacktrace) }],
    })
  );

  server.registerTool(
    "gradle_dependency_checker",
    {
      title: "Check Gradle Dependencies",
      description:
        "Looks up current Android, Kotlin, and Jetpack dependency versions from Google Maven and Maven Central. " +
        "Use it before adding or updating a library, and it returns stable versions, snippets, and managed-artifact guidance.",
      inputSchema: {
        library_name: z
          .string()
          .min(2)
          .max(100)
          .describe(
            "Library name or keyword. Example: 'compose', 'room', 'hilt', 'retrofit', or 'androidx.compose:compose-bom'."
          ),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ library_name }) => ({
      content: [{ type: "text", text: await gradleDependencyChecker(library_name) }],
    })
  );

  server.registerTool(
    "android_api_level_check",
    {
      title: "Android API Level Check",
      description:
        "Maps Android API levels, version names, and feature availability. Use it when you need minSdk guidance, " +
        "compatibility warnings, or help matching APIs to supported platform versions.",
      inputSchema: {
        api_level_or_name: z
          .string()
          .min(1)
          .max(50)
          .describe("API level, version name, codename, or 'all'. Example: '26', 'Android 14', or 'Tiramisu'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ api_level_or_name }) => ({
      content: [{ type: "text", text: androidApiLevelCheck(api_level_or_name) }],
    })
  );

  server.registerTool(
    "kotlin_best_practices",
    {
      title: "Kotlin Best Practices",
      description:
        "Returns official Kotlin and Android implementation patterns for coroutines, Flow, Compose state, Room, Hilt, " +
        "navigation, and related app code. Use it when you need idiomatic patterns rather than ad hoc examples.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Pattern name or keyword. Example: 'coroutines', 'compose state', 'room', or 'hilt'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await kotlinBestPractices(topic ?? "") }],
    })
  );

  server.registerTool(
    "material3_expressive",
    {
      title: "Material 3 Expressive Guide",
      description:
        "Returns official Material 3 Expressive guidance for themes, components, motion, shapes, and migration. " +
        "Use it when designing or reviewing Compose UI that targets current Android design guidance.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Material 3 Expressive topic. Example: 'ButtonGroup', 'MotionScheme', or 'migration'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await material3Expressive(topic ?? "") }],
    })
  );

  server.registerTool(
    "android_permission_advisor",
    {
      title: "Android Permissions Advisor",
      description:
        "Explains Android permission types, runtime request behavior, Play restrictions, and recommended request flows. " +
        "Use it when declaring or requesting permissions in an Android app.",
      inputSchema: {
        permission: z
          .string()
          .max(200)
          .optional()
          .describe("Permission name. Example: 'CAMERA', 'POST_NOTIFICATIONS', or 'runtime pattern'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ permission }) => ({
      content: [{ type: "text", text: await androidPermissionAdvisor(permission ?? "list") }],
    })
  );

  server.registerTool(
    "android_testing_guide",
    {
      title: "Android Testing Guide",
      description:
        "Returns official testing guidance for unit tests, Compose UI tests, Espresso, ViewModel tests, Room, and Hilt. " +
        "Use it when planning or reviewing Android test strategy and implementation details.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Testing topic. Example: 'unit tests', 'compose testing', 'espresso', or 'hilt testing'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidTestingGuide(topic ?? "") }],
    })
  );

  server.registerTool(
    "android_build_and_publish",
    {
      title: "Build & Publish Guide",
      description:
        "Returns Android build and publishing guidance for R8, ProGuard, version catalogs, KSP, signing, " +
        "Play Store release steps, and baseline profiles. Use it when preparing or reviewing app release configuration.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Build topic. Example: 'r8', 'proguard', 'version catalog', 'signing', or 'publish'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidBuildAndPublish(topic ?? "") }],
    })
  );

  server.registerTool(
    "android_large_screen_guide",
    {
      title: "Large Screen & Foldable Guide",
      description:
        "Returns official guidance for tablets, foldables, ChromeOS, adaptive layouts, and large-screen quality patterns. " +
        "Use it when planning responsive Android UI or reviewing large-screen support.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'windowsizeclass', 'two-pane', 'foldable', or 'Play quality'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidLargeScreenGuide(topic ?? "") }],
    })
  );

  server.registerTool(
    "android_scalability_guide",
    {
      title: "Android Scalability Guide",
      description:
        "Returns architecture patterns for scalable Android apps, including Paging, offline-first sync, networking, " +
        "startup optimization, modularization, and recomposition performance. Use it when designing for larger app scale.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'Paging3', 'offline-first', 'cold start', or 'modularization'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidScalabilityGuide(topic ?? "") }],
    })
  );

  server.registerTool(
    "android_navigation3_guide",
    {
      title: "Navigation 3 Guide",
      description:
        "Returns official Navigation 3 guidance for setup, migration, adaptive scenes, back stacks, and testing. " +
        "Use it when planning navigation for modern Compose apps or reviewing older NavController-based code.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Navigation topic. Example: 'overview', 'migration', 'scenes', 'testing', or 'backstack'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidNavigation3Guide(topic ?? "overview") }],
    })
  );

  server.registerTool(
    "android_api36_compliance",
    {
      title: "Android 16 API Compliance",
      description:
        "Returns Android 16 and targetSdk 36 compliance guidance for orientation, resizability, predictive back, " +
        "and large-screen readiness. Use it when checking policy or manifest implications for modern Play requirements.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'compliance', 'layouts', 'checklist', or 'predictive back'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidApi36Compliance(topic ?? "compliance") }],
    })
  );

  server.registerTool(
    "android_kmp_guide",
    {
      title: "Kotlin Multiplatform Guide",
      description:
        "Returns official Kotlin Multiplatform guidance for project structure, supported libraries, Room KMP, Ktor, " +
        "and expect/actual patterns. Use it when reviewing or planning shared Android and iOS logic.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'overview', 'libraries', 'room', 'ktor', or 'expect actual'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidKmpGuide(topic ?? "overview") }],
    })
  );

  server.registerTool(
    "android_ondevice_ai",
    {
      title: "On-Device AI Guide",
      description:
        "Returns guidance for Android on-device AI capabilities such as AICore, ML Kit, Smart Reply, and related architecture patterns. " +
        "Use it when deciding between local and cloud AI integration on Android.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'overview', 'setup', 'smart reply', 'ml kit', or 'architecture'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidOnDeviceAiGuide(topic ?? "overview") }],
    })
  );

  server.registerTool(
    "android_play_policy_advisor",
    {
      title: "Play Store Policy Advisor",
      description:
        "Returns Google Play policy guidance for subscriptions, restricted permissions, data safety, large screens, " +
        "and other review-sensitive requirements. Use it when assessing release readiness or policy risk.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'overview', 'subscriptions', 'permissions', or 'large screen quality'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidPlayPolicyAdvisor(topic ?? "overview") }],
    })
  );

  server.registerTool(
    "android_xr_guide",
    {
      title: "Android XR Guide",
      description:
        "Returns official Android XR guidance for setup, spatial UI, ARCore capabilities, and compatibility patterns. " +
        "Use it when evaluating headset-specific UI or Android XR platform support.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'overview', 'setup', 'spatial ui', 'arcore', or 'compatibility'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidXrGuide(topic ?? "overview") }],
    })
  );

  server.registerTool(
    "android_wearos_guide",
    {
      title: "Wear OS Guide",
      description:
        "Returns official Wear OS guidance for Compose for Wear, Tiles, health services, navigation, and device-specific UI patterns. " +
        "Use it when building or reviewing watch experiences.",
      inputSchema: {
        topic: z
          .string()
          .max(200)
          .optional()
          .describe("Topic. Example: 'overview', 'compose', 'tiles', 'health services', or 'navigation'."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ topic }) => ({
      content: [{ type: "text", text: await androidWearOsGuide(topic ?? "overview") }],
    })
  );

  server.registerTool(
    "android_code_validator",
    {
      title: "Validate Android Code",
      description:
        "Validates Kotlin, XML, or Gradle snippets against AndroJack's Android rule set before you rely on the result. " +
        "Use it to review generated or existing code, and it returns PASS, WARN, or FAIL findings with fixes and source links.",
      inputSchema: {
        code: z.string().min(1).max(50_000).describe("The code block to validate."),
        language: z
          .enum(["kotlin", "xml", "gradle"])
          .optional()
          .describe("File type. Omit it to auto-detect from the provided content."),
        minSdk: z.number().int().min(1).max(40).optional().describe("App minSdk for API-level context."),
        targetSdk: z.number().int().min(1).max(40).optional().describe("App targetSdk for API 36 compliance context."),
      },
      annotations: TOOL_ANNOTATIONS,
    },
    async ({ code, language, minSdk, targetSdk }) => ({
      content: [{
        type: "text",
        text: await androidCodeValidator(code, language, minSdk, targetSdk),
      }],
    })
  );

  server.registerPrompt(
    "androjack_grounding_gate",
    {
      title: "AndroJack Grounding Gate Policy",
      description:
        "System prompt that tells an AI client how to use AndroJack as a documentation-grounded Android verification layer.",
    },
    () => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: GROUNDING_GATE_TEXT,
          },
        },
      ],
    })
  );

  return server;
}
