import { useEffect, useMemo, useRef, useState } from "react";

export interface AgentFrame {
  raw: string;
  parsed: any;
}
export interface SessionMeta {
  id: string;
  title: string;
  createdAt: number;
  count: number;
  active: boolean;
  alive: boolean;
}

// Client for the Electron bridge. Tracks multiple chat sessions (each an
// independent agent child), loads their persisted history, and exposes the
// active session's frames for the transcript.
export function useAgentSocket(wsPort: number) {
  const [connected, setConnected] = useState(false);
  const [sessionsList, setSessionsList] = useState<SessionMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [framesBySession, setFramesBySession] = useState<Record<string, AgentFrame[]>>({});
  const [runningAgents, setRunningAgents] = useState("");
  const [models, setModels] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const appendFrame = (id: string, raw: string, parsed: any) => {
    setFramesBySession((prev) => {
      const arr = prev[id] ? prev[id].slice() : [];
      const last = arr[arr.length - 1];
      // De-dupe the agent's own echo of a user message vs the optimistic frame.
      if (
        parsed && parsed.type === "message" && parsed.message?.role === "user" &&
        last?.parsed?.type === "message" && last?.parsed?.message?.role === "user"
      ) {
        const a = typeof parsed.message.content === "string" ? parsed.message.content : JSON.stringify(parsed.message.content);
        const b = typeof last.parsed.message.content === "string" ? last.parsed.message.content : JSON.stringify(last.parsed.message.content);
        if (a === b) return prev;
      }
      arr.push({ raw, parsed });
      return { ...prev, [id]: arr };
    });
  };

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:${wsPort}`);
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); ws.send(JSON.stringify({ xeControl: "listSessions" })); };
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      let parsed; try { parsed = JSON.parse(ev.data as string); } catch { return; }
      if (parsed.type === "frame" && parsed.sessionId) {
        appendFrame(parsed.sessionId, parsed.raw, parsed.parsed);
      } else if (parsed.type === "xe.sessionsList") {
        setSessionsList(parsed.sessions);
        if (parsed.sessions.length && !activeId) {
          const a = parsed.sessions.find((s: SessionMeta) => s.active) || parsed.sessions[0];
          setActiveId(a.id);
        }
      } else if (parsed.type === "xe.sessionFrames") {
        setFramesBySession((prev) => ({ ...prev, [parsed.id]: parsed.frames }));
        setActiveId(parsed.id);
      } else if (parsed.type === "xe.sessions") {
        setRunningAgents(parsed.data || "");
      } else if (parsed.type === "xe.models") {
        setModels(parsed.data || "");
      }
    };
    return () => ws.close();
  }, [wsPort]);

  const send = (obj: any) => wsRef.current?.send(JSON.stringify(obj));
  const sendPrompt = (message: string) => {
    const id = activeId; if (!id) return;
    const streaming = (framesBySession[id] || []).some((f) => f.parsed?.type === "start") &&
      !(framesBySession[id] || []).some((f) => f.parsed?.type === "done" || f.parsed?.type === "error");
    send({ type: "prompt", sessionId: id, message, ...(streaming ? { streamingBehavior: "steer" } : {}) });
  };
  const newSession = () => send({ xeControl: "newSession" });
  const selectSession = (id: string) => send({ xeControl: "openSession", id });
  const deleteSession = (id: string) => send({ xeControl: "deleteSession", id });
  const requestSessions = () => send({ xeControl: "sessions" });
  const requestModels = () => send({ xeControl: "models" });

  const frames = useMemo<AgentFrame[]>(() => (activeId ? framesBySession[activeId] || [] : []), [activeId, framesBySession]);
  const streaming = useMemo(
    () => frames.some((f) => f.parsed?.type === "start") && !frames.some((f) => f.parsed?.type === "done" || f.parsed?.type === "error"),
    [frames],
  );

  return {
    connected, sessionsList, activeId, frames, streaming,
    runningAgents, models,
    send, sendPrompt, newSession, selectSession, deleteSession,
    requestSessions, requestModels,
  };
}
