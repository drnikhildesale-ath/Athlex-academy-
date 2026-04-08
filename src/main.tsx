console.log("Main.tsx: Module loading...");
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Global error handler for startup
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error:", message, error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Application Failed to Start</h1>
        <p>${message}</p>
        <pre>${error?.stack || ''}</pre>
        <button onclick="window.location.reload()">Reload</button>
      </div>
    `;
  }
};

console.log("Main.tsx: Application starting...");
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
