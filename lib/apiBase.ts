// app/lib/apiBase.ts
// 🔹 Esta función devuelve la URL base correcta del backend
// 🔹 Funciona en local (HTTP) y producción (Railway HTTPS)

export function getApiBase(): string {
  // 1️⃣ Usa las variables configuradas en Railway o el backend local
  const envUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000";

  // 2️⃣ Si el frontend corre bajo HTTPS (Railway, Vercel, etc.),
  //    fuerza la versión HTTPS del backend
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return envUrl.replace(/^http:\/\//, "https://");
  }

  // 3️⃣ Si está en local (HTTP), usa la versión normal
  return envUrl;
}