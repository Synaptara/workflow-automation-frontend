import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
      proxy: {
        // Proxy API requests to Django
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        // Proxy WebSockets to Daphne (This will also fix those red console errors!)
        '/ws': {
          target: 'ws://127.0.0.1:8000',
          ws: true,
        }
      }
    }
});
