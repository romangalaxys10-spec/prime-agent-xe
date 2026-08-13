import React, { useMemo, useState } from "react";
import { useAgentSocket } from "./useAgentSocket";
import { Transcript } from "./Transcript";
import { Terminal } from "./Terminal";
import { Sidebar } from "./Sidebar";
import { BuiltinTerminal } from "./BuiltinTerminal";

const WS_PORT = (window as any).xe?.getWsPort?.() || 18755;

export function App() {
  const { frames, connected, sessions, send, requestSessions } = useAgentSocket(WS_PORT);
  const [input, setInput] = useState("");
  const [view, setView] = useState<"chat" | "terminal" | "builtin">("chat");
  const ptyPort = Number((window as any).xe?.getPtyPort?.() || 18756);

  // Track whether the agent is currently streaming so we queue with `steer`.
  const streaming = useMemo(() => {
    let s = false;
    for (const f of frames) {
      const t = f.parsed?.type;
      if (t === "start") s = true;
      else if (t === "done" || t === "error") s = false;
    }
    return s;
  }, [frames]);

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

  return (
    <div style={styles.app}>
      <Sidebar
        connected={connected}
        sessions={sessions}
        onRequestSessions={requestSessions}
        onNewSession={() => window.location.reload()}
      />
      <div style={styles.main}>
        <div style={styles.tabs}>
          <button style={view === "chat" ? styles.tabOn : styles.tab} onClick={() => setView("chat")}>Chat</button>
          <button style={view === "terminal" ? styles.tabOn : styles.tab} onClick={() => setView("terminal")}>Terminal</button>
          <button style={view === "builtin" ? styles.tabOn : styles.tab} onClick={() => setView("builtin")}>Built-in CLI</button>
          <span style={styles.flex} />
          <span style={styles.muted}>{streaming ? "● streaming" : "idle"}</span>
        </div>
        <div style={styles.body}>
          {view === "chat" ? <Transcript frames={frames} /> : view === "terminal" ? <Terminal frames={frames} /> : <BuiltinTerminal ptyPort={ptyPort} />}
        </div>
        <div style={styles.inputBar}>
          <textarea
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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: { display: "flex", height: "100vh", background: "#0b0b0f", color: "#ddd", fontFamily: "system-ui, sans-serif" },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  tabs: { display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderBottom: "1px solid #222", background: "#0d0d12" },
  tab: { background: "transparent", color: "#aaa", border: "none", padding: "4px 10px", cursor: "pointer", borderRadius: 6 },
  tabOn: { background: "#1b1b24", color: "#fff", border: "none", padding: "4px 10px", cursor: "pointer", borderRadius: 6 },
  flex: { flex: 1 },
  muted: { fontSize: 12, color: "#888" },
  body: { flex: 1, minHeight: 0, overflow: "hidden" },
  inputBar: { display: "flex", gap: 8, padding: 10, borderTop: "1px solid #222", background: "#0d0d12" },
  input: { flex: 1, resize: "none", height: 48, background: "#15151c", color: "#eee", border: "1px solid #2a2a36", borderRadius: 8, padding: 8, fontFamily: "ui-monospace, monospace", fontSize: 13 },
  send: { background: "#3b5bdb", color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", cursor: "pointer" },
};
