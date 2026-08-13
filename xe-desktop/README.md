# Prime Agent XE Desktop

A desktop UI for **Prime Agent XE**, built with **shadcn/ui + Tailwind CSS** (PRO-grade:
cards, dialogs, dropdown menus, tabs, tooltips, a `cmdk` model palette) and styled after
**Trae** (work.trae.ai): a clean dark IDE with a centered workspace (terminal / built-in
CLI) and an always-on AI chat panel on the right, a violet accent, and message bubbles.

It is built the way OpenCode's desktop app is built:

> **Electron shell + Vite/React web UI + WebSocket bridge to the `prime-agent` CLI.**

The desktop does **not** re-implement the agent. It spawns `prime-agent --mode rpc`
(a child process), bridges the agent's NDJSON stream to a local WebSocket, and renders
it in a web UI. This keeps the agent internals untouched and makes the UI swappable
(in-electron, headless, or remote).

```
Electron main (electron/main.cjs)
   ├─ spawns: prime-agent --mode rpc
   ├─ bridges  child.stdin/stdout  ⇄  local WebSocket (ws://localhost:18755)
   └─ exposes ws port to renderer via URL query

Renderer (Vite + React, Trae-style)
   ├─ Sidebar: connection status, model switch, session controls, running agents
   ├─ Workspace (center): built-in CLI (PTY) or raw Terminal
   ├─ Chat panel (right): message bubbles + prompt input
   └─ TopBar: model selector (Ctrl/⌘+P), workspace toggle, status
```

## Why this design

- **Reuses Prime Agent's protocol.** `--mode rpc` (NDJSON over stdio) is already
  first-class; the desktop is just a client.
- **Decoupled renderer.** A WebSocket bridge (exactly OpenCode's approach) means the
  same web UI can run headless, in a browser, or inside Electron.
- **One backend, three front-ends.** A *structured chat panel* for everyday use and a
  *real terminal* for parity/debugging.

## Hybrid: desktop IDE **and** CLI from one backend

Prime Agent XE uses a **single agent backend** (the `prime-agent` runtime) that can
be driven from three front-ends — pick whatever fits the moment:

```
                    ┌─────────────────────────────────────────────┐
                    │            prime-agent-xe backend            │
                    │   (daemon worker · IPython kernel · RLM)    │
                    └───────────────┬───────────────┬─────────────┘
                  RPC/ACP (NDJSON) │               │ PTY (real TUI)
                                    ▼               ▼
        (A) Desktop GUI             (B) Built-in CLI tab      (C) External native terminal
        Electron web UI            xterm + node-pty          Windows Terminal / GNOME /
        (chat panel + workspace)     = identical to (C)         iTerm / macOS Terminal
```

- **(A) Desktop GUI** — the Electron web UI (chat panel + built-in CLI workspace).
- **(B) Built-in CLI** — a workspace pane that runs the *actual* `prime-agent`
  TUI inside the desktop via a PTY. Byte-for-byte the same as your native terminal.
- **(C) External CLI** — just run `prime-agent` in any native terminal
  (Windows/Linux/mac). No Electron required; identical backend.

This is the OpenCode model: the CLI is the core, the desktop is a wrapper that adds a
GUI *and* an embedded terminal. One install, three ways to drive the same agent.

### Run the hybrid

```bash
prime-agent                         # (C) external CLI, full TUI in your terminal
npm run start                      # (A)+(B) desktop IDE (GUI + built-in CLI)
```

| Env var | Default | Purpose |
|---|---|---|
| `XE_AGENT_BIN` | `prime-agent` | Agent binary for both RPC bridge and PTY |
| `XE_AGENT_ARGS` | `--mode rpc` | Args for the RPC/GUI bridge |
| `XE_PTY_ARGS` | _(empty)_ | Args for the built-in CLI (PTY) TUI |
| `XE_WS_PORT` | `18755` | GUI/RPC WebSocket port |
| `XE_PTY_PORT` | `18756` | Built-in CLI (PTY) WebSocket port |

> The built-in CLI workspace needs `node-pty` (a native module), declared as an
> *optional* dependency — if it can't build, that pane shows a notice while the
> chat panel and Terminal still work.

## Sessions, tabs & history

Every chat is an **independent session** with its own `prime-agent --mode rpc`
child and its own transcript. Sessions are **persisted to disk**
(`~/.local/share/prime-agent-xe/sessions/<id>.jsonl`) so your chat history
survives app restarts and shows up as **tabs** in the chat panel:

- **New chat** (button in the tab bar, or `Ctrl/⌘+N`) opens a fresh session tab.
- **Switch tabs** to revisit any past conversation; each tab keeps its own history.
- **Close a tab (×)** deletes that session (its file is removed).
- On launch, the most recent session is restored automatically; the rest are one
  click away in the tab bar. Session titles are taken from the first message.

> Note: the agent's *live reasoning context* starts fresh per launch (rpc is
> stateless); the persisted history is the full visible transcript. True
> agent-context resume can be layered on later via `prime-agent --resume`.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + 1` | Built-in CLI (workspace) |
| `Ctrl/⌘ + 2` | Terminal (workspace) |
| `Ctrl/⌘ + N` | New session |
| `Ctrl/⌘ + K` | Refresh running agents |
| `Ctrl/⌘ + B` | Toggle sidebar |
| `Ctrl/⌘ + P` | Switch model (Trae-style palette) |
| `?` | Show / hide shortcuts help |
| `Enter` | Send prompt (`Shift+Enter` = newline) |

Press `?` inside the app for the live list. View-switch keys (`Ctrl+1/2`) work even
inside the built-in CLI; other shortcuts yield to the shell so terminal keybindings
keep working.

A **native app menu** (View / Session / Help) is also registered with the same
accelerators, so the shortcuts appear in the menu bar (macOS/Windows) and are globally
active on Linux too.

## Launching (Ubuntu apps drawer / desktop)

The launcher (`prime-agent-xe.desktop`) runs `xe-desktop/run.sh`, which:
1. Finds Node (including nvm-managed installs, since GUI sessions don't source `.bashrc`).
2. `npm install` once (optional deps like `node-pty` are skipped if they can't build).
3. Builds the renderer once (skips if `dist/` already exists — fast subsequent launches).
4. Launches Electron with no rebuild.

`run.sh` is idempotent and fails loudly if Node is missing. If it ever doesn't open,
run `./xe-desktop/run.sh` from a terminal to see the error.

Install into the apps drawer / desktop:

```bash
bash xe-desktop/install-launcher.sh
```

## Development

```bash
cd xe-desktop
npm install
npm run dev      # Vite dev server + hot reload (open the printed URL)
# or
npm run build && npm start   # production build + Electron
```

The renderer talks to the agent over `ws://localhost:18755`. The main process spawns
`prime-agent --mode rpc`, splits its stdout on newlines only (per `docs/rpc.md` — do
**not** use Node `readline`, which also splits U+2028/U+2029), and forwards each line
to connected renderer sockets.

## Files

| Path | Role |
|---|---|
| `electron/main.cjs` | Main process: spawn agent, WS bridge, native menu, model control |
| `electron/preload.cjs` | Context bridge: `window.xe` ports + `window.electron.onMenu` |
| `src/App.tsx` | Trae-style 3-pane layout |
| `src/TopBar.tsx` | Brand, model selector, workspace toggle, status |
| `src/Sidebar.tsx` | Connection/agent status, session controls |
| `src/Workspace.tsx` | Center workspace (Terminal / Built-in CLI) |
| `src/ChatPanel.tsx` | Right chat panel (bubbles + input) |
| `src/Transcript.tsx` | Message bubbles + raw-JSON toggle |
| `src/Terminal.tsx` | Raw NDJSON xterm view |
| `src/BuiltinTerminal.tsx` | node-pty ⇄ xterm for the real TUI |
| `src/useAgentSocket.ts` | WebSocket client + RPC framing |
| `src/useShortcuts.ts` | Global keyboard shortcuts |
| `src/ModelSwitcher.tsx` | `Ctrl/⌘+P` model palette |
| `src/ShortcutsOverlay.tsx` | `?` help overlay |
| `install-launcher.sh` | Install `.desktop` into apps drawer + Desktop |
| `prime-agent-xe.desktop` | Launcher template (installed by the script) |
| `run.sh` | Idempotent launcher (Node/PATH-safe) |
