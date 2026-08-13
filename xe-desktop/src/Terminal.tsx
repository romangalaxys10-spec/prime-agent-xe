import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import type { AgentFrame } from "./useAgentSocket";

// 1:1 parity view: render the raw NDJSON stream exactly as the agent emits it.
export function Terminal({ frames }: { frames: AgentFrame[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const term = new XTerm({ fontSize: 13, theme: { background: "#0b0b0f" } });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(ref.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;
    const onResize = () => fit.fit();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const last = frames[frames.length - 1];
    if (last) term.writeln(last.raw);
  }, [frames]);

  return <div ref={ref} style={{ height: "100%", padding: 6 }} />;
}
