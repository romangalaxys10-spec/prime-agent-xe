import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAgentSocket } from "./useAgentSocket";
import { Transcript } from "./Transcript";
import { Terminal } from "./Terminal";
import { Sidebar } from "./Sidebar";
import { BuiltinTerminal } from "./BuiltinTerminal";
import { useShortcuts, type View } from "./useShortcuts";
import { ShortcutsOverlay } from "./ShortcutsOverlay";
import { ModelSwitcher } from "./ModelSwitcher";

const WS_PORT = (window as any).xe?.getWsPort?.() || 18755;
const PTY_PORT = (window as any).xe?.getPtyPort?.() || 18756;

export function App() {
  const { frames, connected, sessions, models, send, requestSessions, requestModels } = useAgentSocket(WS_PORT);
  const [input, setInput] = useState("");
  const [view, setView] = useState<View>("chat");
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModels, setShowModels] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const streaming = useMemo(() => {
    let s = false;
    for (const f of frames) {
      const t = f.parsed?.type;
      if (t === "start") s = true;
      else if (t === "done" || t === "error") s = false;
    }
    return s;
  }, [frames]);

  useEffect(() => {
    const off = (window as any).electron?.onMenu?.((msg: any) => {
      switch (msg.type) {
        case "view": setView(msg.value); break;
        case "new": window.location.reload(); break;
        case "refresh": requestSessions(); break;
        case "models": requestModels(); setShowModels(true); break;
        case "sidebar": setSidebarOpen((v) => !v); break;
        case "help": setShowHelp((v) => !v); break;
      }
    });
    return () => off?.();
  }, [requestSessions, requestModels]);

  const pickModel = (v: string) => {
    send({ type: "prompt", message: `/model ${v}` });
    setShowModels(false);
  };

  const submit = () => {
    const message = input.trim();
    if (!message) return;
    send(
      streaming
        ? { type: "prompt", message, streamingBehavior: "steer" }
        : { type: "prompt", message },
    );
    setInput("");
  };

  useShortcuts(
    {
      setView,
      newSession: () => window.location.reload(),
      refreshAgents: requestSessions,
      toggleHelp: () => setShowHelp((v) => !v),
      focusInput: () => inputRef.current?.focus(),
      toggleSidebar: () => setSidebarOpen((v) => !v),
      toggleModels: () => { requestModels(); setShowModels(true); },
    },
    view,
  );

  return (
    <div style={styles.app}>
      {sidebarOpen && (
        <Sidebar
          connected={connected}
          sessions={sessions}
          onRequestSessions={requestSessions}
          onNewSession={() => window.location.reload()}
        />
      )}
      <div style={styles.main}>
        <div style={styles.tabs}>
          <button style={styles.iconBtn} title="Toggle sidebar (Ctrl/⌘+B)" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
          <button style={view === "chat" ? styles.tabOn : styles.tab} onClick={() => setView("chat")}>Chat</button>
          <button style={view === "terminal" ? styles.tabOn : styles.tab} onClick={() => setView("terminal")}>Terminal</button>
          <button style={view === "builtin" ? styles.tabOn : styles.tab} onClick={() => setView("builtin")}>Built-in CLI</button>
          <span style={styles.flex} />
          <span style={styles.muted}>{streaming ? "● streaming" : "idle"}</span>
          <button style={styles.iconBtn} title="Shortcuts (?)" onClick={() => setShowHelp((v) => !v)}>?</button>
        </div>
        <div style={styles.body}>
          {view === "chat" ? (
            <Transcript frames={frames} />
          ) : view === "terminal" ? (
            <Terminal frames={frames} />
          ) : (
            <BuiltinTerminal ptyPort={PTY_PORT} />
          )}
        </div>
        <div style={styles.inputBar}>
          <textarea
            ref={inputRef}
            style={styles.input}
            placeholder='Message Prime Agent XE…  (Enter to send, Shift+Enter newline)'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button style={styles.send} onClick={submit}>Send</button>
        </div>
      </div>
      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      {showModels && <ModelSwitcher modelsText={models} onPick={pickModel} onClose={() => setShowModels(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: { display: "flex", height: "100vh", background: "#0b0b0f", color: "#ddd", fontFamily: "system-ui, sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  tabs: { display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderBottom: "1px solid #222", background: "#0d0d12" },
  tab: { background: "transparent", color: "#aaa", border: "none", padding: "4px 10px", cursor: "pointer", borderRadius: 6 },
  tabOn: { background: "#1b1b24", color: "#fff", border: "none", padding: "4px 10px", cursor: "pointer", borderRadius: 6 },
  iconBtn: { background: "transparent", color: "#aaa", border: "none", padding: "4px 8px", cursor: "pointer", borderRadius: 6, fontSize: 14 },
  flex: { flex: 1 },
  muted: { fontSize: 12, color: "#888" },
  body: { flex: 1, minHeight: 0, overflow: "hidden" },
  inputBar: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #222", background: "#0d0d12" },
  input: { flex: 1, resize: "none", height: 48, background: "#15151c", color: "#eee", border: "1px solid #2a2a36", borderRadius: 8, padding: 8, fontFamily: "ui-monospace, monospace", fontSize: 13 },
  send: { background: "#3b5bdb", color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", cursor: "pointer" },
};
