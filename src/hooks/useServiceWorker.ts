// src/hooks/useServiceWorker.ts

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[MissionTrack] Service Worker enregistré:', reg.scope);

          // Check for updates every 60s
          setInterval(() => reg.update(), 60000);

          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[MissionTrack] Nouvelle version disponible');
                  // Notify the app
                  window.dispatchEvent(new CustomEvent('sw-update-available'));
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[MissionTrack] Service Worker non enregistré:', err);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => reg.unregister());
  }
}
