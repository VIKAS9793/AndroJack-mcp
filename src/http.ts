/**
 * AndroJack MCP — Production HTTP Layer
 *
 * All outbound requests are:
 *   1. Validated against the domain allowlist (hard fail on violation)
 *   2. Rate-limited per domain (30 req/min, in-process)
 *   3. Retried on transient failures (503, 429, network timeout) with backoff
 *   4. Body-size capped (4 MB) to prevent OOM on large pages
 *   5. Parsed with cheerio (real HTML parser, not regex) for structured extraction
 *
 * Secrets never appear in logs. All writes go to stderr.
 */

import * as cheerio from "cheerio";
import { ALLOWED_DOMAINS, HTTP_TIMEOUT_MS, USER_AGENT } from "./constants.js";
import { docCache, getFetchCacheKey, getFetchCacheTtlMs } from "./cache.js";
import { logger } from "./logger.js";

// ── Rate limiter (per domain, per process lifetime) ──────────────────────────

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_DOMAIN_PER_MINUTE = 30;

function checkRateLimit(domain: string): void {
  const now = Date.now();
  const entry = requestCounts.get(domain);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(domain, { count: 1, resetAt: now + 60_000 });
    return;
  }

  if (entry.count >= MAX_REQUESTS_PER_DOMAIN_PER_MINUTE) {
    throw new Error(
      `Rate limit reached for ${domain}. ` +
      `Max ${MAX_REQUESTS_PER_DOMAIN_PER_MINUTE} req/min. ` +
      `Retry in ${Math.ceil((entry.resetAt - now) / 1000)}s.`
    );
  }

  entry.count++;
}

// ── Domain allowlist ──────────────────────────────────────────────────────────

export function assertAllowedDomain(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: "${url}"`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_DOMAINS as readonly string[];
  const isAllowed = allowed.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );

  if (!isAllowed) {
    throw new Error(
      `Domain "${hostname}" is not in AndroJack's authoritative sources allowlist.\n` +
      `Allowed: ${allowed.join(", ")}`
    );
  }

  return parsed;
}

// ── Core fetch with retry ─────────────────────────────────────────────────────

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempt = 0
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });

    if (!response.ok && RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
      clearTimeout(timer);
      const backoff = RETRY_BASE_MS * 2 ** attempt;
      logger.warn("http_retry", { url, status: response.status, attempt, backoffMs: backoff });
      await sleep(backoff);
      return fetchWithRetry(url, init, attempt + 1);
    }

    return response;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";

    if (isTimeout && attempt < MAX_RETRIES) {
      const backoff = RETRY_BASE_MS * 2 ** attempt;
      logger.warn("http_timeout_retry", { url, attempt, backoffMs: backoff });
      await sleep(backoff);
      return fetchWithRetry(url, init, attempt + 1);
    }

    if (isTimeout) throw new Error(`Request to ${url} timed out after ${HTTP_TIMEOUT_MS / 1000}s`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function secureFetch(url: string): Promise<string> {
  const parsed = assertAllowedDomain(url);
  const cacheKey = getFetchCacheKey(url, "html");
  const cached = docCache.get(cacheKey);

  if (typeof cached === "string") {
    return cached;
  }

  checkRateLimit(parsed.hostname);

  const response = await fetchWithRetry(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${parsed.hostname}: ${response.statusText}`);
  }

  const text = await response.text();
  const boundedText = text.length > MAX_BODY_BYTES ? text.slice(0, MAX_BODY_BYTES) : text;
  docCache.set(cacheKey, boundedText, getFetchCacheTtlMs(parsed.hostname, "html"));
  return boundedText;
}

export async function secureFetchJson<T = unknown>(url: string): Promise<T> {
  const parsed = assertAllowedDomain(url);
  const cacheKey = getFetchCacheKey(url, "json");
  const cached = docCache.get(cacheKey);

  if (cached !== undefined) {
    return structuredClone(cached as T);
  }

  checkRateLimit(parsed.hostname);

  const response = await fetchWithRetry(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  const payload = (await response.json()) as T;
  docCache.set(cacheKey, structuredClone(payload), getFetchCacheTtlMs(parsed.hostname, "json"));
  return payload;
}

// ── HTML extraction (cheerio) ─────────────────────────────────────────────────

export function extractPageText(html: string, maxChars = 3000): string {
  const $ = cheerio.load(html);

  $("script, style, nav, header, footer, aside, [role='navigation'], [role='banner'], [aria-hidden='true']").remove();
  $(".toc, .nav, .sidebar, .cookie-banner, .feedback, .devsite-nav").remove();

  const contentSelectors = [
    "main",
    "article",
    "#main-content",
    ".devsite-article",
    ".article-content",
    ".page-content",
    "body",
  ];

  let text = "";
  for (const sel of contentSelectors) {
    const el = $(sel);
    if (el.length) { text = el.text(); break; }
  }

  if (!text) text = $("body").text();

  text = text
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.length > maxChars ? text.slice(0, maxChars) + "…" : text;
}

export function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  return $("body").text().replace(/\s{2,}/g, " ").trim();
}
