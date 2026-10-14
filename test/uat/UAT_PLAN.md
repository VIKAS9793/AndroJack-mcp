# AndroJack MCP 2.1.0 — User Acceptance Test Plan

**Scope:** release 2.1.0. **Suite:** `test/uat/uat.test.mjs` (automated, runs in `npm test`).
**Method:** black-box. The *built* server is launched as a child process and driven by the official
`@modelcontextprotocol/sdk` client over stdio (UAT-01 to UAT-16) and Streamable HTTP (UAT-17), the same way
Claude Desktop, Cursor, VS Code, Kiro and Android Studio talk to it.
**Environment:** hermetic. `ANDROJACK_OFFLINE=1` is set for the server, so the result does not depend on
developer.android.com, Google Maven or Google APIs being reachable. UAT-L1 is the only live-network check
(opt-in, `ANDROJACK_UAT_LIVE=1`).

## Personas

- **Agent:** an AI coding assistant connected over MCP that generates Android code.
- **Developer:** a person who installs AndroJack and reviews the agent's output.
- **CI:** a pipeline that runs AndroJack on a pull request.

## Acceptance criteria

| ID | User story | Acceptance criterion | Fix it guards |
|----|------------|----------------------|---------------|
| UAT-01 | As a developer, when I connect a client I see AndroJack's tools | `tools/list` equals the published `TOOL_NAMES` contract exactly | Contract drift |
| UAT-02 | As a client, I can decide auto-approval safely | Every tool has a title, a description, and `readOnlyHint` / `destructiveHint:false` / `idempotentHint` / `openWorldHint` | Missing annotations (2.0) |
| UAT-03 | As a developer, AndroJack does not eat my context window | `tools/list` ≤ 30 KB | Context growth |
| UAT-04 | As an agent, correctly migrated code passes even with migration comments | Kotlin with `// replaced AsyncTask … GlobalScope.launch` → `PASS` | Comment false-FAIL fix loop |
| UAT-05 | As an agent, I get machine-readable violations | Removed API → `FAIL`, `structuredContent.violations[]` with ruleId, line, https docUrl | Structured output |
| UAT-06 | As an agent targeting API 37, I'm warned about Android 17 breakage | Orientation lock + aspect ratio in manifest and CameraX 1.4.x in Gradle are flagged | New API 37 rules |
| UAT-07 | As an agent, empty input is not a silent PASS | `isError: true` | Error semantics |
| UAT-08 | As an agent, I am not told a current API is deprecated | `Row` → "status NOT confirmed", not DEPRECATED | Registry substring false positives |
| UAT-09 | As an agent, removed APIs are reported | `AsyncTask` → REMOVED with replacement | Registry still works |
| UAT-10 | As a developer of a game, I get correct Android 17 guidance | Large-screen answer states games stay exempt | Factual error (2.0) |
| UAT-11 | As a developer, Play deadlines reflect today | Target-API answer says the Aug 31, 2026 requirement is in force, extension to Nov 1 | Stale deadline |
| UAT-12 | As an agent offline, search still points to official sources | Canonical developer.android.com link, offline notice, no network | Offline mode |
| UAT-13 | As an agent, an unmatched query is reported as unmatched | No filler; tells the agent not to fall back to memory | Empty-search (2.0) |
| UAT-14 | As an agent, every tool answers | All 23 tools return >50 chars of text and no protocol error | Regressions in any tool |
| UAT-15 | As CI or a client, I can read the rule catalogue without a tool call | `androjack://rules` count = validator rules; template + server-info resources work | Resources |
| UAT-16 | As a developer, the system prompt doesn't undermine injection defences | Grounding gate has UNTRUSTED CONTENT section and no "read and follow" | Prompt contradiction (2.0) |
| UAT-17 | As a remote client, I can authenticate and use the server over HTTP | Bearer token → list + call works; structured verdict returned | HTTP auth |
| UAT-L1 | As an agent online, search returns real documentation | Live result contains wrapped doc text > 800 chars | Empty-search (2.0), live |

## Supporting suites (run in the same `npm test`)

| Suite | Covers |
|-------|--------|
| `test/security-v21.test.mjs` | Redirect re-validation, port/credential rejection, boundary spoofing, Unicode evasion, attribute escaping, universal wrapping, API-key handling, offline kill-switch |
| `test/validator-v21.test.mjs` | Comment masking, kapt KTS, SDK gates, CameraX ranges, `minSdkBelow`, regex state, performance, registry matching, Maven stable selection, doc index |
| `test/validate-cli.test.mjs` | CLI exit codes, text/JSON/SARIF output, skipped dirs, symlinks, usage errors |
| `test/http-v21.test.mjs` | Bearer auth, idle eviction, 404 for unknown sessions, discovery counts, stateless mode, remote-bind policy, flag validation |
| `test/release-integrity.test.mjs` | Version sync across all manifests/configs/badges; README counts match code; CHANGELOG head |

## How to run

```bash
npm test                                   # everything, hermetic
node --test test/uat/uat.test.mjs          # UAT only (after npm run build)
ANDROJACK_UAT_LIVE=1 node --test test/uat/uat.test.mjs   # include live retrieval
```

## Manual checks before publishing (not automatable here)

- [ ] Connect Claude Desktop, Cursor, VS Code and Android Studio to `npx androjack-mcp@2.1.0`; confirm 23 tools load
- [ ] With a real `ANDROJACK_DEVELOPER_KNOWLEDGE_API_KEY`, confirm `android_official_search` reports "Google Developer Knowledge API" retrieval and returns Android results (the `data_source` filter value has not been tested against the live API)
- [ ] Upload a SARIF file from `androjack-mcp validate --format=sarif` to a test repo; confirm alerts render on the PR
- [ ] `npm pack --dry-run` lists `build/docs-index.js`, `build/docs-search.js`, `build/integrations/`, `build/validate-cli.js`
