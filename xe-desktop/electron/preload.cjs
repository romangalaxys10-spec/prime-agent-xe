// Minimal preload: expose a safe bridge to the renderer. The renderer connects
// to the agent via the WebSocket port passed in the URL query, so the preload
// only needs to surface that port (and a flag for devtools) without exposing
// Node internals.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("xe", {
  getWsPort: () => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("wsPort")) || 18755;
  },
  getPtyPort: () => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get("ptyPort")) || 18756;
  },
});
