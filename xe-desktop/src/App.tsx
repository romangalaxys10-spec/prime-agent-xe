import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAgentSocket } from "./useAgentSocket";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Workspace } from "./Workspace";
import { ChatPanel } from "./ChatPanel";
import { useShortcuts, type View } from "./useShortcuts";
import { ShortcutsOverlay } from "./ShortcutsOverlay";
import { ModelSwitcher } from "./ModelSwitcher";

const WS_PORT = (window as any).xe?.getWsPort?.() || 18755;
const PTY_PORT = (window as any).xe?.getPtyPort?.() || 18756;

export function App() {
  const { frames, connected, sessions, models, send, requestSessions, requestModels } = useAgentSocket(WS_PORT);
  const [view, setView] = useState<"terminal" | "builtin">("builtin");
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModels, setShowModels] = useState(false);
  const [modelName, setModelName] = useState("");

  const streaming = useMemo(() => {
    let s = false;
    for (const f of frames) {
      const t = f.parsed?.type;
      if (t === "start") s = true;
      else if (t === "done" || t === "error") s = false;
    }
    return s;
  }, [frames]);

  useEffect(() => {
    const off = (window as any).electron?.onMenu?.((msg: any) => {
      switch (msg.type) {
        case "view": setView(msg.value === "terminal" ? "terminal" : "builtin"); break;
        case "new": window.location.reload(); break;
        case "refresh": requestSessions(); break;
        case "models": requestModels(); setShowModels(true); break;
        case "sidebar": setSidebarOpen((v) => !v); break;
        case "help": setShowHelp((v) => !v); break;
      }
    });
    return () => off?.();
  }, [requestSessions, requestModels]);

  const openModels = () => { requestModels(); setShowModels(true); };
  const pickModel = (v: string) => { send({ type: "prompt", message: `/model ${v}` }); setModelName(v); setShowModels(false); };

  useShortcuts(
    {
      setView: (v) => setView(v === "terminal" ? "terminal" : "builtin"),
      newSession: () => window.location.reload(),
      refreshAgents: requestSessions,
      toggleHelp: () => setShowHelp((v) => !v),
      focusInput: () => {},
      toggleSidebar: () => setSidebarOpen((v) => !v),
      toggleModels: openModels,
    },
    view as View,
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {sidebarOpen && (
        <Sidebar
          connected={connected}
          sessions={sessions}
          onRequestSessions={requestSessions}
          onNewSession={() => window.location.reload()}
          onOpenModels={openModels}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          modelName={modelName}
          streaming={streaming}
          view={view}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleWorkspace={() => setView((v) => (v === "builtin" ? "terminal" : "builtin"))}
          onOpenModels={openModels}
          onHelp={() => setShowHelp((v) => !v)}
        />
        <div className="flex min-h-0 flex-1">
          <Workspace view={view} frames={frames} ptyPort={PTY_PORT} />
          <ChatPanel frames={frames} streaming={streaming} send={send} />
        </div>
      </div>

      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      <ModelSwitcher open={showModels} modelsText={models} onPick={pickModel} onOpenChange={setShowModels} />
    </div>
  );
}
