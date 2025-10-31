"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000");

export function NotificationBadge({ userId }: { userId: number }) {
  const [count, setCount] = useState<number>(0);

  async function fetchNotifications() {
    try {
      const res = await fetch(
        `${API_BASE}/seguridad/notificaciones/?p_accion=CONSULTAR&p_id_usuario_destinatario=${userId}`
      );
      const data = await res.json();

      if (data.status === "success" && Array.isArray(data.data)) {
        const unread = data.data.filter((n: any) => !n.leida).length;
        setCount(unread);
      }
    } catch (err) {
      console.error("⚠️ Error al obtener notificaciones:", err);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // cada 20s
      return () => clearInterval(interval);
    }
  }, [userId]);

  return (
    <div className="relative inline-flex items-center gap-2">
      <Bell className="w-4 h-4" />
      <span>Notificaciones</span>

      {count > 0 && (
        <span className="absolute -top-1 -right-3 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}