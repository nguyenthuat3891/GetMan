import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const alias = {
  "@core": fileURLToPath(new URL("./packages/core/src", import.meta.url)),
  "@faker-engine": fileURLToPath(new URL("./packages/faker-engine/src", import.meta.url)),
  "@postman": fileURLToPath(new URL("./packages/postman/src", import.meta.url)),
  "@request-engine": fileURLToPath(new URL("./packages/request-engine/src", import.meta.url)),
  "@storage": fileURLToPath(new URL("./packages/storage/src", import.meta.url)),
  "@renderer": fileURLToPath(new URL("./apps/desktop/src/renderer", import.meta.url))
};

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias
  },
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true
  }
});
