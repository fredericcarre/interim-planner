import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './index.css'

// Remove the obsolete Workbox cache that used to intercept Firestore's live
// connection. Firestore must manage its own transport and cache lifecycle.
if ('caches' in window) {
  window.caches.delete('firestore-cache').catch(() => undefined)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
