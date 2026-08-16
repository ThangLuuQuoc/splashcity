import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// No StrictMode: it double-mounts the canvas and re-runs world creation, which
// is wasteful for a game that owns a big mutable simulation object.
createRoot(document.getElementById('root')).render(<App />)

// Offline support, and the thing that makes the browser offer "install".
// Registered relative to the document so it also works from a sub-path.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('sw.js', document.baseURI))
      .catch(() => { /* offline play is a bonus, never a requirement */ })
  })
}
