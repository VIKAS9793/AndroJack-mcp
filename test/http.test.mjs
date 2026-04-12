import test from 'node:test';
import assert from 'node:assert';
import { assertAllowedDomain } from '../build/http.js';

test('http - assertAllowedDomain validation', () => {
  // Valid Official Domains
  assert.ok(assertAllowedDomain('https://developer.android.com/reference/kotlin/LiveData'));
  assert.ok(assertAllowedDomain('https://kotlinlang.org/api/latest/jvm/stdlib/'));
  assert.ok(assertAllowedDomain('https://source.android.com/setup/start'));
  
  // Subdomains
  assert.ok(assertAllowedDomain('https://android.developer.android.com/')); 
  
  // Non-Official Redirection/Forbidden Domains
  assert.throws(() => assertAllowedDomain('https://stackoverflow.com/questions/123'), /not in AndroJack's authoritative sources allowlist/);
  assert.throws(() => assertAllowedDomain('http://developer.android.com/'), /only fetches over HTTPS/);
  assert.throws(() => assertAllowedDomain('https://evil.android.com.malicious.io'), /not in AndroJack's authoritative sources allowlist/);
  
  // Malformed
  assert.throws(() => assertAllowedDomain('not-a-url'), /Invalid URL/);
});
