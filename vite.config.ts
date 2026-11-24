import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Replit-only dev plugins (error overlay, cartographer) load only inside Replit.
async function replitPlugins(): Promise<PluginOption[]> {
  if (process.env.NODE_ENV === "production" || process.env.REPL_ID === undefined) return [];
  return [
    (await import("@replit/vite-plugin-runtime-error-modal")).default(),
    (await import("@replit/vite-plugin-cartographer")).cartographer(),
  ];
}

export default defineConfig(async () => ({
  plugins: [react(), ...(await replitPlugins())],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
