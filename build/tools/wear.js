// Tool 20: Wear OS Developer Guide
// Hundreds of millions of Wear OS devices. M3 Expressive for Wear went stable August 2025.
// Wear OS 5 (API 35) is current. AI tools generate phone Compose code that doesn't compile on Wear.
export async function androidWearOsGuide(topic) {
    const t = topic.toLowerCase().trim();
    const overview = `
# Wear OS Developer Guide — Official Reference
Source: https://developer.android.com/training/wearables

## Platform Status (2026)

| Component | Status |
|-----------|--------|
| Wear OS 5 (API 35) | Current |
| Jetpack Compose for Wear OS | Stable |
| Material 3 Expressive for Wear | Stable (August 2025) |
| Health Services API | Stable |
| Tiles API | Stable |
| Complications API | Stable |

## Why Phone Compose Code Fails on Wear OS

Wear OS uses a DIFFERENT set of Compose dependencies. If you add phone Compose to a Wear module:
- Different components (ScalingLazyColumn not LazyColumn, Chip not Button, etc.)
- Different scrolling behavior (curved/rotary input)
- Different navigation (SwipeDismissableNavHost)
- Different theming (WearMaterialTheme)

**AI tools generate phone Compose code. This does not compile on Wear OS.**

## Project Structure for Phone + Wear

\`\`\`
myapp/
  app/           ← Phone module (regular Compose)
  wearapp/       ← Wear module (Wear Compose)
  shared/        ← Shared business logic (KMP or Android library)
\`\`\`

## Wear OS Dependencies (Different from Phone!)

\`\`\`toml
# libs.versions.toml
[versions]
wear-compose = "1.4.0"
wear-tiles = "1.4.0"
wear-watchface = "1.2.1"
health-services = "1.1.0"
horologist = "0.6.17"  # Google's Wear utility library

[libraries]
# Wear Compose — NOT the same as phone Compose
wear-compose-foundation = { group = "androidx.wear.compose", name = "compose-foundation", version.ref = "wear-compose" }
wear-compose-material3 = { group = "androidx.wear.compose", name = "compose-material3", version.ref = "wear-compose" }
wear-compose-navigation = { group = "androidx.wear.compose", name = "compose-navigation", version.ref = "wear-compose" }
wear-compose-ui-tooling = { group = "androidx.wear.compose", name = "compose-ui-tooling", version.ref = "wear-compose" }

# Tiles
wear-tiles = { group = "androidx.wear.tiles", name = "tiles", version.ref = "wear-tiles" }
wear-tiles-material = { group = "androidx.wear.tiles", name = "tiles-material", version.ref = "wear-tiles" }

# Health Services
health-services = { group = "androidx.health", name = "health-services-client", version.ref = "health-services" }

# Horologist — Google's Wear utils (date/time pickers, rotary, audio)
horologist-compose-layout = { group = "com.google.android.horologist", name = "horologist-compose-layout", version.ref = "horologist" }
\`\`\`

Source: https://developer.android.com/training/wearables
`;
    const compose = `
# Wear OS — Compose for Wear OS
Source: https://developer.android.com/training/wearables/compose

## Key Component Differences vs Phone Compose

| Phone Compose | Wear Compose Equivalent | Why Different |
|--------------|------------------------|---------------|
| LazyColumn | ScalingLazyColumn | Curved/cylindrical scrolling on round watches |
| Button | Chip / CompactChip | Optimized for small touch targets |
| Text | Text (same) | — |
| Icon | Icon (same) | — |
| Scaffold | TimeText + ScalingLazyColumn + PositionIndicator | Wear-specific chrome |
| NavHost | SwipeDismissableNavHost | Swipe-to-dismiss back gesture |
| AlertDialog | Alert | Wear-sized dialog |
| BottomSheetScaffold | (no equivalent) | Use scrolling content instead |

## Basic Wear OS Compose Screen

\`\`\`kotlin
@Composable
fun WearApp() {
  WearMaterialTheme {  // NOT MaterialTheme — use WearMaterialTheme
    Scaffold(
      timeText = { TimeText() },  // Clock in top arc — mandatory for all Wear screens
      positionIndicator = {
        PositionIndicator(scalingLazyListState = listState)
      }
    ) {
      ScalingLazyColumn(  // NOT LazyColumn — curved scrolling for round screen
        state = listState,
        modifier = Modifier.fillMaxSize()
      ) {
        item { Text("Hello Wear!") }
        items(items) { item ->
          Chip(
            onClick = { /* ... */ },
            label = { Text(item.title) },
            icon = { Icon(Icons.Default.Star, contentDescription = null) }
          )
        }
      }
    }
  }
}
\`\`\`

## Navigation on Wear OS

\`\`\`kotlin
// SwipeDismissableNavHost — user swipes from left to go back (NOT NavHost)
@Composable
fun WearNavigation() {
  val navController = rememberSwipeDismissableNavController()

  SwipeDismissableNavHost(
    navController = navController,
    startDestination = "home"
  ) {
    composable("home") {
      HomeScreen(onNavigateToDetail = { navController.navigate("detail/$it") })
    }
    composable("detail/{id}") { backStackEntry ->
      val id = backStackEntry.arguments?.getString("id") ?: return@composable
      DetailScreen(id = id)
    }
  }
}
\`\`\`

## Rotary Input — The Watch Crown/Bezel

\`\`\`kotlin
// Handle rotary input (watch crown rotation) for scrolling
@Composable
fun RotaryScrollableList(items: List<String>) {
  val listState = rememberScalingLazyListState()
  val focusRequester = rememberActiveFocusRequester()

  ScalingLazyColumn(
    state = listState,
    modifier = Modifier
      .onRotaryScrollEvent { event ->
        // event.verticalScrollPixels: positive = scroll down, negative = scroll up
        true
      }
      .focusRequester(focusRequester)
      .focusable(),
  ) {
    items(items) { Text(it) }
  }
}
\`\`\`

Source: https://developer.android.com/training/wearables/compose
`;
    const tiles = `
# Wear OS — Tiles (Glanceable Information)
Source: https://developer.android.com/training/articles/wear-tiles

## What Tiles Are

Tiles are always-available, fast-loading surfaces that appear when users swipe
on the watch face. They show glanceable information without launching an app.

## Tiles vs App UI — When to Use Each

| Use Case | Tiles | App UI |
|----------|-------|--------|
| Current heart rate, steps | ✅ Tiles | — |
| Weather at a glance | ✅ Tiles | — |
| Quick action (start workout) | ✅ Tiles | — |
| Detailed workout history | — | ✅ App UI |
| Settings / preferences | — | ✅ App UI |
| Complex interactions | — | ✅ App UI |

## Tile Implementation

\`\`\`kotlin
class FitnessTileService : TileService() {

  override fun onTileRequest(requestParams: RequestBuilders.TileRequest) =
    Futures.immediateFuture(
      TileBuilders.Tile.Builder()
        .setResourcesVersion("1")
        .setTileTimeline(
          TimelineBuilders.Timeline.fromLayoutElement(
            layoutElement(requestParams)
          )
        )
        .build()
    )

  private fun layoutElement(params: RequestBuilders.TileRequest): LayoutElement {
    val steps = getStepsCount()  // Your data source
    return PrimaryLayout.Builder(params.deviceConfiguration)
      .setContent(
        Text.Builder()
          .setText(stringLayoutElement("$steps steps"))
          .setTypography(Typography.TYPOGRAPHY_DISPLAY1)
          .setColor(argb(0xFF4CAF50.toInt()))
          .build()
      )
      .setPrimaryChipContent(
        CompactChip.Builder(
          this,
          LaunchAction.Builder()
            .setAndroidActivity(
              AndroidActivity.Builder()
                .setClassName(MainActivity::class.java.name)
                .setPackageName(packageName)
                .build()
            )
            .build(),
          params.requestedTileId,
          params.deviceConfiguration
        )
          .setIconContent(Icons.Activity)
          .build()
      )
      .build()
  }

  override fun onResourcesRequest(requestParams: ResourceBuilders.ResourcesRequest) =
    Futures.immediateFuture(ResourceBuilders.Resources.Builder().setVersion("1").build())
}
\`\`\`

\`\`\`xml
<!-- AndroidManifest.xml -->
<service android:name=".FitnessTileService"
         android:exported="true"
         android:permission="com.google.android.wearable.permission.BIND_TILE_PROVIDER">
  <intent-filter>
    <action android:name="androidx.wear.tiles.action.BIND_TILE_PROVIDER" />
  </intent-filter>
  <meta-data android:name="androidx.wear.tiles.PREVIEW"
             android:resource="@drawable/tile_preview" />
</service>
\`\`\`

Source: https://developer.android.com/training/articles/wear-tiles
`;
    const healthServices = `
# Wear OS — Health Services API
Source: https://developer.android.com/health-and-fitness/guides/health-services

## What Health Services Provides

Health Services is the official API for sensor data on Wear OS (heart rate, steps,
calories, SpO2, ECG on supported hardware). Use this instead of raw SensorManager.

## Exercise Session (Workout Tracking)

\`\`\`kotlin
// Permissions required in manifest
// <uses-permission android:name="android.permission.BODY_SENSORS" />
// <uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />

@HiltViewModel
class WorkoutViewModel @Inject constructor(
  private val healthClient: ExerciseClient
) : ViewModel() {

  private val _heartRate = MutableStateFlow(0)
  val heartRate = _heartRate.asStateFlow()

  fun startWorkout() {
    viewModelScope.launch {
      val config = ExerciseConfig(
        exerciseType = ExerciseType.RUNNING,
        dataTypes = setOf(DataType.HEART_RATE_BPM, DataType.STEPS, DataType.CALORIES_TOTAL),
        isAutoPauseAndResumeEnabled = true
      )
      healthClient.startExercise(config)
    }
  }

  fun observeHeartRate() {
    viewModelScope.launch {
      healthClient.getExerciseStateUpdates().collect { update ->
        update.latestMetrics[DataType.HEART_RATE_BPM]?.let { samples ->
          _heartRate.value = samples.last().value.toInt()
        }
      }
    }
  }
}
\`\`\`

## Passive Monitoring (Background Step Counting)

\`\`\`kotlin
// PassiveListenerService — runs in background without active exercise session
class StepCounterService : PassiveListenerService() {
  override fun onNewDataPointsReceived(dataPoints: DataPointContainer) {
    val steps = dataPoints.getData(DataType.STEPS).lastOrNull()?.value ?: return
    // Update your data store with the new step count
  }
}

// Register in manifest
// <service android:name=".StepCounterService"
//          android:exported="true"
//          android:permission="com.google.android.wearable.healthservices.permission.BIND_HEALTH_SERVICES_LISTENER">
//   <intent-filter>
//     <action android:name="androidx.health.services.PassiveListenerService" />
//   </intent-filter>
// </service>
\`\`\`

Source: https://developer.android.com/health-and-fitness/guides/health-services
`;
    if (t.includes("compose") || t.includes("ui") || t.includes("screen") || t.includes("chip") || t.includes("scaffold")) {
        return compose;
    }
    if (t.includes("tile") || t.includes("glance"))
        return tiles;
    if (t.includes("health") || t.includes("heart") || t.includes("step") || t.includes("sensor") || t.includes("exercise")) {
        return healthServices;
    }
    return overview + "\n\n---\n\n" +
        "**Query topics:** 'compose' (ScalingLazyColumn, Chip, SwipeDismissableNavHost — NOT phone Compose), " +
        "'tiles' (glanceable surfaces for watch face swipe), " +
        "'health services' (heart rate, steps, exercise tracking)\n\n" +
        "Source: https://developer.android.com/training/wearables";
}
