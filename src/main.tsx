import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupServiceWorker } from './registerServiceWorker';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register service worker for offline support safely
try {
  setupServiceWorker();
} catch (e) {
  console.warn('[PWA] Service worker setup failed to initialize:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (mountError) {
    console.error('[App] Failed to mount React root:', mountError);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #f1f5f9; padding: 1rem; font-family: 'Sarabun', -apple-system, sans-serif;">
        <div style="background-color: #ffffff; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); padding: 2rem; max-width: 28rem; width: 100%; text-align: center; border: 1px solid #e2e8f0;">
          <div style="width: 3.5rem; height: 3.5rem; border-radius: 9999px; background-color: #fee2e2; color: #dc2626; display: inline-flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">!</div>
          <h2 style="font-size: 1.125rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">เกิดข้อผิดพลาดในการเริ่มต้นระบบ</h2>
          <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.25rem;">ไม่สามารถเริ่มต้นส่วนการแสดงผลได้ กรุณาลองรีเฟรชหรือล้างแคช</p>
          <button onclick="window.location.reload()" style="padding: 0.6rem 1.25rem; background-color: #2563eb; color: #ffffff; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer;">โหลดใหม่ (Reload)</button>
        </div>
      </div>
    `;
  }
}
