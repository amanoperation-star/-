// Suppress Vite dev client WebSocket errors per AI Studio environment constraints
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = (reason && (reason.stack || reason.message || String(reason))) || "";
    if (
      msg.includes("@vite/client") ||
      msg.includes("createWebSocketModuleRunnerTransport") ||
      msg.includes("WebSocket closed without opened") ||
      msg.includes("WebSocket") ||
      msg.includes("vite")
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    const src = event.filename || "";
    const stack = (event.error && event.error.stack) || "";
    if (
      src.includes("@vite/client") ||
      msg.includes("createWebSocketModuleRunnerTransport") ||
      msg.includes("WebSocket closed without opened") ||
      msg.includes("WebSocket") ||
      stack.includes("@vite/client") ||
      stack.includes("createWebSocketModuleRunnerTransport")
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
