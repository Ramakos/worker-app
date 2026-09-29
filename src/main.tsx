import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent accidental multi-touch pinch-to-zoom on iOS Safari
document.addEventListener('gesturestart', (e: Event) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e: Event) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e: Event) => e.preventDefault(), { passive: false });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
