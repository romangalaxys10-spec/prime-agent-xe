import React, { useState } from "react";
import type { AgentFrame } from "./useAgentSocket";

// Best-effort text extraction from an RPC frame. Prime Agent's RPC event schema
// varies by event type; we render readable text when we can find it and always
// offer a raw-JSON toggle for full fidelity.
function extractText(p: any): string | null {
  if (!p) return null;
  if (typeof p === "string") return p;
  if (p.type === "message" && p.message?.content) {
    const c = p.message.content;
    if (typeof c === "string") return c;
    return c.map((b: any) => (b.type === "text" ? b.text : `[${b.type}]`)).join("\n");
  }
  if (p.type === "text_delta" && p.delta) return p.delta;
  if (p.type === "thinking_delta" && p.delta) return "🧠 " + p.delta;
  if (p.type === "toolcall_end" && p.toolCall) return `🔧 ${p.toolCall.name}`;
  if (p.type === "response") return `✓ ${p.command} (success=${p.success})`;
  if (p.type === "error") return `✗ ${p.error?.errorMessage || p.reason || "error"}`;
  return null;
}

function roleBadge(p: any): string {
  const role = p?.message?.role || p?.role || "";
  if (!role) return "";
  const map: Record<string, string> = {
    user: "👤 You",
    assistant: "🤖 Agent",
    toolResult: "🔧 Tool",
    system: "⚙️ System",
  };
  return map[role] || role;
}

export function Transcript({ frames }: { frames: AgentFrame[] }) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div style={styles.wrap}>
      <div style={styles.toolbar}>
        <span style={styles.muted}>{frames.length} frames</span>
        <label style={styles.toggle}>
          <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} /> raw JSON
        </label>
      </div>
      <div style={styles.scroll}>
        {frames.map((f, i) => {
          const text = extractText(f.parsed);
          return (
            <div key={i} style={styles.row}>
              {showRaw ? (
                <pre style={styles.raw}>{f.raw}</pre>
              ) : text !== null ? (
                <div>
                  {roleBadge(f.parsed) && <div style={styles.role}>{roleBadge(f.parsed)}</div>}
                  <div style={styles.text}>{text}</div>
                </div>
              ) : (
                <pre style={styles.raw}>{f.raw}</pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", minWidth: 0 },
  toolbar: { display: "flex", justifyContent: "space-between", padding: "4px 10px", borderBottom: "1px solid #222", color: "#888" },
  toggle: { fontSize: 12, display: "flex", gap: 4, alignItems: "center" },
  scroll: { flex: 1, overflowY: "auto", padding: "10px 14px", fontFamily: "ui-monospace, monospace", fontSize: 13, lineHeight: 1.5 },
  row: { marginBottom: 10, borderBottom: "1px solid #16161c", paddingBottom: 8 },
  role: { fontSize: 11, color: "#6cf", marginBottom: 2 },
  text: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  raw: { whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#9aa", fontSize: 11 },
  muted: { fontSize: 12 },
};
