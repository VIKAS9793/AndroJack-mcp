# Product Roadmap
## AndroJack MCP — Now / Next / Later

> Format: Now = committed and shipped. Next = high-confidence, scoped for next release.
> Later = directional bets, not commitments.
> Each item carries: the user job it serves, the assumption it tests, and the evidence required to proceed.
> Updated: July 2026.

---

## Roadmap Philosophy

We build in response to three inputs, in this order:

1. **Real failures** — documented bugs from real Android apps built with AI (the PH Bug Ledger)
2. **Platform changes** — breaking Android platform updates that open a new regression gap
3. **User signal** — validated feedback from developers who have adopted the tool

We do not build speculatively. Every roadmap item must have a user job it serves,
an assumption to test, and a signal that tells us the bet was correct.

---

## NOW — Shipped Releases

### ✅ v2.0.0 (Shipped, July 2026)

*   **Security & Sanitization:** Shipped pure TypeScript `content-sanitizer` to defend against indirect prompt injections. Hardened the `android_debugger` tool to wrap unmoderated user-submitted bug tracker results in an explicit `<UNTRUSTED_EXTERNAL_CONTENT>` boundary.
*   **New Tools & Rules:** Added **Tool 23: `android_developer_verification`** (covering Play Store compliance, timelines, bulk registration APIs). Added 2 new platform validation rules (covering unconfined dispatcher usage and Compose-first Fragment notices), bringing rule coverage from 26 to 28 rules.
*   **Platform Alignment:** Included Navigation 3 Scene Decorators reference and Compose-First deprecation notices to guide assistants away from legacy View systems.

### ✅ v1.7.1 & v1.7.0 (Shipped, April & March 2026)

*   **Engineering Hardening:** Integrated a comprehensive 54-test suite (now expanded to 85 tests).
*   **API 37 Support:** Added **Tool 22: `android_api17_compliance`** (handling static final field reflection, `ACCESS_LOCAL_NETWORK` permission, SMS OTP changes) and 7 new validator rules (bringing rule count to 26 rules before v2.0.0).

### ✅ v1.5.0 (Shipped, March 2026)

*   **Level 3 Loop-Back Validation:** Shipped `android_code_validator` as Tool 21 with a 22-rule engine.
*   **Grounding Gate:** Enforced mandatory validation before returning code blocks.
*   **Antigravity Skills:** Added semantic-triggered `SKILL.md` documents.

---

## NEXT — v2.1.0 (Target: Q3 2026)

### 🔲 MISSING_CONTENT_DESCRIPTION Rule (Validator Rule 29)

**User job:** Confidence Gate (JTBD-01)  
**Problem:** Composables with interactive semantics (Button, Image with tap handler) are
frequently generated without `contentDescription`. Accessibility Scanner catches this at
runtime; no generation-time rule exists.  
**Assumption:** This rule fires in ≥ 10% of Compose UI generation tasks — frequent enough
to justify the false-positive risk.  
**Evidence required to proceed:** Internal testing on 50 generated composable code samples  
**Signal to confirm:** User report of ≥ 2 production accessibility failures from AI-generated
code missing content descriptions  
**Implementation:** Regex-pattern on `Image(`, `IconButton(`, and custom `Modifier.clickable`
blocks that lack an adjacent `contentDescription` parameter

---

### 🔲 UPPERCASE_STRING_MUTATION Rule (Validator Rule 30)

**User job:** Confidence Gate (JTBD-01)  
**Problem:** M3 Expressive requires Sentence case for button labels. AI frequently generates
`.uppercase()` or `.toUpperCase()` on label text, violating M3E typography standards.  
**Assumption:** Frequency in wild is sufficient to justify a WARNING-level rule  
**Signal to confirm:** ≥ 3 community reports of this specific violation  
**Implementation:** Regex on `.uppercase()` or `.toUpperCase()` in Compose text contexts

---

### 🔲 Opt-In Telemetry (MCPcat Integration)

**User job:** North Star measurement (internal)  
**Problem:** We have no data on which rules fire most often, what the PASS/WARN/FAIL
distribution looks like, or how tool call latency varies across environments.  
**Assumption:** ≥ 30% of users will opt in to anonymous rule-hit telemetry if the
consent flow is explicit and the data schema is published  
**Implementation:** Opt-in flag in `claude_desktop_config.json`; reports only rule IDs
and verdict distribution; no code content, no identity, no project metadata  
**Non-negotiable:** Default OFF. No silent opt-in. Telemetry schema published in README.

---

### 🔲 android_code_validator Streaming Feedback

**User job:** Zara (Junior Dev) learning through feedback  
**Problem:** Current validator batches all violations and returns them at the end.
For large code blocks, this means a 2-second wait before any feedback.  
**Assumption:** Streaming violations as they are found reduces perceived latency  
**Implementation:** Progressive violation reporting via MCP streaming (if transport supports it)

---

## LATER — v2.2+ (Directional, 2026 H2)

### 🔭 AST-Based Structural Absence Detection

**User job:** Confidence Gate (JTBD-01) — closing the gap for absence bugs  
**Problem:** Text-pattern matching cannot detect absent modifiers (`wrapContentHeight` missing),
absent `try/catch` blocks, or absent `innerPadding` usage. These are the bugs
the current validator explicitly cannot catch (PH-UI-001, PH-AR-004, PH-UI-009).  
**Approach:** AST parsing (Kotlin compiler as library, or `kotlinx.ast`) on generated code blocks.
Parse the AST before returning the code. Check:
- `SegmentedButton { }` without `wrapContentHeight()` modifier
- `viewModelScope.launch { }` without `try/catch` wrapping repository calls
- `Scaffold { innerPadding -> }` where `innerPadding` is not used in a scrollable child  
**Assumption:** AST-level rules for the top 5 absence bug patterns from the PH ledger
reduce this bug class by ≥ 60%  
**Dependency:** Kotlin compiler plugin integration into the MCP server — requires research spike  
**Risk:** Significantly higher latency than regex matching; may require async architecture

---

### 🔭 Android Studio HTTP Transport Re-Enablement

**User job:** Priya (Lead) — direct IDE integration without Claude Desktop config  
**Problem:** HTTP transport was working in dev but was descoped from v1.5.0 to reduce scope risk.
Android Studio Gemini plugin supports MCP via HTTP endpoint.  
**Assumption:** HTTP transport unblocks ≥ 20% of enterprise users whose workflow is
Android Studio-first, not Claude Desktop-first  
**Dependencies:** Android Studio MCP HTTP spec finalised; Google ToS for Gemini + MCP confirmed  
**Evidence required to proceed:** ≥ 5 GitHub issues requesting HTTP transport from Android Studio users

---

### 🔭 Play Store Policy Change Monitor

**User job:** Play Store Compliance Without Surprise (JTBD-05)  
**Problem:** Play Store policy changes monthly. `android_play_policy_advisor` is only
as current as the last time we updated the docs. There is no automated signal when
a policy page changes.  
**Approach:** Weekly diff of `play.google.com/about/developer-content-policy` and
relevant Android 16 compliance pages. Auto-open a GitHub issue when substantive
changes are detected.  
**Assumption:** Policy diff is parseable with lightweight HTTP + diff tooling  
**Risk:** Google changes page structure without notice, breaking the diff

---

### 🔭 Community Regression Database

**User job:** All personas — trust via shared intelligence  
**Problem:** AndroJack's rules are based on the PH Bug Ledger (10 bugs, one app).
The ruleset needs to grow from real-world community failures.  
**Approach:** GitHub Discussions template: "I got a WARN/FAIL — here's the bug it caught"
+ structured intake: rule ID, code before, code after, was it a real bug?  
**Goal:** 100 community-contributed bug reports by end of 2026 that inform v2.x rules

---

## What Is Not on the Roadmap

These are explicit non-goals. We will not build them unless evidence changes the calculus.

| Item | Reason Not on Roadmap |
|---|---|
| Backend / server-side Kotlin support | Different platform, different rules — would dilute Android specialisation |
| iOS Swift support | Different ecosystem — out of scope for an Android-grounded tool |
| GUI dashboard / web app | MCP is a protocol; our surface is the AI agent's context |
| Paid tier or SaaS | MIT license, community-first; monetisation only if sustainability requires it |
| Generative code completion | We are a quality gate, not a code generator |
| Android Studio extension GUI | Complexity without proportional value; HTTP transport is the right integration |

---

## Roadmap Summary Table

| Item | Release | Status | User Job |
|---|---|---|---|
| Tool 21 — `android_code_validator` | v1.5.0 | ✅ Shipped | JTBD-01 |
| Grounding Gate Step 8 | v1.5.0 | ✅ Shipped | JTBD-01 |
| Antigravity Skills (agents.md + 11 SKILLs) | v1.5.0 | ✅ Shipped | JTBD-02, JTBD-03 |
| PH Bug Ledger docs | v1.5.0 | ✅ Shipped | Trust / transparency |
| Tool 22 — `android_api17_compliance` | v1.7.0 | ✅ Shipped | JTBD-01 |
| Content Sanitizer (`content-sanitizer.ts`) | v2.0.0 | ✅ Shipped | Security |
| Tool 23 — `android_developer_verification` | v2.0.0 | ✅ Shipped | JTBD-05 |
| Validator rule count expansion (28 rules) | v2.0.0 | ✅ Shipped | JTBD-01 |
| MISSING_CONTENT_DESCRIPTION rule | v2.1.0 | 🔲 Scoped | JTBD-01 |
| UPPERCASE_STRING_MUTATION rule | v2.1.0 | 🔲 Scoped | JTBD-01 |
| Opt-in telemetry | v2.1.0 | 🔲 Scoped | Measurement |
| Validator streaming feedback | v2.1.0 | 🔲 Scoped | JTBD-01 (UX) |
| AST-based absence detection | v2.2+ | 🔭 Bet | JTBD-01 |
| Android Studio HTTP transport | v2.2+ | 🔭 Bet | JTBD-03 |
| Play Store policy change monitor | v2.2+ | 🔭 Bet | JTBD-05 |
| Community regression database | v2.2+ | 🔭 Bet | All |
