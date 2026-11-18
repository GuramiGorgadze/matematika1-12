import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    /* the Express API (npm run dev in /server) */
    proxy: { "/api": "http://localhost:4000" },
  },
  preview: {
    port: 4173,
    proxy: { "/api": "http://localhost:4000" },
  },
  build: {
    /* the curriculum pack is one large, lazily loaded chunk */
    chunkSizeWarningLimit: 1600,
  },
});
