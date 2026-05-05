import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // ページごとにチャンク分割 = 初回ロード軽量化
          if (id.includes("/pages/")) {
            const m = id.match(/\/pages\/Page(\d+)/);
            if (m) return `page-${m[1]}`;
          }
        }
      }
    }
  },
});
