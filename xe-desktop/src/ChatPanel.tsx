import React, { useRef, useState } from "react";
import { Send, MessagesSquare } from "lucide-react";
import { Transcript } from "./Transcript";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import type { AgentFrame } from "./useAgentSocket";

export function ChatPanel({
  frames, streaming, send,
}: {
  frames: AgentFrame[]; streaming: boolean; send: (obj: any) => void;
}) {
  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const message = input.trim();
    if (!message) return;
    send(streaming ? { type: "prompt", message, streamingBehavior: "steer" } : { type: "prompt", message });
    setInput("");
  };

  return (
    <div className="flex w-[440px] max-w-[42vw] shrink-0 flex-col border-l bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm font-semibold">
        <MessagesSquare className="h-4 w-4 text-primary" /> Chat
      </div>

      <div className="min-h-0 flex-1">
        <Transcript frames={frames} />
      </div>

      <div className="border-t bg-card/60 p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            ref={taRef}
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
