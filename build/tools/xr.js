// Tool 19: Android XR Guide
// Android XR SDK reached Developer Preview 3 in December 2025.
// Samsung Galaxy XR launched October 2025. 5+ devices expected in 2026.
// AI tools generate standard Compose code for XR — technically works but misses all spatial APIs.
export async function androidXrGuide(topic) {
    const t = topic.toLowerCase().trim();
    const overview = `
# Android XR — Official Developer Reference
Source: https://developer.android.com/xr
Source: https://developer.android.com/develop/ui/compose/xr

## Status (February 2026)

| Component | Status |
|-----------|--------|
| Android XR SDK | Developer Preview 3 (Dec 2025) |
| Jetpack Compose for XR | Developer Preview 3 |
| ARCore for XR | Developer Preview 3 |
| Samsung Galaxy XR | Launched October 2025 |
| Additional 2026 XR devices | Samsung AR glasses, XREAL, Warby Parker, Gentle Monster |

## What Android XR Is

Android XR is the platform for spatial computing on Android headsets and AR glasses.
It runs standard Android apps as 2D panels in a spatial environment, AND allows apps
to go "spatial" using new Compose for XR APIs.

Standard Compose apps work on XR headsets as 2D panels — no XR SDK required.
Add XR-specific APIs to give users spatial, immersive experiences.

## Key XR Concepts

| Concept | What It Is |
|---------|-----------|
| Subspace | The 3D environment where spatial content is placed |
| SpatialPanel | A flat 2D Compose surface positioned in 3D space |
| UserSubspace | Content that "follows" the user as they move |
| Orbiter | A floating UI element that orbits around a SpatialPanel |
| SceneCore | Low-level 3D scene graph API |
| SubspaceModifier | Sizing/positioning in the 3D environment (width/height as fraction of comfortable view) |

Source: https://developer.android.com/xr
`;
    const setup = `
# Android XR — Setup & Dependencies
Source: https://developer.android.com/xr/get-started

## Dependencies

\`\`\`toml
# libs.versions.toml
[versions]
xr-compose = "1.0.0-alpha03"   # Check developer.android.com/xr for latest
arcore-xr = "1.0.0-alpha03"

[libraries]
compose-xr = { group = "androidx.xr.compose", name = "compose", version.ref = "xr-compose" }
arcore-xr = { group = "com.google.ar", name = "core-xr", version.ref = "arcore-xr" }

[plugins]
# No special plugin needed — standard Android plugin works
\`\`\`

\`\`\`kotlin
// build.gradle.kts
implementation(libs.compose.xr)

// Optional — only if using ARCore features (face tracking, plane detection, etc.)
implementation(libs.arcore.xr)
\`\`\`

## Manifest — Declare XR Feature (Optional — Recommended)

\`\`\`xml
<!-- Optional — declare that your app supports XR but also runs on non-XR devices -->
<uses-feature
  android:name="android.hardware.type.xr"
  android:required="false" />  <!-- false = app still available on non-XR devices -->
\`\`\`

Source: https://developer.android.com/xr/get-started
`;
    const spatialUi = `
# Android XR — Spatial UI with Compose for XR
Source: https://developer.android.com/develop/ui/compose/xr/spatial-ui

## SpatialPanel — A Compose UI in 3D Space

\`\`\`kotlin
@Composable
fun XrApp() {
  // Check if running on XR device
  val xrEnvironment = LocalXrEnvironment.current

  if (xrEnvironment != null) {
    // XR path — use spatial APIs
    SpatialLayout {
      SpatialPanel(
        modifier = SubspaceModifier
          .width(800.dp)
          .height(600.dp)
          .move(x = 0.dp, y = 0.dp, z = (-1.5).dp)  // 1.5 meters in front of user
      ) {
        // Regular Compose content inside the panel
        AppMainContent()
      }
    }
  } else {
    // Non-XR path — regular Compose
    AppMainContent()
  }
}
\`\`\`

## UserSubspace — Content That Follows the User

\`\`\`kotlin
@Composable
fun FloatingNotification(message: String) {
  // UserSubspace content "follows" the user as they look around
  // Ideal for persistent UI like notifications, status indicators
  UserSubspace {
    SpatialPanel(
      modifier = SubspaceModifier
        .width(300.dp)
        .height(100.dp)
        .move(x = 200.dp, y = (-150).dp, z = (-1.0).dp)  // Top-right of view
    ) {
      NotificationCard(message = message)
    }
  }
}
\`\`\`

## Orbiter — Floating Tool Panels

\`\`\`kotlin
@Composable
fun DocumentEditorXr() {
  SpatialLayout {
    // Main document panel
    SpatialPanel(
      modifier = SubspaceModifier.fillMaxWidth(0.7f).fillMaxHeight(0.8f)
    ) {
      DocumentContent()
    }

    // Orbiter — formatting toolbar floating to the right of the main panel
    Orbiter(
      position = OrbiterEdge.End,
      offset = 16.dp,
      alignment = Alignment.CenterVertically
    ) {
      FormattingToolbar()
    }
  }
}
\`\`\`

## Material Design for XR — Auto-Spatial Components

When using Material 3 with Compose for XR, some components automatically get spatial treatment:
- **TopAppBar** becomes an Orbiter floating above the panel
- **NavigationBar** becomes an Orbiter below or to the side of the panel
- **Dialogs** lift off the surface and appear as floating panels in front

No code changes needed if you're already using standard Material 3 components.

Source: https://developer.android.com/develop/ui/compose/xr/spatial-ui
`;
    const arcore = `
# Android XR — ARCore for XR (Face Tracking, Plane Detection)
Source: https://developers.google.com/ar/develop/android-xr

## ARCore for XR Capabilities

ARCore for XR adds:
- **Face Tracking** — 68 facial blendshape values (ARCore XR face mesh)
- **Hand Tracking** — finger joint positions for gesture recognition
- **Plane Detection** — horizontal/vertical surfaces in the physical world
- **Depth API** — depth map for occlusion with real-world objects

## Face Tracking Setup

\`\`\`kotlin
// Requires android.permission.CAMERA in manifest

class FaceTrackingActivity : ComponentActivity() {
  private lateinit var session: Session

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Check ARCore XR availability
    if (!ArCoreApk.getInstance().isXrAvailable(this)) return

    session = Session(this, EnumSet.of(Session.Feature.FRONT_CAMERA))
    session.configure(
      session.config.apply {
        faceDetectorMode = Config.FaceDetectorMode.ENABLED
      }
    )
  }

  // In render loop — read 68 blendshape coefficients per face
  fun processFaceFrame(frame: Frame) {
    val faces = session.getAllTrackables(AugmentedFace::class.java)
    faces.forEach { face ->
      val blendshapes = face.getBlendshapeCoefficients()
      // blendshapes[AugmentedFace.BlendshapeCoefficient.MOUTH_OPEN] -> 0.0f - 1.0f
      // Use these for avatar animation, accessibility features, etc.
    }
  }
}
\`\`\`

Source: https://developers.google.com/ar/develop/android-xr
`;
    const deviceCompat = `
# Android XR — Device Compatibility & Non-XR Fallback
Source: https://developer.android.com/xr/develop/device-compatibility

## Running on Both XR and Non-XR Devices

Apps should work on standard Android phones AND XR devices. The pattern:

\`\`\`kotlin
// Compose — check XR environment at runtime
@Composable
fun AdaptiveApp() {
  val isXrEnvironment = LocalXrEnvironment.current != null

  if (isXrEnvironment) {
    XrLayout()     // Spatial panels, orbiters, 3D placement
  } else {
    StandardLayout() // Regular phone/tablet layout
  }
}

// ViewModel / Logic layer — no XR code here
// Architecture is identical to non-XR apps: MVVM, Repository, etc.
// XR is purely a presentation-layer concern
@HiltViewModel
class MainViewModel @Inject constructor(
  private val userRepository: UserRepository
) : ViewModel() {
  val uiState = userRepository.observeState().stateIn(
    viewModelScope, SharingStarted.WhileSubscribed(5000), MainUiState()
  )
}
\`\`\`

## Testing XR Apps Without Hardware

Use the Android XR Emulator in Android Studio:
1. SDK Tools → Android XR Emulator
2. Create AVD with XR device profile
3. Test both spatial and 2D fallback layouts

Source: https://developer.android.com/xr/develop/device-compatibility
`;
    if (t.includes("setup") || t.includes("depend") || t.includes("install"))
        return setup;
    if (t.includes("spatial") || t.includes("panel") || t.includes("orbiter") || t.includes("subspace"))
        return spatialUi;
    if (t.includes("arcore") || t.includes("face") || t.includes("hand") || t.includes("plane") || t.includes("ar "))
        return arcore;
    if (t.includes("compat") || t.includes("fallback") || t.includes("non-xr") || t.includes("emulat"))
        return deviceCompat;
    return overview + "\n\n---\n\n" +
        "**Query topics:** 'setup' (dependencies), 'spatial ui' (SpatialPanel, Orbiter, UserSubspace), " +
        "'arcore' (face tracking, plane detection), 'compatibility' (XR + non-XR device support)\n\n" +
        "Source: https://developer.android.com/xr";
}
