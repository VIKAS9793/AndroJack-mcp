# AndroJack MCP — Mobile Performance Fix Spec
# Target: Mobile 78 → 95+

**Current scores:**
- Mobile:  Performance 78 | Accessibility 100 | Best Practices 100 | SEO 100
- Desktop: Performance 95 | Accessibility 100 | Best Practices 100 | SEO 100

**Root causes (confirmed from HTML audit):**
| # | Cause | CWV Impact | Est. Points |
|---|-------|-----------|-------------|
| 1 | `killer_argument.png` — large PNG, no explicit dimensions, no lazy load | LCP + CLS | ~8 pts |
| 2 | Live npm/VSCode API fetches — no skeleton placeholder | CLS | ~4 pts |
| 3 | No `preconnect` for external API domains | LCP (resource load delay) | ~3 pts |
| 4 | No responsive `srcset` — mobile downloads full desktop PNG | LCP (load duration) | ~3 pts |

**Fixes are additive only. Zero changes to page logic or routing.**

---

## ⚠️ AGENT GUARDRAILS

```
RULE 1  Do not add loading="lazy" to ANY above-the-fold image.
        The LCP element must be eager + fetchpriority="high".

RULE 2  Do not add loading="eager" to killer_argument.png.
        It is below the fold. It MUST be lazy-loaded.

RULE 3  Skeleton placeholders must have fixed min-height.
        Never use height: auto or no height on a CLS-prone container.

RULE 4  preconnect links go in <head>, before any stylesheet.
        Order matters for early connection setup.

RULE 5  Do not install new packages without explicit authorisation
        in the relevant fix section.

RULE 6  After each fix, verify the change does not break
        the existing layout visually (npm run dev + visual check).

RULE 7  WebP conversion is a build-time step.
        Never ship the original PNG alongside a WebP without
        a <picture> fallback for older browsers.
```

---

## Fix 1 — Image: killer_argument.png (HIGHEST IMPACT)

**File to edit:** The component that renders this img tag.
**Find:** `<img src="..." alt="AndroJack MCP Grounding Demonstration" />`
(or however it appears in JSX — search for `killer_argument`)

### Step 1a — Add lazy load + explicit dimensions

```jsx
// BEFORE (likely current state):
<img
  src="/assets/killer_argument.png"
  alt="AndroJack MCP Grounding Demonstration"
/>

// AFTER — lazy load + dimensions + CLS prevention:
<img
  src="/assets/killer_argument.webp"
  alt="AndroJack MCP Grounding Demonstration"
  width="1200"
  height="675"
  loading="lazy"
  decoding="async"
  style={{ width: '100%', height: 'auto' }}
/>
```

> **AGENT:** You must determine the actual pixel dimensions of
> `killer_argument.png` before setting width/height.
> Run: `identify public/assets/killer_argument.png`
> or use Node: `import sharp from 'sharp'; sharp('...').metadata()`
> Set width and height to the actual source image dimensions.
> Do NOT guess or hardcode 1200×675 if dimensions differ.

### Step 1b — Convert PNG to WebP (build-time)

**Authorised package for this fix only:** `sharp` (dev dependency)

```bash
npm install --save-dev sharp
```

Create the conversion script at `/scripts/convert-images.mjs`:

```js
// scripts/convert-images.mjs
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import path from 'path';

const ASSETS_DIR = './public/assets';

const pngs = (await readdir(ASSETS_DIR))
  .filter(f => f.endsWith('.png'));

for (const file of pngs) {
  const input  = path.join(ASSETS_DIR, file);
  const output = path.join(ASSETS_DIR, file.replace('.png', '.webp'));
  await sharp(input)
    .webp({ quality: 82 })
    .toFile(output);
  console.log(`✓ ${file} → ${file.replace('.png', '.webp')}`);
}
```

Add to `package.json` scripts:
```json
"convert:images": "node scripts/convert-images.mjs"
```

Run once:
```bash
npm run convert:images
```

### Step 1c — Use `<picture>` for WebP with PNG fallback

```jsx
// Replace the <img> from Step 1a with this <picture> block:
<picture>
  <source
    srcSet="/assets/killer_argument.webp"
    type="image/webp"
  />
  <img
    src="/assets/killer_argument.png"
    alt="AndroJack MCP Grounding Demonstration"
    width={1200}   /* replace with actual width */
    height={675}   /* replace with actual height */
    loading="lazy"
    decoding="async"
    style={{ width: '100%', height: 'auto' }}
  />
</picture>
```

### Step 1d — Add responsive srcset for mobile

```jsx
// Full responsive version (preferred):
<picture>
  <source
    type="image/webp"
    srcSet="
      /assets/killer_argument-480w.webp  480w,
      /assets/killer_argument-800w.webp  800w,
      /assets/killer_argument.webp       1200w
    "
    sizes="(max-width: 600px) 480px, (max-width: 900px) 800px, 1200px"
  />
  <img
    src="/assets/killer_argument.png"
    alt="AndroJack MCP Grounding Demonstration"
    width={1200}
    height={675}
    loading="lazy"
    decoding="async"
    style={{ width: '100%', height: 'auto' }}
  />
</picture>
```

Generate the resized variants in `scripts/convert-images.mjs`:

```js
// Add after the existing loop:
const widths = [480, 800];
for (const w of widths) {
  await sharp('./public/assets/killer_argument.png')
    .resize(w)
    .webp({ quality: 82 })
    .toFile(`./public/assets/killer_argument-${w}w.webp`);
  console.log(`✓ killer_argument-${w}w.webp`);
}
```

**Validation:**
```bash
# All 3 WebP variants must exist:
ls -lh public/assets/killer_argument*.webp
# WebP must be smaller than original PNG:
ls -lh public/assets/killer_argument.png
```

---

## Fix 2 — CLS: Metrics Section Skeleton Placeholder

**File:** The component that renders the npm/VSCode download metrics.
**Search for:** The section containing "npm Registry" / "VS Code Marketplace" / live API fetch calls.

### Step 2a — Add fixed-height skeleton while data loads

Wrap metric value displays in a loading guard:

```jsx
// Assuming the component uses useState for the fetched values:
// BEFORE (typical pattern causing CLS):
<div className="metric-value">
  {npmDownloads}
</div>

// AFTER — skeleton with fixed dimensions prevents layout shift:
<div
  className="metric-value"
  style={{ minHeight: '2.5rem' }}   /* CRITICAL: prevents CLS */
>
  {npmDownloads !== null ? (
    <span>{npmDownloads.toLocaleString()}</span>
  ) : (
    <span
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: '80px',
        height: '2rem',
        borderRadius: '4px',
        background: 'linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  )}
</div>
```

Add the shimmer keyframe to your global CSS (or inline in the component):

```css
/* Add to your global stylesheet or a <style> block: */
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

> **AGENT GUARDRAIL:** Every container whose content is fetched
> asynchronously MUST have an explicit `minHeight` set to the
> approximate rendered height of the content it will display.
> Do not use `height: 0` or no height as the pre-load state.

### Step 2b — Apply skeleton to ALL async metric containers

Apply the same pattern to:
- npm weekly download count
- npm version badge
- VS Code total install count
- VS Code version badge

Each one needs:
1. A `minHeight` on its wrapper
2. A shimmer placeholder when value is `null`/`undefined`/loading

---

## Fix 3 — Preconnect for External API Domains

**File:** `index.html`
**Action:** Add the following `<link>` tags inside `<head>`,
**before** any `<link rel="stylesheet">` tag.

```html
<!-- ══ Preconnect: external APIs used by live metrics ════════ -->
<!-- npm Registry API -->
<link rel="preconnect" href="https://registry.npmjs.org" />
<link rel="dns-prefetch" href="https://registry.npmjs.org" />

<!-- npm Downloads API -->
<link rel="preconnect" href="https://api.npmjs.org" />
<link rel="dns-prefetch" href="https://api.npmjs.org" />

<!-- VS Code Marketplace API -->
<link rel="preconnect" href="https://marketplace.visualstudio.com" />
<link rel="dns-prefetch" href="https://marketplace.visualstudio.com" />

<!-- GitHub (if used) -->
<link rel="preconnect" href="https://api.github.com" />
<link rel="dns-prefetch" href="https://api.github.com" />
```

> **AGENT GUARDRAIL:** `dns-prefetch` is a fallback for browsers
> that don't support `preconnect`. Always add both.
> Confirm the actual API domains used by checking the fetch()
> calls in the metrics component. Add a preconnect ONLY for
> domains that are actually fetched — do not add extras.

---

## Fix 4 — LCP Element: Hero Image or Heading

The LCP element on mobile is either:
- The hero heading "The Jack of All Android Trades" (if no image above fold), OR
- The first visible image in the viewport

**Step 4a — Identify the actual LCP element**

```bash
# Run Lighthouse CLI to get the exact LCP element:
npx lighthouse https://androjack-web.netlify.app \
  --only-categories=performance \
  --form-factor=mobile \
  --output=json \
  --quiet \
  | node -e "
    const d = require('fs').readFileSync('/dev/stdin','utf8');
    const r = JSON.parse(d);
    const lcp = r.audits['largest-contentful-paint-element'];
    console.log(JSON.stringify(lcp?.details?.items, null, 2));
  "
```

**Step 4b — If LCP is an image (hero image or logo)**

Add `fetchpriority="high"` and ensure `loading="eager"` (default):

```jsx
// For the LCP image — never lazy, always fetchpriority high:
<img
  src="/assets/your-lcp-image.webp"
  alt="..."
  fetchPriority="high"   // Note: React uses camelCase fetchPriority
  loading="eager"
  decoding="sync"
  width={...}
  height={...}
/>
```

Also add a preload hint in `index.html` for the LCP image:

```html
<!-- In <head>, as early as possible: -->
<link
  rel="preload"
  as="image"
  href="/assets/your-lcp-image.webp"
  type="image/webp"
/>
```

**Step 4c — If LCP is text (the hero heading)**

The heading is likely font-dependent. Ensure no font render-blocking:

```html
<!-- In index.html <head>: -->
<!-- If using Google Fonts: -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload the specific font weight used in the h1: -->
<link
  rel="preload"
  as="font"
  href="/fonts/your-heading-font.woff2"
  type="font/woff2"
  crossorigin
/>
```

If using system fonts or already-preloaded fonts, skip Step 4c.

---

## Fix 5 — Bundle Size: Code-Split Below-Fold Sections

The metrics section, philosophy section, and contact section are all
below the fold. Lazy-load them to reduce initial JS parse time.

**File:** `src/App.jsx` (or main router file)

```jsx
import { lazy, Suspense } from 'react';

// BEFORE — everything imported eagerly:
// import MetricsSection from './components/MetricsSection';
// import PhilosophySection from './components/PhilosophySection';
// import ContactSection from './components/ContactSection';

// AFTER — lazy load below-fold sections:
const MetricsSection    = lazy(() => import('./components/MetricsSection'));
const PhilosophySection = lazy(() => import('./components/PhilosophySection'));
const ContactSection    = lazy(() => import('./components/ContactSection'));

// Wrap with Suspense using a fixed-height fallback:
<Suspense fallback={<div style={{ minHeight: '400px' }} />}>
  <MetricsSection />
</Suspense>

<Suspense fallback={<div style={{ minHeight: '600px' }} />}>
  <PhilosophySection />
</Suspense>

<Suspense fallback={<div style={{ minHeight: '200px' }} />}>
  <ContactSection />
</Suspense>
```

> **AGENT GUARDRAIL:** The hero section (nav + headline + CTA buttons
> + install paths) must NOT be lazy-loaded. Only components that are
> definitively below the initial viewport fold should be lazily imported.

---

## Fix 6 — Vite Build Optimisation (if framework is Vite)

**File:** `vite.config.js` or `vite.config.ts`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Split vendor chunks to improve caching:
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          // Add other large deps here if present:
          // helmet: ['react-helmet-async'],
        },
      },
    },
    // Enable CSS code splitting:
    cssCodeSplit: true,
    // Minify with esbuild (default) — confirm not disabled:
    minify: 'esbuild',
  },
});
```

> **AGENT GUARDRAIL:** Do not add `manualChunks` for packages that
> are NOT in package.json. Check before adding to the vendor chunk.

---

## Phase 7 — Validation

Run these checks after completing all fixes:

```bash
# 1. WebP variants exist and are smaller than original PNG:
echo "=== Image sizes ===" && \
ls -lh public/assets/killer_argument*.{png,webp} 2>/dev/null

# 2. Build succeeds:
npm run build && echo "BUILD: PASS"

# 3. No <img> with loading="lazy" AND fetchpriority="high" together
#    (contradictory attributes):
grep -r 'fetchpriority\|fetchPriority' src/ | grep -i lazy && \
  echo "WARN: LCP image may be lazy-loaded" || echo "OK: No lazy LCP"

# 4. Skeleton min-height is set:
grep -r 'minHeight' src/ | grep -c 'metric\|download\|install' && \
  echo "Skeleton heights found"

# 5. Preconnect tags present:
grep -c 'preconnect' index.html
# Expected: >= 4

# 6. Lighthouse CLI score (requires Node):
npx lighthouse https://androjack-web.netlify.app \
  --only-categories=performance \
  --form-factor=mobile \
  --output=json --quiet \
  | node -e "
    const d=require('fs').readFileSync('/dev/stdin','utf8');
    const s=JSON.parse(d).categories.performance.score;
    console.log('Mobile Performance:', Math.round(s*100));
  "
# Target: >= 90
```

---

## Expected Score After Fixes

| Fix | CWV metric improved | Est. mobile gain |
|-----|---------------------|-----------------|
| Fix 1 (WebP + lazy + srcset) | LCP ↓, CLS ↓ | +6–8 pts |
| Fix 2 (skeleton placeholders) | CLS ↓ | +3–5 pts |
| Fix 3 (preconnect) | LCP ↓ (resource delay) | +2–3 pts |
| Fix 4 (LCP element hints) | LCP ↓ | +2–3 pts |
| Fix 5 (code splitting) | TBT ↓ | +1–2 pts |
| Fix 6 (Vite chunks) | TBT ↓ | +1 pt |
| **Total** | | **+15–22 pts** |

**Projected mobile score: 90–95+**
Desktop should remain 95–100.

---

## Do-Not-Touch List

```
src/components/HeroSection.*   ← do not lazy-load this
src/components/NavBar.*        ← do not lazy-load this
public/assets/killer_argument.png  ← keep as fallback, do not delete
netlify.toml                   ← already configured, do not re-edit
public/robots.txt              ← already configured
```

---

*End of spec. 6 fixes. Estimated implementation time: 45–90 minutes.*
