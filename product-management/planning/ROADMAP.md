# Product Roadmap
## AndroJack MCP — Now / Next / Later

> Format: Now = committed and shipped. Next = high-confidence, scoped for next release.
> Later = directional bets, not commitments.
> Each item carries: the user job it serves, the assumption it tests, and the evidence required to proceed.
> Updated: March 2026.

---

## Roadmap Philosophy

We build in response to three inputs, in this order:

1. **Real failures** — documented bugs from real Android apps built with AI (the PH Bug Ledger)
2. **Platform changes** — breaking Android platform updates that open a new regression gap
3. **User signal** — validated feedback from developers who have adopted the tool

We do not build speculatively. Every roadmap item must have a user job it serves,
an assumption to test, and a signal that tells us the bet was correct.

---

## NOW — v1.5.0 (Shipped, March 2026)

### ✅ Level 3 Loop-Back Validation (Tool 21 — `android_code_validator`)

**User job:** Confidence Gate (JTBD-01) — no deprecated code reaches the developer's clipboard  
**What shipped:**
- 22-rule validation engine (pure TypeScript, zero new deps)
- 3 severity levels: error / warning / info
- PASS / WARN / FAIL verdict with line-level violations, replacements, doc URLs
- Gate mandates: FAIL code never returned to user

**Metric to watch:** FAIL-fix-rerun rate ≥ 99%

---

### ✅ Grounding Gate — Step 8 (Validate Output)

**User job:** Confidence Gate (JTBD-01)  
**What shipped:**
- Grounding Gate updated from 7 to 8 steps across both stdio and HTTP transports
- Hard rule: agent CANNOT return code without validator verdict
- Negative Constraints section added to system prompt

---

### ✅ Antigravity IDE Skills Integration

**User job:** Time-to-current knowledge (JTBD-02), Safe Delegation (JTBD-03)  
**What shipped:**
- `agents.md` — ambient always-loaded gate for Antigravity projects
- 11 SKILL.md files — on-demand, semantic-triggered, covering all 21 tools by domain
- Progressive disclosure architecture: only relevant skill loaded per task

---

### ✅ PH Bug Ledger Documentation

**User job:** Trust and transparency  
**What shipped:**
- "What Can Still Break — Even at Level 3" section in README
- 5 real bugs from production Android app documented with root cause and correct tool layer
- Defence-in-Depth table: 9 bug classes mapped to their correct layer

---

## NEXT — v1.6.1 (Target: Q2 2026)

### 🔲 MISSING_CONTENT_DESCRIPTION Rule (Validator Rule 23)

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

### 🔲 UPPERCASE_STRING_MUTATION Rule (Validator Rule 24)

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

## LATER — v2.x (Directional, 2026 H2)

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
| MISSING_CONTENT_DESCRIPTION rule | v1.6.1 | 🔲 Scoped | JTBD-01 |
| UPPERCASE_STRING_MUTATION rule | v1.6.1 | 🔲 Scoped | JTBD-01 |
| Opt-in telemetry | v1.6.1 | 🔲 Scoped | Measurement |
| Validator streaming feedback | v1.6.1 | 🔲 Scoped | JTBD-01 (UX) |
| AST-based absence detection | v2.0 | 🔭 Bet | JTBD-01 |
| Android Studio HTTP transport | v2.0 | 🔭 Bet | JTBD-03 |
| Play Store policy change monitor | v2.x | 🔭 Bet | JTBD-05 |
| Community regression database | v2.x | 🔭 Bet | All |
