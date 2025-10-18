"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Usuario = {
  id: number;
  username: string;
  nombre: string;
  tipo: string;
  activo: boolean;
};

// ✅ Definimos la constante global con soporte para Render, Railway y Local
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

export default function UsuariosEliminadosPage() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [hoy, setHoy] = React.useState("");

  // 🕒 Fecha legible
  React.useEffect(() => {
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // 📡 Cargar usuarios eliminados
  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch(`${API_BASE}/seguridad/usuarios`);
        const data = await res.json();
        setUsuarios((Array.isArray(data) ? data : []).filter((u) => !u.activo));
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  // 🔁 Recuperar usuario
  const recuperarUsuario = async (id: number) => {
    try {
      await fetch(`${API_BASE}/seguridad/usuarios/gestionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p_accion: "RECUPERAR", p_id: id }),
      });
      toast.success("✅ Usuario recuperado");
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("❌ Error al recuperar usuario");
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" className="cursor-pointer">
            ←
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Usuarios Eliminados</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">
            Recupera usuarios desactivados.
          </p>
        </div>
      </div>

      {/* LISTADO DE USUARIOS */}
      {usuarios.length === 0 ? (
        <p>No hay usuarios eliminados</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {usuarios.map((u) => (
            <Card key={u.id} className="shadow hover:shadow-lg transition">
              <CardHeader>
                <CardTitle>{u.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-gray-500">@{u.username}</p>
                <Button
                  size="sm"
                  style={{ backgroundColor: "#235391", color: "white" }}
                  onClick={() => recuperarUsuario(u.id)}
                >
                  🔁 Recuperar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}