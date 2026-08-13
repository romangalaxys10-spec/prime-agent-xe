# Prime Agent XE (Extreme Edition) — Strategy, Competitor Study & Desktop Build

> Fork of [PrimeIntellect-ai/prime-agent](https://github.com/PrimeIntellect-ai/prime-agent)
> (this repo: `romangalaxys10-spec/prime-agent-xe`).
> Goal: harden Prime Agent into an "Extreme Edition" that matches or beats the
> leading coding-agent IDEs, and ship a first-class **desktop UI** modeled on
> OpenCode's desktop app.

---

## 1. Positioning

Prime Agent is already one of the most architecturally advanced open-source
coding agents. Its differentiators versus the field:

- **RLM (Recursive Language Model) runtime**: a *persistent IPython kernel* as
  the model-facing control environment. State survives across turns and
  compaction; file ops, shell, skills, and subagents are composed as code.
- **Continual Harness**: durable, self-improving state (supplemental prompts,
  memories, skills, reusable subagent specs) that the agent refines via
  evidence-backed, rollback-able updates.
- **True recursive subagents**: `rlm(...)` spawns real child `AgentSession`
  instances under the same worker — not a separate library.
- **Long-running by design**: daemon workers, heartbeats, goals, cron,
  autonomous mode with quality gates, background agents.
- **Multi-surface**: interactive TUI, print, JSON, **RPC** (NDJSON stdio),
  **ACP** (Agent Client Protocol), SDK embedding.

Where it lags the competition: **no desktop app**, weaker *sandboxing* story,
no *plan/read-only agent mode* shipped as a first-class concept, no *video*
multimodal input, no *agent marketplace with trust levels*, and a heavier
first-run (Node + IPython bootstrap vs single-binary competitors).

**XE thesis:** keep the RLM/harness lead, and close the gaps that competitors
use to win mindshare — starting with a desktop UI built the OpenCode way
(Electron shell + web UI + WebSocket bridge to the CLI), plus sandboxing,
plan mode, MCP-as-first-class, typed subagent presets, and a marketplace.

---

## 2. Current Capability Audit (from code study)

Monorepo (TypeScript, npm workspaces `@earendil-works/pi-*`):

| Package | Role | LOC (src) |
|---|---|---|
| `packages/ai` | Unified LLM API, provider discovery, MCP | ~34k |
| `packages/agent` | Agent core: transport, state, attachments | ~2.4k |
| `packages/coding-agent` | CLI, RLM runtime, skills, tools, modes | ~118k |
| `packages/tui` | Differential-rendering terminal UI lib | ~15k |

Verified existing features (from `packages/coding-agent/docs` + source):

- **Modes**: `text` (TUI), `print`, `json`, `rpc` (NDJSON over stdio), `acp`
  (Agent Client Protocol), `daemon`.
- **Subagents**: `rlm(...)` spawn, `agent_message` family messaging,
  `rlm.list_subagents()`, `rlm.delete_subagent()`, parent-scoped registry that
  survives compaction/kernel restart.
- **Harness self-improvement**: `/refine` applies small updates to prompt
  notes / memories / skills / subagent specs with rollback.
- **Skills**: Agent Skills markdown **and** Python-backed skills installed into
  the kernel (e.g. `release_audit(...)`); built-in skill creator.
- **Sessions**: auto JSONL save, `/tree` branch navigation, `/fork`, `/clone`,
  compaction, branching.
- **Autonomous mode**: bounded continuations, turn/token/time limits,
  shell-gated quality checks.
- **Long-running**: daemon supervisor, worker isolation, heartbeats, goals,
  cron, schedules, agent-to-agent messaging, `Agents` view.
- **Extensions**: TypeScript modules adding tools/commands/events/UI;
  Prime Agent **Packages** bundle skills+prompts+themes.
- **MCP**: via Python skills (`websearch`, etc.) — *not* a first-class tool
  surface.
- **Providers**: Anthropic, OpenAI, Google, Bedrock, Prime Inference + custom.
- **Themes**, keybindings, `/share` (gist), `/export` (HTML), analytics.

---

## 3. Competitor Landscape

### 3.1 Claude Code (Anthropic) — *reference baseline*
Not open-source, but the category definer. Feature set from public docs /
extracted system prompts:
- Subagents with typed roles (`Explore`, `Plan`, `general`) via the `Task` tool.
- **Hooks** (PreToolUse / PostToolUse / PostToolUseError / etc.) for gates,
  notifications, automation.
- **Skills** (markdown + frontmatter), **slash commands** (incl. custom/project).
- **Permission modes**: `default` / `acceptEdits` / `bypassPermissions` / `plan`.
- **Plan mode** (read-only exploration before edits).
- `CLAUDE.md` project memory, `TodoWrite`, extended thinking, autocompaction.
- Git/PR workflows, background tasks, web fetch.

### 3.2 Grok Build (`xai-org/grok-build`, ★25k, **Rust**)
Fullscreen, **mouse-interactive TUI**, extensible. Documented doc topics:
theming, **MCP servers**, **skills**, **plugins**, **hooks**, custom models,
project rules, **memory**, headless mode, agent mode, **subagents**, sessions,
**sandbox**, **plan mode**, background tasks, terminal support,
**permissions & safety**, **dashboard**, **monitoring/usage**.
- Rust → fast, small, native.
- Explicit **sandbox** + **dashboard/monitoring** are standout differentiators.

### 3.3 Kimi Code CLI (`MoonshotAI/kimi-code`, ★6.5k, **TypeScript, single binary**)
- **Video input** (drop a screen recording; agent "watches" it).
- **Blazing-fast startup**, single-binary (no Node setup).
- **AI-native MCP config** (`/mcp-config` conversationally adds/auths servers).
- **Plugin marketplace** with **trust levels** surfaced up front; install from
  GitHub.
- Typed **subagents**: `coder`, `explore`, `plan`.
- **Lifecycle hooks**, **ACP** editor integration (Zed, JetBrains), VS Code ext,
  Zsh integration, shell-command mode (`Ctrl-X`).

### 3.4 OpenCode (`anomalyco/opencode`, ★197k, **TypeScript**)
- **Desktop App (Beta)**: Electron 41 shell + **SolidJS/Vite** web UI +
  **`ghostty-web`** (WebGL terminal) + **WebSocket** to the CLI daemon.
- Built-in **`build`** (full-access) and **`plan`** (read-only) agents; `Tab`
  to switch; `@general` subagent.
- LSP, **Shiki** syntax highlighting, theming, rich diff UX.
- ACP, MCP, broad provider support.

---

## 4. Feature / Improvement Matrix (Prime Agent vs field)

| Capability | Prime Agent | Claude Code | Grok Build | Kimi | OpenCode | XE gap |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Persistent kernel / RLM | ✅ | ❌ | ❌ | ❌ | ❌ | lead |
| Self-improving harness | ✅ | partial | partial | ❌ | ❌ | lead |
| Recursive subagents | ✅ | ✅ | ✅ | ✅ | ✅ | parity |
| **Desktop UI** | ❌ | ❌* | ❌ | ❌ | ✅ | **MISSING** |
| Native sandboxing | ⚠️ proc-iso | ⚠️ | ✅ | ❌ | ⚠️ | gap |
| Plan / read-only agent | ⚠️ auton. | ✅ | ✅ | ✅ | ✅ | gap |
| Typed subagent presets | ❌ | ✅ | ✅ | ✅ | ✅ | gap |
| Video multimodal input | ❌ | ❌ | ❌ | ✅ | ❌ | gap |
| Agent marketplace + trust | ⚠️ pkgs | ❌ | ❌ | ✅ | ❌ | gap |
| Lifecycle hooks (user-facing) | ⚠️ events | ✅ | ✅ | ✅ | ⚠️ | gap |
| MCP as first-class tools | ⚠️ via skills | ✅ | ✅ | ✅ | ✅ | gap |
| Single-binary / fast boot | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | gap |
| Dashboard / usage monitor | ⚠️ /usage | ⚠️ | ✅ | ❌ | ⚠️ | gap |
| LSP-backed edits | ❌ | ⚠️ | ⚠️ | ❌ | ✅ | gap |

\* Claude Code is terminal-only; no official desktop.

---

## 5. Prioritized Improvement List (what we can apply)

### P0 — Highest leverage (ship the differentiators)
1. **Prime Agent XE Desktop** (this repo, `xe-desktop`).
   Electron + Vite + React/Solid web UI, WebSocket bridge to
   `prime-agent --mode rpc`/`acp`, `xterm.js` terminal + structured transcript,
   sessions/agents sidebar. Modeled on OpenCode desktop. *(See §6.)*
2. **Plan / read-only agent mode** (`--mode plan` / a `plan` agent preset):
   deny file edits + gate bash by default; mirror OpenCode `plan` agent and
   Grok `plan-mode`. Hook into `core/agent-session-config.ts` + permissions.
3. **Native sandboxing option**: wrap worker/kernel in a restricted container
   (nsjail / gVisor / `bubblewrap`) with opt-in flag; surface safety like
   Grok's `sandbox` + `permissions-and-safety`. Build on existing
   `core/bash-executor.ts` + worker process model.

### P1 — Close parity gaps
4. **Typed subagent presets**: ship `coder` / `explore` / `plan` / `review`
   presets for `rlm(...)` (system prompt + tool allowlist + permission scope),
   matching Kimi/Claude/Grok ergonomics while keeping RLM internals.
5. **User-facing lifecycle hooks**: `PreToolUse` / `PostToolUse` /
   `OnCompletion` / `OnError` hooks running local commands/scripts, with a
   hooks config file + UI surfacing (Kimi/Grok/Claude parity).
6. **MCP as a first-class tool surface**: expose configured MCP servers
   directly as model tools (not only via Python skills), with discovery +
   approval UI. Reuses `packages/ai/src/mcp`.
7. **Video & richer multimodal input**: extract frames/transcript from dropped
   video/clip and feed as images+text (Kimi-style). Extends
   `utils/clipboard-image.ts` + prompt pipeline.
8. **Agent marketplace + trust levels**: extend Prime Agent Packages with a
   registry, install-from-GitHub, and explicit trust scoring in the UI
   (Kimi-style).

### P2 — Polish & reach
9. **Dashboard / usage monitor**: a web view (reuse desktop) showing live
   token/cost/context across the agent family + completions; Grok-style.
10. **LSP-backed edits**: integrate an LSP client for symbol-aware edits,
    rename, diagnostics in the kernel tooling (OpenCode-style).
11. **Faster first-run / single-binary**: bundle the runtime (electron-style
    or a packaged binary) so XE boots in <1s like Kimi/Grok; optional
    `prime-agent-xe` self-contained distribution.
12. **Web companion**: a browser UI (same renderer as desktop, served by the
    daemon) for remote access — natural extension of the desktop WebSocket.

---

## 6. Desktop UI — Architecture (informed by OpenCode desktop)

OpenCode desktop = **Electron shell + SolidJS/Vite web app + `ghostty-web`
WebGL terminal + WebSocket bridge to the CLI daemon**. Prime Agent already
exposes the exact server side we need: `--mode rpc` (NDJSON over stdio) and
`--mode acp` (Agent Client Protocol). So XE Desktop mirrors the pattern:

```
┌─────────────────────────────────────────────────────────────┐
│ Electron main process (xe-desktop/electron/main.cjs) │
│  • spawns: prime-agent --mode rpc  (child process)            │
│  • bridges  child.stdin/stdout  ⇄  local WebSocket (ws)       │
│  • app menus, auto-updater hook, deep-link to session://      │
└───────────────┬───────────────────────────┬──────────────────┘
                │ WebSocket (NDJSON)         │
                ▼                            ▼
        ┌──────────────────────────────────────────┐
        │ Renderer (Vite + React)                   │
        │  • Sessions/Agents sidebar (left)         │
        │  • Structured transcript (center)         │
        │      – parse RPC events → markdown/cards  │
        │      – raw terminal toggle (xterm.js)     │
        │  • Prompt input (bottom) → ws → child     │
        │  • Usage/cost chip, model switcher        │
        └──────────────────────────────────────────┘
```

Why this design (and why it beats re-implementing the TUI in a browser):
- **Reuses Prime Agent's protocol** — zero changes to agent internals.
- **Decoupled renderer** via WebSocket, exactly like OpenCode (works headless,
  remote, or in-electron).
- **Structured transcript** parses RPC `type` events into messages/tool-calls/
  results, giving a richer UI than a raw terminal, while a raw `xterm.js`
  toggle preserves 1:1 parity for debugging.
- **Terminal** uses `xterm.js` (mature, vs OpenCode's `ghostty-web` WebGL) for
  the raw stream; structured view uses `react-markdown` + `shiki`.

### Scaffold layout (`xe-desktop/`)
```
xe-desktop/
  package.json            # electron + vite + react + ws + xterm
  electron/
    main.cjs             # spawn prime-agent --mode rpc, ws bridge
    preload.cjs
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx              # sidebar + transcript + input
    useAgentSocket.ts    # ws client + RPC framing (LF split, no U+2028/29)
    Transcript.tsx       # renders parsed RPC events
    Terminal.tsx         # xterm.js raw view
    Sidebar.tsx          # sessions/agents (via `prime-agent agents`/`list`)
  README.md
```

### Wiring notes
- RPC framing: split child stdout on `\n` only (strip optional trailing `\r`);
  **do not** use Node `readline` (it also splits U+2028/U+2029 — invalid for
  RPC). This matches `docs/rpc.md`.
- Send prompts as `{"type":"prompt","message": "..."}`; streamed prompts need
  `streamingBehavior: "steer"|"followUp"`.
- Auto-discovery: the desktop can also attach to an already-running daemon
  (`prime-agent status`) instead of spawning its own child.

---

## 7. Milestones

- **M1 (done here)**: Fork → `prime-agent-xe`; capability audit; competitor
  study; this strategy doc; desktop scaffold (`xe-desktop`).
- **M2**: Desktop MVP runnable (`npm i && npm start`): spawn agent, send
  prompts, structured + raw transcript, sessions sidebar.
- **M3**: Plan agent mode + typed subagent presets + sandbox flag.
- **M4**: Lifecycle hooks + MCP-first-class + marketplace/trust.
- **M5**: Video input, dashboard, LSP edits, single-binary distribution.

See `xe-desktop/README.md` for build/run instructions.


---

# Addendum — Extended Study & Refined Roadmap

This section folds in the additional references studied and sharpens the
priorities. All are open-source unless noted.

## A. Additional references studied

### A.1 NVIDIA NeMo — OO Agents (`NVIDIA-NeMo/labs-OO-Agents`, ★1.5k)
Pythonic, **object-oriented** agent framework. *Agents are Python classes*; fields
are state, methods are capabilities, docstrings are prompts, type annotations are
contracts. A method with an `...` body becomes an LLM-driven loop; a real body
stays deterministic Python. The model acts by writing Python in a Jupyter-style
REPL with access to `self`.
- **Validates Prime Agent's RLM thesis** (code-as-action, persistent Python
  control environment) — but Prime Agent's *persistent IPython kernel* is more
  powerful than NOOA's per-call REPL.
- New ideas worth borrowing:
  - **Typed tool interfaces** (`@tool` via method signatures) reduce schema
    boilerplate — Prime Agent could offer a typed-skill authoring helper.
  - **Built-in tracing viewer** (`nooa start-dev`, localhost:5001) → reinforces
    XE's **dashboard/observability** item.
  - **OS-level sandboxing** is their stated containment boundary (NVIDIA
    OpenShell) → aligns with XE P0 sandbox.

### A.2 OpenAdapter / Koda (`openadapter.in`, `api.openadapter.in`)
Multi-provider **OpenAI-compatible gateway**: one API key → 40+ models (DeepSeek,
Qwen, Mistral, **Kimi K2.5**, MiniMax, **GLM-5**, **Koda**, …). Base URL
`https://api.openadapter.in/v1`. Koda is exposed via
`GET /api/setup/koda?key=<OPENADAPTER_API_KEY>` which returns the ready-made
OpenAI-compatible `base_url` + `api_key` + `model`.
- **Action taken:** added a working provider extension at
  `packages/coding-agent/examples/extensions/custom-provider-openadapter/`
  (registered as `api: "openai-completions"`, `baseUrl:
  https://api.openadapter.in/v1`, model list incl. `koda`). Cheap multi-model
  fleet, zero new deps.

### A.3 `grill-me-codex` (`chaseai-yt/grill-me-codex`, ★1.2k)
Claude Code skills implementing **cross-model adversarial planning/review**.
Act 1: Claude grills you to lock a plan. Act 2: hand the plan to **OpenAI Codex**
(a rival provider) for an adversarial review loop in a *read-only sandbox* until
both sign off. Act 3: roles flip — Codex builds from the frozen plan, Claude
reviews the diff like a PR.
- Core principle: **never let a model grade its own work.** A second,
  cross-provider model catches structural blind spots.
- **XE fit:** Prime Agent already has `rlm(...)` + multi-provider + sandbox
  extensions. A built-in **"Adversarial Review" workflow** (parent on Koda →
  review child on a different provider in read-only mode → build → verify) is a
  high-value, on-brand XE feature.

### A.4 Ix (`ix-infrastructure/Ix`, ★0.7k)
CLI that turns a codebase into a **queryable graph** (tree-sitter, 26 langs,
ArangoDB) with `ix map/explain/impact/trace`, plus a canonical **MCP server**
(`ix mcp`) so any AI client can navigate the map.
- **XE fit:** a **code-intelligence layer** (persistent symbol/call/import graph +
  impact analysis) shrinks prompt context and replaces grep-guessing. Ship as a
  Python skill wrapping `ix mcp`, or a native `xe map` command.

### A.5 hallmark (`Nutlope/hallmark`, ★24.5k, by Together AI)
An **anti-AI-slop design skill** for Claude Code/Cursor/Codex: 21 themes, 4 verbs
(build/audit/redesign/study), 57 slop-test gates + pre-emit self-critique.
- **XE fit:** bundle a **design-quality gate skill** for UI generation (Prime
  Agent can already build UIs via the IPython tool). Refuses on-distribution
  defaults — pairs with the audit theme below.

### A.6 OpenInterpreter (`openinterpreter/openinterpreter`, ★68k)
Now "a coding agent optimized for **low-cost models**" (reimplemented the Kimi
Code harness in Rust). Heritage: local code execution.
- **XE fit:** emphasize **cost-efficiency** (already have analytics + OpenAdapter
  cheap models) and a Rust/low-cost fast-path option.

### A.7 `reverse-skill` (`zhaoxuya520/reverse-skill`, ★24.7k)
Cybersecurity **skills router**: AI-powered routing + on-demand toolchain
bootstrapping + a **self-evolving knowledge base**; supports Claude Code/Kiro/
Cursor/Cline.
- **XE fit:** a **skill router + on-demand toolchain bootstrap + self-evolving KB**
  complements Prime Agent's Continual Harness (which already evolves state). Adopt
  the "bootstrap the right toolchain on demand" pattern.

### A.8 antivibe (`mohi-devhub/antivibe`, ★1k)
Claude Code skill turning AI-generated/legacy code into **educational deep dives
or senior-level architectural audits** ("learn what AI writes, not just accept
it").
- **XE fit:** bundle an **audit/learning skill** — pairs with hallmark (quality)
  and grill-me-codex (verification) into an XE "trust the output" toolkit.

### A.9 Voicebox (`jamiepine/voicebox`, ★50k)
Open-source **AI voice studio**: clone voices, TTS, dictate into any app, talk to
agents in voices you own — local voice I/O stack.
- **XE fit:** **voice input + TTS** is a natural desktop feature (the desktop
  scaffold below is the perfect host). High user delight, low architectural risk.

### A.10 DispatchMail (`dbish/DispatchMail`, ★177) & emexDE/Nyxian (`emexlab/emexDE`, ★1k)
- DispatchMail: locally-run **web-UI agent app** (local SQLite, whitelisted
  data access) — reinforces the **local-first, privacy-preserving agent app**
  pattern (same shape as XE Desktop).
- emexDE/Nyxian: on-device iOS native IDE/microkernel (offline). Mostly
  domain-specific; takeaway = **offline/on-device execution** (already covered by
  local-model providers).

### A.11 openfusion (`shrdgn/openfusion`, ★26) — "fusion tech"
Open-source **mixture-of-agents** proxy: point any OpenAI-compatible client at
`model: "openfusion"`; the prompt fans out to a **panel of LLMs in parallel**, a
**judge model** reads every response (consensus/contradictions/blind spots) and
streams one synthesized answer that beats any single model. Presets: quality /
budget; aggregators: debate/vote/ranked.
- **XE fit (two paths):**
  1. *Quick win* — register openfusion as an OpenAI-compatible provider (same
     mechanism as the OpenAdapter extension): `baseUrl:
     http://localhost:8000/v1`, `model: openfusion`.
  2. *Native & unique* — implement **RLM fusion**: spawn a panel of model-specific
     `rlm(...)` children, then a judge child synthesizes — all inside Prime
     Agent's existing recursive runtime. This is a genuine XE differentiator
     (native fusion, not a proxy).

## B. Updated competitor/reference matrix

| Capability | PA XE today | Claude Code | Grok Build | Kimi | OpenCode | NOOA | openfusion | XE gap |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Persistent RLM kernel | ✅ | ❌ | ❌ | ❌ | ❌ | ~ | ❌ | lead |
| Self-improving harness | ✅ | ~ | ~ | ❌ | ❌ | ❌ | ❌ | lead |
| Recursive subagents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | parity |
| **Desktop UI** | 🆕 scaffold | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | **new** |
| Native sandbox | ⚠️ | ⚠️ | ✅ | ❌ | ⚠️ | ✅(OS) | ❌ | gap |
| Plan/read-only agent | ⚠️(ext) | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | gap |
| Typed subagent presets | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | gap |
| Cross-model adversarial review | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **gap (XE opener)** |
| Model fusion / MoA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | **gap (XE opener)** |
| Lifecycle hooks | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | gap |
| MCP first-class tools | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | gap |
| Video multimodal input | ❌ | ❌ | ❌ | ✅ | ❌ | ⚠️ | ❌ | gap |
| Voice I/O | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | gap |
| Code-intelligence map | ❌ | ❌ | ❌ | ❌ | ⚠️(LSP) | ❌ | ❌ | gap |
| Dashboard/observability | ⚠️ | ⚠️ | ✅ | ❌ | ⚠️ | ✅ | ❌ | gap |
| Multi-provider cheap fleet | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ❌ | **done (OpenAdapter)** |
| Design-quality gate | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | gap |
| Skill router + self-evolving KB | ⚠️(harness) | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | gap |

## C. Refined prioritized roadmap (what we can apply)

### P0 — Differentiators / shippable now
1. **Prime Agent XE Desktop** (`xe-desktop`, scaffolded here). Electron +
   Vite/React + WebSocket bridge to `prime-agent --mode rpc`; structured
   transcript + raw xterm + agents sidebar. Modeled exactly on OpenCode desktop.
2. **Plan / read-only agent mode** — promote the existing
   `examples/extensions/plan-mode/` to a built-in `/plan` mode (deny edits, gate
   bash by default).
3. **Native sandboxing** — promote `examples/extensions/sandbox/` (OS-level, per
   project config) to a first-class `--sandbox` flag; surface safety like Grok.
4. **OpenAdapter / Koda provider** — DONE (extension added). Document as the
   default cheap multi-model fleet.

### P1 — Close parity + open new ground
5. **Cross-model adversarial review** (grill-me-codex pattern): built-in workflow
   — parent plans → rival-provider child reviews in read-only sandbox → build →
   verify. *"No model grades its own work."*
6. **Model fusion / MoA** (openfusion pattern): native RLM fusion (panel of
   model-specific `rlm` children + judge) *and* a drop-in openfusion provider.
7. **Typed subagent presets**: ship `coder`/`explore`/`plan`/`review` presets for
   `rlm(...)` (system prompt + tool allowlist + permission scope).
8. **Lifecycle hooks** (PreToolUse/PostToolUse/OnCompletion/OnError) with a
   config file + UI surfacing.
9. **MCP as first-class tools** — expose configured MCP servers directly as model
   tools (reuse `packages/ai/src/mcp`).
10. **Code-intelligence map** (Ix pattern): `xe map` + impact analysis via an MCP
    skill, shrinking prompt context.

### P2 — Polish, reach, delight
11. **Dashboard / observability** (NOOA/Voicebox/Grok style): live token/cost/
    context + trace viewer for the whole agent family.
12. **Voice I/O** (Voicebox): dictate prompts + TTS replies in the desktop.
13. **Video multimodal input** (Kimi style): frame/transcript extraction from
    dropped clips.
14. **Design-quality gate skill** (hallmark + antivibe): audit/redesign generated
    UIs and code; refuse slop.
15. **Skill router + self-evolving KB** (reverse-skill): on-demand toolchain
    bootstrap + evolving knowledge.
16. **Faster first-run / single binary** + **web companion** (DispatchMail
    pattern) reusing the desktop WebSocket.

## D. What was delivered in this fork (so far)

- Fork: `romangalaxys10-spec/prime-agent-xe` (parent `PrimeIntellect-ai/prime-agent`).
- `PRIME-AGENT-XE.md` — this strategy/study doc (capability audit, competitor
  matrix, prioritized roadmap).
- `xe-desktop/` — runnable Electron + Vite/React desktop scaffold
  (WebSocket bridge to `prime-agent --mode rpc`).
- `packages/coding-agent/examples/extensions/custom-provider-openadapter/` —
  working OpenAdapter/Koda provider extension.
- Branding: repo/product renamed to **Prime Agent XE (Extreme Edition)**.


---

## D2. Hybrid delivery (added): one backend, three front-ends

Per the latest direction, Prime Agent XE ships a **hybrid** product: a single agent
backend (`prime-agent` runtime) driven from three front-ends, exactly the OpenCode
model:

- **(C) External CLI** — `prime-agent-xe` in the user's native terminal
  (Windows Terminal / GNOME Terminal / iTerm / macOS Terminal). No Electron needed.
- **(A) Desktop GUI** — Electron + Vite/React web UI: structured transcript +
  raw terminal tabs (`xe-desktop`).
- **(B) Built-in CLI** — a desktop tab running the *real* `prime-agent` TUI inside
  the app via a **PTY bridge** (`node-pty` backend ⇄ `xterm.js` frontend), so the
  in-app CLI is identical to (C).

The GUI talks to the agent over **RPC/ACP (NDJSON WebSocket)**; the built-in CLI
talks over a **PTY**. Same daemon, same kernel, same RLM — three surfaces. This
maximizes reach: terminal purists keep their shell, GUI users get the desktop, and
the codebase stays single-source.
