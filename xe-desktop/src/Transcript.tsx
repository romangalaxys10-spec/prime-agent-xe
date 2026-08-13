import React, { useState } from "react";
import type { AgentFrame } from "./useAgentSocket";
import { theme } from "./theme";

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

function roleOf(p: any): string {
  return p?.message?.role || p?.role || "";
}

export function Transcript({ frames }: { frames: AgentFrame[] }) {
  const [showRaw, setShowRaw] = useState(false);
  return (
    <div style={t.wrap}>
      <div style={t.toolbar}>
        <span style={t.muted}>{frames.length} events</span>
        <label style={t.toggle}>
          <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} /> raw
        </label>
      </div>
      <div style={t.scroll}>
        {frames.map((f, i) => {
          if (showRaw) return <pre key={i} style={t.raw}>{f.raw}</pre>;

          const role = roleOf(f.parsed);
          const text = extractText(f.parsed);

          // Full message -> bubble (Trae-style)
          if (role && text !== null && (role === "user" || role === "assistant" || role === "system" || role === "toolResult")) {
            const isUser = role === "user";
            const isTool = role === "toolResult";
            return (
              <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 13px",
                  borderRadius: 14,
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: isUser ? "#fff" : theme.text,
                  background: isUser ? theme.userBubble : isTool ? theme.panel2 : theme.agentBubble,
                  border: isTool ? `1px solid ${theme.border}` : "none",
                  boxShadow: isUser ? "0 2px 10px rgba(109,94,252,0.25)" : "none",
                }}>
                  <div style={{ fontSize: 10.5, color: theme.faint, marginBottom: 3 }}>
                    {role === "toolResult" ? "tool" : role}
                  </div>
                  {text}
                </div>
              </div>
            );
          }

          // Everything else -> subtle inline chip (tool calls, thinking, status)
          if (text !== null) {
            return (
              <div key={i} style={t.chip}>{text}</div>
            );
          }
          return <pre key={i} style={t.raw}>{f.raw}</pre>;
        })}
      </div>
    </div>
  );
}

const t: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", minWidth: 0, background: theme.bg },
  toolbar: { display: "flex", justifyContent: "space-between", padding: "4px 12px", borderBottom: `1px solid ${theme.borderSoft}`, color: theme.muted },
  toggle: { fontSize: 12, display: "flex", gap: 4, alignItems: "center" },
  scroll: { flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10, fontFamily: theme.mono, fontSize: 13 },
  raw: { whiteSpace: "pre-wrap", wordBreak: "break-word", color: theme.muted, fontSize: 11, margin: 0 },
  chip: { alignSelf: "flex-start", fontSize: 11.5, color: theme.muted, background: theme.panel2, border: `1px solid ${theme.borderSoft}`, borderRadius: 8, padding: "4px 9px", fontFamily: theme.mono },
};
