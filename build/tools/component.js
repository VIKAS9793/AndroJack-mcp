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
import { COMPONENT_REGISTRY } from "../constants.js";
import { secureFetch, extractPageText } from "../http.js";
function formatEntry(name, entry) {
    const statusEmoji = entry.status === "stable"
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
 * Fuzzy lookup — handles casing differences and partial matches.
 */
function findInRegistry(name) {
    const lower = name.toLowerCase();
    // Exact match first
    for (const [key, val] of Object.entries(COMPONENT_REGISTRY)) {
        if (key.toLowerCase() === lower)
            return [key, val];
    }
    // Partial match
    for (const [key, val] of Object.entries(COMPONENT_REGISTRY)) {
        if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
            return [key, val];
        }
    }
    return null;
}
/**
 * Falls back to scraping the Android reference docs for unknown components.
 */
async function fetchFromAndroidDocs(componentName) {
    const encoded = encodeURIComponent(componentName);
    const url = `https://developer.android.com/s/results?q=${encoded}`;
    try {
        const html = await secureFetch(url);
        const text = extractPageText(html, 1500);
        return (`## Component Status: \`${componentName}\`\n` +
            `**Status:** ❓ Not in local registry — showing live search results\n` +
            `**Search URL:** ${url}\n\n` +
            text +
            `\n\n> Review the results above to confirm current API status before use.`);
    }
    catch (err) {
        return (`## Component Status: \`${componentName}\`\n` +
            `**Status:** ❓ Unknown — not in registry, live fetch failed.\n` +
            `**Check manually:** https://developer.android.com/reference/${componentName.replace(/\./g, "/")}\n` +
            `**Error:** ${err instanceof Error ? err.message : String(err)}`);
    }
}
/**
 * Core handler for android_component_status tool.
 */
export async function androidComponentStatus(componentName) {
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
