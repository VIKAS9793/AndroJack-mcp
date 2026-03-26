# AndroJack MCP — Use Cases

> **Grounded entirely in `src/`** — every example maps to a real tool, rule, or registry entry in the codebase.  
> No assumptions. No marketing language. If it's documented here, it exists in the source.

---

## What AndroJack Actually Does

AndroJack is a **read-only verification server**. It does three things and nothing else:

1. **Looks up** the status of an Android API, library, or architecture pattern against a built-in registry or live official documentation
2. **Validates** code you or an AI wrote against a rule engine (`src/rules/android-rules.ts`) — 24 rules, zero network calls required
3. **Fetches** live documentation excerpts from `developer.android.com`, `kotlinlang.org`, `source.android.com`, and Google Maven

It does **not** generate code. It does **not** modify files. It does **not** give opinions.

---

## Table of Contents

- [Beginner Use Cases](#beginner-use-cases)
  - [UC-01 — Is this API safe to use?](#uc-01--is-this-api-safe-to-use)
  - [UC-02 — What is the latest Compose BOM version?](#uc-02--what-is-the-latest-compose-bom-version)
  - [UC-03 — Validate code before using it](#uc-03--validate-code-before-using-it)
  - [UC-04 — What permission do I need for the camera?](#uc-04--what-permission-do-i-need-for-the-camera)
- [Intermediate Use Cases](#intermediate-use-cases)
  - [UC-05 — My app will target API 36 — what do I need to change?](#uc-05--my-app-will-target-api-36--what-do-i-need-to-change)
  - [UC-06 — I have a stack trace — what is the known cause?](#uc-06--i-have-a-stack-trace--what-is-the-known-cause)
  - [UC-07 — Should I use LiveData or StateFlow in new code?](#uc-07--should-i-use-livedata-or-stateflow-in-new-code)
  - [UC-08 — Validate a Gradle build file](#uc-08--validate-a-gradle-build-file)
  - [UC-09 — Navigation 2 or Navigation 3 for a new project?](#uc-09--navigation-2-or-navigation-3-for-a-new-project)
  - [UC-10 — Does my Compose UI test code have any issues?](#uc-10--does-my-compose-ui-test-code-have-any-issues)
- [Advanced Use Cases](#advanced-use-cases)
  - [UC-11 — I am building a KMP project — which Room artifact do I use?](#uc-11--i-am-building-a-kmp-project--which-room-artifact-do-i-use)
  - [UC-12 — My app uses screen orientation lock — will it pass Play Store review?](#uc-12--my-app-uses-screen-orientation-lock--will-it-pass-play-store-review)
  - [UC-13 — Full AI loop-back validation before shipping code](#uc-13--full-ai-loop-back-validation-before-shipping-code)
  - [UC-14 — I am adding background location — what are the Play Store rules?](#uc-14--i-am-adding-background-location--what-are-the-play-store-rules)
  - [UC-15 — Validate an entire feature before it reaches code review](#uc-15--validate-an-entire-feature-before-it-reaches-code-review)

---

## Beginner Use Cases

---

### UC-01 — Is this API safe to use?

**The problem:** AI tools generate `AsyncTask`, `HandlerThread`, `IntentService`, `startActivityForResult`, and `SharedPreferences` — all deprecated or removed. You have no fast way to verify before writing code.

**The tool:** `android_component_status`

**Source:** `src/tools/component.ts` + `src/constants.ts` COMPONENT_REGISTRY

The tool first checks the built-in registry (instant, no network) then falls back to scraping `developer.android.com` for unknown components.

**Example prompt:**
```
Is AsyncTask safe to use?
```

**What happens internally:**
```typescript
// src/constants.ts — built-in registry entry
AsyncTask: {
  status: "removed",
  since: "API 30 (deprecated) / removed in API 33",
  replacement: "Kotlin Coroutines or WorkManager",
  docUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
}
```

**Actual response:**
```
## Component Status: `AsyncTask`
**Status:** ❌ REMOVED
**Changed Since:** API 30 (deprecated) / removed in API 33
**Use Instead:** Kotlin Coroutines or WorkManager
**Official Docs:** https://developer.android.com/topic/libraries/architecture/workmanager
**Notes:** Use kotlinx.coroutines for short tasks, WorkManager for deferrable background work.

> ❌ GROUNDING GATE: Do NOT use `AsyncTask`. Migrate to: Kotlin Coroutines or WorkManager.
```

**Components with built-in registry entries (no network needed):**
`AsyncTask` · `HandlerThread` · `IntentService` · `ProgressDialog` · `ListView` · `GridView` · `startActivityForResult` · `ViewModel` · `LiveData` · `StateFlow` · `Room` · `WorkManager` · `Hilt` · `Navigation` · `Jetpack Compose` · `Paging3` · `DataStore` · `BottomAppBar` · `SharedPreferences` · `Loader` · `android.hardware.Camera` · and more

---

### UC-02 — What is the latest Compose BOM version?

**The problem:** The Compose BOM releases monthly. AI tools have stale training data and generate outdated BOM versions. Using an old BOM pulls in superseded component versions.

**The tool:** `gradle_dependency_checker`

**Source:** `src/tools/gradle.ts` — queries `dl.google.com/dl/android/maven2` and `search.maven.org` live

**Example prompt:**
```
What is the latest Compose BOM version?
```

**What happens internally:**
```typescript
// src/tools/gradle.ts — library catalogue entry
"compose-bom": { groupId: "androidx.compose", artifactId: "compose-bom" }

// Queries live:
// https://dl.google.com/dl/android/maven2/androidx/compose/compose-bom/maven-metadata.xml
```

**Actual response format:**
```kotlin
// libs.versions.toml
[versions]
compose-bom = "2026.02.01"   // fetched live from Google Maven

[libraries]
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }

// build.gradle.kts
implementation(platform(libs.compose.bom))
```

**Libraries supported in the catalogue:** Compose BOM, Material3, Lifecycle, ViewModel, Navigation, Room, Paging, DataStore, WorkManager, Hilt, Retrofit, OkHttp, Ktor, Coil 3, Gson, Moshi, Coroutines, kotlinx-serialization, kotlinx-datetime, Koin, Room KMP, DataStore KMP, SQLite Bundled, and more.

---

### UC-03 — Validate code before using it

**The problem:** AI generates code. You paste it in. It compiles. It ships. Weeks later it crashes or gets rejected at Play Store review. The bug was there from the start.

**The tool:** `android_code_validator`

**Source:** `src/tools/validator.ts` + `src/rules/android-rules.ts`

The rule engine is pure TypeScript RegExp matching — **zero network calls**. 24 rules across Kotlin, XML, and Gradle files. Results in under 100ms.

**Example prompt:**
```
Validate this code:

fun loadData() {
    GlobalScope.launch {
        val result = repository.fetch()
        _uiState.value = result
    }
}
```

**What the rule engine does:**
```typescript
// src/rules/android-rules.ts
{
  id:       "GLOBALSCOPE_LAUNCH",
  severity: "error",
  pattern:  /GlobalScope\s*\.\s*launch\b/g,
  message:  "GlobalScope.launch leaks coroutines — not bound to any lifecycle.",
  replacement: "Use viewModelScope.launch (ViewModel), lifecycleScope.launch (Activity/Fragment)...",
  docUrl:   "https://developer.android.com/kotlin/coroutines/coroutines-best-practices",
}
```

**Actual response:**
```
# AndroJack Code Validation Report

**Verdict:**  ❌ FAIL
**Language:** kotlin
**Summary:**  1 error(s), 0 warning(s), 0 info(s)

1. ❌ [ERROR] GLOBALSCOPE_LAUNCH
   Line 2: `GlobalScope.launch {`
   Problem:     GlobalScope.launch leaks coroutines — not bound to any lifecycle.
   Fix:         Use viewModelScope.launch (ViewModel), lifecycleScope.launch (Activity/Fragment)
   Source:      https://developer.android.com/kotlin/coroutines/coroutines-best-practices
```

**All 24 rules by ID:**

| Rule ID | Severity | What it catches |
|---------|----------|-----------------|
| `REMOVED_ASYNCTASK` | error | `AsyncTask` usage — removed in API 33 |
| `REMOVED_TEST_COROUTINE_DISPATCHER` | error | `TestCoroutineDispatcher` — removed in coroutines-test 1.8+ |
| `REMOVED_TEST_COROUTINE_SCOPE` | error | `TestCoroutineScope` — removed in coroutines-test 1.8+ |
| `GLOBALSCOPE_LAUNCH` | error | `GlobalScope.launch` — lifecycle leak |
| `GLOBALSCOPE_ASYNC` | error | `GlobalScope.async` — lifecycle leak |
| `XML_SCREEN_ORIENTATION_LOCK` | error | `android:screenOrientation` locks in XML — illegal on ≥600dp under API 36 |
| `XML_RESIZE_DISABLED` | error | `android:resizeableActivity="false"` — illegal on ≥600dp under API 36 |
| `RUNBLOCKING_UI` | error | `runBlocking {}` on main thread — causes ANR |
| `THREAD_SLEEP_IN_TEST` | error | `Thread.sleep()` in tests — causes flakiness |
| `START_ACTIVITY_FOR_RESULT` | error | `.startActivityForResult()` — deprecated, removed from recommended API |
| `DEPRECATED_CONTEXTUAL_FLOW_ROW` | warning | `ContextualFlowRow` — deprecated in Compose 1.8 |
| `DEPRECATED_CONTEXTUAL_FLOW_COLUMN` | warning | `ContextualFlowColumn` — deprecated in Compose 1.8 |
| `DEPRECATED_NAV_CONTROLLER_NEW_CODE` | warning | `rememberNavController()` — Navigation 2 API, Nav3 stable Nov 2025 |
| `DEPRECATED_NAV_HOST` | warning | `NavHost(` — Navigation 2 API |
| `DEPRECATED_INTENTSERVICE` | warning | `IntentService` — deprecated API 30 |
| `DEPRECATED_HANDLER_THREAD` | warning | `HandlerThread` — deprecated API 30 |
| `DEPRECATED_SHARED_PREFERENCES` | warning | `getSharedPreferences` / `SharedPreferences` — blocks main thread |
| `DEPRECATED_LIVEDATA_NEW_CODE` | warning | `MutableLiveData<` / `liveData {` — prefer StateFlow in new code |
| `DEPRECATED_BOTTOM_APP_BAR_M3E` | warning | `BottomAppBar(` — superseded by DockedToolbar in M3 Expressive |
| `GRADLE_KAPT_NEW_PROJECT` | warning | `kapt "` — slower than KSP, deprecated for most Jetpack libs |
| `DEPRECATED_ACCOUNT_MANAGER` | warning | `AccountManager` — deprecated, use CredentialManager |
| `INFO_HARDCODED_DISPATCH_MAIN` | info | `Dispatchers.Main` — makes unit tests harder |
| `INFO_GRADLE_HARDCODED_VERSION` | info | Hardcoded version in `implementation("group:id:1.2.3")` |
| `INFO_ON_BACK_PRESSED_OVERRIDE` | info | `override fun onBackPressed()` — legacy, no predictive back gesture |

---

### UC-04 — What permission do I need for the camera?

**The problem:** Android permissions have type classifications (normal vs dangerous vs signature), runtime request requirements, Play Store policy restrictions, and API-level changes. Getting any of these wrong causes crashes or Play Store rejection.

**The tool:** `android_permission_advisor`

**Source:** `src/tools/permissions.ts` — built-in registry of 40+ permissions

**Example prompt:**
```
What are the rules for CAMERA permission?
```

**What happens internally:**
```typescript
// src/tools/permissions.ts — registry entry
CAMERA: {
  fullName: "android.permission.CAMERA",
  type: "dangerous",
  runtimeRequest: true,
  group: "Camera",
  docUrl: "https://developer.android.com/training/camera2",
  notes: "Consider Photo Picker (no permission needed) for image selection use cases.",
}
```

Response tells you: type, whether runtime request is needed, Play Store restrictions, the correct `ActivityResultContracts` request pattern, and relevant notes.

---

## Intermediate Use Cases

---

### UC-05 — My app will target API 36 — what do I need to change?

**The problem:** Google Play requires all apps to target API 36 by August 2026. Android 16 introduced breaking changes that affect orientation handling, resizability, predictive back, and native library memory alignment. AI tools do not know the full scope.

**The tool:** `android_api36_compliance`

**Source:** `src/tools/api36-compliance.ts` — static reference grounded in `developer.android.com/about/versions/16/behavior-changes-all`

**Example prompt:**
```
What do I need to do to pass API 36 compliance?
```

**Key findings the tool returns (from source):**

**1. Manifest flags that now FAIL on ≥600dp devices:**
```xml
<!-- ❌ These are now illegal on tablets and foldables -->
<activity
  android:screenOrientation="portrait"
  android:resizeableActivity="false"
  android:maxAspectRatio="1.86"
/>
```

**2. Validator rule that catches these automatically:**
```typescript
// src/rules/android-rules.ts
{
  id:       "XML_SCREEN_ORIENTATION_LOCK",
  severity: "error",
  languages: ["xml"],
  pattern:  /android:screenOrientation\s*=\s*["'](portrait|landscape|...)['"]/gi,
  minSdkAbove: 29,  // only enforces for modern targets
}
```

**3. Predictive back requirement for API 36 targets:**
Use `BackHandler` in Compose or `OnBackPressedDispatcher` — `override fun onBackPressed()` is insufficient and detected by the `INFO_ON_BACK_PRESSED_OVERRIDE` rule.

**4. 16 KB page size for NDK code:**
Apps with native libraries must compile for 16 KB memory page alignment. Android Studio shows lint warnings for non-compliant APKs.

---

### UC-06 — I have a stack trace — what is the known cause?

**The problem:** Stack traces often point to known platform bugs. Googling them manually takes time and surfaces Stack Overflow posts that may be outdated.

**The tool:** `android_debugger`

**Source:** `src/tools/debugger.ts` — searches `issuetracker.google.com` with a 1-hour TTL cache

**Example prompt:**
```
I'm getting: java.lang.IllegalStateException: Fragment not attached to a context
```

The tool queries the official Android Issue Tracker for the exact exception and returns known bug reports, their status, and any official workarounds documented by the Android team.

---

### UC-07 — Should I use LiveData or StateFlow in new code?

**The problem:** LiveData is not removed, but StateFlow is the recommended replacement for new Compose-based code. AI tools often generate LiveData in new ViewModels because it was the default for years.

**The tool:** `android_component_status` for the status check + `kotlin_best_practices` for the migration pattern

**Source:**
```typescript
// src/constants.ts
LiveData: {
  status: "stable",
  docUrl: "https://developer.android.com/topic/libraries/architecture/livedata",
  notes: "Prefer StateFlow/SharedFlow in new code for better coroutine integration.",
}
```

```typescript
// src/rules/android-rules.ts
{
  id:       "DEPRECATED_LIVEDATA_NEW_CODE",
  severity: "warning",
  pattern:  /\bMutableLiveData\s*<|LiveData\s*<|liveData\s*\{/g,
  message:  "LiveData is legacy. Prefer StateFlow/SharedFlow for better coroutine and Compose integration.",
  replacement: "Use MutableStateFlow<T> with StateFlow<T> in ViewModel. Observe with collectAsStateWithLifecycle().",
}
```

The validator fires a `warning` (not `error`) on LiveData in new code — the tool knows it is not removed, just not recommended for new development.

---

### UC-08 — Validate a Gradle build file

**The problem:** Gradle files are a common source of AI errors — KAPT instead of KSP, hardcoded versions instead of Version Catalogs, and incorrect plugin declarations.

**The tool:** `android_code_validator` with language set to `gradle`

**Example prompt:**
```
Validate this build.gradle.kts:

dependencies {
    kapt "com.google.dagger:hilt-compiler:2.48"
    implementation("androidx.room:room-runtime:2.6.1")
}
```

**What fires:**
```typescript
// Rule 1
{
  id:       "GRADLE_KAPT_NEW_PROJECT",
  severity: "warning",
  pattern:  /\bkapt\s*["']/g,
  message:  "KAPT is slower than KSP and deprecated for most Jetpack libraries.",
  replacement: "Migrate to KSP (ksp plugin + ksp() dependency declaration).",
}

// Rule 2
{
  id:       "INFO_GRADLE_HARDCODED_VERSION",
  severity: "info",
  pattern:  /implementation\s*\(\s*["'][^"']+:\d+\.\d+[^"']*["']\s*\)/g,
  message:  "Hardcoded dependency version. Consider using version catalogs (libs.versions.toml).",
}
```

**Verdict:** `WARN` — 1 warning (KAPT), 1 info (hardcoded version).

---

### UC-09 — Navigation 2 or Navigation 3 for a new project?

**The problem:** Navigation 3 went stable in November 2025 — a complete architectural rewrite. AI tools documented in the Atomic Robot case study (January 2026) still generate Nav2 code even with internet access enabled.

**The tool:** `android_navigation3_guide`

**Source:** `src/tools/navigation3.ts`

The tool returns a side-by-side comparison table (grounded in source):

| Concept | Navigation 2 | Navigation 3 |
|---------|-------------|--------------|
| Back stack | Internal library state | Plain `Kotlin List<NavEntry<*>>` you own |
| Navigation trigger | `NavController.navigate()` | Add/remove from your back stack list |
| Graph definition | `NavHost` + `composable()` destinations | `NavDisplay` + type-safe `NavKey` |
| Adaptive layouts | Separate `NavigationSuiteScaffold` | Built-in via Scenes API |
| Testing | Hard — internal state | Easy — back stack is a plain list |

**The validator also catches Nav2 in new code:**
```typescript
{
  id:      "DEPRECATED_NAV_CONTROLLER_NEW_CODE",
  severity: "warning",
  pattern:  /rememberNavController\s*\(\s*\)/g,
  message:  "rememberNavController() is the Navigation 2 API. Navigation 3 is stable since November 2025.",
}
```

---

### UC-10 — Does my Compose UI test code have any issues?

**The problem:** `Thread.sleep()` in Compose UI tests causes flakiness in CI — timing-sensitive and non-deterministic. AI tools generate it routinely.

**The tool:** `android_code_validator` + `android_testing_guide`

**Example prompt:**
```
Validate this test:

@Test
fun testLoadingState() {
    composeTestRule.setContent { MyScreen() }
    Thread.sleep(1000)
    composeTestRule.onNodeWithText("Loaded").assertIsDisplayed()
}
```

**Rule that fires:**
```typescript
{
  id:       "THREAD_SLEEP_IN_TEST",
  severity: "error",
  pattern:  /Thread\.sleep\s*\(/g,
  message:  "Thread.sleep() in tests causes flakiness. Arbitrary wait, not coroutine-aware.",
  replacement: "Use advanceUntilIdle() for coroutine tests, or waitUntil { condition } for Compose UI tests.",
}
```

**Verdict:** `FAIL` — one error. The fix is `composeTestRule.waitUntil(timeoutMillis = 5000) { /* condition */ }`.

---

## Advanced Use Cases

---

### UC-11 — I am building a KMP project — which Room artifact do I use?

**The problem:** Room has two separate artifact groups for Android-only vs KMP projects. Using the wrong one causes the iOS build to fail — silently on Android.

**The tool:** `android_kmp_guide`

**Source:** `src/tools/kmp.ts`

```
Android-only Room:  androidx.room:room-runtime (androidMain only)
KMP Room:           androidx.room:room-runtime (commonMain, requires sqlite-bundled on iOS)
```

The tool returns the complete `build.gradle.kts` structure for the KMP Room setup — including the `ksp(libs.room.compiler)` target for each platform, the `sqlite-bundled` dependency for iOS, and the `expect/actual` database builder pattern.

**KMP-safe alternatives the tool also covers:**
- `io.ktor:ktor-client-core` for networking in `commonMain` (not Retrofit, which is Android-only)
- `androidx.datastore:datastore-preferences-core` for KMP DataStore (not the Android-only artifact)
- `io.insert-koin:koin-core` for DI in KMP (Hilt is Android-only and cannot be used in `commonMain`)

---

### UC-12 — My app uses screen orientation lock — will it pass Play Store review?

**The problem:** `android:screenOrientation="portrait"` passes current Play Store review but will fail from August 2026 when API 36 targeting is mandatory for all apps.

**The tools:** `android_code_validator` (catches the XML flag) + `android_api36_compliance` (explains the mandate)

**Paste this into the validator:**
```xml
<activity
  android:name=".MainActivity"
  android:screenOrientation="portrait"
  android:resizeableActivity="false"
/>
```

**Rule that fires:**
```typescript
{
  id:       "XML_SCREEN_ORIENTATION_LOCK",
  severity: "error",
  languages: ["xml"],
  pattern:  /android:screenOrientation\s*=\s*["'](portrait|landscape|...)['"]/gi,
  message:  "android:screenOrientation locks break Android 16 / API 36 compliance on ≥600dp devices.",
  replacement: "Remove the screenOrientation attribute. Use WindowSizeClass to handle orientation layouts in code.",
  docUrl:   "https://developer.android.com/about/versions/16/behavior-changes-16",
  notes:    "Play Store mandates API 36 targeting by August 2026. Fails large-screen quality checks.",
  minSdkAbove: 29,
}
```

**Verdict:** `FAIL`. The fix is to remove both attributes from the manifest and implement `WindowSizeClass`-based adaptive layouts.

---

### UC-13 — Full AI loop-back validation before shipping code

**The problem:** AI generates a ViewModel. The code looks correct. It compiles. But it has a `GlobalScope.launch`, a `MutableLiveData` in new code, and hardcoded `Dispatchers.Main`. None of these will fail your build but all are problems.

**The tool:** `android_code_validator` — the Level 3 loop-back gate

**Source:** `src/tools/validator.ts`

```
Level 1 — Tools installed, AI decides when to call them (passive)
Level 2 — Grounding Gate system prompt mandates calls before code generation (active)
Level 3 — android_code_validator validates every generated code block before user sees it (loop-back)
```

**Example — paste any generated ViewModel:**
```kotlin
class UserViewModel : ViewModel() {
    private val _users = MutableLiveData<List<User>>()
    val users: LiveData<List<User>> = _users

    fun loadUsers() {
        GlobalScope.launch {
            _users.postValue(repository.getUsers())
        }
    }
}
```

**Rules that fire:**
1. `GLOBALSCOPE_LAUNCH` → **error** — `viewModelScope.launch` is the correct scope inside a ViewModel
2. `DEPRECATED_LIVEDATA_NEW_CODE` → **warning** — `MutableStateFlow` with `collectAsStateWithLifecycle()` is the modern pattern

**Verdict:** `FAIL` — fix both before returning to user.

The loop-back pattern means the user never sees the broken version. The AI must fix all `error` violations before the code is returned.

---

### UC-14 — I am adding background location — what are the Play Store rules?

**The problem:** `ACCESS_BACKGROUND_LOCATION` is a Play Store restricted permission that requires policy approval, an in-app disclosure before the request, and a separate runtime request after foreground location is already granted. Getting any of these wrong causes rejection.

**The tool:** `android_permission_advisor`

**Source:** `src/tools/permissions.ts`

```typescript
ACCESS_BACKGROUND_LOCATION: {
  type: "dangerous",
  runtimeRequest: true,
  addedApi: 29,
  playRestriction: "RESTRICTED — requires Play Store policy approval. Must show in-app disclosure 
    before requesting. Only navigation, rideshare, family-safety categories normally qualify.",
  notes: "Must be requested separately AFTER foreground location is granted. System takes user 
    to settings on API 30+, not a dialog.",
}
```

The tool returns the correct `ActivityResultContracts.RequestPermission()` implementation, the required in-app disclosure timing, and what categories Play Store accepts for this permission.

---

### UC-15 — Validate an entire feature before it reaches code review

**The problem:** A code review catches bugs after a developer has already spent time writing them. AndroJack catches known-bad patterns before review by validating each file as it is written.

**How to use all three layers together:**

**Step 1 — Before writing any code:**
```
android_official_search("Jetpack Compose LazyColumn performance")
android_component_status("LazyColumn")
architecture_reference("MVVM")
gradle_dependency_checker("compose-bom")
```

**Step 2 — After writing ViewModel code:**
```
android_code_validator(viewModelCode, "kotlin", minSdk=24, targetSdk=36)
```

**Step 3 — After writing XML manifest entries:**
```
android_code_validator(manifestXml, "xml", targetSdk=36)
android_api36_compliance("orientation")
```

**Step 4 — After writing test code:**
```
android_code_validator(testCode, "kotlin")
android_testing_guide("compose testing")
```

**Step 5 — After writing Gradle files:**
```
android_code_validator(buildGradle, "gradle")
gradle_dependency_checker("room")
android_build_and_publish("ksp")
```

Running this sequence on a feature before opening a pull request catches:
- All 24 rule violations across Kotlin, XML, and Gradle
- Stale dependency versions
- API 36 manifest compliance failures
- Test anti-patterns

Code review then focuses on architecture and product logic — not known-bad patterns.

---

## What AndroJack Cannot Catch

These are real limitations, grounded in what the rule engine can and cannot do:

| Bug class | Why AndroJack cannot catch it | Right tool |
|-----------|-------------------------------|------------|
| Segmented button text truncation due to wrong modifier | An **absence** bug — no wrong code present, correct code missing | Visual testing / paparazzi |
| Disabled button fails WCAG AA contrast | Runtime visual property — no static pattern to match | Google Accessibility Scanner |
| Missing `try/catch` around repository call | Pattern matching cannot detect absent code blocks | Detekt with custom rules |
| Compose layout composition errors | Runtime rendering — not visible in static text | Android Studio Layout Inspector |
| Incorrect business logic | Not a documentation problem | Unit tests |

The rule engine catches **deprecated APIs**, **removed APIs**, **dangerous patterns with documented replacements**, and **Play Store compliance failures**. Everything outside that scope requires different tools.

---

## Appendix — Tool to Source File Mapping

| Tool name | Source file |
|-----------|-------------|
| `android_official_search` | `src/tools/search.ts` |
| `android_component_status` | `src/tools/component.ts` + `src/constants.ts` |
| `architecture_reference` | `src/tools/architecture.ts` + `src/constants.ts` |
| `android_debugger` | `src/tools/debugger.ts` |
| `gradle_dependency_checker` | `src/tools/gradle.ts` |
| `android_api_level_check` | `src/tools/api-level.ts` |
| `kotlin_best_practices` | `src/tools/kotlin-patterns.ts` |
| `material3_expressive` | `src/tools/m3-expressive.ts` |
| `android_permission_advisor` | `src/tools/permissions.ts` |
| `android_testing_guide` | `src/tools/testing.ts` |
| `android_build_and_publish` | `src/tools/build-publish.ts` |
| `android_large_screen_guide` | `src/tools/large-screen.ts` |
| `android_scalability_guide` | `src/tools/scalability.ts` |
| `android_navigation3_guide` | `src/tools/navigation3.ts` |
| `android_api36_compliance` | `src/tools/api36-compliance.ts` |
| `android_kmp_guide` | `src/tools/kmp.ts` |
| `android_ondevice_ai` | `src/tools/ondevice-ai.ts` |
| `android_play_policy_advisor` | `src/tools/play-policy.ts` |
| `android_xr_guide` | `src/tools/xr.ts` |
| `android_wearos_guide` | `src/tools/wear.ts` |
| `android_code_validator` | `src/tools/validator.ts` + `src/rules/android-rules.ts` |
| Rule engine | `src/rules/android-rules.ts` (24 rules) |
| Response cache | `src/cache.ts` (LRU, per-hostname TTL) |

---

*Every code example in this document is derived directly from the source files listed above. No examples are constructed from assumptions or documentation alone.*
