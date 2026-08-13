import React from "react";
import { Terminal, Boxes, Sparkles, HelpCircle, PanelLeft, ChevronDown } from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "./components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "./components/ui/tooltip";
import { cn } from "./lib/utils";

export function TopBar({
  modelName, streaming, view, onToggleSidebar, onToggleWorkspace, onOpenModels, onHelp,
}: {
  modelName: string; streaming: boolean; view: "terminal" | "builtin";
  onToggleSidebar: () => void; onToggleWorkspace: () => void;
  onOpenModels: () => void; onHelp: () => void;
}) {
  return (
    <div className="flex h-12 items-center gap-3 border-b bg-card px-3 shadow-sm">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} title="Toggle sidebar (Ctrl/⌘+B)">
        <PanelLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 select-none">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          Prime Agent <span className="text-primary">XE</span>
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-1 gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {modelName || "Switch model"}
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            <kbd className="ml-1 rounded border border-border bg-muted px-1 text-[10px] text-muted-foreground">⌘P</kbd>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Model</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onOpenModels}>
            <Sparkles className="h-4 w-4" /> Open model picker…
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px]">Quick select</DropdownMenuLabel>
          {["anthropic/claude-3.7-sonnet", "openai/gpt-4o", "google/gemini-2.5-pro"].map((m) => (
            <DropdownMenuItem key={m} onSelect={() => onOpenModels()}>
              <Boxes className="h-4 w-4 opacity-60" /> {m}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
        <button
          onClick={() => view !== "builtin" && onToggleWorkspace()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            view === "builtin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> Built-in CLI
        </button>
        <button
          onClick={() => view !== "terminal" && onToggleWorkspace()}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            view === "terminal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Terminal className="h-3.5 w-3.5" /> Terminal
        </button>
      </div>

      <Badge variant={streaming ? "brand" : "secondary"} className={cn("gap-1.5", streaming && "animate-pulse")}>
        <span className={cn("h-1.5 w-1.5 rounded-full", streaming ? "bg-primary" : "bg-muted-foreground")} />
        {streaming ? "running" : "idle"}
      </Badge>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={onHelp}>
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
      </Tooltip>
    </div>
  );
}
