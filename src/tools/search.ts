/**
 * Tool 1 – android_official_search
 *
 * Returns official Android/Kotlin documentation excerpts with source URLs so
 * the LLM can cite them in generated code.
 *
 * v2.1: rewritten on top of src/docs-search.ts. The v2.0 implementation
 * scraped developer.android.com/s/results (client-rendered — returned only
 * the words "Search results"), kotlinlang.org/search.html#q= (fragment never
 * reaches the server — HTTP 404) and source.android.com/search (no such
 * endpoint). It therefore returned no documentation for any query while
 * presenting itself as the "REQUIRED FIRST STEP".
 */

import { searchOfficialDocs, formatDocResults } from "../docs-search.js";
import { isDeveloperKnowledgeEnabled } from "../integrations/developer-knowledge.js";

export async function androidOfficialSearch(query: string): Promise<string> {
  if (!query || query.trim().length < 2) {
    return "ERROR: Query must be at least 2 characters.";
  }

  const sanitizedQuery = query.trim().slice(0, 200); // bound input length
  const outcome = await searchOfficialDocs(sanitizedQuery, { limit: 3, maxChars: 2000 });
  const provider = isDeveloperKnowledgeEnabled()
    ? "Google Developer Knowledge API → AndroJack curated index (fallback)"
    : "AndroJack curated index of official pages (set ANDROJACK_DEVELOPER_KNOWLEDGE_API_KEY for full-text search)";

  const body = outcome.results.length > 0
    ? formatDocResults(outcome)
    : formatDocResults(outcome) +
      `\n\nTry a more specific API or library name (e.g. "LazyColumn", "WorkManager constraints", "Navigation 3"), ` +
      `or call a specialised tool: \`architecture_reference\`, \`android_component_status\`, \`kotlin_best_practices\`.`;

  return (
    `## AndroJack Official Search Results\n` +
    `**Query:** "${sanitizedQuery}"\n` +
    `**Retrieval:** ${provider}\n\n` +
    body +
    `\n\n---\n` +
    `> ⚠️ GROUNDING GATE: Only produce Android code after reviewing the above official sources. ` +
    `If no source matched, say so — do not fall back to training memory.`
  );
}
