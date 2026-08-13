import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

// Built-in terminal: runs the *real* prime-agent TUI via a PTY bridge in the
// Electron main process, so it is identical to running `prime-agent` in the
// user's native external terminal. Fully interactive (keystrokes + resize).
export function BuiltinTerminal({ ptyPort }: { ptyPort: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const term = new XTerm({ fontSize: 13, cursorBlink: true, theme: { background: "#0b0b0f" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    const ws = new WebSocket(`ws://localhost:${ptyPort}`);
    wsRef.current = ws;
    ws.onopen = () => {
      const { cols, rows } = term;
      ws.send(JSON.stringify({ cols, rows }));
    };
    ws.onmessage = (ev) => term.write(ev.data as string);
    term.onData((data) => ws.send(data));
    ws.onclose = () => term.write("\r\n\x1b[90m[agent session ended]\x1b[0m\r\n");

    const onResize = () => {
      fit.fit();
      if (ws.readyState === 1) ws.send(JSON.stringify({ cols: term.cols, rows: term.rows }));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ws.close();
      term.dispose();
    };
  }, [ptyPort]);

  return <div ref={ref} style={{ height: "100%", padding: 6 }} />;
}
