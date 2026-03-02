/**
 * Tool 11 – android_build_and_publish
 *
 * Covers the full Android build-to-Play Store pipeline:
 * - R8 / ProGuard configuration (official developer.android.com/build/shrink-code)
 * - Gradle Version Catalogs (libs.versions.toml)
 * - KSP vs KAPT migration
 * - App signing + Play App Signing
 * - App Bundle (AAB) vs APK
 * - Play Store publishing checklist
 * - Baseline Profiles for startup perf
 * - Build variants and flavors
 */

interface BuildTopic {
  keywords: string[];
  content: string;
}

// ── Knowledge base ────────────────────────────────────────────────────────────

const R8_CONFIG = `
## R8 / ProGuard — Official Configuration

Source: developer.android.com/build/shrink-code (AGP 9.x, 2025)

### Enable R8 in release build
\`\`\`kotlin
// build.gradle.kts (app)
android {
    buildTypes {
        release {
            isMinifyEnabled = true         // enables R8 shrinking + obfuscation
            isShrinkResources = true       // removes unused resources
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),  // ← use OPTIMIZE, not plain
                "proguard-rules.pro"
            )
        }
    }
}
\`\`\`

> ⚠️ R8 replaces ProGuard as of AGP 3.4. ProGuard rules still work — R8 reads them.
> ⚠️ On AGP 9.0+, optimised resource shrinking is automatic when isShrinkResources = true.

### R8 Full Mode (maximum optimization)
\`\`\`properties
# gradle.properties — enable R8 full mode
# Remove this line if present (it disables full mode):
# android.enableR8.fullMode=false
\`\`\`

### proguard-rules.pro — practical rules by category

\`\`\`proguard
# ── Retrofit / OkHttp ─────────────────────────────────────────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-keep interface com.yourapp.api.** { *; }               # all Retrofit interfaces
-keep class com.yourapp.api.model.** { *; }             # all JSON data models
-keepclassmembers class com.yourapp.api.model.** { *; }

# ── Gson ─────────────────────────────────────────────────────────────────────
-keep class com.yourapp.model.** { *; }
-keepclassmembers class com.yourapp.model.** { *; }

# ── Room (auto-generated DAOs kept by Room consumer rules) ───────────────────
# Usually not needed — Room ships its own consumer ProGuard rules.
# Only add if you see Room crashes in release:
# -keep class * extends androidx.room.RoomDatabase
# -keep @androidx.room.Entity class *

# ── Kotlin Serialization ──────────────────────────────────────────────────────
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** { *** Companion; }
-keepclasseswithmembers class **.*\$serializer { *; }

# ── Hilt / Dagger (auto-included by Hilt, add only if needed) ────────────────
-dontwarn dagger.**

# ── Coroutines ────────────────────────────────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# ── Debug — print final merged rule set to file ───────────────────────────────
# (remove before production)
# -printconfiguration build/outputs/logs/configuration.txt

# ── Debug — why is this class kept? ──────────────────────────────────────────
# -whyareyoukeeping class com.yourapp.SomeClass
\`\`\`

### What NOT to do
| ❌ Don't | ✅ Do Instead |
|---------|-------------|
| Use \`-dontoptimize\` globally | Let R8 optimize; use per-class rules if needed |
| \`-keep class **.** { *; }\` | Narrow rules to specific packages/classes |
| Keep Activities/Services manually | Default rules already cover Android components |
| Skip release build testing | ALWAYS test release APK/AAB — debug has R8 off |
| Use proguard-android.txt | Use proguard-android-optimize.txt |

### Recover readable stacktraces from release crashes
\`\`\`bash
# mapping.txt is generated at build/outputs/mapping/release/mapping.txt
# Upload to Play Console or use retrace:
java -jar retrace.jar mapping.txt stacktrace.txt
# Or via AGP:
./gradlew app:retrace --obfuscated-stack-trace stacktrace.txt
\`\`\`
`;

const VERSION_CATALOG = `
## Gradle Version Catalogs (libs.versions.toml)

Source: developer.android.com/build/migrate-to-catalogs

### File location: gradle/libs.versions.toml
\`\`\`toml
[versions]
agp = "8.10.0"
kotlin = "2.1.20"
compose-bom = "2025.05.00"
hilt = "2.52"
room = "2.7.1"
lifecycle = "2.8.7"
navigation = "2.8.9"
retrofit = "2.11.0"
okhttp = "4.12.0"
coroutines = "1.9.0"
mockk = "1.13.12"
turbine = "1.2.0"

[libraries]
# Compose
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui = { group = "androidx.compose.ui", name = "ui" }
compose-material3 = { group = "androidx.compose.material3", name = "material3" }
compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }

# Lifecycle
lifecycle-viewmodel-ktx = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-ktx", version.ref = "lifecycle" }
lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycle" }
lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycle" }

# Hilt
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version = "1.2.0" }

# Room
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Navigation
navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation" }

# Network
retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }

# Coroutines
coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "coroutines" }

# Testing
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }
turbine = { group = "app.cash.turbine", name = "turbine", version.ref = "turbine" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version = "2.1.20-1.0.32" }
room = { id = "androidx.room", version.ref = "room" }

[bundles]
compose = ["compose-ui", "compose-material3", "compose-ui-tooling-preview", "lifecycle-runtime-compose"]
lifecycle = ["lifecycle-viewmodel-ktx", "lifecycle-runtime-ktx"]
\`\`\`

### Using in build.gradle.kts
\`\`\`kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

dependencies {
    implementation(platform(libs.compose.bom))
    implementation(libs.bundles.compose)
    implementation(libs.bundles.lifecycle)
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
}
\`\`\`
`;

const KSP_MIGRATION = `
## KSP vs KAPT — Migrate to KSP Now

Source: developer.android.com/build/migrate-to-ksp

**KAPT is deprecated as of Kotlin 2.x. KSP is 2x faster.**

### Migrate Room KAPT → KSP
\`\`\`kotlin
// ❌ Old KAPT
plugins { id("kotlin-kapt") }
dependencies {
    kapt("androidx.room:room-compiler:2.x")
}

// ✅ New KSP
plugins { alias(libs.plugins.ksp) }
dependencies {
    ksp("androidx.room:room-compiler:2.7.1")
    // Room KSP plugin (AGP 8.3+):
    implementation("androidx.room:room-runtime:2.7.1")
}
\`\`\`

### Migrate Hilt KAPT → KSP
\`\`\`kotlin
// ❌ Old KAPT
kapt("com.google.dagger:hilt-compiler:2.x")

// ✅ New KSP
ksp("com.google.dagger:hilt-compiler:2.52")
\`\`\`

### Migration checklist
- Replace \`id("kotlin-kapt")\` plugin with \`alias(libs.plugins.ksp)\`
- Replace all \`kapt(...)\` calls with \`ksp(...)\`
- For Room: add \`alias(libs.plugins.room)\` plugin and set schema export dir
- Run \`./gradlew clean\` after migration
`;

const SIGNING_PUBLISH = `
## App Signing + Play Store Publishing

### App Signing (Play App Signing — recommended)
\`\`\`kotlin
// build.gradle.kts — release signing config
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("KEYSTORE_PATH") ?: "keystore.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = System.getenv("KEY_ALIAS")
            keyPassword = System.getenv("KEY_PASSWORD")
            // Never hardcode secrets in build files!
        }
    }
    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
            isMinifyEnabled = true
            isShrinkResources = true
        }
    }
}
\`\`\`

### Build release AAB (preferred over APK for Play Store)
\`\`\`bash
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
\`\`\`

### Play Store Publishing Checklist
- [ ] Target SDK = latest stable API (required within 1 year of release)
- [ ] \`compileSdk\` ≥ target SDK
- [ ] \`isMinifyEnabled = true\` + \`isShrinkResources = true\`
- [ ] Upload \`mapping.txt\` to Play Console (deobfuscation)
- [ ] AAB signed with upload keystore (Play manages distribution signing)
- [ ] \`versionCode\` incremented
- [ ] Store listing: screenshots, description, content rating, privacy policy URL
- [ ] Data safety form completed (required — maps to \`<uses-permission>\` declarations)
- [ ] Minimum Android version justified (Play shows device coverage %)
- [ ] Test on internal track → closed testing → open testing → production
`;

const BASELINE_PROFILES = `
## Baseline Profiles — Startup Performance

Source: developer.android.com/topic/performance/baselineprofiles

Baseline Profiles tell ART (Android Runtime) which code to pre-compile,
cutting cold startup time by 20–40%.

\`\`\`kotlin
// build.gradle.kts (app)
dependencies {
    implementation("androidx.profileinstaller:profileinstaller:1.4.1")
}

// build.gradle.kts (baseline-profile module)
plugins { id("androidx.baselineprofile") }
dependencies {
    implementation("androidx.benchmark:benchmark-macro-junit4:1.3.3")
}

// BaselineProfileGenerator.kt
@RunWith(AndroidJUnit4::class)
@LargeTest
class BaselineProfileGenerator {
    @get:Rule val rule = BaselineProfileRule()

    @Test
    fun generate() = rule.collect(packageName = "com.yourapp") {
        pressHome()
        startActivityAndWait()
        // Walk critical user journeys
        device.findObject(By.text("Login")).click()
        device.waitForIdle()
    }
}
\`\`\`

\`\`\`bash
# Generate and apply profile
./gradlew :app:generateBaselineProfile
# Profile written to src/main/baseline-prof.txt — commit it to git
\`\`\`
`;

// ── Topic routing ─────────────────────────────────────────────────────────────

const TOPICS: BuildTopic[] = [
  { keywords: ["r8", "proguard", "shrink", "obfuscat", "minify", "keep rule", "mapping"], content: R8_CONFIG },
  { keywords: ["version catalog", "libs.versions.toml", "toml", "bundle", "catalog"], content: VERSION_CATALOG },
  { keywords: ["ksp", "kapt", "annotation processing", "migrate kapt", "symbol processing"], content: KSP_MIGRATION },
  { keywords: ["sign", "signing", "keystore", "publish", "play store", "aab", "bundle", "release", "checklist", "upload"], content: SIGNING_PUBLISH },
  { keywords: ["baseline profile", "startup", "performance", "cold start", "art", "precompile"], content: BASELINE_PROFILES },
];

const INDEX = `
## Android Build & Publish Guide

**Available topics:**
- \`r8\` / \`proguard\` — shrinking, obfuscation, keep rules, mapping.txt
- \`version catalog\` — libs.versions.toml setup with all modern deps
- \`ksp\` — migrate from KAPT to KSP (Room, Hilt)
- \`signing\` / \`publish\` — app signing, AAB, Play Store checklist
- \`baseline profiles\` — startup performance, ART pre-compilation

**Official sources:**
- https://developer.android.com/build/shrink-code
- https://developer.android.com/build/migrate-to-catalogs
- https://developer.android.com/topic/performance/baselineprofiles
`;

export async function androidBuildAndPublish(topic: string): Promise<string> {
  const trimmed = topic.trim().toLowerCase();

  if (!trimmed || trimmed === "list" || trimmed === "help") return INDEX;

  const found = TOPICS.find(t => t.keywords.some(k => trimmed.includes(k)));
  if (found) {
    return found.content.trim() + `\n\n---\n> 🏗️ GROUNDING GATE: Build config grounded in official Android developer docs.`;
  }

  return `## Build & Publish: "${topic}"\n\nNo built-in entry. Check:\n- https://developer.android.com/build\n- https://developer.android.com/distribute\n\n${INDEX}`;
}
