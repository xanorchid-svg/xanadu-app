import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { isNative } from './lib/native'

// Phones pick up new versions on their own: check whenever Xanadu is opened or comes back to the front,
// and reload into the new version as soon as it's ready (the iPhone app updates through the App Store instead).
if (!isNative && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}) }
      document.addEventListener('visibilitychange', check)
      setInterval(check, 30 * 60 * 1000)
    },
  })
}

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
