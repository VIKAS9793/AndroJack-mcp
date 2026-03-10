# Product Requirements Document
## AndroJack MCP — Documentation-Grounded Android Engineering Agent

| Field | Value |
|---|---|
| **Product** | AndroJack MCP |
| **Version** | 1.5.0 |
| **Status** | ✅ Shipped |
| **PM** | North Star Hunter |
| **Last Updated** | March 2026 |
| **Review Cycle** | Quarterly or on breaking Android platform change |

---

## 1. Problem Statement

### The Status Quo

AI coding assistants — including Gemini, Copilot, and Claude — generate Android code from
training data with a cutoff measured in months or years. The Android platform moves faster
than any training cycle:

- **Navigation 3** shipped stable in November 2025. Assistants still generate Nav2.
- **`TestCoroutineDispatcher`** was removed from coroutines-test 1.8+. Assistants still generate it — breaking CI.
- **Android 16 / API 36** mandates orientation-lock removal on ≥600dp devices by August 2026. Assistants still generate `android:screenOrientation="portrait"`.
- **`AsyncTask`** was removed at API 33. Assistants still generate it.
- **Material 3 Expressive** deprecates `BottomAppBar`, `ContextualFlowRow`. Assistants still generate them.

### The Evidence

The Stack Overflow 2025 Developer Survey (49,000 developers) found AI developer tool trust
dropped from **40% to 29% in one year**. 35% of Stack Overflow visits are now developers
debugging AI-generated code. For Android teams, this is not a minor friction — it is shipped
regressions, blocked reviews, and Play Store rejections.

### The Gap

No MCP server targets Android development with documentation-grounded, enforcement-first
quality control. The Google Developer Knowledge MCP (public preview, v1alpha, March 2026)
is a generalist retrieval tool across Firebase, Android, Cloud, and Maps. It has no
enforcement layer, no code validation, and no structured gate.

---

## 2. Product Vision

> **Give every Android developer — solo builder or enterprise team — a senior engineering
> colleague who has read the latest Android documentation and will not let deprecated code
> reach the codebase.**

---

## 3. Goals

### Primary Goal

Reduce AI-generated Android regressions to zero for the 22 rule classes covered by the
`android_code_validator` (Tool 21).

### Secondary Goals

- Make documentation-grounded development the default, not the exception
- Close the 2–18 month training lag between platform changes and LLM knowledge
- Establish AndroJack as the canonical Android-specific MCP server

### Non-Goals (v1.x)

- ❌ Replace Android Lint (static analysis on compiled bytecode)
- ❌ Replace Detekt, KtLint, or `paparazzi` screenshot testing
- ❌ Support non-Android Kotlin targets (backend, server-side)
- ❌ Provide an Android Studio extension GUI
- ❌ Offer cloud-hosted inference or telemetry without explicit opt-in

---

## 4. Users

See `USER-PERSONAS.md` for full persona definitions.

| Persona | Primary Pain | Primary Benefit |
|---|---|---|
| Solo Android Builder | Ships regressions unknowingly | Level 3 validation catches before commit |
| Enterprise Android Lead | AI hallucinations bypass code review | Enforced gate + audit trail of doc sources |
| Android-Adjacent PM/Designer | Doesn't know what to trust | Clear PASS/WARN/FAIL signal per code block |
| AI-Native Bootcamp Graduate | Has no senior reviewer | Inline explanations teach while blocking |

---

## 5. Use Cases

### UC-01 — New Feature Implementation (Core)
Developer asks AI to build a composable screen. AndroJack:
1. Fetches M3E docs before any composable is written
2. Fetches Nav3 guide before any routing code is written
3. Validates the generated code block before returning it
4. Returns PASS/WARN/FAIL with inline citations

### UC-02 — Dependency Update
Developer asks to add a library or update Gradle. AndroJack:
1. Fetches the live version from Google Maven
2. Checks KAPT → KSP migration status
3. Returns the correct `libs.versions.toml` snippet, not a hardcoded stale version

### UC-03 — Debug / Crash Analysis
Developer pastes a stacktrace. AndroJack:
1. Parses the trace and queries `issuetracker.google.com`
2. Returns the official fix or known-issue status, not a hallucinated workaround
3. Generates fix code and validates it through Tool 21

### UC-04 — Android 16 Compliance Audit
Developer asks "is my app ready for API 36?". AndroJack:
1. Calls `android_api36_compliance`
2. Scans for manifest orientation locks, resizability flags, large-screen layout gaps
3. Returns a compliance checklist with Play Store deadline context

### UC-05 — Migration (Nav2 → Nav3, KAPT → KSP, LiveData → StateFlow)
Developer asks to migrate legacy code. AndroJack:
1. Fetches the official migration guide
2. Applies it strictly — no hybrid patterns
3. Validates the migrated output

---

## 6. Functional Requirements

### F-01 — Grounding Gate (Level 2)
- The agent MUST call the relevant doc-fetch tool before writing any Android or Kotlin code.
- Failure to call the gate is a protocol violation.

### F-02 — Validation Gate (Level 3)
- Every generated code block MUST pass through `android_code_validator` (Tool 21) before being returned.
- A FAIL verdict code block MUST NOT be returned to the user.
- The agent MUST fix all FAIL-level violations and re-validate.

### F-03 — Source Citations
- Every code block MUST include an inline comment citing the official documentation URL from which it was derived.

### F-04 — 22 Validation Rules
- The validator MUST detect and report all 22 rules across 3 severity levels.
- Rule output MUST include: rule ID, severity, line number, violating snippet, replacement, documentation URL.

### F-05 — Negative Constraints
- The agent MUST be explicitly prohibited from generating the APIs listed in `agents.md` under Negative Constraints.
- These constraints apply even if the user requests them explicitly.

### F-06 — Tool Availability
- All 21 tools MUST be registered and available via both stdio and HTTP transports.
- Transport parity is required — the gate must apply equally on both.

### F-07 — Antigravity Skills Format
- The product MUST ship with an `agents.md` and 11 `SKILL.md` files structured for Antigravity's progressive disclosure architecture.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Tool call latency | < 2s per doc-fetch tool (network bound) |
| Validator throughput | < 500ms per code block (pure in-process regex) |
| Zero new dependencies | Validator uses no deps beyond the existing MCP SDK |
| Node.js compatibility | ≥ 18 LTS |
| Platform support | macOS, Linux, Windows (WSL tested) |
| Installability | Single `npx` command — no local build required |

---

## 8. Release Criteria — v1.5.0

| Criterion | Status |
|---|---|
| 22 rules implemented and unit-tested | ✅ |
| Tool 21 registered on both transports | ✅ |
| Grounding Gate includes Step 8 (validate output) | ✅ |
| Negative constraints section in system prompt | ✅ |
| agents.md + 11 SKILL.md files shipped | ✅ |
| README tool count consistent (21 everywhere) | ✅ |
| No stale "20 tools" references in README | ✅ |
| Version 1.5.0 in package.json, index.ts, serve.ts | ✅ |

---

## 9. Known Limitations (Transparent to Users)

| Bug Class | Why AndroJack Cannot Catch It | Recommended Tool |
|---|---|---|
| Absent modifier (PH-UI-001) | Absence cannot be detected by text-pattern matching | Android Lint rule |
| Runtime contrast failure (PH-UI-003) | Colour rendering is a visual property | `paparazzi`, Accessibility Scanner |
| Missing `try/catch` in ViewModel (PH-AR-004) | Structural analysis requires AST | Detekt rule |
| Touch target placement (PH-UX-008) | Composable hierarchy is semantic, not textual | Accessibility Scanner |
| Scaffold padding leak (PH-UI-009) | Variable usage is a compiler concern | Android Lint `UnusedParameter` |

---

## 10. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| OQ-01 | Should v1.6.0 include AST-based rules for structural absence bugs? | PM | Q2 2026 |
| OQ-02 | Does `android_code_validator` need a MISSING_CONTENT_DESCRIPTION rule? | Engineering | Q2 2026 |
| OQ-03 | What is the right opt-in mechanism for MCPcat telemetry? | PM | Q3 2026 |
| OQ-04 | How should we handle Play Store policy changes (monthly cycle)? | Engineering | Ongoing |
