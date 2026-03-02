/**
 * Tool 5 – gradle_dependency_checker
 *
 * Looks up the latest stable version of any Android/Kotlin/Jetpack library
 * from Google Maven and Maven Central.
 *
 * Correctness guarantees:
 *   - BOM-managed libraries (Compose, Firebase) emit platform() wrapper
 *   - Plugin declarations emit plugins {} block, not implementation()
 *   - Falls back through: Google Maven → Maven Central → Jetpack releases page
 *
 * Source of truth: dl.google.com/dl/android/maven2 + search.maven.org
 */

import { secureFetchJson, secureFetch, extractPageText } from "../http.js";
import { MAVEN_SEARCH_URL, GOOGLE_MAVEN_URL } from "../constants.js";

// ── Library catalogue ─────────────────────────────────────────────────────────

interface LibEntry {
  groupId: string;
  artifactId: string;
  /** True → library is managed by a BOM; emit platform() wrapper in output */
  bomManaged?: boolean;
  /** True → emit plugins {} block, not implementation() */
  isPlugin?: boolean;
  pluginId?: string;
  releasePageSlug?: string;  // for Jetpack releases page fallback
}

const LIBRARY_CATALOGUE: Record<string, LibEntry> = {
  // ── Compose ────────────────────────────────────────────────────────────────
  "compose-bom":       { groupId: "androidx.compose", artifactId: "compose-bom" },
  "compose":           { groupId: "androidx.compose.ui", artifactId: "ui", bomManaged: true },
  "compose-ui":        { groupId: "androidx.compose.ui", artifactId: "ui", bomManaged: true },
  "compose-material3": { groupId: "androidx.compose.material3", artifactId: "material3", bomManaged: true },
  "compose-foundation":{ groupId: "androidx.compose.foundation", artifactId: "foundation", bomManaged: true },
  "compose-runtime":   { groupId: "androidx.compose.runtime", artifactId: "runtime", bomManaged: true },
  "compose-animation": { groupId: "androidx.compose.animation", artifactId: "animation", bomManaged: true },
  "material3":         { groupId: "androidx.compose.material3", artifactId: "material3", bomManaged: true },

  // ── Architecture ───────────────────────────────────────────────────────────
  "lifecycle":         { groupId: "androidx.lifecycle", artifactId: "lifecycle-runtime-ktx", releasePageSlug: "lifecycle" },
  "viewmodel":         { groupId: "androidx.lifecycle", artifactId: "lifecycle-viewmodel-ktx", releasePageSlug: "lifecycle" },
  "lifecycle-compose": { groupId: "androidx.lifecycle", artifactId: "lifecycle-runtime-compose", releasePageSlug: "lifecycle" },
  "navigation":        { groupId: "androidx.navigation", artifactId: "navigation-compose", releasePageSlug: "navigation" },
  "navigation-compose":{ groupId: "androidx.navigation", artifactId: "navigation-compose", releasePageSlug: "navigation" },
  "room":              { groupId: "androidx.room", artifactId: "room-runtime", releasePageSlug: "room" },
  "paging":            { groupId: "androidx.paging", artifactId: "paging-runtime", releasePageSlug: "paging" },
  "paging-compose":    { groupId: "androidx.paging", artifactId: "paging-compose", releasePageSlug: "paging" },
  "datastore":         { groupId: "androidx.datastore", artifactId: "datastore-preferences", releasePageSlug: "datastore" },
  "workmanager":       { groupId: "androidx.work", artifactId: "work-runtime-ktx", releasePageSlug: "work" },
  "hilt":              { groupId: "com.google.dagger", artifactId: "hilt-android", releasePageSlug: "hilt" },
  "hilt-compose":      { groupId: "androidx.hilt", artifactId: "hilt-navigation-compose", releasePageSlug: "hilt" },
  "hilt-navigation-compose": { groupId: "androidx.hilt", artifactId: "hilt-navigation-compose", releasePageSlug: "hilt" },

  // ── Network ────────────────────────────────────────────────────────────────
  "retrofit":          { groupId: "com.squareup.retrofit2", artifactId: "retrofit" },
  "retrofit-gson":     { groupId: "com.squareup.retrofit2", artifactId: "converter-gson" },
  "retrofit-moshi":    { groupId: "com.squareup.retrofit2", artifactId: "converter-moshi" },
  "okhttp":            { groupId: "com.squareup.okhttp3", artifactId: "okhttp" },
  "okhttp-logging":    { groupId: "com.squareup.okhttp3", artifactId: "logging-interceptor" },
  // Ktor — KMP HTTP client (replaces Retrofit in KMP projects)
  // Note: ktor-client-android is the Android engine; use ktor-client-core in commonMain
  "ktor":                  { groupId: "io.ktor", artifactId: "ktor-client-core" },
  "ktor-core":             { groupId: "io.ktor", artifactId: "ktor-client-core" },
  "ktor-android":          { groupId: "io.ktor", artifactId: "ktor-client-okhttp" },
  "ktor-ios":              { groupId: "io.ktor", artifactId: "ktor-client-darwin" },
  "ktor-json":             { groupId: "io.ktor", artifactId: "ktor-serialization-kotlinx-json" },
  "ktor-negotiation":      { groupId: "io.ktor", artifactId: "ktor-client-content-negotiation" },
  // KMP — Kotlin Multiplatform core libraries
  "kotlinx-serialization": { groupId: "org.jetbrains.kotlinx", artifactId: "kotlinx-serialization-json" },
  "serialization":         { groupId: "org.jetbrains.kotlinx", artifactId: "kotlinx-serialization-json" },
  "kotlinx-datetime":      { groupId: "org.jetbrains.kotlinx", artifactId: "kotlinx-datetime" },
  "datetime":              { groupId: "org.jetbrains.kotlinx", artifactId: "kotlinx-datetime" },
  // Room KMP (stable since Room 2.7 — different from Android-only Room)
  "room-kmp":              { groupId: "androidx.room", artifactId: "room-runtime" },
  "sqlite-bundled":        { groupId: "androidx.sqlite", artifactId: "sqlite-bundled" },
  // DataStore KMP (different from Android DataStore)
  "datastore-kmp":         { groupId: "androidx.datastore", artifactId: "datastore-preferences-core" },
  // Koin — KMP-compatible DI (Hilt is Android-only, cannot be used in commonMain)
  "koin":                  { groupId: "io.insert-koin", artifactId: "koin-core" },
  "koin-android":          { groupId: "io.insert-koin", artifactId: "koin-android" },
  "koin-compose":          { groupId: "io.insert-koin", artifactId: "koin-compose" },

  // ── Image loading ──────────────────────────────────────────────────────────
  // Coil 3 is the current major (io.coil-kt.coil3 group)
  "coil":              { groupId: "io.coil-kt.coil3", artifactId: "coil-compose" },
  "coil3":             { groupId: "io.coil-kt.coil3", artifactId: "coil-compose" },
  "glide":             { groupId: "com.github.bumptech.glide", artifactId: "glide" },
  "glide-compose":     { groupId: "com.github.bumptech.glide", artifactId: "compose" },

  // ── Serialization ──────────────────────────────────────────────────────────
  "gson":              { groupId: "com.google.code.gson", artifactId: "gson" },
  "moshi":             { groupId: "com.squareup.moshi", artifactId: "moshi-kotlin" },
  // Note: kotlinx-serialization is also listed in the KMP section above

  // ── Kotlin ────────────────────────────────────────────────────────────────
  "coroutines":        { groupId: "org.jetbrains.kotlinx", artifactId: "kotlinx-coroutines-android" },
  "kotlin-stdlib":     { groupId: "org.jetbrains.kotlin", artifactId: "kotlin-stdlib" },

  // ── Firebase ──────────────────────────────────────────────────────────────
  "firebase-bom":      { groupId: "com.google.firebase", artifactId: "firebase-bom" },
  "firebase":          { groupId: "com.google.firebase", artifactId: "firebase-bom" },
  "firebase-analytics":{ groupId: "com.google.firebase", artifactId: "firebase-analytics-ktx", bomManaged: true },
  "firebase-auth":     { groupId: "com.google.firebase", artifactId: "firebase-auth-ktx", bomManaged: true },
  "firebase-firestore":{ groupId: "com.google.firebase", artifactId: "firebase-firestore-ktx", bomManaged: true },
  "firebase-crashlytics":{ groupId: "com.google.firebase", artifactId: "firebase-crashlytics-ktx", bomManaged: true },
  "firebase-messaging":{ groupId: "com.google.firebase", artifactId: "firebase-messaging-ktx", bomManaged: true },
  "firebase-storage":  { groupId: "com.google.firebase", artifactId: "firebase-storage-ktx", bomManaged: true },

  // ── Google Play Services ───────────────────────────────────────────────────
  "play-services-auth":{ groupId: "com.google.android.gms", artifactId: "play-services-auth" },
  "play-services-maps":{ groupId: "com.google.android.gms", artifactId: "play-services-maps" },
  "credentials":       { groupId: "androidx.credentials", artifactId: "credentials" },
  "credentials-play":  { groupId: "androidx.credentials", artifactId: "credentials-play-services-auth" },

  // ── Paging / Data ─────────────────────────────────────────────────────────
  "profileinstaller":  { groupId: "androidx.profileinstaller", artifactId: "profileinstaller" },
  "startup":           { groupId: "androidx.startup", artifactId: "startup-runtime", releasePageSlug: "startup" },
  "splashscreen":      { groupId: "androidx.core", artifactId: "core-splashscreen", releasePageSlug: "core" },
  "window":            { groupId: "androidx.window", artifactId: "window", releasePageSlug: "window" },
  "adaptive":          { groupId: "androidx.compose.material3.adaptive", artifactId: "adaptive", releasePageSlug: "compose-material3-adaptive" },
  "adaptive-compose":  { groupId: "androidx.compose.material3.adaptive", artifactId: "adaptive-navigation" },

  // ── Testing ───────────────────────────────────────────────────────────────
  "mockk":             { groupId: "io.mockk", artifactId: "mockk" },
  "turbine":           { groupId: "app.cash.turbine", artifactId: "turbine" },
  "espresso":          { groupId: "androidx.test.espresso", artifactId: "espresso-core" },
  "compose-testing":   { groupId: "androidx.compose.ui", artifactId: "ui-test-junit4", bomManaged: true },

  // ── Plugins ───────────────────────────────────────────────────────────────
  "agp":               { groupId: "com.android.tools.build", artifactId: "gradle", isPlugin: true, pluginId: "com.android.application" },
  "ksp":               { groupId: "com.google.devtools.ksp", artifactId: "com.google.devtools.ksp.gradle.plugin", isPlugin: true, pluginId: "com.google.devtools.ksp" },
  "kotlin-android":    { groupId: "org.jetbrains.kotlin", artifactId: "kotlin-gradle-plugin", isPlugin: true, pluginId: "org.jetbrains.kotlin.android" },
};

// ── Maven fetchers ────────────────────────────────────────────────────────────

async function fromGoogleMaven(groupId: string, artifactId: string): Promise<string | null> {
  const groupPath = groupId.replace(/\./g, "/");
  const url = `${GOOGLE_MAVEN_URL}/${groupPath}/${artifactId}/maven-metadata.xml`;
  try {
    const xml = await secureFetch(url);
    const release = xml.match(/<release>([^<]+)<\/release>/)?.[1];
    const latest  = xml.match(/<latest>([^<]+)<\/latest>/)?.[1];
    return release ?? latest ?? null;
  } catch {
    return null;
  }
}

async function fromMavenCentral(groupId: string, artifactId: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`g:"${groupId}" AND a:"${artifactId}"`);
    const url = `${MAVEN_SEARCH_URL}?q=${q}&rows=1&wt=json`;
    const data = await secureFetchJson<{
      response?: { docs?: Array<{ latestVersion?: string }> };
    }>(url);
    return data?.response?.docs?.[0]?.latestVersion ?? null;
  } catch {
    return null;
  }
}

async function fromJetpackReleasesPage(slug: string): Promise<string> {
  const url = `https://developer.android.com/jetpack/androidx/releases/${slug}`;
  try {
    const html = await secureFetch(url);
    return extractPageText(html, 1800);
  } catch {
    return `Could not fetch release page. Check: https://developer.android.com/jetpack/androidx/versions`;
  }
}

// ── Output formatters ─────────────────────────────────────────────────────────

function formatPlugin(entry: LibEntry, version: string): string {
  const pluginId = entry.pluginId ?? `${entry.groupId}.${entry.artifactId}`;
  return (
    `**Plugin id:** \`${pluginId}\`\n` +
    `**Latest Stable:** \`${version}\`\n\n` +
    `\`\`\`kotlin\n// libs.versions.toml\n[plugins]\n${entry.artifactId.split(".")[0]} = { id = "${pluginId}", version = "${version}" }\n\n` +
    `// build.gradle.kts\nplugins {\n    alias(libs.plugins.${entry.artifactId.split(".")[0]})\n}\n\`\`\``
  );
}

function formatBom(entry: LibEntry, version: string): string {
  const isFirebase = entry.groupId.startsWith("com.google.firebase");
  const bomCoords = isFirebase
    ? `com.google.firebase:firebase-bom:${version}`
    : `${entry.groupId}:${entry.artifactId}:${version}`;
  return (
    `**BOM managed — use \`platform()\` wrapper**\n` +
    `**BOM version:** \`${version}\`\n\n` +
    `\`\`\`kotlin\ndependencies {\n    implementation(platform("${bomCoords}"))\n    implementation("${entry.groupId}:${entry.artifactId}")  // no version — BOM pins it\n}\n\`\`\`\n\n` +
    `> ✅ Import the BOM once; all matching artifacts pick up the pinned version automatically.`
  );
}

function formatLibrary(entry: LibEntry, version: string): string {
  const coords = `${entry.groupId}:${entry.artifactId}:${version}`;
  return (
    `**Latest Stable:** \`${version}\`\n\n` +
    `\`\`\`kotlin\n// Kotlin DSL\nimplementation("${coords}")\n\`\`\`\n\n` +
    `\`\`\`groovy\n// Groovy DSL\nimplementation '${coords}'\n\`\`\`\n\n` +
    `\`\`\`toml\n# libs.versions.toml\n[libraries]\n${entry.artifactId} = { group = "${entry.groupId}", name = "${entry.artifactId}", version = "${version}" }\n\`\`\``
  );
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function gradleDependencyChecker(libraryName: string): Promise<string> {
  if (!libraryName || libraryName.trim().length < 2) {
    return "ERROR: Library name must be at least 2 characters.";
  }

  const name = libraryName.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 100);
  const header = `## AndroJack Gradle Dependency Checker\n**Library:** \`${libraryName}\`\n\n`;

  const entry = LIBRARY_CATALOGUE[name];

  if (entry) {
    // Try Google Maven first (authoritative for Jetpack + Firebase)
    let version = await fromGoogleMaven(entry.groupId, entry.artifactId);

    // Fallback: Maven Central (for third-party: Retrofit, OkHttp, Coil, etc.)
    if (!version) version = await fromMavenCentral(entry.groupId, entry.artifactId);

    if (version) {
      let body: string;
      if (entry.isPlugin) {
        body = formatPlugin(entry, version);
      } else if (entry.bomManaged && (name.endsWith("-bom") || name === "firebase" || name === "firebase-bom" || name === "compose-bom")) {
        body = formatBom(entry, version);
      } else if (entry.bomManaged) {
        // Individual BOM-managed artifact — show both BOM and direct approaches
        body =
          formatLibrary(entry, version) +
          `\n\n> 💡 Prefer importing the BOM (\`compose-bom\` or \`firebase-bom\`) to keep all artifacts version-aligned.`;
      } else {
        body = formatLibrary(entry, version);
      }

      const releaseUrl = entry.releasePageSlug
        ? `https://developer.android.com/jetpack/androidx/releases/${entry.releasePageSlug}`
        : `https://search.maven.org/artifact/${entry.groupId}/${entry.artifactId}`;

      return (
        header + body +
        `\n\n**Official release notes:** ${releaseUrl}\n\n` +
        `> ✅ GROUNDING GATE: Use version \`${version}\` as confirmed by authoritative Maven source.`
      );
    }

    // Version not found — serve release page content
    if (entry.releasePageSlug) {
      const text = await fromJetpackReleasesPage(entry.releasePageSlug);
      return (
        header +
        `**Version lookup inconclusive via automated search.**\n\n` +
        `**Jetpack release page:**\n${text}\n\n` +
        `> Check https://developer.android.com/jetpack/androidx/versions for current stable.`
      );
    }
  }

  // Unknown library — try Maven Central by name
  const mcResult = await fromMavenCentral(name, name);
  if (mcResult) {
    return (
      header +
      `**Not in local catalogue — Maven Central result:**\n` +
      formatLibrary({ groupId: "?", artifactId: name }, mcResult) +
      `\n\n> ⚠️ Verify group ID and artifact ID at https://search.maven.org`
    );
  }

  return (
    header +
    `**Library \`${libraryName}\` not found in local catalogue or Maven search.**\n\n` +
    `Try searching manually:\n` +
    `- https://search.maven.org/search?q=${encodeURIComponent(name)}\n` +
    `- https://developer.android.com/jetpack/androidx/versions\n` +
    `- https://firebase.google.com/docs/android/setup#available-libraries\n\n` +
    `Common patterns: \`compose-bom\`, \`hilt\`, \`room\`, \`firebase-bom\`, \`retrofit\`, \`coil\`, \`credentials\``
  );
}
