# Changelog

User-facing release notes for **AndroJack MCP for VS Code**.

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
