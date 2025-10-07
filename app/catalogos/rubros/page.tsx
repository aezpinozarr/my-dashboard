"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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

// ======================
// 🔹 Función universal para determinar el backend
// ======================
const getApiBase = () => {
  let base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000";

  // 🔒 Si la página está cargada bajo HTTPS, forzar HTTPS
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    base = base.replace(/^http:\/\//i, "https://");
  }

  // 🧩 Log de verificación (solo para debug)
  console.log("🌐 API_BASE:", base);

  return base;
};

const API_BASE = getApiBase();

type Rubro = {
  id: string;
  descripcion: string;
  activo: boolean;
};

export default function RubrosPage() {
  const [rubros, setRubros] = React.useState<Rubro[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");

  // ======================
  // Cargar rubros activos
  // ======================
  const fetchRubros = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
      const data = await resp.json();
      setRubros(Array.isArray(data) ? data.filter((r) => r.activo) : []);
    } catch (err) {
      console.error("❌ Error cargando rubros:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRubros();
  }, []);

  // ======================
  // Eliminar (inactivar) rubro
  // ======================
  const eliminarRubro = async (id: string) => {
    if (!confirm(`¿Seguro que deseas eliminar el rubro ${id}?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      alert("🗑️ Rubro eliminado correctamente");
      fetchRubros();
    } catch (err) {
      console.error("❌ Error al eliminar rubro:", err);
      alert("Error al eliminar rubro");
    }
  };

  // ======================
  // Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Título y regreso */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" className="cursor-pointer">
              ←
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Rubros</h1>
            <p className="text-gray-600 text-sm">
              Consulta, crea o edita rubros disponibles.
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards" className="cursor-pointer">
                📇 Cards
              </TabsTrigger>
              <TabsTrigger value="table" className="cursor-pointer">
                📋 Tabla
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ➕ Nuevo rubro */}
          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
            className="cursor-pointer"
          >
            <Link href="/catalogos/rubros/new">Nuevo Rubro</Link>
          </Button>

          {/* 🗑️ Rubros eliminados */}
          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/catalogos/rubros/delete">Eliminados</Link>
          </Button>

          {/* 🔴 Salir */}
          <Button
            asChild
            style={{ backgroundColor: "#db200b", color: "white" }}
            className="cursor-pointer"
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : rubros.length === 0 ? (
        <p>No hay rubros activos</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rubros.map((r) => (
            <Card
              key={r.id}
              className="shadow hover:shadow-lg transition cursor-default"
            >
              <CardHeader>
                <CardTitle>{r.descripcion}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-gray-500">ID: {r.id}</p>
                <div className="flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    style={{ borderColor: "#235391", color: "#235391" }}
                  >
                    <Link href={`/catalogos/rubros/edit/${r.id}`}>
                      ✏️ Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer"
                    style={{ borderColor: "#db200b", color: "#db200b" }}
                    onClick={() => eliminarRubro(r.id)}
                  >
                    🗑️ Eliminar
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
              <TableHead>Descripción</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rubros.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.descripcion}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      style={{ borderColor: "#235391", color: "#235391" }}
                    >
                      <Link href={`/catalogos/rubros/edit/${r.id}`}>
                        ✏️ Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      style={{ borderColor: "#db200b", color: "#db200b" }}
                      onClick={() => eliminarRubro(r.id)}
                    >
                      🗑️ Eliminar
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