/**
 * Tool 7 – kotlin_best_practices
 *
 * Official Kotlin + Android-Kotlin idioms grounded in kotlinlang.org and
 * Android Architecture docs. All snippets target Kotlin 2.x / coroutines 1.9+.
 *
 * IMPORTANT: Uses StandardTestDispatcher (not deprecated TestCoroutineDispatcher)
 * per the coroutines-test 1.6+ migration guide.
 */
import { secureFetch, extractPageText } from "../http.js";
const KOTLIN_PATTERNS = [
    // ── Coroutines ─────────────────────────────────────────────────────────────
    {
        name: "coroutines-viewmodel",
        description: "Launching coroutines safely from a ViewModel",
        officialGuideUrl: "https://developer.android.com/kotlin/coroutines/coroutines-best-practices",
        codeSnippet: `class MyViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {         // cancelled automatically when ViewModel cleared
            val result = withContext(Dispatchers.IO) { repository.fetch() }
            _uiState.value = result
        }
    }
}`,
        antiPattern: "Do NOT use GlobalScope.launch — it leaks beyond ViewModel lifecycle and cannot be cancelled.",
    },
    // ── StateFlow ──────────────────────────────────────────────────────────────
    {
        name: "stateflow-ui",
        description: "Collecting StateFlow safely in Compose or Fragment (lifecycle-aware)",
        officialGuideUrl: "https://developer.android.com/kotlin/flow/stateflow-and-sharedflow",
        codeSnippet: `// ── In Compose (preferred) ───────────────────────────────────────────
@Composable
fun MyScreen(viewModel: MyViewModel = hiltViewModel()) {
    // collectAsStateWithLifecycle cancels collection in STOPPED state (saves battery)
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // render uiState
}

// ── In Fragment ──────────────────────────────────────────────────────
viewLifecycleOwner.lifecycleScope.launch {
    // repeatOnLifecycle starts/stops collection with the lifecycle
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { state -> /* update UI */ }
    }
}`,
        antiPattern: "Never use `lifecycleScope.launch { flow.collect {} }` directly — collection continues in background when the app is backgrounded, wasting resources and risking crashes.",
    },
    // ── Compose state ──────────────────────────────────────────────────────────
    {
        name: "compose-state",
        description: "State hoisting, remember, and derivedStateOf in Jetpack Compose",
        officialGuideUrl: "https://developer.android.com/jetpack/compose/state",
        codeSnippet: `// ── Simple local state ───────────────────────────────────────────────
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) { Text("Count: \$count") }
}

// ── Hoisted (preferred for reusable, testable components) ─────────────
@Composable
fun Counter(count: Int, onIncrement: () -> Unit) {
    Button(onClick = onIncrement) { Text("Count: \$count") }
}

// ── derivedStateOf — derive expensive computation, recompose only when result changes
val isScrolled by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 0 }
}

// ── snapshotFlow — bridge Compose state to a coroutine Flow
LaunchedEffect(Unit) {
    snapshotFlow { listState.firstVisibleItemIndex }
        .distinctUntilChanged()
        .collect { index -> viewModel.onListScrolled(index) }
}`,
        antiPattern: "Avoid storing plain MutableState in ViewModel — use StateFlow and convert with collectAsStateWithLifecycle() in Compose.",
    },
    // ── LaunchedEffect / rememberCoroutineScope ────────────────────────────────
    {
        name: "launched-effect",
        description: "LaunchedEffect, rememberCoroutineScope, and SideEffect — when to use each",
        officialGuideUrl: "https://developer.android.com/jetpack/compose/side-effects",
        codeSnippet: `// ── LaunchedEffect — coroutine tied to key, restarts when key changes ────
@Composable
fun UserScreen(userId: String) {
    LaunchedEffect(userId) {          // re-runs when userId changes
        viewModel.loadUser(userId)    // safe: cancelled on recomposition or key change
    }
}

// ── rememberCoroutineScope — user-triggered coroutines (not recomposition-triggered)
@Composable
fun SaveButton(onSave: suspend () -> Unit) {
    val scope = rememberCoroutineScope()
    Button(onClick = { scope.launch { onSave() } }) { Text("Save") }
}

// ── produceState — bridge non-Compose async source to Compose State
@Composable
fun UserAvatar(userId: String): State<Bitmap?> = produceState<Bitmap?>(
    initialValue = null,
    key1 = userId
) {
    value = withContext(Dispatchers.IO) { avatarRepository.load(userId) }
}`,
        antiPattern: "Do NOT launch coroutines directly in Composable body — only inside LaunchedEffect, rememberCoroutineScope, or SideEffect.",
    },
    // ── Room DAO ──────────────────────────────────────────────────────────────
    {
        name: "room-dao",
        description: "Room DAO with suspend functions, Flow, and transactions",
        officialGuideUrl: "https://developer.android.com/training/data-storage/room/accessing-data",
        codeSnippet: `@Dao
interface UserDao {
    // Flow — auto-emits on every DB change; ideal for reactive UI
    @Query("SELECT * FROM users WHERE id = :id")
    fun getUserById(id: Int): Flow<User>

    @Query("SELECT * FROM users ORDER BY name ASC")
    fun getAllUsers(): Flow<List<User>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: User)

    @Update
    suspend fun updateUser(user: User)

    @Delete
    suspend fun deleteUser(user: User)

    // Transaction — multiple operations as a single atomic unit
    @Transaction
    @Query("SELECT * FROM users WHERE teamId = :teamId")
    fun getUsersWithTeam(teamId: Int): Flow<List<UserWithTeam>>
}`,
        antiPattern: "Never run Room queries on the main thread. Always use suspend functions or Flow. Never use RxJava wrappers — use Flow.",
    },
    // ── Hilt ──────────────────────────────────────────────────────────────────
    {
        name: "hilt-injection",
        description: "Hilt dependency injection — ViewModel, Repository, and custom modules",
        officialGuideUrl: "https://developer.android.com/training/dependency-injection/hilt-android",
        codeSnippet: `// ── Application entry point ──────────────────────────────────────────
@HiltAndroidApp
class App : Application()

// ── ViewModel injection (no factory boilerplate) ──────────────────────
@HiltViewModel
class MyViewModel @Inject constructor(
    private val repository: UserRepository,
    @ApplicationContext private val context: Context
) : ViewModel()

// Usage in Activity/Fragment:
val viewModel: MyViewModel by viewModels()  // Hilt auto-creates it

// ── Repository with interface binding ─────────────────────────────────
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    @Binds @Singleton
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository
}

// ── Provides for third-party objects ──────────────────────────────────
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder().build()

    @Provides @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
}`,
        antiPattern: "Never pass Activity Context into ViewModel — use @ApplicationContext. Never create ViewModels with `MyViewModel()` directly — always use by viewModels() or by hiltViewModel().",
    },
    // ── Navigation Compose ────────────────────────────────────────────────────
    {
        name: "navigation-compose",
        description: "Type-safe Compose Navigation with nested graphs and deep links",
        officialGuideUrl: "https://developer.android.com/jetpack/compose/navigation",
        codeSnippet: `// ── Route definitions (type-safe, Kotlin 2.x) ────────────────────────
@Serializable object Home
@Serializable data class Detail(val itemId: Int)
@Serializable object Settings

// ── NavHost setup ────────────────────────────────────────────────────
@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    NavHost(navController, startDestination = Home) {
        composable<Home> {
            HomeScreen(onItemClick = { id -> navController.navigate(Detail(id)) })
        }
        composable<Detail> { backStackEntry ->
            val detail: Detail = backStackEntry.toRoute()
            DetailScreen(itemId = detail.itemId)
        }
        composable<Settings> { SettingsScreen() }
    }
}

// ── Navigate back with result ─────────────────────────────────────────
val savedStateHandle = navController.currentBackStackEntry?.savedStateHandle
savedStateHandle?.set("result", "value")
navController.popBackStack()`,
        antiPattern: "Avoid string route literals — use @Serializable data classes (Navigation 2.8+) for type safety and compile-time verification.",
    },
    // ── WorkManager ───────────────────────────────────────────────────────────
    {
        name: "workmanager-task",
        description: "WorkManager for deferrable background work at scale",
        officialGuideUrl: "https://developer.android.com/topic/libraries/architecture/workmanager",
        codeSnippet: `class SyncWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        return try {
            val inputData = inputData.getString("userId") ?: return Result.failure()
            repository.sync(inputData)
            Result.success(workDataOf("syncedAt" to System.currentTimeMillis()))
        } catch (e: IOException) {
            // Transient — retry up to 3 times with exponential backoff
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

// ── Schedule with constraints ─────────────────────────────────────────
val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
    .setConstraints(
        Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
    )
    .setInputData(workDataOf("userId" to userId))
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
    .build()

// Enqueue uniquely — prevents duplicate syncs
WorkManager.getInstance(context).enqueueUniqueWork(
    "user_sync_\${userId}",
    ExistingWorkPolicy.KEEP,   // don't replace if already queued
    syncRequest
)`,
        antiPattern: "Do NOT use plain Service or AlarmManager for deferrable work — the system kills them. WorkManager survives device restarts and respects battery/Doze.",
    },
    // ── Sealed Result / UiState ───────────────────────────────────────────────
    {
        name: "sealed-result",
        description: "Sealed interface UiState pattern with StateFlow",
        officialGuideUrl: "https://developer.android.com/topic/architecture/ui-layer/stateholders",
        codeSnippet: `// ── State definition ─────────────────────────────────────────────────
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data class Success<T>(val data: T) : UiState<T>
    data class Error(val message: String, val cause: Throwable? = null) : UiState<Nothing>
}

// ── ViewModel ────────────────────────────────────────────────────────
class UserViewModel @Inject constructor(
    private val repository: UserRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow<UiState<User>>(UiState.Loading)
    val uiState: StateFlow<UiState<User>> = _uiState.asStateFlow()

    init { loadUser() }

    fun loadUser() {
        _uiState.value = UiState.Loading
        viewModelScope.launch {
            _uiState.value = repository.getUser()
                .fold(
                    onSuccess = { UiState.Success(it) },
                    onFailure = { UiState.Error(it.message ?: "Unknown error", it) }
                )
        }
    }
}

// ── Compose rendering ─────────────────────────────────────────────────
@Composable
fun UserScreen(viewModel: UserViewModel = hiltViewModel()) {
    when (val state = viewModel.uiState.collectAsStateWithLifecycle().value) {
        is UiState.Loading -> CircularProgressIndicator()
        is UiState.Success -> UserContent(state.data)
        is UiState.Error   -> ErrorMessage(state.message, onRetry = viewModel::loadUser)
    }
}`,
    },
    // ── Offline-first / Repository ────────────────────────────────────────────
    {
        name: "offline-first",
        description: "Offline-first repository with Room cache + network sync (production pattern)",
        officialGuideUrl: "https://developer.android.com/topic/architecture/data-layer/offline-first",
        codeSnippet: `// ── Repository — single source of truth is the local DB ─────────────
class UserRepository @Inject constructor(
    private val userDao: UserDao,
    private val apiService: UserApiService,
    private val networkMonitor: NetworkMonitor
) {
    // UI always reads from DB (never directly from network)
    fun getUser(id: Int): Flow<User> = userDao.getUserById(id)

    // Sync is a separate operation triggered by UI or WorkManager
    suspend fun refreshUser(id: Int) {
        if (!networkMonitor.isConnected()) return  // graceful degradation
        try {
            val networkUser = apiService.fetchUser(id)
            userDao.insertUser(networkUser.toEntity())  // DB update triggers Flow emission
        } catch (e: HttpException) {
            throw DataSyncException("Failed to refresh user", e)
        }
    }
}

// ── NetworkMonitor — inject for testability ───────────────────────────
class NetworkMonitorImpl @Inject constructor(
    @ApplicationContext private val context: Context
) : NetworkMonitor {
    override val isConnected: Flow<Boolean> = callbackFlow {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network)  { trySend(true)  }
            override fun onLost(network: Network)       { trySend(false) }
        }
        cm.registerDefaultNetworkCallback(callback)
        awaitClose { cm.unregisterNetworkCallback(callback) }
    }.distinctUntilChanged()
}`,
        antiPattern: "Never return network data directly to UI. Always persist to DB first (Room Flow triggers UI update automatically). This is the offline-first contract.",
    },
    {
        name: "mvi",
        description: "MVI (Model-View-Intent) — single sealed UiState, sealed Intent/Action classes, deterministic state transitions. Current best practice for complex screens (2025+).",
        officialGuideUrl: "https://developer.android.com/topic/architecture/ui-layer/stateholders",
        codeSnippet: `
// MVI — recommended for complex screens: checkout, real-time feeds, multi-step flows
// Google uses MVI in Google Pay, Maps real-time UI, and complex first-party flows.
// Key advantage over MVVM: single source of state, deterministic transitions, easier testing.

// 1. Sealed UiState — single source of truth (replaces multiple StateFlow fields)
sealed interface CheckoutUiState {
  data object Loading : CheckoutUiState
  data class Content(
    val cartItems: List<CartItem>,
    val total: String,
    val selectedPaymentMethod: PaymentMethod?,
    val isProcessing: Boolean = false
  ) : CheckoutUiState
  data class Error(val message: String) : CheckoutUiState
  data object Success : CheckoutUiState
}

// 2. Sealed Intent/Action — all user events as a sealed class
sealed interface CheckoutIntent {
  data class SelectPaymentMethod(val method: PaymentMethod) : CheckoutIntent
  data class RemoveItem(val itemId: String) : CheckoutIntent
  data object ConfirmOrder : CheckoutIntent
  data object RetryLoad : CheckoutIntent
}

// 3. ViewModel — single state, single event handler
@HiltViewModel
class CheckoutViewModel @Inject constructor(
  private val cartRepository: CartRepository,
  private val orderRepository: OrderRepository
) : ViewModel() {

  private val _uiState = MutableStateFlow<CheckoutUiState>(CheckoutUiState.Loading)
  val uiState: StateFlow<CheckoutUiState> = _uiState.asStateFlow()

  init { loadCart() }

  // Single entry point for all intents — deterministic, testable
  fun handleIntent(intent: CheckoutIntent) {
    when (intent) {
      is CheckoutIntent.SelectPaymentMethod -> selectPayment(intent.method)
      is CheckoutIntent.RemoveItem -> removeItem(intent.itemId)
      is CheckoutIntent.ConfirmOrder -> confirmOrder()
      is CheckoutIntent.RetryLoad -> loadCart()
    }
  }

  private fun loadCart() {
    viewModelScope.launch {
      _uiState.value = CheckoutUiState.Loading
      cartRepository.getCart()
        .onSuccess { cart ->
          _uiState.value = CheckoutUiState.Content(
            cartItems = cart.items,
            total = cart.formattedTotal,
            selectedPaymentMethod = cart.defaultPaymentMethod
          )
        }
        .onFailure { _uiState.value = CheckoutUiState.Error(it.message ?: "Unknown error") }
    }
  }

  private fun selectPayment(method: PaymentMethod) {
    // Pure state transformation — no side effects
    val current = _uiState.value as? CheckoutUiState.Content ?: return
    _uiState.value = current.copy(selectedPaymentMethod = method)
  }

  private fun confirmOrder() {
    val current = _uiState.value as? CheckoutUiState.Content ?: return
    if (current.selectedPaymentMethod == null) return

    viewModelScope.launch {
      _uiState.value = current.copy(isProcessing = true)
      orderRepository.submitOrder(current.cartItems, current.selectedPaymentMethod)
        .onSuccess { _uiState.value = CheckoutUiState.Success }
        .onFailure { _uiState.value = CheckoutUiState.Error(it.message ?: "Order failed") }
    }
  }
}

// 4. Compose UI — observe single state, emit intents
@Composable
fun CheckoutScreen(viewModel: CheckoutViewModel = hiltViewModel()) {
  val uiState by viewModel.uiState.collectAsStateWithLifecycle()

  when (val state = uiState) {
    is CheckoutUiState.Loading -> LoadingIndicator()
    is CheckoutUiState.Content -> CheckoutContent(
      state = state,
      onIntent = viewModel::handleIntent  // Pass single handler, not multiple lambdas
    )
    is CheckoutUiState.Error -> ErrorScreen(
      message = state.message,
      onRetry = { viewModel.handleIntent(CheckoutIntent.RetryLoad) }
    )
    is CheckoutUiState.Success -> OrderSuccessScreen()
  }
}

// 5. Testing — deterministic, no mock observers
@Test
fun selectingPaymentMethod_updatesState() = runTest {
  val viewModel = CheckoutViewModel(fakeCartRepo, fakeOrderRepo)
  viewModel.uiState.test {
    awaitItem() // Loading
    awaitItem() // Content

    viewModel.handleIntent(CheckoutIntent.SelectPaymentMethod(PaymentMethod.CARD))
    val updated = awaitItem() as CheckoutUiState.Content
    assertThat(updated.selectedPaymentMethod).isEqualTo(PaymentMethod.CARD)
  }
}`,
        antiPattern: "Don't use MVI for simple screens — a form with 2 fields doesn't need a sealed state class. Use MVVM (multiple StateFlow fields) for simple screens. MVI pays off when: you have 4+ distinct UI states, state transitions must be deterministic, or you need to replay actions for testing. Mixing: don't add Intent classes to an MVVM ViewModel — commit to one pattern per screen.",
    },
];
function findPattern(query) {
    const lower = query.toLowerCase();
    return KOTLIN_PATTERNS.find((p) => p.name.includes(lower) ||
        lower.includes(p.name) ||
        p.description.toLowerCase().includes(lower) ||
        p.codeSnippet.toLowerCase().includes(lower.slice(0, 20)));
}
export async function kotlinBestPractices(topic) {
    if (!topic || topic.trim().length < 2) {
        return (`## Available Kotlin/Android Patterns\n\n` +
            KOTLIN_PATTERNS.map((p) => `- \`${p.name}\` — ${p.description}`).join("\n") +
            `\n\nPass any name above to get official code snippets and anti-patterns.\n` +
            `\n**Official guides:**\n- https://developer.android.com/kotlin/coroutines/coroutines-best-practices\n- https://developer.android.com/jetpack/compose/state`);
    }
    const sanitized = topic.trim().slice(0, 200);
    const pattern = findPattern(sanitized);
    if (pattern) {
        return (`## Kotlin Best Practice: ${pattern.name}\n\n` +
            `**Description:** ${pattern.description}\n` +
            `**Official Guide:** ${pattern.officialGuideUrl}\n\n` +
            `### ✅ Recommended Pattern\n\`\`\`kotlin\n${pattern.codeSnippet}\n\`\`\`\n\n` +
            (pattern.antiPattern ? `### ❌ Anti-Pattern\n> ${pattern.antiPattern}\n\n` : "") +
            `> 🎯 GROUNDING GATE: Pattern sourced from official Android/Kotlin documentation.`);
    }
    // Live fallback
    const searchUrl = `https://developer.android.com/s/results?q=${encodeURIComponent(sanitized)}`;
    try {
        const html = await secureFetch(searchUrl);
        const text = extractPageText(html, 2000);
        return (`## Kotlin Best Practice: "${sanitized}"\n\n` +
            `No built-in snippet found. Official Android search results:\n` +
            `**Source:** ${searchUrl}\n\n${text}\n\n` +
            `> Review the official docs above before implementing.`);
    }
    catch {
        return (`## Kotlin Best Practice: "${sanitized}"\n\n` +
            `Could not fetch live results. Search manually:\n` +
            `- https://developer.android.com/s/results?q=${encodeURIComponent(sanitized)}\n` +
            `- https://kotlinlang.org/docs/coroutines-guide.html`);
    }
}
