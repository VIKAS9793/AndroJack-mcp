User-facing release notes for **AndroJack MCP for VS Code**.

## 1.7.0

- **v1.7.0 Sync:** Extension now launches the hardened `androjack-mcp@1.7.0` release.
- **Android 17 / API 37:** Added support for the new `android_api17_compliance` tool.
- **Rule Engine Expansion:** Internal validator now covers 31 rules (up from 24).
- **Dependency Hardening:** Updated internal mocha and glob dependencies to address security vulnerabilities.


## 1.6.4

- **Security Sync:** Extension now launches the hardened `androjack-mcp@1.6.4` release with per-session server isolation.
- **Dependency Update:** Raised pinned MCP package version to `1.6.4` for all launch points.

## 1.6.3

- Sync the wrapper to launch `androjack-mcp@1.6.3`.
- Update Marketplace-facing version copy and release metadata to `1.6.3`.
- Split branch automation into isolated validate and publish workflows, with publish gated behind `vscode-v*` tags or manual dispatch.

## 1.6.2

- Fix-forward Marketplace build: avoid activation failure when the VS Code MCP API is not available (feature-detect + skip registration).

## 1.6.1

- **Sync:** Extension now launches the updated `androjack-mcp@1.6.1` release.
- **Pinned Distribution:** installer output and configuration examples now use exact `@1.6.1` pinning.
- **Shared Cache:** Implemented shared fetch cache wiring to improve rate-limit budget management.
- **Registry Metadata:** Added official MCP registry metadata with namespaced `server.json`.

## 1.6.0

- The extension now launches the reviewed `androjack-mcp@1.6.0` release for a more predictable setup experience.
- Added a real AndroJack icon in VS Code and on the Marketplace listing.
- Refreshed the Marketplace presentation for the `1.6.0` release.

## 1.5.4

- Clarified that this extension is the VS Code wrapper for the AndroJack MCP server.
- Updated the Marketplace description and README to better explain what AndroJack does.

## 1.5.3

- Fixed packaging issues so the Marketplace README appears correctly in VS Code.
- Improved release reliability for extension packaging and installation.
