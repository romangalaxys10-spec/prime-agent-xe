# Prime Agent XE — Comparison vs. upstream Prime Agent

> **Upstream:** [`PrimeIntellect-ai/prime-agent`](https://github.com/PrimeIntellect-ai/prime-agent)
> **Fork:** [`romangalaxys10-spec/prime-agent-xe`](https://github.com/romangalaxys10-spec/prime-agent-xe) (this repo)
>
> Prime Agent XE is a **drop-in fork** of Prime Agent. The agent runtime, protocol, and monorepo are unchanged; XE *adds* built-in advanced features for terminal users who want more power than the upstream provides.

## TL;DR

| Area | Upstream Prime Agent | Prime Agent XE |
|---|---|---|
| Core agent runtime | `prime-agent` (daemon + workers + ACP/RPC) | **Identical** — same binary, same protocol |
| CLI | `prime-agent` TUI (text / json / rpc / acp / daemon) | **Identical** CLI + built-in advanced features |
| Desktop UI | None (CLI only) | **None** (CLI-only focus) |
| Provider ecosystem | OpenAI / Anthropic / etc. via `pi.registerProvider` | **+ OpenAdapter/Koda** built-in support |
| Model switching | `/model <name>` in the TUI | **+ `Ctrl/⌘+P` palette** (OpenCode-style) |
| Keyboard shortcuts | Limited | **+ global shortcut map** (`Ctrl+1/2/N/K/B/P`, `?`) |
| Native app menu | None | **None** (CLI-only) |
| OS integration | None | **None** (CLI-only) |
| Branding | Prime Agent | **Prime Agent XE** (binary stays `prime-agent`) |

---

## 1. Architecture (unchanged)

Both share the same monorepo (`ai`, `agent`, `coding-agent`, `tui`, `docs`) and the same execution model:

- **Modes:** `text`, `json`, `rpc` (NDJSON over stdio), `acp` (Agent Client Protocol), `daemon`.
- **RPC framing (docs/rpc.md):** split child stdout on `
` only, strip trailing ``; do **not** use Node `readline` (it also splits U+2028/U+2029).
- **Provider registry:** `pi.registerProvider(...)` with an OpenAI-compatible shape (`baseUrl`, `apiKey`, `api`, `models[]`). XE introduces built-in support for OpenAdapter.

> Nothing in the agent's reasoning, tools, or model-calling code was modified. XE is strictly additive.

---

## 2. What XE adds (Built-in CLI Features)

### 2.1 Plan Mode (`--plan` flag, `/plan` command, `Ctrl+Alt+P`)
Read-only exploration mode for safe code analysis:
- Bash restricted to allowlisted read-only commands
- IPyhon and edit tools disabled
- Todo list tracking with progress widget
- System prompt for structured planning

### 2.2 Sandbox Mode (`--sandbox` flag, `/sandbox` command)
OS-level sandboxing for bash commands:
- Uses `@anthropic-ai/sandbox-runtime` with bubblewrap (Linux) or sandbox-exec (macOS)
- Per-project configuration via `.prime/agent/sandbox.json`
- Network allowlist, filesystem restrictions
- `--no-sandbox` flag to disable

### 2.3 OpenAdapter / Koda Provider (built-in)
OpenAdapter gateway support built into the agent:
- One API key unlocks 40+ models (Koda, DeepSeek, Qwen, GLM-5, MiniMax, Kimi K2.5)
- No extension needed - works out of the box with `OPENADAPTER_API_KEY` env var
- Access via `/model openadapter/koda`

### 2.4 Typed Subagent Presets
Built-in presets for `rlm()` subagents:
- `coder` - full access, implementation tasks
- `explore` - fast codebase reconnaissance
- `plan` - implementation planning with tool restrictions
- `review` - code review, adversarial verification

### 2.5 Lifecycle Hooks System
User-facing hooks for automation and safety:
- `PreToolUse` / `PostToolUse` / `OnCompletion` / `OnError`
- Configuration via `.prime/hooks.json`
- Scripts/commands executed before/after tool calls
- TUI status display

### 2.6 MCP as First-Class Tools
MCP servers exposed directly as model tools:
- Auto-discovery from MCP server manifests
- Approval flow before first use
- Integrated with existing MCP infrastructure

### 2.7 Cross-Model Adversarial Review
Built-in `/review` workflow:
- Parent agent on primary model (e.g., Koda)
- Child agent on rival provider for adversarial review
- Read-only sandbox during review phase
- Build/verify phase after approval

### 2.8 Model Fusion / Mixture of Agents
Native RLM fusion for better responses:
- Parallel model execution with `/fuse` command
- Judge model synthesizes consensus from multiple models
- Configurable aggression/quality tradeoffs

---

## 3. What is intentionally not changed

- No GUI/desktop/web interface (CLI-only)
- No changes to the agent's reasoning, tools, or model-calling code
- No changes to the npm workspace scopes (`@earendil-works/*`)
- The `prime-agent` CLI command name and flags are unchanged

---

## 4. CLI-Only Philosophy

Prime Agent XE ships **one surface**: the terminal. The TUI IS the product.

Features are delivered via:
- **CLI flags** (`--plan`, `--sandbox`)
- **Slash commands** (`/plan`, `/review`, `/fuse`, `/sandbox`, `/hooks`)
- **Keyboard shortcuts** (Ctrl+Alt+P, etc.)
- **Configuration files** (`.prime/agent/sandbox.json`, `.prime/hooks.json`)
- **Environment variables** (`OPENADAPTER_API_KEY`)

---

## 5. Feature Roadmap

See `PRIME-AGENT-XE.md` for the complete implementation roadmap with:
- P0 features (ship immediately): Plan mode, Sandbox mode, OpenAdapter support
- P1 features (close parity gaps): Adversarial review, Model fusion, Typed subagents, Lifecycle hooks, MCP tools
- P2 features (polish & reach): Dashboard, Voice I/O, Video input, Design-quality gate, Speed improvements

---

## 6. Quick start

```bash
# Install Prime Agent XE
npm install -g prime-agent-xe

# Basic usage (identical to upstream)
prime-agent

# Plan mode for safe exploration
prime-agent --plan

# With sandboxing enabled (default)
prime-agent

# With OpenAdapter (install adapter first)
export OPENADAPTER_API_KEY=oa_xxx
prime-agent

# Adverserial review workflow
/plan  # create plan
/review  # have rival model review
# proceed after approval
```
