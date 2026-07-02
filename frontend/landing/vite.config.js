import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// Vitrine landing seule (déploiement Vercel) : racine Vite = ce dossier, code
// partagé importé depuis ../src, dépendances du package.json parent.
// Build : `npm run build:landing` → sortie dans landing/dist.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: '../public',   // favicon partagé avec l'app
  resolve: {
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  },
  server: {
    // 5181 : ne marche pas sur les pieds du dev app (5180).
    port: 5181,
    strictPort: true,
    host: true,
    // WSL : watcher natif peu fiable → polling, comme le config principal.
    watch: { usePolling: true, interval: 200 },
  },
})
