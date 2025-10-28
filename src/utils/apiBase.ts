// src/utils/apiBase.ts
export function getApiBase(): string {
  // 1) Preferir VITE_API_BASE si existe (prod o preview en Vercel)
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_BASE) ||
    "";

  if (fromEnv && typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return fromEnv.trim().replace(/\/+$/, "");
  }

  // 2) Fallback local (Replit preview / dev server)
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return ""; // último recurso (no debería pasar)
}
