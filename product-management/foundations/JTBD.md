# Jobs to Be Done
## AndroJack MCP

> JTBD answers: "What progress is the customer trying to make in their life or work?"
> Format: When [situation] + I want to [motivation] + So I can [expected outcome]
> Each job has functional, emotional, and social dimensions.

---

## Framework Applied

Andy Clement (Google, Atomic Robot case study, Jan 2026) described testing Gemini and
Claude with internet access on a Nav2 → Nav3 migration. Both agents used an outdated
release candidate instead of the stable release. The developer's job was not
"generate navigation code." It was "make progress on my Android app with confidence
that the output will not fail in review or at runtime."

JTBD lets us distinguish the surface request from the real job.

---

## Core Jobs

---

### JTBD-01 — Confidence Gate

**Job Statement:**
> When I use an AI assistant to write Android code,
> I want to know whether the output is based on current platform documentation,
> so I can commit it to main without fear of a deprecated-API surprise in CI, code review, or Play Store review.

**Functional Dimension**
- Check every API class against the live deprecation registry
- Check every dependency version against Google Maven
- Validate generated code against a known ruleset before returning it

**Emotional Dimension**
- Feel confident, not anxious, when submitting an AI-generated PR
- Not feel embarrassed in code review for using a removed API
- Not feel betrayed when confident AI output fails in production

**Social Dimension**
- Be seen by my team as someone who doesn't introduce deprecated code
- For leads: maintain credibility as someone whose team produces quality output
- For juniors: be taken seriously in code review

**Current Alternatives (why they fail)**
- "Just verify manually" — developer doesn't know what to verify
- "Run Lint" — doesn't catch semantic patterns (GlobalScope, wrong Nav version)
- "Use Google's MCP" — retrieval only, no enforcement, generalist scope

**Outcome Metrics**
- Zero FAIL-verdict code blocks returned to user
- Inline citation present on every code block
- Developer can point to a source URL in a code review comment

---

### JTBD-02 — Time-to-Current Knowledge

**Job Statement:**
> When the Android platform releases a new stable API (Navigation 3, API 36, M3 Expressive),
> I want my AI assistant to know about it and use it correctly immediately,
> so I don't spend time migrating code that should never have been written against the old API.

**Functional Dimension**
- AI calls live documentation tools before generating code
- Navigation 3 used for new projects immediately after its stable release
- Android 16 constraints applied from day one, not after a Play Store rejection

**Emotional Dimension**
- Not feel stuck rebuilding from scratch because the AI was 18 months behind
- Feel like I'm working with a knowledgeable partner, not a well-spoken fossil

**Social Dimension**
- Ship work that colleagues recognise as modern Android, not legacy
- Not have a senior engineer say "this is the old way of doing it"

**Current Alternatives (why they fail)**
- Training cutoffs mean AI models are always behind
- Developer can't know what they don't know to ask the right question

**Outcome Metrics**
- Nav3 used in all new Compose navigation tasks (zero Nav2 regressions)
- API 36 compliance checked automatically for all manifest/layout tasks
- BOM version fetched live (not hardcoded from training data)

---

### JTBD-03 — Safe Delegation

**Job Statement:**
> When I am a tech lead and my team is using AI to ship Android code at speed,
> I want a structural gate that prevents my juniors from merging deprecated or removed APIs,
> so I can let the team move fast without personally reviewing every AI-generated line.

**Functional Dimension**
- Grounding Gate enforced on every code generation task
- FAIL verdict code blocks never reach the developer's clipboard
- Tool call provenance log available to show in PR

**Emotional Dimension**
- Not feel like I'm trading speed for quality
- Not feel anxious every time a junior merges an AI-generated PR
- Feel like I've installed a safety net, not just hoped for the best

**Social Dimension**
- Demonstrate to my VP that AI adoption hasn't compromised engineering standards
- Be the lead who found and installed a solution, not the one who let a problem compound

**Current Alternatives (why they fail)**
- Code review is too slow and reviewer-dependent to catch all AI hallucinations
- Lint runs post-generation, not inline during generation

**Outcome Metrics**
- Team ships zero deprecated-API regressions in AI-generated PRs
- Lead can see "validated by android_code_validator" in the PR description
- Junior developer learns correct patterns through validator feedback

---

### JTBD-04 — Crash Triage without Guessing

**Job Statement:**
> When I have a crash or stacktrace and I ask the AI to fix it,
> I want the AI to query the official Android issue tracker before proposing a fix,
> so I don't apply a hallucinated workaround that masks the real problem.

**Functional Dimension**
- `android_debugger` parses the stacktrace against the official issue tracker
- Returns: known issue status, affected versions, official workaround or fix
- Generated fix code is validated through `android_code_validator`

**Emotional Dimension**
- Not feel like I'm applying random patches from a confident-sounding AI
- Feel like I'm debugging with someone who has read the bug report database

**Social Dimension**
- In incident retrospectives: show that the fix was grounded in official sources

**Current Alternatives (why they fail)**
- Generic AI gives plausible-sounding fix with no provenance
- Stack Overflow has low signal-to-noise on Android-specific bugs
- Google search requires developer to already understand the error class

**Outcome Metrics**
- Crash fix sourced from `issuetracker.google.com` or `developer.android.com`
- Zero "fix-the-fix" cycles from hallucinated workarounds

---

### JTBD-05 — Play Store Compliance Without Surprise

**Job Statement:**
> When I am preparing a release,
> I want to know which Play Store policy requirements and Android API mandates apply to my app,
> so I don't get rejected after weeks of work on a requirement I didn't know existed.

**Functional Dimension**
- `android_play_policy_advisor` queried for any manifest, permission, or targeting change
- `android_api36_compliance` verifies Android 16 readiness
- August 2026 Play Store deadline surfaced proactively in relevant tasks

**Emotional Dimension**
- Not feel blindsided by a rejection after a major release
- Feel prepared, not reactive, about compliance

**Social Dimension**
- As a solo developer: maintain a 5-star app without knowing every policy page
- As a PM: give stakeholders accurate compliance timelines

**Outcome Metrics**
- Zero Play Store rejections for issues that `android_play_policy_advisor` covers
- August 2026 API 36 deadline flagged for any new project started before Q2 2026

---

## Underserved Job Map

| Job | Current Best Alternative | Why It Fails | AndroJack's Bet |
|---|---|---|---|
| Confidence gate | Run Lint | Doesn't catch semantic/pattern issues | Level 3 validator + gate |
| Time-to-current knowledge | Search docs manually | Slow, developer doesn't know what to search | Doc-fetch-first architecture |
| Safe delegation | Senior code review | Doesn't scale, reviewer-dependent | Structural enforcement in generation |
| Crash triage | Generic AI answer | No provenance, hallucinated workarounds | `android_debugger` → issue tracker |
| Play Store compliance | Read policy pages | Developer doesn't know which pages are relevant | `android_play_policy_advisor` |

---

## Anti-Jobs (What Users Do NOT Hire Us For)

These are jobs users explicitly do NOT want us to do:

- ❌ Replace their existing Lint, Detekt, or KtLint pipeline
- ❌ Make architectural decisions for them without explanation
- ❌ Generate code silently without showing sources
- ❌ Require an internet connection to validate already-known rules
- ❌ Add latency to simple non-Android tasks (the gate only fires on Android code)
