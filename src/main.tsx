import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Recovery mode: unregister the previous offline worker that may be serving stale files.
// The portfolio still renders normally; offline caching can be re-enabled after the worker is verified.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((key) => key.startsWith('devbrezz-portfolio-')).map((key) => caches.delete(key)));
        }
        // Reload once to escape a page already controlled by the stale worker.
        const marker = 'devbrezz-sw-recovery-reloaded';
        if (navigator.serviceWorker.controller && !sessionStorage.getItem(marker)) {
          sessionStorage.setItem(marker, '1');
          window.location.reload();
        }
      } catch (error) {
        console.warn('Service worker recovery skipped:', error);
      }
    })();
  }, { once: true });
}
