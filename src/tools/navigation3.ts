// Tool 14: Navigation 3 Guide
// Navigation 3 went stable November 2025 — complete architectural rethink from Nav2.
// This tool exists because AI tools hallucinate Nav2 code for new projects even with
// internet access (documented Atomic Robot case study, January 2026).

export async function androidNavigation3Guide(topic: string): Promise<string> {
  const t = topic.toLowerCase().trim();

  // ── Overview / default ─────────────────────────────────────────────────────
  const overview = `
# Navigation 3 — Official Reference (Stable, November 2025)
Source: https://developer.android.com/guide/navigation/navigation-3

## ⚠️ CRITICAL FOR AI TOOLS
Navigation 3 is the current official navigation library as of November 2025.
Do NOT generate Navigation 2 (NavController/NavHost/NavGraph) for new projects.
Google's Nav3 migration docs contain explicit "AI Agent:" annotations — this is how
aware Google is that AI tools hallucinate stale navigation code.

## Why Nav3 Is a Breaking Paradigm Shift (Not Just a Version Bump)

| Concept | Navigation 2 | Navigation 3 |
|---------|-------------|-------------|
| Back stack | Internal library state | Plain Kotlin List<NavEntry<*>> |
| State management | NavController owns it | You own it (observable, testable) |
| Navigation trigger | NavController.navigate() | Add/remove from your back stack list |
| Graph definition | NavHost + composable() destinations | NavDisplay + type-safe NavKey |
| Adaptive layouts | Separate NavigationSuiteScaffold | Built-in via Scenes API |
| State persistence | rememberSaveable | rememberNavBackStack (custom serialization) |
| Testing | Hard — internal state | Easy — back stack is a plain list |

## Core Setup

\`\`\`kotlin
// libs.versions.toml
[versions]
navigation3 = "1.0.0"  // Stable November 2025

[libraries]
navigation3-compose = { group = "androidx.navigation3", name = "navigation3-ui", version.ref = "navigation3" }
navigation3-runtime = { group = "androidx.navigation3", name = "navigation3-runtime", version.ref = "navigation3" }
\`\`\`

\`\`\`kotlin
// build.gradle.kts
implementation(libs.navigation3.compose)
implementation(libs.navigation3.runtime)
\`\`\`

## NavKey — Type-Safe Destination Keys

\`\`\`kotlin
// Each destination is a serializable key — NOT a route string
@Serializable
data object HomeKey  // Simple screen

@Serializable
data class ProfileKey(val userId: String)  // Screen with args — type-safe, no stringly-typed routes

@Serializable
data class DetailKey(val itemId: Int, val title: String)
\`\`\`

## rememberNavBackStack — Your Back Stack

\`\`\`kotlin
// The back stack is a plain Kotlin list you control
// NOT NavController.navigate() — you add/remove entries directly
val backStack = rememberNavBackStack(HomeKey)  // Start with HomeKey

// Navigate forward
backStack.add(ProfileKey(userId = "abc123"))

// Go back
backStack.removeLastOrNull()

// Go back to specific destination (like popUpTo)
backStack.removeAll { it.key is ProfileKey }

// Replace current
backStack[backStack.lastIndex] = DetailKey(itemId = 1, title = "Item")
\`\`\`

## NavDisplay — The Renderer

\`\`\`kotlin
@Composable
fun AppNavigation() {
  val backStack = rememberNavBackStack(HomeKey)

  NavDisplay(
    backStack = backStack,
    entryProvider = entryProvider {
      entry<HomeKey> { HomeScreen(onNavigateToProfile = { id -> backStack.add(ProfileKey(id)) }) }
      entry<ProfileKey> { key -> ProfileScreen(userId = key.userId) }
      entry<DetailKey> { key -> DetailScreen(itemId = key.itemId, title = key.title) }
    }
  )
}
\`\`\`

## State Persistence — rememberSerializable (NOT rememberSaveable)

\`\`\`kotlin
// ❌ WRONG — rememberSaveable does NOT work for NavBackStack
val backStack = rememberSaveable { mutableStateListOf(HomeKey) }

// ✅ CORRECT — rememberNavBackStack uses rememberSerializable internally
// All NavKey types MUST be @Serializable
val backStack = rememberNavBackStack(HomeKey)
\`\`\`

Source: https://developer.android.com/guide/navigation/navigation-3#state-persistence
`;

  // ── Scenes API ─────────────────────────────────────────────────────────────
  const scenes = `
# Navigation 3 — Scenes API (Adaptive Multi-Pane)
Source: https://developer.android.com/guide/navigation/navigation-3/adaptive

## What Scenes Does

The Scenes API replaces the need to combine NavigationSuiteScaffold + separate adaptive
logic. Nav3 Scenes makes the back stack itself adaptive — the same back stack entries
automatically render as single-pane on phones or multi-pane on tablets/foldables.

\`\`\`kotlin
// Additional dependency for Scenes
implementation("androidx.navigation3:navigation3-adaptive:1.0.0")
\`\`\`

## List-Detail with Scenes

\`\`\`kotlin
@Serializable data object InboxKey
@Serializable data class EmailKey(val emailId: String)

@Composable
fun AdaptiveMailApp() {
  val backStack = rememberNavBackStack(InboxKey)
  val adaptiveInfo = currentWindowAdaptiveInfo()

  NavDisplay(
    backStack = backStack,
    // Scenes tells NavDisplay how many entries to show simultaneously
    sceneStrategy = rememberListDetailSceneStrategy(),
    entryProvider = entryProvider {
      entry<InboxKey> {
        InboxScreen(onEmailClick = { id -> backStack.add(EmailKey(id)) })
      }
      entry<EmailKey> { key ->
        // On phone: full screen. On tablet: side-by-side with Inbox.
        // Zero conditional logic here — Scenes handles it.
        EmailDetailScreen(emailId = key.emailId)
      }
    }
  )
}
\`\`\`

## Custom Scene Strategy

\`\`\`kotlin
// Show up to 2 entries side-by-side on Expanded width
val sceneStrategy = remember {
  TwoPaneSceneStrategy<Any>(
    showTwoPanes = { adaptiveInfo ->
      adaptiveInfo.windowSizeClass.windowWidthSizeClass == WindowWidthSizeClass.EXPANDED
    }
  )
}
\`\`\`

Source: https://developer.android.com/guide/navigation/navigation-3/adaptive
`;

  // ── Migration from Nav2 ────────────────────────────────────────────────────
  const migration = `
# Navigation 3 — Migrating from Navigation 2
Source: https://developer.android.com/guide/navigation/navigation-3/migrate

## AI Agent: Read This Section Carefully
Google embedded "AI Agent:" annotations in the official Nav3 migration guide specifically
because AI tools were hallucinating outdated Nav3 code. This tool surfaces the key points.

## API Mapping

| Navigation 2 | Navigation 3 Equivalent |
|-------------|------------------------|
| NavController | rememberNavBackStack (your list) |
| NavHost | NavDisplay |
| composable("route") { } | entry<MyKey> { } |
| navController.navigate("route") | backStack.add(MyKey) |
| navController.popBackStack() | backStack.removeLastOrNull() |
| navController.navigate("route") { popUpTo("other") } | backStack.removeAll { it.key is OtherKey }; backStack.add(MyKey) |
| arguments bundle | NavKey constructor params (type-safe) |
| NavDeepLink | Handled separately, not via NavKey |
| NavGraph nesting | Just add entries — no graph nesting concept |

## Migration Steps

1. **Replace string routes with @Serializable data class/object NavKeys**
\`\`\`kotlin
// Before (Nav2)
composable("profile/{userId}") { backStackEntry ->
  val userId = backStackEntry.arguments?.getString("userId")
  ProfileScreen(userId)
}

// After (Nav3)
@Serializable data class ProfileKey(val userId: String)
entry<ProfileKey> { key -> ProfileScreen(key.userId) }
\`\`\`

2. **Replace NavController with your back stack**
\`\`\`kotlin
// Before
navController.navigate("profile/abc123")

// After
backStack.add(ProfileKey(userId = "abc123"))
\`\`\`

3. **Remove NavHost, replace with NavDisplay**
\`\`\`kotlin
// Before
NavHost(navController, startDestination = "home") { ... }

// After
NavDisplay(backStack = backStack, entryProvider = entryProvider { ... })
\`\`\`

4. **Update ViewModel navigation** — pass backStack as a parameter or use a shared state holder
\`\`\`kotlin
// ViewModel cannot hold NavBackStack directly (lifecycle reasons)
// Pass navigation callbacks instead
@Composable
fun HomeScreen(onNavigateToProfile: (String) -> Unit) { ... }

// In NavDisplay entry:
entry<HomeKey> {
  HomeScreen(onNavigateToProfile = { id -> backStack.add(ProfileKey(id)) })
}
\`\`\`

## What Does NOT Change in Nav3

- Bottom navigation / NavigationRail / NavigationDrawer — still use NavigationSuiteScaffold
  (or use the Scenes API which does it automatically for the content area)
- Deep links — handled at the Activity level, then push the appropriate NavKey onto the stack
- ViewModel scoping — still use viewModel() inside entry { } blocks, scoped to that entry

Source: https://developer.android.com/guide/navigation/navigation-3/migrate
`;

  // ── Testing ────────────────────────────────────────────────────────────────
  const testing = `
# Navigation 3 — Testing
Source: https://developer.android.com/guide/navigation/navigation-3/testing

## Why Nav3 Testing Is Easier Than Nav2

The back stack is a plain Kotlin list. You don't need a NavController mock.
You don't need NavHostFragment. You just observe the list.

\`\`\`kotlin
@Test
fun navigatingToProfile_addsProfileKeyToBackStack() {
  // Arrange
  val backStack = mutableStateListOf<Any>(HomeKey)

  // Act
  backStack.add(ProfileKey(userId = "user1"))

  // Assert — direct list assertion, no NavController involved
  assertThat(backStack.last()).isEqualTo(ProfileKey(userId = "user1"))
  assertThat(backStack.size).isEqualTo(2)
}

@Test
fun backPress_removesLastEntry() {
  val backStack = mutableStateListOf<Any>(HomeKey, ProfileKey("u1"))
  backStack.removeLastOrNull()
  assertThat(backStack.last()).isEqualTo(HomeKey)
}
\`\`\`

## Compose UI Test with Nav3

\`\`\`kotlin
@get:Rule val composeTestRule = createComposeRule()

@Test
fun clickingProfile_showsProfileScreen() {
  val backStack = mutableStateListOf<Any>(HomeKey)

  composeTestRule.setContent {
    NavDisplay(
      backStack = backStack,
      entryProvider = entryProvider {
        entry<HomeKey> { HomeScreen(onNavigateToProfile = { backStack.add(ProfileKey(it)) }) }
        entry<ProfileKey> { key -> ProfileScreen(userId = key.userId) }
      }
    )
  }

  composeTestRule.onNodeWithTag("profileButton").performClick()
  composeTestRule.onNodeWithText("Profile").assertIsDisplayed()
  assertThat(backStack.last()).isInstanceOf(ProfileKey::class.java)
}
\`\`\`

Source: https://developer.android.com/guide/navigation/navigation-3/testing
`;

  // ── Route dispatch ─────────────────────────────────────────────────────────
  if (t.includes("scene") || t.includes("adaptive") || t.includes("pane") || t.includes("tablet")) {
    return scenes;
  }
  if (t.includes("migrat") || t.includes("nav2") || t.includes("upgrade")) {
    return migration;
  }
  if (t.includes("test")) {
    return testing;
  }
  if (t.includes("key") || t.includes("backstack") || t.includes("back stack") || t.includes("display")) {
    return overview;
  }

  // Default: overview + scenes summary
  return overview + "\n\n---\n\n" + scenes.split("\n## What Scenes Does")[0] +
    "\n\n## Quick Scenes Example\n" +
    "For adaptive list-detail navigation, use `rememberListDetailSceneStrategy()` — " +
    "the same back stack renders as single-pane on phones and two-pane on tablets.\n" +
    "Query 'scenes' for the full example.\n\n" +
    "**Other topics:** 'migration' (from Nav2), 'testing', 'scenes' (adaptive multi-pane)\n\n" +
    "Source: https://developer.android.com/guide/navigation/navigation-3";
}
