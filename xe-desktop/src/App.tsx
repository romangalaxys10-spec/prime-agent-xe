import React, { useEffect, useState } from "react";
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
  const {
    connected, sessionsList, activeId, frames, streaming,
    runningAgents, models, send, sendPrompt, newSession, selectSession, deleteSession,
    requestSessions, requestModels,
  } = useAgentSocket(WS_PORT);

  const [view, setView] = useState<"terminal" | "builtin">("builtin");
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showModels, setShowModels] = useState(false);
  const [modelName, setModelName] = useState("");

  useEffect(() => {
    const off = (window as any).electron?.onMenu?.((msg: any) => {
      switch (msg.type) {
        case "view": setView(msg.value === "terminal" ? "terminal" : "builtin"); break;
        case "new": newSession(); break;
        case "refresh": requestSessions(); break;
        case "models": requestModels(); setShowModels(true); break;
        case "sidebar": setSidebarOpen((v) => !v); break;
        case "help": setShowHelp((v) => !v); break;
      }
    });
    return () => off?.();
  }, [newSession, requestSessions, requestModels]);

  const openModels = () => { requestModels(); setShowModels(true); };
  const pickModel = (v: string) => { send({ type: "prompt", message: `/model ${v}` }); setModelName(v); setShowModels(false); };

  useShortcuts(
    {
      setView: (v) => setView(v === "terminal" ? "terminal" : "builtin"),
      newSession: () => newSession(),
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
          sessions={runningAgents}
          onRequestSessions={requestSessions}
          onNewSession={newSession}
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
          <ChatPanel
            sessionsList={sessionsList}
            activeId={activeId}
            onSelectSession={selectSession}
            onNewSession={newSession}
            onDeleteSession={deleteSession}
            frames={frames}
            streaming={streaming}
            onSend={sendPrompt}
          />
        </div>
      </div>

      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      <ModelSwitcher open={showModels} modelsText={models} onPick={pickModel} onOpenChange={setShowModels} />
    </div>
  );
}
