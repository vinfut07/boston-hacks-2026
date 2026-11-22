/**
 * App entry point. Mounts <App /> into #root in index.html and loads global
 * styles (index.css). You rarely need to touch this file.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
