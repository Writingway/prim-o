import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Alias '@/' → src/ to end deep '../../' imports. Additive and non-breaking:
  // existing relative imports keep working; migrate incrementally.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',   // client.ts is pure; bump to 'jsdom' for component tests
    globals: true,
  },

  server: {
    // Dedicated port for Prim'O (5173 is often taken by another project).
    // strictPort: fail loudly instead of silently sliding to another port.
    port: 5180,
    strictPort: true,
    host: true,
    allowedHosts: ['.trycloudflare.com', '.trycloudflare.com'],
    // WSL: the native inotify watcher often misses file changes, leaving HMR
    // silent so edits never show up. Polling is reliable under WSL.
    watch: { usePolling: true, interval: 200 },
    // Proxy: the frontend's /api calls are forwarded to the backend (port 4000).
    // The browser only talks to the frontend, which fixes WSL/CORS issues in dev.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
