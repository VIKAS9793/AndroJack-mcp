/**
 * Tool 6 – android_api_level_check
 *
 * Maps API levels to version names, SDK integers, and market share.
 * Prevents writing code that uses APIs unavailable at the project's minSdk.
 * Zero network required — all data is embedded (fast + reliable).
 */

interface ApiLevelEntry {
  versionName: string;
  codename: string;
  apiLevel: number;
  releasedYear: number;
  marketShareApprox?: string; // sourced from Android Studio distribution data
  notableFeatures: string[];
}

// Source: https://developer.android.com/tools/releases/platforms
// Updated through API 36 (Android 16, 2025)
const API_LEVELS: ApiLevelEntry[] = [
  {
    versionName: "Android 16",
    codename: "Baklava",
    apiLevel: 36,
    releasedYear: 2025,
    notableFeatures: ["Predictive back gesture stable", "Health Connect updates", "Large screen optimizations"],
  },
  {
    versionName: "Android 15",
    codename: "VanillaIceCream",
    apiLevel: 35,
    releasedYear: 2024,
    notableFeatures: ["Edge-to-edge enforcement", "NFC improvements", "Partial screen sharing"],
  },
  {
    versionName: "Android 14",
    codename: "UpsideDownCake",
    apiLevel: 34,
    releasedYear: 2023,
    marketShareApprox: "~35%",
    notableFeatures: ["Health Connect", "Photo picker", "Credential Manager"],
  },
  {
    versionName: "Android 13",
    codename: "Tiramisu",
    apiLevel: 33,
    releasedYear: 2022,
    marketShareApprox: "~20%",
    notableFeatures: ["Per-app language prefs", "Themed app icons", "Media permissions"],
  },
  {
    versionName: "Android 12",
    codename: "SnowCone",
    apiLevel: 31,
    releasedYear: 2021,
    marketShareApprox: "~15%",
    notableFeatures: ["Material You", "Splash screen API", "App hibernation"],
  },
  {
    versionName: "Android 11",
    codename: "RedVelvetCake",
    apiLevel: 30,
    releasedYear: 2020,
    marketShareApprox: "~10%",
    notableFeatures: ["One-time permissions", "Scoped storage enforced", "AsyncTask deprecated"],
  },
  {
    versionName: "Android 10",
    codename: "QuinceTart",
    apiLevel: 29,
    releasedYear: 2019,
    marketShareApprox: "~8%",
    notableFeatures: ["Dark theme", "Scoped storage", "Gesture navigation"],
  },
  {
    versionName: "Android 9",
    codename: "Pie",
    apiLevel: 28,
    releasedYear: 2018,
    notableFeatures: ["Wi-Fi RTT", "Display cutout support", "Neural Networks API 1.1"],
  },
  {
    versionName: "Android 8.0",
    codename: "Oreo",
    apiLevel: 26,
    releasedYear: 2017,
    notableFeatures: ["Notification channels (REQUIRED)", "Picture-in-picture", "Autofill"],
  },
  {
    versionName: "Android 7.0",
    codename: "Nougat",
    apiLevel: 24,
    releasedYear: 2016,
    notableFeatures: ["Multi-window", "Direct reply notifications", "Doze improvements"],
  },
  {
    versionName: "Android 6.0",
    codename: "Marshmallow",
    apiLevel: 23,
    releasedYear: 2015,
    notableFeatures: ["Runtime permissions (REQUIRED)", "Fingerprint API", "Doze mode"],
  },
  {
    versionName: "Android 5.0",
    codename: "Lollipop",
    apiLevel: 21,
    releasedYear: 2014,
    notableFeatures: ["Material Design", "ART runtime default", "Vector drawables"],
  },
];

function findByApiLevel(level: number): ApiLevelEntry | undefined {
  return API_LEVELS.find((e) => e.apiLevel === level);
}

function findByName(name: string): ApiLevelEntry | undefined {
  const lower = name.toLowerCase();
  return API_LEVELS.find(
    (e) =>
      e.versionName.toLowerCase().includes(lower) ||
      e.codename.toLowerCase().includes(lower)
  );
}

/**
 * Checks what APIs are available at a given minSdk level and warns about
 * common pitfalls.
 */
function getMinSdkWarnings(minSdk: number): string[] {
  const warnings: string[] = [];

  if (minSdk < 26) warnings.push("⚠️ API < 26: Notification channels not available (required for foreground services on Android 8+)");
  if (minSdk < 23) warnings.push("⚠️ API < 23: Runtime permissions not available — you must handle permission dialogs manually");
  if (minSdk < 21) warnings.push("⚠️ API < 21: Material Design components and VectorDrawable support limited");
  if (minSdk >= 21) warnings.push("✅ API 21+: Jetpack Compose minimum supported");
  if (minSdk >= 23) warnings.push("✅ API 23+: Safe to use runtime permissions API directly");
  if (minSdk >= 26) warnings.push("✅ API 26+: Notification channels required and available");

  return warnings;
}

/**
 * Core handler for android_api_level_check tool.
 */
export function androidApiLevelCheck(input: string): string {
  const trimmed = input.trim();

  // Numeric API level input
  const numeric = parseInt(trimmed, 10);
  if (!isNaN(numeric)) {
    const entry = findByApiLevel(numeric);
    if (!entry) {
      const closest = API_LEVELS.reduce((prev, curr) =>
        Math.abs(curr.apiLevel - numeric) < Math.abs(prev.apiLevel - numeric) ? curr : prev
      );
      return (
        `## AndroJack API Level Check\n**Input:** API ${numeric}\n\n` +
        `❓ API level ${numeric} not in local registry.\n` +
        `Closest known: **${closest.versionName} (API ${closest.apiLevel})**\n\n` +
        `Check: https://developer.android.com/tools/releases/platforms`
      );
    }

    const warnings = getMinSdkWarnings(numeric);
    return (
      `## AndroJack API Level Check\n\n` +
      `| Field | Value |\n|---|---|\n` +
      `| Version | ${entry.versionName} |\n` +
      `| Codename | ${entry.codename} |\n` +
      `| API Level | ${entry.apiLevel} |\n` +
      `| Released | ${entry.releasedYear} |\n` +
      (entry.marketShareApprox ? `| Market Share | ${entry.marketShareApprox} |\n` : "") +
      `\n**Notable Features:**\n${entry.notableFeatures.map((f) => `- ${f}`).join("\n")}\n\n` +
      `**minSdk Guidance:**\n${warnings.join("\n")}\n\n` +
      `**Official Reference:** https://developer.android.com/tools/releases/platforms\n\n` +
      `> ℹ️ Use \`compileSdk ${Math.max(entry.apiLevel, 35)}\` and set \`minSdk\` based on your audience.`
    );
  }

  // Text input (version name or codename)
  const entry = findByName(trimmed);
  if (entry) {
    return androidApiLevelCheck(String(entry.apiLevel));
  }

  // Full table fallback
  const table =
    `## Android API Level Reference\n\n` +
    `| Version | Codename | API | Year | Market Share |\n|---|---|---|---|---|\n` +
    API_LEVELS.map(
      (e) =>
        `| ${e.versionName} | ${e.codename} | ${e.apiLevel} | ${e.releasedYear} | ${e.marketShareApprox ?? "—"} |`
    ).join("\n") +
    `\n\n**Recommended minSdk for new apps:** API 26+ (covers ~90%+ of active devices)\n` +
    `**Official Reference:** https://developer.android.com/tools/releases/platforms`;

  return table;
}
