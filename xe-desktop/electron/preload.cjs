// Preload bridge: expose a safe, minimal API to the renderer.
const { contextBridge, ipcRenderer } = require("electron");

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

// Native menu → renderer messages (from Electron Menu accelerators).
contextBridge.exposeInMainWorld("electron", {
  onMenu: (cb) => {
    const listener = (_e, msg) => cb(msg);
    ipcRenderer.on("xe-menu", listener);
    return () => ipcRenderer.removeListener("xe-menu", listener);
  },
});
