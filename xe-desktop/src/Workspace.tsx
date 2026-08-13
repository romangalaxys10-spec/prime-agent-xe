import React from "react";
import { Terminal, Boxes } from "lucide-react";
import { Terminal as TerminalView } from "./Terminal";
import { BuiltinTerminal } from "./BuiltinTerminal";
import type { AgentFrame } from "./useAgentSocket";

export function Workspace({
  view, frames, ptyPort,
}: {
  view: "terminal" | "builtin"; frames: AgentFrame[]; ptyPort: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-background">
      <div className="flex items-center gap-2 border-b px-4 py-2.5 text-sm text-muted-foreground">
        {view === "builtin" ? <Boxes className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
        <span className="font-medium text-foreground">{view === "builtin" ? "Built-in CLI" : "Terminal"}</span>
        <span className="text-[11px]">— the agent workspace</span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {view === "terminal" ? <TerminalView frames={frames} /> : <BuiltinTerminal ptyPort={ptyPort} />}
      </div>
    </div>
  );
}
