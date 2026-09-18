/**
 * Service Worker Registration for Offline (PWA) Support
 * Enables complete offline access for invoicing, editing, saving, and printing.
 */
import { registerSW } from 'virtual:pwa-register';

export function setupServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('[PWA] New version available, updating...');
        updateSW(true);
      },
      onOfflineReady() {
        console.log('[PWA] App is cached and ready to work completely offline.');
      },
      onRegisterError(error: unknown) {
        console.warn('[PWA] Service worker registration error:', error);
      },
    });
  }
}


