import React, { useEffect } from "react";
import { theme } from "./theme";

export function Sidebar({
  connected,
  sessions,
  onRequestSessions,
  onNewSession,
  onOpenModels,
}: {
  connected: boolean;
  sessions: string;
  onRequestSessions: () => void;
  onNewSession: () => void;
  onOpenModels: () => void;
}) {
  useEffect(() => { onRequestSessions(); }, [onRequestSessions]);

  return (
    <div style={s.wrap}>
      <div style={s.brand}>Prime Agent <b style={{ color: theme.accent }}>XE</b></div>
      <div style={{ ...s.status, color: connected ? theme.ok : theme.danger }}>
        ● {connected ? "agent linked" : "disconnected"}
      </div>

      <button style={s.btnPrimary} onClick={onOpenModels}>⚡ Switch model</button>
      <button style={s.btn} onClick={onNewSession}>＋ New session</button>
      <button style={s.btn} onClick={onRequestSessions}>⟳ Refresh agents</button>

      <div style={s.section}>Running agents</div>
      <pre style={s.sessions}>{sessions || "(none / use `prime-agent agents`)"}</pre>

      <div style={s.hint}>
        One backend, three surfaces: desktop GUI, built-in CLI, or your native terminal.
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  wrap: { width: 240, borderRight: `1px solid ${theme.border}`, padding: 12, display: "flex", flexDirection: "column", gap: 8, background: theme.panel, overflowY: "auto" },
  brand: { fontSize: 16, fontWeight: 600 },
  status: { fontSize: 12 },
  btn: { background: theme.panel2, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "7px 9px", cursor: "pointer", fontSize: 12.5, textAlign: "left" },
  btnPrimary: { background: theme.accentSoft, color: theme.text, border: `1px solid ${theme.accent}`, borderRadius: 8, padding: "8px 9px", cursor: "pointer", fontSize: 12.5, textAlign: "left", fontWeight: 600 },
  section: { fontSize: 11, textTransform: "uppercase", color: theme.faint, marginTop: 8 },
  sessions: { fontSize: 11, whiteSpace: "pre-wrap", color: theme.muted, maxHeight: 240, overflowY: "auto", margin: 0 },
  hint: { fontSize: 11, color: theme.faint, marginTop: "auto", lineHeight: 1.4 },
};
