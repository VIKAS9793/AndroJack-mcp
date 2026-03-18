# Changelog

All notable changes to this project will be documented in this file.

## [1.6.3] - 2026-03-18
### Fixed
- CLI routing for `install`, `install --auto`, `install --ide=...`, `help`, and `--version` so these commands no longer fall through to the stdio server.
- Installer auto-detection so a clean workspace no longer gets false-positive Cursor or VS Code installs.
- Serve mode startup so runtime packaging no longer depends on an undeclared external banner package.

### Security
- Streamable HTTP host/origin validation with request body and active-session limits.
- HTTPS-only outbound fetches, capped response reads, and safer retry logging that strips query strings.
- Loopback-only HTTP binding by default unless `--allow-remote` is explicitly opted in.

## [1.6.1] - 2026-03-16
### Added
- MCP Registry ownership mapping (`mcpName`).
- Improved technical documentation and keywords.
- Enhanced tool descriptions for technical clarity.
- Official `.mcp/server.json` for registry mapping.

## [1.5.0] - 2026-03-10
### Added
- Jetpack Compose specific validation rules.
- Support for Material 3 Expressive components.

## [1.0.0] - 2026-03-01
### Added
- Initial release with core Android documentation grounding tools.
