import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API = process.env.NEDENMIS_API ?? "http://127.0.0.1:4319";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5319,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": { target: API, changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
