import React from "react";
import { theme } from "./theme";

export function TopBar({
  modelName,
  streaming,
  view,
  onToggleSidebar,
  onToggleWorkspace,
  onOpenModels,
  onHelp,
}: {
  modelName: string;
  streaming: boolean;
  view: "terminal" | "builtin";
  onToggleSidebar: () => void;
  onToggleWorkspace: () => void;
  onOpenModels: () => void;
  onHelp: () => void;
}) {
  return (
    <div style={tb.wrap}>
      <button style={tb.icon} title="Toggle sidebar (Ctrl/⌘+B)" onClick={onToggleSidebar}>☰</button>
      <span style={tb.brand}>Prime Agent <b style={{ color: theme.accent }}>XE</b></span>

      <button style={tb.modelPill} onClick={onOpenModels} title="Switch model (Ctrl/⌘+P)">
        <span style={tb.dot} />
        {modelName || "Switch model"}
        <span style={tb.kbd}>⌘P</span>
      </button>

      <span style={{ flex: 1 }} />

      <div style={tb.seg}>
        <button style={view === "builtin" ? tb.segOn : tb.segOff} onClick={() => view !== "builtin" && onToggleWorkspace()}>Built-in CLI</button>
        <button style={view === "terminal" ? tb.segOn : tb.segOff} onClick={() => view !== "terminal" && onToggleWorkspace()}>Terminal</button>
      </div>
      <span style={{ ...tb.status, color: streaming ? theme.accent : theme.muted }}>
        {streaming ? "● running" : "idle"}
      </span>
      <button style={tb.icon} title="Shortcuts (?)" onClick={onHelp}>?</button>
    </div>
  );
}

const tb: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 12px", background: theme.panel, borderBottom: `1px solid ${theme.border}`, color: theme.text },
  icon: { background: "transparent", border: "none", color: theme.muted, cursor: "pointer", fontSize: 15, borderRadius: 8, padding: "4px 8px" },
  brand: { fontSize: 14, fontWeight: 600, letterSpacing: 0.2 },
  modelPill: { display: "flex", alignItems: "center", gap: 8, background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: 999, padding: "5px 12px", cursor: "pointer", fontSize: 12.5, fontFamily: theme.font },
  dot: { width: 7, height: 7, borderRadius: 99, background: theme.accent },
  kbd: { fontSize: 10, color: theme.faint, border: `1px solid ${theme.border}`, borderRadius: 5, padding: "1px 5px" },
  seg: { display: "flex", background: theme.panel2, border: `1px solid ${theme.border}`, borderRadius: 8, overflow: "hidden" },
  segOn: { background: theme.accentSoft, color: theme.text, border: "none", padding: "5px 12px", cursor: "pointer", fontSize: 12 },
  segOff: { background: "transparent", color: theme.muted, border: "none", padding: "5px 12px", cursor: "pointer", fontSize: 12 },
  status: { fontSize: 12, marginLeft: 6 },
};
