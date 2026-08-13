import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The renderer is a plain Vite web app. The Electron main process
// (`electron/main.cjs`) serves it and bridges it to the prime-agent CLI over a
// local WebSocket — the same pattern OpenCode desktop uses.
// `base: "./"` keeps asset URLs relative so Electron's loadFile() works.
export default defineConfig({
  base: "./",
  root: ".",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
