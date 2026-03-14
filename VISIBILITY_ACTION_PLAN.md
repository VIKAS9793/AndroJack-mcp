# AndroJack MCP — Visibility Action Plan
# Backlinks · GSC · Bing Webmaster
# Generated: 2026-03-14 | Based on live audit of all three properties

---

## Current State Audit

| Property | Status | Gap |
|----------|--------|-----|
| GitHub README | ✅ Rich content, badges, install buttons | ❌ NO link to `androjack-web.netlify.app` anywhere |
| GitHub About (sidebar) | No website URL set | ❌ Missing — this is a Google-indexed field |
| npm package.json | Unknown — 403 on fetch | ❌ `homepage` field likely missing or not set |
| VS Code Marketplace | 2 installs, description present | ❌ NO link to `androjack-web.netlify.app` |
| GSC | ✅ Verified, sitemap Success, 2 pages | ✅ Only homepage + 1 other page — need URL inspection on all pages |
| Bing Webmaster | Unknown | ❌ Not confirmed registered |

---

## ACTION 1 — GitHub: Add Website to Repo "About" Sidebar

**Where:** GitHub.com → VIKAS9793/AndroJack-mcp → gear icon (⚙️) next to "About"
**Time:** 2 minutes
**SEO impact:** High — GitHub "About" website field is crawled and indexed by Google.
                  This creates a direct indexed backlink from github.com/VIKAS9793/AndroJack-mcp.

### Steps:
1. Go to `https://github.com/VIKAS9793/AndroJack-mcp`
2. Click the ⚙️ gear icon next to **"About"** in the right sidebar
3. In the **"Website"** field, enter:
   ```
   https://androjack-web.netlify.app
   ```
4. Ensure these topics are checked (they already appear to be set):
   ```
   android  kotlin  mcp  jetpack-compose  mcp-server
   android-16  agentic-ai-development  androidengineering
   ```
5. Click **Save changes**

**Result:** Google sees `<a href="https://androjack-web.netlify.app">` on `github.com/VIKAS9793/AndroJack-mcp` — one of the highest-DA domains on the internet (DA 96).

---

## ACTION 2 — GitHub README: Add Homepage Badge + Link

**Where:** `README.md` in repo root
**Time:** 5 minutes
**SEO impact:** Medium — adds a crawlable link from the README body.

### Find this section at the top of README.md (the badge row):

```markdown
[![npm version](https://img.shields.io/npm/v/androjack-mcp...)](https://www.npmjs.com/package/androjack-mcp)
[![GitHub stars](https://img.shields.io/github/stars...)](...)
[![Node.js](...)](https://nodejs.org)
```

### Add ONE new badge immediately after the npm version badge:

```markdown
[![Website](https://img.shields.io/badge/Website-androjack--web.netlify.app-0A7AFF?style=flat-square&logo=netlify&logoColor=white)](https://androjack-web.netlify.app)
```

### Also add a direct text link in the "Quick Start" section.

Find this line in the README:
```markdown
## 🚀 Quick Start — Zero Install Required
```

Add ONE line directly below the heading (before the code block):

```markdown
**[→ androjack-web.netlify.app](https://androjack-web.netlify.app)** — live demo, install guides, and traction metrics.
```

### Full diff (apply these two changes only — touch nothing else):

```diff
 [![npm version](https://img.shields.io/npm/v/androjack-mcp...)](https://www.npmjs.com/package/androjack-mcp)
+[![Website](https://img.shields.io/badge/Website-androjack--web.netlify.app-0A7AFF?style=flat-square&logo=netlify&logoColor=white)](https://androjack-web.netlify.app)
 [![GitHub stars](https://img.shields.io/github/stars...)](...)
```

```diff
 ## 🚀 Quick Start — Zero Install Required
+
+**[→ androjack-web.netlify.app](https://androjack-web.netlify.app)** — live demo, install guides, and traction metrics.
+
 ```
```

> **Do NOT restructure, rewrite, or reorder anything else in the README.**
> The README is already excellent. These are additive links only.

---

## ACTION 3 — npm package.json: Add `homepage` Field

**Where:** `package.json` in repo root
**Time:** 2 minutes
**SEO impact:** Medium — npm renders the `homepage` field as a clickable link
               on the npm registry page, creating a crawlable backlink from npmjs.com (DA 91).

### Open `package.json` and find (or add) the `homepage` field:

```json
{
  "name": "androjack-mcp",
  "version": "1.6.0",
  "homepage": "https://androjack-web.netlify.app",
  "repository": {
    "type": "git",
    "url": "https://github.com/VIKAS9793/AndroJack-mcp"
  }
}
```

> If `homepage` already exists with a different value, replace it.
> If it does not exist, add it after the `"version"` field.
> Then run `npm publish` to push the updated metadata to the registry.

**Result:** The npm package page at `https://www.npmjs.com/package/androjack-mcp`
will show a **"Homepage"** link pointing to your site — indexed by Google
as a backlink from npmjs.com.

---

## ACTION 4 — VS Code Marketplace: Add Website Link to Description

**Where:** The VS Code extension's `README.md` or `package.json` (whichever drives the Marketplace description)
**Time:** 5 minutes
**SEO impact:** Low-medium — Marketplace pages are indexed. Creates backlink from marketplace.visualstudio.com (DA 93).

### Current state (confirmed from live audit):
The Marketplace description does NOT contain a link to `androjack-web.netlify.app`.
It links to GitHub Issues and email only.

### Add this block to the extension's README.md, immediately after the opening description:

```markdown
## 🌐 Official Website

**[androjack-web.netlify.app](https://androjack-web.netlify.app)** — live traction metrics, full install guide, and product demo.
```

### Also update `package.json` of the VS Code extension (if it has one):

```json
{
  "homepage": "https://androjack-web.netlify.app",
  "repository": {
    "type": "git",
    "url": "https://github.com/VIKAS9793/AndroJack-mcp"
  }
}
```

Then re-publish the extension to push the updated Marketplace listing.

---

## ACTION 5 — GSC: Request Indexing for All Pages

**Where:** Google Search Console → https://androjack-web.netlify.app property
**Time:** 10 minutes
**Impact:** Puts all pages in Google's priority crawl queue immediately.

### Current state (confirmed from screenshots):
- Sitemap submitted ✅ Status: Success
- 2 pages discovered (homepage + privacy page likely)
- No URL inspection done yet on individual pages

### Pages to inspect and request indexing for (one by one):

```
1. https://androjack-web.netlify.app/
2. https://androjack-web.netlify.app/privacy
```

Also submit these external pages that link TO AndroJack
(GSC can track them as referring pages):
```
3. https://github.com/VIKAS9793/AndroJack-mcp        ← after Action 1+2
4. https://www.npmjs.com/package/androjack-mcp        ← after Action 3
5. https://marketplace.visualstudio.com/items?itemName=VIKAS9793.androjack-vscode
```

### Steps for each URL:
1. Go to `https://search.google.com/search-console`
2. Select `https://androjack-web.netlify.app` property
3. Paste URL into the top search bar (URL Inspection Tool)
4. Click **"Request Indexing"**
5. Wait for confirmation toast
6. Repeat for next URL

> ⚠️ There is a daily quota for URL inspection requests (~10-12/day).
> Spread across 2 days if needed.

---

## ACTION 6 — Bing Webmaster Tools Setup

**Where:** `https://www.bing.com/webmasters`
**Time:** 15 minutes
**Impact:** Bing powers DuckDuckGo + Yahoo. More critically — ChatGPT's web
           browsing index is Bing. Being in Bing = being citable by ChatGPT.

### Step-by-step:

**1. Go to** `https://www.bing.com/webmasters/about`

**2. Click "Get Started"** → sign in with a Microsoft account

**3. Add your site:**
   - Click **"Add a site"**
   - Enter: `https://androjack-web.netlify.app`
   - Click **Add**

**4. Verify ownership — choose "XML file" method (fastest for Netlify):**
   - Download the provided `BingSiteAuth.xml` file
   - Place it at: `/public/BingSiteAuth.xml` in your repo
   - Deploy to Netlify
   - Click **Verify** in Bing Webmaster Tools

   Alternative (if GSC is already set up): use **"Import from Google Search Console"**
   — this auto-verifies and imports your sitemap in one step.

**5. Submit sitemap:**
   - Left sidebar → **Sitemaps**
   - Click **Submit sitemap**
   - Enter: `https://androjack-web.netlify.app/sitemap.xml`
   - Click **Submit**

**6. Request URL indexing:**
   - Left sidebar → **URL Submission**
   - Submit: `https://androjack-web.netlify.app/`
   - Submit: `https://androjack-web.netlify.app/privacy`

**7. (Optional but high value) IndexNow:**
Bing supports IndexNow — an instant indexing protocol. Add this to `index.html`:
```html
<meta name="indexnow-verification" content="YOUR_BING_KEY" />
```
Get your key from Bing Webmaster Tools → Settings → API Access → IndexNow key.

---

## ACTION 7 — Bonus: Submit to 3 High-Value Developer Directories

These are indexed, high-DA pages that create additional backlinks and
surface AndroJack in developer tool discovery flows.

### 7a. Anthropic MCP Connector Directory
```
URL: https://www.anthropic.com/news/model-context-protocol (or docs.anthropic.com/mcp/connectors)
Action: Submit AndroJack as a community MCP server
Impact: Direct referral traffic from Claude users looking for MCP servers
```

### 7b. MCP.so (Community MCP Registry)
```
URL: https://mcp.so/submit
Action: Add androjack-mcp as a listed server
Category: Developer Tools / Android
Impact: Indexed by Google, linked from many "awesome-mcp" lists
```

### 7c. GitHub MCP Awesome List
```
Search: https://github.com/topics/mcp-server
Find the "awesome-mcp-servers" repository (punkpeye/awesome-mcp-servers or similar)
Action: Open a PR or issue to add AndroJack
Impact: High-DA GitHub page, crawled constantly, referenced in AI search results
```

---

## Priority & Time Estimate

| Action | Time | SEO Impact | Do it |
|--------|------|-----------|-------|
| Action 1 — GitHub About website | 2 min | 🔴 High (DA 96 backlink) | **TODAY** |
| Action 5 — GSC URL inspection | 10 min | 🔴 High (immediate queue) | **TODAY** |
| Action 6 — Bing Webmaster | 15 min | 🔴 High (ChatGPT citations) | **TODAY** |
| Action 3 — npm homepage field | 2 min | 🟡 Medium (DA 91 backlink) | This week |
| Action 2 — GitHub README badge | 5 min | 🟡 Medium (crawlable link) | This week |
| Action 4 — VSCode Marketplace | 5 min | 🟡 Medium (DA 93 backlink) | This week |
| Action 7a — MCP directory | 10 min | 🟢 Medium (targeted traffic) | This week |
| Action 7b/c — awesome lists | 20 min | 🟢 Medium (discovery) | This month |

---

## Expected Outcome

After Actions 1, 5, 6 (today — ~27 minutes total):
- Google has `androjack-web.netlify.app` in priority crawl queue
- Bing indexes the site → ChatGPT can cite it in responses
- GitHub sidebar creates a DA 96 backlink pointing at the site

After Actions 2, 3, 4 (this week):
- Three high-DA registry backlinks (GitHub body, npm, Marketplace)
- All three point to `androjack-web.netlify.app`
- These collectively tell Google the site is legitimate and referenced by authoritative sources

Expected Google indexing of homepage: **24–72 hours from now**
Expected CrUX data collection to start: **after ~1,000 real visits**

---

*End of plan. 7 actions. ~27 minutes for the high-impact three.*
