import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Verrouillage anti-zoom strict iOS Safari & navigateurs mobiles
if (typeof window !== 'undefined') {
  // 1. Désactive le pinch-to-zoom (gestes multipoints)
  document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  // 2. Désactive le double-tap to zoom
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement | null;
        if (target && !['INPUT', 'TEXTAREA', 'BUTTON', 'A', 'SELECT'].includes(target.tagName)) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // 3. Verrouille la balise meta viewport lors du focus sur un champ texte
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const lockedViewport = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

  document.addEventListener(
    'focusin',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        if (viewportMeta) {
          viewportMeta.setAttribute('content', lockedViewport);
        }
      }
    },
    true
  );

  document.addEventListener(
    'focusout',
    () => {
      if (viewportMeta) {
        viewportMeta.setAttribute('content', lockedViewport);
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

