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
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
