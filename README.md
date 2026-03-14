# AndroJack MCP - Product Landing Page

**[→ androjack-web.netlify.app](https://androjack-web.netlify.app)** — live demo, install guides, and traction metrics.

This branch (`androjack-web-page`) contains the sources for the AndroJack MCP product landing page. 

It is completely isolated from the main Model Context Protocol server codebase (`main` branch) to optimize for static site hosting platforms like **Netlify** or **GitHub Pages**.

## Stack
- **HTML5:** Semantic structure and Material 3 Expressive shapes.
- **CSS3:** Custom properties, CSS grid/flexbox, bouncy micro-animations, and glassmorphism.
- **JavaScript (Vanilla):** Fetches raw live npm package and VS Code Marketplace traction data (`fetch()`) and renders compact source-labeled metric cards.

To run this site locally, simply serve the root directory:
```bash
npx serve .
```
