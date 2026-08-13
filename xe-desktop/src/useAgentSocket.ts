import { useEffect, useRef, useState, useCallback } from "react";

export interface AgentFrame {
  raw: string;
  parsed: any;
  ts: number;
}

export function useAgentSocket(port: number) {
  const [frames, setFrames] = useState<AgentFrame[]>([]);
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState<string>("");
  const [models, setModels] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (ev) => {
      let parsed: any = null;
      try {
        parsed = JSON.parse(ev.data);
      } catch {
        parsed = null;
      }
      if (parsed && parsed.type === "xe.sessions") {
        setSessions(parsed.data || "");
        return;
      }
      if (parsed && parsed.type === "xe.models") {
        setModels(parsed.data || "");
        return;
      }
      setFrames((prev) => [
        ...prev,
        { raw: typeof ev.data === "string" ? ev.data : "", parsed, ts: Date.now() },
      ]);
    };
    return () => ws.close();
  }, [port]);

  const send = useCallback((obj: any) => {
    wsRef.current?.send(JSON.stringify(obj));
  }, []);

  const requestSessions = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ xeControl: "sessions" }));
  }, []);

  const requestModels = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ xeControl: "models" }));
  }, []);

  return { frames, connected, sessions, models, send, requestSessions, requestModels };
}
