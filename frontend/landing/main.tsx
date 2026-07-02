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
import ErrorBoundary from '../src/components/ErrorBoundary'
import LandingApp from './LandingApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LandingApp />
      <Toaster richColors position="top-center" />
    </ErrorBoundary>
  </StrictMode>,
)
