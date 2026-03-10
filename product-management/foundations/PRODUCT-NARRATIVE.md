# Product Narrative
## AndroJack MCP — The Story We Tell

> This document captures the founding story, the villain, the hero arc,
> and the "future press release" working backward from the world we want to create.
> It is used for: pitch alignment, README tone, community posts, and team north star.

---

## Part 1 — The Founding Moment

There is a specific category of failure that accelerated the creation of AndroJack.

Not vague dissatisfaction. A specific moment, documented by a specific engineer.

In January 2026, a developer at Atomic Robot shared a case study. He had used both
Gemini and Claude — both with live internet access — to migrate an Android app from
Navigation 2 to Navigation 3. Navigation 3 had shipped its stable 1.0.0 release in
November 2025. Both AI agents, despite having internet access, used a stale release
candidate instead of the stable release. The developer lost hours untangling an
integration built on a foundation that no longer matched the real API.

This is not a story about AI being bad at writing code.

AI is very good at writing code.

This is a story about AI being trained on data that has a cutoff date — and having
no enforcement mechanism that says: *before you write this code, check whether what
you remember is still true.*

The Android platform releases major stable APIs every three to six months. Training
cycles are twelve to eighteen months. The gap is structural. It is not going away.
Every AI-generated Android project ships with invisible technical debt proportional
to the platform velocity that happened after the training cutoff.

**AndroJack is built on one premise: verification must happen at generation time,
not at review time, not at runtime, not at Play Store rejection time.**

---

## Part 2 — The Villain

The villain in this story is not AI. AI is a powerful tool.

The villain is the false confidence AI expresses when it doesn't know what it doesn't know.

It says `TestCoroutineDispatcher` with the same tone it says `viewModelScope.launch`.
Both look like correct Kotlin. One was removed eighteen months ago.

The villain is the **hallucination gap** — the structural, unavoidable gap between
training data and the live state of a fast-moving platform. For most domains this gap
is mild. For Android in 2025–2026 it is acute:

- Navigation 3 shipped stable November 2025
- Material 3 Expressive deprecated BottomAppBar and ContextualFlowRow
- Android 16 made orientation locking illegal on ≥600dp devices
- coroutines-test 1.8 removed TestCoroutineDispatcher
- AsyncTask was removed at API 33

Every one of these changes happened inside or after typical training cutoffs.
Every one of these changes, if missed, results in a real consequence:
CI failure, Play Store rejection, runtime crash, or production regression.

The villain exploits one specific moment in the developer workflow:

**The moment when a confident AI response bypasses the developer's verification instinct.**

Solo developers don't have a senior engineer to double-check. Juniors don't know
what questions to ask. Tech leads can't review every AI-generated line. PMs can't
tell confident-correct from confident-wrong.

The villain wins when nobody checks.

---

## Part 3 — The Hero's Tool

AndroJack is not the hero. The developer is the hero.

AndroJack is the tool that gives the hero what they were missing: a structural check
between "AI generated this" and "this enters my codebase."

Three layers. Three levels of protection.

**Level 1:** The tools are there. Call them when you need them.

**Level 2:** You must call them. The gate is in the system prompt. You cannot write
Android code without first fetching the relevant official documentation. The gate
fires on every task.

**Level 3:** The code is validated before it reaches you. Tool 21 — `android_code_validator`
— runs 22 rules across the output before it is returned. If the verdict is FAIL,
you never see the failing code. You see the fixed version, with the source cited.

This is not a workflow suggestion. It is an enforcement architecture.

The developer who uses AndroJack ships with the confidence that what they committed
was verified against current official documentation at the moment of generation.

Not after the PR. Not after the CI run. Not after the Play Store rejection.

**At generation time.**

---

## Part 4 — Future Press Release

*Written from the perspective of March 2027 — one year after v1.5.0 shipped.*

---

**FOR IMMEDIATE RELEASE**

### AndroJack MCP Reaches 100,000 Active Projects; Android Regressions from AI Generation Drop 94% in Community Survey

*The open-source MCP server that enforces documentation-grounded Android development
reports a year of developer impact data.*

**March 2027** — AndroJack MCP, the documentation-grounded Android engineering agent,
today published its first annual impact report showing 100,000 active projects across
solo developers, startups, and enterprise Android teams.

Community survey results across 4,200 developers:

- **94%** reported zero deprecated-API regressions in AI-generated code after adopting AndroJack
- **87%** of junior developers said they learned correct Android patterns from validator feedback
  — citing the inline explanations over code review comments as more effective learning
- **76%** of tech leads reported reduced time spent on Android-specific AI code review
- **61%** of solo developers said AndroJack prevented at least one Play Store rejection
  they would not have caught independently

The landmark moment came in August 2026, when Google Play's Android 16 / API 36 mandate
took effect. Apps targeting ≥600dp devices that hadn't removed orientation locks faced
immediate compliance review. Of projects using AndroJack:

> "Not a single project using AndroJack's `android_api36_compliance` tool failed
> the August 2026 Play Store compliance check," said the maintainer.
> "The tool had been flagging orientation locks since January 2026."

The product's Antigravity IDE integration — 11 purpose-built skills covering every
Android domain from architecture to XR to Wear OS — was cited as a turning point
in how teams use AI assistants for platform-specific development.

"The insight was simple," the maintainer said. "The problem isn't that AI writes bad code.
The problem is that AI writes confident code with no mechanism to check whether its
confidence is current. AndroJack adds that mechanism at the exact moment it matters:
generation time, not review time."

AndroJack MCP v2.0.0 ships next quarter with AST-based validation for structural absence
bugs — closing the final gap that text-pattern analysis cannot reach.

---

*AndroJack MCP is open source. MIT licensed. Not affiliated with or endorsed by Google LLC
or the Android Open Source Project.*

---

## Part 5 — The One Sentence

If AndroJack could say one sentence to every Android developer who reaches for an AI
assistant:

> **"Let me check if that's still true before you ship it."**

---

## Part 6 — What We Refuse to Be

Honesty is part of the brand.

We ship a clear section in every README, every agents.md, every SKILL.md:
*Here is what AndroJack cannot catch. Here is the right tool for that job.*

We do not claim to replace Lint, Detekt, paparazzi, Accessibility Scanner, or code review.
We claim to catch the specific class of error that text-pattern analysis at generation time
can catch — and to do it before the developer ever sees the code.

We are precise about the boundary.

A product that overpromises is the same villain with a different face.

We are not that product.
