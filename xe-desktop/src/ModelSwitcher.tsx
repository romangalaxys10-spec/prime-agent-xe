import React, { useMemo } from "react";
import { Sparkles, Boxes } from "lucide-react";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "./components/ui/command";

const FALLBACK = [
  "anthropic/claude-3.7-sonnet", "anthropic/claude-3.5-sonnet", "openai/gpt-4o", "openai/gpt-4o-mini",
  "google/gemini-2.5-pro", "deepseek/deepseek-chat", "moonshot/kimi-k2", "qwen/qwen-max",
];

export function ModelSwitcher({
  open, modelsText, onPick, onOpenChange,
}: {
  open: boolean; modelsText: string; onPick: (m: string) => void; onOpenChange: (v: boolean) => void;
}) {
  const options = useMemo(() => {
    const parsed = (modelsText || "")
      .split("\n").map((l) => l.trim()).filter(Boolean)
      .filter((l) => l.includes("/") || /[a-z0-9-]+/i.test(l));
    const set = Array.from(new Set(parsed));
    return set.length ? set.slice(0, 400) : FALLBACK;
  }, [modelsText]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Switch model…  (type to filter, Enter to pick)" />
      <CommandList>
        <CommandEmpty>No models found.</CommandEmpty>
        <CommandGroup heading="Models">
          {options.map((o) => (
            <CommandItem
              key={o}
              value={o}
              onSelect={() => onPick(o)}
              className="font-mono text-[13px]"
            >
              <Boxes className="h-4 w-4 opacity-60" /> {o}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
