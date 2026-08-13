# Prime Agent XE Desktop

A desktop UI for **Prime Agent XE**, built the way OpenCode's desktop app is built:

> **Electron shell + Vite/React web UI + WebSocket bridge to the `prime-agent` CLI.**

The desktop does **not** re-implement the agent. It spawns `prime-agent --mode rpc`
(a child process), bridges the agent's NDJSON stream to a local WebSocket, and
renders it in a web UI. This keeps the agent internals untouched and makes the UI
swappable (in-electron, headless, or remote).

```
Electron main (electron/main.cjs)
   ├─ spawns: prime-agent --mode rpc
   ├─ bridges  child.stdin/stdout  ⇄  local WebSocket (ws://localhost:18755)
   └─ exposes ws port to renderer via URL query

Renderer (Vite + React)
   ├─ Sidebar: connection status, running agents (`prime-agent agents`), new session
   ├─ Transcript: structured RPC events (best-effort text + raw-JSON toggle)
   ├─ Terminal: 1:1 raw NDJSON stream via xterm.js
   └─ Input box → RPC `{"type":"prompt","message":...}` (auto `steer` while streaming)
```

## Why this design

- **Reuses Prime Agent's protocol.** `--mode rpc` (NDJSON over stdio) and `--mode acp`
  (Agent Client Protocol) are already first-class; the desktop is just a client.
- **Decoupled renderer.** A WebSocket bridge (exactly OpenCode's approach) means the
  same web UI can run headless, in a browser, or inside Electron.
- **Two views.** A *structured transcript* for readability and a *raw terminal* for
  1:1 parity/debugging.

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
        (A) Desktop GUI tab        (B) Built-in CLI tab      (C) External native terminal
        Electron web UI            xterm + node-pty          Windows Terminal / GNOME /
        (structured transcript)     = identical to (C)         iTerm / macOS Terminal
```

- **(A) Desktop GUI** — the Electron web UI (structured transcript + raw terminal tabs).
- **(B) Built-in CLI** — a `Built-in CLI` tab that runs the *actual* `prime-agent`
  TUI inside the desktop via a PTY. Byte-for-byte the same as your native terminal.
- **(C) External CLI** — just run `prime-agent-xe` in any native terminal
  (Windows/Linux/mac). No Electron required; identical backend.

This is the OpenCode model: the CLI is the core, the desktop is a wrapper that adds a
GUI *and* an embedded terminal. One install, three ways to drive the same agent.

### Run the hybrid

```bash
prime-agent                         # (C) external CLI, full TUI in your terminal
# (alias it to `prime-agent-xe` if you prefer the XE name)
npm run start                      # (A)+(B) desktop IDE (GUI + built-in CLI tab)
```

| Env var | Default | Purpose |
|---|---|---|
| `XE_AGENT_BIN` | `prime-agent` | Agent binary for both RPC bridge and PTY |
| `XE_AGENT_ARGS` | `--mode rpc` | Args for the RPC/GUI bridge |
| `XE_PTY_ARGS` | _(empty)_ | Args for the built-in CLI (PTY) TUI |
| `XE_WS_PORT` | `18755` | GUI/RPC WebSocket port |
| `XE_PTY_PORT` | `18756` | Built-in CLI (PTY) WebSocket port |

> The built-in CLI tab needs `node-pty` (a native module). `npm install` builds it;
> if missing, that tab shows a notice while Chat/Terminal still work.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + 1` | Chat (structured transcript) |
| `Ctrl/⌘ + 2` | Terminal (raw NDJSON stream) |
| `Ctrl/⌘ + 3` | Built-in CLI (real TUI via PTY) |
| `Ctrl/⌘ + N` | New session |
| `Ctrl/⌘ + K` | Refresh running agents |
| `Ctrl/⌘ + B` | Toggle sidebar |
| `?` | Show / hide shortcuts help |
| `Esc` | Focus the prompt input |
| `Enter` | Send prompt (`Shift+Enter` = newline) |

Press `?` inside the app for the live list. View-switch keys work even inside the
built-in CLI; other shortcuts yield to the shell so terminal keybindings keep working.

## OS launcher shortcut (Linux)

A ready `.desktop` entry is provided:

```bash
# fill in the absolute path, then install it
sed -i "s|__XE_DESKTOP_DIR__|$(pwd)|g" prime-agent-xe.desktop
cp prime-agent-xe.desktop ~/.local/share/applications/
# (drop a 256x256 assets/xe-icon.png for the icon; optional)
```

This puts **Prime Agent XE** in your desktop environment's application menu /
launcher. On macOS/Windows the Electron build produces a `.app` / `.exe` with its
own Start-menu / Applications shortcut.

## Run it

```bash
# from packages/xe-desktop
npm install

# 1) Dev: Vite renderer + Electron shell side by side
npm run dev            # terminal 1: renderer on http://localhost:5173
npm run electron:dev   # terminal 2: Electron loads the dev renderer

# 2) Production: build renderer, launch Electron
npm run start
```

### Pointing at a specific agent

| Env var | Default | Purpose |
|---|---|---|
| `XE_AGENT_BIN` | `prime-agent` | Path/command for the agent binary |
| `XE_AGENT_ARGS` | `--mode rpc` | CLI args (space-separated) |
| `XE_WS_PORT` | `18755` | Local WebSocket port for the bridge |

Make sure a `prime-agent` (or `prime-agent-xe`) build is on your `PATH`, or set
`XE_AGENT_BIN` to its absolute path.

## Roadmap (see repo-root `PRIME-AGENT-XE.md`)

- Richer structured transcript (diff rendering, image attachments, tool I/O cards).
- Agent-family graph view (visualize `rlm` subagents and `agent_message` flow).
- Voice input/output (Voicebox-style) and video input (Kimi-style).
- Dashboard: live token/cost/context across the agent family.
- Native mixture-of-agents "fusion" provider (openfusion-style panel + judge).
