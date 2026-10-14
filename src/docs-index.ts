/**
 * AndroJack MCP — Curated Official Documentation Index
 *
 * Why this exists (v2.1): developer.android.com/s/results is rendered
 * client-side. A server-side fetch of it returns only the page shell
 * ("Search results") with zero result content, so every tool that used it
 * as a "live search" fallback was silently returning nothing. kotlinlang.org
 * search uses a URL fragment (never sent to the server) and returned 404.
 *
 * Direct documentation pages ARE server-rendered, so the reliable keyless
 * path is: match the query against a curated index of canonical pages, then
 * fetch those pages. Every URL below was verified to return HTTP 200
 * (with Accept-Language: en-US) on 2026-10-14. `test/docs-index.test.mjs`
 * guards the structure; refresh the URLs each release.
 *
 * When a Google Developer Knowledge API key is configured, the index is a
 * fallback rather than the primary path (see src/integrations/developer-knowledge.ts).
 */

export interface DocIndexEntry {
  title: string;
  url: string;
  /** Lower-case phrases; multi-word phrases score higher than single words. */
  keywords: string[];
}

const D = "https://developer.android.com";

export const DOC_INDEX: readonly DocIndexEntry[] = [
  // ── Compose UI ────────────────────────────────────────────────────────────
  { title: "Lazy lists and lazy grids", url: `${D}/develop/ui/compose/lists`, keywords: ["lazycolumn", "lazyrow", "lazy list", "lazy grid", "lazyverticalgrid", "list", "grid", "recyclerview"] },
  { title: "State and Jetpack Compose", url: `${D}/develop/ui/compose/state`, keywords: ["state", "remember", "mutablestateof", "state hoisting", "remembersaveable", "recomposition"] },
  { title: "Side-effects in Compose", url: `${D}/develop/ui/compose/side-effects`, keywords: ["side effect", "launchedeffect", "disposableeffect", "sideeffect", "rememberupdatedstate", "derivedstateof", "producestate"] },
  { title: "Jetpack Compose performance", url: `${D}/develop/ui/compose/performance`, keywords: ["compose performance", "performance", "recomposition", "stability", "jank", "skippable"] },
  { title: "Lifecycle of composables", url: `${D}/develop/ui/compose/lifecycle`, keywords: ["composable lifecycle", "composition", "recompose", "key"] },
  { title: "Text in Compose", url: `${D}/develop/ui/compose/text`, keywords: ["text", "textfield", "typography", "font"] },
  { title: "Animations in Compose", url: `${D}/develop/ui/compose/animation/introduction`, keywords: ["animation", "animate", "animatedvisibility", "transition", "animatecontentsize"] },
  { title: "Material Design 3 in Compose", url: `${D}/develop/ui/compose/designsystems/material3`, keywords: ["material 3", "material3", "m3", "theme", "materialtheme", "color scheme", "dynamic color", "expressive"] },
  { title: "About window insets", url: `${D}/develop/ui/compose/system/insets`, keywords: ["edge-to-edge", "edge to edge", "insets", "windowinsets", "system bars", "status bar", "navigation bar"] },
  { title: "Test your Compose layout", url: `${D}/develop/ui/compose/testing`, keywords: ["compose test", "createcomposerule", "ui test", "semantics", "onnodewithtext"] },
  { title: "Notification runtime permission", url: `${D}/develop/ui/compose/notifications/notification-permission`, keywords: ["post_notifications", "notification permission", "notification"] },

  // ── Adaptive / large screen ───────────────────────────────────────────────
  { title: "Get started with adaptive apps", url: `${D}/develop/ui/compose/layouts/adaptive/get-started-with-adaptive-apps`, keywords: ["adaptive", "large screen", "tablet", "foldable", "list-detail", "navigationsuitescaffold", "canonical layout"] },
  { title: "Use window size classes", url: `${D}/develop/ui/compose/layouts/adaptive/use-window-size-classes`, keywords: ["window size class", "windowsizeclass", "breakpoint", "compact", "expanded"] },
  { title: "Android 17: orientation and resizability restrictions are ignored", url: `${D}/about/versions/17/changes/ff-restrictions-ignored`, keywords: ["screenorientation", "orientation lock", "resizeableactivity", "aspect ratio", "minaspectratio", "maxaspectratio", "setrequestedorientation"] },

  // ── Architecture ──────────────────────────────────────────────────────────
  { title: "Guide to app architecture", url: `${D}/topic/architecture`, keywords: ["architecture", "mvvm", "clean architecture", "app architecture", "udf", "unidirectional data flow"] },
  { title: "UI layer", url: `${D}/topic/architecture/ui-layer`, keywords: ["ui layer", "ui state", "uistate", "state holder"] },
  { title: "Data layer", url: `${D}/topic/architecture/data-layer`, keywords: ["data layer", "repository", "data source", "offline-first", "offline first"] },
  { title: "Domain layer", url: `${D}/topic/architecture/domain-layer`, keywords: ["domain layer", "use case", "usecase", "interactor"] },
  { title: "ViewModel overview", url: `${D}/topic/libraries/architecture/viewmodel`, keywords: ["viewmodel", "viewmodelscope", "savedstatehandle"] },
  { title: "Lifecycle", url: `${D}/topic/libraries/architecture/lifecycle`, keywords: ["lifecycle", "lifecycleowner", "repeatonlifecycle", "collectaswithlifecycle", "onstart", "onresume"] },
  { title: "Dependency injection with Hilt", url: `${D}/training/dependency-injection/hilt-android`, keywords: ["hilt", "dependency injection", "@inject", "@hiltviewmodel", "dagger", "@module"] },

  // ── Navigation ────────────────────────────────────────────────────────────
  { title: "Navigation 3", url: `${D}/guide/navigation/navigation-3`, keywords: ["navigation 3", "nav3", "navdisplay", "navbackstack", "navkey", "remembernavbackstack", "scene"] },
  { title: "Navigation", url: `${D}/guide/navigation`, keywords: ["navigation", "navcontroller", "navhost", "nav graph", "deep link"] },
  { title: "Predictive back gesture", url: `${D}/guide/navigation/custom-back/predictive-back-gesture`, keywords: ["predictive back", "onbackpressed", "backhandler", "onbackpressedcallback", "back gesture"] },

  // ── Data & storage ────────────────────────────────────────────────────────
  { title: "Save data in a local database using Room", url: `${D}/training/data-storage/room`, keywords: ["room", "dao", "@entity", "database", "sqlite", "migration"] },
  { title: "DataStore", url: `${D}/topic/libraries/architecture/datastore`, keywords: ["datastore", "preferences datastore", "sharedpreferences", "proto datastore"] },
  { title: "Paging library overview", url: `${D}/topic/libraries/architecture/paging/v3-overview`, keywords: ["paging", "pagingsource", "pager", "pagingdata", "infinite scroll"] },
  { title: "Photo picker", url: `${D}/training/data-storage/shared/photo-picker`, keywords: ["photo picker", "pickvisualmedia", "image picker", "read_media_images"] },

  // ── Background work ───────────────────────────────────────────────────────
  { title: "Background tasks overview", url: `${D}/develop/background-work/background-tasks`, keywords: ["background", "background task", "background work"] },
  { title: "Task scheduling (WorkManager)", url: `${D}/develop/background-work/background-tasks/persistent`, keywords: ["workmanager", "worker", "coroutineworker", "periodicworkrequest", "onetimeworkrequest", "constraints"] },
  { title: "Foreground services overview", url: `${D}/develop/background-work/services/fgs`, keywords: ["foreground service", "startforeground", "fgs"] },
  { title: "Foreground service types", url: `${D}/develop/background-work/services/fgs/service-types`, keywords: ["foregroundservicetype", "service type", "datasync", "mediaplayback"] },
  { title: "ANRs", url: `${D}/topic/performance/issues/anr`, keywords: ["anr", "application not responding", "main thread", "runblocking"] },

  // ── Kotlin / coroutines ───────────────────────────────────────────────────
  { title: "Kotlin coroutines on Android", url: `${D}/kotlin/coroutines`, keywords: ["coroutine", "coroutines", "suspend", "launch", "async", "dispatchers", "globalscope", "asynctask"] },
  { title: "Best practices for coroutines in Android", url: `${D}/kotlin/coroutines/coroutines-best-practices`, keywords: ["coroutine best practices", "inject dispatchers", "main-safe", "structured concurrency"] },
  { title: "Kotlin flows on Android", url: `${D}/kotlin/flow`, keywords: ["flow", "cold flow", "collect", "flowon", "catch"] },
  { title: "StateFlow and SharedFlow", url: `${D}/kotlin/flow/stateflow-and-sharedflow`, keywords: ["stateflow", "sharedflow", "mutablestateflow", "statein", "livedata"] },
  { title: "Testing Kotlin coroutines on Android", url: `${D}/kotlin/coroutines/test`, keywords: ["runtest", "standardtestdispatcher", "unconfinedtestdispatcher", "testcoroutinedispatcher", "coroutine test", "maindispatcherrule"] },
  { title: "Kotlin coroutines overview (kotlinlang.org)", url: "https://kotlinlang.org/docs/coroutines-overview.html", keywords: ["kotlinx.coroutines", "coroutine scope", "job", "cancellation"] },
  { title: "Null safety (kotlinlang.org)", url: "https://kotlinlang.org/docs/null-safety.html", keywords: ["null safety", "nullable", "npe", "nullpointerexception", "lateinit", "!!"] },
  { title: "Kotlin Multiplatform", url: `${D}/kotlin/multiplatform`, keywords: ["kmp", "kotlin multiplatform", "multiplatform", "commonmain", "expect", "actual"] },

  // ── Testing ───────────────────────────────────────────────────────────────
  { title: "Test apps on Android", url: `${D}/training/testing`, keywords: ["test", "testing", "unit test", "instrumented test", "espresso", "robolectric"] },

  // ── Permissions, privacy, security ────────────────────────────────────────
  { title: "Request runtime permissions", url: `${D}/training/permissions/requesting`, keywords: ["runtime permission", "requestpermission", "registerforactivityresult", "permission rationale"] },
  { title: "Permissions on Android", url: `${D}/guide/topics/permissions/overview`, keywords: ["permission", "permissions", "manifest permission", "dangerous permission"] },
  { title: "Local network permission (Android 17)", url: `${D}/privacy-and-security/local-network-permission`, keywords: ["access_local_network", "local network", "lan", "mdns", "nsdmanager", "multicast"] },
  { title: "SMS Retriever / SMS verification", url: `${D}/identity/sms-retriever`, keywords: ["sms", "otp", "sms retriever", "sms user consent", "sms_received"] },
  { title: "Credential Manager", url: `${D}/identity/credential-manager`, keywords: ["credential manager", "passkey", "sign in", "google sign-in", "accountmanager", "login"] },
  { title: "Security checklist", url: `${D}/privacy-and-security/security-tips`, keywords: ["security", "encryption", "keystore", "network security config", "certificate"] },

  // ── Build & release ───────────────────────────────────────────────────────
  { title: "Android Gradle plugin 9.4.0 release notes", url: `${D}/build/releases/agp-9-4-0-release-notes`, keywords: ["agp", "android gradle plugin", "gradle plugin", "agp 9", "agp 10", "build"] },
  { title: "Android Studio release notes", url: `${D}/studio/releases`, keywords: ["android studio", "studio version", "rabbit", "quail", "ide"] },
  { title: "Migrate your build to version catalogs", url: `${D}/build/migrate-to-catalogs`, keywords: ["version catalog", "libs.versions.toml", "toml"] },
  { title: "Migrate from kapt to KSP", url: `${D}/build/migrate-to-ksp`, keywords: ["ksp", "kapt", "annotation processing"] },
  { title: "Enable app optimization with R8", url: `${D}/topic/performance/app-optimization/enable-app-optimization`, keywords: ["r8", "proguard", "minify", "shrink", "obfuscation", "keep rules"] },
  { title: "Baseline Profiles overview", url: `${D}/topic/performance/baselineprofiles/overview`, keywords: ["baseline profile", "startup", "macrobenchmark", "app startup"] },
  { title: "About Android App Bundles", url: `${D}/guide/app-bundle`, keywords: ["app bundle", "aab", "play feature delivery", "dynamic feature"] },
  { title: "Meet Google Play's target API level requirement", url: `${D}/google/play/requirements/target-sdk`, keywords: ["target api", "targetsdk", "target sdk", "play deadline", "api level requirement"] },
  { title: "Android developer verification", url: `${D}/developer-verification`, keywords: ["developer verification", "verification", "sideload", "android developer console"] },

  // ── Platform versions ─────────────────────────────────────────────────────
  { title: "Behavior changes: apps targeting Android 17", url: `${D}/about/versions/17/behavior-changes-17`, keywords: ["android 17", "api 37", "targetsdk 37", "messagequeue", "static final", "system.load"] },
  { title: "Behavior changes: all apps (Android 17)", url: `${D}/about/versions/17/behavior-changes-all`, keywords: ["android 17 all apps", "android 17 behavior"] },
  { title: "Behavior changes: apps targeting Android 16", url: `${D}/about/versions/16/behavior-changes-16`, keywords: ["android 16", "api 36", "targetsdk 36"] },
  { title: "Manifest <activity> element", url: `${D}/guide/topics/manifest/activity-element`, keywords: ["activity element", "android:configchanges", "exported", "launchmode", "manifest"] },

  // ── AI, agents, form factors ──────────────────────────────────────────────
  { title: "Overview of AppFunctions", url: `${D}/ai/appfunctions`, keywords: ["appfunctions", "app functions", "@appfunction", "on-device mcp", "appfunctionservice", "agent"] },
  { title: "AppFunctions release notes", url: `${D}/jetpack/androidx/releases/appfunctions`, keywords: ["appfunctions version", "appfunctions-compiler"] },
  { title: "Gemini Nano", url: `${D}/ai/gemini-nano`, keywords: ["gemini nano", "on-device ai", "ml kit genai", "aicore", "llm"] },
  { title: "Overview of Android CLI", url: `${D}/tools/agents/android-cli`, keywords: ["android cli", "agent", "android docs", "android run", "coding agent"] },
  { title: "Overview of Android skills", url: `${D}/tools/agents/android-skills`, keywords: ["android skills", "agent skills", "skill"] },
  { title: "Use Jetpack Compose on Wear OS", url: `${D}/training/wearables/compose`, keywords: ["wear os", "wearos", "watch", "tile", "complication"] },
  { title: "Android XR", url: `${D}/develop/xr`, keywords: ["xr", "android xr", "spatial", "jetpack xr", "headset"] },
];

const STOPWORDS = new Set([
  "the", "a", "an", "to", "in", "of", "for", "and", "or", "how", "with", "on",
  "use", "using", "what", "is", "are", "do", "does", "i", "my", "android", "kotlin", "jetpack",
]);

export interface ScoredDocEntry extends DocIndexEntry {
  score: number;
}

/**
 * Scores index entries against a free-text query. Phrase hits (keyword
 * appears verbatim in the query) weigh by word count; single-token overlap
 * with titles adds a smaller amount. Deterministic: ties keep index order.
 */
export function matchDocIndex(query: string, limit = 3): ScoredDocEntry[] {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9@.!_\-\s]/g, " ").replace(/\s+/g, " ").trim()} `;
  const tokens = new Set(q.trim().split(" ").filter((t) => t.length > 1 && !STOPWORDS.has(t)));

  const scored = DOC_INDEX.map((entry, index) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(` ${kw} `) || (kw.length > 5 && q.includes(kw))) {
        score += 2 * kw.split(" ").length;
      }
    }
    for (const word of entry.title.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word.length > 2 && tokens.has(word)) score += 1;
    }
    return { ...entry, score, index };
  });

  return scored
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ index: _index, ...rest }) => rest);
}
