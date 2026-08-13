// Prime Agent XE Desktop — Electron main process.
//
// Architecture (mirrors OpenCode desktop):
//   Electron shell  ──spawns──▶  prime-agent --mode rpc  (one child PER session)
//        │                                  ▲ stdin/stdout (NDJSON)
//        │ WebSocket (ws://localhost:<port>) │
//        ▼                                  │
//   Renderer (Vite + React)  ──send RPC cmds──▶  main  ──▶ child.stdin
//        ▲  receive agent events (NDJSON lines) ◀── main ◀── child.stdout
//
// Each chat session is an independent rpc child with its own transcript. All
// transcripts are persisted to disk (userData/sessions/<id>.jsonl) so history
// survives app restarts and appears as tabs.

const { app, BrowserWindow, Menu } = require("electron");
const { spawn } = require("child_process");
const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");
const os = require("os");

app.disableHardwareAcceleration();
// Single-instance: re-clicking the icon focuses the running window instead of
// spawning a second agent/session manager (which would also clash on the port).
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on("second-instance", () => {
  const w = BrowserWindow.getAllWindows()[0];
  if (w) { if (w.isMinimized()) w.restore(); w.focus(); }
});

// Stable, branded data dir (sessions/history live here, survive restarts).
try { app.setPath("userData", path.join(os.homedir(), ".local/share/prime-agent-xe")); } catch (e) {}
if (process.platform === "linux") {
  app.commandLine.appendSwitch("disable-gpu");
  app.commandLine.appendSwitch("no-sandbox");
  app.commandLine.appendSwitch("disable-dev-shm-usage");
}

const WS_PORT = Number(process.env.XE_WS_PORT || 18755);
const PTY_PORT = Number(process.env.XE_PTY_PORT || 18756);
const AGENT_BIN = process.env.XE_AGENT_BIN || "prime-agent";
const AGENT_ARGS = process.env.XE_AGENT_ARGS ? process.env.XE_AGENT_ARGS.split(" ") : ["--mode", "rpc"];

let wsServer = null;
let SESSIONS_DIR = "";
const sessions = new Map();
let activeId = null;

function ensureDir() {
  SESSIONS_DIR = path.join(app.getPath("userData"), "sessions");
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}
const fileFor = (id) => path.join(SESSIONS_DIR, id + ".jsonl");
const newId = () => `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function broadcastSession(id, obj) {
  const msg = JSON.stringify(obj);
  if (!wsServer) return;
  for (const c of wsServer.clients) if (c.readyState === 1) c.send(msg);
}
function listSessions() {
  return [...sessions.values()]
    .map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt, count: s.frames.length, active: s.id === activeId, alive: !!s.child }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
function broadcastList() {
  broadcastSession(activeId || "", { type: "xe.sessionsList", sessions: listSessions() });
}

function pushFrame(session, raw, parsed) {
  const arr = session.frames;
  const last = arr[arr.length - 1];
  if (parsed && parsed.type === "message" && parsed.message && parsed.message.role === "user" &&
      last && last.parsed && last.parsed.type === "message" && last.parsed.message && last.parsed.message.role === "user") {
    const a = typeof parsed.message.content === "string" ? parsed.message.content : JSON.stringify(parsed.message.content);
    const b = typeof last.parsed.message.content === "string" ? last.parsed.message.content : JSON.stringify(last.parsed.message.content);
    if (a === b) return;
  }
  if (!raw) raw = JSON.stringify(parsed);
  session.frames.push({ raw, parsed });
  try { session.file.write(raw + "\n"); } catch (e) {}
  if (!session.title || session.title === "New chat") {
    const c = parsed && parsed.message ? parsed.message.content : null;
    if (parsed && parsed.type === "message" && parsed.message && parsed.message.role === "user" && typeof c === "string" && c.trim()) {
      session.title = c.trim().slice(0, 40);
      broadcastList();
    }
  }
  broadcastSession(session.id, { type: "frame", sessionId: session.id, raw, parsed });
}

function spawnChild(session) {
  const child = spawn(AGENT_BIN, AGENT_ARGS, { stdio: ["pipe", "pipe", "pipe"] });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  let buf = "";
  child.stdout.on("data", (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.trim()) continue;
      let parsed = null; try { parsed = JSON.parse(line); } catch (e) {}
      pushFrame(session, line, parsed);
    }
  });
  child.stderr.on("data", (c) => broadcastSession(session.id, { type: "agent.stderr", sessionId: session.id, line: c.toString() }));
  child.on("exit", (code) => { session.child = null; session.alive = false; broadcastSession(session.id, { type: "agent.exit", sessionId: session.id, code }); broadcastList(); });
  child.on("error", (err) => broadcastSession(session.id, { type: "agent.error", sessionId: session.id, message: String(err) }));
  session.child = child;
  session.alive = true;
}
function ensureChild(session) {
  if (!session.child && !session._spawning) {
    session._spawning = true;
    try { spawnChild(session); } finally { session._spawning = false; }
  }
}

function createSession() {
  const id = newId();
  const session = { id, title: "New chat", createdAt: Date.now(), child: null, frames: [], file: fs.createWriteStream(fileFor(id), { flags: "a" }), alive: false };
  sessions.set(id, session);
  ensureChild(session);
  activeId = id;
  broadcastList();
  return session;
}

function loadSessionsFromDisk() {
  ensureDir();
  let files = [];
  try { files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".jsonl")); } catch (e) {}
  const loaded = [];
  for (const f of files) {
    const id = f.replace(/\.jsonl$/, "");
    const frames = [];
    try {
      const txt = fs.readFileSync(fileFor(id), "utf8");
      for (const ln of txt.split("\n")) {
        if (!ln.trim()) continue;
        let parsed = null; try { parsed = JSON.parse(ln); } catch (e) {}
        frames.push({ raw: ln, parsed });
      }
    } catch (e) {}
    let stat; try { stat = fs.statSync(fileFor(id)); } catch (e) { stat = { mtimeMs: Date.now() }; }
    let title = "New chat";
    const fu = frames.find((fr) => fr.parsed && fr.parsed.type === "message" && fr.parsed.message && fr.parsed.message.role === "user");
    if (fu) { const c = fu.parsed.message.content; if (typeof c === "string" && c.trim()) title = c.trim().slice(0, 40); }
    const session = { id, title, createdAt: stat.mtimeMs, child: null, frames, file: fs.createWriteStream(fileFor(id), { flags: "a" }), alive: false };
    sessions.set(id, session);
    loaded.push(session);
  }
  loaded.sort((a, b) => b.createdAt - a.createdAt);
  if (loaded.length) { activeId = loaded[0].id; ensureChild(loaded[0]); }
  else createSession();
}

function deleteSession(id) {
  const s = sessions.get(id);
  if (!s) return;
  try { s.child && s.child.kill(); } catch (e) {}
  try { s.file.end(); } catch (e) {}
  try { fs.unlinkSync(fileFor(id)); } catch (e) {}
  sessions.delete(id);
  if (activeId === id) {
    const next = [...sessions.values()].sort((a, b) => b.createdAt - a.createdAt)[0];
    if (next) { activeId = next.id; ensureChild(next); }
    else createSession();
  }
  broadcastList();
}

function handleControl(ws, payload) {
  if (payload.xeControl === "models") {
    const p = spawn(AGENT_BIN, ["model", "list"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = ""; p.stdout.on("data", (c) => (out += c));
    p.on("close", () => ws.send(JSON.stringify({ type: "xe.models", data: out })));
  } else if (payload.xeControl === "sessions") {
    const p = spawn(AGENT_BIN, ["agents"], { stdio: ["ignore", "pipe", "ignore"] });
    let out = ""; p.stdout.on("data", (c) => (out += c));
    p.on("close", () => ws.send(JSON.stringify({ type: "xe.sessions", data: out })));
  } else if (payload.xeControl === "listSessions") {
    ws.send(JSON.stringify({ type: "xe.sessionsList", sessions: listSessions() }));
  } else if (payload.xeControl === "newSession") {
    createSession();
    const s = sessions.get(activeId);
    ws.send(JSON.stringify({ type: "xe.sessionFrames", id: activeId, frames: s ? s.frames : [] }));
  } else if (payload.xeControl === "openSession") {
    const s = sessions.get(payload.id);
    if (s) { ensureChild(s); activeId = s.id; ws.send(JSON.stringify({ type: "xe.sessionFrames", id: s.id, frames: s.frames })); broadcastList(); }
  } else if (payload.xeControl === "deleteSession") {
    deleteSession(payload.id);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 820, backgroundColor: "#0b0b0f",
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
  });
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  const menu = Menu.buildFromTemplate([
    { label: "View", submenu: [
      { label: "Built-in CLI", accelerator: "CmdOrCtrl+1", click: () => win.webContents.send("xe-menu", { type: "view", value: "builtin" }) },
      { label: "Terminal", accelerator: "CmdOrCtrl+2", click: () => win.webContents.send("xe-menu", { type: "view", value: "terminal" }) },
      { type: "separator" },
      { label: "Toggle Sidebar", accelerator: "CmdOrCtrl+B", click: () => win.webContents.send("xe-menu", { type: "sidebar" }) },
    ]},
    { label: "Session", submenu: [
      { label: "New Session", accelerator: "CmdOrCtrl+N", click: () => win.webContents.send("xe-menu", { type: "new" }) },
      { label: "Refresh Agents", accelerator: "CmdOrCtrl+K", click: () => win.webContents.send("xe-menu", { type: "refresh" }) },
      { label: "Switch Model…", accelerator: "CmdOrCtrl+P", click: () => win.webContents.send("xe-menu", { type: "models" }) },
    ]},
    { label: "Help", submenu: [ { label: "Keyboard Shortcuts", click: () => win.webContents.send("xe-menu", { type: "help" }) } ]},
  ]);
  Menu.setApplicationMenu(menu);
  if (rendererUrl) win.loadURL(`${rendererUrl}?wsPort=${WS_PORT}&ptyPort=${PTY_PORT}`);
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"), { query: { wsPort: String(WS_PORT), ptyPort: String(PTY_PORT) } });
}

function startWs() {
  wsServer = new WebSocketServer({ port: WS_PORT });
  wsServer.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "xe.sessionsList", sessions: listSessions() }));
    if (activeId && sessions.has(activeId)) ws.send(JSON.stringify({ type: "xe.sessionFrames", id: activeId, frames: sessions.get(activeId).frames }));
    ws.on("message", (raw) => {
      let payload; try { payload = JSON.parse(raw.toString()); } catch (e) { return; }
      if (payload && payload.xeControl) { handleControl(ws, payload); return; }
      if (payload && payload.type === "prompt") {
        const s = sessions.get(payload.sessionId || activeId);
        if (!s) return;
        ensureChild(s);
        if (s.child && s.child.stdin) s.child.stdin.write(JSON.stringify(payload) + "\n");
        pushFrame(s, null, { type: "message", message: { role: "user", content: payload.message }, _synthetic: true });
        return;
      }
      if (payload && payload.type === "abort" && payload.sessionId) {
        const s = sessions.get(payload.sessionId);
        try { s && s.child && s.child.stdin && s.child.stdin.write(JSON.stringify(payload) + "\n"); } catch (e) {}
      }
    });
  });
  console.log(`[xe-desktop] WebSocket bridge listening on ws://localhost:${WS_PORT}`);
}

function startPty() {
  let pty;
  try { pty = require("node-pty"); } catch (e) { console.warn("[xe-desktop] node-pty not installed — built-in terminal tab disabled"); return; }
  const ptyServer = new WebSocketServer({ port: PTY_PORT });
  const ptyArgs = process.env.XE_PTY_ARGS ? process.env.XE_PTY_ARGS.split(" ") : [];
  ptyServer.on("connection", (ws) => {
    const term = pty.spawn(AGENT_BIN, ptyArgs, { name: "xterm-color", cols: 80, rows: 30, env: process.env });
    term.onData((data) => { if (ws.readyState === 1) ws.send(data); });
    ws.on("message", (raw) => {
      let msg; try { msg = JSON.parse(raw.toString()); } catch (e) { term.write(raw.toString()); return; }
      if (msg.cols && msg.rows) term.resize(msg.cols, msg.rows);
    });
    ws.on("close", () => term.kill());
  });
  console.log(`[xe-desktop] Built-in terminal (PTY) bridge on ws://localhost:${PTY_PORT}`);
}

app.whenReady().then(() => {
  loadSessionsFromDisk();
  startWs();
  startPty();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => {
  for (const s of sessions.values()) try { s.child && s.child.kill(); } catch (e) {}
  if (process.platform !== "darwin") app.quit();
});
