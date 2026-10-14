/**
 * AndroJack MCP — Google Developer Knowledge API integration (optional)
 *
 * Google's first-party Developer Knowledge API / MCP server
 * (developerknowledge.googleapis.com, public preview since Feb 2026) indexes
 * developer.android.com and returns real search hits — something a keyless
 * server-side scrape of developer.android.com search cannot do, because that
 * page renders its results client-side.
 *
 * AndroJack treats it as an upstream retrieval layer, not a competitor:
 * Google owns "what do the docs say"; AndroJack owns "does this code comply"
 * (validator, compliance mandates, CI gate). When a key is configured, the
 * docs-backed tools use this API first and fall back to the curated index.
 *
 * Security:
 *   - The key is sent only in the X-Goog-Api-Key header, never in the URL,
 *     so it cannot leak through logs, error messages, or cache keys.
 *   - Results are filtered to AndroJack's domain allowlist before use.
 *   - Content is still wrapped as untrusted (single-publisher, but it is
 *     externally fetched text entering the agent's context).
 *
 * REST reference (discovery doc, revision 20261011):
 *   GET https://developerknowledge.googleapis.com/v1/documents:searchDocumentChunks
 *       ?query=…&pageSize=…&filter=…
 *   → { results: [{ parent, id, content, relevanceScore, document: { uri, title, description } }] }
 */

import { ALLOWED_DOMAINS, USER_AGENT } from "../constants.js";
import { docCache } from "../cache.js";
import { checkRateLimit, fetchFollowingAllowlistedRedirects, readResponseText } from "../http.js";
import { logger } from "../logger.js";

const ENDPOINT = "https://developerknowledge.googleapis.com/v1/documents:searchDocumentChunks";
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_RESPONSE_BYTES = 512 * 1024;

export const DEVELOPER_KNOWLEDGE_ENV_VARS = [
  "ANDROJACK_DEVELOPER_KNOWLEDGE_API_KEY",
  "DEVELOPERKNOWLEDGE_API_KEY",
] as const;

export interface KnowledgeChunk {
  title: string;
  url: string;
  content: string;
  relevance: number;
}

export function getDeveloperKnowledgeApiKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  for (const name of DEVELOPER_KNOWLEDGE_ENV_VARS) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function isDeveloperKnowledgeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return getDeveloperKnowledgeApiKey(env) !== undefined && env["ANDROJACK_OFFLINE"] !== "1";
}

function isAllowlistedUri(uri: string): boolean {
  try {
    const host = new URL(uri).hostname.toLowerCase();
    return (ALLOWED_DOMAINS as readonly string[]).some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

interface RawChunk {
  content?: unknown;
  relevanceScore?: unknown;
  document?: { uri?: unknown; title?: unknown };
}

/**
 * Parses an API response defensively — every field is optional and typed
 * `unknown` until checked, so a schema change upstream degrades to "no
 * results" instead of a crash.
 */
export function parseKnowledgeResponse(payload: unknown, limit: number): KnowledgeChunk[] {
  const results = (payload as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];

  const chunks: KnowledgeChunk[] = [];
  for (const raw of results as RawChunk[]) {
    const url = typeof raw?.document?.uri === "string" ? raw.document.uri : "";
    const content = typeof raw?.content === "string" ? raw.content : "";
    if (!url || !content || !isAllowlistedUri(url)) continue;
    chunks.push({
      url,
      content,
      title: typeof raw.document?.title === "string" ? raw.document.title : url,
      relevance: typeof raw.relevanceScore === "number" ? raw.relevanceScore : 0,
    });
    if (chunks.length >= limit) break;
  }
  return chunks;
}

/**
 * Searches Google's Developer Knowledge corpus, restricted to Android docs.
 * Returns [] (never throws) when no key is configured; throws on transport
 * or HTTP errors so callers can report the failure and fall back.
 */
export async function searchDeveloperKnowledge(query: string, limit = 3): Promise<KnowledgeChunk[]> {
  const apiKey = getDeveloperKnowledgeApiKey();
  if (!apiKey || process.env["ANDROJACK_OFFLINE"] === "1") return [];

  const cacheKey = `devknowledge:${limit}:${query}`;
  const cached = docCache.get(cacheKey);
  if (Array.isArray(cached)) return cached as KnowledgeChunk[];

  checkRateLimit("developerknowledge.googleapis.com");

  const params = new URLSearchParams({
    query,
    pageSize: String(Math.min(Math.max(limit * 2, 2), 10)),
    filter: 'data_source = "developer.android.com"',
  });

  const { response } = await fetchFollowingAllowlistedRedirects(`${ENDPOINT}?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "X-Goog-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    // Never echo the response body: some Google error payloads repeat request
    // metadata, and the status alone is enough to diagnose key/quota issues.
    throw new Error(
      `Developer Knowledge API returned HTTP ${response.status}` +
      (response.status === 403 ? " (check the API is enabled and the key is restricted to it)" : "")
    );
  }

  // Streaming read: enforces the size cap and deadline without buffering an
  // unbounded body first.
  const text = await readResponseText(response, MAX_RESPONSE_BYTES);

  const chunks = parseKnowledgeResponse(JSON.parse(text), limit);
  logger.debug("devknowledge_search", { results: chunks.length });
  docCache.set(cacheKey, chunks, CACHE_TTL_MS);
  return chunks;
}
