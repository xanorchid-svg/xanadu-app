import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth'
import './index.css'

// Don't restore the old scroll position on refresh; pages always open at the top
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
window.scrollTo(0, 0)

// Keep the screen locked at 100%: iOS Safari ignores user-scalable=no, so block pinch gestures directly
const noZoom = (e: Event) => e.preventDefault()
document.addEventListener('gesturestart', noZoom)
document.addEventListener('gesturechange', noZoom)
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
