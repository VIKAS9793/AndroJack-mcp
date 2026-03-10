# User Personas
## AndroJack MCP — Who We're Building For

> Personas are grounded in real developer survey data (Stack Overflow 2025, n=49,000)
> and qualitative signals from AI hallucination postmortems in Android development.
> Updated: March 2026.

---

## Persona 01 — The Solo Android Builder

**Name:** Arjun  
**Role:** Indie Android developer, 3 years experience  
**Context:** Building his second app — a habit tracker targeting Android 14+ with Compose

### About Arjun

Arjun works alone, evenings and weekends. He has no senior engineer to review his PRs.
He trusts AI assistants because they're fast and confident. He's shipped one app and
is proud of it. He doesn't know that 40% of his navigation code is Nav2 in a project
that should be Nav3. He will find out when he tries to add a deep link and the API
isn't there.

### Goals

- Ship quickly without breaking things
- Stay current with Android without spending hours reading changelogs
- Build a reputation as someone who writes clean, modern Kotlin

### Frustrations

- AI gives confident answers about removed APIs — he has no way to know they're wrong
- Reading `developer.android.com` for every feature takes as long as writing the feature
- When his app gets rejected from Play Store for policy violations he didn't know existed,
  he has no error message that tells him what rule he broke
- He's shipped `TestCoroutineDispatcher` in two projects. His CI fails on every green-field repo

### Workflow

```
Idea → Ask AI → Copy code → Run app → Push to Play Store
        ↑
        No documentation check here
        No validation here
        No senior review here
```

### What Success Looks Like

- AI generates Nav3 code, not Nav2, without Arjun having to know the difference
- Every dependency version is live, not stale from 8 months ago
- Play Store compliance issues are flagged before submission, not after rejection
- When something fails, he gets the official bug link, not a hallucinated fix

### Quote

> "I copied the navigation code from the AI. It compiled. The app ran. Then six months
> later I tried to add shared element transitions and nothing worked. The API didn't exist.
> I'd been building on a deprecated foundation the whole time."

### Segment Size

Estimated 2.5M+ solo Android developers globally. Fastest-growing cohort of AI assistant users.

---

## Persona 02 — The Enterprise Android Lead

**Name:** Priya  
**Role:** Senior Android Engineer / Tech Lead at a 200-person fintech  
**Context:** Leading a team of 6 Android developers, shipping a regulated financial app

### About Priya

Priya has 8 years of Android experience. She knows the platform deeply. She's been burned
by AI-generated code making it past code review twice this quarter — both involving
deprecated APIs that her junior devs accepted because "the AI said it was correct."
She approved AI tooling adoption under pressure from her VP. Now she's the one who gets
paged when CI breaks.

### Goals

- Ensure no deprecated or removed APIs enter `main`
- Give her juniors a learning multiplier without increasing regression risk
- Demonstrate to her VP that AI adoption doesn't mean quality degradation

### Frustrations

- She can't review every AI-generated PR line by line — she has 47 open PRs
- AI tools give no provenance for the code they generate. "Where did this come from?"
- Google Play policy changes monthly. Her team misses them. One rejection cost two weeks
- Her junior devs can't distinguish a confident-but-wrong AI answer from a correct one
- No MCP server for Android before AndroJack treated her problem as real

### Workflow

```
Dev gets task → Asks AI → AI generates code → Dev opens PR
                                                 ↓
                              Priya reviews (too slow, too many PRs)
                                                 ↓
                                 Deprecated code sneaks through → CI fails
```

### What Success Looks Like

- Every AI-generated Android PR includes a tool-call log showing which docs were fetched
- `android_code_validator` PASS/WARN/FAIL shows up as a PR check
- Her juniors understand *why* a pattern is correct, not just that it is
- Android 16 compliance is checked automatically before her team begins migration

### Quote

> "I don't need the AI to be perfect. I need it to tell me when it's uncertain and
> show me where it got its answer. Right now it just generates code with the same
> confidence whether it's correct or 18 months out of date."

### Segment Size

Estimated 180,000+ Android tech leads and senior engineers in commercial teams globally.

---

## Persona 03 — The AI-Native Bootcamp Graduate

**Name:** Zara  
**Role:** Junior Android Developer, 8 months post-bootcamp  
**Context:** First full-time Android job at a startup, responsible for implementing features

### About Zara

Zara learned Android primarily through AI assistants. She's fast at translating product
requirements into working Compose code. She has very low signal on what is modern vs
what is legacy. Her bootcamp covered Kotlin fundamentals and basic Compose. It did not
cover `coroutines-test` migration, Navigation 3, or Android 16 compliance. She doesn't
know these are things she needs to know.

### Goals

- Deliver features that pass code review without embarrassment
- Learn Android idioms in context, not from abstract docs
- Build confidence that the code she ships is production-quality

### Frustrations

- Gets comments in code review like "this is deprecated, use X instead" — embarrassing
  because she had no way to know X existed
- The AI sometimes gives contradictory answers to the same question asked twice
- She has no framework for knowing when to trust the AI vs. verify independently

### Workflow

```
Product spec → Ask AI for implementation → AI generates code with explanation
                                            ↓
                  Submit PR → Code review flags deprecated API she didn't know about
                                            ↓
                                   Back to AI for fix → AI generates the same wrong code
```

### What Success Looks Like

- AI-generated code comes with a "why": inline citation + explanation of the pattern
- Deprecated patterns are blocked with an explanation of what to use instead and why
- She learns through the validator feedback, not through PR embarrassment

### Quote

> "When the AI told me to use `TestCoroutineDispatcher` I used it. My lead left a comment
> saying it was removed. I asked the AI why it told me to use something removed. It
> apologised and then gave me a different deprecated alternative."

### Segment Size

Estimated 300,000+ new mobile developers entering the market annually with AI-first training.

---

## Persona 04 — The Platform-Adjacent PM or Designer

**Name:** Marcus  
**Role:** Technical Product Manager at a mid-stage startup  
**Context:** Reviews technical feasibility of feature specs, occasionally reviews PRs for scope

### About Marcus

Marcus has a CS degree but hasn't written production Android in 4 years. He uses AI
assistants to understand technical tradeoffs when working with his engineering team.
He needs to be a credible partner in technical conversations — knowing when an AI
answer is plausible vs. when it's a hallucination. He's not the one shipping code,
but he's the one who signs off on timelines that assume the code is correct.

### Goals

- Understand what is technically feasible for Android in 2026
- Have enough signal to push back when an engineer says "the AI says we can do X"
- Avoid committing to timelines that are undermined by deprecated API migrations

### Frustrations

- No way to verify technical claims without the deep domain knowledge to evaluate them
- AI gives the same confident tone on correct and incorrect answers
- He's had two projects delayed by Play Store rejections he could have flagged earlier
  if he'd known about the compliance requirement

### Workflow

```
Feature idea → Ask AI about feasibility → AI gives confident answer
                                           ↓
               Marcus reports to stakeholders based on AI answer
                                           ↓
                  Engineering finds out the answer was wrong → timeline slips
```

### What Success Looks Like

- Clear PASS/WARN/FAIL signals he can interpret without deep Android knowledge
- Source citations he can open and read to verify claims independently
- Android 16 compliance surfaced early enough to factor into planning

### Quote

> "I need one signal: is this code based on current platform knowledge, or is the AI
> guessing? Right now I have no way to tell. I just have to trust the engineer."

### Segment Size

Estimated 80,000+ technical PMs and designer-engineers who work in the Android ecosystem
without being primary Android developers.

---

## Persona Summary Matrix

| | Arjun (Solo) | Priya (Lead) | Zara (Junior) | Marcus (PM) |
|---|---|---|---|---|
| **Primary job** | Ship features | Review quality | Implement features | Verify feasibility |
| **Biggest fear** | Play Store rejection | Regressions in production | PR embarrassment | Timeline slips |
| **AI trust level** | Very high | Skeptical | Very high | Moderate |
| **Android depth** | Intermediate | Expert | Beginner | Former intermediate |
| **Biggest gain** | Validation catches what he doesn't know | Audit trail + gate enforcement | Learning through feedback | Reliable feasibility signals |
| **Tier** | Primary | Primary | Primary | Secondary |
