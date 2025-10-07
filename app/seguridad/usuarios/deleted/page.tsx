"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Usuario = {
  id: number;
  username: string;
  nombre: string;
  tipo: string;
  activo: boolean;
};

const getApiBase = (): string => {
  if (typeof window === "undefined") return "";
  if (window.location.hostname.includes("railway.app"))
    return "https://backend-licitacion-production.up.railway.app";
  if (window.location.protocol === "https:")
    return "https://127.0.0.1:8000";
  return "http://127.0.0.1:8000";
};

export default function UsuariosEliminadosPage() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [apiBase, setApiBase] = React.useState("");
  const [hoy, setHoy] = React.useState("");

  React.useEffect(() => {
    setApiBase(getApiBase());
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  React.useEffect(() => {
    if (!apiBase) return;
    const fetchUsuarios = async () => {
      const res = await fetch(`${apiBase}/seguridad/usuarios`);
      const data = await res.json();
      setUsuarios((Array.isArray(data) ? data : []).filter((u) => !u.activo));
    };
    fetchUsuarios();
  }, [apiBase]);

  const recuperarUsuario = async (id: number) => {
    try {
      await fetch(`${apiBase}/seguridad/usuarios/gestionar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ p_accion: "RECUPERAR", p_id: id }),
      });
      alert("✅ Usuario recuperado");
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Error al recuperar usuario");
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" className="cursor-pointer">←</Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Usuarios Eliminados</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">Recupera usuarios desactivados.</p>
        </div>
      </div>

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