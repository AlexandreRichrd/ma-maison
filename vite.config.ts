import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on real environment variables (e.g. in production)
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // Local-dev-only stand-in for Caddy's prod /api/* routing (see the
    // root repo's Caddyfile) — keeps the climate socket (and any future
    // browser-initiated /api call) same-origin here too, so no dev-only
    // CORS config or client-visible API-origin env var is ever needed.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
