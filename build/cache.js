/**
 * Simple LRU cache implementation for AndroJack MCP.
 */
export class LRUCache {
    cache = new Map();
    ttlMs = 24 * 60 * 60 * 1000; // 24 hours default
    maxSize = 100;
    // Stats
    hits = 0;
    misses = 0;
    evictions = 0;
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }
    setTtl(ttlMs) {
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
    get(key) {
        if (this.ttlMs === 0) {
            this.misses++;
            return undefined;
        }
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses++;
            return undefined;
        }
        if (Date.now() - entry.timestamp > this.ttlMs) {
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
    set(key, value) {
        if (this.ttlMs === 0)
            return;
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        else if (this.cache.size >= this.maxSize) {
            // Evict oldest (first item in Map)
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
                this.evictions++;
            }
        }
        this.cache.set(key, { value, timestamp: Date.now() });
    }
}
export const docCache = new LRUCache(200);
