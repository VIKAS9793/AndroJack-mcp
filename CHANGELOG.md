# Changelog

## [1.7.1] – 2026-04-12

### Added
- **Comprehensive Test Suite** — Implemented 54 unit and contract tests covering all core systems:
  - `rules.test.mjs`: Verified all 31 validator rules (positive/negative cases).
  - `parser.test.mjs`: Sanity tests for HTML documentation text extraction.
  - `cache.test.mjs`: Verified LRU eviction and TTL expiry logic.
  - `http.test.mjs`: Security validation for the domain allowlist and HTTPS-only policy.
  - `tool-outputs.test.mjs`: Contract tests for tool return formats.

### Changed
- **Community Parity** — Updated the `/.well-known/mcp` capability discovery endpoint to correctly report `tools: 22` (previously 21), ensuring compatibility with automated ecosystem scanners.
- **Supply Chain Hygiene** — Removed `node-fetch` (migrated to native `fetch`) and pruned stale `hono` overrides from `package.json` for a leaner dependency tree.
- **Validator Rule Hardening** — Broadened detection patterns for `NavHost` and `BottomAppBar` to support both parenthesis `(...)` and trailing lambda `{ ... }` call styles in Kotlin/Compose code.

### Fixed
- **Android 17 Documentation URLs** — Resolved critical documentation links pointing to non-existent anchors.
  - Corrected `ACCESS_LOCAL_NETWORK` docUrl in `android17-compliance.ts` and `permissions.ts` to point to the dedicated permission page (`/privacy-and-security/local-network-permission`) instead of a broken anchor on the behavior changes page.
  - Verified `handoff` anchors point to the valid features page.


---

## [1.7.0] – 2026-03-27

### Added
- **Tool 22: `android_api17_compliance`** — Android 17 / API 37 compliance reference.
  Covers four new breaking changes: (1) static `final` field reflection blocked — apps
  targeting API 37 that modify `static final` fields via reflection receive
  `IllegalAccessException`; JNI modification causes a crash. (2) `ACCESS_LOCAL_NETWORK`
  permission — any LAN communication (socket connections to 192.168.x.x / 10.x.x.x,
  mDNS/NSD, SSDP) requires runtime permission on API 37+. (3) SMS OTP protection —
  programmatic SMS access delayed 3 hours; migrate to `SmsRetriever.startSmsUserConsent()`.
  (4) Extended large-screen mandate — the games exemption (`android:appCategory="game"`)
  no longer applies on API 37+ targets. Also covers Handoff API (cross-device continuity)
  and NPU feature declaration for on-device AI. Includes full migration checklist.
  Source: https://developer.android.com/about/versions/17/behavior-changes-17

- **7 new validator rules** (`src/rules/android-rules.ts`) — rule count 24 → 31:
  - `API37_STATIC_FINAL_REFLECTION` (error) — detects reflection patterns that break on API 37
  - `ACCESS_LOCAL_NETWORK_MISSING` (warning) — detects LAN socket patterns without the permission
  - `SMS_OTP_BROADCAST_RECEIVER` (warning) — detects legacy `SMS_RECEIVED` OTP pattern
  - `ROOM_30_SUPPORT_SQLITE_DATABASE` (error) — detects `SupportSQLiteDatabase` removed in Room 3.0
  - `ROOM_30_SUPPORT_SQLITE_OPEN_HELPER` (error) — detects `SupportSQLiteOpenHelper` removed in Room 3.0
  - `WINDOW_SIZE_CLASS_DEPRECATED_CALCULATE` (warning) — detects deprecated `calculateWindowSizeClass(activity)`
  - `KAPT_IN_KMP_COMMON` (error) — detects `kapt()` in `commonMain` where it cannot run

- **WindowManager 1.5.0 breakpoints** (`src/tools/large-screen.ts`) — two new width
  size classes: Large (1200–1600dp) and Extra-large (1600dp+). Added three-pane and
  four-pane layout patterns for desktop/large display environments. All five breakpoints
  now documented with `SupportingPaneScaffold` usage.
  Source: https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes

- **Room 3.0-alpha breaking changes** (`src/tools/kmp.ts`, `src/constants.ts`) —
  `SupportSQLiteOpenHelper`, `SupportSQLiteDatabase`, and `SupportSQLiteStatement` removed.
  Migration path to `SQLiteDriver` / `SQLiteConnection` APIs documented. Warning: Room 3.0
  is alpha — do not migrate production apps until stable.
  Source: https://android-developers.googleblog.com/2026/03/room-30-modernizing-room.html

- **`ACCESS_LOCAL_NETWORK` permission** (`src/tools/permissions.ts`) — new Android 17
  permission entry with runtime check pattern and `Build.VERSION.SDK_INT >= 37` guard.

- **Contact Picker API note** (`src/tools/permissions.ts`) — `READ_CONTACTS` entry
  updated: `ACTION_PICK_CONTACTS` is now the recommended alternative for most use cases,
  avoiding the need for full contacts access.

- **Play billing openness** (`src/tools/play-policy.ts`) — March 4, 2026 policy update:
  alternative billing options, User Choice Billing implementation, updated fee structure,
  registered alternative app store program.

- **Android Studio Panda 2 stable** (`src/tools/build-publish.ts`) — current stable IDE
  release (March 3, 2026, version 2025.3.2) documented alongside Otter 3 Feature Drop
  history.

### Changed
- `src/tools/api36-compliance.ts` — Android 17 / API 37 queries now routed to
  `android_api17_compliance` tool with a redirect message.
- `src/server-factory.ts` — Tool 22 (`android_api17_compliance`) registered.
  Grounding Gate prompt updated to reference API 37 compliance.
- `src/version.ts` — `1.6.4` → `1.7.0`

### Fixed
- `src/tools/play-policy.ts` — `billingOpenness` constant referenced in routing but
  never declared — caused `TS2304` compile error at build time.

---

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
