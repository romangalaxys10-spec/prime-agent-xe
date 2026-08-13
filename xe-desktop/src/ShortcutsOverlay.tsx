import React from "react";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { SHORTCUTS } from "./useShortcuts";

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-primary" /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>Prime Agent XE desktop</DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {SHORTCUTS.map(([k, desc]) => (
            <div key={k} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">{k}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
