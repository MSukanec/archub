import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Register Service Worker for PWA
if ('serviceWorker'in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  });
}
createRoot(document.getElementById("root")!).render(<App />);
