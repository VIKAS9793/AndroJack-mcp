/**
 * Tool 2 – android_component_status
 *
 * Validates whether an Android/Kotlin component, API class, or library
 * is current, deprecated, or removed. Uses the built-in registry first
 * (instant, no network), then falls back to scraping developer.android.com.
 *
 * This is the single most impactful tool — it eliminates deprecated API usage
 * before a single line of code is written.
 */

import { COMPONENT_REGISTRY, ComponentEntry } from "../constants.js";
import { searchOfficialDocs, formatDocResults } from "../docs-search.js";

function formatEntry(name: string, entry: ComponentEntry): string {
  const statusEmoji =
    entry.status === "stable"
      ? "✅"
      : entry.status === "deprecated"
      ? "⚠️"
      : entry.status === "removed"
      ? "❌"
      : "🧪";

  return [
    `## Component Status: \`${name}\``,
    `**Status:** ${statusEmoji} ${entry.status.toUpperCase()}`,
    entry.since ? `**Changed Since:** ${entry.since}` : "",
    entry.replacement ? `**Use Instead:** ${entry.replacement}` : "",
    `**Official Docs:** ${entry.docUrl}`,
    entry.notes ? `**Notes:** ${entry.notes}` : "",
    "",
    entry.status === "deprecated" || entry.status === "removed"
      ? `> ❌ GROUNDING GATE: Do NOT use \`${name}\`. Migrate to: ${entry.replacement ?? "see docs"}.`
      : `> ✅ GROUNDING GATE: \`${name}\` is current. Proceed with official docs as reference.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * Registry lookup. Matches are exact (case-insensitive) on either the full
 * key or the simple class name (last dotted segment), so
 * "android.widget.ProgressDialog" and "ProgressDialog" both resolve.
 *
 * There is deliberately no substring or fuzzy matching: "Row" must not match
 * ContextualFlowRow. A wrong "deprecated" verdict is worse than "unknown" —
 * the agent rewrites correct code — so unknown names fall through to the
 * documentation path instead.
 */
export function findInRegistry(name: string): [string, ComponentEntry] | null {
  const lower = name.trim().toLowerCase();
  const simple = (value: string) => value.split(".").pop()!.toLowerCase();

  for (const [key, val] of Object.entries(COMPONENT_REGISTRY)) {
    if (key.toLowerCase() === lower) return [key, val];
  }

  // Qualified suffix: "Notification.Builder" → "android.app.Notification.Builder"
  if (lower.includes(".")) {
    for (const [key, val] of Object.entries(COMPONENT_REGISTRY)) {
      if (key.toLowerCase().endsWith(`.${lower}`)) return [key, val];
    }
  }

  for (const [key, val] of Object.entries(COMPONENT_REGISTRY)) {
    // Skip nested classes ("android.app.Notification.Builder"): their simple
    // name ("Builder") is too generic to identify them on its own.
    const segments = key.split(".");
    const isNested = segments.length > 2 && /^[A-Z]/.test(segments[segments.length - 2]!);
    if (!isNested && simple(key) === simple(lower)) return [key, val];
  }

  return null;
}

/**
 * Falls back to official documentation for components not in the registry.
 */
async function fetchFromAndroidDocs(componentName: string): Promise<string> {
  const referenceUrl = `https://developer.android.com/reference/${componentName.replace(/\./g, "/")}`;
  const outcome = await searchOfficialDocs(componentName, { limit: 2, maxChars: 1500 });
  return (
    `## Component Status: \`${componentName}\`\n` +
    `**Status:** ❓ Not in AndroJack's verified registry — status NOT confirmed.\n` +
    `**Reference (if this is a platform class):** ${referenceUrl}\n\n` +
    (outcome.results.length > 0 || outcome.notes.length > 0 ? formatDocResults(outcome) + "\n\n" : "") +
    `> Do not assume this API is stable. Confirm its status on the reference page above before use.`
  );
}

/**
 * Core handler for android_component_status tool.
 */
export async function androidComponentStatus(componentName: string): Promise<string> {
  if (!componentName || componentName.trim().length < 2) {
    return "ERROR: Component name must be at least 2 characters.";
  }

  const name = componentName.trim().slice(0, 200);
  const found = findInRegistry(name);

  if (found) {
    return formatEntry(found[0], found[1]);
  }

  // Not in built-in registry — fetch live
  return fetchFromAndroidDocs(name);
}
