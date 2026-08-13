import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAgentSocket } from "./useAgentSocket";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Workspace } from "./Workspace";
import { ChatPanel } from "./ChatPanel";
import { BuiltinTerminal } from "./BuiltinTerminal";
import { useShortcuts, type View } from "./useShortcuts";
import { ShortcutsOverlay } from "./ShortcutsOverlay";
import { ModelSwitcher } from "./ModelSwitcher";
import { theme } from "./theme";

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

  const pickModel = (v: string) => {
    send({ type: "prompt", message: `/model ${v}` });
    setModelName(v);
    setShowModels(false);
  };

  useShortcuts(
    {
      setView: (v) => setView(v === "terminal" ? "terminal" : "builtin"),
      newSession: () => window.location.reload(),
      refreshAgents: requestSessions,
      toggleHelp: () => setShowHelp((v) => !v),
      focusInput: () => {/* chat input is in ChatPanel */},
      toggleSidebar: () => setSidebarOpen((v) => !v),
      toggleModels: () => { requestModels(); setShowModels(true); },
    },
    view as View,
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: theme.bg, color: theme.text, fontFamily: theme.font }}>
      {sidebarOpen && (
        <Sidebar
          connected={connected}
          sessions={sessions}
          onRequestSessions={requestSessions}
          onNewSession={() => window.location.reload()}
          onOpenModels={() => { requestModels(); setShowModels(true); }}
        />
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar
          modelName={modelName}
          streaming={streaming}
          view={view}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleWorkspace={() => setView((v) => (v === "builtin" ? "terminal" : "builtin"))}
          onOpenModels={() => { requestModels(); setShowModels(true); }}
          onHelp={() => setShowHelp((v) => !v)}
        />
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <Workspace view={view} frames={frames} ptyPort={PTY_PORT} />
          <ChatPanel frames={frames} streaming={streaming} send={send} />
        </div>
      </div>

      {showHelp && <ShortcutsOverlay onClose={() => setShowHelp(false)} />}
      {showModels && <ModelSwitcher modelsText={models} onPick={pickModel} onClose={() => setShowModels(false)} />}
    </div>
  );
}
