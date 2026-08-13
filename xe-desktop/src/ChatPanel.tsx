import React, { useRef, useState } from "react";
import { Send, MessagesSquare } from "lucide-react";
import { Transcript } from "./Transcript";
import { SessionTabs } from "./SessionTabs";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import type { AgentFrame, SessionMeta } from "./useAgentSocket";

export function ChatPanel({
  sessionsList, activeId, onSelectSession, onNewSession, onDeleteSession,
  frames, streaming, onSend,
}: {
  sessionsList: SessionMeta[];
  activeId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  frames: AgentFrame[];
  streaming: boolean;
  onSend: (message: string) => void;
}) {
  const [input, setInput] = useState("");

  const submit = () => {
    const message = input.trim();
    if (!message) return;
    onSend(message);
    setInput("");
  };

  return (
    <div className="flex w-[440px] max-w-[42vw] shrink-0 flex-col border-l bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-semibold">
        <MessagesSquare className="h-4 w-4 text-primary" /> Chat
      </div>

      <SessionTabs
        sessions={sessionsList}
        activeId={activeId}
        onSelect={onSelectSession}
        onNew={onNewSession}
        onClose={onDeleteSession}
      />

      <div className="min-h-0 flex-1">
        <Transcript frames={frames} />
      </div>

      <div className="border-t bg-card/60 p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Message Prime Agent XE…  (Enter to send, Shift+Enter newline)"
            className="min-h-[44px] max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
          />
          <Button size="icon" onClick={submit} disabled={!input.trim()} className="rounded-lg">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
