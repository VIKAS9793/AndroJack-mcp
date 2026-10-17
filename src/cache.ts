/**
 * Shared LRU cache for AndroJack HTTP fetches and hosted-mode stats.
 */

export type FetchCacheKind = "html" | "json";

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Approximate in-memory size of a cached value (UTF-16 strings: 2 bytes/char). */
export function estimateBytes(value: unknown): number {
  if (typeof value === "string") return value.length * 2;
  try {
    return (JSON.stringify(value) ?? "").length * 2;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T> & { bytes: number }>();
  private ttlMs: number = 24 * 60 * 60 * 1000; // 24 hours default
  private maxSize: number = 100;
  private maxBytes: number;
  private totalBytes = 0;

  private hits = 0;
  private misses = 0;
  private evictions = 0;

  /**
   * @param maxSize  Maximum number of entries.
   * @param maxBytes Maximum total size. Entries count and bytes are both
   *                 bounded: an entry cap alone let 200 pages of up to 4 MB
   *                 each occupy hundreds of megabytes.
   */
  constructor(maxSize: number = 100, maxBytes: number = 32 * 1024 * 1024) {
    this.maxSize = maxSize;
    this.maxBytes = maxBytes;
  }

  setTtl(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  clear() {
    this.cache.clear();
    this.totalBytes = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  stats() {
    const totalRequests = this.hits + this.misses;
    const hitRatePercent = totalRequests === 0 
      ? "0.00" 
      : ((this.hits / totalRequests) * 100).toFixed(2);

    return {
      size: this.cache.size,
      bytes: this.totalBytes,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatePercent,
    };
  }

  get(key: string): T | undefined {
    if (this.ttlMs === 0) {
      this.misses++;
      return undefined;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // Refresh LRU order by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number = this.ttlMs): void {
    if (this.ttlMs === 0) return;
    if (ttlMs <= 0) return;

    const bytes = estimateBytes(value);
    this.delete(key);
    // A single entry larger than a quarter of the budget is not cached at all.
    if (bytes > this.maxBytes / 4) return;

    while (this.cache.size > 0 && (this.cache.size >= this.maxSize || this.totalBytes + bytes > this.maxBytes)) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.delete(oldest);
      this.evictions++;
    }

    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs, bytes });
    this.totalBytes += bytes;
  }

  private delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalBytes -= entry.bytes;
      this.cache.delete(key);
    }
  }
}

const DOC_SOURCE_TTL_MS = 6 * 60 * 60 * 1000;
const ISSUE_TRACKER_TTL_MS = 60 * 60 * 1000;
const ARTIFACT_METADATA_TTL_MS = 30 * 60 * 1000;

const ARTIFACT_HOSTS = new Set([
  "dl.google.com",
  "plugins.gradle.org",
  "search.maven.org",
]);

const ISSUE_TRACKER_HOSTS = new Set([
  "issuetracker.google.com",
]);

export function getFetchCacheKey(url: string, kind: FetchCacheKind): string {
  return `${kind}:${url}`;
}

export function getFetchCacheTtlMs(hostname: string, kind: FetchCacheKind): number {
  const normalized = hostname.toLowerCase();

  if (ARTIFACT_HOSTS.has(normalized)) {
    return ARTIFACT_METADATA_TTL_MS;
  }

  if (ISSUE_TRACKER_HOSTS.has(normalized)) {
    return ISSUE_TRACKER_TTL_MS;
  }

  return kind === "json" ? ISSUE_TRACKER_TTL_MS : DOC_SOURCE_TTL_MS;
}

export const docCache = new LRUCache(200);
