import React, { useEffect } from "react";

export function Sidebar({
  connected,
  sessions,
  onRequestSessions,
  onNewSession,
}: {
  connected: boolean;
  sessions: string;
  onRequestSessions: () => void;
  onNewSession: () => void;
}) {
  useEffect(() => {
    onRequestSessions();
  }, [onRequestSessions]);

  return (
    <div style={styles.wrap}>
      <div style={styles.brand}>Prime Agent <b>XE</b></div>
      <div style={{ ...styles.status, color: connected ? "#6f6" : "#f66" }}>
        ● {connected ? "agent linked" : "disconnected"}
      </div>
      <button style={styles.btn} onClick={onNewSession}>＋ New session</button>
      <button style={styles.btn} onClick={onRequestSessions}>⟳ Refresh agents</button>
      <div style={styles.section}>Running agents</div>
      <pre style={styles.sessions}>{sessions || "(none / use `prime-agent agents`)"}</pre>
      <div style={styles.hint}>
        Tip: set <code>XE_AGENT_BIN</code> / <code>XE_AGENT_ARGS</code> to point the desktop at a
        specific <code>prime-agent</code> build or daemon socket.
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { width: 240, borderRight: "1px solid #222", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "#0d0d12", overflowY: "auto" },
  brand: { fontSize: 16, fontWeight: 600 },
  status: { fontSize: 12 },
  btn: { background: "#1b1b24", color: "#ddd", border: "1px solid #2a2a36", borderRadius: 6, padding: "6px 8px", cursor: "pointer", fontSize: 12 },
  section: { fontSize: 11, textTransform: "uppercase", color: "#777", marginTop: 8 },
  sessions: { fontSize: 11, whiteSpace: "pre-wrap", color: "#9aa", maxHeight: 240, overflowY: "auto" },
  hint: { fontSize: 11, color: "#666", marginTop: "auto", lineHeight: 1.4 },
};
