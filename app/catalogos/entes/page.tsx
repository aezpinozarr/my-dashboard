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
import { MoreHorizontal } from "lucide-react";

// ======================
// 🔹 Base de la API
// ======================
const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("railway")
    ? "https://backend-licitacion-production.up.railway.app"
    : "http://127.0.0.1:8000";

// ======================
// 🔹 Tipado de datos
// ======================
type Ente = {
  id: string;
  descripcion: string;
  siglas: string;
  clasificacion: string;
  id_ente_tipo: string;
  ente_tipo_descripcion: string;
  activo: boolean;
};

// ======================
// 🔹 Componente principal
// ======================
export default function EntesPage() {
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");

  // ======================
  // Cargar entes
  // ======================
  const fetchEntes = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes`);
      const data = await resp.json();
      setEntes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando entes:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEntes();
  }, []);

  // ======================
  // Eliminar ente
  // ======================
  const eliminarEnte = async (id: string) => {
    if (!confirm(`¿Seguro que deseas eliminar el ente ${id}?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes/${id}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert("🗑️ Ente eliminado correctamente");
      fetchEntes();
    } catch (err) {
      console.error("❌ Error al eliminar ente:", err);
      alert("Error al eliminar ente");
    }
  };

  // ======================
  // Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" style={{ cursor: "pointer" }}>
              ←
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Entes</h1>
            <p className="text-gray-600 text-sm">
              Consulta, crea o edita los entes registrados en el sistema.
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards">🏛️ Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            asChild
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Link href="/catalogos/entes/new">Nuevo Ente</Link>
          </Button>

          <Button
            asChild
            style={{
              backgroundColor: "#db200b",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : entes.length === 0 ? (
        <p>No hay entes registrados</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entes.map((e) => (
            <Card
              key={e.id}
              className="shadow hover:shadow-lg transition border border-gray-200"
            >
              <CardHeader>
                <CardTitle>{e.descripcion}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>ID:</strong> {e.id}
                </p>
                <p>
                  <strong>Siglas:</strong> {e.siglas || "—"}
                </p>
                <p>
                  <strong>Clasificación:</strong> {e.clasificacion || "—"}
                </p>
                <p>
                  <strong>Tipo:</strong> {e.ente_tipo_descripcion || "—"}
                </p>
                <p>
                  <strong>Activo:</strong> {e.activo ? "✅ Sí" : "❌ No"}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    style={{
                      borderColor: "#235391",
                      color: "#235391",
                      cursor: "pointer",
                    }}
                  >
                    <Link href={`/catalogos/entes/edit/${e.id}`}>✏️ Editar</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    style={{
                      borderColor: "#db200b",
                      color: "#db200b",
                      cursor: "pointer",
                    }}
                    onClick={() => eliminarEnte(e.id)}
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
              <TableHead>Siglas</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entes.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.id}</TableCell>
                <TableCell>{e.descripcion}</TableCell>
                <TableCell>{e.siglas}</TableCell>
                <TableCell>{e.clasificacion}</TableCell>
                <TableCell>{e.ente_tipo_descripcion}</TableCell>
                <TableCell>{e.activo ? "✅" : "❌"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: "#235391",
                        color: "#235391",
                        cursor: "pointer",
                      }}
                    >
                      <Link href={`/catalogos/entes/edit/${e.id}`}>
                        ✏️ Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: "#db200b",
                        color: "#db200b",
                        cursor: "pointer",
                      }}
                      onClick={() => eliminarEnte(e.id)}
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