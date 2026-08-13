// Trae-inspired theme tokens (clean dark IDE, violet accent, message bubbles).
export const theme = {
  bg: "#0e0e12",
  panel: "#16161d",
  panel2: "#1b1b24",
  border: "#26262e",
  borderSoft: "#1f1f27",
  text: "#e6e6ea",
  muted: "#8a8a96",
  faint: "#5d5d68",
  accent: "#6d5efc",
  accent2: "#8b5cf6",
  accentSoft: "rgba(109,94,252,0.16)",
  userBubble: "linear-gradient(135deg,#6d5efc,#8b5cf6)",
  agentBubble: "#1b1b24",
  danger: "#f6666b",
  ok: "#5fce7f",
  font: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
};

export const c = (s: React.CSSProperties): React.CSSProperties => s;
