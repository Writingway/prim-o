import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Alias '@/' → src/ : fin des imports profonds '../../'. Additif, non bloquant
  // (les imports relatifs existants marchent toujours ; migration au fil de l'eau).
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // Port dédié à Prim'O (5173 est souvent pris par un autre projet).
    // strictPort : échoue clairement au lieu de glisser sur un autre port en douce.
    port: 5180,
    strictPort: true,
    host: true,
    allowedHosts: ['.trycloudflare.com', '.trycloudflare.com'],
    // Proxy : les appels du front vers /api sont transmis au backend (port 4000).
    // Le navigateur ne parle qu'au front → règle les soucis WSL/CORS en dev.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
