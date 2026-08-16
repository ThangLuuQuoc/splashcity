import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// No StrictMode: it double-mounts the canvas and re-runs world creation, which
// is wasteful for a game that owns a big mutable simulation object.
createRoot(document.getElementById('root')).render(<App />)
