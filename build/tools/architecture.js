/**
 * Tool 3 – architecture_reference
 *
 * Retrieves official Android architecture guide content for a given topic.
 * The AI MUST call this before suggesting project structure, patterns,
 * or Jetpack component relationships.
 */
import { ARCHITECTURE_GUIDES } from "../constants.js";
import { secureFetch, extractPageText } from "../http.js";
function findGuideUrl(topic) {
    const lower = topic.toLowerCase().trim();
    // Exact key match
    if (ARCHITECTURE_GUIDES[lower])
        return ARCHITECTURE_GUIDES[lower];
    // Partial key match
    for (const [key, url] of Object.entries(ARCHITECTURE_GUIDES)) {
        if (lower.includes(key) || key.includes(lower))
            return url;
    }
    return null;
}
/**
 * Core handler for architecture_reference tool.
 */
export async function architectureReference(topic) {
    if (!topic || topic.trim().length < 2) {
        return "ERROR: Topic must be at least 2 characters.";
    }
    const sanitized = topic.trim().slice(0, 200);
    const guideUrl = findGuideUrl(sanitized);
    const header = `## AndroJack Architecture Reference\n` +
        `**Topic:** "${sanitized}"\n\n`;
    if (!guideUrl) {
        // Fallback: search developer.android.com
        const searchUrl = `https://developer.android.com/s/results?q=${encodeURIComponent(sanitized)}`;
        try {
            const html = await secureFetch(searchUrl);
            const text = extractPageText(html, 2500);
            return (header +
                `**No direct guide mapped. Showing search results from developer.android.com:**\n` +
                `**URL:** ${searchUrl}\n\n` +
                text +
                `\n\n> 📐 GROUNDING GATE: Review the architecture guide above before proposing any structure.`);
        }
        catch (err) {
            return (header +
                `Could not fetch guide. Search manually: ${searchUrl}\n` +
                `Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    try {
        const html = await secureFetch(guideUrl);
        const text = extractPageText(html, 3000);
        return (header +
            `**Official Guide:** ${guideUrl}\n\n` +
            text +
            `\n\n---\n` +
            `> 📐 GROUNDING GATE: Architecture code must align with the official guide above.`);
    }
    catch (err) {
        return (header +
            `**Official Guide:** ${guideUrl}\n` +
            `**Fetch failed:** ${err instanceof Error ? err.message : String(err)}\n\n` +
            `Please open the guide manually: ${guideUrl}`);
    }
}
/**
 * Returns the full list of supported architecture topics for discovery.
 */
export function listArchitectureTopics() {
    const topics = Object.keys(ARCHITECTURE_GUIDES).sort();
    return (`## Supported Architecture Topics\n\n` +
        topics.map((t) => `- \`${t}\``).join("\n") +
        `\n\nPass any of these to \`architecture_reference\` for official guide content.`);
}
