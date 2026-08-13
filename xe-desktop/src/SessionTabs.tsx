import React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "./lib/utils";
import type { SessionMeta } from "./useAgentSocket";

export function SessionTabs({
  sessions, activeId, onSelect, onNew, onClose,
}: {
  sessions: SessionMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border/70 bg-card/80 px-2 py-1 overflow-x-auto">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cn(
            "group flex max-w-[200px] shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors",
            s.id === activeId ? "bg-primary/10 text-foreground ring-1 ring-primary/30" : "text-muted-foreground hover:bg-secondary/70"
          )}
          title={s.title}
        >
          <span className="truncate">{s.title || "New chat"}</span>
          <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">{s.count}</span>
          <span
            onClick={(e) => { e.stopPropagation(); onClose(s.id); }}
            className="ml-0.5 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </span>
        </button>
      ))}
      <button
        onClick={onNew}
        className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="New session (Ctrl/⌘+N)"
      >
        <Plus className="h-3.5 w-3.5" /> New
      </button>
    </div>
  );
}
