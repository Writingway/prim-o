import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Poppins auto-hébergée (RGPD : pas d'appel au CDN Google, l'IP ne sort pas).
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@fontsource/poppins/400-italic.css'
import '@fontsource/poppins/500-italic.css'
import './index.css'
import { Toaster } from 'sonner'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster richColors position="top-center" />
    </ErrorBoundary>
  </StrictMode>,
)
