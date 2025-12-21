// Seencel Service Worker - MVP (Minimal Viable PWA)
// Este SW es un passthrough mínimo para habilitar la instalación como PWA

const SW_VERSION = '1.0.0';

// Install event - activar inmediatamente
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + SW_VERSION);
  self.skipWaiting();
});

// Activate event - tomar control inmediatamente
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated v' + SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// Fetch event - passthrough (sin cache por ahora)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
