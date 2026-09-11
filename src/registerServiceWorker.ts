/**
 * Unregister any active Service Workers and clear offline caches
 * (Cancelled Service Worker / Static Cache as requested)
 */
export function unregisterServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((success) => {
          if (success) {
            console.log('[SW] Service Worker unregistered successfully:', registration.scope);
          }
        });
      }
    }).catch((err) => {
      console.warn('[SW] Error unregistering service workers:', err);
    });

    // Clear any previously created offline caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      }).catch((err) => {
        console.warn('[SW] Error clearing caches:', err);
      });
    }
  }
}

