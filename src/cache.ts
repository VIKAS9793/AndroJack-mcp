/**
 * Shared LRU cache for AndroJack HTTP fetches and hosted-mode stats.
 */

export type FetchCacheKind = "html" | "json";

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number = 24 * 60 * 60 * 1000; // 24 hours default
  private maxSize: number = 100;

  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  setTtl(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  clear() {
    this.cache.clear();
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
      this.cache.delete(key);
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

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
          this.cache.delete(firstKey);
          this.evictions++;
      }
    }

    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const DOC_SOURCE_TTL_MS = 60 * 60 * 1000;
const ISSUE_TRACKER_TTL_MS = 60 * 60 * 1000;
const ARTIFACT_METADATA_TTL_MS = 15 * 60 * 1000;

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
