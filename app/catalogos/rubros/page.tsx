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
import { Input } from "@/components/ui/input"; // ✅ Import para la barra de búsqueda

type Rubro = {
  id: string;
  descripcion: string;
  activo: boolean;
};

// ✅ Constante global para API base — uniforme con tus demás páginas
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

export default function RubrosPage() {
  const [rubros, setRubros] = React.useState<Rubro[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [search, setSearch] = React.useState(""); // ✅ Estado para búsqueda

  // ======================
  // 🔄 Cargar rubros
  // ======================
  React.useEffect(() => {
    const fetchRubros = async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
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
  }, []);

  // ======================
  // 🗑️ Eliminar rubro
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

      const resp2 = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
      const data = await resp2.json();
      setRubros(Array.isArray(data) ? data.filter((r) => r.activo) : []);
    } catch (err) {
      console.error("❌ Error al eliminar rubro:", err);
      alert("Error al eliminar rubro");
    }
  };

  // ======================
  // 🔍 Filtrar rubros según búsqueda
  // ======================
  const rubrosFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rubros;
    return rubros.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.descripcion.toLowerCase().includes(term)
    );
  }, [rubros, search]);

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
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

        {/* 🔹 CONTROLES */}
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
            <Link href="/catalogos/rubros/new">Nuevo</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="cursor-pointer hover:shadow-sm"
          >
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

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 🔹 CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : rubrosFiltrados.length === 0 ? (
        <p>No hay rubros activos</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rubrosFiltrados.map((r) => (
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
            {rubrosFiltrados.map((r) => (
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