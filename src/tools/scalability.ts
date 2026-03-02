/**
 * Tool 13 – android_scalability_guide
 *
 * Architecture patterns for apps serving millions to billions of users.
 * Covers: Paging 3, offline-first sync at scale, network efficiency,
 * app startup optimization, memory management, modularization,
 * and Baseline Profiles for production performance.
 *
 * All patterns are grounded in official Android architecture guidance.
 * Sources:
 *   - developer.android.com/topic/architecture
 *   - developer.android.com/topic/libraries/architecture/paging/v3-overview
 *   - developer.android.com/topic/architecture/data-layer/offline-first
 *   - developer.android.com/topic/modularization
 *   - developer.android.com/topic/performance/baselineprofiles
 */

interface ScalabilityTopic {
  keywords: string[];
  content: string;
}

// ── Knowledge base ─────────────────────────────────────────────────────────────

const ARCHITECTURE_OVERVIEW = `
## Scalable Android Architecture — The Principles

### The official Android Architecture layers
\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  UI Layer                                                   │
│  Composables + ViewModel → UiState (StateFlow)              │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (optional, for complex business logic)        │
│  UseCases — pure Kotlin, no Android dependencies            │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  Repositories → Local (Room) + Remote (Retrofit/gRPC)       │
│  Single source of truth = local DB                          │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### What "scale" means for Android apps

Scale on Android is not server-side scale — it means:
1. **Cold start < 2s** on a mid-tier device (Pixel 3a class, 4GB RAM)
2. **Smooth 60/90/120fps** scrolling on large lists
3. **Offline-first** — app is usable without network
4. **No OOM** under large data volumes (Paging, not loading everything into memory)
5. **Battery-efficient** background sync (WorkManager, not polling)
6. **App size < 50MB** (AAB + on-demand delivery modules)

**Official guide:** https://developer.android.com/topic/architecture
`;

const PAGING_3 = `
## Paging 3 — Infinite Lists Without OOM

Paging 3 is the correct pattern for any list that can grow beyond what fits in memory.
Instagram, Google Photos, YouTube all use this pattern.

### Gradle dependency
\`\`\`kotlin
implementation("androidx.paging:paging-runtime:3.3.6")
implementation("androidx.paging:paging-compose:3.3.6")
\`\`\`

### PagingSource — fetches pages from one source

\`\`\`kotlin
// Source: developer.android.com/topic/libraries/architecture/paging/v3-overview

class UserPagingSource(
    private val apiService: UserApiService,
    private val query: String
) : PagingSource<Int, User>() {

    override fun getRefreshKey(state: PagingState<Int, User>): Int? {
        // Try to find page that contains the anchor position
        return state.anchorPosition?.let { anchor ->
            val page = state.closestPageToPosition(anchor)
            page?.prevKey?.plus(1) ?: page?.nextKey?.minus(1)
        }
    }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, User> {
        return try {
            val page = params.key ?: 1
            val response = apiService.searchUsers(
                query = query,
                page = page,
                pageSize = params.loadSize   // Paging 3 manages page size for you
            )
            LoadResult.Page(
                data = response.users,
                prevKey = if (page <= 1) null else page - 1,
                nextKey = if (response.users.isEmpty()) null else page + 1
            )
        } catch (e: IOException) {
            LoadResult.Error(e)
        } catch (e: HttpException) {
            LoadResult.Error(e)
        }
    }
}
\`\`\`

### RemoteMediator — network + Room cache (production pattern)

\`\`\`kotlin
@OptIn(ExperimentalPagingApi::class)
class UserRemoteMediator(
    private val query: String,
    private val database: AppDatabase,
    private val apiService: UserApiService
) : RemoteMediator<Int, User>() {

    override suspend fun load(
        loadType: LoadType,
        state: PagingState<Int, User>
    ): MediatorResult {
        return try {
            val page = when (loadType) {
                LoadType.REFRESH -> 1
                LoadType.PREPEND -> return MediatorResult.Success(endOfPaginationReached = true)
                LoadType.APPEND  -> {
                    val remoteKey = database.remoteKeyDao().getKey(query)
                    remoteKey?.nextPage ?: return MediatorResult.Success(endOfPaginationReached = true)
                }
            }

            val response = apiService.searchUsers(query, page, state.config.pageSize)

            database.withTransaction {
                if (loadType == LoadType.REFRESH) {
                    database.userDao().deleteByQuery(query)
                    database.remoteKeyDao().deleteByQuery(query)
                }
                database.userDao().insertAll(response.users)
                database.remoteKeyDao().insert(
                    RemoteKey(query, nextPage = if (response.users.isEmpty()) null else page + 1)
                )
            }

            MediatorResult.Success(endOfPaginationReached = response.users.isEmpty())
        } catch (e: IOException) {
            MediatorResult.Error(e)
        } catch (e: HttpException) {
            MediatorResult.Error(e)
        }
    }
}
\`\`\`

### Repository and ViewModel

\`\`\`kotlin
class UserRepository @Inject constructor(
    private val database: AppDatabase,
    private val apiService: UserApiService
) {
    @OptIn(ExperimentalPagingApi::class)
    fun searchUsers(query: String): Flow<PagingData<User>> = Pager(
        config = PagingConfig(
            pageSize = 20,
            enablePlaceholders = false,
            prefetchDistance = 5        // load next page when 5 items from end
        ),
        remoteMediator = UserRemoteMediator(query, database, apiService),
        pagingSourceFactory = { database.userDao().pagingSource(query) }
    ).flow.cachedIn(viewModelScope)    // cachedIn prevents re-fetching on recompose
}
\`\`\`

### Compose UI

\`\`\`kotlin
@Composable
fun UserListScreen(viewModel: UserViewModel = hiltViewModel()) {
    val lazyPagingItems = viewModel.users.collectAsLazyPagingItems()

    LazyColumn {
        items(
            count = lazyPagingItems.itemCount,
            key = lazyPagingItems.itemKey { it.id }  // stable keys prevent recomposition
        ) { index ->
            val user = lazyPagingItems[index]
            if (user != null) UserCard(user) else UserCardPlaceholder()
        }

        // Loading states
        when (lazyPagingItems.loadState.append) {
            is LoadState.Loading -> item { CircularProgressIndicator() }
            is LoadState.Error   -> item { RetryButton(onClick = { lazyPagingItems.retry() }) }
            else -> Unit
        }
    }
}
\`\`\`
`;

const OFFLINE_FIRST = `
## Offline-First Architecture at Scale

The offline-first pattern is mandatory for apps serving users with variable
connectivity (emerging markets, subways, rural areas).

### Core principle: Single Source of Truth

\`\`\`
Network ──────→ Repository ──────→ Room DB ──────→ UI (via Flow)
                    │
                    └── Room DB is ALWAYS the source of truth
                        Network writes to DB, UI reads from DB
                        Never: UI reads from network directly
\`\`\`

### Sync architecture with WorkManager

\`\`\`kotlin
// Source: developer.android.com/topic/architecture/data-layer/offline-first

// ── SyncWorker — runs in background, survives process death ──────────
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val syncRepository: SyncRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            syncRepository.syncAll()
            Result.success()
        } catch (e: HttpException) {
            // HTTP errors are usually retryable (rate limit, server error)
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        } catch (e: IOException) {
            // Network unavailable — retry when network available
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }

    @AssistedFactory
    interface Factory : ChildWorkerFactory
}

// ── Schedule periodic sync ─────────────────────────────────────────────
fun schedulePeriodicSync(workManager: WorkManager) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

    val request = PeriodicWorkRequestBuilder<SyncWorker>(
        repeatInterval = 1,
        repeatIntervalTimeUnit = TimeUnit.HOURS
    )
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .build()

    workManager.enqueueUniquePeriodicWork(
        "periodic_sync",
        ExistingPeriodicWorkPolicy.KEEP,   // don't reset running work
        request
    )
}
\`\`\`

### Conflict resolution — server wins (most common for cloud sync)

\`\`\`kotlin
@Transaction
suspend fun mergeRemoteUser(remote: UserDto) {
    val local = userDao.getUserByIdOnce(remote.id)
    // Server timestamp always wins in this pattern
    if (local == null || remote.updatedAt > local.updatedAt) {
        userDao.insertUser(remote.toEntity())
    }
    // For client-wins or merge: implement CRDT or last-write-wins by field
}
\`\`\`
`;

const NETWORK_EFFICIENCY = `
## Network Efficiency — Saving Data and Battery

### HTTP client best practices

\`\`\`kotlin
// Source: developer.android.com/training/efficient-downloads

// ── OkHttp — production config ────────────────────────────────────────
@Provides @Singleton
fun provideOkHttpClient(@ApplicationContext context: Context): OkHttpClient {
    val cacheDir = File(context.cacheDir, "http_cache")
    val cache = Cache(cacheDir, 50L * 1024 * 1024) // 50 MB HTTP cache

    return OkHttpClient.Builder()
        .cache(cache)                                      // disk cache for GET responses
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG)
                HttpLoggingInterceptor.Level.BODY
            else
                HttpLoggingInterceptor.Level.NONE          // never log bodies in production
        })
        .addNetworkInterceptor { chain ->
            // Add Cache-Control to requests that don't specify it
            val request = chain.request()
            val response = chain.proceed(request)
            val cacheControl = CacheControl.Builder()
                .maxAge(10, TimeUnit.MINUTES)
                .build()
            response.newBuilder()
                .header("Cache-Control", cacheControl.toString())
                .build()
        }
        .build()
}
\`\`\`

### Conditional requests — avoid downloading unchanged data

\`\`\`kotlin
// If-None-Match / ETag support (server must send ETags)
class UserApiService(private val okHttpClient: OkHttpClient) {
    suspend fun fetchUser(id: Int, etag: String? = null): Response<User> {
        val request = Request.Builder()
            .url("https://api.example.com/users/\$id")
            .apply { etag?.let { header("If-None-Match", it) } }
            .build()
        // 304 Not Modified → return cached; 200 → update cache + DB
        return okHttpClient.newCall(request).execute()
    }
}
\`\`\`

### Proto DataStore — faster than SharedPreferences for user settings

\`\`\`kotlin
// Prefer Proto DataStore over Preferences DataStore for typed, schema-safe storage
// implementation("androidx.datastore:datastore:1.1.2")

val Context.userPrefsStore: DataStore<UserPrefs> by dataStore(
    fileName = "user_prefs.pb",
    serializer = UserPrefsSerializer
)

// Read:
val userPrefs: Flow<UserPrefs> = context.userPrefsStore.data

// Write (atomic, on IO dispatcher):
suspend fun updateTheme(theme: Theme) {
    context.userPrefsStore.updateData { prefs ->
        prefs.toBuilder().setTheme(theme).build()
    }
}
\`\`\`
`;

const APP_STARTUP = `
## App Startup Optimization — Cold Start < 2 Seconds

Cold start is the #1 user retention factor. Google's 2-second threshold is the bar.

### Measure first

\`\`\`bash
# Measure cold start time with ADB (kills process, relaunches)
adb shell am force-stop com.yourapp
adb shell am start-activity -W -n com.yourapp/.MainActivity
# Look for "TotalTime" in output — this is the cold start duration
\`\`\`

### Baseline Profiles — 20–40% faster cold start

\`\`\`kotlin
// build.gradle.kts (app)
implementation("androidx.profileinstaller:profileinstaller:1.4.1")

// build.gradle.kts (macrobenchmark module)
plugins { id("androidx.baselineprofile") }
implementation("androidx.benchmark:benchmark-macro-junit4:1.3.3")

// BaselineProfileGenerator.kt (in macrobenchmark module)
@RunWith(AndroidJUnit4::class)
@LargeTest
class BaselineProfileGenerator {
    @get:Rule val rule = BaselineProfileRule()

    @Test
    fun generate() = rule.collect("com.yourapp") {
        pressHome()
        startActivityAndWait()           // measures cold start
        // Add your critical user journey flows:
        device.findObject(By.text("Login")).click()
        device.waitForIdle()
        device.findObject(By.text("Home")).waitForExists(5_000)
    }
}

// Generate and commit:
// ./gradlew :app:generateBaselineProfile
// Commit src/main/baseline-prof.txt to git
\`\`\`

### App Startup library — lazy-initialize heavy SDKs

\`\`\`kotlin
// PROBLEM: ContentProviders run before Application.onCreate() — many SDKs use this
// SOLUTION: App Startup library consolidates all provider-based init

// implementation("androidx.startup:startup-runtime:1.2.0")

class WorkManagerInitializer : Initializer<WorkManager> {
    override fun create(context: Context): WorkManager {
        val config = Configuration.Builder()
            .setMinimumLoggingLevel(Log.ERROR)  // less verbose in production
            .build()
        WorkManager.initialize(context, config)
        return WorkManager.getInstance(context)
    }

    override fun dependencies(): List<Class<out Initializer<*>>> = emptyList()
}

// AndroidManifest.xml — register the startup
<provider
    android:name="androidx.startup.InitializationProvider"
    android:authorities="\${applicationId}.androidx-startup">
    <meta-data
        android:name="com.yourapp.WorkManagerInitializer"
        android:value="androidx.startup" />
</provider>
\`\`\`

### Dagger Hilt — lazy component initialization

\`\`\`kotlin
// Use @Lazy for expensive dependencies not needed at startup
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val lazyAnalytics: Lazy<AnalyticsService>,  // injected but not constructed until first call
    private val userRepository: UserRepository
) : ViewModel() {
    fun trackEvent(event: String) {
        lazyAnalytics.get().track(event)  // constructed on first use, not at startup
    }
}
\`\`\`
`;

const MODULARIZATION = `
## Modularization — At Scale Team Architecture

For teams of 10+ engineers or apps with 100k+ LOC, modularization is required.
It enables: parallel compilation, feature ownership, on-demand delivery.

### Module types (official Android guidance)

\`\`\`
:app               ← Application shell, no business logic
  :feature:home    ← Feature module (owns UI + ViewModel for one user journey)
  :feature:search
  :feature:profile
  :core:data       ← Repository, API service, database — shared across features
  :core:domain     ← UseCases, domain models — no Android deps
  :core:ui         ← Shared Composables, theming, design system
  :core:testing    ← Shared test utilities (FakeRepositories, TestDispatchers)
  :core:network    ← OkHttp, Retrofit, interceptors
  :core:database   ← Room DB, DAOs, entities
\`\`\`

### build.gradle.kts convention plugins (avoid duplication)

\`\`\`kotlin
// build-logic/convention/src/main/kotlin/AndroidFeatureConventionPlugin.kt
// Each feature module uses a single convention plugin instead of duplicating config

class AndroidFeatureConventionPlugin : Plugin<Project> {
    override fun apply(target: Project) = with(target) {
        with(pluginManager) {
            apply("com.android.library")
            apply("org.jetbrains.kotlin.android")
            apply("com.google.devtools.ksp")
            apply("com.google.dagger.hilt.android")
        }
        extensions.configure<LibraryExtension> {
            compileSdk = libs.findVersion("compileSdk").get().requiredVersion.toInt()
            defaultConfig.minSdk = libs.findVersion("minSdk").get().requiredVersion.toInt()
        }
        dependencies {
            add("implementation", project(":core:ui"))
            add("implementation", project(":core:data"))
            add("testImplementation", project(":core:testing"))
        }
    }
}
\`\`\`

### Dynamic Feature Modules — shrink install size

\`\`\`kotlin
// build.gradle.kts (dynamic feature)
plugins { id("com.android.dynamic-feature") }

android {
    // Delivered on demand — not in base APK
}

// Trigger install at runtime:
val splitInstallManager = SplitInstallManagerFactory.create(context)
val request = SplitInstallRequest.newBuilder()
    .addModule("feature_camera")
    .build()
splitInstallManager.startInstall(request)
    .addOnSuccessListener { sessionId -> /* module ready */ }
    .addOnFailureListener { e -> /* handle error */ }
\`\`\`
`;

const PERFORMANCE_COMPOSE = `
## Compose Performance — Preventing Recomposition at Scale

Compose is fast when used correctly. At scale, careless state reads cause entire
list items to recompose on every scroll tick, causing dropped frames.

\`\`\`kotlin
// ── Rule 1: Read state as late as possible (defer to lambda) ──────────
// ❌ Reads color during recomposition of the outer Composable
@Composable
fun BadScrollEffect(scrollState: ScrollState) {
    val color = if (scrollState.value > 0) Color.Red else Color.White
    Box(Modifier.background(color))  // recomposes entire Box tree on every scroll
}

// ✅ Defers read to draw phase — no recomposition on scroll
@Composable
fun GoodScrollEffect(scrollState: ScrollState) {
    Box(Modifier.drawBehind {
        val color = if (scrollState.value > 0) Color.Red else Color.White
        drawRect(color)
    })
}

// ── Rule 2: Use keys in LazyColumn to prevent item recreation ─────────
LazyColumn {
    items(users, key = { user -> user.id }) { user ->  // stable key prevents recreation
        UserCard(user)
    }
}

// ── Rule 3: Prefer immutable data classes for list items ──────────────
// Compose's snapshot system can skip recomposition when inputs haven't changed
@Stable  // or make it a data class
data class UserUiModel(val id: Int, val name: String, val avatarUrl: String)

// ── Rule 4: derivedStateOf for expensive computations ─────────────────
val showScrollToTop by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 3 }
}
// Only recomposes when the Boolean result changes, not on every scroll event

// ── Rule 5: Use @Stable or @Immutable on your own classes ─────────────
@Immutable
data class UserListUiState(
    val users: ImmutableList<UserUiModel>,  // use kotlinx-collections-immutable
    val isLoading: Boolean,
    val error: String?
)
\`\`\`

### Profile Compose — identify recomposition hotspots

\`\`\`bash
# Enable recomposition highlighting in Android Studio:
# Layout Inspector → Recomposition Counts
# Or add to your Composable during debugging:
# SideEffect { Log.d("Recompose", "UserCard recomposed for user \$userId") }
\`\`\`
`;

// ── Topic routing ──────────────────────────────────────────────────────────────

const TOPICS: ScalabilityTopic[] = [
  { keywords: ["overview", "intro", "architecture", "layers", "principles", "scale", "million", "billion"], content: ARCHITECTURE_OVERVIEW },
  { keywords: ["paging", "paging3", "infinite", "list", "lazycolumn large", "pagingdata", "remotemediator", "pagingsource"], content: PAGING_3 },
  { keywords: ["offline", "offline-first", "sync", "syncworker", "conflict", "single source", "cache"], content: OFFLINE_FIRST },
  { keywords: ["network", "okhttp", "cache", "http cache", "etag", "bandwidth", "data usage", "proto datastore"], content: NETWORK_EFFICIENCY },
  { keywords: ["startup", "cold start", "launch time", "baseline profile", "profileinstaller", "app startup", "slow start", "lazy init"], content: APP_STARTUP },
  { keywords: ["modularization", "module", "feature module", "convention plugin", "dynamic feature", "team", "large team"], content: MODULARIZATION },
  { keywords: ["compose performance", "recomposition", "skip recompose", "derivedstateof", "stable", "immutable", "key", "lazy key", "perf"], content: PERFORMANCE_COMPOSE },
];

const INDEX = `
## Android Scalability Architecture Guide

**Query topics available:**

| Topic | Example query |
|-------|------|
| Architecture overview | "scalable architecture overview" |
| Paging 3 (infinite lists) | "Paging3 RemoteMediator Room" |
| Offline-first sync | "offline first SyncWorker" |
| Network efficiency | "OkHttp cache ETag" |
| App startup | "cold start Baseline Profile" |
| Modularization | "feature modules team" |
| Compose performance | "recomposition derivedStateOf" |

**Official sources:**
- https://developer.android.com/topic/architecture
- https://developer.android.com/topic/libraries/architecture/paging/v3-overview
- https://developer.android.com/topic/architecture/data-layer/offline-first
- https://developer.android.com/topic/performance/baselineprofiles
- https://developer.android.com/topic/modularization
`;

export async function androidScalabilityGuide(topic: string): Promise<string> {
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
      `**Official guide:** https://developer.android.com/topic/architecture\n` +
      `> 🏗️ GROUNDING GATE: Architecture patterns grounded in official Android guidance. Apply these for apps scaling to millions of users.`
    );
  }

  return (
    `## Scalability: "${trimmed}"\n\n` +
    `No built-in entry found. Check:\n` +
    `- https://developer.android.com/topic/architecture\n` +
    `- https://developer.android.com/topic/modularization\n\n` +
    INDEX
  );
}
