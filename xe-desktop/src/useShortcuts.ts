import { useEffect, useRef } from "react";

export type View = "terminal" | "builtin";

export interface ShortcutHandlers {
  setView: (v: View) => void;
  newSession: () => void;
  refreshAgents: () => void;
  toggleHelp: () => void;
  focusInput: () => void;
  toggleSidebar: () => void;
  toggleModels: () => void;
}

// Global keyboard shortcuts. View-switch (Mod+1/2) works everywhere, including
// the built-in CLI tab. Other shortcuts yield to the shell so terminal keys keep working.
export function useShortcuts(handlers: ShortcutHandlers, view: View) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const inXterm = !!target?.closest?.(".xterm");

      if (mod && (e.key === "1" || e.key === "numpad1")) {
        e.preventDefault();
        ref.current.setView("builtin");
        return;
      }
      if (mod && (e.key === "2" || e.key === "numpad2")) {
        e.preventDefault();
        ref.current.setView("terminal");
        return;
      }

      if (inXterm) return; // let the live shell keep its keys

      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        ref.current.newSession();
      } else if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current.refreshAgents();
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        ref.current.toggleSidebar();
      } else if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        ref.current.toggleModels();
      } else if (e.key === "?") {
        e.preventDefault();
        ref.current.toggleHelp();
      } else if (e.key === "Escape") {
        ref.current.focusInput();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);
}

export const SHORTCUTS: Array<[string, string]> = [
  ["Ctrl/⌘ + 1", "Built-in CLI (workspace)"],
  ["Ctrl/⌘ + 2", "Terminal (workspace)"],
  ["Ctrl/⌘ + P", "Switch model (Trae-style palette)"],
  ["Ctrl/⌘ + N", "New session"],
  ["Ctrl/⌘ + K", "Refresh running agents"],
  ["Ctrl/⌘ + B", "Toggle sidebar"],
  ["?", "Show / hide shortcuts help"],
  ["Enter", "Send prompt (Shift+Enter = newline)"],
];
