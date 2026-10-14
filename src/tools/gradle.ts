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

import { secureFetchJson, secureFetch } from "../http.js";
import { fetchOfficialPage } from "../docs-search.js";
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
  "room3":             { groupId: "androidx.room3", artifactId: "room3-runtime", releasePageSlug: "room3" },
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

// Maven qualifiers come after "-" or "." (2.0.0-rc01, 2.0.0.RC1, 6.0.0.M1,
// 1.1.0-preview01, 2.0-milestone-1). Anything matching is not "stable".
const PRERELEASE_PATTERN = /[-.](alpha|beta|rc|cr|dev|eap|snapshot|preview|pre|milestone|m(?=\d))/i;

/** Compares dotted numeric versions; qualifiers sort before their release. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(/[.-]/);
  const pb = b.split(/[.-]/);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? "";
    const y = pb[i] ?? "";
    const nx = /^\d+$/.test(x) ? Number(x) : NaN;
    const ny = /^\d+$/.test(y) ? Number(y) : NaN;
    if (!Number.isNaN(nx) && !Number.isNaN(ny)) {
      if (nx !== ny) return nx - ny;
      continue;
    }
    if (x === y) continue;
    if (x === "") return 1;   // "1.0" > "1.0-alpha01"
    if (y === "") return -1;
    return x < y ? -1 : 1;
  }
  return 0;
}

/**
 * Picks the highest stable and highest pre-release version from Google Maven
 * metadata. The <release> tag is not used: on Google Maven it is simply the
 * most recently published version, frequently an alpha.
 */
export function pickVersionsFromMetadata(xml: string): { stable: string | null; prerelease: string | null } {
  const versions = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map((m) => m[1]!.trim());
  const stable = versions.filter((v) => !PRERELEASE_PATTERN.test(v)).sort(compareVersions).pop() ?? null;
  const prerelease = versions.filter((v) => PRERELEASE_PATTERN.test(v)).sort(compareVersions).pop() ?? null;
  return { stable, prerelease: prerelease && (!stable || compareVersions(prerelease, stable) > 0) ? prerelease : null };
}

async function fromGoogleMaven(groupId: string, artifactId: string): Promise<{ stable: string | null; prerelease: string | null } | null> {
  const groupPath = groupId.replace(/\./g, "/");
  const url = `${GOOGLE_MAVEN_URL}/${groupPath}/${artifactId}/maven-metadata.xml`;
  try {
    const xml = await secureFetch(url);
    const picked = pickVersionsFromMetadata(xml);
    return picked.stable || picked.prerelease ? picked : null;
  } catch {
    return null;
  }
}

/** Picks the highest stable version from a flat list of version strings. */
export function pickStableVersion(versions: string[]): string | null {
  return versions.filter((v) => !PRERELEASE_PATTERN.test(v)).sort(compareVersions).pop() ?? null;
}

async function fromMavenCentral(groupId: string, artifactId: string): Promise<string | null> {
  try {
    // core=gav lists individual versions, so prereleases can be filtered out.
    // The default core's `latestVersion` is simply the newest upload, which
    // can be an alpha/RC (the same flaw as Google Maven's <release> tag).
    const q = encodeURIComponent(`g:"${groupId}" AND a:"${artifactId}"`);
    const url = `${MAVEN_SEARCH_URL}?q=${q}&core=gav&rows=100&wt=json`;
    const data = await secureFetchJson<{
      response?: { docs?: Array<{ v?: string }> };
    }>(url);
    const versions = (data?.response?.docs ?? []).map((d) => d.v).filter((v): v is string => typeof v === "string");
    return pickStableVersion(versions);
  } catch {
    return null;
  }
}

async function fromMavenCentralByArtifact(
  artifactId: string
): Promise<Array<{ groupId: string; artifactId: string }>> {
  try {
    const q = encodeURIComponent(`a:"${artifactId}"`);
    const url = `${MAVEN_SEARCH_URL}?q=${q}&rows=5&wt=json`;
    const data = await secureFetchJson<{
      response?: { docs?: Array<{ g?: string; a?: string }> };
    }>(url);
    return (data?.response?.docs ?? [])
      .filter((d): d is { g: string; a: string } => typeof d.g === "string" && typeof d.a === "string")
      .map((d) => ({ groupId: d.g, artifactId: d.a }));
  } catch {
    return [];
  }
}

async function fromJetpackReleasesPage(slug: string): Promise<string> {
  const url = `https://developer.android.com/jetpack/androidx/releases/${slug}`;
  try {
    return await fetchOfficialPage(url, 1800);
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

  // Explicit "group:artifact" coordinates — look the exact artifact up.
  const coords = /^([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)$/.exec(libraryName.trim());
  if (coords) {
    const [, groupId, artifactId] = coords as unknown as [string, string, string];
    const google = await fromGoogleMaven(groupId, artifactId);
    const version = google?.stable ?? (await fromMavenCentral(groupId, artifactId));
    if (version) {
      return (
        header + formatLibrary({ groupId, artifactId }, version) +
        (google?.prerelease ? `\n\n> 🧪 Newer pre-release available: \`${google.prerelease}\`.` : "") +
        `\n\n> ✅ Highest stable version of \`${groupId}:${artifactId}\` on ${google?.stable ? "Google Maven" : "Maven Central"}.`
      );
    }
    if (google?.prerelease) {
      return header + `**No stable release of \`${groupId}:${artifactId}\`.** Latest pre-release: \`${google.prerelease}\`.`;
    }
    return header + `**\`${groupId}:${artifactId}\` was not found on Google Maven or Maven Central (or they were unreachable).**`;
  }

  const entry = LIBRARY_CATALOGUE[name];

  if (entry) {
    // Try Google Maven first (authoritative for Jetpack + Firebase)
    const google = await fromGoogleMaven(entry.groupId, entry.artifactId);
    let version = google?.stable ?? null;
    const prereleaseNote = google?.prerelease
      ? `\n\n> 🧪 Newer pre-release available: \`${google.prerelease}\` — do not use in production unless the user asks for it.`
      : "";
    const onlyPrerelease = !version && google?.prerelease ? google.prerelease : null;

    // Fallback: Maven Central (for third-party: Retrofit, OkHttp, Coil, etc.)
    if (!version && !onlyPrerelease) version = await fromMavenCentral(entry.groupId, entry.artifactId);

    if (onlyPrerelease) {
      return (
        header +
        `**No stable release exists yet.** Latest pre-release: \`${onlyPrerelease}\`\n\n` +
        `\`\`\`kotlin\nimplementation("${entry.groupId}:${entry.artifactId}:${onlyPrerelease}")\n\`\`\`\n\n` +
        `> ⚠️ Pre-release APIs can change between versions. Tell the user this dependency is not stable.`
      );
    }

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
        header + body + prereleaseNote +
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

  // Unknown library — list Maven Central coordinates that share the artifact
  // name, but print NO paste-ready dependency line: anyone can publish an
  // artifact with a popular name under another group (dependency confusion).
  const candidates = await fromMavenCentralByArtifact(name);
  if (candidates.length > 0) {
    return (
      header +
      `**Not in AndroJack's verified catalogue.** Maven Central artifacts named \`${name}\` ` +
      `(publisher NOT verified — confirm the group ID with the library's official docs before using any):\n\n` +
      candidates.map((c) => `- \`${c.groupId}:${c.artifactId}\` — https://search.maven.org/artifact/${c.groupId}/${c.artifactId}`).join("\n") +
      `\n\n> ⚠️ Do not add a dependency from this list without confirming the publisher. ` +
      `Once confirmed, call gradle_dependency_checker with the full "group:artifact".`
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
