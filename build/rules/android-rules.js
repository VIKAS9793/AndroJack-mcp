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
// ── Rule Definitions ──────────────────────────────────────────────────────────
export const ANDROID_RULES = [
    // ── ERRORS: breaks at runtime or fails Play Store ─────────────────────────
    {
        id: "REMOVED_ASYNCTASK",
        severity: "error",
        languages: ["kotlin"],
        pattern: /\bAsyncTask\b/g,
        message: "AsyncTask was removed in API 33. Apps targeting API 33+ will crash.",
        replacement: "Use Kotlin Coroutines (viewModelScope.launch) or WorkManager for background tasks.",
        docUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
        notes: "AsyncTask was deprecated API 30, removed API 33. Even if minSdk < 33, generate coroutines.",
    },
    {
        id: "REMOVED_TEST_COROUTINE_DISPATCHER",
        severity: "error",
        languages: ["kotlin"],
        pattern: /\bTestCoroutineDispatcher\b/g,
        message: "TestCoroutineDispatcher was removed in kotlinx-coroutines-test 1.8+. Causes CI failures.",
        replacement: "Use StandardTestDispatcher() with advanceUntilIdle(), or UnconfinedTestDispatcher() for eager execution.",
        docUrl: "https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/",
        notes: "runTest{} with StandardTestDispatcher is the correct migration path. MainDispatcherRule handles setup.",
    },
    {
        id: "REMOVED_TEST_COROUTINE_SCOPE",
        severity: "error",
        languages: ["kotlin"],
        pattern: /\bTestCoroutineScope\b/g,
        message: "TestCoroutineScope was removed in kotlinx-coroutines-test 1.8+.",
        replacement: "Replace TestCoroutineScope with the runTest { } block — it provides the scope automatically.",
        docUrl: "https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/kotlinx.coroutines.test/run-test.html",
    },
    {
        id: "GLOBALSCOPE_LAUNCH",
        severity: "error",
        languages: ["kotlin"],
        pattern: /GlobalScope\s*\.\s*launch\b/g,
        message: "GlobalScope.launch leaks coroutines — not bound to any lifecycle. Causes memory leaks and crashes.",
        replacement: "Use viewModelScope.launch (ViewModel), lifecycleScope.launch (Activity/Fragment), or rememberCoroutineScope() (Compose).",
        docUrl: "https://developer.android.com/kotlin/coroutines/coroutines-best-practices#create-coroutines-data-layer",
    },
    {
        id: "GLOBALSCOPE_ASYNC",
        severity: "error",
        languages: ["kotlin"],
        pattern: /GlobalScope\s*\.\s*async\b/g,
        message: "GlobalScope.async leaks coroutines — not bound to any lifecycle.",
        replacement: "Use viewModelScope.async or structured concurrency patterns.",
        docUrl: "https://developer.android.com/kotlin/coroutines/coroutines-best-practices",
    },
    {
        id: "XML_SCREEN_ORIENTATION_LOCK",
        severity: "error",
        languages: ["xml"],
        pattern: /android:screenOrientation\s*=\s*["'](portrait|landscape|sensorPortrait|sensorLandscape|reversePortrait|reverseLandscape)["']/gi,
        message: "android:screenOrientation locks break Android 16 / API 36 compliance on ≥600dp devices (tablets, foldables).",
        replacement: "Remove the screenOrientation attribute. Use WindowSizeClass to handle orientation-specific layouts in code.",
        docUrl: "https://developer.android.com/about/versions/16/behavior-changes-16",
        notes: "Play Store mandates API 36 targeting by August 2026. Apps with orientation locks fail large-screen quality checks.",
        minSdkAbove: 29, // only enforce aggressively for modern targets
    },
    {
        id: "XML_RESIZE_DISABLED",
        severity: "error",
        languages: ["xml"],
        pattern: /android:resizeableActivity\s*=\s*["']false["']/gi,
        message: "android:resizeableActivity=\"false\" is illegal on ≥600dp devices under Android 16 / API 36.",
        replacement: "Remove this attribute entirely. Design adaptive layouts with WindowSizeClass instead.",
        docUrl: "https://developer.android.com/about/versions/16/behavior-changes-16",
    },
    {
        id: "RUNBLOCKING_UI",
        severity: "error",
        languages: ["kotlin"],
        pattern: /runBlocking\s*\{/g,
        message: "runBlocking on the main/UI thread causes ANR. Blocks the calling thread until the coroutine completes.",
        replacement: "Use launch{} or async/await with a coroutine scope. Reserve runBlocking for tests and top-level main() only.",
        docUrl: "https://developer.android.com/kotlin/coroutines/coroutines-best-practices#avoid-using-runblocking",
    },
    {
        id: "THREAD_SLEEP_IN_TEST",
        severity: "error",
        languages: ["kotlin"],
        pattern: /Thread\.sleep\s*\(/g,
        message: "Thread.sleep() in tests causes flakiness. It's an arbitrary wait, not a coroutine-aware suspension.",
        replacement: "Use advanceUntilIdle() for coroutine tests, or waitUntil { condition } for Compose UI tests.",
        docUrl: "https://developer.android.com/training/testing/local-tests",
    },
    {
        id: "START_ACTIVITY_FOR_RESULT",
        severity: "error",
        languages: ["kotlin"],
        pattern: /\.\s*startActivityForResult\s*\(/g,
        message: "startActivityForResult() is deprecated. Removed from the recommended Android API surface.",
        replacement: "Use registerForActivityResult() with ActivityResultContracts. Handles all result-returning Activities.",
        docUrl: "https://developer.android.com/training/basics/intents/result",
    },
    // ── WARNINGS: deprecated, will break in a future release ──────────────────
    {
        id: "DEPRECATED_CONTEXTUAL_FLOW_ROW",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bContextualFlowRow\b/g,
        message: "ContextualFlowRow was deprecated in Compose 1.8 (2025). AI tools still generate it.",
        replacement: "Use FlowRow from androidx.compose.foundation.layout with standard overflow handling.",
        docUrl: "https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary",
    },
    {
        id: "DEPRECATED_CONTEXTUAL_FLOW_COLUMN",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bContextualFlowColumn\b/g,
        message: "ContextualFlowColumn was deprecated in Compose 1.8 (2025). AI tools still generate it.",
        replacement: "Use FlowColumn from androidx.compose.foundation.layout with standard overflow handling.",
        docUrl: "https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary",
    },
    {
        id: "DEPRECATED_NAV_CONTROLLER_NEW_CODE",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /rememberNavController\s*\(\s*\)/g,
        message: "rememberNavController() is the Navigation 2 API. Navigation 3 is stable since November 2025.",
        replacement: "For new projects: use rememberNavBackStack() from Navigation 3 (androidx.navigation:navigation-compose:2.x).",
        docUrl: "https://developer.android.com/guide/navigation/navigation-3",
        notes: "NavController still works for existing Nav2 projects. Apply this warning only to new code.",
    },
    {
        id: "DEPRECATED_NAV_HOST",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bNavHost\s*\(/g,
        message: "NavHost is the Navigation 2 API. Navigation 3 (stable Nov 2025) uses NavDisplay.",
        replacement: "For new projects: use NavDisplay from Navigation 3.",
        docUrl: "https://developer.android.com/guide/navigation/navigation-3",
    },
    {
        id: "DEPRECATED_INTENTSERVICE",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bIntentService\b/g,
        message: "IntentService was deprecated in API 30.",
        replacement: "Use WorkManager for deferrable background work, or coroutines with a Service for immediate work.",
        docUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
    },
    {
        id: "DEPRECATED_HANDLER_THREAD",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bHandlerThread\b/g,
        message: "HandlerThread was deprecated in API 30.",
        replacement: "Use Kotlin Coroutines with Dispatchers.Default or a custom CoroutineDispatcher.",
        docUrl: "https://developer.android.com/kotlin/coroutines",
    },
    {
        id: "DEPRECATED_SHARED_PREFERENCES",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bgetSharedPreferences\b|\bSharedPreferences\b/g,
        message: "SharedPreferences blocks the main thread and has no Flow/coroutine support.",
        replacement: "Migrate to DataStore (Preferences DataStore for key-value, Proto DataStore for typed data).",
        docUrl: "https://developer.android.com/topic/libraries/architecture/datastore",
    },
    {
        id: "DEPRECATED_LIVEDATA_NEW_CODE",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bMutableLiveData\s*<|LiveData\s*<|liveData\s*\{/g,
        message: "LiveData is legacy. Prefer StateFlow/SharedFlow for better coroutine and Compose integration.",
        replacement: "Use MutableStateFlow<T> with StateFlow<T> in ViewModel. Observe with collectAsStateWithLifecycle() in Compose.",
        docUrl: "https://developer.android.com/kotlin/flow/stateflow-and-sharedflow",
        notes: "LiveData is not removed — existing code is fine. Apply this warning only to new ViewModel code.",
    },
    {
        id: "DEPRECATED_BOTTOM_APP_BAR_M3E",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bBottomAppBar\s*\(/g,
        message: "BottomAppBar is superseded by DockedToolbar in Material 3 Expressive (2025).",
        replacement: "Use DockedToolbar or HorizontalFloatingToolbar from material3:1.4.x. Requires @OptIn(ExperimentalMaterial3ExpressiveApi::class).",
        docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    },
    {
        id: "GRADLE_KAPT_NEW_PROJECT",
        severity: "warning",
        languages: ["gradle"],
        pattern: /\bkapt\s*["']/g,
        message: "KAPT (kapt annotation processor) is slower than KSP and deprecated for most Jetpack libraries.",
        replacement: "Migrate to KSP (ksp plugin + ksp() dependency declaration). Room, Hilt, and Moshi all support KSP.",
        docUrl: "https://developer.android.com/build/migrate-to-ksp",
    },
    {
        id: "DEPRECATED_ACCOUNT_MANAGER",
        severity: "warning",
        languages: ["kotlin"],
        pattern: /\bAccountManager\b/g,
        message: "AccountManager is deprecated for authentication flows.",
        replacement: "Use CredentialManager (androidx.credentials) — supports passkeys, passwords, and federated sign-in.",
        docUrl: "https://developer.android.com/training/sign-in/credential-manager",
    },
    // ── INFO: suboptimal pattern, not wrong today ─────────────────────────────
    {
        id: "INFO_HARDCODED_DISPATCH_MAIN",
        severity: "info",
        languages: ["kotlin"],
        pattern: /Dispatchers\.Main\b/g,
        message: "Dispatchers.Main is fine for production but makes unit tests harder (requires MainDispatcherRule).",
        replacement: "Inject dispatchers via constructor for testability. Use MainDispatcherRule in tests.",
        docUrl: "https://developer.android.com/kotlin/coroutines/coroutines-best-practices#inject-dispatchers",
    },
    {
        id: "INFO_GRADLE_HARDCODED_VERSION",
        severity: "info",
        languages: ["gradle"],
        pattern: /implementation\s*\(\s*["'][^"']+:\d+\.\d+[^"']*["']\s*\)/g,
        message: "Hardcoded dependency version. Consider using version catalogs (libs.versions.toml) for consistency.",
        replacement: "Define versions in libs.versions.toml and reference via libs.* accessors.",
        docUrl: "https://developer.android.com/build/migrate-to-version-catalogs",
    },
    {
        id: "INFO_ON_BACK_PRESSED_OVERRIDE",
        severity: "info",
        languages: ["kotlin"],
        pattern: /override\s+fun\s+onBackPressed\s*\(\s*\)/g,
        message: "onBackPressed() override is legacy. Does not support predictive back gesture (Android 14+).",
        replacement: "Use OnBackPressedCallback (registered via onBackPressedDispatcher) or BackHandler in Compose.",
        docUrl: "https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture",
    },
];
// ── Rule Engine ───────────────────────────────────────────────────────────────
/**
 * Detects language from file extension or content heuristics.
 */
export function detectLanguage(code, hint) {
    if (hint === "kotlin" || hint === "xml" || hint === "gradle")
        return hint;
    // Heuristic detection
    if (/^\s*<\?xml|<manifest|<resources|<layout|<navigation/.test(code))
        return "xml";
    if (/^\s*(plugins\s*\{|dependencies\s*\{|android\s*\{)/.test(code))
        return "gradle";
    if (/\bfun\b|\bval\b|\bvar\b|\bdata class\b|\bobject\b/.test(code))
        return "kotlin";
    return "unknown";
}
/**
 * Run all applicable rules against a code block.
 * Returns violations sorted by severity (errors first).
 */
export function runRules(code, ctx) {
    const violations = [];
    const lines = code.split("\n");
    for (const rule of ANDROID_RULES) {
        // Skip if language doesn't match
        if (!rule.languages.includes(ctx.language) && !rule.languages.includes("unknown")) {
            if (ctx.language !== "unknown")
                continue;
        }
        // Skip context-filtered rules
        if (rule.minSdkAbove !== undefined && ctx.targetSdk !== undefined) {
            if (ctx.targetSdk <= rule.minSdkAbove)
                continue;
        }
        // Reset lastIndex for global regexes
        rule.pattern.lastIndex = 0;
        let match;
        while ((match = rule.pattern.exec(code)) !== null) {
            // Find line number
            const before = code.slice(0, match.index);
            const lineNumber = before.split("\n").length;
            const lineText = lines[lineNumber - 1] ?? "";
            const column = match.index - before.lastIndexOf("\n");
            violations.push({
                ruleId: rule.id,
                severity: rule.severity,
                line: lineNumber,
                column: Math.max(0, column),
                snippet: lineText.trim().slice(0, 80),
                message: rule.message,
                replacement: rule.replacement,
                docUrl: rule.docUrl,
            });
            // Avoid infinite loops on zero-width matches
            if (match[0].length === 0)
                rule.pattern.lastIndex++;
        }
        // Reset for next use
        rule.pattern.lastIndex = 0;
    }
    // Sort: errors first, then warnings, then info
    const order = { error: 0, warning: 1, info: 2 };
    return violations.sort((a, b) => order[a.severity] - order[b.severity]);
}
/**
 * Count violations by severity.
 */
export function countBySeverity(violations) {
    return violations.reduce((acc, v) => { acc[v.severity]++; return acc; }, { error: 0, warning: 0, info: 0 });
}
