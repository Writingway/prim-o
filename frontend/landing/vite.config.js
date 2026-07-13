import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Landing-only build (Vercel deploy): Vite root is this folder, shared code is
// imported from ../src, and dependencies come from the parent package.json.
// Build: `npm run build:landing` outputs to landing/dist.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: '../public',   // Favicon shared with the app.
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  server: {
    // 5181 to stay off the app dev server's port (5180).
    port: 5181,
    strictPort: true,
    host: true,
    // WSL: the native file watcher is unreliable, so fall back to polling like the main config.
    watch: { usePolling: true, interval: 200 },
  },
})
