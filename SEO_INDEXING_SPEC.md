# AndroJack MCP — SEO & AI Indexing Implementation Spec

**Version:** 1.0.0
**Target Site:** `https://androjack-web.netlify.app`
**For AI Coding Agents:** Cursor · Windsurf · Kiro · GitHub Copilot Workspace
**Work Mode:** PRODUCTION
**Last Updated:** 2026-03-14

---

## ⚠️ AGENT GUARDRAILS — READ BEFORE ANY ACTION

```
RULE 1  Never modify any existing page logic, components, or routing.
        This spec is additive only. If a step requires editing an existing
        file, only touch the exact section specified. No refactors.

RULE 2  Never hardcode secrets, API keys, or verification tokens as plain
        strings in committed files. Use environment variables or Netlify
        dashboard configuration for any sensitive values.

RULE 3  Every file you create must be placed at the exact path specified.
        Do not rename, relocate, or merge files unless explicitly stated.

RULE 4  After completing each phase, run the validation command listed.
        Do not proceed to the next phase if a validation fails.

RULE 5  Do not install new npm packages unless the phase explicitly
        authorises it. Prefer native solutions.

RULE 6  robots.txt must follow the exact structure in Phase 2.
        Do not simplify, deduplicate, or reorder User-agent blocks.
        AI training bots and AI retrieval bots are different — treat them so.

RULE 7  All meta tags must be injected inside <head>. Never place them in
        <body>. Never duplicate existing tags — check before inserting.

RULE 8  JSON-LD schema must be valid against schema.org/SoftwareApplication.
        Validate at https://validator.schema.org before committing.

RULE 9  llms.txt must be plain UTF-8 Markdown. No HTML, no front matter,
        no YAML. Keep it under 500 lines total.

RULE 10 Do not submit anything to Google Search Console, Bing Webmaster
        Tools, or any third-party dashboard. Those are manual steps for
        the human operator, documented in Appendix A.
```

---

## Project Context

| Field             | Value                                                    |
|-------------------|----------------------------------------------------------|
| Site Name         | AndroJack MCP                                            |
| Site URL          | `https://androjack-web.netlify.app`                      |
| Hosting           | Netlify                                                  |
| Framework         | React (Vite or CRA — detect from `package.json`)         |
| Public Assets Dir | `/public` (confirm by checking repo root)               |
| npm Package       | `androjack-mcp`                                          |
| VS Code Extension | `vikas9793.androjack-vscode`                             |
| GitHub            | Detect from `package.json > repository` field           |
| Category          | Developer Tool · MCP Server · Android Development        |

> **AGENT:** Before starting Phase 1, read `package.json` to confirm
> the framework, public directory, and existing scripts. Adjust file
> paths below if public dir differs from `/public`.

---

## File Delivery Checklist

The following files must exist when all phases are complete:

```
/public/robots.txt                 ← Phase 2
/public/sitemap.xml                ← Phase 3
/public/llms.txt                   ← Phase 6
/src/seo/meta.jsx  (or .tsx)       ← Phase 4  (React component)
  └─ injected into: src/main.jsx
     or src/App.jsx (whichever renders <head>)
```

Additionally, the following must be modified:

```
index.html                         ← Phase 4  (base meta tags)
```

---

## Phase 1 — Pre-flight Checks

### 1.1 Detect project structure

Run the following and record the output before touching any file:

```bash
# Confirm public directory
ls public/ 2>/dev/null || ls dist/ 2>/dev/null || echo "WARN: no public dir found"

# Confirm framework
cat package.json | grep -E '"react"|"vite"|"next"|"gatsby"'

# Check for pre-existing robots.txt or sitemap
find . -name "robots.txt" -o -name "sitemap.xml" | grep -v node_modules

# Check for existing meta tags in index.html
grep -n "og:title\|description\|canonical" index.html 2>/dev/null || echo "NONE FOUND"
```

### 1.2 Decision rules

| Condition                              | Action                                              |
|----------------------------------------|-----------------------------------------------------|
| `robots.txt` already exists            | Do NOT overwrite. Merge using Phase 2 rules.        |
| `sitemap.xml` already exists           | Do NOT overwrite. Append URLs per Phase 3.          |
| OG tags already exist in `index.html`  | Do NOT duplicate. Only add missing tags.            |
| Framework is Next.js                   | Use `next/head` instead of `react-helmet`.          |
| Framework is Gatsby                    | Use `gatsby-plugin-react-helmet` instead.           |
| Public dir is `/dist` not `/public`    | Adjust all file paths in this spec accordingly.     |

---

## Phase 2 — robots.txt

**File:** `/public/robots.txt`
**Action:** Create (or merge if exists — see 1.2)

```
# ============================================================
# AndroJack MCP — robots.txt
# Updated: 2026-03-14
# Spec version: 1.0.0
# ============================================================

# ── Default: allow all standard crawlers ─────────────────────
User-agent: *
Allow: /
Crawl-delay: 1
Sitemap: https://androjack-web.netlify.app/sitemap.xml

# ── Google ───────────────────────────────────────────────────
User-agent: Googlebot
Allow: /

# Blocks Google from using content for AI model training
# while keeping pages in search index.
User-agent: Google-Extended
Disallow: /

# ── Bing / Microsoft ─────────────────────────────────────────
User-agent: Bingbot
Allow: /

# ── AI Retrieval Agents (allow — surfaces in AI search) ──────
# These bots serve live answers; allowing them increases
# AndroJack's visibility in ChatGPT, Perplexity, Claude, etc.

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: YouBot
Allow: /

# ── AI Training Crawlers (block — prevents dataset scraping) ──
# These bots harvest content for model training only.

User-agent: GPTBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: cohere-ai
Disallow: /

User-agent: FacebookBot
Disallow: /

User-agent: Bytespider
Disallow: /

# ── Sitemap pointer (also declared above under * block) ───────
Sitemap: https://androjack-web.netlify.app/sitemap.xml
```

> **AGENT GUARDRAIL:** The separation between "AI Retrieval Agents"
> and "AI Training Crawlers" is intentional and must be preserved.
> Do not merge these sections. Do not use a single wildcard Disallow.

**Validation:**
```bash
cat public/robots.txt | grep -c "User-agent"
# Expected: >= 12 User-agent blocks
```

---

## Phase 3 — sitemap.xml

**File:** `/public/sitemap.xml`
**Action:** Create (or merge if exists — see 1.2)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Primary landing page -->
  <url>
    <loc>https://androjack-web.netlify.app/</loc>
    <lastmod>2026-03-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!--
    AGENT: For every additional page/route in the React app,
    add a <url> block below following the same structure.
    Detect routes from src/App.jsx or src/router.jsx.
    Do NOT add URLs for 404, redirect, or private auth pages.
    Example additional pages:
  -->

  <!-- <url>
    <loc>https://androjack-web.netlify.app/docs</loc>
    <lastmod>2026-03-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url> -->

</urlset>
```

> **AGENT GUARDRAIL:** `<priority>1.0</priority>` is reserved for
> the homepage only. All other pages must use values ≤ 0.8.
> Do not set `changefreq` to `always` or `hourly` for a static site.

**Validation:**
```bash
# Must be valid XML
xmllint --noout public/sitemap.xml 2>&1 || echo "INVALID XML"
# Expected: no output (silent = valid)
```

---

## Phase 4 — Meta Tags & Structured Data

### 4.1 Base tags in `index.html`

**File:** `index.html` (root or `/public/index.html`)
**Action:** Inject the following inside `<head>`. Skip any tag that already exists.

```html
<!-- ══ Primary SEO ══════════════════════════════════════════ -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AndroJack MCP — Documentation-Grounded Android Dev Verification</title>
<meta name="description"
      content="AndroJack MCP is a 21-tool Model Context Protocol server
               that grounds AI-assisted Android development in official
               documentation, reducing hallucinations and build errors." />
<meta name="keywords"
      content="Android development, MCP server, AI coding tools,
               documentation verification, Kotlin, Jetpack Compose,
               Claude, VS Code extension" />
<link rel="canonical" href="https://androjack-web.netlify.app/" />

<!-- ══ Open Graph (LinkedIn, Discord, Reddit previews) ══════ -->
<meta property="og:type"        content="website" />
<meta property="og:url"         content="https://androjack-web.netlify.app/" />
<meta property="og:title"       content="AndroJack MCP — AI Android Dev Verification" />
<meta property="og:description" content="21-tool MCP server grounding AI-assisted
                                          Android development in official docs." />
<meta property="og:image"       content="https://androjack-web.netlify.app/og-image.png" />
<meta property="og:image:width"  content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:site_name"   content="AndroJack MCP" />

<!-- ══ Twitter / X Card ════════════════════════════════════ -->
<meta name="twitter:card"        content="summary_large_image" />
<meta name="twitter:title"       content="AndroJack MCP — AI Android Dev Verification" />
<meta name="twitter:description" content="21-tool MCP server grounding AI-assisted
                                           Android development in official docs." />
<meta name="twitter:image"       content="https://androjack-web.netlify.app/og-image.png" />

<!-- ══ Schema.org JSON-LD (AI + Rich Results) ══════════════ -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AndroJack MCP",
  "alternateName": "androjack-mcp",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Windows, macOS, Linux",
  "description": "A 21-tool Model Context Protocol (MCP) server that provides documentation-grounded verification for AI-assisted Android development, preventing hallucinations and reducing build errors.",
  "url": "https://androjack-web.netlify.app",
  "downloadUrl": "https://www.npmjs.com/package/androjack-mcp",
  "softwareVersion": "1.6.0",
  "author": {
    "@type": "Person",
    "name": "Vikas"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "keywords": [
    "MCP server",
    "Android development",
    "AI coding tools",
    "documentation verification",
    "Jetpack Compose",
    "Kotlin"
  ]
}
</script>
```

> **AGENT GUARDRAIL:** The `og:image` at
> `https://androjack-web.netlify.app/og-image.png` must exist.
> If no OG image is present in `/public`, create a placeholder
> file named `og-image.png` and log a TODO comment:
> `<!-- TODO: Replace og-image.png with actual 1200×630 brand image -->`
>
> **AGENT GUARDRAIL:** Validate JSON-LD at
> `https://validator.schema.org` before committing.
> The `@type: SoftwareApplication` must pass with zero errors.

### 4.2 Dynamic meta for React (if site has multiple routes)

**File:** `/src/seo/MetaTags.jsx` (create this file)

```jsx
// src/seo/MetaTags.jsx
// ─────────────────────────────────────────────────────────────
// AGENT: Use react-helmet-async (preferred) or react-helmet.
// Only install react-helmet-async if it is NOT already in
// package.json. Do not install both.
// ─────────────────────────────────────────────────────────────

import { Helmet } from 'react-helmet-async';

const SITE_NAME    = 'AndroJack MCP';
const SITE_URL     = 'https://androjack-web.netlify.app';
const DEFAULT_IMG  = `${SITE_URL}/og-image.png`;

/**
 * @param {Object} props
 * @param {string} props.title       - Page title (without site name suffix)
 * @param {string} props.description - Page meta description (≤160 chars)
 * @param {string} [props.canonical] - Canonical URL (defaults to SITE_URL)
 * @param {string} [props.image]     - OG image URL (defaults to DEFAULT_IMG)
 */
export default function MetaTags({
  title,
  description,
  canonical = SITE_URL,
  image = DEFAULT_IMG,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description"        content={description} />
      <link rel="canonical"           href={canonical} />
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url"         content={canonical} />
      <meta property="og:image"       content={image} />
      <meta name="twitter:title"      content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"      content={image} />
    </Helmet>
  );
}
```

**Usage — inject in root `App.jsx` or per-page:**

```jsx
// In App.jsx (default / homepage):
import MetaTags from './seo/MetaTags';

<MetaTags
  title="Documentation-Grounded Android Dev Verification"
  description="21-tool MCP server grounding AI-assisted Android
               development in official docs. Reduce hallucinations,
               prevent build errors."
/>
```

> **AGENT GUARDRAIL:** Wrap the React app root with `<HelmetProvider>`
> from `react-helmet-async`. Without this, Helmet silently does nothing.
> Check if `<HelmetProvider>` already wraps the app before adding it.

---

## Phase 5 — Netlify Configuration

**File:** `netlify.toml` (root, create if missing — merge if exists)

```toml
# ══════════════════════════════════════════════════════════════
# AndroJack MCP — netlify.toml
# SEO & headers configuration
# ══════════════════════════════════════════════════════════════

[build]
  # AGENT: Confirm 'dist' or 'build' from package.json build script
  publish = "dist"
  command = "npm run build"

# ── Security + SEO headers ────────────────────────────────────
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options             = "SAMEORIGIN"
    X-Content-Type-Options      = "nosniff"
    Referrer-Policy             = "strict-origin-when-cross-origin"
    Permissions-Policy          = "camera=(), microphone=(), geolocation=()"

# ── Serve robots.txt with correct content type ───────────────
[[headers]]
  for = "/robots.txt"
  [headers.values]
    Content-Type  = "text/plain; charset=utf-8"
    Cache-Control = "public, max-age=86400"

# ── Serve sitemap.xml with correct content type ──────────────
[[headers]]
  for = "/sitemap.xml"
  [headers.values]
    Content-Type  = "application/xml; charset=utf-8"
    Cache-Control = "public, max-age=86400"

# ── Serve llms.txt with correct content type ─────────────────
[[headers]]
  for = "/llms.txt"
  [headers.values]
    Content-Type  = "text/plain; charset=utf-8"
    Cache-Control = "public, max-age=86400"

# ── SPA fallback (required for React Router) ─────────────────
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

> **AGENT GUARDRAIL:** If `netlify.toml` already exists with a
> `[[redirects]]` block for `/*`, do NOT add a second one.
> Merge the `[[headers]]` blocks only.
> If `publish` is already set to a different directory, do NOT change it.

---

## Phase 6 — llms.txt (AI Inference Discoverability)

**File:** `/public/llms.txt`
**Purpose:** Provides structured, LLM-readable context about AndroJack
at inference time — when a user asks an AI assistant about the product.

```markdown
# AndroJack MCP

> AndroJack MCP is a 21-tool Model Context Protocol (MCP) server
> that provides documentation-grounded verification for AI-assisted
> Android development. It prevents AI hallucinations by grounding
> responses in official Android, Jetpack, Kotlin, and Firebase docs.

## What it does

- Verifies AI-generated Android code against official documentation
- Supports 21 specialised tools across Kotlin, Jetpack Compose,
  Material Design 3, Room, Hilt, Coroutines, Flow, and Firebase
- Distributed as an npm package and VS Code extension
- Integrates with Claude (via MCP), Cursor, Windsurf, and Kiro

## Who it's for

Android developers using AI coding assistants who want reliable,
documentation-backed code suggestions — not hallucinated APIs.

## Key Links

- [Website](https://androjack-web.netlify.app)
- [npm Package](https://www.npmjs.com/package/androjack-mcp)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=vikas9793.androjack-vscode)
- [GitHub Repository](https://github.com/vikas9793/androjack-mcp)

## Installation

### npm (MCP server)
\`\`\`
npm install -g androjack-mcp
\`\`\`

### VS Code Extension
Search `AndroJack MCP` in the VS Code Extensions panel,
or install via: `ext install vikas9793.androjack-vscode`

## Supported Tool Categories

1. Kotlin language verification
2. Jetpack Compose UI verification
3. Material Design 3 component verification
4. Android Lifecycle & ViewModel verification
5. Room database schema verification
6. Hilt dependency injection verification
7. Coroutines & Flow verification
8. Firebase integration verification
9. Navigation Component verification

## Contact / Author

Built by Vikas — APM, AI product builder, open-source developer.

## Optional: llms-full.txt

A comprehensive version with full tool documentation is available at:
https://androjack-web.netlify.app/llms-full.txt
```

> **AGENT GUARDRAIL:** `llms.txt` must be plain UTF-8 Markdown only.
> No HTML tags, no YAML front matter, no JSON.
> Total file size must not exceed 50KB.
> The `## Key Links` section must contain valid, working URLs.
> Verify all 4 links resolve with a 200 status before committing.

---

## Phase 7 — Final Validation

Run all checks before marking implementation complete:

```bash
# ── 1. Confirm all required files exist ──────────────────────
echo "=== Required Files ===" && \
ls -la public/robots.txt public/sitemap.xml public/llms.txt && \
ls -la src/seo/MetaTags.jsx 2>/dev/null || \
ls -la src/seo/MetaTags.tsx 2>/dev/null

# ── 2. Validate sitemap XML ───────────────────────────────────
xmllint --noout public/sitemap.xml && echo "sitemap.xml: VALID"

# ── 3. robots.txt has correct bot count ──────────────────────
echo "User-agent count: $(grep -c 'User-agent' public/robots.txt)"
# Expected: >= 12

# ── 4. index.html has all critical tags ──────────────────────
echo "=== Meta tag audit ===" && \
grep -c "og:title"       index.html && \
grep -c "og:description" index.html && \
grep -c "og:image"       index.html && \
grep -c "canonical"      index.html && \
grep -c "application/ld+json" index.html
# Expected: all return 1

# ── 5. netlify.toml has headers ──────────────────────────────
grep -c "\[\[headers\]\]" netlify.toml
# Expected: >= 4

# ── 6. No duplicate meta tags ────────────────────────────────
echo "og:title count (must be 1):" && grep -c "og:title" index.html
echo "description count (must be 1):" && grep -c 'name="description"' index.html

# ── 7. Build succeeds ────────────────────────────────────────
npm run build
# Expected: exit code 0, no errors
```

---

## Appendix A — Manual Steps for Human Operator

> ⚠️ The following cannot be automated. Complete these manually
> after deploying the implementation above.

### A.1 Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → **URL prefix** → `https://androjack-web.netlify.app`
3. Choose verification method: **HTML tag** → copy the `<meta name="google-site-verification" ...>` tag
4. Add it to `index.html` inside `<head>` (it is safe to commit this tag)
5. Click **Verify** in GSC
6. Navigate to **URL Inspection** → paste `https://androjack-web.netlify.app/` → **Request Indexing**
7. Navigate to **Sitemaps** → submit `https://androjack-web.netlify.app/sitemap.xml`

### A.2 Bing Webmaster Tools

1. Go to [bing.com/webmasters](https://www.bing.com/webmasters)
2. Add your site → `https://androjack-web.netlify.app`
3. Import from Google Search Console (fastest) — or verify manually via HTML meta tag
4. Submit sitemap: `https://androjack-web.netlify.app/sitemap.xml`

### A.3 Backlinks (do once, high ROI)

Update these 3 external properties to link to the site:

| Property              | Location          | Link to add                                |
|-----------------------|-------------------|--------------------------------------------|
| GitHub README         | Top of README.md  | `https://androjack-web.netlify.app`        |
| npm package           | `package.json > homepage` field  | `https://androjack-web.netlify.app` |
| VS Code Marketplace   | Extension description/README | `https://androjack-web.netlify.app` |

### A.4 OG Image

Create a 1200×630 PNG brand image for Open Graph previews.
Save it as `/public/og-image.png`.
Tools: Canva, Figma, or Midjourney.
Content: product name, tagline, logo/icon.

### A.5 JSON-LD Validation

1. Go to [validator.schema.org](https://validator.schema.org)
2. Paste the full content of `index.html`
3. Confirm `SoftwareApplication` type validates with **0 errors**

---

## Appendix B — Do-Not-Touch List

The following files and directories must not be modified by this spec:

```
src/components/**
src/pages/**
src/hooks/**
src/store/**
src/api/**
package-lock.json
.env
.env.local
.env.production
```

---

## Appendix C — Versioning This Spec

When re-running this spec after major site changes:

1. Increment the version at the top of this file
2. Update `<lastmod>` in `sitemap.xml` to today's date
3. Re-run Phase 7 validation checks in full
4. Re-submit sitemap in Google Search Console (Appendix A.1, step 7)

---

*End of spec. Total phases: 7. Total manual steps: 5 (Appendix A).*
