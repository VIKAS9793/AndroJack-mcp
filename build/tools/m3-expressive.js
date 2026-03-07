/**
 * Tool 8 – material3_expressive
 *
 * Complete reference for Material 3 Expressive — Google's design system
 * announced May 2025, GA on Android 16 / QPR1 September 2025.
 *
 * Covers: new components, MaterialExpressiveTheme, MotionScheme,
 * MaterialShapes, shape morphing, typography updates, migration from M3,
 * Wear OS M3 Expressive, and anti-patterns.
 *
 * All knowledge sourced from:
 *  - developer.android.com/develop/ui/compose/designsystems/material3
 *  - developer.android.com/jetpack/androidx/releases/compose-material3
 *  - android-developers.googleblog.com (Androidify I/O 2025 post)
 *  - m3.material.io/blog/building-with-m3-expressive
 */
import { secureFetch, extractPageText } from "../http.js";
// ── Knowledge base ───────────────────────────────────────────────────────────
const M3E_OVERVIEW = `
## Material 3 Expressive (M3E) — Full Reference

**Announced:** Google I/O, May 2025
**GA on device:** Android 16 QPR1, September 2025 (Pixel 6+, Pixel Tablet)
**Compose dependency:** \`androidx.compose.material3:material3:1.4.x\`
**Opt-in annotation:** \`@OptIn(ExperimentalMaterial3ExpressiveApi::class)\`

M3 Expressive is NOT a new Material version ("Material 4").
It is an extension of Material You (M3 / Material Design 3) — same library,
new components and motion primitives layered on top.

### What's new vs plain M3
| Area | M3 | M3 Expressive |
|------|-----|--------------|
| Theme entry point | \`MaterialTheme\` | \`MaterialExpressiveTheme\` (wraps MaterialTheme + expressive MotionScheme by default) |
| Motion | Static tweens | Physics-based \`MotionScheme\` (standard vs expressive) |
| Shapes | 5-step scale | 35-shape \`MaterialShapes\` library + shape morphing |
| Typography | Fixed weights | Variable fonts (weight + width axes) |
| New components | — | ButtonGroup, FloatingToolbar, DockedToolbar, FlexibleBottomAppBar, LoadingIndicator, SplitButtonLayout, FABMenu, ShortNavigationBar, WideNavigationRail |
| Bottom bar | \`BottomAppBar\` | \`DockedToolbar\` (BottomAppBar deprecated in favour of it) |
`;
const THEME_SETUP = `
## Setting Up MaterialExpressiveTheme

### Gradle dependency
\`\`\`kotlin
// build.gradle.kts (app)
implementation("androidx.compose.material3:material3:1.4.0-beta01") // check latest
\`\`\`

### Theme wrapper
\`\`\`kotlin
// Source: android-developers.googleblog.com (Androidify, Google I/O 2025)
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun AppTheme(content: @Composable () -> Unit) {
    MaterialExpressiveTheme(          // ← replaces MaterialTheme
        colorScheme = dynamicColorScheme(LocalContext.current),
        typography = Typography,
        shapes = Shapes(),
        motionScheme = MotionScheme.expressive(),   // or .standard()
        content = content
    )
}
\`\`\`

### MotionScheme tokens — use in custom animations
\`\`\`kotlin
// Spatial (position/size/shape changes)
val spatialSpec = MaterialTheme.motionScheme.defaultSpatialSpec<Float>()
// Effects (opacity, color, blur)
val effectsSpec = MaterialTheme.motionScheme.defaultEffectsSpec<Float>()

// Example: animate a shape change with the themed spec
val animatedSpec = MaterialTheme.motionScheme.defaultSpatialSpec<Float>()
val animatedCorner by animateFloatAsState(
    targetValue = if (selected) 50f else 12f,
    animationSpec = animatedSpec
)
\`\`\`

> ✅ GROUNDING GATE: Use \`MotionScheme.expressive()\` for playful consumer apps,
> \`MotionScheme.standard()\` for productivity/enterprise apps.
`;
const NEW_COMPONENTS = `
## New & Updated M3 Expressive Components

### 1. ButtonGroup
Groups related buttons with fluid shape-morphing on selection.
Requires \`@OptIn(ExperimentalMaterial3ExpressiveApi::class)\`.

\`\`\`kotlin
// Single-select ButtonGroup
// Source: proandroiddev.com M3 Expressive series + composables.com docs
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun FilterButtonGroup() {
    val options = listOf("All", "Unread", "Starred")
    var selected by remember { mutableIntStateOf(0) }

    ButtonGroup(overflowIndicator = {}) {
        options.forEachIndexed { index, label ->
            toggleableItem(
                checked = selected == index,
                onCheckedChange = { selected = index },
                label = label
            )
        }
    }
}

// Multi-select with custom connected shapes
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun MultiSelectButtonGroup() {
    val checked = remember { mutableStateListOf(false, false, false) }
    Row(horizontalArrangement = Arrangement.spacedBy(ButtonGroupDefaults.ConnectedSpaceBetween)) {
        listOf("Work", "Home", "Café").forEachIndexed { i, label ->
            ToggleButton(
                checked = checked[i],
                onCheckedChange = { checked[i] = it },
                shapes = when (i) {
                    0    -> ButtonGroupDefaults.connectedLeadingButtonShapes()
                    2    -> ButtonGroupDefaults.connectedTrailingButtonShapes()
                    else -> ButtonGroupDefaults.connectedMiddleButtonShapes()
                }
            ) { Text(label) }
        }
    }
}
\`\`\`

### 2. HorizontalFloatingToolbar / VerticalFloatingToolbar
Replaces the old FAB + BottomAppBar pattern. Collapses on scroll.

\`\`\`kotlin
// Source: proandroiddev.com M3 Expressive Part 2
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun MainScreen() {
    var expanded by rememberSaveable { mutableStateOf(true) }
    Scaffold { padding ->
        Box(Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier.floatingToolbarVerticalNestedScroll(
                    expanded = expanded,
                    onExpand = { expanded = true },
                    onCollapse = { expanded = false }
                ),
                contentPadding = padding
            ) { /* items */ }

            HorizontalFloatingToolbar(
                modifier = Modifier.align(Alignment.BottomCenter),
                expanded = expanded,
                floatingActionButton = {
                    FloatingToolbarDefaults.VibrantFloatingActionButton(onClick = { /*...*/ }) {
                        Icon(Icons.Filled.Add, contentDescription = "Add")
                    }
                },
                colors = FloatingToolbarDefaults.vibrantFloatingToolbarColors()
            ) {
                IconButton(onClick = { }) { Icon(Icons.Filled.Edit, "Edit") }
                IconButton(onClick = { }) { Icon(Icons.Filled.Share, "Share") }
            }
        }
    }
}
\`\`\`

### 3. DockedToolbar (replaces BottomAppBar)
\`\`\`kotlin
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun AppScaffold() {
    Scaffold(
        bottomBar = {
            DockedToolbar {                           // ← use this, not BottomAppBar
                IconButton(onClick = {}) { Icon(Icons.Filled.Home, "Home") }
                IconButton(onClick = {}) { Icon(Icons.Filled.Search, "Search") }
            }
        }
    ) { /* content */ }
}
\`\`\`

### 4. LoadingIndicator (replaces CircularProgressIndicator for indeterminate)
\`\`\`kotlin
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun LoadingScreen() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        LoadingIndicator()     // animated wavy M3E indicator
    }
}
\`\`\`

### 5. SplitButtonLayout
\`\`\`kotlin
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun SaveSplitButton() {
    SplitButtonLayout(
        leadingButton = {
            SplitButtonDefaults.LeadingButton(onClick = { /* primary action */ }) {
                Text("Save")
            }
        },
        trailingButton = {
            SplitButtonDefaults.TrailingButton(onClick = { /* show dropdown */ }) {
                Icon(Icons.Filled.ArrowDropDown, "More options")
            }
        }
    )
}
\`\`\`

### 6. FloatingActionButtonMenu (FABMenu)
\`\`\`kotlin
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun SpeedDialFab() {
    var expanded by rememberSaveable { mutableStateOf(false) }
    FloatingActionButtonMenu(
        expanded = expanded,
        button = {
            ToggleFloatingActionButton(
                checked = expanded,
                onCheckedChange = { expanded = it }
            ) {
                Icon(
                    if (expanded) Icons.Filled.Close else Icons.Filled.Add,
                    contentDescription = "Menu"
                )
            }
        }
    ) {
        FloatingActionButtonMenuItem(onClick = {}, icon = { Icon(Icons.Filled.Edit, null) }, text = { Text("Edit") })
        FloatingActionButtonMenuItem(onClick = {}, icon = { Icon(Icons.Filled.Share, null) }, text = { Text("Share") })
    }
}
\`\`\`
`;
const MATERIALSHAPES = `
## MaterialShapes — 35 Preset Morphable Shapes

M3 Expressive ships a \`MaterialShapes\` object with 35 named shapes
designed for smooth morphing between each other.

\`\`\`kotlin
// Source: android-developers.googleblog.com (Androidify I/O 2025)
import androidx.compose.material3.MaterialShapes

// Preset shapes (selection):
// MaterialShapes.Circle
// MaterialShapes.Square
// MaterialShapes.Pill
// MaterialShapes.Cookie4Sided
// MaterialShapes.Cookie6Sided
// MaterialShapes.Cookie9Sided   ← used in Androidify
// MaterialShapes.Clover4Leaf
// MaterialShapes.Flower
// MaterialShapes.Burst8
// MaterialShapes.Slanted        ...and more

// Convert to Compose Shape for clipping:
Box(
    Modifier
        .size(96.dp)
        .clip(MaterialShapes.Cookie9Sided.toShape())
        .background(MaterialTheme.colorScheme.primaryContainer)
)

// Morphing between shapes with animation:
val morph = remember { Morph(MaterialShapes.Circle, MaterialShapes.Square) }
val progress by animateFloatAsState(if (selected) 1f else 0f,
    animationSpec = MaterialTheme.motionScheme.defaultSpatialSpec())
Canvas(Modifier.size(64.dp)) {
    drawPath(morph.toPath(progress, size), color = primaryColor)
}
\`\`\`
`;
const TYPOGRAPHY = `
## M3 Expressive Typography — Variable Fonts

M3 Expressive uses variable fonts with weight and width axes.
The type scale is unchanged (displayLarge → labelSmall) but
weights and sizes are more expressive.

\`\`\`kotlin
// Custom typography with variable font weight
val Typography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily(Font(R.font.roboto_flex)),   // variable font
        fontVariationSettings = FontVariationSettings(
            FontVariation.weight(700f),
            FontVariation.width(100f)
        ),
        fontSize = 32.sp,
        lineHeight = 40.sp
    )
    // ... other styles
)

// In Compose — animated font weight (M3E pattern):
val fontWeight by animateFloatAsState(
    if (isActive) 700f else 400f,
    animationSpec = MaterialTheme.motionScheme.defaultEffectsSpec()
)
Text(
    text = label,
    fontVariationSettings = FontVariationSettings(FontVariation.weight(fontWeight))
)
\`\`\`
`;
const ANTI_PATTERNS = `
## M3 Expressive Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|---------|-------------|
| Use \`BottomAppBar\` for new screens | Use \`DockedToolbar\` |
| Mix \`MaterialTheme\` + expressive components | Wrap with \`MaterialExpressiveTheme\` |
| Use \`CircularProgressIndicator\` (indeterminate) where wavy fits | Use \`LoadingIndicator\` |
| Use \`SegmentedButton\` for filter pills | Use \`ButtonGroup\` with \`toggleableItem\` |
| Hardcode animation specs (\`spring()\`, \`tween()\`) | Pull from \`MaterialTheme.motionScheme.defaultSpatialSpec()\` |
| Use FAB + BottomAppBar combo | Use \`HorizontalFloatingToolbar\` with FAB slot |
| Skip \`@OptIn\` annotation | Always add \`@OptIn(ExperimentalMaterial3ExpressiveApi::class)\` |

### BottomAppBar migration
\`\`\`kotlin
// ❌ Old — still works but deprecated in M3E context
Scaffold(bottomBar = {
    BottomAppBar { /* actions */ }
})

// ✅ New
Scaffold(bottomBar = {
    DockedToolbar { /* actions */ }
})
\`\`\`
`;
const WEAR_M3E = `
## Wear OS — Material 3 Expressive

\`\`\`kotlin
// Wear Compose M3 dependency (source: developer.android.com/jetpack/androidx/releases/wear-compose-m3)
implementation("androidx.wear.compose:compose-material3:1.0.0-beta01")
\`\`\`

### Key Wear M3E components
- **EdgeButton** — hugs the bottom edge of the round screen
- **ButtonGroup** — shape-morphs on touch, designed for round displays
- **TransformingLazyColumn** — built-in scroll animations that trace display curves
- **ConfirmationDialog** — success/failure/open-on-phone variants with timeout
- **Shape morphing** — IconButton, TextButton, IconToggleButton animate on press
- **Dynamic Color** — theme adapts to the user's chosen watch face

\`\`\`kotlin
// MotionScheme for Wear
val motionScheme = MotionScheme.expressive  // companion object (Wear API)
// or
val motionScheme = MotionScheme.standard
// Set via MaterialTheme(motionScheme = ...) on Wear
\`\`\`
`;
const MIGRATION = `
## Migrating from M3 to M3 Expressive

1. **Update dependency** to \`material3:1.4.x\`
2. **Replace \`MaterialTheme\`** with \`MaterialExpressiveTheme\`
3. **Replace \`BottomAppBar\`** with \`DockedToolbar\`
4. **Replace FAB + BottomAppBar combos** with \`HorizontalFloatingToolbar\`
5. **Replace \`SegmentedButton\`** filter rows with \`ButtonGroup\`
6. **Replace \`CircularProgressIndicator\` (indeterminate)** with \`LoadingIndicator\`
7. **Replace hardcoded animation specs** with \`MaterialTheme.motionScheme.*\`
8. **Add \`@OptIn\`** annotations to all files using new components

> 📚 Official migration guide: https://developer.android.com/develop/ui/compose/designsystems/material3
`;
const TOPICS = [
    { keywords: ["overview", "what is", "intro", "m3e", "expressive"], content: M3E_OVERVIEW },
    { keywords: ["theme", "setup", "motionscheme", "materialexpressivetheme", "getting started", "dependency", "gradle"], content: THEME_SETUP },
    { keywords: ["component", "buttongroup", "floatingtoolbar", "dockedtoolbar", "loadingindicator", "splitbutton", "fabmenu", "floatingactionbutton", "new"], content: NEW_COMPONENTS },
    { keywords: ["shape", "materialshapes", "morph", "morphing", "cookie", "squircle", "35"], content: MATERIALSHAPES },
    { keywords: ["typography", "font", "variable", "weight", "width", "type"], content: TYPOGRAPHY },
    { keywords: ["anti-pattern", "antipattern", "wrong", "avoid", "don't", "migrate", "migration", "from m3"], content: ANTI_PATTERNS + "\n\n" + MIGRATION },
    { keywords: ["wear", "wearos", "watch", "pixel watch", "edgebutton", "transforminglazy"], content: WEAR_M3E },
];
function findTopic(query) {
    const lower = query.toLowerCase();
    for (const topic of TOPICS) {
        if (topic.keywords.some(k => lower.includes(k)))
            return topic.content;
    }
    return null;
}
const INDEX = `
## AndroJack — Material 3 Expressive Reference

**Query topics available:**

| Topic | Example query |
|-------|--------------|
| Overview & what's new | "m3 expressive overview" |
| Theme setup & MotionScheme | "MaterialExpressiveTheme setup" |
| New components | "ButtonGroup", "FloatingToolbar", "LoadingIndicator" |
| MaterialShapes & morphing | "shape morphing", "MaterialShapes" |
| Typography / variable fonts | "expressive typography" |
| Anti-patterns & migration | "migrate from M3", "anti-pattern" |
| Wear OS M3 Expressive | "wear expressive", "EdgeButton" |

**Official sources:**
- https://developer.android.com/develop/ui/compose/designsystems/material3
- https://m3.material.io/blog/building-with-m3-expressive
- https://developer.android.com/jetpack/androidx/releases/compose-material3
`;
// ── Main handler ─────────────────────────────────────────────────────────────
export async function material3Expressive(topic) {
    const trimmed = topic.trim();
    if (!trimmed || trimmed.toLowerCase() === "list" || trimmed.toLowerCase() === "help") {
        return INDEX;
    }
    // Try local knowledge first (instant, no network)
    const local = findTopic(trimmed);
    if (local) {
        return (local.trim() +
            `\n\n---\n` +
            `**Official docs:** https://developer.android.com/develop/ui/compose/designsystems/material3\n` +
            `> 🎨 GROUNDING GATE: All M3 Expressive code must use \`MaterialExpressiveTheme\` and \`@OptIn(ExperimentalMaterial3ExpressiveApi::class)\`.`);
    }
    // Fallback: live fetch from official source
    const url = `https://developer.android.com/s/results?q=${encodeURIComponent("material 3 expressive " + trimmed)}`;
    try {
        const html = await secureFetch(url);
        const text = extractPageText(html, 2000);
        return (`## M3 Expressive: "${trimmed}"\n\n` +
            `No built-in entry found. Live results from developer.android.com:\n\n` +
            text +
            `\n\n**Search URL:** ${url}` +
            `\n\n> 🎨 Verify against https://developer.android.com/develop/ui/compose/designsystems/material3`);
    }
    catch {
        return (`## M3 Expressive: "${trimmed}"\n\n` +
            `No built-in entry. Search manually:\n` +
            `- https://developer.android.com/develop/ui/compose/designsystems/material3\n` +
            `- https://m3.material.io/blog/building-with-m3-expressive`);
    }
}
