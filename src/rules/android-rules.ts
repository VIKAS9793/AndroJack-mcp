/**
 * AndroJack MCP – Android Rule Engine
 *
 * Data-driven linting rules for AI-generated Android/Kotlin code.
 * Zero external dependencies — pure TypeScript RegExp pattern matching.
 *
 * Design principles (grounded in research):
 *   - Rules as data: adding a rule requires no code change, only a new entry
 *   - Three severity levels mapped to action urgency:
 *       "error"   → will break at runtime or fail Play Store review
 *       "warning" → deprecated, will break in a future release
 *       "info"    → suboptimal pattern, not wrong today
 *   - Every rule carries docUrl so the AI can verify the constraint
 *   - Context-aware: some rules only fire for specific minSdk / targetSdk
 *
 * Prior art this extends:
 *   - Parasoft MCP (Oct 2025): rule-aware MCP server for C/C++ coding violations
 *   - ast-grep MCP: structural pattern matching for AI coding agents
 *   Both validated the pattern; this is the Android-specific implementation.
 */

export type Severity  = "error" | "warning" | "info";
export type Language  = "kotlin" | "xml" | "gradle" | "unknown";

export interface AndroidRule {
  id:           string;       // e.g. "DEPRECATED_ASYNCTASK"
  severity:     Severity;
  languages:    Language[];   // which file types this applies to
  pattern:      RegExp;       // detection pattern (case-insensitive where appropriate)
  message:      string;       // what is wrong
  replacement:  string;       // what to use instead
  docUrl:       string;       // authoritative source
  notes?:       string;       // extra context for the AI
  minSdkAbove?: number;       // only fire if targetSdk > this value
  minSdkBelow?: number;       // only fire if minSdk < this value
}

export interface ValidationContext {
  language:   Language;
  minSdk?:    number;
  targetSdk?: number;
}

export interface Violation {
  ruleId:      string;
  severity:    Severity;
  line:        number;
  column:      number;
  snippet:     string;       // the matched text (truncated)
  message:     string;
  replacement: string;
  docUrl:      string;
}

// ── Rule Definitions ──────────────────────────────────────────────────────────

export const ANDROID_RULES: AndroidRule[] = [

  // ── ERRORS: breaks at runtime or fails Play Store ─────────────────────────

  {
    id:          "REMOVED_ASYNCTASK",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /\bAsyncTask\b/g,
    message:     "AsyncTask was removed in API 33. Apps targeting API 33+ will crash.",
    replacement: "Use Kotlin Coroutines (viewModelScope.launch) or WorkManager for background tasks.",
    docUrl:      "https://developer.android.com/topic/libraries/architecture/workmanager",
    notes:       "AsyncTask was deprecated API 30, removed API 33. Even if minSdk < 33, generate coroutines.",
  },

  {
    id:          "REMOVED_TEST_COROUTINE_DISPATCHER",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /\bTestCoroutineDispatcher\b/g,
    message:     "TestCoroutineDispatcher was removed in kotlinx-coroutines-test 1.8+. Causes CI failures.",
    replacement: "Use StandardTestDispatcher() with advanceUntilIdle(), or UnconfinedTestDispatcher() for eager execution.",
    docUrl:      "https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/",
    notes:       "runTest{} with StandardTestDispatcher is the correct migration path. MainDispatcherRule handles setup.",
  },

  {
    id:          "REMOVED_TEST_COROUTINE_SCOPE",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /\bTestCoroutineScope\b/g,
    message:     "TestCoroutineScope was removed in kotlinx-coroutines-test 1.8+.",
    replacement: "Replace TestCoroutineScope with the runTest { } block — it provides the scope automatically.",
    docUrl:      "https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/kotlinx.coroutines.test/run-test.html",
  },

  {
    id:          "GLOBALSCOPE_LAUNCH",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /GlobalScope\s*\.\s*launch\b/g,
    message:     "GlobalScope.launch leaks coroutines — not bound to any lifecycle. Causes memory leaks and crashes.",
    replacement: "Use viewModelScope.launch (ViewModel), lifecycleScope.launch (Activity/Fragment), or rememberCoroutineScope() (Compose).",
    docUrl:      "https://developer.android.com/kotlin/coroutines/coroutines-best-practices#create-coroutines-data-layer",
  },

  {
    id:          "GLOBALSCOPE_ASYNC",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /GlobalScope\s*\.\s*async\b/g,
    message:     "GlobalScope.async leaks coroutines — not bound to any lifecycle.",
    replacement: "Use viewModelScope.async or structured concurrency patterns.",
    docUrl:      "https://developer.android.com/kotlin/coroutines/coroutines-best-practices",
  },

  {
    id:          "XML_SCREEN_ORIENTATION_LOCK",
    severity:    "error",
    languages:   ["xml"],
    pattern:     /android:screenOrientation\s*=\s*["'](portrait|landscape|sensorPortrait|sensorLandscape|reversePortrait|reverseLandscape)["']/gi,
    message:     "android:screenOrientation locks break Android 16 / API 36 compliance on ≥600dp devices (tablets, foldables).",
    replacement: "Remove the screenOrientation attribute. Use WindowSizeClass to handle orientation-specific layouts in code.",
    docUrl:      "https://developer.android.com/about/versions/16/behavior-changes-16",
    notes:       "Play Store mandates API 36 targeting since August 31, 2026. On API 37 targets the Android 16 opt-out is gone; games (android:appCategory=\"game\") remain exempt.",
    minSdkAbove: 35, // Android 16 large-screen enforcement applies at targetSdk 36+
  },

  {
    id:          "XML_RESIZE_DISABLED",
    severity:    "error",
    languages:   ["xml"],
    pattern:     /android:resizeableActivity\s*=\s*["']false["']/gi,
    message:     "android:resizeableActivity=\"false\" is illegal on ≥600dp devices under Android 16 / API 36.",
    replacement: "Remove this attribute entirely. Design adaptive layouts with WindowSizeClass instead.",
    docUrl:      "https://developer.android.com/about/versions/16/behavior-changes-16",
    minSdkAbove: 35,
  },

  {
    id:          "RUNBLOCKING_UI",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /runBlocking\s*\{/g,
    message:     "runBlocking on the main/UI thread causes ANR. Blocks the calling thread until the coroutine completes.",
    replacement: "Use launch{} or async/await with a coroutine scope. Reserve runBlocking for tests and top-level main() only.",
    docUrl:      "https://developer.android.com/kotlin/coroutines/coroutines-best-practices#avoid-using-runblocking",
  },

  {
    id:          "THREAD_SLEEP_IN_TEST",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /Thread\.sleep\s*\(/g,
    message:     "Thread.sleep() in tests causes flakiness. It's an arbitrary wait, not a coroutine-aware suspension.",
    replacement: "Use advanceUntilIdle() for coroutine tests, or waitUntil { condition } for Compose UI tests.",
    docUrl:      "https://developer.android.com/training/testing/local-tests",
  },

  {
    id:          "START_ACTIVITY_FOR_RESULT",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /\.\s*startActivityForResult\s*\(/g,
    message:     "startActivityForResult() is deprecated. Removed from the recommended Android API surface.",
    replacement: "Use registerForActivityResult() with ActivityResultContracts. Handles all result-returning Activities.",
    docUrl:      "https://developer.android.com/training/basics/intents/result",
  },

  // ── WARNINGS: deprecated, will break in a future release ──────────────────

  {
    id:          "DEPRECATED_CONTEXTUAL_FLOW_ROW",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bContextualFlowRow\b/g,
    message:     "ContextualFlowRow was deprecated in Compose 1.8 (2025). AI tools still generate it.",
    replacement: "Use FlowRow from androidx.compose.foundation.layout with standard overflow handling.",
    docUrl:      "https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary",
  },

  {
    id:          "DEPRECATED_CONTEXTUAL_FLOW_COLUMN",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bContextualFlowColumn\b/g,
    message:     "ContextualFlowColumn was deprecated in Compose 1.8 (2025). AI tools still generate it.",
    replacement: "Use FlowColumn from androidx.compose.foundation.layout with standard overflow handling.",
    docUrl:      "https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary",
  },

  {
    id:          "DEPRECATED_NAV_CONTROLLER_NEW_CODE",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /rememberNavController\s*\(\s*\)/g,
    message:     "rememberNavController() is the Navigation 2 API. Navigation 3 is stable since November 2025.",
    replacement: "For new projects: use rememberNavBackStack() from Navigation 3 (androidx.navigation:navigation-compose:2.x).",
    docUrl:      "https://developer.android.com/guide/navigation/navigation-3",
    notes:       "NavController still works for existing Nav2 projects. Apply this warning only to new code.",
  },

  {
    id:          "DEPRECATED_NAV_HOST",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bNavHost\s*[({]/g,
    message:     "NavHost is the Navigation 2 API. Navigation 3 (stable Nov 2025) uses NavDisplay.",
    replacement: "For new projects: use NavDisplay from Navigation 3.",
    docUrl:      "https://developer.android.com/guide/navigation/navigation-3",
  },

  {
    id:          "DEPRECATED_INTENTSERVICE",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bIntentService\b/g,
    message:     "IntentService was deprecated in API 30.",
    replacement: "Use WorkManager for deferrable background work, or coroutines with a Service for immediate work.",
    docUrl:      "https://developer.android.com/topic/libraries/architecture/workmanager",
  },

  {
    id:          "DEPRECATED_HANDLER_THREAD",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bHandlerThread\b/g,
    message:     "HandlerThread was deprecated in API 30.",
    replacement: "Use Kotlin Coroutines with Dispatchers.Default or a custom CoroutineDispatcher.",
    docUrl:      "https://developer.android.com/kotlin/coroutines",
  },

  {
    id:          "DEPRECATED_SHARED_PREFERENCES",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bgetSharedPreferences\b|\bSharedPreferences\b/g,
    message:     "SharedPreferences blocks the main thread and has no Flow/coroutine support.",
    replacement: "Migrate to DataStore (Preferences DataStore for key-value, Proto DataStore for typed data).",
    docUrl:      "https://developer.android.com/topic/libraries/architecture/datastore",
  },

  {
    id:          "DEPRECATED_LIVEDATA_NEW_CODE",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bMutableLiveData\s*<|LiveData\s*<|liveData\s*\{/g,
    message:     "LiveData is legacy. Prefer StateFlow/SharedFlow for better coroutine and Compose integration.",
    replacement: "Use MutableStateFlow<T> with StateFlow<T> in ViewModel. Observe with collectAsStateWithLifecycle() in Compose.",
    docUrl:      "https://developer.android.com/kotlin/flow/stateflow-and-sharedflow",
    notes:       "LiveData is not removed — existing code is fine. Apply this warning only to new ViewModel code.",
  },

  {
    id:          "DEPRECATED_BOTTOM_APP_BAR_M3E",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bBottomAppBar\s*[({]/g,
    message:     "BottomAppBar is superseded by DockedToolbar in Material 3 Expressive (2025).",
    replacement: "Use DockedToolbar or HorizontalFloatingToolbar from material3:1.4.x. Requires @OptIn(ExperimentalMaterial3ExpressiveApi::class).",
    docUrl:      "https://developer.android.com/develop/ui/compose/designsystems/material3",
  },

  {
    id:          "GRADLE_KAPT_NEW_PROJECT",
    severity:    "warning",
    languages:   ["gradle"],
    // Covers Groovy `kapt "…"`, Kotlin DSL `kapt("…")`, and the plugin declarations.
    pattern:     /\bkapt\s*\(?\s*["']|\bkotlin\s*\(\s*["']kapt["']\s*\)|["']kotlin-kapt["']|["']org\.jetbrains\.kotlin\.kapt["']/g,
    message:     "KAPT (kapt annotation processor) is slower than KSP and deprecated for most Jetpack libraries.",
    replacement: "Migrate to KSP (ksp plugin + ksp() dependency declaration). Room, Hilt, and Moshi all support KSP.",
    docUrl:      "https://developer.android.com/build/migrate-to-ksp",
  },

  {
    id:          "DEPRECATED_ACCOUNT_MANAGER",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bAccountManager\b/g,
    message:     "AccountManager is deprecated for authentication flows.",
    replacement: "Use CredentialManager (androidx.credentials) — supports passkeys, passwords, and federated sign-in.",
    docUrl:      "https://developer.android.com/training/sign-in/credential-manager",
  },

  // ── INFO: suboptimal pattern, not wrong today ─────────────────────────────

  {
    id:          "INFO_HARDCODED_DISPATCH_MAIN",
    severity:    "info",
    languages:   ["kotlin"],
    pattern:     /Dispatchers\.Main\b/g,
    message:     "Dispatchers.Main is fine for production but makes unit tests harder (requires MainDispatcherRule).",
    replacement: "Inject dispatchers via constructor for testability. Use MainDispatcherRule in tests.",
    docUrl:      "https://developer.android.com/kotlin/coroutines/coroutines-best-practices#inject-dispatchers",
  },

  {
    id:          "INFO_GRADLE_HARDCODED_VERSION",
    severity:    "info",
    languages:   ["gradle"],
    pattern:     /implementation\s*\(\s*["'][^"']+:\d+\.\d+[^"']*["']\s*\)/g,
    message:     "Hardcoded dependency version. Consider using version catalogs (libs.versions.toml) for consistency.",
    replacement: "Define versions in libs.versions.toml and reference via libs.* accessors.",
    docUrl:      "https://developer.android.com/build/migrate-to-catalogs",
  },

  {
    id:          "INFO_ON_BACK_PRESSED_OVERRIDE",
    severity:    "info",
    languages:   ["kotlin"],
    pattern:     /override\s+fun\s+onBackPressed\s*\(\s*\)/g,
    message:     "onBackPressed() override is legacy. Does not support predictive back gesture (Android 14+).",
    replacement: "Use OnBackPressedCallback (registered via onBackPressedDispatcher) or BackHandler in Compose.",
    docUrl:      "https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture",
  },

  // ── Android 17 / API 37 rules ─────────────────────────────────────────────

  {
    id:          "API37_STATIC_FINAL_REFLECTION",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /\.isAccessible\s*=\s*true/g,
    message:     "field.isAccessible = true on a static final field throws IllegalAccessException on Android 17 (API 37+) targets. JNI mutation of static final fields causes a crash.",
    replacement: "Replace reflected static final mutation with constructor injection or a provider/factory pattern. In tests, use dependency injection instead of field mutation.",
    docUrl:      "https://developer.android.com/about/versions/17/behavior-changes-17#static-final-reflection",
    notes:       "Only breaks when used on static final fields. isAccessible=true on non-final fields still works. Audit all reflection usage before targeting API 37.",
    minSdkAbove: 36,  // Only flag for apps targeting API 37+
  },

  {
    id:          "API37_SMS_RECEIVER_OTP",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /SMS_RECEIVED|android\.provider\.Telephony\.SMS_RECEIVED/g,
    message:     "SMS_RECEIVED broadcast access to OTP messages is delayed 3 hours for apps targeting Android 17 (API 37+).",
    replacement: "Use SmsRetriever.startSmsUserConsent() or SmsCodeRetriever from Play Services. These have no delay and are the recommended OTP pattern.",
    docUrl:      "https://developer.android.com/identity/sms-retriever",
    minSdkAbove: 36,
  },

  // ── Compose-First / Compose 1.11 rules (May 2026 platform shift) ──────────

  {
    id:          "UNCONFINED_DISPATCHER_COMPOSE_TEST",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /UnconfinedTestDispatcher\s*\(/g,
    message:     "UnconfinedTestDispatcher assumes immediate coroutine execution — this was the v1 Compose testing default. Compose 1.11+ defaults to StandardTestDispatcher (queued execution), and tests relying on the old assumption may now hang or assert before the coroutine completes.",
    replacement: "Use StandardTestDispatcher and call advanceUntilIdle() (plus composeTestRule.awaitIdle() for Compose UI tests) before assertions that depend on coroutine completion.",
    docUrl:      "https://android-developers.googleblog.com/2026/04/jetpack-compose-april-2026-updates.html",
    notes:       "Not an error — UnconfinedTestDispatcher is still valid Kotlin, just no longer matches Compose 1.11's default test behavior. Flagged so intermittent test failures get traced to this cause instead of assumed to be flaky infrastructure.",
  },

  {
    id:          "NEW_FRAGMENT_CLASS_COMPOSE_FIRST",
    severity:    "info",
    languages:   ["kotlin"],
    pattern:     /class\s+\w+\s*:\s*Fragment\s*\(/g,
    message:     "New class extends Fragment. As of May 19, 2026, Android UI development is Compose First — Views (Fragments, RecyclerView, ViewPager) are in maintenance mode, receiving critical bugfixes only. New screens should be built with Jetpack Compose.",
    replacement: "For a new screen, use a @Composable function with Navigation 3 instead of a new Fragment. Existing Fragment-based code does not need migration unless you are already touching it.",
    docUrl:      "https://android-developers.googleblog.com/2026/05/android-ui-development-is-compose-first.html",
    notes:       "Info-level only — this is a platform direction signal, not a defect. Maintaining existing Fragment code is fine; this flags NEW Fragment subclasses specifically.",
  },

  // ── Android 17 / API 37 — stable since June 16, 2026 ───────────────────────
  // Source for all rules below: https://developer.android.com/about/versions/17/behavior-changes-17

  {
    id:          "API37_MESSAGEQUEUE_REFLECTION",
    severity:    "error",
    languages:   ["kotlin"],
    pattern:     /\bMessageQueue\b[^\n]{0,120}\bgetDeclared(?:Field|Method)\s*\(/g,
    message:     "Apps targeting API 37 get a new lock-free android.os.MessageQueue. Reflection on its private fields/methods may break.",
    replacement: "Remove MessageQueue reflection. In tests, use TestLooperManager (peekWhen()/poll() were added for this) or Espresso idling resources.",
    docUrl:      "https://developer.android.com/about/versions/17/behavior-changes-17",
    minSdkAbove: 36,
  },

  {
    id:          "API37_NATIVE_LIB_SYSTEM_LOAD",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bSystem\s*\.\s*load\s*\(/g,
    message:     "On API 37 targets, every native file loaded with System.load() must be read-only, otherwise UnsatisfiedLinkError is thrown (Safer Dynamic Code Loading now covers native libraries).",
    replacement: "Prefer System.loadLibrary() for libraries packaged in the APK. If you must load from a path, call File.setReadOnly() on it before System.load().",
    docUrl:      "https://developer.android.com/about/versions/17/behavior-changes-17",
    minSdkAbove: 36,
  },

  {
    id:          "API37_SET_REQUESTED_ORIENTATION",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\bsetRequestedOrientation\s*\(|\brequestedOrientation\s*=(?!=)/g,
    message:     "On API 37 targets, setRequestedOrientation() is ignored on large screens (smallest width ≥ 600dp) and the Android 16 opt-out no longer exists. Games (android:appCategory=\"game\") are exempt.",
    replacement: "Build an adaptive layout driven by WindowSizeClass instead of locking orientation.",
    docUrl:      "https://developer.android.com/about/versions/17/changes/ff-restrictions-ignored",
    minSdkAbove: 36,
  },

  {
    id:          "XML_ASPECT_RATIO_IGNORED",
    severity:    "warning",
    languages:   ["xml"],
    pattern:     /android:(?:min|max)AspectRatio\s*=/g,
    message:     "android:minAspectRatio / android:maxAspectRatio have no effect on large screens for apps targeting API 37.",
    replacement: "Remove the attribute and let the layout adapt; use WindowSizeClass breakpoints for layout decisions.",
    docUrl:      "https://developer.android.com/about/versions/17/changes/ff-restrictions-ignored",
    minSdkAbove: 36,
  },

  {
    id:          "API37_LOCAL_NETWORK_ACCESS",
    severity:    "warning",
    languages:   ["kotlin"],
    pattern:     /\b(?:NsdManager|MulticastSocket|MulticastLock)\b/g,
    message:     "Local network access is blocked by default for apps targeting API 37 without the ACCESS_LOCAL_NETWORK runtime permission (NEARBY_DEVICES group).",
    replacement: "Request ACCESS_LOCAL_NETWORK at runtime, or use a system-mediated device picker to avoid the prompt.",
    docUrl:      "https://developer.android.com/privacy-and-security/local-network-permission",
    minSdkAbove: 36,
  },

  {
    id:          "CAMERAX_ANDROID17_CRASH",
    severity:    "error",
    languages:   ["gradle"],
    pattern:     /androidx\.camera:camera-[a-z0-9-]+:1\.(?:[0-4]\.\d+|5\.[01])(?:-[A-Za-z0-9.]+)?(?=["'])/g,
    message:     "CameraX versions before 1.5.2 crash on Android 17 devices.",
    replacement: "Upgrade all androidx.camera artifacts to 1.5.2 or 1.6.0+ (check gradle_dependency_checker for the current stable).",
    docUrl:      "https://developer.android.com/blog/posts/android-17-is-here",
    notes:       "Applies to every device running Android 17, regardless of targetSdk.",
  },
];

// ── Rule Engine ───────────────────────────────────────────────────────────────

/**
 * Detects language from file extension or content heuristics.
 */
export function detectLanguage(code: string, hint?: string): Language {
  if (hint === "kotlin" || hint === "xml" || hint === "gradle") return hint;

  // Heuristic detection
  if (/^\s*<\?xml|<manifest|<resources|<layout|<navigation/.test(code)) return "xml";
  if (/^\s*(plugins\s*\{|dependencies\s*\{|android\s*\{)/.test(code))    return "gradle";
  if (/\bfun\b|\bval\b|\bvar\b|\bdata class\b|\bobject\b/.test(code))    return "kotlin";

  return "unknown";
}

/**
 * Blanks out comments while preserving every character offset and newline,
 * so line/column numbers stay exact. String literals are kept intact (rules
 * such as hardcoded Gradle versions and SMS_RECEIVED need their contents)
 * but are tracked so a "//" inside "https://…" is not mistaken for a comment.
 *
 * Without this, a migration note such as "// Replaced AsyncTask with
 * coroutines" would produce a FAIL verdict, and an agent following the
 * "fix and re-run until PASS" loop could loop on a violation that does not
 * exist.
 */
export function maskComments(code: string, language: Language): string {
  const out = code.split("");
  const blank = (from: number, to: number) => {
    for (let k = from; k < to; k++) if (out[k] !== "\n") out[k] = " ";
  };

  if (language === "xml") {
    const re = /<!--[\s\S]*?(?:-->|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) blank(m.index, m.index + m[0].length);
    return out.join("");
  }

  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i]!;
    const next = code[i + 1];

    // Raw string """…"""
    if (c === '"' && code.startsWith('"""', i)) {
      const close = code.indexOf('"""', i + 3);
      i = close === -1 ? n : close + 3;
      continue;
    }
    // String or char literal with escapes
    if (c === '"' || c === "'") {
      i++;
      while (i < n && code[i] !== c && code[i] !== "\n") i += code[i] === "\\" ? 2 : 1;
      i++;
      continue;
    }
    // Line comment
    if (c === "/" && next === "/") {
      const eol = code.indexOf("\n", i);
      const stop = eol === -1 ? n : eol;
      blank(i, stop);
      i = stop;
      continue;
    }
    // Block comment (Kotlin block comments nest)
    if (c === "/" && next === "*") {
      let depth = 1;
      let j = i + 2;
      while (j < n && depth > 0) {
        if (code[j] === "/" && code[j + 1] === "*") { depth++; j += 2; }
        else if (code[j] === "*" && code[j + 1] === "/") { depth--; j += 2; }
        else j++;
      }
      blank(i, j);
      i = j;
      continue;
    }
    i++;
  }
  return out.join("");
}

function buildLineStarts(code: string): number[] {
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") starts.push(i + 1);
  return starts;
}

function lineOf(lineStarts: number[], offset: number): number {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid]! <= offset) lo = mid; else hi = mid - 1;
  }
  return lo; // 0-based
}

/** Returns true when a rule's SDK gates exclude it for this context. */
export function isRuleGatedOut(rule: AndroidRule, ctx: ValidationContext): boolean {
  if (rule.minSdkAbove !== undefined && ctx.targetSdk !== undefined && ctx.targetSdk <= rule.minSdkAbove) {
    return true;
  }
  if (rule.minSdkBelow !== undefined && ctx.minSdk !== undefined && ctx.minSdk >= rule.minSdkBelow) {
    return true;
  }
  return false;
}

/**
 * Run all applicable rules against a code block.
 * Returns violations sorted by severity (errors first), then by position.
 */
export function runRules(code: string, ctx: ValidationContext): Violation[] {
  const violations: Violation[] = [];
  const lines = code.split("\n");
  const scanned = maskComments(code, ctx.language);
  const lineStarts = buildLineStarts(code);

  for (const rule of ANDROID_RULES) {
    // Skip if language doesn't match (unknown language runs every rule)
    if (ctx.language !== "unknown" && !rule.languages.includes(ctx.language)) continue;
    if (isRuleGatedOut(rule, ctx)) continue;

    // Clone so concurrent callers never share lastIndex state
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(scanned)) !== null) {
      const line = lineOf(lineStarts, match.index);
      const lineText = lines[line] ?? "";

      violations.push({
        ruleId:      rule.id,
        severity:    rule.severity,
        line:        line + 1,
        column:      match.index - lineStarts[line]! + 1,
        snippet:     lineText.trim().slice(0, 80).replace(/`/g, "'"),
        message:     rule.message,
        replacement: rule.replacement,
        docUrl:      rule.docUrl,
      });

      // Avoid infinite loops on zero-width matches
      if (match[0].length === 0) pattern.lastIndex++;
    }
  }

  // Sort: errors first, then warnings, then info; stable by position
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  return violations.sort((a, b) => order[a.severity] - order[b.severity] || a.line - b.line || a.column - b.column);
}

/**
 * Count violations by severity.
 */
export function countBySeverity(violations: Violation[]): Record<Severity, number> {
  return violations.reduce(
    (acc, v) => { acc[v.severity]++; return acc; },
    { error: 0, warning: 0, info: 0 } as Record<Severity, number>
  );
}
