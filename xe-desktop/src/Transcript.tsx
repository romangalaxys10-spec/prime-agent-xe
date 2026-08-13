import React, { useState } from "react";
import { Bot, User, Wrench, AlertTriangle, CheckCircle2, Brain } from "lucide-react";
import { ScrollArea } from "./components/ui/scroll-area";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { cn } from "./lib/utils";
import type { AgentFrame } from "./useAgentSocket";

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

function roleOf(p: any): string { return p?.message?.role || p?.role || ""; }

export function Transcript({ frames }: { frames: AgentFrame[] }) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2 text-[11px] text-muted-foreground">
        <span>{frames.length} events</span>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="checkbox" checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} className="accent-primary" /> raw
        </label>
      </div>

      <ScrollArea className="flex-1">
        {frames.length === 0 && !showRaw ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Start a conversation</div>
              <div className="mt-1 text-xs leading-relaxed text-muted-foreground">Send a message to begin. Your chats are saved automatically.</div>
            </div>
          </div>
        ) : (
        <div className="space-y-3 p-4">
          {frames.map((f, i) => {
            if (showRaw) return <pre key={i} className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">{f.raw}</pre>;

            const role = roleOf(f.parsed);
            const text = extractText(f.parsed);

            if (role && text !== null && ["user", "assistant", "system", "toolResult"].includes(role)) {
              const isUser = role === "user";
              const isTool = role === "toolResult";
              return (
                <div key={i} className={cn("flex items-end gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
                      {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed animate-fade-in", isUser ? "bg-primary text-primary-foreground" : isTool ? "border bg-card" : "bg-card border")}>
                    <div className="mb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{role === "toolResult" ? "tool" : role}</div>
                    <div className="whitespace-pre-wrap break-words font-mono text-[13px]">{text}</div>
                  </div>
                </div>
              );
            }

            if (text !== null) {
              const Icon = text.startsWith("🔧") ? Wrench : text.startsWith("✗") ? AlertTriangle : text.startsWith("✓") ? CheckCircle2 : text.startsWith("🧠") ? Brain : Bot;
              return (
                <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground animate-fade-in">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono">{text}</span>
                </div>
              );
            }
            return <pre key={i} className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2 text-[11px] text-muted-foreground">{f.raw}</pre>;
          })}
        </div>
        )}
      </ScrollArea>
    </div>
  );
}
