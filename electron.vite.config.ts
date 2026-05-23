import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const alias = {
  "@core": fileURLToPath(new URL("./packages/core/src", import.meta.url)),
  "@faker-engine": fileURLToPath(new URL("./packages/faker-engine/src", import.meta.url)),
  "@postman": fileURLToPath(new URL("./packages/postman/src", import.meta.url)),
  "@request-engine": fileURLToPath(new URL("./packages/request-engine/src", import.meta.url)),
  "@storage": fileURLToPath(new URL("./packages/storage/src", import.meta.url)),
  "@renderer": fileURLToPath(new URL("./apps/desktop/src/renderer", import.meta.url))
};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: {
      rollupOptions: {
        input: "apps/desktop/src/main.ts"
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias },
    build: {
      rollupOptions: {
        input: "apps/desktop/src/preload.ts"
      }
    }
  },
  renderer: {
    root: ".",
    plugins: [react()],
    resolve: { alias },
    build: {
      rollupOptions: {
        input: "index.html"
      }
    }
  }
});
