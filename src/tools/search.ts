/**
 * Tool 1 – android_official_search
 *
 * Searches developer.android.com, kotlinlang.org, and source.android.com
 * restricted to authoritative domains only. Returns structured excerpts
 * with source URLs so the LLM can cite them in generated code.
 */

import { secureFetch, extractPageText } from "../http.js";

interface SearchResult {
  title: string;
  url: string;
  excerpt: string;
  domain: string;
}

/**
 * Builds a Google site-restricted search URL. We use the Google Custom
 * Search JSON API pattern but fall back to direct developer.android.com
 * search if no API key is configured (KISS principle – works out of the box).
 */
function buildSearchUrl(query: string, domain: string): string {
  const encoded = encodeURIComponent(query);
  // developer.android.com has a public search endpoint
  if (domain === "developer.android.com") {
    return `https://developer.android.com/s/results?q=${encoded}`;
  }
  if (domain === "kotlinlang.org") {
    return `https://kotlinlang.org/search.html#q=${encoded}`;
  }
  // Fallback: construct a direct reference URL
  return `https://${domain}/search?q=${encoded}`;
}

/**
 * Fetches a single authoritative page and returns a structured result.
 * Fails gracefully – one domain failing should not block others.
 */
async function fetchFromDomain(
  query: string,
  domain: string
): Promise<SearchResult | null> {
  try {
    const url = buildSearchUrl(query, domain);
    const html = await secureFetch(url);
    const text = extractPageText(html, 2000);

    // Try to extract a page title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : `${domain} – ${query}`;

    return {
      title,
      url,
      excerpt: text,
      domain,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      title: `[Fetch failed: ${domain}]`,
      url: buildSearchUrl(query, domain),
      excerpt: `Could not retrieve: ${message}`,
      domain,
    };
  }
}

/**
 * Core handler for android_official_search.
 * Queries all authoritative Android engineering domains in parallel.
 */
export async function androidOfficialSearch(query: string): Promise<string> {
  if (!query || query.trim().length < 2) {
    return "ERROR: Query must be at least 2 characters.";
  }

  const sanitizedQuery = query.trim().slice(0, 200); // bound input length

  const domains = [
    "developer.android.com",
    "kotlinlang.org",
    "source.android.com",
  ];

  // Parallel fetch — ALLOWED_DOMAINS enforced inside secureFetch
  const results = await Promise.allSettled(
    domains.map((d) => fetchFromDomain(sanitizedQuery, d))
  );

  const formatted = results
    .map((r, i) => {
      if (r.status === "rejected") {
        return `### ${domains[i]}\n> Error: ${r.reason}`;
      }
      const res = r.value;
      if (!res) return "";
      return `### ${res.title}\n**Source:** ${res.url}\n\n${res.excerpt}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  return (
    `## AndroJack Official Search Results\n` +
    `**Query:** "${sanitizedQuery}"\n` +
    `**Sources:** ${domains.join(", ")}\n\n` +
    formatted +
    `\n\n---\n` +
    `> ⚠️ GROUNDING GATE: Only produce Android code after reviewing the above official sources.`
  );
}
