import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vite（開発サーバー・ビルド）と Vitest（単体テスト）の共通設定です。
export default defineConfig({
  // GitHub Pages のようなサブパス（/earth_rotation_viewer/）配下でも、
  // ローカル環境でも JS や CSS などのファイルが正しく読み込まれるように相対パス（"./"）にします。
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 大きなライブラリや地図データを別チャンクに分割し、キャッシュ効率を高めます。
        manualChunks(id) {
          if (id.includes("node_modules/three/")) {
            return "three";
          }
          if (
            id.includes("node_modules/world-atlas/") ||
            id.includes("node_modules/topojson-client/")
          ) {
            return "atlas";
          }
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: "node",
  },
});
