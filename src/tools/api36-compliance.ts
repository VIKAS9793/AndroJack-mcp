// Tool 15: Android 16 / API 36 Compliance Checker
// Google Play mandate: all apps must target API 36 by August 2026.
// Android 16 removed the ability to lock orientation or restrict resizability on ≥600dp devices.

export async function androidApi36Compliance(topic: string): Promise<string> {
  const t = topic.toLowerCase().trim();

  const overview = `
# Android 16 / API 36 Compliance Reference
Source: https://developer.android.com/about/versions/16/behavior-changes-all

## The Mandate

Google Play requires all apps to **target API 36 by August 2026**.
Android 16 (API 36) introduced breaking changes for large-screen device behavior.
Apps that fail compliance checks will receive warning badges in Play Store listings
and may be demoted in search results.

## What Changed in Android 16 — The Breaking Rules

### 1. Mandatory Resizability on Large Screens (≥600dp)
On devices with width ≥600dp (tablets, foldables, ChromeOS), apps can NO LONGER:
- Lock screen orientation
- Restrict aspect ratio
- Disable multi-window/resizability

The platform **overrides** these flags on ≥600dp devices. Apps must handle any aspect ratio.

### 2. Predictive Back — Required for API 36 Targets
Apps targeting API 36 must implement Predictive Back Gesture.
The legacy \`OnBackPressedCallback\` alone is insufficient — use \`BackHandler\` in Compose
or the \`OnBackPressedDispatcher\` with \`createOnBackPressedCallback { }\`.

### 3. 16 KB Page Size — Native Code
Apps with native (NDK/JNI) libraries must be compiled for 16 KB memory page alignment.
Android Studio shows a lint warning for non-compliant APKs. Failure = crash on affected hardware.

## ❌ Manifest Flags That Now FAIL on Large Screens

\`\`\`xml
<!-- ❌ ILLEGAL on ≥600dp devices in Android 16 -->
<activity
  android:screenOrientation="portrait"
  android:screenOrientation="landscape"
  android:screenOrientation="sensorPortrait"
  android:resizeableActivity="false"
  android:maxAspectRatio="1.86"   <!-- Restricts to phone ratio — illegal on large screens -->
/>
\`\`\`

## ✅ Correct Manifest for API 36 Compliance

\`\`\`xml
<activity
  android:name=".MainActivity"
  android:exported="true"
  android:windowSoftInputMode="adjustResize"
  <!-- NO screenOrientation — let the system decide -->
  <!-- NO resizeableActivity="false" -->
  <!-- NO maxAspectRatio restriction -->
>
\`\`\`

## Games Exception

Games are exempt from the mandatory resizability requirement if declared:
\`\`\`xml
<application android:appCategory="game">
\`\`\`
Users can also opt individual apps into their preferred behavior via device settings.

Source: https://developer.android.com/about/versions/16/behavior-changes-all#large-screen
`;

  const layouts = `
# Android 16 — Canonical Adaptive Layout Patterns
Source: https://developer.android.com/guide/topics/large-screens/support-different-screen-sizes

## The Four Canonical Layouts (Google's Reference Implementations)

### 1. List-Detail (Gmail, Messages)
\`\`\`kotlin
// Use Navigation 3 + Scenes API for List-Detail
// Or use ListDetailPaneScaffold from Material3 Adaptive
implementation("androidx.compose.material3.adaptive:adaptive:1.1.0")
implementation("androidx.compose.material3.adaptive:adaptive-navigation:1.1.0")

@Composable
fun MailApp() {
  val navigator = rememberListDetailPaneScaffoldNavigator<String>()
  ListDetailPaneScaffold(
    directive = navigator.scaffoldDirective,
    value = navigator.scaffoldValue,
    listPane = {
      InboxPane(onEmailClick = { id ->
        navigator.navigateTo(ListDetailPaneScaffoldRole.Detail, id)
      })
    },
    detailPane = {
      val emailId = navigator.currentDestination?.content
      if (emailId != null) EmailDetailPane(emailId)
      else EmptyDetailPane()
    }
  )
}
\`\`\`

### 2. Feed (Photos, Play Store)
\`\`\`kotlin
// Adaptive grid — columns based on WindowWidthSizeClass
@Composable
fun AdaptiveFeed(items: List<Item>) {
  val windowInfo = currentWindowAdaptiveInfo()
  val columns = when (windowInfo.windowSizeClass.windowWidthSizeClass) {
    WindowWidthSizeClass.COMPACT  -> 1
    WindowWidthSizeClass.MEDIUM   -> 2
    WindowWidthSizeClass.EXPANDED -> 3
    else -> 1
  }
  LazyVerticalGrid(columns = GridCells.Fixed(columns)) {
    items(items) { item -> FeedCard(item) }
  }
}
\`\`\`

### 3. Supporting Pane (Docs, Sheets)
\`\`\`kotlin
// Primary content + persistent tool panel on large screens
// SupportingPaneScaffold from Material3 Adaptive
@Composable
fun DocumentEditor() {
  val navigator = rememberSupportingPaneScaffoldNavigator()
  SupportingPaneScaffold(
    directive = navigator.scaffoldDirective,
    value = navigator.scaffoldValue,
    mainPane = { DocumentContent() },
    supportingPane = { FormattingPanel() }
  )
}
\`\`\`

### 4. Navigation Suite Scaffold (automatic chrome switching)
\`\`\`kotlin
// Single API — auto-switches BottomBar → Rail → Drawer based on window size
@Composable
fun AppWithAdaptiveNav(content: @Composable () -> Unit) {
  NavigationSuiteScaffold(
    navigationSuiteItems = {
      AppDestination.entries.forEach { destination ->
        item(
          icon = { Icon(destination.icon, contentDescription = destination.label) },
          label = { Text(destination.label) },
          selected = currentDestination == destination,
          onClick = { /* navigate */ }
        )
      }
    }
  ) {
    content()
  }
}
\`\`\`

Source: https://developer.android.com/guide/topics/large-screens/canonical-app-layouts
`;

  const checklist = `
# Android 16 Compliance Checklist — Play Store Large-Screen Quality Tiers
Source: https://developer.android.com/docs/quality-guidelines/large-screen-app-quality

## Tier 3: Large Screen Ready (Minimum — required to avoid warning badge)
- [ ] No fixed orientation locks (no \`screenOrientation\` in manifest)
- [ ] No \`resizeableActivity="false"\`
- [ ] No hardcoded aspect ratio restrictions (\`maxAspectRatio\`)
- [ ] App does not crash or lose data on configuration change (rotation, resize)
- [ ] Keyboard/mouse basic support (for ChromeOS)
- [ ] Multi-window does not break app functionality

## Tier 2: Large Screen Optimized
Everything in Tier 3, plus:
- [ ] Adaptive layouts using WindowSizeClass breakpoints
- [ ] NavigationSuiteScaffold (auto-switches nav chrome by window size)
- [ ] No content clipped or unreachable in landscape/large screen
- [ ] Proper inset handling (\`WindowInsets\`, \`safeDrawing\`, \`imePadding\`)

## Tier 1: Large Screen Differentiated (Editors' Choice eligible)
Everything in Tier 2, plus:
- [ ] Multi-pane layout using ListDetailPaneScaffold or Nav3 Scenes
- [ ] Foldable hinge awareness (FoldingFeature API)
- [ ] Drag-and-drop support between panes
- [ ] App-level keyboard shortcuts
- [ ] Contextual menus on right-click

## Critical Code Patterns for Compliance

### Configuration Change Survival
\`\`\`kotlin
// ViewModel automatically survives rotation — use it
class MyViewModel : ViewModel() {
  val uiState: StateFlow<MyUiState> = ...
}

// For non-ViewModel state, use rememberSaveable
var selectedId by rememberSaveable { mutableStateOf<String?>(null) }
\`\`\`

### Inset Handling (Required — no content behind nav bars)
\`\`\`kotlin
Scaffold(
  modifier = Modifier.fillMaxSize()
) { paddingValues ->
  LazyColumn(
    contentPadding = paddingValues, // ALWAYS pass scaffold padding
    modifier = Modifier.imePadding() // keyboard avoidance
  ) { ... }
}
\`\`\`

### WindowSizeClass — The Correct Import (not the deprecated one)
\`\`\`kotlin
// ✅ Correct — currentWindowAdaptiveInfo() from WindowManager
val adaptiveInfo = currentWindowAdaptiveInfo()
val widthClass = adaptiveInfo.windowSizeClass.windowWidthSizeClass

// ❌ Deprecated — calculateWindowSizeClass(activity) is the old API
\`\`\`

Source: https://developer.android.com/docs/quality-guidelines/large-screen-app-quality
`;

  const predictiveBack = `
# Android 16 — Predictive Back Gesture (Required for API 36)
Source: https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture

## What Changed

Predictive Back is mandatory for apps targeting API 36. The system now previews
the "behind" screen during a back swipe before the user completes it.

## Implementation in Compose

\`\`\`kotlin
// In AndroidManifest.xml — opt in (required for API 33-35, automatic for API 36)
<application android:enableOnBackInvokedCallback="true">

// In Compose — BackHandler handles predictive back correctly
@Composable
fun ScreenWithCustomBack(onBack: () -> Unit) {
  BackHandler(enabled = true) {
    // Custom back logic — e.g., close drawer before popping screen
    onBack()
  }
}
\`\`\`

## Predictive Back for Multi-Step Flows
\`\`\`kotlin
@Composable
fun MultiStepForm(currentStep: Int, onStepBack: () -> Unit, onExit: () -> Unit) {
  BackHandler(enabled = currentStep > 0) {
    onStepBack() // Go to previous step, not previous screen
  }
  // When currentStep == 0, BackHandler is disabled → system handles back → pops screen
}
\`\`\`

## Navigation 3 — Predictive Back is Automatic
When using Navigation 3 (rememberNavBackStack + NavDisplay), predictive back works
out of the box — NavDisplay registers a BackHandler that removes the last entry.
No extra setup required.

Source: https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture
`;

  if (t.includes("layout") || t.includes("pane") || t.includes("adaptive") || t.includes("canonical")) {
    return layouts;
  }
  if (t.includes("checklist") || t.includes("quality") || t.includes("tier") || t.includes("play store")) {
    return checklist;
  }
  if (t.includes("back") || t.includes("predictive")) {
    return predictiveBack;
  }

  // ── Android 17 / API 37 redirect ─────────────────────────────────────────
  if (
    t.includes("17") || t.includes("api 37") || t.includes("api37") ||
    t.includes("static final") || t.includes("local network") ||
    t.includes("access_local") || t.includes("sms otp") ||
    t.includes("handoff") || t.includes("npu")
  ) {
    return (
      "## Android 17 / API 37 — Use the android_api37_compliance tool\n\n" +
      "Android 17 reached platform stability on March 26, 2026. For API 37-specific " +
      "breaking changes (static final reflection, ACCESS_LOCAL_NETWORK, SMS OTP delay, " +
      "Handoff API, NPU feature declaration), call **android_api17_compliance** directly.\n\n" +
      "Source: https://developer.android.com/about/versions/17"
    );
  }

  return overview + "\n\n---\n\n" +
    "**Query topics:** 'layouts' (canonical adaptive patterns), 'checklist' (Play Store quality tiers), " +
    "'predictive back' (API 36 back gesture requirement), 'page size' (16 KB native alignment)\n\n" +
    "For Android 17 / API 37 compliance, use the **android_api17_compliance** tool.\n\n" +
    "Source: https://developer.android.com/about/versions/16";
}
