# AndroJack MCP - Product Landing Page

This branch (`androjack-web-page`) contains the sources for the AndroJack MCP product landing page. 

It is completely isolated from the main Model Context Protocol server codebase (`main` branch) to optimize for static site hosting platforms like **Netlify** or **GitHub Pages**.

## Stack
- **HTML5:** Semantic structure and Material 3 Expressive shapes.
- **CSS3:** Custom properties, CSS grid/flexbox, bouncy micro-animations, and glassmorphism.
- **JavaScript (Vanilla):** Fetches real-time NPM download metrics (`fetch()`), handles intersection observers array animations, and renders charts via `Chart.js`.

To run this site locally, simply serve the root directory:
```bash
npx serve .
```
