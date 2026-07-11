/**
 * Tool 3 – architecture_reference
 *
 * Retrieves official Android architecture guide content for a given topic.
 * The AI MUST call this before suggesting project structure, patterns,
 * or Jetpack component relationships.
 *
 * v2.0: Android UI Development is now officially "Compose First" (May 19,
 * 2026) — any new Android Studio UI tooling is built for Compose only, and
 * View-based libraries (Fragments, RecyclerView, ViewPager, Navigation/Layout
 * Editor) are frozen to critical bugfixes only. When a query maps to a
 * View-based topic, this tool prepends a maintenance-mode notice steering
 * toward the Compose equivalent, rather than silently returning legacy
 * guidance as if it were still the recommended path.
 */

import {
  ARCHITECTURE_GUIDES,
  VIEW_BASED_MAINTENANCE_MODE_TOPICS,
} from "../constants.js";
import { secureFetch, extractPageText } from "../http.js";

const COMPOSE_FIRST_SOURCE =
  "https://android-developers.googleblog.com/2026/05/android-ui-development-is-compose-first.html";

function findGuideUrl(topic: string): string | null {
  const lower = topic.toLowerCase().trim();

  // Exact key match
  if (ARCHITECTURE_GUIDES[lower]) return ARCHITECTURE_GUIDES[lower];

  // Partial key match
  for (const [key, url] of Object.entries(ARCHITECTURE_GUIDES)) {
    if (lower.includes(key) || key.includes(lower)) return url;
  }

  return null;
}

/**
 * Checks whether the requested topic is a View-based pattern now in
 * maintenance mode, and if so returns a steering notice.
 */
function checkViewBasedMaintenanceMode(topic: string): string | null {
  const lower = topic.toLowerCase().trim();

  const matched = [...VIEW_BASED_MAINTENANCE_MODE_TOPICS].find(
    (t) => lower.includes(t) || t.includes(lower)
  );

  if (!matched) return null;

  return (
    `> ⚠️ **Compose-First Notice** (as of May 19, 2026)\n` +
    `> "${matched}" is a View-based pattern. Google now considers Views ` +
    `**complete** — only critical bugfixes will be published. Any new Android ` +
    `Studio UI tooling (Navigation Editor, Layout Editor) is in maintenance ` +
    `mode with no new features. New projects and new features should be ` +
    `built in Jetpack Compose.\n` +
    `> Source: ${COMPOSE_FIRST_SOURCE}\n\n` +
    `The guide below is provided for maintaining existing View-based code only. ` +
    `For new development, call \`architecture_reference\` with "compose" instead.\n\n---\n\n`
  );
}

/**
 * Core handler for architecture_reference tool.
 */
export async function architectureReference(topic: string): Promise<string> {
  if (!topic || topic.trim().length < 2) {
    return "ERROR: Topic must be at least 2 characters.";
  }

  const sanitized = topic.trim().slice(0, 200);
  const guideUrl = findGuideUrl(sanitized);
  const maintenanceNotice = checkViewBasedMaintenanceMode(sanitized);

  const header =
    `## AndroJack Architecture Reference\n` +
    `**Topic:** "${sanitized}"\n\n` +
    (maintenanceNotice ?? "");

  if (!guideUrl) {
    // Fallback: search developer.android.com
    const searchUrl = `https://developer.android.com/s/results?q=${encodeURIComponent(sanitized)}`;
    try {
      const html = await secureFetch(searchUrl);
      const text = extractPageText(html, 2500);
      return (
        header +
        `**No direct guide mapped. Showing search results from developer.android.com:**\n` +
        `**URL:** ${searchUrl}\n\n` +
        text +
        `\n\n> 📐 GROUNDING GATE: Review the architecture guide above before proposing any structure.`
      );
    } catch (err) {
      return (
        header +
        `Could not fetch guide. Search manually: ${searchUrl}\n` +
        `Error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  try {
    const html = await secureFetch(guideUrl);
    const text = extractPageText(html, 3000);

    return (
      header +
      `**Official Guide:** ${guideUrl}\n\n` +
      text +
      `\n\n---\n` +
      `> 📐 GROUNDING GATE: Architecture code must align with the official guide above.`
    );
  } catch (err) {
    return (
      header +
      `**Official Guide:** ${guideUrl}\n` +
      `**Fetch failed:** ${err instanceof Error ? err.message : String(err)}\n\n` +
      `Please open the guide manually: ${guideUrl}`
    );
  }
}

/**
 * Returns the full list of supported architecture topics for discovery.
 */
export function listArchitectureTopics(): string {
  const topics = Object.keys(ARCHITECTURE_GUIDES).sort();
  return (
    `## Supported Architecture Topics\n\n` +
    topics.map((t) => `- \`${t}\``).join("\n") +
    `\n\nPass any of these to \`architecture_reference\` for official guide content.\n\n` +
    `> As of May 2026, Android UI development is Compose First. Views (Fragments, ` +
    `RecyclerView, ViewPager) are in maintenance mode — new development should use Compose.`
  );
}
