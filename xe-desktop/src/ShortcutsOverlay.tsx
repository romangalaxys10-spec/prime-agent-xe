import React from "react";
import { SHORTCUTS } from "./useShortcuts";

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <span>Keyboard Shortcuts</span>
          <button style={styles.x} onClick={onClose}>✕</button>
        </div>
        <table style={styles.table}>
          <tbody>
            {SHORTCUTS.map(([k, desc]) => (
              <tr key={k}>
                <td style={styles.key}>{k}</td>
                <td style={styles.desc}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={styles.foot}>Press <b>?</b> or <b>Esc</b> to dismiss.</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
  card: { background: "#15151c", border: "1px solid #2a2a36", borderRadius: 10, padding: 16, minWidth: 380, color: "#eee", fontFamily: "system-ui, sans-serif" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, marginBottom: 10 },
  x: { background: "transparent", border: "none", color: "#aaa", cursor: "pointer", fontSize: 14 },
  table: { width: "100%", fontSize: 13, borderCollapse: "collapse" },
  key: { padding: "4px 8px", color: "#6cf", fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap", width: 1 },
  desc: { padding: "4px 8px", color: "#ddd" },
  foot: { marginTop: 10, fontSize: 11, color: "#888" },
};
