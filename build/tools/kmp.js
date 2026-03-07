// Tool 16: Kotlin Multiplatform (KMP) Guide
// 900+ new KMP libraries published in 2025. Room, DataStore, Ktor all have KMP variants.
// AI tools silently generate Android-only code for KMP projects — iOS build fails.
export async function androidKmpGuide(topic) {
    const t = topic.toLowerCase().trim();
    const overview = `
# Kotlin Multiplatform (KMP) — Official Reference (2025)
Source: https://kotlinlang.org/docs/multiplatform.html

## What KMP Is — And Is Not

KMP shares **business logic and data layer** (domain, data, networking, storage) across
Android and iOS while keeping **native UIs** on each platform. It is NOT Compose Multiplatform
(CMP) — CMP shares UI as well, using Compose for iOS. They are separate, both valid.

| Approach | What's Shared | UI |
|----------|--------------|-----|
| KMP only | Domain + Data layer | Native (SwiftUI on iOS, Compose on Android) |
| KMP + CMP | Domain + Data + UI | Compose on all platforms |

## Why AI Tools Get KMP Wrong

When you ask "add Room to my KMP project," AI tools generate Android-only Room code.
It compiles. Android works. iOS build fails. Silent correctness failure.
Every major Jetpack library now has a KMP variant — always use the KMP artifact in KMP projects.

## Project Structure

\`\`\`
shared/
  src/
    commonMain/kotlin/     ← shared code (use expect/actual for platform differences)
    androidMain/kotlin/    ← Android-specific implementations
    iosMain/kotlin/        ← iOS-specific implementations
androidApp/                ← Android Compose UI
iosApp/                    ← SwiftUI (Xcode project)
\`\`\`

## Gradle Setup (Kotlin DSL)

\`\`\`kotlin
// shared/build.gradle.kts
plugins {
  alias(libs.plugins.kotlinMultiplatform)
  alias(libs.plugins.androidLibrary)
  alias(libs.plugins.kotlinSerialization)
  alias(libs.plugins.ksp)  // For Room KMP
}

kotlin {
  androidTarget {
    compilations.all { kotlinOptions { jvmTarget = "11" } }
  }
  listOf(iosX64(), iosArm64(), iosSimulatorArm64()).forEach { iosTarget ->
    iosTarget.binaries.framework {
      baseName = "Shared"
      isStatic = true
    }
  }

  sourceSets {
    commonMain.dependencies {
      implementation(libs.kotlinx.coroutines.core)
      implementation(libs.kotlinx.serialization.json)
      implementation(libs.ktor.client.core)           // Networking (NOT Retrofit — not KMP)
      implementation(libs.ktor.client.content.negotiation)
      implementation(libs.ktor.serialization.kotlinx.json)
      implementation(libs.room.runtime)               // Room KMP
      implementation(libs.sqlite.bundled)
      implementation(libs.datastore.preferences.core) // DataStore KMP
    }
    androidMain.dependencies {
      implementation(libs.ktor.client.okhttp)         // OkHttp engine on Android
      implementation(libs.kotlinx.coroutines.android)
    }
    iosMain.dependencies {
      implementation(libs.ktor.client.darwin)         // Darwin engine on iOS
    }
  }
}
\`\`\`

Source: https://kotlinlang.org/docs/multiplatform-get-started.html
`;
    const libraries = `
# KMP — Library Catalogue (2025)
Source: https://kotlinlang.org/docs/multiplatform-introduce-frameworks.html

## ⚠️ Android vs KMP Artifact Mapping — Where AI Tools Fail

| Function | Android-Only (❌ use in KMP) | KMP Equivalent (✅ use in KMP) |
|----------|---------------------------|-------------------------------|
| Networking | Retrofit + OkHttp | **Ktor** (ktor-client-core) |
| Database | Room (Android) | **Room KMP** (room-runtime, sqlite-bundled) |
| Preferences | DataStore (Android) | **DataStore KMP** (datastore-preferences-core) |
| JSON | Gson / Moshi | **kotlinx-serialization-json** |
| DI | Hilt (Android only) | **Koin** (koin-core) or manual |
| Image loading | Coil / Glide | **Coil3** (io.coil-kt.coil3 — KMP-ready) |
| Date/Time | java.time | **kotlinx-datetime** |
| Settings | SharedPreferences | DataStore KMP |

## libs.versions.toml — KMP Dependencies

\`\`\`toml
[versions]
kotlin = "2.1.0"
ktor = "3.1.0"
room = "2.7.0"           # Room KMP stable since 2.7
kotlinxCoroutines = "1.10.1"
kotlinxSerialization = "1.8.0"
kotlinxDatetime = "0.6.2"
datastore = "1.1.2"
koin = "4.0.0"
coil3 = "3.1.0"
sqlite = "2.5.0"

[libraries]
# Ktor — Multiplatform HTTP client (replaces Retrofit in KMP)
ktor-client-core = { group = "io.ktor", name = "ktor-client-core", version.ref = "ktor" }
ktor-client-okhttp = { group = "io.ktor", name = "ktor-client-okhttp", version.ref = "ktor" }  # Android
ktor-client-darwin = { group = "io.ktor", name = "ktor-client-darwin", version.ref = "ktor" }  # iOS
ktor-client-content-negotiation = { group = "io.ktor", name = "ktor-client-content-negotiation", version.ref = "ktor" }
ktor-serialization-kotlinx-json = { group = "io.ktor", name = "ktor-serialization-kotlinx-json", version.ref = "ktor" }

# Room KMP
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }  # KSP
sqlite-bundled = { group = "androidx.sqlite", name = "sqlite-bundled", version.ref = "sqlite" }

# DataStore KMP
datastore-preferences-core = { group = "androidx.datastore", name = "datastore-preferences-core", version.ref = "datastore" }

# kotlinx
kotlinx-coroutines-core = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-core", version.ref = "kotlinxCoroutines" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "kotlinxCoroutines" }
kotlinx-serialization-json = { group = "org.jetbrains.kotlinx", name = "kotlinx-serialization-json", version.ref = "kotlinxSerialization" }
kotlinx-datetime = { group = "org.jetbrains.kotlinx", name = "kotlinx-datetime", version.ref = "kotlinxDatetime" }

# Koin — KMP-compatible DI (Hilt is Android-only)
koin-core = { group = "io.insert-koin", name = "koin-core", version.ref = "koin" }
koin-android = { group = "io.insert-koin", name = "koin-android", version.ref = "koin" }
koin-compose = { group = "io.insert-koin", name = "koin-compose", version.ref = "koin" }

# Coil3 — KMP-ready image loading
coil3-compose = { group = "io.coil-kt.coil3", name = "coil-compose", version.ref = "coil3" }
coil3-network-ktor = { group = "io.coil-kt.coil3", name = "coil-network-ktor3", version.ref = "coil3" }
\`\`\`

Source: https://kotlinlang.org/docs/multiplatform-introduce-frameworks.html
`;
    const roomKmp = `
# KMP — Room KMP Setup (Stable since Room 2.7)
Source: https://developer.android.com/kotlin/multiplatform/room

## Room KMP Gradle Setup

\`\`\`kotlin
// shared/build.gradle.kts
plugins {
  alias(libs.plugins.ksp)
}

kotlin {
  sourceSets {
    commonMain.dependencies {
      implementation(libs.room.runtime)
      implementation(libs.sqlite.bundled)
    }
  }
}

// KSP for Room compiler — apply to each target
dependencies {
  add("kspAndroid", libs.room.compiler)
  add("kspIosX64", libs.room.compiler)
  add("kspIosArm64", libs.room.compiler)
  add("kspIosSimulatorArm64", libs.room.compiler)
}
\`\`\`

## Room KMP Database — In commonMain

\`\`\`kotlin
// shared/src/commonMain/kotlin/Database.kt
@Database(entities = [UserEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
  abstract fun userDao(): UserDao
}

@Dao
interface UserDao {
  @Query("SELECT * FROM users") fun getAllUsers(): Flow<List<UserEntity>>
  @Insert suspend fun insert(user: UserEntity)
  @Delete suspend fun delete(user: UserEntity)
}

@Entity(tableName = "users")
data class UserEntity(
  @PrimaryKey val id: String,
  val name: String,
  val email: String
)
\`\`\`

## Platform-Specific Database Builder

\`\`\`kotlin
// shared/src/androidMain/kotlin/DatabaseBuilder.kt
fun getDatabaseBuilder(ctx: Context): RoomDatabase.Builder<AppDatabase> {
  val appContext = ctx.applicationContext
  val dbFile = appContext.getDatabasePath("app.db")
  return Room.databaseBuilder<AppDatabase>(appContext, dbFile.absolutePath)
}

// shared/src/iosMain/kotlin/DatabaseBuilder.kt
fun getDatabaseBuilder(): RoomDatabase.Builder<AppDatabase> {
  val dbFilePath = NSHomeDirectory() + "/app.db"
  return Room.databaseBuilder<AppDatabase>(name = dbFilePath)
}
\`\`\`

Source: https://developer.android.com/kotlin/multiplatform/room
`;
    const ktor = `
# KMP — Ktor HTTP Client (Replaces Retrofit in KMP)
Source: https://ktor.io/docs/client-create-multiplatform-application.html

## Why Retrofit Cannot Be Used in KMP
Retrofit depends on Java reflection and OkHttp — neither is available in iosMain.
Ktor is the official KMP HTTP client with platform-specific engines.

## Ktor API Client in commonMain

\`\`\`kotlin
// shared/src/commonMain/kotlin/ApiClient.kt
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

class ApiClient {
  private val client = HttpClient {
    install(ContentNegotiation) {
      json(Json { ignoreUnknownKeys = true; isLenient = true })
    }
  }

  suspend fun getUser(userId: String): User =
    client.get("https://api.example.com/users/$userId").body()

  suspend fun createPost(post: CreatePostRequest): Post =
    client.post("https://api.example.com/posts") {
      setBody(post)
    }.body()
}

@Serializable
data class User(val id: String, val name: String, val email: String)
\`\`\`

## Repository Pattern with Ktor

\`\`\`kotlin
// commonMain — same pattern as Android MVVM, works on all platforms
interface UserRepository {
  suspend fun getUser(id: String): Result<User>
  fun observeUsers(): Flow<List<User>>
}

class UserRepositoryImpl(
  private val apiClient: ApiClient,
  private val userDao: UserDao
) : UserRepository {
  override suspend fun getUser(id: String): Result<User> = runCatching {
    val entity = userDao.getUser(id) ?: run {
      val user = apiClient.getUser(id)
      userDao.insert(user.toEntity())
      user
    }
    entity.toDomain()
  }

  override fun observeUsers(): Flow<List<User>> =
    userDao.getAllUsers().map { entities -> entities.map { it.toDomain() } }
}
\`\`\`

Source: https://ktor.io/docs/client-create-multiplatform-application.html
`;
    const expectActual = `
# KMP — expect/actual Pattern
Source: https://kotlinlang.org/docs/multiplatform-expect-actual.html

## When to Use expect/actual

Use expect/actual only for platform-specific capabilities with no KMP equivalent:
- Platform-specific APIs (GPS, biometrics, camera)
- Platform SDKs (Firebase iOS SDK vs Firebase Android SDK)
- Performance-critical native code

Do NOT use expect/actual for things that already have KMP libraries (networking, storage, etc.).

## expect/actual Example — Platform Info

\`\`\`kotlin
// commonMain
expect fun getPlatformName(): String
expect class PlatformContext

// androidMain
actual fun getPlatformName(): String = "Android \${Build.VERSION.RELEASE}"
actual typealias PlatformContext = Context

// iosMain
actual fun getPlatformName(): String = UIDevice.currentDevice.systemName()
actual class PlatformContext
\`\`\`

## expect/actual for Coroutines Dispatcher

\`\`\`kotlin
// commonMain
expect val backgroundDispatcher: CoroutineDispatcher

// androidMain
actual val backgroundDispatcher: CoroutineDispatcher = Dispatchers.IO

// iosMain
actual val backgroundDispatcher: CoroutineDispatcher = Dispatchers.Default
\`\`\`

Source: https://kotlinlang.org/docs/multiplatform-expect-actual.html
`;
    if (t.includes("room") || t.includes("database") || t.includes("db"))
        return roomKmp;
    if (t.includes("ktor") || t.includes("network") || t.includes("http") || t.includes("retrofit"))
        return ktor;
    if (t.includes("expect") || t.includes("actual") || t.includes("platform"))
        return expectActual;
    if (t.includes("librar") || t.includes("depend") || t.includes("gradle") || t.includes("toml"))
        return libraries;
    return overview + "\n\n---\n\n" +
        "**Query topics:** 'libraries' (KMP dependency catalogue), 'room' (Room KMP setup), " +
        "'ktor' (networking — replaces Retrofit), 'expect actual' (platform-specific code)\n\n" +
        "Source: https://kotlinlang.org/docs/multiplatform.html";
}
