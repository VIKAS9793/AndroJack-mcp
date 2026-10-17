/**
 * AndroJack MCP — Official documentation retrieval (single choke point)
 *
 * Every tool that surfaces externally-fetched documentation goes through this
 * module, which guarantees two properties:
 *
 *   1. Fetched text is ALWAYS wrapped by wrapUntrustedContent().
 *   2. "Search" returns documentation. Retrieval order:
 *        a. Google Developer Knowledge API, when a key is configured
 *        b. Curated index of verified canonical pages (src/docs-index.ts),
 *           fetched directly (server-rendered, so content is real)
 *      Client-rendered search pages are never scraped: they contain no results
 *      when fetched server-side.
 *
 * Offline mode (ANDROJACK_OFFLINE=1) skips all network calls and returns the
 * matched canonical links only. Used for air-gapped setups and hermetic tests.
 */

import { secureFetch, extractPageText } from "./http.js";
import { sanitizeInlineText, UNTRUSTED_NOTICE, wrapUntrustedContent } from "./content-sanitizer.js";
import { callContext } from "./session-memo.js";
import { matchDocIndex } from "./docs-index.js";
import {
  isDeveloperKnowledgeEnabled,
  searchDeveloperKnowledge,
} from "./integrations/developer-knowledge.js";

export type DocProvider = "google-developer-knowledge" | "curated-index" | "offline-index";

export interface DocResult {
  title: string;
  url: string;
  /** Wrapped in an untrusted-content boundary; empty in offline mode. */
  excerpt: string;
  provider: DocProvider;
  /** True when this page was already excerpted earlier in the session. */
  alreadySent?: boolean;
}

export interface DocSearchOutcome {
  results: DocResult[];
  /** Human-readable notes about fallbacks/failures, safe to show the agent. */
  notes: string[];
}

export function isOfflineMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env["ANDROJACK_OFFLINE"] === "1";
}

function labelFor(url: string): string {
  try {
    return `${new URL(url).hostname} (official documentation)`;
  } catch {
    return "official documentation";
  }
}

/**
 * Fetches one allowlisted documentation page and returns its main text,
 * wrapped as untrusted content. Throws on network/allowlist failure.
 */
export async function fetchOfficialPage(url: string, maxChars = 2000, notice = true): Promise<string> {
  const html = await secureFetch(url);
  return wrapUntrustedContent(url, extractPageText(html, maxChars), labelFor(url), { notice });
}

/**
 * Marks results whose page was already excerpted earlier in this MCP session
 * and drops their excerpt (unless the call asked for refresh), then records
 * the rest as sent.
 */
function applySessionDedupe(outcome: DocSearchOutcome): DocSearchOutcome {
  const ctx = callContext.getStore();
  if (!ctx) return outcome;
  for (const r of outcome.results) {
    if (!r.excerpt) continue;
    if (!ctx.refresh && ctx.memo.hasUrl(r.url)) {
      r.excerpt = "";
      r.alreadySent = true;
    } else {
      ctx.memo.recordUrl(r.url);
    }
  }
  return outcome;
}

/**
 * Searches official Android documentation and returns wrapped excerpts.
 * Never throws: every failure becomes a note, so tools degrade instead of
 * erroring the whole call.
 */
export async function searchOfficialDocs(
  query: string,
  opts: { limit?: number; maxChars?: number } = {}
): Promise<DocSearchOutcome> {
  const limit = opts.limit ?? 2;
  const maxChars = opts.maxChars ?? 1500;
  const notes: string[] = [];
  const trimmed = query.trim().slice(0, 200);

  if (isOfflineMode()) {
    const matches = matchDocIndex(trimmed, limit);
    notes.push("Offline mode (ANDROJACK_OFFLINE=1): returning canonical links without live excerpts.");
    return {
      results: matches.map((m) => ({ title: m.title, url: m.url, excerpt: "", provider: "offline-index" })),
      notes,
    };
  }

  if (isDeveloperKnowledgeEnabled()) {
    try {
      const chunks = await searchDeveloperKnowledge(trimmed, limit);
      if (chunks.length > 0) {
        return applySessionDedupe({
          results: chunks.map((c) => ({
            // Title and URL are rendered outside the untrusted block, so they
            // must be neutralised here: a raw title could carry a spoofed
            // boundary or instructions.
            title: sanitizeInlineText(c.title) || "Untitled document",
            url: new URL(c.url).href,
            excerpt: wrapUntrustedContent(c.url, c.content.slice(0, maxChars), "Google Developer Knowledge API", { notice: false }),
            provider: "google-developer-knowledge" as const,
          })),
          notes,
        });
      }
      notes.push("Google Developer Knowledge API returned no Android results; using AndroJack's curated index.");
    } catch (err) {
      notes.push(
        `Google Developer Knowledge API unavailable (${err instanceof Error ? err.message : String(err)}); ` +
        `using AndroJack's curated index.`
      );
    }
  }

  const matches = matchDocIndex(trimmed, limit);
  if (matches.length === 0) {
    notes.push(
      "No curated page matched this query. For open-ended documentation search, configure " +
      "ANDROJACK_DEVELOPER_KNOWLEDGE_API_KEY (Google Developer Knowledge API) or use the " +
      "Android CLI (`android docs search`)."
    );
    return { results: [], notes };
  }

  const settled = await Promise.allSettled(matches.map((m) => fetchOfficialPage(m.url, maxChars, false)));
  const results: DocResult[] = [];
  settled.forEach((outcome, i) => {
    const match = matches[i]!;
    if (outcome.status === "fulfilled") {
      results.push({ title: match.title, url: match.url, excerpt: outcome.value, provider: "curated-index" });
    } else {
      const reason = outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason);
      notes.push(`Could not fetch ${match.url}: ${reason}`);
      results.push({ title: match.title, url: match.url, excerpt: "", provider: "curated-index" });
    }
  });

  return applySessionDedupe({ results, notes });
}

/** Renders a DocSearchOutcome as Markdown for tool output. */
export function formatDocResults(outcome: DocSearchOutcome): string {
  const parts: string[] = [];
  if (outcome.results.some((r) => r.excerpt)) parts.push(`> ${UNTRUSTED_NOTICE}`);
  for (const r of outcome.results) {
    const body = r.excerpt
      ? `\n${r.excerpt}`
      : r.alreadySent
        ? `\n_Excerpt already provided earlier in this session (not resent). Call again with refresh: true if it is no longer in your context._`
        : `\n_(Open the source link — excerpt not fetched.)_`;
    parts.push(`### ${r.title}\n**Source:** ${r.url}\n${body}`);
  }
  if (outcome.notes.length > 0) {
    parts.push(outcome.notes.map((n) => `> ℹ️ ${n}`).join("\n"));
  }
  return parts.join("\n\n---\n\n");
}
