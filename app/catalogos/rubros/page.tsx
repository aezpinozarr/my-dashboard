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
// 🔹 Definir tipo
// ======================
type Rubro = {
  id: string;
  descripcion: string;
  activo: boolean;
};

// ======================
// 🔹 Determinar API_BASE solo en cliente
// ======================
const getApiBase = (): string => {
  if (typeof window === "undefined") return "";

  // Si estamos en Railway → usa el backend HTTPS de producción
  if (window.location.hostname.includes("railway.app")) {
    return "https://backend-licitacion-production.up.railway.app";
  }

  // Si estamos en HTTPS local (por túnel o proxy)
  if (window.location.protocol === "https:") {
    return "https://127.0.0.1:8000";
  }

  // Modo local normal
  return "http://127.0.0.1:8000";
};

export default function RubrosPage() {
  const [rubros, setRubros] = React.useState<Rubro[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [apiBase, setApiBase] = React.useState("");

  // ======================
  // ⚙️ Configurar API_BASE
  // ======================
  React.useEffect(() => {
    const base = getApiBase();
    console.log("🌐 API_BASE:", base);
    setApiBase(base);
  }, []);

  // ======================
  // 🔄 Cargar rubros cuando API_BASE esté lista
  // ======================
  React.useEffect(() => {
    if (!apiBase) return;

    const fetchRubros = async () => {
      try {
        const resp = await fetch(`${apiBase}/catalogos/rubro?p_id=-99`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        setRubros(Array.isArray(data) ? data.filter((r) => r.activo) : []);
      } catch (err) {
        console.error("❌ Error cargando rubros:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRubros();
  }, [apiBase]);

  // ======================
  // 🗑️ Eliminar rubro
  // ======================
  const eliminarRubro = async (id: string) => {
    if (!apiBase) return;
    if (!confirm(`¿Seguro que deseas eliminar el rubro ${id}?`)) return;

    try {
      const resp = await fetch(`${apiBase}/catalogos/rubro`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      alert("🗑️ Rubro eliminado correctamente");

      // Recargar lista
      const resp2 = await fetch(`${apiBase}/catalogos/rubro?p_id=-99`);
      const data = await resp2.json();
      setRubros(Array.isArray(data) ? data.filter((r) => r.activo) : []);
    } catch (err) {
      console.error("❌ Error al eliminar rubro:", err);
      alert("Error al eliminar rubro");
    }
  };

  // ======================
  // 🎨 Render principal
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
            <h1 className="text-2xl font-bold">Catálogo de Rubros</h1>
            <p className="text-gray-600 text-sm">
              Consulta, crea o edita rubros disponibles.
            </p>
          </div>
        </div>

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

          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
            className="cursor-pointer"
          >
            <Link href="/catalogos/rubros/new">Nuevo Rubro</Link>
          </Button>

          <Button asChild variant="outline" className="cursor-pointer">
            <Link href="/catalogos/rubros/delete">Eliminados</Link>
          </Button>

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