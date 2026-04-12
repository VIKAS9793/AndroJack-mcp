import test from 'node:test';
import assert from 'node:assert';
import { extractPageText } from '../build/http.js';

test('extractPageText - cleans boilerplate', () => {
  const html = `
    <html>
      <head><title>Test</title></head>
      <body>
        <nav>Should be removed</nav>
        <header>Should be removed</header>
        <main>
          <h1>Real Content</h1>
          <p>This is the actual text we want.</p>
        </main>
        <footer>Should be removed</footer>
        <script>console.log("no");</script>
        <style>.css { color: red; }</style>
      </body>
    </html>
  `;
  
  const text = extractPageText(html);
  assert.ok(text.includes('Real Content'));
  assert.ok(text.includes('This is the actual text we want.'));
  assert.ok(!text.includes('Should be removed'));
  assert.ok(!text.includes('console.log'));
  assert.ok(!text.includes('.css'));
});

test('extractPageText - handles specific selectors', () => {
  const html = `
    <div class="devsite-article">
      <div id="main-content">
        <article>
          <p>Nested target</p>
        </article>
      </div>
    </div>
  `;
  const text = extractPageText(html);
  assert.strictEqual(text, 'Nested target');
});

test('extractPageText - falls back to body', () => {
  const html = `<body>Just some text</body>`;
  const text = extractPageText(html);
  assert.strictEqual(text, 'Just some text');
});

test('extractPageText - truncates long output', () => {
  const longText = 'A'.repeat(4000);
  const html = `<body>${longText}</body>`;
  const text = extractPageText(html, 100);
  assert.strictEqual(text.length, 101); // 100 + ellipsis
  assert.ok(text.endsWith('…'));
});

test('extractPageText - handles Empty/Minimal HTML', () => {
  assert.strictEqual(extractPageText(''), '');
  assert.strictEqual(extractPageText('<html></html>'), '');
});
