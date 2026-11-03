import './lib/installApiHeader'
import { installExternalLinks } from './lib/openExternal'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

installExternalLinks()
if (import.meta.env.VITE_LINK_SMOKE === '1') import('./smoke/linkSmoke')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
