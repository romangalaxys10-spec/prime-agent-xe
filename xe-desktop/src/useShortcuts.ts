import { useEffect, useRef } from "react";

export type View = "chat" | "terminal" | "builtin";

export interface ShortcutHandlers {
  setView: (v: View) => void;
  newSession: () => void;
  refreshAgents: () => void;
  toggleHelp: () => void;
  focusInput: () => void;
  toggleSidebar: () => void;
}

// Global keyboard shortcuts for the desktop. View-switch (Mod+1/2/3) works
// everywhere, including the built-in CLI tab. Other shortcuts are suppressed
// while focus is inside the xterm terminal so the shell keeps its own keys.
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
        ref.current.setView("chat");
        return;
      }
      if (mod && (e.key === "2" || e.key === "numpad2")) {
        e.preventDefault();
        ref.current.setView("terminal");
        return;
      }
      if (mod && (e.key === "3" || e.key === "numpad3")) {
        e.preventDefault();
        ref.current.setView("builtin");
        return;
      }

      // Below: don't steal keys from the live shell in the built-in CLI tab.
      if (inXterm) return;

      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        ref.current.newSession();
      } else if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current.refreshAgents();
      } else if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        ref.current.toggleSidebar();
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
  ["Ctrl/⌘ + 1", "Chat (structured transcript)"],
  ["Ctrl/⌘ + 2", "Terminal (raw NDJSON)"],
  ["Ctrl/⌘ + 3", "Built-in CLI (real TUI via PTY)"],
  ["Ctrl/⌘ + N", "New session"],
  ["Ctrl/⌘ + K", "Refresh running agents"],
  ["Ctrl/⌘ + B", "Toggle sidebar"],
  ["?", "Show / hide this shortcuts help"],
  ["Esc", "Focus the prompt input"],
  ["Enter", "Send prompt (Shift+Enter = newline)"],
];
