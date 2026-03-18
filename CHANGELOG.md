# Changelog

## [1.6.4] – 2026-03-18

### Security
- **HTTP session isolation** — `startHttpServer` now accepts a factory function (`() => McpServer`) and creates a fresh `McpServer` + `StreamableHTTPServerTransport` instance per MCP initialize request. Shared server state across concurrent HTTP sessions is no longer possible. Fixes the session-reuse vulnerability in v1.6.3 (`http-server.ts`).

### Changed
- **Server factory** — Extracted all 21 tool registrations and the `androjack_grounding_gate` prompt into `src/server-factory.ts`. Both `stdio.ts` and `serve.ts` are now thin entrypoints that call `createAndroJackServer()`. Zero behavior change — same 21 tools, same tool names, same input schemas.
- **SDK floor raised** — `@modelcontextprotocol/sdk` declared dependency floor raised from `^1.12.1` to `^1.27.1`.
- **Installer UX** — Kiro and JetBrains AI (Android Studio) now show `"detected (MCP not yet configured — open the IDE once to initialize)"` when the IDE is installed but its config directory has never been created, instead of silently showing `"not found"`. (Reported by @kmayoral in issue #2.)
- **HTTP server return type** — `startHttpServer()` now returns `{ close(), address: { host, port } }` for cleaner testability.

### Dependencies
- `@modelcontextprotocol/sdk`: `^1.12.1` → `^1.27.1`

### Cleanup
- Removed accidentally-tracked `.connector-build/` artifacts from Git history (`git rm --cached`).


---

## [1.6.3] – 2026-03-18 (released)
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
