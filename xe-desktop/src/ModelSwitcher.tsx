import React, { useEffect, useMemo, useState } from "react";

// Ctrl+P model switcher (OpenCode-style): type to filter, pick to switch.
// Sends `/model <value>` to the agent; Prime Agent resolves the pattern.
export function ModelSwitcher({
  modelsText,
  onPick,
  onClose,
}: {
  modelsText: string;
  onPick: (model: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const lines = (modelsText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => l.includes("/") || /[a-z0-9-]+/i.test(l));
    // De-dupe while keeping order.
    return Array.from(new Set(lines)).slice(0, 400);
  }, [modelsText]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, query]);

  useEffect(() => setActive(0), [query]);

  const choose = (v: string) => {
    if (v) onPick(v);
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>Switch model  <span style={styles.hint}>(Ctrl/⌘+P)</span></div>
        <input
          autoFocus
          style={styles.input}
          placeholder="Filter models…  (Enter = first match, ↑/↓ to move, Esc to close)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(filtered[active] || query);
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
        />
        <div style={styles.list}>
          {filtered.length === 0 && <div style={styles.empty}>No models listed — type a pattern (e.g. anthropic/, openai/) and Enter to switch.</div>}
          {filtered.map((o, i) => (
            <div
              key={o}
              style={i === active ? styles.rowOn : styles.row}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
            >
              {o}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80, zIndex: 60 },
  card: { background: "#15151c", border: "1px solid #2a2a36", borderRadius: 10, width: 520, maxWidth: "90vw", color: "#eee", fontFamily: "system-ui, sans-serif", overflow: "hidden" },
  head: { padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid #2a2a36" },
  hint: { fontSize: 11, color: "#888", fontWeight: 400 },
  input: { width: "100%", boxSizing: "border-box", padding: "8px 12px", background: "#0d0d12", color: "#eee", border: "none", borderBottom: "1px solid #2a2a36", fontSize: 13, outline: "none" },
  list: { maxHeight: 320, overflowY: "auto" },
  row: { padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "ui-monospace, monospace" },
  rowOn: { padding: "6px 12px", fontSize: 13, cursor: "pointer", background: "#2b3fb0", color: "#fff", fontFamily: "ui-monospace, monospace" },
  empty: { padding: "12px", fontSize: 12, color: "#888" },
};
