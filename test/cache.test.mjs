import test from 'node:test';
import assert from 'node:assert';
import { LRUCache } from '../build/cache.js';

test('LRUCache - basic set/get', () => {
  const cache = new LRUCache(10);
  cache.set('k1', 'v1');
  assert.strictEqual(cache.get('k1'), 'v1');
});

test('LRUCache - eviction at maxSize', () => {
  const cache = new LRUCache(2);
  cache.set('k1', 'v1');
  cache.set('k2', 'v2');
  cache.set('k3', 'v3'); // Should evict k1
  
  assert.strictEqual(cache.get('k1'), undefined);
  assert.strictEqual(cache.get('k2'), 'v2');
  assert.strictEqual(cache.get('k3'), 'v3');
  assert.strictEqual(cache.stats().evictions, 1);
});

test('LRUCache - logic: refreshing LRU order', () => {
  const cache = new LRUCache(2);
  cache.set('k1', 'v1');
  cache.set('k2', 'v2');
  
  // Access k1 to make it "newest"
  cache.get('k1');
  
  // Set k3, should evict k2 (oldest)
  cache.set('k3', 'v3');
  
  assert.strictEqual(cache.get('k2'), undefined);
  assert.strictEqual(cache.get('k1'), 'v1');
  assert.strictEqual(cache.get('k3'), 'v3');
});

test('LRUCache - expiry', async () => {
  const cache = new LRUCache(10);
  cache.set('short', 'val', 10); // 10ms TTL
  
  assert.strictEqual(cache.get('short'), 'val');
  
  await new Promise(r => setTimeout(r, 20));
  
  assert.strictEqual(cache.get('short'), undefined);
});

test('LRUCache - hit/miss metrics', () => {
  const cache = new LRUCache(10);
  cache.set('k1', 'v1');
  
  cache.get('k1'); // hit
  cache.get('k2'); // miss
  cache.get('k2'); // miss
  
  const stats = cache.stats();
  assert.strictEqual(stats.hits, 1);
  assert.strictEqual(stats.misses, 2);
  assert.strictEqual(stats.hitRatePercent, '33.33');
});
