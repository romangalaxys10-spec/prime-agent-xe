import React, { useEffect, useRef, useState } from "react";
import { Transcript } from "./Transcript";
import type { AgentFrame } from "./useAgentSocket";
import { theme } from "./theme";

export function ChatPanel({
  frames,
  streaming,
  send,
}: {
  frames: AgentFrame[];
  streaming: boolean;
  send: (obj: any) => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const message = input.trim();
    if (!message) return;
    send(streaming ? { type: "prompt", message, streamingBehavior: "steer" } : { type: "prompt", message });
    setInput("");
  };

  return (
    <div style={cp.wrap}>
      <div style={cp.head}>Chat</div>
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Transcript frames={frames} />
      </div>
      <div style={cp.inputBar}>
        <textarea
          ref={inputRef}
          style={cp.input}
          placeholder="Message Prime Agent XE…  (Enter to send, Shift+Enter newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
        />
        <button style={cp.send} onClick={submit}>➤</button>
      </div>
    </div>
  );
}

const cp: Record<string, React.CSSProperties> = {
  wrap: { width: 440, maxWidth: "42vw", display: "flex", flexDirection: "column", minHeight: 0, borderLeft: `1px solid ${theme.border}`, background: theme.bg },
  head: { padding: "10px 14px", fontWeight: 600, fontSize: 13, borderBottom: `1px solid ${theme.border}`, color: theme.text },
  inputBar: { display: "flex", gap: 8, padding: 10, borderTop: `1px solid ${theme.border}`, background: theme.panel },
  input: { flex: 1, resize: "none", height: 46, background: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "10px 12px", fontFamily: theme.mono, fontSize: 13, outline: "none" },
  send: { width: 46, background: theme.accent, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 16 },
};
