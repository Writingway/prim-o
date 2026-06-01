import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Port dédié à Prim'O (5173 est souvent pris par un autre projet).
    // strictPort : échoue clairement au lieu de glisser sur un autre port en douce.
    port: 5180,
    strictPort: true,
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
