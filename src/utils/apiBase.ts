// src/utils/apiBase.ts
export function getApiBase(): string {
  const viteBase = (import.meta as any)?.env?.VITE_API_BASE?.trim?.() || "";

  // Usar VITE_API_BASE si está configurado (apunta a Vercel con CORS habilitado)
  // Los endpoints de Vercel tienen "Access-Control-Allow-Origin": "*"
  // fetchWithTimeout (15s) previene freezes si hay problemas de red
  if (viteBase) {
    return viteBase.replace(/\/$/, "");
  }

  // Fallback: window.location.origin (desarrollo local sin VITE_API_BASE)
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "";
}
