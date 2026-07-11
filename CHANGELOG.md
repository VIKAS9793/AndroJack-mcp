# Changelog

## [2.0.0] – 2026-07-11

### Security

- **NEW: Content sanitizer for externally-fetched text** (`src/content-sanitizer.ts`) — mitigates indirect prompt injection via tool output, the dominant client-side MCP vulnerability class. Any tool result built from live-fetched HTML now passes through structural pattern detection (fake role markers, instruction-reset framing, direct AI-addressing) before reaching the calling agent's context.
- **`android_debugger` hardened** — `issuetracker.google.com` is the only allowlisted domain indexing free-text, publicly-postable, user-submitted content (bug reports/comments). Unlike single-publisher sources (`developer.android.com`, `kotlinlang.org`), anyone can file a public issue with an embedded instruction payload. Results from this source are now wrapped in an explicit `<UNTRUSTED_EXTERNAL_CONTENT>` boundary via `wrapUntrustedContent()`, with the calling model told explicitly the content is reference data, not directives.
- **Dependency vulnerabilities patched** — `npm audit` surfaced 7 vulnerabilities (3 high) in transitive `undici`/`qs` via `cheerio`. Resolved with `npm audit fix` — `cheerio` updated in place, zero breaking changes, all 70 tests still passing post-patch. **0 vulnerabilities** in the shipped dependency tree.
- **`SECURITY.md`** — supported-version table updated for 2.0.x; documents the new content-sanitizer layer under Secure Defaults.

### Added

- **Tool 23: `android_developer_verification`** — Android's developer verification program enforcement begins September 30, 2026 (Brazil, Indonesia, Singapore, Thailand first; global 2027). Identity check, not content review — affects every Android developer, not just Play Store publishers. Covers full rollout timeline, registration paths (Play Console, Android Developer Console, CI/CD bulk registration APIs), managed-device/enterprise exemptions, and the new Android Studio IDE registration-status integration.
- **2 new validator rules** (26 → 28) reflecting the May 2026 platform shift:
  - `UNCONFINED_DISPATCHER_COMPOSE_TEST` (warning) — flags `UnconfinedTestDispatcher()` in test code. Compose 1.11+ defaults to `StandardTestDispatcher` (queued execution); tests written against the old immediate-execution assumption may now hang or assert too early.
  - `NEW_FRAGMENT_CLASS_COMPOSE_FIRST` (info) — flags new classes extending `Fragment`. As of May 19, 2026, Android UI development is officially Compose First; Views are in maintenance mode (critical bugfixes only). Existing Fragment code is unaffected — this flags new subclasses only.
- **Compose 1.11 v2 Testing Framework section** (`testing.ts`) — full migration guide for the default test-dispatcher change, with before/after code and a per-item checklist.
- **Navigation 3 Scene Decorators** (`navigation3.ts`) — covers the 1.1 release (May 18, 2026): wrapping destinations with persistent chrome (bottom bars, nav rails, dialogs) without each screen needing to know about it.
- **Compose-First maintenance-mode notices** (`architecture.ts`, `constants.ts`) — queries for View-based topics (Fragments, RecyclerView, ViewPager, Navigation/Layout Editor) now return an explicit notice steering toward Compose, sourced from Google's own "Android UI Development is Compose First" announcement, rather than silently returning legacy guidance as if still current.
- **Android Skills / Android CLI positioning** (`build-publish.ts`) — documents Google's first-party Android Skills GitHub repo, Android CLI, and Android Knowledge Base (launched April 16, 2026). Positioned explicitly as complementary: Android Skills provide instructional context before code generation; AndroJack's `android_code_validator` is the enforcement gate that runs after.
- **AGP 10.0 upcoming breaking-changes warning** (`build-publish.ts`) — flags the removal of `android.newDsl=false` / `android.builtInKotlin=false` opt-outs and `CommonExtension` type-parameter changes ahead of the mid-2026 release.

### Changed

- **`ANDROID_STUDIO_CURRENT` fully corrected** — was two full codenames stale (claimed "Panda 2" current). Now correctly reflects **Android Studio Quail (2026.1.x)** as current stable, AGP 9.2.0, Kotlin Gradle Plugin 2.2.10 — all verified against official release notes rather than carried forward from a prior snapshot.
- **Version catalog example rewritten** (`build-publish.ts`) — removed several dependency version numbers that were asserted without verification in a prior session (fabricated, not sourced). Replaced with only-verified versions (AGP 9.2.0, Compose BOM 2026.04.01, Hilt 1.4.0-beta01, Lifecycle 2.11.0-beta01, Navigation3 1.1.0) plus explicit `CHECK_LIVE_VIA_gradle_dependency_checker` placeholders for anything not independently confirmed this cycle — the tool now tells the AI to verify live rather than trust a hardcoded guess.
- **Full version string sync** — `1.7.1` → `2.0.0` across every file that referenced it: `package.json`, `.mcp/server.json`, `manifest.json`, `server.json`, all 7 IDE config files in `config/`, and CLI usage comments in `src/serve.ts` / `src/install.ts`. A prior release had bumped `src/version.ts` without propagating to these files — this release closes that gap and adds it as a pre-release checklist item.
- **`/.well-known/mcp` discovery endpoint** — `tools: 22` → `tools: 23`.

### Fixed

- **Test-suite/version desync caught by CI** — bumping `src/version.ts` without `package.json` broke 2 existing tests (`cli-routing.test.mjs`) that assert CLI `--version` output and IDE config install commands against `package.json`'s version field. Fixed at the source (synced `package.json`) rather than adjusting the tests to match — the tests were correctly catching a real inconsistency.
- **Test Suite Expansion** — Expanded test coverage in `test/tool-outputs.test.mjs` from 70 to 85 tests to thoroughly exercise non-default topic branches for revised v2.0.0 tools (Architecture Compose-First notice, Navigation 3 Scenes/migration, Testing pyramid/unit fakes, Build/Publish KSP, and Debugger inputs).
- **Brittle CI Assertion Fixed** — Converted the Hono version assertion in `.github/workflows/main-validate.yml` from an exact pin on `4.12.7` to a floor check (`>= 4.12.7`), matching the SDK floor check pattern. This prevents CI failure when dependency upgrades (e.g. `4.12.28`) are applied. Added all 8 test files to the file-existence validation step in CI.
- **Readme Badges Updated** — Replaced retired dynamic VS Code marketplace and GitHub clones badges with static alternatives, and bumped base64-encoded installation configurations to version `2.0.0`.

---

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
