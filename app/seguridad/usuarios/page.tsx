// 🚀 Force rebuild cache 2025-10-10
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // ✅ Campo de búsqueda

type Usuario = {
  id: number;
  username: string;
  nombre?: string | null;
  tipo?: string | null;
  activo: boolean;
};

// ✅ Reemplazo de getApiBase() por constante global
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [filtro, setFiltro] = React.useState<string>(""); // ✅ Nuevo estado para búsqueda
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [hoy, setHoy] = React.useState("");

  // Inicializar fecha
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

  // Cargar usuarios
  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch(`${API_BASE}/seguridad/usuarios/`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setUsuarios(Array.isArray(data) ? data.filter((u) => u.activo) : []);
      } catch (err) {
        console.error("❌ Error cargando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Eliminar usuario
  const eliminarUsuario = async (id: number) => {
    if (!confirm(`¿Eliminar usuario con ID ${id}?`)) return;
    try {
      const resp = await fetch(`${API_BASE}/seguridad/usuarios/${id}/`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert("🗑️ Usuario eliminado correctamente");
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar usuario:", err);
      alert("Error al eliminar usuario");
    }
  };

  // ✅ Filtrado dinámico de usuarios
  const usuariosFiltrados = React.useMemo(() => {
    const term = filtro.trim().toLowerCase();
    if (!term) return usuarios;

    return usuarios.filter((u) =>
      [u.id, u.username, u.nombre, u.tipo]
        .filter(Boolean)
        .some((field) => field!.toString().toLowerCase().includes(term))
    );
  }, [usuarios, filtro]);

  // ======================
  // Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" className="cursor-pointer">
              ←
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Usuarios</h1>
              <span className="text-xs text-gray-500 capitalize">{hoy}</span>
            </div>
            <p className="text-gray-600 text-sm">
              Consulta, crea o edita usuarios del sistema.
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards">📇 Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
          >
            <Link href="/seguridad/usuarios/new">Nuevo</Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/seguridad/usuarios/deleted">Eliminados</Link>
          </Button>
        </div>
      </div>

      {/* 🔍 Barra de búsqueda */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por nombre, usuario o tipo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full"
        />
      </div>

      {/* LISTADO */}
      {loading ? (
        <p>Cargando...</p>
      ) : usuariosFiltrados.length === 0 ? (
        <p>No se encontraron usuarios con ese criterio</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {usuariosFiltrados.map((u) => (
            <Card key={u.id} className="shadow hover:shadow-lg transition">
              <CardHeader>
                <CardTitle>{u.nombre || "Sin nombre"}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">@{u.username}</p>
                  <p className="text-xs text-gray-400">Tipo: {u.tipo || "—"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    style={{ borderColor: "#235391", color: "#235391" }}
                  >
                    <Link href={`/seguridad/usuarios/edit/${u.id}`}>✏️</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    style={{ borderColor: "#db200b", color: "#db200b" }}
                    onClick={() => eliminarUsuario(u.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosFiltrados.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.nombre || "Sin nombre"}</TableCell>
                <TableCell>{u.tipo || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      style={{ borderColor: "#235391", color: "#235391" }}
                    >
                      <Link href={`/seguridad/usuarios/edit/${u.id}`}>✏️</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ borderColor: "#db200b", color: "#db200b" }}
                      onClick={() => eliminarUsuario(u.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}