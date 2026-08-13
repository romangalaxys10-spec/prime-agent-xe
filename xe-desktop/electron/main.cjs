// Prime Agent XE Desktop — Electron main process.
//
// Architecture (mirrors OpenCode desktop):
//   Electron shell  ──spawns──▶  prime-agent --mode rpc  (child process)
//        │                                  ▲ stdin/stdout (NDJSON)
//        │ WebSocket (ws://localhost:<port>) │
//        ▼                                  │
//   Renderer (Vite + React)  ──send RPC cmds──▶  main  ──▶ child.stdin
//        ▲  receive agent events (NDJSON lines) ◀── main ◀── child.stdout
//
// The renderer never talks to the agent binary directly; the main process is the
// only bridge, which keeps the web UI swappable (headless, remote, in-electron).

const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");
const path = require("path");

app.disableHardwareAcceleration();
// Robust launch on Linux/Wayland (avoid exit code 15) and as root.
if (process.platform === "linux") {
  app.commandLine.appendSwitch("disable-gpu");
  try { if (process.getuid && process.getuid() === 0) app.commandLine.appendSwitch("no-sandbox"); } catch {}
}


const WS_PORT = Number(process.env.XE_WS_PORT || 18755);
const PTY_PORT = Number(process.env.XE_PTY_PORT || 18756);
const AGENT_BIN = process.env.XE_AGENT_BIN || "prime-agent";
const AGENT_ARGS = process.env.XE_AGENT_ARGS
  ? process.env.XE_AGENT_ARGS.split(" ")
  : ["--mode", "rpc"];

let child = null;
let wsServer = null;
let pendingBuffer = "";

function startAgent() {
  child = spawn(AGENT_BIN, AGENT_ARGS, { stdio: ["pipe", "pipe", "pipe"] });

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  // RPC framing: split on "\n" only (strip optional trailing "\r"). Do NOT use
  // Node readline — it also splits on U+2028/U+2029, which are valid inside
  // JSON strings and would corrupt RPC frames (see prime-agent docs/rpc.md).
  child.stdout.on("data", (chunk) => {
    pendingBuffer += chunk;
    let idx;
    while ((idx = pendingBuffer.indexOf("\n")) >= 0) {
      let line = pendingBuffer.slice(0, idx);
      pendingBuffer = pendingBuffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.trim()) broadcast({ type: "agent", line });
    }
  });

  child.stderr.on("data", (chunk) => {
    broadcast({ type: "agent.stderr", line: chunk.toString() });
  });

  child.on("exit", (code) => {
    broadcast({ type: "agent.exit", code });
  });
  child.on("error", (err) => {
    broadcast({ type: "agent.error", message: String(err) });
  });
}

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  if (wsServer) {
    for (const client of wsServer.clients) {
      if (client.readyState === 1) client.send(msg);
    }
  }
}

// Control channel for the renderer (sessions list, etc.). Kept separate from the
// RPC stream so it can't be confused with agent frames.
function handleControl(ws, payload) {
  if (payload.xeControl === "models") {
    const p = spawn(AGENT_BIN, ["model", "list"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    p.stdout.on("data", (c) => (out += c));
    p.on("close", () => ws.send(JSON.stringify({ type: "xe.models", data: out })));
  } else if (payload.xeControl === "sessions") {
    const p = spawn(AGENT_BIN, ["agents"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    p.stdout.on("data", (c) => (out += c));
    p.on("close", () => ws.send(JSON.stringify({ type: "xe.sessions", data: out })));
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    backgroundColor: "#0b0b0f",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  // Native menu bar with accelerators (visible on macOS/Windows; accelerators
  // work globally on Linux too). Only safe, non-shell keys are bound here so the
  // built-in CLI tab keeps its own terminal bindings. View switching + new session.
  const menu = Menu.buildFromTemplate([
    {
      label: "View",
      submenu: [
        { label: "Built-in CLI", accelerator: "CmdOrCtrl+1", click: () => win.webContents.send("xe-menu", { type: "view", value: "builtin" }) },
        { label: "Terminal", accelerator: "CmdOrCtrl+2", click: () => win.webContents.send("xe-menu", { type: "view", value: "terminal" }) },
        { type: "separator" },
        { label: "Toggle Sidebar", accelerator: "CmdOrCtrl+B", click: () => win.webContents.send("xe-menu", { type: "sidebar" }) },
      ],
    },
    {
      label: "Session",
      submenu: [
        { label: "New Session", accelerator: "CmdOrCtrl+N", click: () => win.webContents.send("xe-menu", { type: "new" }) },
        { label: "Refresh Agents", accelerator: "CmdOrCtrl+K", click: () => win.webContents.send("xe-menu", { type: "refresh" }) },
        { label: "Switch Model…", accelerator: "CmdOrCtrl+P", click: () => win.webContents.send("xe-menu", { type: "models" }) },
      ],
    },
    {
      label: "Help",
      submenu: [
        { label: "Keyboard Shortcuts", click: () => win.webContents.send("xe-menu", { type: "help" }) },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);

  if (rendererUrl) {
    win.loadURL(`${rendererUrl}?wsPort=${WS_PORT}&ptyPort=${PTY_PORT}`);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"), {
      query: { wsPort: String(WS_PORT), ptyPort: String(PTY_PORT) },
    });
  }
}

function startWs() {
  wsServer = new WebSocketServer({ port: WS_PORT });
  wsServer.on("connection", (ws) => {
    ws.on("message", (raw) => {
      let payload;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (payload && payload.xeControl) {
        handleControl(ws, payload);
        return;
      }
      // Otherwise it's an RPC command for the agent → forward to child stdin.
      if (child && child.stdin) {
        child.stdin.write(JSON.stringify(payload) + "\n");
      }
    });
  });
  console.log(`[xe-desktop] WebSocket bridge listening on ws://localhost:${WS_PORT}`);
}


// ---------------------------------------------------------------------------
// Built-in terminal bridge (HYBRID mode): run the *real* prime-agent TUI inside
// the desktop via a PTY, so the in-app CLI is byte-for-byte the same as running
// `prime-agent` in the user's native external terminal (Windows Terminal / GNOME
// Terminal / iTerm). xterm.js in the renderer is the frontend; node-pty is the
// backend. Resize is sent as JSON {cols,rows}; everything else is raw keystrokes.
// ---------------------------------------------------------------------------
function startPty() {
  let pty;
  try {
    pty = require("node-pty");
  } catch {
    console.warn("[xe-desktop] node-pty not installed — built-in terminal tab disabled");
    return;
  }
  const ptyServer = new WebSocketServer({ port: PTY_PORT });
  const ptyArgs = process.env.XE_PTY_ARGS ? process.env.XE_PTY_ARGS.split(" ") : [];
  ptyServer.on("connection", (ws) => {
    const term = pty.spawn(AGENT_BIN, ptyArgs, {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      env: process.env,
    });
    term.onData((data) => {
      if (ws.readyState === 1) ws.send(data);
    });
    ws.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        term.write(raw.toString());
        return;
      }
      if (msg.cols && msg.rows) term.resize(msg.cols, msg.rows);
    });
    ws.on("close", () => term.kill());
  });
  console.log(`[xe-desktop] Built-in terminal (PTY) bridge on ws://localhost:${PTY_PORT}`);
}

app.whenReady().then(() => {
  startAgent();
  startWs();
  startPty();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (child) child.kill();
  if (process.platform !== "darwin") app.quit();
});
