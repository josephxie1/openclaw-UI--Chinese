import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

function normalizeBase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "/";
  if (trimmed === "./") return "./";
  if (trimmed.endsWith("/")) return trimmed;
  return `${trimmed}/`;
}

export default defineConfig(() => {
  const envBase = process.env.OPENCLAW_CONTROL_UI_BASE_PATH?.trim();
  const base = envBase ? normalizeBase(envBase) : "./";
  return {
    base,
    plugins: [react()],
    build: {
      outDir: path.resolve(here, "../dist/control-ui-react"),
      emptyOutDir: true,
      sourcemap: true,
      chunkSizeWarningLimit: 1024,
    },
    server: {
      host: true,
      port: 5174,
      strictPort: true,
      proxy: {
        // Proxy WebSocket y API hacia el gateway dev (puerto 19001)
        "/api": {
          target: "http://localhost:19001",
          changeOrigin: true,
        },
        "/__openclaw__": {
          target: "http://localhost:19001",
          changeOrigin: true,
          ws: true,
        },
      },
    },
    esbuild: {
      // Support Lit's @customElement / @state decorators (TC39 stage-3 style)
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
      },
    },
  };
});
