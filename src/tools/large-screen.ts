/**
 * Tool 12 – android_large_screen_guide
 *
 * Complete reference for Android large screen and adaptive layout development.
 * Google Play Store quality guidelines require apps to properly support
 * tablets, foldables, and ChromeOS — this tool enforces that standard.
 *
 * Sources:
 *   - developer.android.com/guide/topics/large-screens
 *   - developer.android.com/develop/ui/compose/layouts/adaptive
 *   - developer.android.com/develop/ui/views/layout/responsive-ui
 */

interface LargeScreenTopic {
  keywords: string[];
  content: string;
}

// ── Knowledge base ─────────────────────────────────────────────────────────────

const OVERVIEW = `
## Android Large Screen & Adaptive Layout Overview

### Why this matters — Play Store quality bar (2024+)
Google Play now surfaces large-screen-optimized apps preferentially on tablets and foldables.
Apps that don't support large screens receive lower quality ratings that reduce discovery.

### The three device classes (WindowSizeClass)

| Class | Width | Typical Device |
|-------|-------|---------------|
| Compact | < 600dp | Phone portrait |
| Medium | 600–840dp | Phone landscape, foldable, small tablet |
| Expanded | > 840dp | Tablet, large foldable unfolded, ChromeOS |

Rule: **Design for Compact first, adapt for Medium and Expanded.**

### Key Jetpack libraries

\`\`\`kotlin
// libs.versions.toml
window = { group = "androidx.window", name = "window", version = "1.4.0" }
adaptive = { group = "androidx.compose.material3.adaptive", name = "adaptive", version = "1.1.0" }
adaptive-nav = { group = "androidx.compose.material3.adaptive", name = "adaptive-navigation", version = "1.1.0" }

// build.gradle.kts
implementation(libs.window)
implementation(libs.adaptive)
implementation(libs.adaptive.nav)
\`\`\`

**Official guide:** https://developer.android.com/guide/topics/large-screens/get-started-with-large-screens
`;

const WINDOW_SIZE_CLASS = `
## WindowSizeClass — Adaptive Layout Foundation

\`\`\`kotlin
// Source: developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes

// ── In your Activity / entry Composable ──────────────────────────────
@Composable
fun App() {
    // currentWindowAdaptiveInfo provides WindowSizeClass + FoldingFeature
    val adaptiveInfo = currentWindowAdaptiveInfo()
    val windowSizeClass = adaptiveInfo.windowSizeClass

    AppContent(windowSizeClass = windowSizeClass)
}

@Composable
fun AppContent(windowSizeClass: WindowSizeClass) {
    when {
        windowSizeClass.isWidthAtLeastBreakpoint(WindowSizeClass.WIDTH_DP_EXPANDED_LOWER_BOUND) -> {
            // Expanded — show two-pane layout (list + detail side-by-side)
            TwoPaneLayout()
        }
        windowSizeClass.isWidthAtLeastBreakpoint(WindowSizeClass.WIDTH_DP_MEDIUM_LOWER_BOUND) -> {
            // Medium — show navigation rail
            NavigationRailLayout()
        }
        else -> {
            // Compact — show bottom navigation
            BottomNavLayout()
        }
    }
}
\`\`\`

### WindowSizeClass breakpoints (dp)

| Breakpoint constant | Value |
|---------------------|-------|
| WIDTH_DP_COMPACT_LOWER_BOUND | 0dp |
| WIDTH_DP_MEDIUM_LOWER_BOUND | 600dp |
| WIDTH_DP_EXPANDED_LOWER_BOUND | 840dp |
| HEIGHT_DP_COMPACT_LOWER_BOUND | 0dp |
| HEIGHT_DP_MEDIUM_LOWER_BOUND | 480dp |
| HEIGHT_DP_EXPANDED_LOWER_BOUND | 900dp |
`;

const NAVIGATION_PATTERNS = `
## Adaptive Navigation — M3 NavigationSuiteScaffold

The correct M3 pattern adapts navigation component type automatically based on window size.

\`\`\`kotlin
// Source: developer.android.com/develop/ui/compose/layouts/adaptive/adaptive-navigation-suite-scaffold

// ── Setup ─────────────────────────────────────────────────────────────
// Dependency:
// implementation("androidx.compose.material3:material3-adaptive-navigation-suite:1.4.0")

enum class AppDestination(val icon: ImageVector, val label: String) {
    HOME(Icons.Filled.Home, "Home"),
    SEARCH(Icons.Filled.Search, "Search"),
    PROFILE(Icons.Filled.Person, "Profile"),
}

@Composable
fun AdaptiveApp() {
    var currentDest by remember { mutableStateOf(AppDestination.HOME) }

    // NavigationSuiteScaffold automatically switches between:
    // - BottomNavigationBar (Compact width)
    // - NavigationRail (Medium width)
    // - NavigationDrawer (Expanded width)
    NavigationSuiteScaffold(
        navigationSuiteItems = {
            AppDestination.entries.forEach { dest ->
                item(
                    icon = { Icon(dest.icon, contentDescription = dest.label) },
                    label = { Text(dest.label) },
                    selected = currentDest == dest,
                    onClick = { currentDest = dest }
                )
            }
        }
    ) {
        when (currentDest) {
            AppDestination.HOME    -> HomeScreen()
            AppDestination.SEARCH  -> SearchScreen()
            AppDestination.PROFILE -> ProfileScreen()
        }
    }
}
\`\`\`
`;

const TWO_PANE = `
## Two-Pane List-Detail Layout

The canonical large screen pattern: list on left, detail on right.
Use ListDetailPaneScaffold from the Adaptive library.

\`\`\`kotlin
// Source: developer.android.com/develop/ui/compose/layouts/adaptive/list-detail-pane-scaffold

@Composable
fun UserListDetailScreen() {
    val navigator = rememberListDetailPaneScaffoldNavigator<Int>()

    BackHandler(navigator.canNavigateBack()) {
        navigator.navigateBack()
    }

    ListDetailPaneScaffold(
        directive = navigator.scaffoldDirective,
        value = navigator.scaffoldValue,
        listPane = {
            AnimatedPane {
                UserList(
                    onUserClick = { userId ->
                        navigator.navigateTo(ListDetailPaneScaffoldRole.Detail, userId)
                    }
                )
            }
        },
        detailPane = {
            AnimatedPane {
                navigator.currentDestination?.content?.let { userId ->
                    UserDetailScreen(userId = userId)
                } ?: run {
                    // Placeholder shown when no item is selected
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Select a user")
                    }
                }
            }
        }
    )
}
\`\`\`

### Key behaviors
- **Compact** — full-screen list; detail replaces list on navigation
- **Expanded** — list and detail shown side-by-side simultaneously
- **BackHandler** required — system back should navigate back to list on compact
`;

const FOLDABLES = `
## Foldables — Hinge & Fold Awareness

\`\`\`kotlin
// Source: developer.android.com/guide/topics/large-screens/learn-about-foldables

@Composable
fun FoldAwareLayout() {
    val foldingFeature = currentWindowAdaptiveInfo().windowPosture.hingeList.firstOrNull()

    if (foldingFeature != null && foldingFeature.isSeparating) {
        // Device is folded at the hinge — show content on each half
        val hingeLeft  = foldingFeature.bounds.left
        val hingeRight = foldingFeature.bounds.right
        // Place content avoiding the hinge area
        TwoHalvesLayout(leftBound = hingeLeft, rightBound = hingeRight)
    } else {
        // Unfolded or non-foldable — standard layout
        StandardLayout()
    }
}

// ── WindowInfoTracker for non-Compose contexts ────────────────────────
// In an Activity or Fragment:
lifecycleScope.launch {
    lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
        WindowInfoTracker.getOrCreate(this@MainActivity)
            .windowLayoutInfo(this@MainActivity)
            .collect { layoutInfo ->
                val foldingFeatures = layoutInfo.displayFeatures
                    .filterIsInstance<FoldingFeature>()
                // React to fold state changes
            }
    }
}
\`\`\`

### FoldingFeature properties
| Property | Values | Meaning |
|----------|--------|---------|
| \`state\` | FLAT, HALF_OPENED | Current fold angle |
| \`orientation\` | HORIZONTAL, VERTICAL | Hinge direction |
| \`isSeparating\` | true/false | Whether hinge occludes content |
| \`occlusionType\` | NONE, FULL | Whether hinge is physically present |
`;

const CONTINUITY = `
## Continuity — Surviving Configuration Changes

Large screen apps get more configuration changes (fold/unfold, rotation, window resize).

\`\`\`kotlin
// ── ViewModel survives ALL config changes ─────────────────────────────
// (already the correct pattern — nothing extra needed)

// ── Compose state that survives process death ─────────────────────────
// Use rememberSaveable + a custom saver for complex types:
@Composable
fun PersistentScreen() {
    var selectedId by rememberSaveable { mutableStateOf<Int?>(null) }
    // selectedId survives rotation, fold, and process death
}

// ── For complex types, write a Saver: ─────────────────────────────────
val UiStateSaver = Saver<UiState, Int>(
    save = { state -> (state as? UiState.Success)?.data?.id ?: -1 },
    restore = { id -> if (id >= 0) UiState.Success(User(id, "")) else UiState.Loading }
)
var state by rememberSaveable(stateSaver = UiStateSaver) { mutableStateOf(UiState.Loading) }

// ── Test config changes in unit test ──────────────────────────────────
// ActivityScenario handles rotation:
activityScenario.onActivity { activity ->
    activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
}
// Verify ViewModel state persists across rotation
\`\`\`

### Manifest — do NOT disable config changes for large screen
\`\`\`xml
<!-- ❌ Anti-pattern — breaks system-managed resizing on large screens -->
<activity android:configChanges="orientation|screenSize|smallestScreenSize|screenLayout">

<!-- ✅ Let the system handle it; use ViewModel + rememberSaveable -->
<!-- No configChanges needed for most apps -->
\`\`\`
`;

const PLAY_QUALITY = `
## Google Play Large Screen Quality Guidelines

**Source:** developer.android.com/docs/quality-guidelines/large-screen-app-quality

### Tier 1 — Large Screen Optimized (required for Featured placement)
- [ ] App functional in landscape orientation on tablet
- [ ] No hardcoded portrait-only orientation in manifest
- [ ] No distortion or pixel-scaling artifacts on large screen
- [ ] Correctly handles multi-window (split-screen) mode
- [ ] UI is not stretched/letter-boxed — uses full width on tablets
- [ ] \`resizeableActivity\` not set to \`false\`

### Tier 2 — Large Screen Ready
- [ ] NavigationSuiteScaffold or equivalent (Rail on medium, Drawer on expanded)
- [ ] Two-pane list-detail layout for list → detail flows on expanded
- [ ] No input devices missing (keyboard, mouse support for ChromeOS)
- [ ] Keyboard navigation works via Tab and arrow keys
- [ ] Predictive back gesture implemented

### Manifest requirements
\`\`\`xml
<manifest>
    <!-- Support all screen sizes -->
    <supports-screens
        android:smallScreens="true"
        android:normalScreens="true"
        android:largeScreens="true"
        android:xlargeScreens="true"
        android:resizeable="true" />

    <application>
        <!-- CRITICAL: Do NOT set android:screenOrientation="portrait" for any Activity -->
        <!-- CRITICAL: Do NOT set android:resizeableActivity="false" -->
        <activity android:name=".MainActivity"
            android:windowSoftInputMode="adjustResize" />
    </application>
</manifest>
\`\`\`

**Checklist tool:** https://developer.android.com/docs/quality-guidelines/large-screen-app-quality
`;

// ── WindowManager 1.5.0 — Large and Extra-large breakpoints (NEW March 2026) ──

const WINDOW_SIZE_CLASS_EXTENDED = `
## WindowManager 1.5.0 — New Width Breakpoints (March 2026)
Source: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes

### What Changed in WindowManager 1.5.0

Two new width size classes were added:

| Class | Width Range | Typical Device |
|-------|------------|----------------|
| Compact | < 600dp | Phone portrait |
| Medium | 600–840dp | Phone landscape, small tablet |
| Expanded | 840–1200dp | Tablet, large foldable unfolded |
| **Large** (NEW) | **1200–1600dp** | **Desktop, external monitor** |
| **Extra-large** (NEW) | **1600dp+** | **27"+ monitor, large display** |

### Why This Matters

On a 27-inch monitor, a two-pane layout looks stretched. WindowManager 1.5.0
signals when to add a third or fourth pane. AI tools trained before this
release will only generate Compact/Medium/Expanded patterns — missing the
high-density desktop layouts.

### Updated Dependencies

\`\`\`toml
# libs.versions.toml
[versions]
window = "1.5.0"   # WindowManager 1.5.0+

[libraries]
window = { group = "androidx.window", name = "window", version.ref = "window" }
adaptive = { group = "androidx.compose.material3.adaptive", name = "adaptive", version = "1.1.0" }
\`\`\`

### Updated WindowSizeClass Switch

\`\`\`kotlin
// Source: developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
@Composable
fun AdaptiveLayout() {
  val adaptiveInfo = currentWindowAdaptiveInfo()
  val widthClass = adaptiveInfo.windowSizeClass.windowWidthSizeClass

  when {
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.EXTRA_LARGE) -> {
      // 1600dp+ — four-pane layout for very large displays
      FourPaneLayout()
    }
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.LARGE) -> {
      // 1200–1600dp — three-pane layout (list + detail + tool panel)
      ThreePaneLayout()
    }
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.EXPANDED) -> {
      // 840–1200dp — two-pane layout
      TwoPaneLayout()
    }
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.MEDIUM) -> {
      // 600–840dp — navigation rail
      NavigationRailLayout()
    }
    else -> {
      // < 600dp — single pane with bottom nav
      SinglePaneLayout()
    }
  }
}
\`\`\`

### SupportingPaneScaffold for Three-Pane

\`\`\`kotlin
// Three-pane with primary + detail + supporting panel
@Composable
fun ThreePaneDocEditor() {
  SupportingPaneScaffold(
    directive = rememberSupportingPaneScaffoldNavigator().scaffoldDirective,
    value = rememberSupportingPaneScaffoldNavigator().scaffoldValue,
    mainPane   = { DocumentContent() },       // always visible
    detailPane = { DocumentOutline() },        // visible on Expanded+
    supportingPane = { FormattingPanel() },    // visible on Large+
  )
}
\`\`\`

### Adaptive Grid — Columns by All Five Classes

\`\`\`kotlin
@Composable
fun AdaptiveFeed(items: List<Item>) {
  val widthClass = currentWindowAdaptiveInfo().windowSizeClass.windowWidthSizeClass
  val columns = when {
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.EXTRA_LARGE) -> 5
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.LARGE)       -> 4
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.EXPANDED)    -> 3
    widthClass.isAtLeastBreakpoint(WindowWidthSizeClass.MEDIUM)      -> 2
    else -> 1  // Compact
  }
  LazyVerticalGrid(columns = GridCells.Fixed(columns)) {
    items(items) { FeedCard(it) }
  }
}
\`\`\`

Source: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes
`;

// ── Topic routing ──────────────────────────────────────────────────────────────

const TOPICS: LargeScreenTopic[] = [
  { keywords: ["overview", "intro", "what is", "large screen", "adaptive", "why"], content: OVERVIEW },
  { keywords: ["windowsizeclass", "window size", "breakpoint", "compact", "medium", "expanded", "class"], content: WINDOW_SIZE_CLASS },
  { keywords: ["large breakpoint", "extra-large", "extra large", "1200", "1600", "five class", "desktop breakpoint", "windowmanager 1.5", "three pane", "four pane"], content: WINDOW_SIZE_CLASS_EXTENDED },
  { keywords: ["navigation", "rail", "drawer", "bottom nav", "navigationsuitescaffold", "adaptive nav"], content: NAVIGATION_PATTERNS },
  { keywords: ["two pane", "twopane", "list detail", "split", "listdetailpane", "detail pane"], content: TWO_PANE },
  { keywords: ["fold", "foldable", "hinge", "unfold", "half", "windowinfotracker", "foldingfeature"], content: FOLDABLES },
  { keywords: ["config", "continuity", "rotation", "orientation", "rememberSaveable", "configChanges", "survive", "persist"], content: CONTINUITY },
  { keywords: ["play", "quality", "tier", "checklist", "guideline", "requirement", "manifest", "optimize"], content: PLAY_QUALITY },
];

const INDEX = `
## Android Large Screen & Adaptive Layout Guide

**Query topics available:**

| Topic | Example query |
|-------|----|
| Overview & device classes | "large screen overview" |
| WindowSizeClass | "windowsizeclass breakpoints" |
| Adaptive navigation | "NavigationSuiteScaffold" |
| List-detail two-pane | "ListDetailPaneScaffold" |
| Foldables & hinge | "foldable hinge FoldingFeature" |
| Config change continuity | "survive rotation rememberSaveable" |
| Play Store quality bar | "Play quality checklist" |

**Official sources:**
- https://developer.android.com/guide/topics/large-screens
- https://developer.android.com/develop/ui/compose/layouts/adaptive
- https://developer.android.com/docs/quality-guidelines/large-screen-app-quality
`;

export async function androidLargeScreenGuide(topic: string): Promise<string> {
  const trimmed = topic.trim();

  if (!trimmed || trimmed.toLowerCase() === "list" || trimmed.toLowerCase() === "help") {
    return INDEX;
  }

  const lower = trimmed.toLowerCase();
  const found = TOPICS.find(t => t.keywords.some(k => lower.includes(k)));

  if (found) {
    return (
      found.content.trim() +
      `\n\n---\n` +
      `**Official docs:** https://developer.android.com/guide/topics/large-screens\n` +
      `> 📐 GROUNDING GATE: Large screen code must use WindowSizeClass, NavigationSuiteScaffold, and ListDetailPaneScaffold — not hardcoded pixel values or orientation locks.`
    );
  }

  return (
    `## Large Screen: "${trimmed}"\n\n` +
    `No built-in entry found. Check:\n` +
    `- https://developer.android.com/guide/topics/large-screens\n` +
    `- https://developer.android.com/develop/ui/compose/layouts/adaptive\n\n` +
    INDEX
  );
}
