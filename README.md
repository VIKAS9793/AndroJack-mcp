# AndroJack MCP for VS Code 🤖🛡️

[![Version 2.1.0](https://img.shields.io/badge/version-2.1.0-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=VIKAS9793.androjack-vscode)

**The VS Code Marketplace wrapper for the AndroJack MCP server.**

AndroJack MCP is a documentation-grounded Android engineering MCP server. This extension is the VS Code distribution layer for that same server, so AndroJack can be installed through both the npm registry and the VS Code Marketplace without splitting the product identity.

Install the extension in VS Code, or use the npm package directly in other MCP clients. For this release, the wrapper launches `npx -y androjack-mcp@2.1.0` so Marketplace installs resolve to the same MCP build published on npm. The core product remains the same: one AndroJack MCP server, distributed through multiple channels.

## 🌐 Official Website

**[androjack-web.netlify.app](https://androjack-web.netlify.app)** — live traction metrics, full install guide, and product demo.

## 🚀 Why AndroJack?
Stop relying on AI models trained on outdated data. AndroJack grounds your AI assistant in real-time, verified Android documentation and modern Android engineering practices.

- **Zero Config**: No manual `mcp.json` editing. Just install the extension and the tools are available.
- **Android 16 & 17 Ready**: Validates orientation locks, resizability, aspect-ratio limits, and the Android 17 / API 37 behaviour changes.
- **UDF/Compose Strictness**: Enforces stable state, stable keys, and business logic separation.
- **KSP Native**: proactively blocks legacy KAPT patterns.

## 🛠️ Key Features

### 🔍 Component Status Validator
Instantly check if a class or library is stable, deprecated, or removed.
> *Example: "Is AsyncTask safe to use in 2026?"*

### 🧪 API 36 Compliance Checker
Verify your app meets Google Play's target API 36 requirement (in force since August 31, 2026) and the Android 16/17 large-screen rules.

### 🏗️ Architecture Advisor
Get grounded advice on Navigation 3, Material 3 Expressive, and multi-pane List-Detail layouts.

### 🛡️ Android Code Validator
A "Grounding Gate" that reviews AI-generated code against 34 Android-specific rules before you commit — and the same rules run in CI with `npx androjack-mcp validate` (SARIF output for GitHub code scanning).

## 📦 Getting Started
1. Install this extension.
2. Open any Android/Kotlin project.
3. Trigger your favorite AI assistant (GitHub Copilot, Claude Code, etc.).
4. Ask a question! AndroJack will automatically provide the necessary context and tools.

## 💡 Support & Feedback

Have a question, found a bug, or have a feature request?
- **GitHub Issues**: [Report an issue](https://github.com/VIKAS9793/AndroJack-mcp/issues)
- **Email**: `vikassahani17@gmail.com`

---

## 👥 Authorship & Ownership

**AndroJack MCP for VS Code** is the VS Code extension wrapper for the broader AndroJack MCP product.

*   **Vikas Sahani** — [Product Lead](https://www.linkedin.com/in/vikas-sahani-727420358) (`vikassahani17@gmail.com`)
*   **Antigravity AI** — AI Engineering Lead

## 📄 License

[MIT License](https://github.com/VIKAS9793/AndroJack-mcp/blob/main/LICENSE) © 2026 Vikas Sahani

---
<div align="center">

*Built because 35% of Stack Overflow visits in 2025 are developers debugging AI-generated code.*
*AndroJack exists so none of those visits are yours.*

</div>
