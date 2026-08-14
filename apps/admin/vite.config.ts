import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  // Served under /admin behind the demo/production reverse proxy, so asset
  // URLs must be prefixed. Overridable for a standalone deployment at a root.
  base: process.env.ADMIN_BASE_PATH ?? "/admin/",
});
