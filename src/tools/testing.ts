/**
 * Tool 10 – android_testing_guide
 *
 * Complete Android testing reference grounded in official docs.
 * Targets coroutines-test 1.9+ (StandardTestDispatcher, not deprecated TestCoroutineDispatcher).
 *
 * Sources:
 *   - developer.android.com/training/testing
 *   - developer.android.com/develop/ui/compose/testing
 *   - developer.android.com/training/dependency-injection/hilt-testing
 */

interface TestingTopic {
  keywords: string[];
  content: string;
}

// ── Knowledge base ─────────────────────────────────────────────────────────────

const SETUP = `
## Android Testing Setup — Dependencies & Config

\`\`\`kotlin
// build.gradle.kts (app)
android {
    defaultConfig {
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        // For Hilt instrumented tests:
        // testInstrumentationRunner = "com.yourapp.HiltTestRunner"
    }
    packaging {
        resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    }
    testOptions {
        unitTests.isReturnDefaultValues = true   // avoids AndroidLog crashes in unit tests
        animationsDisabled = true                // prevent flaky UI test timing issues
    }
}

dependencies {
    // ── Unit tests (src/test — JVM only, fast) ──────────────────────────────
    testImplementation("junit:junit:4.13.2")
    testImplementation("io.mockk:mockk:1.13.14")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")  // StandardTestDispatcher
    testImplementation("app.cash.turbine:turbine:1.2.0")          // Flow testing
    testImplementation("androidx.arch.core:core-testing:2.2.0")   // InstantTaskExecutorRule
    testImplementation("com.google.truth:truth:1.4.4")            // Fluent assertions
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")

    // ── Instrumented tests (src/androidTest — needs emulator/device) ────────
    androidTestImplementation(platform("androidx.compose:compose-bom:2025.05.00"))
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.test.espresso:espresso-intents:3.6.1")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.52")
    kspAndroidTest("com.google.dagger:hilt-compiler:2.52")
    androidTestImplementation("androidx.navigation:navigation-testing:2.8.9")
    androidTestImplementation("io.mockk:mockk-android:1.13.14")
}
\`\`\`

> 📚 Source: developer.android.com/training/testing
`;

const UNIT_TESTS = `
## Unit Testing — ViewModel, Repository, Room DAO

### MainDispatcherRule — CORRECT for coroutines-test 1.9+

\`\`\`kotlin
// Source: developer.android.com/kotlin/coroutines/test
// IMPORTANT: Use StandardTestDispatcher, not deprecated TestCoroutineDispatcher
class MainDispatcherRule(
    private val dispatcher: TestDispatcher = StandardTestDispatcher()
) : TestWatcher() {
    override fun starting(description: Description?) { Dispatchers.setMain(dispatcher) }
    override fun finished(description: Description?) { Dispatchers.resetMain() }
}
\`\`\`

### ViewModel test with Turbine + StandardTestDispatcher

\`\`\`kotlin
class LoginViewModelTest {

    @get:Rule val coroutineRule = MainDispatcherRule()

    private val repository = mockk<AuthRepository>()
    private lateinit var viewModel: LoginViewModel

    @Before
    fun setup() { viewModel = LoginViewModel(repository) }

    @Test
    fun \`login success emits LoggedIn state\`() = runTest {
        // Arrange
        coEvery { repository.login("user", "pass") } returns Result.success(User("user"))

        viewModel.uiState.test {
            viewModel.login("user", "pass")

            // runTest + StandardTestDispatcher: advance time explicitly
            val loading = awaitItem()
            assertTrue(loading is UiState.Loading)

            val success = awaitItem() as UiState.Success
            assertEquals("user", success.data.name)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun \`login failure emits Error state\`() = runTest {
        coEvery { repository.login(any(), any()) } returns Result.failure(IOException("Network error"))

        viewModel.uiState.test {
            viewModel.login("user", "wrong")
            skipItems(1) // Loading
            val error = awaitItem() as UiState.Error
            assertEquals("Network error", error.message)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
\`\`\`

### Repository test with MockWebServer

\`\`\`kotlin
class UserRepositoryTest {
    private val server = MockWebServer()
    private lateinit var repository: UserRepository

    @Before
    fun setup() {
        server.start()
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        repository = UserRepository(retrofit.create(UserApi::class.java))
    }

    @After fun tearDown() { server.shutdown() }

    @Test
    fun \`fetchUser returns User on 200\`() = runTest {
        server.enqueue(MockResponse().setBody("""{"id":1,"name":"Alice"}""").setResponseCode(200))
        val result = repository.fetchUser(1)
        assertTrue(result.isSuccess)
        assertEquals("Alice", result.getOrNull()?.name)
    }

    @Test
    fun \`fetchUser wraps 404 as failure\`() = runTest {
        server.enqueue(MockResponse().setResponseCode(404))
        val result = repository.fetchUser(1)
        assertTrue(result.isFailure)
    }
}
\`\`\`

### Room in-memory database test

\`\`\`kotlin
@RunWith(AndroidJUnit4::class)
class UserDaoTest {
    private lateinit var db: AppDatabase
    private lateinit var dao: UserDao

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        ).allowMainThreadQueries().build()
        dao = db.userDao()
    }

    @After fun tearDown() { db.close() }

    @Test
    fun insertAndRetrieve() = runTest {
        val user = User(id = 1, name = "Alice")
        dao.insertUser(user)
        val retrieved = dao.getUserById(1).first()
        assertEquals(user, retrieved)
    }

    @Test
    fun flowEmitsOnUpdate() = runTest {
        dao.getUserById(1).test {
            // Initially null or empty
            dao.insertUser(User(1, "Alice"))
            val item = awaitItem()
            assertEquals("Alice", item?.name)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
\`\`\`
`;

const COMPOSE_TESTING = `
## Compose UI Testing

\`\`\`kotlin
// Source: developer.android.com/develop/ui/compose/testing

@RunWith(AndroidJUnit4::class)
class LoginScreenTest {

    @get:Rule val composeTestRule = createComposeRule()

    @Test
    fun \`login button disabled when fields empty\`() {
        composeTestRule.setContent {
            AppTheme { LoginScreen(onLoginSuccess = {}) }
        }
        composeTestRule.onNodeWithText("Sign In").assertIsNotEnabled()
    }

    @Test
    fun \`successful login navigates to home\`() {
        composeTestRule.setContent {
            AppTheme { LoginScreen(onLoginSuccess = {}) }
        }

        composeTestRule.onNodeWithTag("emailField").performTextInput("alice@test.com")
        composeTestRule.onNodeWithTag("passwordField").performTextInput("password123")
        composeTestRule.onNodeWithText("Sign In").performClick()

        composeTestRule.waitUntil(timeoutMillis = 5_000) {
            composeTestRule.onAllNodesWithText("Welcome").fetchSemanticsNodes().isNotEmpty()
        }
        composeTestRule.onNodeWithText("Welcome").assertIsDisplayed()
    }
}
\`\`\`

### Finders & assertions quick reference

\`\`\`kotlin
// Finders
onNodeWithText("Submit")                           // by text
onNodeWithTag("loginButton")                       // by testTag (most stable)
onNodeWithContentDescription("Close")              // by accessibility description
onNode(hasRole(Role.Button) and isEnabled())       // combined matcher

// Assertions
.assertIsDisplayed()
.assertIsEnabled()   /  .assertIsNotEnabled()
.assertTextEquals("Expected")
.assertHasClickAction()

// Actions
.performClick()
.performTextInput("text")
.performTextClearance()
.performScrollTo()
.performTouchInput { swipeUp() }

// Waiting (use instead of Thread.sleep)
composeTestRule.waitUntil(5_000) {
    onAllNodesWithTag("item").fetchSemanticsNodes().size >= 3
}
\`\`\`

### Anti-pattern

\`\`\`kotlin
// ❌ Fragile — breaks when text changes
onNodeWithText("Submit")[0].performClick()

// ✅ Stable — add to your Composable: Modifier.testTag("submitButton")
onNodeWithTag("submitButton").performClick()
\`\`\`
`;

const ESPRESSO = `
## Espresso — View + Compose interop

\`\`\`kotlin
// Source: developer.android.com/training/testing/espresso

@RunWith(AndroidJUnit4::class)
@HiltAndroidTest
class MainActivityTest {

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val activityRule = ActivityScenarioRule(MainActivity::class.java)

    @Before fun setup() { hiltRule.inject() }

    @Test
    fun clickButtonShowsResult() {
        onView(withId(R.id.submitButton))
            .check(matches(isDisplayed()))
            .perform(click())
        onView(withText("Success")).check(matches(isDisplayed()))
    }
}

// Mixed Espresso + Compose (interop)
@RunWith(AndroidJUnit4::class)
class HybridScreenTest {
    @get:Rule val composeTestRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun hybridInterop() {
        // View layer
        onView(withText("Hello Views")).check(matches(isDisplayed()))
        // Compose layer
        composeTestRule.onNodeWithText("Click here").performClick()
        // Back to View
        onView(withText("Updated")).check(matches(isDisplayed()))
    }
}
\`\`\`
`;

const HILT_TESTING = `
## Hilt Dependency Injection in Tests

\`\`\`kotlin
// Source: developer.android.com/training/dependency-injection/hilt-testing

// Custom test runner (required for instrumented Hilt tests)
class HiltTestRunner : AndroidJUnitRunner() {
    override fun newApplication(cl: ClassLoader?, name: String?, context: Context?) =
        super.newApplication(cl, HiltTestApplication::class.java.name, context)
}
// In build.gradle.kts: testInstrumentationRunner = "com.yourapp.HiltTestRunner"

@HiltAndroidTest
class UserFlowTest {

    @get:Rule(order = 0) val hiltRule = HiltAndroidRule(this)
    @get:Rule(order = 1) val composeTestRule = createAndroidComposeRule<HiltTestActivity>()

    // Override real binding with a fake
    @BindValue @JvmField
    val repository: UserRepository = FakeUserRepository()

    @Before fun setup() { hiltRule.inject() }

    @Test
    fun userListDisplays() {
        composeTestRule.onNodeWithTag("userList").assertIsDisplayed()
    }
}

class FakeUserRepository : UserRepository {
    override fun getUsers() = flowOf(listOf(User(1, "Alice"), User(2, "Bob")))
    override suspend fun refreshUsers() = Unit
}
\`\`\`

### Unit testing Hilt ViewModels (no instrumentation needed)

\`\`\`kotlin
// No @HiltAndroidTest needed — just inject fakes directly
class UserViewModelTest {
    @get:Rule val coroutineRule = MainDispatcherRule()
    private val fakeRepo = FakeUserRepository()
    private val viewModel = UserViewModel(fakeRepo)

    @Test
    fun \`users are loaded on init\`() = runTest {
        viewModel.uiState.test {
            val state = awaitItem() as UiState.Success
            assertEquals(2, state.data.size)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
\`\`\`
`;

const TEST_PYRAMID = `
## Test Pyramid Strategy for Android

\`\`\`
          /\\
         /  \\   ← E2E / UI Tests (10%)
        / E2E \\   Espresso, Compose UI tests
       /───────\\
      /         \\  ← Integration Tests (20–30%)
     / Integration \\ Repository + DAO + ViewModel with fakes
    /───────────────\\
   /                 \\ ← Unit Tests (60–70%)
  / Unit (JVM/JUnit4) \\  UseCases, mappers, domain logic, utils
 \\─────────────────────/
\`\`\`

### Key rules

- **Unit tests** → \`src/test/\` — JVM only, no emulator, milliseconds to run
- **Instrumented tests** → \`src/androidTest/\` — needs emulator or device
- **Always** use in-memory Room DB for DAO tests — never real files
- **Always** use MockWebServer for network tests — never real endpoints
- **Always** use Turbine for Flow assertions — never \`runBlocking { flow.first() }\`
- **Always** use MainDispatcherRule with StandardTestDispatcher for ViewModel tests
- **Always** add \`testTag\` to interactive Compose elements — text matchers break with i18n
- **Target:** 70% unit · 20% integration · 10% UI for most apps

**Official guide:** https://developer.android.com/training/testing
**Compose testing:** https://developer.android.com/develop/ui/compose/testing
`;

// ── Topic routing ─────────────────────────────────────────────────────────────

const TOPICS: TestingTopic[] = [
  { keywords: ["setup", "dependency", "dependencies", "gradle", "getting started", "config", "runner"], content: SETUP },
  { keywords: ["unit test", "viewmodel test", "repository test", "mockk", "turbine", "coroutine test", "flow test", "room test", "dao test", "main dispatcher", "standardtest"], content: UNIT_TESTS },
  { keywords: ["compose test", "composetestrul", "ui test", "semantics", "finder", "assertis", "performclick", "testtag", "compose ui", "waituntil"], content: COMPOSE_TESTING },
  { keywords: ["espresso", "view test", "onview", "activityscenario", "interop", "hybrid"], content: ESPRESSO },
  { keywords: ["hilt test", "hilt inject", "hiltandroidtest", "bindvalue", "fake", "hilt testing"], content: HILT_TESTING },
  { keywords: ["pyramid", "strategy", "how many", "coverage", "structure", "overview", "what to test", "ratio"], content: TEST_PYRAMID },
];

const INDEX = `
## Android Testing Guide

**Available topics:**
- \`setup\` — Gradle dependencies for all test types
- \`unit tests\` — ViewModel, Repository, Room DAO, MainDispatcherRule (StandardTestDispatcher)
- \`compose testing\` — ComposeTestRule, finders, actions, assertions, waitUntil
- \`espresso\` — View-based tests + Compose interop
- \`hilt testing\` — Custom test runner, @HiltAndroidTest, @BindValue fakes
- \`pyramid\` — Test strategy, ratios, key rules

**Official sources:**
- https://developer.android.com/training/testing
- https://developer.android.com/develop/ui/compose/testing
`;

export async function androidTestingGuide(topic: string): Promise<string> {
  const trimmed = topic.trim().toLowerCase();
  if (!trimmed || trimmed === "list" || trimmed === "help") return INDEX;

  const found = TOPICS.find(t => t.keywords.some(k => trimmed.includes(k)));
  if (found) {
    return (
      found.content.trim() +
      `\n\n---\n> 🧪 GROUNDING GATE: Tests must follow the official patterns above.\n` +
      `> Use StandardTestDispatcher (not deprecated TestCoroutineDispatcher), Turbine for Flows, MainDispatcherRule for ViewModels.`
    );
  }

  return (
    `## Android Testing: "${topic}"\n\n` +
    `No built-in entry found. Check:\n` +
    `- https://developer.android.com/training/testing\n` +
    `- https://developer.android.com/develop/ui/compose/testing\n\n` +
    INDEX
  );
}
