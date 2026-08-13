import React from "react";
import { Terminal } from "./Terminal";
import { BuiltinTerminal } from "./BuiltinTerminal";
import type { AgentFrame } from "./useAgentSocket";
import { theme } from "./theme";

export function Workspace({
  view,
  frames,
  ptyPort,
}: {
  view: "terminal" | "builtin";
  frames: AgentFrame[];
  ptyPort: number;
}) {
  return (
    <div style={ws.wrap}>
      <div style={ws.head}>
        <span style={{ color: theme.muted, fontSize: 12 }}>{view === "builtin" ? "Built-in CLI" : "Terminal"}</span>
        <span style={{ color: theme.faint, fontSize: 11 }}>the agent workspace</span>
      </div>
      <div style={ws.body}>
        {view === "terminal" ? <Terminal frames={frames} /> : <BuiltinTerminal ptyPort={ptyPort} />}
      </div>
    </div>
  );
}

const ws: Record<string, React.CSSProperties> = {
  wrap: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: theme.bg },
  head: { display: "flex", gap: 10, alignItems: "baseline", padding: "10px 14px", borderBottom: `1px solid ${theme.border}`, color: theme.text },
  body: { flex: 1, minHeight: 0, overflow: "hidden" },
};
