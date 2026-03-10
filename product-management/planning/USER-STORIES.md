# User Stories
## AndroJack MCP — Epics, Stories, Acceptance Criteria

> Format: As a [persona], I want to [action], so that [outcome].
> Each story has acceptance criteria (Given/When/Then) and a priority rating.
> Priority: P0 (must-have, ships-with), P1 (high, next release), P2 (medium, roadmap)

---

## Epic 01 — Documentation Grounding

> Developer AI generates all Android code from live official documentation,
> not from training memory.

---

### Story 01.01 — Grounded Architecture Code
**Priority:** P0  
**Persona:** Arjun (Solo Builder), Priya (Lead)

> As an Android developer, I want the AI to fetch the official architecture guide
> before generating any ViewModel, repository, or state management code,
> so that I receive MVVM/MVI patterns that reflect the current Android Architecture Component APIs.

**Acceptance Criteria:**

```
Given I ask the AI to create a ViewModel with StateFlow
When the AI begins its response
Then it must first call architecture_reference("viewmodel") or kotlin_best_practices("stateflow-ui")
And the generated code must use StateFlow, not LiveData
And the code must include a citation to developer.android.com
And the code must pass android_code_validator with PASS or WARN
```

---

### Story 01.02 — Grounded Navigation Code
**Priority:** P0  
**Persona:** Arjun (Solo Builder), Zara (Junior Dev)

> As an Android developer building a new Compose app, I want the AI to use Navigation 3,
> so that I don't build on Navigation 2 APIs that will require rework when I add features
> only available in Nav3.

**Acceptance Criteria:**

```
Given I ask the AI to add navigation to a Compose project
When the AI generates navigation code
Then it must first call android_navigation3_guide("setup")
And the generated code must use NavDisplay, rememberNavBackStack, and NavKey
And the generated code must NOT contain rememberNavController() or NavHost()
And the code must pass android_code_validator with PASS or WARN
```

---

### Story 01.03 — Live Dependency Versions
**Priority:** P0  
**Persona:** Arjun (Solo Builder), Priya (Lead)

> As a developer, I want every Gradle dependency the AI recommends to have a version fetched
> live from Google Maven, so that I don't add stale versions that are months behind the current release.

**Acceptance Criteria:**

```
Given I ask the AI to add a Compose BOM, Hilt, or Room dependency
When the AI writes the build file
Then it must first call gradle_dependency_checker for each dependency
And the version written to libs.versions.toml must match the live result, not be hardcoded
And the build file must use platform() for BOM dependencies
And kapt must not appear — only ksp()
```

---

## Epic 02 — Level 3 Code Validation

> No deprecated or removed Android API reaches the developer's clipboard.

---

### Story 02.01 — Validator Blocks Removed APIs
**Priority:** P0  
**Persona:** All

> As a developer, I want the AI to refuse to return any code containing removed Android APIs
> (AsyncTask, TestCoroutineDispatcher, etc.), so that I never accidentally commit code
> that will fail to compile or crash at runtime.

**Acceptance Criteria:**

```
Given the AI has generated code containing AsyncTask
When android_code_validator runs
Then the verdict must be FAIL
And the violation must include: rule REMOVED_ASYNCTASK, line number, snippet, and replacement
And the AI must NOT return the FAIL code to me
And the AI must fix the violation (use viewModelScope.launch) and re-run validation
And only the PASS code is returned, with the fix cited
```

---

### Story 02.02 — Validator Flags Android 16 Violations
**Priority:** P0  
**Persona:** Priya (Lead), Marcus (PM)

> As an Android developer targeting API 36, I want the validator to flag manifest orientation
> locks before I submit to Play Store, so that I don't get rejected for a compliance
> violation I didn't know about.

**Acceptance Criteria:**

```
Given the AI has generated a manifest with android:screenOrientation="portrait"
When android_code_validator runs with targetSdk=36
Then the verdict must be FAIL
And the violation must include rule XML_SCREEN_ORIENTATION_LOCK with the Play Store deadline
And the AI must remove the attribute and explain the adaptive layout alternative
And the fixed manifest must pass re-validation
```

---

### Story 02.03 — Validator Provides Actionable Replacements
**Priority:** P0  
**Persona:** Zara (Junior Dev)

> As a junior developer, I want the validator to tell me not just what's wrong but
> what to use instead, so that I learn correct patterns rather than just being blocked.

**Acceptance Criteria:**

```
Given the validator detects DEPRECATED_NAV_CONTROLLER_NEW_CODE
When the violation is reported
Then it must include:
  - The rule ID
  - The deprecated API identified
  - The replacement API (rememberNavBackStack, NavDisplay)
  - A documentation URL (developer.android.com/guide/navigation/navigation-3)
And the AI's inline explanation must reference the reason for deprecation, not just the name
```

---

## Epic 03 — Crash Triage

> Crash analysis grounded in the official Android issue tracker.

---

### Story 03.01 — Stacktrace to Issue Tracker
**Priority:** P0  
**Persona:** Arjun (Solo Builder)

> As a developer debugging a crash, I want the AI to query issuetracker.google.com
> before proposing a fix, so that I apply a known, official workaround rather than
> a plausible-sounding guess.

**Acceptance Criteria:**

```
Given I paste a stacktrace to the AI
When the AI analyzes it
Then it must call android_debugger with the relevant error class or message
And if a known issue exists, it must return the issue tracker URL and status
And the proposed fix code must be validated through android_code_validator
And the fix code must include an inline citation
```

---

## Epic 04 — Android 16 / API 36 Compliance

> Every app the AI touches is ready for the August 2026 Play Store mandate.

---

### Story 04.01 — Proactive Compliance Check
**Priority:** P0  
**Persona:** Priya (Lead), Marcus (PM)

> As a developer, I want the AI to proactively check API 36 compliance when working
> on manifest files or large-screen layouts, so that compliance gaps are caught in
> development, not in Play Store review.

**Acceptance Criteria:**

```
Given I ask the AI to work on AndroidManifest.xml or a large-screen layout
When the AI processes the task
Then it must call android_api36_compliance before generating manifest content
And any orientation lock or resizability flag must be flagged as a FAIL violation
And the response must include the August 2026 Play Store deadline
And the fixed manifest must use adaptive layout approaches, not orientation locks
```

---

## Epic 05 — Antigravity Skills Integration

> AndroJack's 21 tools and gate are discoverable and usable in Antigravity IDE.

---

### Story 05.01 — On-Demand Skill Loading
**Priority:** P0  
**Persona:** Arjun (Solo Builder), Priya (Lead)

> As an Antigravity IDE user, I want AndroJack skills to load only when relevant to my
> current task, so that unrelated procedural context doesn't clog the agent's context window.

**Acceptance Criteria:**

```
Given the android-navigation skill is in .agent/skills/
When I ask "how do I navigate between screens"
Then Antigravity must semantically match to the android-navigation skill description
And load only that skill's SKILL.md into context
And NOT load android-testing, android-dependencies, or other unrelated skills
And the response must use Nav3 patterns from the skill's Instructions section
```

---

### Story 05.02 — agents.md Always-On Gate
**Priority:** P0  
**Persona:** All

> As an Antigravity user, I want agents.md to always enforce the Grounding Gate,
> regardless of which Skill is loaded, so that the Level 2 and Level 3 gates
> apply to every session without any developer configuration.

**Acceptance Criteria:**

```
Given agents.md is present at the project root
When any Android code generation task begins
Then the agent must follow the Grounding Gate steps 1–8 from agents.md
And Step 8 (android_code_validator) must run before any code is returned
And this must hold even when no domain Skill is explicitly activated
```

---

## Story Prioritisation Summary

| Story | Priority | Persona | Epic | Status |
|---|---|---|---|---|
| 01.01 Grounded architecture | P0 | Arjun, Priya | Grounding | ✅ Shipped |
| 01.02 Nav3 code | P0 | Arjun, Zara | Grounding | ✅ Shipped |
| 01.03 Live dependency versions | P0 | Arjun, Priya | Grounding | ✅ Shipped |
| 02.01 Validator blocks removed APIs | P0 | All | Validation | ✅ Shipped |
| 02.02 Validator flags API 36 violations | P0 | Priya, Marcus | Validation | ✅ Shipped |
| 02.03 Validator provides replacements | P0 | Zara | Validation | ✅ Shipped |
| 03.01 Stacktrace → issue tracker | P0 | Arjun | Crash triage | ✅ Shipped |
| 04.01 Proactive compliance check | P0 | Priya, Marcus | API 36 | ✅ Shipped |
| 05.01 On-demand skill loading | P0 | Arjun, Priya | Antigravity | ✅ Shipped |
| 05.02 agents.md always-on gate | P0 | All | Antigravity | ✅ Shipped |

### Backlog (P1 — Next Release)

| Story | Summary |
|---|---|
| 06.01 | AST-based absence detection (missing `wrapContentHeight`, missing `try/catch`) |
| 06.02 | `MISSING_CONTENT_DESCRIPTION` rule in validator |
| 06.03 | Opt-in telemetry: rule-hit frequency reporting via MCPcat |
| 06.04 | `android_code_validator` streaming feedback (rule hits reported as found, not batched) |
| 06.05 | Android Studio HTTP transport re-enablement (deferred from v1.5.0) |
