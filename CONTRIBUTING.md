# Contributing to AndroJack-MCP

First off, thank you for considering contributing to AndroJack-MCP! It's people like you that make AndroJack such a great tool for the Android community.

## 🚀 How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue at [https://github.com/VIKAS9793/androjack-mcp/issues](https://github.com/VIKAS9793/androjack-mcp/issues). Please include:
- A clear, descriptive title.
- Steps to reproduce the issue.
- Expected vs. actual behavior.

### Suggesting Enhancements
Have an idea for a new tool or feature? Open an issue with the "enhancement" label at [https://github.com/VIKAS9793/androjack-mcp/issues](https://github.com/VIKAS9793/androjack-mcp/issues).

### Pull Requests
1. Fork the repo: [https://github.com/VIKAS9793/androjack-mcp](https://github.com/VIKAS9793/androjack-mcp)
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request.

## 🛠️ Validator Rule Contributions
To add or modify a validator rule in `src/rules/android-rules.ts`, you **must**:
1. Add a corresponding test in `test/rules.test.mjs` or `test/validator-engine.test.mjs`.
2. Confirm the rule fires on a minimal positive example (code containing the violation).
3. Confirm the rule **does not** fire on a known-clean file or negative example — including the same API mentioned only in a comment.
4. Use an official `docUrl` you have opened yourself (HTTP 200), and set `minSdkAbove` to the last API level the rule should **not** fire for (e.g. `36` for an API 37 behaviour change).
5. Add the rule to the table in `USE_CASES.md` (UC-03) and update the rule count in `README.md` — `test/release-integrity.test.mjs` fails if the README count drifts.

Without these tests, rule contributions cannot be verified for stability and will be rejected.

## 📚 Content Contributions (tool text, versions, dates)
- Every version number, date, API name, or deadline must come from an official page you checked. If you could not verify it, say so in the text and point the agent at `gradle_dependency_checker` or the official page instead of guessing.
- Never document an API signature you have not seen in the official reference — v2.0.0 shipped an invented Handoff API that 2.1.0 had to remove.
- New documentation pages for `android_official_search` go in `src/docs-index.ts` (verified URL, lower-case keywords).

## 🛠️ Local Development Setup
```bash
npm ci
npm test                    # build + unit, regression, and UAT suites (hermetic, no network)
npm run test:uat:live       # adds a live developer.android.com retrieval check
npx @modelcontextprotocol/inspector node build/index.js
```

## 🚢 Release Process (maintainers)
Order matters — the MCP Registry validates the version against npm.
1. Bump the version everywhere (`package.json`, `src/version.ts`, `manifest.json`, `server.json`, `.mcp/server.json`, `config/*.json`, README pins and base64 badges); `npm test` fails if any are out of sync.
2. `npm publish` **first**, and confirm `npm view androjack-mcp@<version>` resolves.
3. Push `main` with a `release: v<version> — <summary>` commit, then push tag `v<version>` — `publish-mcp-registry.yml` publishes to the MCP Registry.
4. `feature/vscode-extension`: commit `release: vscode-v<version> - <summary>`, tag `vscode-v<version>`, upload the VSIX to the Marketplace manually.
5. `androjack-web-page`: commit `release: web-v<version> - <summary>` (no tag; Pages deploys after Web Validate passes).

---
*Maintained by [Vikas Sahani](https://github.com/VIKAS9793)*
