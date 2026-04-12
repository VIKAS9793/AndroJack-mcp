# North Star Metrics
## AndroJack MCP — Measuring What Matters

> The North Star metric is the single number that best captures the value we deliver
> to users and predicts long-term product health.
> Updated: March 2026.

---

## The North Star

> ### Validated Code Blocks Shipped Per Month
> (Tool 21) and received a PASS or WARN verdict — meaning they were grounded in
> official documentation and cleared of the 31 rule classes before reaching the developer.*

**Why this metric:**

It counts only code that completed the full Level 3 loop — documentation fetched,
code generated, validation run, verdict received. It is a direct measure of the
core value proposition: documentation-grounded, validated Android code generation.

A rising North Star means more developers are getting safer Android code.
A flat or falling North Star means adoption has stalled or the gate is being bypassed.

---

## Input Metrics (What We Control)

These are the levers. Improving these drives the North Star.

| Metric | Definition | Target (6-month) | Why It Matters |
|---|---|---|---|
| **Grounding Gate compliance rate** | % of code generation tasks where at least one doc-fetch tool was called before output | ≥ 95% | Gate bypassed = no grounding = North Star uncountable |
| **Validator call rate** | % of code generation tasks where `android_code_validator` was called | ≥ 95% | Validation skipped = North Star uncountable |
| **FAIL-fix-rerun rate** | % of FAIL verdicts where the agent fixed and re-ran (vs. returning FAIL code) | ≥ 99% | Gate effectiveness — FAIL code reaching user = product failure |
| **Rule coverage breadth** | Number of rule classes in validator | 22 (v1.5.0) → 31 (v1.7.1) | More rules = more ground covered |
| **Skill trigger accuracy** | % of Antigravity tasks where the correct SKILL.md loaded | ≥ 90% | Wrong skill or no skill = missed grounding |

---

## Output Metrics (What Users Experience)

These measure outcomes. We cannot directly control them, but input metrics predict them.

| Metric | Definition | Target | Data Source |
|---|---|---|---|
| **Deprecated API regression rate** | % of AI-generated PRs containing a deprecated or removed Android API | < 1% | Community survey, bug reports |
| **Play Store rejection rate** | % of releases where Play Store rejection was caused by an issue `android_play_policy_advisor` covers | → 0% | Community survey |
| **CI failure rate from AI code** | % of CI runs that fail due to a deprecated/removed API in AI-generated code | → 0% | Community survey |
| **Developer trust retention** | % of developers who continue using AndroJack after 30 days | ≥ 70% | Usage telemetry (opt-in) |
| **FAIL-to-ship rate** | % of FAIL verdicts where the error made it to production anyway | → 0% | Community incident reports |

---

## Health Metrics (Product Hygiene)

| Metric | Definition | Alert Threshold |
|---|---|---|
| **Tool availability** | % of tool calls that succeed (no 5xx, no timeout) | < 98% triggers investigation |
| **Validator false-positive rate** | % of FAIL verdicts on correct code | > 1% triggers rule audit |
| **Validator false-negative rate** | Known deprecated API patterns missed by the 31 rules | Any new miss added to backlog immediately |
| **Node.js version compat** | Passes on Node 18, 20, 22 LTS | Any failure is a P0 bug |
| **Install success rate** | % of `npx @androjack/mcp` installs that complete without error | < 99% triggers investigation |

---

## Metrics We Explicitly Exclude

### What We Do NOT Measure

| Excluded Metric | Why |
|---|---|
| Total code lines generated | Volume without quality is the problem we're solving, not the goal |
| Time-in-tool per session | We want developers to be faster, not to spend more time with us |
| Number of tool calls per session | Efficiency should decrease tool calls, not increase them |
| AI confidence scores | We do not measure how confident the AI feels — we measure correctness |

---

## Measurement Plan

### Opt-In Telemetry (v1.7.1 target)

AndroJack v1.5.0 has no telemetry. All current metrics are measured via:
- Community surveys (GitHub Discussions, X/Twitter, Discord)
- Bug reports and GitHub Issues
- Self-reported postmortems (like the Atomic Robot case study)

v1.7.1 will offer **opt-in telemetry** with explicit consent:
- Rule ID hit frequency (which rules fire most often)
- PASS/WARN/FAIL verdict distribution
- Tool call latency by tool
- No code content, no developer identity, no project metadata

### Review Cadence

| Metric Type | Review Frequency | Owner |
|---|---|---|
| North Star | Monthly | PM |
| Input metrics | Weekly (during active development) | Engineering |
| Output metrics | Quarterly (via community survey) | PM |
| Health metrics | Continuous (automated alerting in v1.7.1) | Engineering |

---

## Current Baseline (March 2026 — No Telemetry)

| Metric | Current Measurement | Method |
|---|---|---|
| North Star | Unknown — no telemetry | Establish via opt-in in v1.7.1 |
| FAIL-fix-rerun rate | System prompt enforces it; compliance unverified | SKILL.md + Gate enforcement; verify via user reports |
| Developer trust retention | Unknown | Establish via GitHub star trend, issue activity |
| Deprecated API regression rate | Unknown | Community survey Q2 2026 |

---

## The Metric That Would Tell Us We've Won

**At 94% reduction in deprecated-API regressions in AI-generated Android code
across a sample of 4,000+ developers:**

That number would mean the structural problem — AI generating confident, stale Android code
without any verification layer — has been solved for the population of developers using
documentation-grounded generation.

That is the outcome the product exists to achieve.
Not installs. Not GitHub stars. Not revenue.

The number of Android developers who shipped a regression they didn't know about
because an AI generated deprecated code with confidence:

**→ 0.**
