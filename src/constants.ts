/**
 * AndroJack MCP – Central constants and knowledge base
 * Single Source of Truth for all allowed domains, API endpoints,
 * and the built-in component status registry.
 */

// ── Allowed Authoritative Domains ──────────────────────────────────────────
export const ALLOWED_DOMAINS = [
  "developer.android.com",
  "source.android.com",
  "kotlinlang.org",
  "gradle.org",
  "plugins.gradle.org",
  "issuetracker.google.com",
  "cs.android.com",
  "android-review.googlesource.com",
  // Maven / Gradle artifact sources — required by gradle_dependency_checker
  "search.maven.org",       // Maven Central REST API
  "dl.google.com",          // Google Maven repository (Jetpack artifacts)
] as const;

// ── Official Search Endpoints ───────────────────────────────────────────────
export const SEARCH_ENDPOINTS = {
  androidDeveloper: "https://developer.android.com/s/results",
  kotlin: "https://kotlinlang.org/search.html",
  gradlePlugins: "https://plugins.gradle.org/search",
} as const;

// ── Official Maven / Gradle BOM sources ────────────────────────────────────
export const MAVEN_SEARCH_URL = "https://search.maven.org/solrsearch/select";
export const GOOGLE_MAVEN_URL = "https://dl.google.com/dl/android/maven2";
export const JETPACK_BOM_URL =
  "https://developer.android.com/jetpack/compose/setup";

// ── HTTP Client Config ──────────────────────────────────────────────────────
export const HTTP_TIMEOUT_MS = 12_000;
export const USER_AGENT =
  "AndroJack-MCP/1.6.1 (documentation-grounding bot; not-a-scraper)";

// ── Built-in Component Status Registry ─────────────────────────────────────
// Ground truth for deprecated / replaced APIs so the tool can answer
// instantly without a network call.
export type ComponentStatus = "stable" | "deprecated" | "experimental" | "removed";

export interface ComponentEntry {
  status: ComponentStatus;
  since?: string; // API level or Kotlin/Compose version
  replacement?: string;
  docUrl: string;
  notes?: string;
}

export const COMPONENT_REGISTRY: Record<string, ComponentEntry> = {
  // ── Deprecated concurrency ──────────────────────────────────────────────
  AsyncTask: {
    status: "removed",
    since: "API 30 (deprecated) / removed in API 33",
    replacement: "Kotlin Coroutines or WorkManager",
    docUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
    notes: "Use kotlinx.coroutines for short tasks, WorkManager for deferrable background work.",
  },
  HandlerThread: {
    status: "deprecated",
    since: "API 30",
    replacement: "Kotlin Coroutines",
    docUrl: "https://developer.android.com/kotlin/coroutines",
  },
  IntentService: {
    status: "deprecated",
    since: "API 30",
    replacement: "WorkManager or JobIntentService",
    docUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
  },
  // ── Deprecated UI ───────────────────────────────────────────────────────
  "android.widget.ProgressDialog": {
    status: "deprecated",
    since: "API 26",
    replacement: "AlertDialog with custom progress view or CircularProgressIndicator (Compose)",
    docUrl: "https://developer.android.com/reference/android/app/ProgressDialog",
  },
  ListView: {
    status: "deprecated",
    replacement: "RecyclerView or LazyColumn (Jetpack Compose)",
    docUrl: "https://developer.android.com/develop/ui/compose/lists",
  },
  GridView: {
    status: "deprecated",
    replacement: "RecyclerView with GridLayoutManager or LazyVerticalGrid (Compose)",
    docUrl: "https://developer.android.com/reference/androidx/compose/foundation/lazy/grid/package-summary",
  },
  // ── Deprecated Navigation ───────────────────────────────────────────────
  "startActivityForResult": {
    status: "deprecated",
    replacement: "Activity Result API (registerForActivityResult)",
    docUrl: "https://developer.android.com/training/basics/intents/result",
  },
  // ── Stable modern components ────────────────────────────────────────────
  ViewModel: {
    status: "stable",
    docUrl: "https://developer.android.com/topic/libraries/architecture/viewmodel",
  },
  LiveData: {
    status: "stable",
    docUrl: "https://developer.android.com/topic/libraries/architecture/livedata",
    notes: "Prefer StateFlow/SharedFlow in new code for better coroutine integration.",
  },
  StateFlow: {
    status: "stable",
    docUrl: "https://developer.android.com/kotlin/flow/stateflow-and-sharedflow",
  },
  Room: {
    status: "stable",
    docUrl: "https://developer.android.com/training/data-storage/room",
  },
  WorkManager: {
    status: "stable",
    docUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
  },
  Hilt: {
    status: "stable",
    docUrl: "https://developer.android.com/training/dependency-injection/hilt-android",
  },
  Navigation: {
    status: "stable",
    docUrl: "https://developer.android.com/guide/navigation",
  },
  "Jetpack Compose": {
    status: "stable",
    docUrl: "https://developer.android.com/jetpack/compose",
  },
  Paging3: {
    status: "stable",
    docUrl: "https://developer.android.com/topic/libraries/architecture/paging/v3-overview",
  },
  DataStore: {
    status: "stable",
    replacement: "Replaces SharedPreferences",
    docUrl: "https://developer.android.com/topic/libraries/architecture/datastore",
  },
  // ── Experimental ───────────────────────────────────────────────────────
  "Compose Multiplatform": {
    status: "experimental",
    docUrl: "https://www.jetbrains.com/compose-multiplatform/",
    notes: "Stable on Android/Desktop, Beta on iOS as of 2025.",
  },
  // ── Credential Manager ─────────────────────────────────────────────────────
  CredentialManager: {
    status: "stable",
    since: "Jetpack Credentials 1.x (backported to API 16+)",
    docUrl: "https://developer.android.com/training/sign-in/credential-manager",
    notes: "Replaces AccountManager and legacy Sign-in with Google. Supports passkeys.",
    replacement: "Already the replacement — use this.",
  },
  AccountManager: {
    status: "deprecated",
    replacement: "CredentialManager (androidx.credentials)",
    docUrl: "https://developer.android.com/training/sign-in/credential-manager",
  },
  // ── Health Connect ─────────────────────────────────────────────────────────
  HealthConnect: {
    status: "stable",
    since: "API 26+ via Health Connect app / API 35 built-in",
    docUrl: "https://developer.android.com/health-and-fitness/guides/health-connect",
    notes: "Use HealthConnectClient. Requires permissions and Health Connect app on API < 35.",
  },
  // ── Photo Picker ───────────────────────────────────────────────────────────
  PhotoPicker: {
    status: "stable",
    since: "API 33 native / backported to API 19 via Jetpack",
    docUrl: "https://developer.android.com/training/data-storage/shared/photopicker",
    notes: "Zero runtime permissions needed. Use ActivityResultContracts.PickVisualMedia().",
  },
  // ── Predictive Back ────────────────────────────────────────────────────────
  PredictiveBack: {
    status: "stable",
    since: "API 34 gesture / mandatory for API 35 targets",
    docUrl: "https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture",
    notes: "Use OnBackPressedCallback or Compose BackHandler. Required for API 35 targets.",
  },
  // ── Loader (fix docUrl — was pointing to ViewModel) ───────────────────────
  Loader: {
    status: "deprecated",
    since: "API 28",
    replacement: "ViewModel + LiveData/StateFlow",
    docUrl: "https://developer.android.com/reference/androidx/loader/app/LoaderManager",
    notes: "Loaders are deprecated. Use ViewModel + Repository pattern.",
  },
  // ── Compose 1.8 Deprecations ───────────────────────────────────────────────
  ContextualFlowRow: {
    status: "deprecated",
    since: "Compose 1.8 (2025)",
    replacement: "FlowRow with standard overflow handling",
    docUrl: "https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary",
    notes: "ContextualFlowRow was deprecated in Compose 1.8. AI tools still generate it. Use standard FlowRow.",
  },
  ContextualFlowColumn: {
    status: "deprecated",
    since: "Compose 1.8 (2025)",
    replacement: "FlowColumn with standard overflow handling",
    docUrl: "https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/package-summary",
    notes: "ContextualFlowColumn was deprecated in Compose 1.8. Use standard FlowColumn.",
  },
  AnchoredDraggableState: {
    status: "deprecated",
    since: "Compose 1.8 (confirmValueChange parameter)",
    replacement: "AnchoredDraggableState without confirmValueChange — use snapTo() for controlled transitions",
    docUrl: "https://developer.android.com/reference/kotlin/androidx/compose/material/package-summary",
    notes: "The confirmValueChange constructor parameter is deprecated in Compose 1.8. Migrate to the new constructor.",
  },
  TestCoroutineDispatcher: {
    status: "removed",
    since: "kotlinx-coroutines-test 1.8+ (2024)",
    replacement: "StandardTestDispatcher (for sequential test execution) or UnconfinedTestDispatcher (eager execution)",
    docUrl: "https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/",
    notes: "TestCoroutineDispatcher was removed. StandardTestDispatcher is the replacement. runTest{} handles dispatcher setup automatically in most cases.",
  },
  TestCoroutineScope: {
    status: "removed",
    since: "kotlinx-coroutines-test 1.8+",
    replacement: "runTest { } block — replaces TestCoroutineScope entirely",
    docUrl: "https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-test/kotlinx.coroutines.test/run-test.html",
    notes: "TestCoroutineScope is removed. Use runTest { } for all coroutine tests.",
  },
  // ── Compose 1.10 (2025) New Stable APIs — NOT deprecated, but AI tools may not know them ──
  // Listed as stable so component_status confirms they exist when AI tools are uncertain
  PausableComposition: {
    status: "stable",
    since: "Compose 1.10 (2025)",
    docUrl: "https://developer.android.com/jetpack/compose/performance/bestpractices",
    notes: "Pausable Composition is opt-in in Compose 1.10 — improves performance for complex list items by allowing composition to pause and resume.",
  },
  // ── Navigation 3 (stable Nov 2025) ─────────────────────────────────────────
  NavController: {
    status: "deprecated",
    since: "Navigation 3 stable (November 2025) supersedes Nav2 pattern",
    replacement: "rememberNavBackStack() from Navigation 3 — back stack as plain Kotlin list",
    docUrl: "https://developer.android.com/guide/navigation/navigation-3",
    notes: "NavController is the Nav2 API. For new projects, use Navigation 3: rememberNavBackStack + NavDisplay + NavKey. NavController still works for existing Nav2 projects.",
  },
  NavHost: {
    status: "deprecated",
    since: "Navigation 3 stable (November 2025) supersedes Nav2 pattern",
    replacement: "NavDisplay from Navigation 3",
    docUrl: "https://developer.android.com/guide/navigation/navigation-3",
    notes: "NavHost is the Nav2 API. For new projects use NavDisplay from Navigation 3. NavHost still works for existing Nav2 projects.",
  },
};

// ── Architecture Topics → Official Guide URLs ──────────────────────────────
export const ARCHITECTURE_GUIDES: Record<string, string> = {
  mvvm: "https://developer.android.com/topic/architecture",
  "app architecture": "https://developer.android.com/topic/architecture",
  viewmodel: "https://developer.android.com/topic/libraries/architecture/viewmodel",
  livedata: "https://developer.android.com/topic/libraries/architecture/livedata",
  stateflow: "https://developer.android.com/kotlin/flow/stateflow-and-sharedflow",
  compose: "https://developer.android.com/jetpack/compose/documentation",
  navigation: "https://developer.android.com/guide/navigation",
  hilt: "https://developer.android.com/training/dependency-injection/hilt-android",
  "dependency injection": "https://developer.android.com/training/dependency-injection",
  workmanager: "https://developer.android.com/topic/libraries/architecture/workmanager",
  paging: "https://developer.android.com/topic/libraries/architecture/paging/v3-overview",
  room: "https://developer.android.com/training/data-storage/room",
  datastore: "https://developer.android.com/topic/libraries/architecture/datastore",
  coroutines: "https://developer.android.com/kotlin/coroutines",
  flow: "https://developer.android.com/kotlin/flow",
  testing: "https://developer.android.com/training/testing",
  "ui testing": "https://developer.android.com/training/testing/espresso",
  "unit testing": "https://developer.android.com/training/testing/local-tests",
  retrofit: "https://square.github.io/retrofit/",
  "network layer": "https://developer.android.com/training/volley",
  lifecycle: "https://developer.android.com/topic/libraries/architecture/lifecycle",
  "app startup": "https://developer.android.com/topic/libraries/app-startup",
  "modular architecture": "https://developer.android.com/topic/modularization",
  performance: "https://developer.android.com/topic/performance",
  accessibility: "https://developer.android.com/guide/topics/ui/accessibility",
  security: "https://developer.android.com/topic/security/best-practices",
};

// ── M3 Expressive additions to component registry ───────────────────────────
// These are added at runtime into COMPONENT_REGISTRY via Object.assign below
export const M3E_COMPONENT_ADDITIONS: Record<string, ComponentEntry> = {
  BottomAppBar: {
    status: "deprecated",
    since: "Material 3 Expressive (2025)",
    replacement: "DockedToolbar (M3 Expressive) or HorizontalFloatingToolbar",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "BottomAppBar still works but DockedToolbar is the M3E successor. Requires ExperimentalMaterial3ExpressiveApi.",
  },
  MaterialExpressiveTheme: {
    status: "stable",
    since: "M3 Expressive / material3:1.4.x",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "Wrap your app with MaterialExpressiveTheme instead of MaterialTheme to get expressive MotionScheme by default.",
  },
  ButtonGroup: {
    status: "experimental",
    since: "M3 Expressive / material3:1.4.x",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "Requires @OptIn(ExperimentalMaterial3ExpressiveApi::class). Replaces SegmentedButton for filter pill use cases.",
  },
  FloatingToolbar: {
    status: "experimental",
    since: "M3 Expressive / material3:1.4.x",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "HorizontalFloatingToolbar or VerticalFloatingToolbar. Replaces FAB + BottomAppBar combo. Requires ExperimentalMaterial3ExpressiveApi.",
  },
  LoadingIndicator: {
    status: "experimental",
    since: "M3 Expressive / material3:1.4.x",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "Animated wavy indeterminate indicator. Use instead of CircularProgressIndicator where motion fits.",
  },
  MotionScheme: {
    status: "experimental",
    since: "M3 Expressive / material3:1.4.x",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "Use MaterialTheme.motionScheme.defaultSpatialSpec() for animations instead of hardcoded spring()/tween().",
  },
  MaterialShapes: {
    status: "experimental",
    since: "M3 Expressive / material3:1.4.x",
    docUrl: "https://developer.android.com/develop/ui/compose/designsystems/material3",
    notes: "35 preset morphable shapes. Use .toShape() for clipping and Morph() for animated transitions.",
  },
  SharedPreferences: {
    status: "deprecated",
    replacement: "DataStore (Preferences DataStore or Proto DataStore)",
    docUrl: "https://developer.android.com/topic/libraries/architecture/datastore",
    notes: "SharedPreferences has no Flow support and blocks the main thread. Migrate to DataStore.",
  },
  "android.app.Notification.Builder": {
    status: "deprecated",
    since: "API 26",
    replacement: "NotificationCompat.Builder with a NotificationChannel",
    docUrl: "https://developer.android.com/develop/ui/views/notifications/build-notification",
    notes: "On API 26+ you MUST create a NotificationChannel before posting notifications.",
  },
  Loader: {
    status: "deprecated",
    since: "API 28",
    replacement: "ViewModel + LiveData/StateFlow",
    docUrl: "https://developer.android.com/topic/libraries/architecture/viewmodel",
  },
  SupportMapFragment: {
    status: "deprecated",
    replacement: "MapView with Maps SDK 19+ or Compose GoogleMap()",
    docUrl: "https://developers.google.com/maps/documentation/android-sdk/maps-compose",
  },
  "android.hardware.Camera": {
    status: "removed",
    since: "API 21 (deprecated) — use Camera2 or CameraX",
    replacement: "CameraX (recommended) or Camera2",
    docUrl: "https://developer.android.com/training/camerax",
    notes: "CameraX is the Jetpack wrapper over Camera2 with lifecycle awareness.",
  },
};

// Merge M3E additions into the main registry
Object.assign(COMPONENT_REGISTRY, M3E_COMPONENT_ADDITIONS);

// ── M3 Expressive architecture guide entries ─────────────────────────────────
Object.assign(ARCHITECTURE_GUIDES, {
  "m3 expressive": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "material3 expressive": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "material expressive": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "m3e": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "materialexpressivetheme": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "motionscheme": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "materialshapes": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "theming": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "dynamic color": "https://developer.android.com/develop/ui/compose/designsystems/material-you",
  "wear m3": "https://developer.android.com/design/ui/wear/guides/get-started/apply",
  "compose theming": "https://developer.android.com/develop/ui/compose/designsystems/material3",
  "large screen": "https://developer.android.com/guide/topics/large-screens/get-started-with-large-screens",
  "foldable": "https://developer.android.com/guide/topics/large-screens/learn-about-foldables",
  "windowsizeclass": "https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes",
  "photo picker": "https://developer.android.com/training/data-storage/shared/photopicker",
  "credential manager": "https://developer.android.com/training/sign-in/credential-manager",
  "passkey": "https://developer.android.com/training/sign-in/passkeys",
  "health connect": "https://developer.android.com/health-and-fitness/guides/health-connect",
  "predictive back": "https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture",
  "paging 3": "https://developer.android.com/topic/libraries/architecture/paging/v3-overview",
  "offline first": "https://developer.android.com/topic/architecture/data-layer/offline-first",
  "sync": "https://developer.android.com/training/sync-adapters",
  "camerax": "https://developer.android.com/training/camerax",
  "adaptive layout": "https://developer.android.com/develop/ui/compose/layouts/adaptive",
  "splash screen": "https://developer.android.com/develop/ui/views/launch/splash-screen",
  "edge to edge": "https://developer.android.com/develop/ui/compose/layouts/insets",
  "insets": "https://developer.android.com/develop/ui/compose/layouts/insets",
  "baseline profiles": "https://developer.android.com/topic/performance/baselineprofiles",
  "proguard": "https://developer.android.com/build/shrink-code",
  "r8": "https://developer.android.com/build/shrink-code",
  "app bundle": "https://developer.android.com/guide/app-bundle",
  "play store": "https://developer.android.com/distribute/best-practices/launch",
  "biometric": "https://developer.android.com/training/sign-in/biometric-auth",
  "keystore": "https://developer.android.com/training/articles/keystore",
  // Navigation 3 (stable Nov 2025)
  "navigation 3": "https://developer.android.com/guide/navigation/navigation-3",
  "nav3": "https://developer.android.com/guide/navigation/navigation-3",
  "navdisplay": "https://developer.android.com/guide/navigation/navigation-3",
  "navbackstack": "https://developer.android.com/guide/navigation/navigation-3",
  "nav3 migration": "https://developer.android.com/guide/navigation/navigation-3/migrate",
  "nav3 adaptive": "https://developer.android.com/guide/navigation/navigation-3/adaptive",
  // Kotlin Multiplatform
  "kmp": "https://kotlinlang.org/docs/multiplatform.html",
  "kotlin multiplatform": "https://kotlinlang.org/docs/multiplatform.html",
  "compose multiplatform": "https://www.jetbrains.com/lp/compose-multiplatform/",
  "expect actual": "https://kotlinlang.org/docs/multiplatform-expect-actual.html",
  "ktor": "https://ktor.io/docs/client-create-multiplatform-application.html",
  "room kmp": "https://developer.android.com/kotlin/multiplatform/room",
  // On-Device AI
  "aicore": "https://developer.android.com/ai/aicore",
  "on-device ai": "https://developer.android.com/ai/aicore",
  "ml kit genai": "https://developers.google.com/ml-kit/genai",
  "ml kit": "https://developers.google.com/ml-kit",
  "smart reply": "https://developers.google.com/ml-kit/genai",
  // Android XR
  "android xr": "https://developer.android.com/xr",
  "compose xr": "https://developer.android.com/develop/ui/compose/xr",
  "xr": "https://developer.android.com/xr",
  "spatial ui": "https://developer.android.com/develop/ui/compose/xr/spatial-ui",
  "arcore xr": "https://developers.google.com/ar/develop/android-xr",
  // Wear OS
  "wear os": "https://developer.android.com/training/wearables",
  "wear compose": "https://developer.android.com/training/wearables/compose",
  "wear tiles": "https://developer.android.com/training/articles/wear-tiles",
  "health services": "https://developer.android.com/health-and-fitness/guides/health-services",
  // Android 16 / API 36
  "android 16": "https://developer.android.com/about/versions/16",
  "api 36": "https://developer.android.com/about/versions/16",
  "large screen compliance": "https://developer.android.com/docs/quality-guidelines/large-screen-app-quality",
  // Play Store Policies
  "play policy": "https://support.google.com/googleplay/android-developer/answer/9904549",
  "data safety": "https://support.google.com/googleplay/android-developer/answer/10787469",
  "play billing": "https://developer.android.com/google/play/billing",
});
