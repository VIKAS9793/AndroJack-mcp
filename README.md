<div align="center">

<img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
<img src="https://img.shields.io/badge/Kotlin-7F52FF?style=for-the-badge&logo=kotlin&logoColor=white" />
<img src="https://img.shields.io/badge/MCP-Protocol-blueviolet?style=for-the-badge" />

# 🤖 AndroJack — The Jack of All Android Trades

![AndroJack Banner](https://raw.githubusercontent.com/VIKAS9793/AndroJack-mcp/main/assets/AndroJack%20banner.png)

### 🎬 Discover AndroJack

[![Official Product Page](https://img.shields.io/badge/Product-Landing%20Page-00C7B7?style=for-the-badge)](https://androjack-web.netlify.app/)
[![Watch AndroJack in Action on YouTube](https://img.shields.io/badge/YouTube-Watch%20Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/O2aFyObV-B0)

### *An MCP server that equips your AI coding assistant with live, verified Android knowledge — so it builds from official sources, not from memory.*

<br/>

[![npm version](https://img.shields.io/npm/v/androjack-mcp?color=0A7AFF&style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/androjack-mcp)
[![Website](https://img.shields.io/badge/Website-androjack--web.netlify.app-0A7AFF?style=flat-square&logo=netlify&logoColor=white)](https://androjack-web.netlify.app)
[![VS Code](https://img.shields.io/visual-studio-marketplace/v/VIKAS9793.androjack-vscode?color=0A7AFF&style=flat-square&logo=visual-studio-code&label=VS%20Code)](https://marketplace.visualstudio.com/items?itemName=VIKAS9793.androjack-vscode)
[![GitHub stars](https://img.shields.io/github/stars/VIKAS9793/AndroJack-mcp?style=flat-square&logo=github&color=0A7AFF)](https://github.com/VIKAS9793/AndroJack-mcp/stargazers)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![MCP Spec](https://img.shields.io/badge/MCP-2025--11--25-blueviolet?style=flat-square)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tools](https://img.shields.io/badge/tools-21-orange?style=flat-square)](#-the-21-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Android API](https://img.shields.io/badge/Android-API%2021--36-34A853?style=flat-square&logo=android)](https://developer.android.com)

### 🚀 One-Click Install

[![Install in VS Code](https://img.shields.io/badge/Install%20in-VS%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)](https://marketplace.visualstudio.com/items?itemName=VIKAS9793.androjack-vscode)
[![Install in Claude Desktop](https://img.shields.io/badge/Install%20in-Claude%20Desktop-D97706?style=for-the-badge&logo=anthropic&logoColor=white)](https://claude.ai/integrations/install-mcp?params=eyJuYW1lIjoiYW5kcm9qYWNrIiwiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJhbmRyb2phY2stbWNwQDEuNi4wIl19)
[![Install in Cursor](https://img.shields.io/badge/Install%20in-Cursor-000000?style=for-the-badge&logo=cursor&logoColor=white)](https://cursor.com/install-mcp?name=androjack&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImFuZHJvamFjay1tY3BAMS42LjAiXX0=)
[![Add to Kiro](https://img.shields.io/badge/Add%20to-AWS%20Kiro-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://kiro.dev/launch/mcp/add?name=androjack&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22androjack-mcp%401.6.0%22%5D%7D)
[![View on npm](https://img.shields.io/badge/View%20on-npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/androjack-mcp)

**VS Code distribution:** AndroJack MCP is also live on the VS Code Marketplace as [AndroJack MCP for VS Code](https://marketplace.visualstudio.com/items?itemName=VIKAS9793.androjack-vscode). The `VS Code` badge above always reflects the currently published Marketplace version.

**PM / APM docs:** Product strategy, JTBD, personas, roadmap, user stories, competitive analysis, and GTM materials now live under [product-management/README.md](product-management/README.md).

## Connector Review Path

For Anthropic connector review or any fast due-diligence pass, start here before the longer narrative sections below:

- [What AndroJack Is Not](#what-androjack-is-not)
- [Quick Start](#-quick-start--zero-install-required)
- [Examples](#-examples)
- [Privacy Policy](#-privacy-policy)
- [Infrastructure & Rate Limiting](#-infrastructure--rate-limiting)
- [FAQ](#-faq)
- [Troubleshooting](#-troubleshooting)

<br/>

**Also works with:** Windsurf · VS Code Copilot · Google Antigravity · JetBrains AI — see [Manual Config](#-manual-config--copy--paste) below ↓

<br/>

</div>

---

## 🔥 The Crisis That Created This Tool

In 2025, the Stack Overflow Developer Survey asked 49,000 developers about their experience with AI coding tools. The results should alarm every Android engineer:

- **84%** of developers now use AI coding tools — up from 76% the year before
- **Trust in AI accuracy collapsed from 40% to just 29%** in a single year
- **35% of all Stack Overflow visits** in 2025 are now triggered by developers debugging and fixing AI-generated code

The gap between usage and trust is not a coincidence. It is the product of a structural problem: **AI models predict tokens, not APIs.** They were trained on a snapshot of the world and have no mechanism to know what changed at API 30, what shipped at Google I/O 2025, or what Google Play now rejects at review time.

For Android developers, this failure mode is uniquely dangerous. Android has the fastest-moving ecosystem in mobile development — a new Compose BOM every month, Navigation 3 going stable after seven years of Nav2, Android 16 rewriting the rules on screen orientation locking — and most AI tools have training data that is six months to two years stale by the time you use them.

**The result is not just bad code. It is confidently bad code.**

---

## ⚡ What Actually Breaks In Practice — Documented Evidence

These are not hypothetical risks. They are documented failure modes from real developer projects.

### The Navigation 3 Hallucination (January 2026)

A published case study from Atomic Robot documented a live Navigation 2 → Navigation 3 migration using both Gemini and Claude — with internet access enabled on both. The conclusion, verbatim:

> *"LLMs still hallucinate versions. Even with internet access, both agents wanted to use an outdated release candidate instead of the stable 1.0.0 release."*

Navigation 3 went **stable in November 2025** after seven years of the same library. It is a complete architectural rethink: back stacks are now plain Kotlin lists, the monolithic nav graph is gone, and `NavDisplay` replaces `NavController`. Google's own migration guide is so aware that AI tools get this wrong that it now contains special **"AI Agent:"** annotations — instructions embedded directly in the official docs for AI tools to follow. An AI tool that generates Nav2 code for a new Compose project in 2026 is not making a small mistake. It is creating an architectural incoherence that requires a full rewrite to fix.

### The Compose Deprecation Treadmill

Jetpack Compose ships a new BOM every month. Since most models' training cutoffs, these APIs changed:

| API | Status | What goes wrong |
|-----|--------|----------------|
| `ContextualFlowRow` / `ContextualFlowColumn` | **Deprecated in Compose 1.8** | AI still generates them — compile warning today, removal tomorrow |
| `TestCoroutineDispatcher` | **Removed from coroutines-test 1.8+** | AI still generates it — causes non-deterministic test failures in CI |
| `FlowRow overflow` parameter | **Deprecated in 1.8** | Subtle behavioral regression at runtime, silent in most linting setups |
| `AnchoredDraggableState.confirmValueChange` | **Deprecated** | Incorrect drag behavior at anchor boundaries |
| Navigation 2 in new projects | **Superseded by Nav3 stable Nov 2025** | Architectural dead-end that requires a rewrite to fix |

Every one of these compiles. Most run without errors. The bugs surface later in CI flakiness, UI regressions, or Play Store review failures — and the developer has no idea the AI was confidently wrong.

### The Android 16 / API 36 Mandate (August 2026 deadline)

Android 16 made a platform-level change affecting every published app: **on devices ≥600dp — tablets, foldables, ChromeOS — apps can no longer lock screen orientation or restrict resizability.** Google Play requires API 36 targeting by **August 2026**.

An AI tool generating `android:screenOrientation="portrait"` or `android:resizeableActivity="false"` today is generating code that will trigger App Compatibility warnings in Play Console, fail large-screen quality checks, and get apps demoted in Play Store search results.

The business impact is not theoretical:

> **Foldable users spend 14× more on apps than phone-only users. Tablet + phone users spend 9× more. FlipaClip saw 54% growth in tablet users within four months of going adaptive.**

### The KMP Silent Failure

Kotlin Multiplatform went mainstream in 2025 — over 900 new KMP libraries published, Room added KMP support, companies now hire specifically for KMP skills. When a developer on a KMP project asks an AI tool to add database support, the AI generates Android-only Room code. It compiles. It runs perfectly on Android. The iOS build fails. The developer spends hours debugging before realizing the root cause: their AI tool does not know KMP exists.

---

## 🧩 What AndroJack Does

AndroJack is a **documentation-grounded Android engineering MCP server**. It gives your AI coding assistant 21 specialized tools that fetch live, verified answers from official Android and Kotlin sources — instead of predicting from stale training data.

> **It does not make the AI smarter. It makes the AI accountable to evidence.**

**Think of it as a pre-build linter for LLMs.** While other tools retrieve documentation, AndroJack acts as a strict architectural gatekeeper.

```
Without AndroJack:   You ask → AI predicts from stale weights → Code (possibly wrong)

With AndroJack:      You ask → AI calls tool → Tool fetches official source live
                              → AI reads verified answer → Code (grounded)
```

## What AndroJack Is Not

AndroJack is a verification layer, not a code generator.

It does not:
- generate full Android apps on its own
- modify your project files
- execute shell commands in your environment
- access your local filesystem
- replace reading official documentation
- answer general programming questions outside Android and Kotlin verification

It does:
- query official Android and Kotlin sources
- check whether APIs and libraries are current, deprecated, or removed
- validate generated code against Android-specific rules
- return grounded references, version checks, and static rule results

### ⚠️ Honest Activation Model — Two Levels

This is the most important thing to understand before you install AndroJack:

| Level | What's Active | What the AI Does |
|---|---|---|
| **Level 1** — Tools only installed | 21 tools registered in IDE | AI *may* call the right tool. Depends on the IDE and the AI's judgment. |
| **Level 2** — Tools + Grounding Gate prompt loaded | 21 tools + pre-generation rulebook | The prompt steers the AI toward the relevant tool before it writes Android code. |
| **Level 3** — Level 2 + `android_code_validator` | Full loop: fetch → generate → validate → fix | The recommended workflow validates each generated Android code block against 24 Android-specific rules before it is returned. |

**Level 1 is passive.** The tools are available but the AI decides when to use them. An AI building a Compose screen may call `architecture_reference` but skip `material3_expressive` — and ship M3E violations silently.

**Level 2 is active.** The `androjack_grounding_gate` system prompt maps each task type to the relevant tool. Building Compose UI points the model toward `material3_expressive`. Adding a dependency points it toward `gradle_dependency_checker`.

**Level 3 is the loop-back.** `android_code_validator` runs on every code block the AI generates before returning it to the user. It applies 24 rules covering removed APIs, deprecated patterns, and Android 16 compliance. A `FAIL` verdict means the code should be fixed and re-validated before delivery.

→ **For the strongest grounding, activate Level 2 + Level 3 together.** See [Getting the Full Guarantee](#-getting-the-full-guarantee) below.

---

### 🪲 What Can Still Break — Even at Level 3

> [!IMPORTANT]
> **AndroJack is a documentation-grounding and API-validation tool. It is not a Compose layout engine, a design system enforcer, or a runtime renderer.** Level 3 catches removed APIs and deprecated patterns. It cannot catch every class of Android bug. This is not a limitation of AndroJack — it is a fundamental property of static text analysis applied to a visual, runtime-rendered UI framework.

The following bugs were encountered in a real Android app built with AndroJack at Level 2 (v1.4.0). They are documented here honestly so you know exactly what to watch for — and where to reach for different tools.

#### ✅ What Level 3 Catches

These are the bugs AndroJack was designed to prevent. The rule engine fires on these:

```kotlin
// ❌ REMOVED — android_code_validator fires: REMOVED_ASYNCTASK
class MyTask : AsyncTask<Void, Void, String>()

// ❌ REMOVED — fires: REMOVED_TEST_COROUTINE_DISPATCHER
val dispatcher = TestCoroutineDispatcher()

// ❌ DEPRECATED — fires: DEPRECATED_CONTEXTUAL_FLOW_ROW
ContextualFlowRow { Text("hello") }

// ❌ LEAK — fires: GLOBALSCOPE_LAUNCH
GlobalScope.launch { fetchData() }

// ❌ ANDROID 16 — fires: XML_SCREEN_ORIENTATION_LOCK
// android:screenOrientation="portrait"
```

---

#### ⚠️ What Level 3 Cannot Catch — And Why

> [!WARNING]
> The following bugs were found in a real project. They are **valid, API-current Compose code that violates design system constraints, accessibility minimums, or architectural boundaries**. Static text scanning cannot detect them. This is not a gap in AndroJack — it requires a different tool class at a different layer of your quality stack.

---

**Bug PH-UI-001 — Segmented button text truncation**

```kotlin
// Compiles and runs. Level 3 sees no violation.
// The bug: Text inside MultiChoiceSegmentedButtonRow truncates
// ("Ligh t", "Drai ned") because a fixed height modifier prevents
// the Roboto Flex variable font from expanding the container.

MultiChoiceSegmentedButtonRow {
    SegmentedButton(/* fixed height modifier */) {
        Text("Light")  // truncates at runtime on variable font sizes
    }
}

// Fix: Replace fixed height with Modifier.wrapContentHeight() + heightIn(min = 48.dp)
```

> [!NOTE]
> **This is an absence bug.** The correct modifier is missing — no wrong one is present. RegExp pattern matching detects patterns that exist in code. Absence is significantly harder for static analysis to detect and often requires structural rules or runtime validation rather than text-level pattern matching.

---

**Bug PH-UI-003 — Disabled button contrast failure**

```kotlin
// Correct Material 3 API. Level 3 sees no violation.
// The bug: disabled state colours fail WCAG AA 4.5:1 contrast ratio
// against the dark theme surface — but only visible when rendered.

Button(enabled = false, onClick = {}) {
    Text("INITIALIZE VAULT")  // illegible dark grey on dark grey surface
}

// Fix: Override ButtonDefaults.buttonColors(
//     disabledContainerColor = ...,
//     disabledContentColor = ...
// ) to achieve minimum 4.5:1 against MaterialTheme.colorScheme.surface
```

> [!NOTE]
> **This is a runtime visual property bug.** A 4.5:1 contrast ratio only exists when the theming engine renders against a surface colour. Contrast validation requires rendering or screenshot-based testing rather than source text analysis. Use `paparazzi` screenshot tests or Google's Accessibility Scanner.

---

**Bug PH-AR-004 — Raw stack trace rendered to end user**

```kotlin
// The AI generated a ViewModel without catching the domain exception.
// Level 3 fires only if a flagged API (e.g. GlobalScope) caused the leak.
// A plain missing try/catch produces no pattern match.

class VaultViewModel : ViewModel() {
    fun initializeVault() {
        viewModelScope.launch {
            val result = repository.initialize()
            // Missing try/catch — LiteRT exception propagates to UI
            _uiState.value = UiState.Success(result)
        }
    }
}
// What the user saw: "LiteRT initialization failed: ByteBuffer is not a
// valid TensorFlow Lite model flatbuffer" — raw crash text in the UI.

// Fix: Wrap in try/catch, emit UiState.Error with a user-friendly string resource.
```

> [!WARNING]
> **UDF architecture boundary violations require architectural linting, not API pattern matching.** A missing `try/catch` has no detectable pattern. Use [Detekt](https://detekt.dev) with custom architecture rules, or write a ViewModel unit test that verifies exception mapping to `UiState.Error`.

---

**Bug PH-UX-008 — Consent checkbox tap target too small**

```kotlin
// Valid Compose code. Level 3 sees no violation.
// The bug: Modifier.toggleable scoped to the Checkbox icon only —
// tappable area is ~24dp instead of the required 48dp minimum.

Row {
    Checkbox(
        checked = isChecked,
        onCheckedChange = { isChecked = it }  // toggleable on icon only
    )
    Text("I agree to the terms")  // not tappable — users miss the target
}

// Fix: Hoist Modifier.toggleable to the parent Row.
// The entire Row (icon + text) becomes the touch target.
```

> [!NOTE]
> **Structural placement bugs require AST-level analysis.** The API is used correctly — in the wrong structural position. Detecting this requires understanding the composable tree, not the line in isolation. This is on the roadmap for a future `android_code_validator` AST extension.

---

**Bug PH-UI-009 — Scaffold inner padding ignored**

```kotlin
// Compiles and runs. Bottom content scrolls behind the navigation bar.
// Level 3 sees no violation — all APIs are correct and current.

Scaffold { innerPadding ->
    LazyColumn(
        // Missing: contentPadding = innerPadding
    ) {
        items(data) { ItemRow(it) }  // bottom items cut off by BottomAppBar
    }
}

// Fix: LazyColumn(contentPadding = innerPadding)
```

> [!NOTE]
> **Unused-variable class bugs require data-flow analysis.** `innerPadding` is captured but never consumed. Android Lint's `UnusedVariable` rule and Android Studio's own live inspector flag this. It is not in scope for MCP-layer validation.

---

### 🗂️ Defence-in-Depth: The Right Tool for Each Bug Class

> [!IMPORTANT]
> AndroJack is one layer in a quality stack. Each layer catches what only it can catch. No single tool covers all four.

| Bug Class | Real Example | Right Tool |
|---|---|---|
| Removed / deprecated API | `AsyncTask`, `TestCoroutineDispatcher`, `ContextualFlowRow` | ✅ **AndroJack Level 3** |
| Android 16 manifest violations | `screenOrientation`, `resizeableActivity=false` | ✅ **AndroJack Level 3** |
| Architecture violation (flagged root cause) | `GlobalScope` leaking to UI | ✅ **AndroJack Level 3** |
| Absent modifier / missing constraint | PH-UI-001 (wrapContentHeight), PH-UI-009 (innerPadding) | 🔧 Android Lint / IDE inspector |
| Runtime contrast / colour failures | PH-UI-003 (disabled button WCAG) | 🔧 `paparazzi` + Accessibility Scanner |
| Touch target violations | PH-UI-002, PH-UX-008 | 🔧 Accessibility Scanner |
| Structural placement (wrong hierarchy) | PH-UX-008 (toggleable on wrong composable) | 🔧 Android Lint / future AST rule |
| Architecture boundary (missing try/catch) | PH-AR-004 (stack trace to UI) | 🔧 Detekt + ViewModel unit tests |
| M3 design system aesthetic | PH-UI-007 (corner radius), PH-UI-006 (casing) | 🔧 Design review / Figma handoff |

---

### Why MCP Is Not at Fault for Any of This

> [!NOTE]
> **MCP is a transport protocol.** It specifies how an AI client and a tool server exchange structured messages — nothing more. Blaming MCP for not catching a missing `contentPadding` in `DropdownMenuItem` is equivalent to blaming TCP/IP for a badly designed website. The protocol carried the message correctly.
>
> Anthropic donated MCP to the Linux Foundation in December 2025 — co-founded with OpenAI, Block, Google, Microsoft, and AWS — precisely because a neutral protocol does not encode domain-specific rules. HTTP does not enforce WCAG. gRPC does not enforce Material 3. MCP does not enforce Compose modifier semantics. That is what makes it universal. AndroJack exists as a specialised layer *on top of* MCP — it is not a replacement for runtime testing, accessibility auditing, or design system review.

---

<div align="center">

## 🎯 The Killer Argument

<img src="https://raw.githubusercontent.com/VIKAS9793/AndroJack-mcp/main/assets/killer_argument.png" alt="The Killer Argument — AndroJack MCP" width="100%" />

<br/>

### *"Can your `agents.md` file tell me the Gradle version that shipped last Tuesday?"*

<br/>

> **No markdown file can.**
> **No rules in `.cursorrules` can.**
> **No `SKILL.md` can.**

<br/>

### ✅ Only a live tool call can.

**That's the job AndroJack exists to do — and nothing else in the current ecosystem does it for Android specifically.**

<br/>

| What you need | `agents.md` / SKILL.md | **AndroJack MCP** |
|---|:---:|:---:|
| Format output a specific way | ✅ Perfect | Works too |
| Follow team conventions | ✅ Perfect | Works too |
| **Latest Gradle version right now** | ❌ Guesses from memory | **✅ Fetches live** |
| **Is `AsyncTask` removed?** | ❌ May be wrong | **✅ Verified against SDK** |
| **Android 16 Play Store rules** | ❌ Post-training — unknown | **✅ Official source** |

<br/>

> Prompt engineering controls *how* the AI responds.
> **MCP controls *what* the AI knows.**

</div>

---

## 🧠 Why MCP — Not Prompt Engineering, agents.md, or RAG

> *This is the most important section if you are evaluating whether to use this.*

<details>
<summary><strong>📌 What is Prompt Engineering / agents.md / SKILL.md?</strong></summary>

Prompt engineering means writing instructions into a system prompt or a markdown file (`agents.md`, `SKILL.md`, `CLAUDE.md`, `.cursorrules`, etc.) that tell the AI how to behave.

**What it does well:**
- Sets tone, persona, output format
- Encodes team conventions ("always use MVVM", "prefer StateFlow over LiveData")
- Cheap and fast to set up — just a text file

**Where it breaks for Android engineering:**
- The AI still reasons entirely from its training data — it cannot verify that `AsyncTask` is removed, it can only hope its training included that fact
- Instructions in a `.md` file are static — they go stale the moment a new Jetpack release ships
- The AI can ignore, misinterpret, or hallucinate around even well-written instructions
- There is no enforcement mechanism — no tool call was required, no source was verified

**The fundamental limit:** Prompt engineering controls *how* the AI responds. It cannot control *what the AI knows*. You are still trusting training-time knowledge.

</details>

<details>
<summary><strong>📌 What is RAG (Retrieval-Augmented Generation)?</strong></summary>

RAG means building a vector database of documents (official docs, changelogs, internal wikis), embedding them, and injecting the most semantically similar chunks into the AI's context window at query time.

**What it does well:**
- Great for static or semi-static knowledge bases (policy docs, internal wikis, support tickets)
- Reduces hallucinations by grounding responses in retrieved text
- Works well for "what does this doc say" use cases

**Where it breaks for Android engineering:**
- Android's official docs, API references, and Gradle versions change constantly — maintaining a fresh, complete vector index is a significant ongoing operational burden
- RAG retrieves by semantic similarity — it can retrieve *plausible-sounding* wrong chunks if the embedding space is noisy
- RAG does not *do* anything — it retrieves text. It cannot check live Gradle versions, validate a component against a live deprecation registry, or parse a stacktrace and query the issue tracker
- **RAG solves what the AI doesn't know. MCP solves what the AI can't do.**

</details>

<details>
<summary><strong>📌 So what does MCP actually do differently?</strong></summary>

MCP (Model Context Protocol) is a standardized protocol — not a retrieval technique or a prompt strategy — for connecting AI models to **live tools and external systems**.

| | Prompt Engineering | RAG | **MCP (AndroJack)** |
|---|---|---|---|
| Knowledge source | Training weights (static, stale) | Vector index (periodic refresh) | **Live official sources (real-time)** |
| Verification | None — AI asserts from memory | Retrieved text — quality depends on index | **Tool call — structured, enforced** |
| Enforcement | Instructions (can be ignored) | Soft grounding (can be bypassed) | **Grounded workflow — the recommended path consults tools before code generation** |
| Maintenance | Update the .md file | Re-embed docs on each release | **Zero maintenance — fetches live** |
| Actions | None | None | **Can check versions, parse stacktraces, query issue tracker** |
| Stale data risk | High | Medium | **Minimal — fetched at query time** |
| Works across IDEs | Only if supported | Depends on implementation | **Universal — any MCP client** |

</details>

<details>
<summary><strong>📌 The Grounding Gate — what this means in practice</strong></summary>

The Grounding Gate is not a clever name. It is a real enforcement mechanism built into how MCP tools are described to the AI client.

Every tool in AndroJack contains narrow metadata describing:

- what source it queries
- when it is appropriate to use
- what kind of answer it returns

Because MCP clients (Claude Desktop, Cursor, Windsurf, etc.) present these tool descriptions to the LLM as part of its context, the model uses them as workflow guidance rather than free-form suggestions.

```
Without AndroJack:   User asks → LLM predicts → Code (possibly wrong)

With AndroJack:      User asks → LLM consults tool → Tool fetches official source
                                → LLM reads verified evidence → Code (grounded)
```

You are not making the LLM smarter. You are making it accountable to evidence.

</details>

---

## ✨ What AndroJack Covers — 21 Tools

Each tool lists the **specific failure mode it prevents** — not just what it does, but what breaks when it is absent.

| # | Tool | What It Does | What Breaks Without It |
|---|------|-------------|----------------------|
| 1 | 🔍 `android_official_search` | Live search across `developer.android.com`, `kotlinlang.org`, `source.android.com` | AI reasons from training memory — correct 12 months ago, possibly wrong today |
| 2 | ⚠️ `android_component_status` | Deprecated/removed check on 40+ APIs — `AsyncTask`, `TestCoroutineDispatcher`, `ContextualFlowRow`, `onBackPressed()`, `IntentService` and more | Compiles fine, breaks at runtime or fails Play Store review |
| 3 | 📐 `architecture_reference` | Official guides for 40+ topics — MVVM, MVI, Compose, Hilt, Navigation 3, Paging, offline-first… | AI gives 2022 architecture advice; misses MVI, Nav3, RemoteMediator |
| 4 | 🐛 `android_debugger` | Parses stacktraces → searches `issuetracker.google.com` + official docs | AI hallucinates fixes for bugs that have official workarounds already documented |
| 5 | 📦 `gradle_dependency_checker` | Live version lookup from Google Maven + BOM resolution. Ready-to-paste Kotlin DSL | Wrong Coil group, stale Compose BOM, missing `platform()` wrapper, KAPT instead of KSP |
| 6 | 📊 `android_api_level_check` | API 21–36 table, minSdk warnings, Android 16 enforcement rules | API 26+ calls in `minSdk 21` apps; orientation locks that violate Android 16 on ≥600dp |
| 7 | 🎯 `kotlin_best_practices` | 10 patterns — coroutines, StateFlow, MVI state machine, Room, Hilt, Compose state, LaunchedEffect, offline-first | `GlobalScope.launch`, `LiveData` in new code, `runBlocking` in UI, missing MVI |
| 8 | 🎨 `material3_expressive` | Full M3 Expressive — `MaterialExpressiveTheme`, `MotionScheme`, `ButtonGroup`, `FloatingToolbar`, `MaterialShapes`, Wear OS | M2 `MaterialTheme` in M3E app; `BottomAppBar` when `DockedToolbar` is the M3E component |
| 9 | 🔐 `android_permission_advisor` | 40+ permissions — normal/dangerous/special/removed, Play Store restrictions, `ActivityResultContracts` | Deprecated `requestPermissions()`; Play-restricted permissions that trigger review failure |
| 10 | 🧪 `android_testing_guide` | Unit (MockK, Turbine), Compose UI, Espresso, Hilt, `StandardTestDispatcher` | Removed `TestCoroutineDispatcher`; `Thread.sleep()` in Compose tests; missing `HiltTestRunner` |
| 11 | 🏗️ `android_build_and_publish` | R8/ProGuard, `libs.versions.toml`, KSP migration, signing, AAB, Baseline Profiles | KAPT in new projects; `implementation` instead of `ksp` for annotation processors |
| 12 | 📱 `android_large_screen_guide` | WindowSizeClass, NavigationSuiteScaffold, ListDetailPaneScaffold, foldable hinge, Android 16 compliance | Phone-only layouts; `screenOrientation="portrait"` that fails Android 16 mandatory resizability |
| 13 | 🚀 `android_scalability_guide` | Paging 3 + RemoteMediator, offline-first sync, WorkManager, OkHttp cache, Baseline Profiles, modularization | Naive `loadAll()`; no offline strategy; unstable keys in `LazyColumn` causing full re-renders |
| 14 | 🧭 `android_navigation3_guide` | **Nav3 (stable Nov 2025)** — NavDisplay, NavBackStack, NavKey, Scenes API, migration from Nav2, deep links, testing | AI generates Nav2 code for new projects — an architectural dead-end requiring full rewrite |
| 15 | ✅ `android_api36_compliance` | Android 16 / API 36 compliance — orientation, resizability, 16 KB page size, Play Store August 2026 mandate | Apps fail Play Console quality checks; search ranking demoted; manifest flags rejected at review |
| 16 | 🌐 `android_kmp_guide` | Kotlin Multiplatform — KMP setup, Room KMP, Ktor, DataStore KMP, expect/actual, source sets, Compose Multiplatform | Android-only Room code in KMP project — compiles on Android, iOS build fails silently |
| 17 | 🤖 `android_ondevice_ai` | Android AICore, ML Kit Gen AI API, on-device LLM, MediaPipe, repository pattern for AI, Gemini Nano | Cloud-only AI when on-device AICore is the correct 2025 answer for Pixel; privacy and latency regressions |
| 18 | 📋 `android_play_policy_advisor` | Play Store policies — age-gating, health apps, loan apps, subscription UI, data safety, Oct 2025 changes | Apps rejected at review for policy violations the developer didn't know existed |
| 19 | 🥽 `android_xr_guide` | Android XR SDK (DP3), Compose for XR — Subspace, SpatialPanel, UserSubspace, SceneCore, ARCore for XR | Standard 2D Compose in an XR app — works but misses spatial capabilities entirely |
| 20 | ⌚ `android_wearos_guide` | Wear OS — Tiles, Complications, Health Services, ambient mode, `WearApp` scaffold, M3 Expressive for Wear | Handheld UI patterns on a 40mm round display; missing Tiles API; battery-draining background patterns |
| 21 | 🛡️ `android_code_validator` | **Level 3 loop-back gate.** Validates Kotlin, XML, and Gradle against 24 Android rules. Returns PASS/WARN/FAIL verdict, line-level violations with replacements and doc URLs. Used as the final validation pass on generated code. | The AI generates code and returns it — no validation pass. Errors only discovered at runtime, in CI, or at Play Store review. |

> **All 21 tools are read-only.** AndroJack fetches and returns information — it never modifies your project files.


---

## 🎯 Google's Own Recommendation (March 2026)

> *"To prevent the model from hallucinating code for niche or brand-new libraries, leverage Android Studio's Agent tools to have access to documentation… install a MCP Server that lets you access documentation like Context7 (or something similar)."*
> — **Android Studio Team, Official Android Developer Blog, March 2026**

**That MCP server is AndroJack** — purpose-built for Android, with 21 tools and an Android-specific validation loop that generic doc-retrieval tools do not provide.

---

## 🚀 Quick Start — Zero Install Required

**[→ androjack-web.netlify.app](https://androjack-web.netlify.app)** — live demo, install guides, and traction metrics.

### Option 0 — Anthropic Directory (pending connector approval)

Once the Claude connector submission is approved, install from:
1. Claude Desktop -> Settings -> Extensions
2. Search for `AndroJack`
3. Click Install

Until that directory listing is live, use the npm path below.

> **Review note:** AndroJack does not require an account, API key, cloud project, or test credentials. It uses public documentation and artifact sources only.

### Option 1 — Interactive CLI (v1.6.0) ✨ Recommended

```bash
npx androjack-mcp@1.6.0 install
```

Launches a full animated terminal wizard:
- 🎨 Figlet ASCII-art banner with Android fixes tagline (`Gradle · ViewModel · Room · Compose · Hilt…`)
- ⏳ Auto-scans your system for installed IDEs
- ⬆️⬇️ Arrow-key menu: Auto / Pick specific IDEs / Show config snippet
- ☑️ Checkbox multiselect for precise IDE targeting
- **Y/N confirm** before writing — and again if overwriting an existing config
- ✅ Per-IDE spinner with success/fail summary

> Works in all integrated terminals (VS Code, Cursor, Android Studio, IntelliJ, Windows Terminal).  
> Falls back to `--auto` mode gracefully in CI or non-TTY environments.

### Option 2 — Targeted installs (non-interactive, safe in any environment)

```bash
# Auto-detect and install to all found IDEs
npx androjack-mcp@1.6.0 install --auto

# Install to one specific IDE
npx androjack-mcp@1.6.0 install --ide=cursor
npx androjack-mcp@1.6.0 install --ide=claude
npx androjack-mcp@1.6.0 install --ide=vscode
npx androjack-mcp@1.6.0 install --ide=windsurf
npx androjack-mcp@1.6.0 install --ide=jetbrains
npx androjack-mcp@1.6.0 install --ide=antigravity
npx androjack-mcp@1.6.0 install --ide=kiro

# Check what's installed where
npx androjack-mcp@1.6.0 install --list
```

### Option 3 — From your IDE's NPM Scripts panel (one click)

If you have the repo cloned, open the npm scripts panel in VS Code, Cursor, or IntelliJ and click any of:

```
install-mcp            ← interactive (needs integrated terminal)
install-mcp:auto       ← auto-detect all IDEs
install-mcp:cursor     ← Cursor only
install-mcp:vscode     ← VS Code only
install-mcp:claude     ← Claude Desktop only
install-mcp:windsurf   ← Windsurf only
install-mcp:jetbrains  ← Android Studio / IntelliJ
install-mcp:antigravity← Google Antigravity IDE
install-mcp:kiro       ← AWS Kiro
install-mcp:list       ← see detection status
```

### Option 4 — Test all tools (no IDE needed)

```bash
npx @modelcontextprotocol/inspector npx androjack-mcp@1.6.0
```

> **Requires:** Node.js 18+. Nothing else.

---

## 🛠️ IDE Support Matrix

| IDE | Install Command | Config File | Notes |
|-----|----------------|-------------|-------|
| **Claude Desktop** | `--ide claude` | `~/Library/Application Support/Claude/claude_desktop_config.json` | Restart app; confirm 🔨 in chat |
| **Cursor** | `--ide cursor` | `.cursor/mcp.json` (project-level) | Settings → MCP → green dot |
| **Windsurf** | `--ide windsurf` | `~/.codeium/windsurf/mcp_config.json` | Cascade panel shows tools |
| **VS Code Copilot** | `--ide vscode` | `.vscode/mcp.json` | VS Code 1.99+ required |
| **AWS Kiro** | `--ide kiro` | `.kiro/settings/mcp.json` | One-click link below ↓ |
| **Google Antigravity** | `--ide antigravity` | `~/.gemini/antigravity/mcp_config.json` | Local IDE — not Firebase Studio |
| **JetBrains AI** | `--ide jetbrains` | `~/.config/JetBrains/<IDE>/mcp.json` | Android Studio 2024.3+ |

> **Note on Google Antigravity:** This is Google's standalone agentic IDE (released Nov 2025 with Gemini 3) — not Firebase Studio, not Project IDX. Those are separate Google products.

---

## 🔗 One-Click Installs

### AWS Kiro

[![Add to Kiro](https://img.shields.io/badge/Add%20to-AWS%20Kiro-FF9900?style=for-the-badge&logo=amazonaws)](https://kiro.dev/launch/mcp/add?name=androjack&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22androjack-mcp%401.6.0%22%5D%2C%22disabled%22%3Afalse%2C%22autoApprove%22%3A%5B%5D%7D)

---

## 📋 Manual Config — Copy & Paste

<details>
<summary><strong>Claude Desktop, Cursor, Windsurf, AWS Kiro, Google Antigravity, JetBrains</strong></summary>

```json
{
  "mcpServers": {
    "androjack": {
      "command": "npx",
      "args": ["-y", "androjack-mcp@1.6.0"],
      "env": {},
      "autoApprove": [],
      "disabled": false
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code — .vscode/mcp.json</strong></summary>

```json
{
  "servers": {
    "androjack": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "androjack-mcp@1.6.0"]
    }
  }
}
```

</details>

<details>
<summary><strong>Google Antigravity — ~/.gemini/antigravity/mcp_config.json</strong></summary>

```json
{
  "mcpServers": {
    "androjack": {
      "command": "npx",
      "args": ["-y", "androjack-mcp@1.6.0"]
    }
  }
}
```

UI path: Agent pane → `...` → **MCP Servers** → **Manage MCP Servers** → **View raw config**

> ⚠️ Antigravity is a locally-installed desktop IDE (antigravity.google/download). Do not confuse with Firebase Studio (`.idx/`) or Project IDX — those are different products.

</details>

<details>
<summary><strong>AWS Kiro — .kiro/settings/mcp.json</strong></summary>

```json
{
  "mcpServers": {
    "androjack": {
      "command": "npx",
      "args": ["-y", "androjack-mcp@1.6.0"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Place at `.kiro/settings/mcp.json` (project) or `~/.kiro/settings/mcp.json` (global).
Or use the CLI: `kiro-cli mcp add --name androjack --command npx --args '-y androjack-mcp@1.6.0' --scope workspace`

</details>

---

## 🧪 Examples

### Example 1 — API Deprecation Check

**User prompt:**
> "Is AsyncTask safe to use in my Android app in 2026?"

**What happens:**
- AndroJack calls `android_component_status` with `component_name: "AsyncTask"`
- It checks the component status registry and official Android guidance
- It returns the component status, replacement path, and source URL

**Expected output:**
```text
REMOVED - AsyncTask was removed in Android 11.
Replacement: Use viewModelScope.launch { } from lifecycle-viewmodel-ktx.
Documentation: https://developer.android.com/topic/libraries/architecture/coroutines
```

---

### Example 2 — Live Dependency Version

**User prompt:**
> "What is the latest stable Jetpack Compose BOM version I should use?"

**What happens:**
- AndroJack calls `gradle_dependency_checker` with `library_name: "androidx.compose:compose-bom"`
- It queries Google Maven live for the current stable release
- It returns the current version plus version-catalog and Gradle usage guidance

**Expected output:**
```text
Latest stable Compose BOM: 2026.02.01
libs.versions.toml:
  compose-bom = "2026.02.01"
build.gradle.kts:
  implementation(platform(libs.compose.bom))
```

---

### Example 3 — Code Validation

**User prompt:**
> "Validate this Kotlin code before I use it:" followed by `GlobalScope.launch { delay(1000) }`

**What happens:**
- AndroJack calls `android_code_validator` with the Kotlin snippet
- The validator checks it against the Android rule set
- It returns a FAIL verdict with the rule, explanation, fix guidance, and docs

**Expected output:**
```text
FAIL - 1 violation found

Rule: GLOBALSCOPE_LAUNCH
Severity: ERROR
Problem: GlobalScope leaks coroutines and is not lifecycle-aware.
Fix: Replace it with viewModelScope.launch { } or lifecycleScope.launch { }.
Docs: https://developer.android.com/kotlin/coroutines/coroutines-best-practices
```

---

## 📍 The Ecosystem: AndroJack vs. Other MCPs

### 1. vs. Device Automation MCPs
Most Android MCP servers in the public registry (`minhalvp/android-mcp-server`, `CursorTouch/Android-MCP`) do the same thing: **ADB device control**. They tap screens and capture screenshots for QA testing. Not one of them knows what a `ViewModel` is or can distinguish Navigation 3 from Navigation 2. AndroJack owns the engineering and architecture category.

### 2. vs. Google's Official Developer Knowledge MCP (Public Preview, Feb 2026)
In February 2026, Google launched the Developer Knowledge MCP in public preview — a generalist tool that retrieves Markdown from its documentation corpus covering Firebase, Android, Google Cloud, Maps, and more. You might ask: *Does this replace AndroJack?*

**No. They solve two different halves of the AI coding problem.**

| Feature | Google Developer Knowledge MCP | AndroJack MCP |
| :--- | :--- | :--- |
| **Identity** | **The Librarian** (Information) | **The Gatekeeper** (Enforcement) |
| **Core Job** | Feeds the AI the newest documentation so it knows what exists. | Acts as a strict pre-build linter to enforce modern architectural rules. |
| **Mechanism** | Context Retrieval | Context Enforcement |
| **Scope** | Generalist — Firebase, Cloud, Android, Maps, and more | Android specialist — 21 tools, one domain, zero drift |
| **Tools** | 3 retrieval tools (`search_documents`, `get_document`, `batch_get_documents`) | 21 specialized tools — live version checks, deprecation registry, Gradle lookups, API level validation, loop-back code validator |
| **Setup** | Google Cloud project + API key + `gcloud` CLI required | `npx androjack-mcp@1.6.0` — zero auth, zero cloud project |
| **Enforcement** | Passive — AI decides when to retrieve | Active — tool descriptions mandate calls before every task type |
| **Status** | Public preview (v1alpha / experimental) | Stable (v1.6.0) |

**Why you need both in production:**
Google's tool cures AI "ignorance" by providing official text. However, **AndroJack cures AI "bad habits."** If you ask an AI to refactor an app, Google's tool will provide the new docs. But **AndroJack** is the tool that actively blocks the AI from writing legacy XML, enforces Jetpack Compose, checks Gradle versions against Maven, and ensures your `minSdk` doesn't violate Android 16's Play Store mandate.

Google tells the AI the rules; **AndroJack forces the AI to follow them.**

---

## 🔒 Security & Privacy

| Property | Detail |
|----------|--------|
| **Domain allowlist** | All HTTP enforced against: `developer.android.com`, `kotlinlang.org`, `source.android.com`, `issuetracker.google.com`, Google Maven, Maven Central |
| **Rate limiting** | 30 requests / domain / minute per running process with exponential backoff on 429/5xx |
| **Robots awareness** | `robots.txt` is cached per host and `Crawl-delay` is respected before outbound fetches |
| **No credentials** | Zero API keys, zero auth tokens required |
| **No data stored** | Nothing persisted beyond process lifetime |
| **Transparent agent** | User-Agent: `AndroJack-MCP/1.6.0 (documentation-grounding bot; not-a-scraper)` |
| **Read-only** | All 21 tools are annotated `readOnlyHint: true` with `destructiveHint: false` — no writes, no side effects |
| **Input bounds** | All inputs length-capped and sanitized before use |
| **Body size cap** | HTTP responses capped at 4 MB — no OOM risk on large documentation pages |

---

## 🛡️ Privacy Policy

- AndroJack runs locally in your MCP client or terminal session.
- It does not require user accounts, API keys, or cloud credentials.
- It does not persist prompts, source code, or tool outputs beyond the current process lifetime.
- It only fetches from allowlisted documentation and artifact domains needed to ground answers.
- If you run the optional HTTP mode yourself, you are responsible for your own network exposure and access controls.
- Canonical hosted policy URL for connector submissions: `https://androjack-web.netlify.app/privacy`
- Status: that hosted page is planned but not live yet, so connector submission remains blocked until it returns HTTP 200.

---

## 🗺️ Knowledge Sources

| Source | What It Covers |
|--------|---------------|
| `developer.android.com` | Jetpack, Architecture, Compose, Navigation 3, Testing, M3 Expressive, Android 16 |
| `kotlinlang.org` | Kotlin language, coroutines, Flow, KMP, stdlib patterns |
| `source.android.com` | AOSP internals, system API behavior |
| `issuetracker.google.com` | Known bugs, official workarounds |
| `dl.google.com/android/maven2` | Google Maven — live Jetpack versions |
| `search.maven.org` | Maven Central — community library versions |
| Built-in registries | 40+ component statuses, 40+ arch guide URLs, 40+ permissions, BOM resolution logic |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Your AI IDE / Client                    │
│  Claude · Cursor · Windsurf · VS Code · Kiro · Antigravity  │
└──────────────────────────┬──────────────────────────────────┘
                           │  MCP stdio transport
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   AndroJack MCP Server                      │
│                                                             │
│  🔍 search      ⚠️ component    📐 architecture   🐛 debugger│
│  📦 gradle      📊 api-level    🎯 kotlin         🎨 m3e    │
│  🔐 permissions  🧪 testing     🏗️ build-publish           │
│  📱 large-screen  🚀 scalability                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Secure HTTP layer                                  │   │
│  │  Domain allowlist · Rate limiter · Retry backoff    │   │
│  │  4 MB body cap · Cheerio HTML parsing               │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTPS (allowlisted only)
          ┌────────────────┼──────────────────────┐
          ▼                ▼                      ▼
  developer.android.com  kotlinlang.org    Google Maven
  issuetracker.google    source.android    Maven Central
```

---

## 🧱 Infrastructure & Rate Limiting

- **Primary transport:** stdio via the `androjack-mcp` npm package for local MCP clients.
- **Optional hosted transport:** Streamable HTTP via `node build/index.js --http` for controlled environments.
- **Runtime model:** stateless tool execution with in-process rate limiting, shared in-memory caching, and per-host robots metadata caching.
- **Response caching:** HTML documentation fetches are cached for 1 hour. Artifact metadata from Maven and Gradle sources is cached for 15 minutes before the network is hit again.
- **Responsible crawling:** `robots.txt` is fetched per host, `Crawl-delay` is respected when present, and disallowed paths are blocked.
- **Source of truth:** official Android/Kotlin docs, Google issue tracker, Google Maven, and Maven Central.
- **Release channels:** npm for the MCP server, VS Code Marketplace for the thin wrapper that launches the pinned npm package.

---

## 🧑‍💻 Local Development

```bash
git clone https://github.com/VIKAS9793/AndroJack-mcp.git
cd androjack-mcp
npm install
npm run build              # compiles TypeScript → build/
npm run inspector          # opens MCP Inspector UI
node build/index.js        # run MCP server directly
npm run install-mcp        # interactive installer (needs real terminal)
npm run install-mcp:auto   # non-interactive auto-install
npm run install-mcp:list   # check IDE detection status
```

---

## ❓ FAQ

**Does AndroJack replace reading Android documentation?**  
No. AndroJack reduces the cost of verification by surfacing official evidence faster, but it does not replace Android documentation. Its job is to make AI-assisted work accountable to the same primary sources you would check manually.

**What prevents AndroJack from overloading documentation hosts at scale?**  
Three things: shared in-memory response caching, per-process rate limiting, and cached `robots.txt` handling with `Crawl-delay` support. Documentation pages are cached for 1 hour, artifact metadata is cached for 15 minutes, repeated network calls are throttled, and hosts can still signal pacing expectations through robots rules.

**Does AndroJack send my project files to a hosted backend?**  
No. It runs locally and only makes outbound requests to allowlisted documentation and artifact sources needed to answer the current query.

**Does AndroJack require an account, API key, or test credentials?**  
No. The local MCP server runs on the user's machine and queries public official documentation and artifact sources. There is no AndroJack account system, no API token, and no review account needed.

**Why does the VS Code extension need its own release if the MCP code lives on `main`?**  
Because the Marketplace wrapper is a separate package. For `v1.6.0`, it is pinned to `androjack-mcp@1.6.0`, so the wrapper must be versioned and uploaded separately.

**Why pin `npx -y androjack-mcp@1.6.0` instead of using the floating latest package?**  
Pinning guarantees reproducible installs, clearer support, and predictable review behavior. It avoids stale local `npx` cache surprises.

## 🛠️ Troubleshooting

**Tool calls fail silently**
- Confirm Node.js 18 or newer with `node --version`
- Clear the local npx cache if a client is holding a stale install
- Restart the MCP client after changing config

**"Domain not in allowlist" error**
- This is expected behavior for non-authoritative URLs
- Open an issue if the blocked URL is an official Android or Kotlin source that should be allowlisted

**android_code_validator returns weak or empty results**
- Provide valid Kotlin, XML, or Gradle content
- Include enough surrounding context for the rule engine to reason about the snippet

**Rate limit error**
- Wait for the retry window shown in the error message
- Repeated identical requests are served from cache, so avoid changing the URL unnecessarily

---

## 📋 Changelog

### v1.6.0 — Pinned Distribution, Shared Cache Wiring, and Registry Metadata

- **New:** Exact `@1.6.0` pinning across shipped config examples, installer output, one-click install links, and the VS Code Marketplace wrapper release flow.
- **New:** Shared fetch cache wiring for both `secureFetch()` and `secureFetchJson()` so repeated documentation and metadata lookups stop consuming rate-limit budget.
- **New:** Responsible crawling support with cached `robots.txt` rules and `Crawl-delay` handling per host.
- **New:** Official MCP registry metadata with `server.json` plus package-level `mcpName`.
- **Fix:** User-Agent now reports the correct released version: `AndroJack-MCP/1.6.0`.
- **Docs:** Added explicit privacy policy, infrastructure, examples, and FAQ sections for release reviewers and end users.

### v1.7.0 — Planned Infrastructure Follow-Up

- **Planned:** Persistent documentation cache beyond process lifetime.
- **Planned:** ETag and Last-Modified support for documentation refreshes.
- **Planned:** More durable cache strategy for higher-volume connector usage.

### v1.5.1 — Level 3 Loop-Back Validator + Interactive CLI Installer

- **New:** `android_code_validator` (Tool 21) — Level 3 loop-back validation gate. 24 rules across Kotlin, XML, and Gradle. Validates AI-generated code before it reaches the user. Returns PASS/WARN/FAIL verdict with line-level violations, replacements, and official doc URLs. Zero new dependencies — pure TypeScript.
- **New:** Grounding Gate upgraded to Level 3: Step 8 mandates `android_code_validator` after every code generation. Negative constraints section lists explicit prohibitions by API level (Android 16 targets, new Compose projects, universal rules).
- **New:** Animated `figlet` ASCII-art banner with cyan→purple gradient and Android fixes tagline  
  (`Gradle · ViewModel · Room · Compose · Navigation · Hilt · WorkManager`)
- **New:** `@clack/prompts` arrow-key select + checkbox multiselect — no more typing numbers
- **New:** `ora` per-IDE spinner with ✅/❌ result per IDE
- **New:** Y/N `confirm` dialogs before writing configs and when overwriting existing installs
- **New:** TTY guard — graceful `--auto` fallback in CI / non-TTY environments
- **New:** Per-IDE `npm run install-mcp:*` scripts visible in VS Code / IntelliJ npm panels
- **Fix:** `--ide` flag now uses `--ide=<name>` format consistently

### v1.3.4 and earlier

See [GitHub releases](https://github.com/VIKAS9793/AndroJack-mcp/releases) for prior history.

---

## 👥 Authorship & Ownership

**AndroJack-MCP** is a collaborative effort between human product vision and AI engineering excellence.

*   **Vikas Sahani** — [Product Lead](https://www.linkedin.com/in/vikas-sahani-727420358) (`vikassahani17@gmail.com`)
*   **Claude AI** — AI Engineering Lead

## � Getting the Full Guarantee

Installing the tools alone gives you **Level 1** grounding — the AI *can* use them but decides when. For **Level 2** guided grounding on Android tasks, load the `androjack_grounding_gate` system prompt.

### What is the Grounding Gate system prompt?

It is a set of rules registered on the MCP server itself (accessible via the MCP `prompts` API). It maps every task type to the correct tool:

| When the AI does this... | The prompt directs it to this tool |
|---|---|
| Write any Compose UI | `material3_expressive` |
| Add/update any dependency | `gradle_dependency_checker` |
| Use any Android/Jetpack class | `android_component_status` |
| Write navigation code | `android_navigation3_guide` |
| Write tests | `android_testing_guide` |
| Target tablets/foldables | `android_large_screen_guide` |

### How to activate Level 2

**Claude Desktop / Cursor / Windsurf:**
In your system prompt settings, add:
```
Use the androjack_grounding_gate MCP prompt before every Android coding task.
```

**IDEs that support MCP prompt injection** (Kiro, Antigravity, JetBrains AI):
Select the `androjack_grounding_gate` prompt from the MCP prompts list at session start.

> Without this step, tool invocation depends on the AI's judgment. With it, the prompt consistently steers the AI toward the right tool for architecture, UI, dependencies, and testing checks.

---

## �💬 Community &amp; Discussions

Join our [GitHub Discussions](https://github.com/VIKAS9793/AndroJack-mcp/discussions) to connect with other developers, ask questions, and share your ideas!

- **🙏 Q&A**: Get help with setup and usage.
- **💡 Ideas**: Propose new tools and features for the 2026 roadmap.
- **🙋 Polls**: Vote on the next Android APIs to support.
- **🎉 Showcase**: Share your amazing Android projects built with AndroJack.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](https://github.com/VIKAS9793/AndroJack-mcp/blob/main/CONTRIBUTING.md) for more details.

---

## 📄 License

[MIT License](https://github.com/VIKAS9793/AndroJack-mcp/blob/main/LICENSE) © 2026 Vikas Sahani | [Security Policy](https://github.com/VIKAS9793/AndroJack-mcp/blob/main/SECURITY.md)

---

<div align="center">

*Built because 35% of Stack Overflow visits in 2025 are developers debugging AI-generated code.*
*AndroJack exists so none of those visits are yours.*

</div>
