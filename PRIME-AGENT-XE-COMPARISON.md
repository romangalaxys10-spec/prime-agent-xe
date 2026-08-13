# Prime Agent XE — Comparison vs. upstream Prime Agent

> **Upstream:** [`PrimeIntellect-ai/prime-agent`](https://github.com/PrimeIntellect-ai/prime-agent)
> **Fork:** [`romangalaxys10-spec/prime-agent-xe`](https://github.com/romangalaxys10-spec/prime-agent-xe) (this repo)
>
> Prime Agent XE (Extreme Edition) is a **drop-in fork** of Prime Agent. The agent
> runtime, protocol, and monorepo are unchanged; XE *adds* a desktop IDE, a provider
> ecosystem entry, launcher integration, and UX affordances on top.

## TL;DR

| Area | Upstream Prime Agent | Prime Agent XE |
|---|---|---|
| Core agent runtime | `prime-agent` (daemon + workers + ACP/RPC) | **Identical** — same binary, same protocol |
| CLI | `prime-agent` TUI (text / json / rpc / acp / daemon) | **Identical**, plus a desktop GUI wrapper |
| Desktop UI | None (CLI only) | **New**: Electron + Vite/React IDE (Trae-style) |
| Provider ecosystem | OpenAI / Anthropic / etc. via `pi.registerProvider` | **+ OpenAdapter/Koda** example provider |
| Model switching | `/model <name>` in the TUI | **+ `Ctrl/⌘+P` palette** (OpenCode-style) |
| Keyboard shortcuts | Limited | **+ global shortcut map** (`Ctrl+1/2/N/K/B/P`, `?`) |
| Native app menu | None | **+ Electron menu** (View/Session/Help w/ accelerators) |
| OS integration | None | **+ `.desktop` launcher** for Ubuntu apps drawer / Desktop |
| Branding | Prime Agent | **Prime Agent XE** (binary stays `prime-agent`) |

---

## 1. Architecture (unchanged)

Both share the same monorepo (`ai`, `agent`, `coding-agent`, `tui`, `docs`) and the
same execution model:

- **Modes:** `text`, `json`, `rpc` (NDJSON over stdio), `acp` (Agent Client Protocol), `daemon`.
- **RPC framing (docs/rpc.md):** split child stdout on `\n` only, strip trailing `\r`;
  do **not** use Node `readline` (it also splits U+2028/U+2029). XE's desktop bridge
  follows this exactly.
- **Provider registry:** `pi.registerProvider(...)` with an OpenAI-compatible shape
  (`baseUrl`, `apiKey`, `api`, `models[]`). XE introduces one new example provider but
  changes **zero** provider internals.

> Nothing in the agent's decision loop, tool use, or model calls was modified. XE is
> strictly additive.

---

## 2. What XE adds

### 2.1 Desktop IDE (`xe-desktop/`) — *new, outside `packages/*`*
A Trae-style (work.trae.ai) Electron app that wraps the CLI instead of replacing it:

- **Electron main** (`electron/main.cjs`) spawns `prime-agent --mode rpc`, bridges its
  NDJSON stream to a local WebSocket (`ws://localhost:18755`), and serves a Vite/React
  renderer. The desktop is purely a *client* of the agent.
- **Workspace (center):** a real PTY running the `prime-agent` TUI (via `node-pty` ⇄
  xterm.js) — byte-for-byte the same as your native terminal — and a raw Terminal tab.
- **Chat panel (right):** message bubbles + prompt input; sends
  `{"type":"prompt","message":...}` and auto-`steer` while a run is streaming.
- **Top bar:** brand, model selector (opens the `Ctrl/⌘+P` palette), workspace toggle,
  status indicator.
- **Hybrid:** one backend, three front-ends — desktop GUI, built-in CLI, and your own
  external terminal. None require re-implementing the agent.

### 2.2 Model switcher (`Ctrl/⌘+P`) — *OpenCode-style*
- A native app-menu item and a global shortcut open a fuzzy palette.
- It lists models from `prime-agent model list`, and sends `/model <pattern>` to switch.
- Works inside the desktop GUI; mirrors OpenCode's `Ctrl+P` model picker.

### 2.3 Global keyboard shortcuts + native menu
- Shortcut map: `Ctrl/⌘ + 1` (Built-in CLI), `2` (Terminal), `N` (new session),
  `K` (refresh agents), `B` (sidebar), `P` (model), `?` (help).
- An Electron **native menu** (View / Session / Help) carries the same accelerators so
  they appear in the OS menu bar and are globally active on Linux too.
- View-switch keys work even inside the built-in CLI tab; other shortcuts yield to the
  shell so terminal keybindings keep working.

### 2.4 Provider ecosystem — OpenAdapter / Koda
- `packages/coding-agent/examples/extensions/custom-provider-openadapter/`
  registers provider `openadapter` as an OpenAI-compatible endpoint
  (`https://api.openadapter.in/v1`), exposing Koda, DeepSeek, Qwen, GLM, MiniMax, etc.
- Drop-in: zero new dependencies; enabled by adding one extension import.

### 2.5 OS integration — Ubuntu launcher
- `xe-desktop/prime-agent-xe.desktop` (+ `install-launcher.sh`) installs the app into
  the **Ubuntu apps drawer** (`~/.local/share/applications`) and onto the **Desktop**
  (trusted via `gio`), with a generated branded icon.
- `run.sh` is idempotent and Node/PATH-safe (handles nvm in GUI sessions), installs deps
  once, builds the renderer once, then launches Electron with no rebuild.

### 2.6 Branding
- Root `package.json` `name` → `prime-agent-xe`, `productName` → **Prime Agent XE**;
  README branded. The **installed binary stays `prime-agent`** for install compatibility
  (per the fork's binary-naming constraint).

---

## 3. What is intentionally *not* changed

- No edits to the agent's reasoning, tools, or model-calling code.
- No changes to the npm workspace scopes (`@prime-intellect/*`) — XE keeps the upstream
  internal scope to avoid breaking the monorepo build, and keeps `xe-desktop/` outside
  `packages/*` so Electron deps never leak into `npm install --workspaces`.
- The `prime-agent` CLI command name and flags are unchanged, so existing scripts,
  CI, and muscle memory keep working.

---

## 4. File map (XE-only additions)

| Path | XE addition |
|---|---|
| `xe-desktop/` | Entire desktop IDE (Electron + Vite/React) |
| `xe-desktop/electron/main.cjs` | Agent spawn + WS bridge + native menu + model control |
| `xe-desktop/electron/preload.cjs` | Context bridge (`window.xe`, `window.electron.onMenu`) |
| `xe-desktop/src/App.tsx` | Trae-style 3-pane layout |
| `xe-desktop/src/TopBar.tsx` | Brand, model selector, workspace toggle |
| `xe-desktop/src/ChatPanel.tsx`, `Transcript.tsx` | Chat bubbles + input |
| `xe-desktop/src/Workspace.tsx`, `Terminal.tsx`, `BuiltinTerminal.tsx` | Workspace panes |
| `xe-desktop/src/ModelSwitcher.tsx` | `Ctrl/⌘+P` palette |
| `xe-desktop/src/useShortcuts.ts` | Global shortcut map |
| `xe-desktop/install-launcher.sh`, `prime-agent-xe.desktop`, `run.sh` | Ubuntu launcher |
| `packages/coding-agent/examples/extensions/custom-provider-openadapter/` | OpenAdapter provider |
| `PRIME-AGENT-XE.md` | Master strategy / capability audit doc |
| `PRIME-AGENT-XE-COMPARISON.md` | This comparison |

---

## 5. Quick start

```bash
# External CLI (same as upstream)
prime-agent

# Desktop IDE (XE addition)
bash xe-desktop/install-launcher.sh   # adds to Ubuntu apps drawer + Desktop
# then open "Prime Agent XE" from the drawer, or:
cd xe-desktop && npm install && npm run build && npm start
```

> **Bottom line:** Prime Agent XE is upstream Prime Agent with a desktop face, a model
> picker, richer UX, an OpenAdapter provider example, and OS launcher integration —
> with the agent core left completely intact.
