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
const ROBOTS_CACHE_TTL_MS = 60 * 60 * 1000;
const ROBOTS_AGENT_NAME = USER_AGENT.split("/")[0]!.trim().toLowerCase();

type RobotsPolicy = {
  allowPrefixes: string[];
  disallowPrefixes: string[];
  crawlDelayMs?: number;
};

type CachedRobotsPolicy = {
  policy: RobotsPolicy;
  expiresAt: number;
};

const robotsPolicyCache = new Map<string, CachedRobotsPolicy>();
const robotsNextAllowedAt = new Map<string, number>();

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRobotsTxt(content: string): RobotsPolicy {
  type RobotsGroup = RobotsPolicy & {
    agents: string[];
    hasRules: boolean;
  };

  const groups: RobotsGroup[] = [];
  let current: RobotsGroup = {
    agents: [],
    allowPrefixes: [],
    disallowPrefixes: [],
    crawlDelayMs: undefined,
    hasRules: false,
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const directive = line.slice(0, colonIndex).trim().toLowerCase();
    const value = line.slice(colonIndex + 1).trim();

    if (directive === "user-agent") {
      if (current.agents.length > 0 && current.hasRules) {
        groups.push(current);
        current = {
          agents: [],
          allowPrefixes: [],
          disallowPrefixes: [],
          crawlDelayMs: undefined,
          hasRules: false,
        };
      }
      current.agents.push(value.toLowerCase());
      continue;
    }

    if (current.agents.length === 0) continue;

    if (directive === "allow") {
      current.allowPrefixes.push(value);
      current.hasRules = true;
      continue;
    }

    if (directive === "disallow") {
      current.disallowPrefixes.push(value);
      current.hasRules = true;
      continue;
    }

    if (directive === "crawl-delay") {
      const delaySeconds = Number(value);
      if (Number.isFinite(delaySeconds) && delaySeconds >= 0) {
        current.crawlDelayMs = delaySeconds * 1000;
      }
      current.hasRules = true;
    }
  }

  if (current.agents.length > 0) {
    groups.push(current);
  }

  const matchingGroups = groups.filter((group) => group.agents.includes(ROBOTS_AGENT_NAME));
  const fallbackGroups = groups.filter((group) => group.agents.includes("*"));
  const selectedGroups = matchingGroups.length > 0 ? matchingGroups : fallbackGroups;

  if (selectedGroups.length === 0) {
    return { allowPrefixes: [], disallowPrefixes: [] };
  }

  const crawlDelayCandidates = selectedGroups
    .map((group) => group.crawlDelayMs)
    .filter((delay): delay is number => typeof delay === "number");

  return {
    allowPrefixes: selectedGroups.flatMap((group) => group.allowPrefixes).filter(Boolean),
    disallowPrefixes: selectedGroups.flatMap((group) => group.disallowPrefixes).filter(Boolean),
    crawlDelayMs: crawlDelayCandidates.length > 0 ? Math.max(...crawlDelayCandidates) : undefined,
  };
}

function longestMatchingPrefix(pathname: string, prefixes: string[]): number {
  let longest = -1;
  for (const prefix of prefixes) {
    if (!prefix) continue;
    if (pathname.startsWith(prefix) && prefix.length > longest) {
      longest = prefix.length;
    }
  }
  return longest;
}

function isPathBlockedByRobots(pathname: string, policy: RobotsPolicy): boolean {
  const normalizedPath = pathname || "/";
  const longestDisallow = longestMatchingPrefix(normalizedPath, policy.disallowPrefixes);
  const longestAllow = longestMatchingPrefix(normalizedPath, policy.allowPrefixes);
  return longestDisallow > longestAllow && longestDisallow >= 0;
}

async function getRobotsPolicy(parsed: URL): Promise<RobotsPolicy> {
  const cacheKey = parsed.hostname.toLowerCase();
  const cached = robotsPolicyCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.policy;
  }

  const robotsUrl = new URL("/robots.txt", parsed.origin).toString();

  try {
    const response = await fetchWithRetry(robotsUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/plain,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      const emptyPolicy: RobotsPolicy = { allowPrefixes: [], disallowPrefixes: [] };
      robotsPolicyCache.set(cacheKey, { policy: emptyPolicy, expiresAt: now + ROBOTS_CACHE_TTL_MS });
      return emptyPolicy;
    }

    const content = await response.text();
    const policy = parseRobotsTxt(content);
    robotsPolicyCache.set(cacheKey, { policy, expiresAt: now + ROBOTS_CACHE_TTL_MS });
    return policy;
  } catch {
    const emptyPolicy: RobotsPolicy = { allowPrefixes: [], disallowPrefixes: [] };
    robotsPolicyCache.set(cacheKey, { policy: emptyPolicy, expiresAt: now + ROBOTS_CACHE_TTL_MS });
    return emptyPolicy;
  }
}

async function enforceRobotsPolicy(parsed: URL): Promise<void> {
  const policy = await getRobotsPolicy(parsed);

  if (isPathBlockedByRobots(parsed.pathname, policy)) {
    throw new Error(`robots.txt disallows ${parsed.pathname || "/"} for ${parsed.hostname}`);
  }

  if (!policy.crawlDelayMs || policy.crawlDelayMs <= 0) {
    return;
  }

  const nextAllowedAt = robotsNextAllowedAt.get(parsed.hostname) ?? 0;
  const waitMs = nextAllowedAt - Date.now();

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  robotsNextAllowedAt.set(parsed.hostname, Date.now() + policy.crawlDelayMs);
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

  await enforceRobotsPolicy(parsed);
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

  await enforceRobotsPolicy(parsed);
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
