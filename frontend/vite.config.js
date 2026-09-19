import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// host: true makes the dev server reachable from outside the container.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
