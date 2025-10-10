// 🚀 Force rebuild cache 2025-10-10
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
import { Input } from "@/components/ui/input"; // ✅ Barra de búsqueda

// ======================
// 🔹 Base de la API sin variables de entorno
// ======================
const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("railway")
    ? "https://backend-licitacion-production.up.railway.app"
    : "http://127.0.0.1:8000";

// ======================
// 🔹 Tipado de datos
// ======================
type ServidorPublico = {
  id: number;
  nombre: string;
  cargo: string;
  activo: boolean;
};

// ======================
// 🔹 Componente principal
// ======================
export default function ServidoresPublicosPage() {
  const [servidores, setServidores] = React.useState<ServidorPublico[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [search, setSearch] = React.useState(""); // ✅ Búsqueda
  const [showDeleted, setShowDeleted] = React.useState(false); // ✅ Ver eliminados

  // ======================
  // Cargar servidores públicos
  // ======================
  const fetchServidores = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/servidores-publicos?p_id=-99`);
      const data = await resp.json();
      setServidores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando servidores públicos:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchServidores();
  }, []);

  // ======================
  // Eliminar o reactivar servidor público
  // ======================
  const toggleEstadoServidor = async (id: number, activar = false) => {
    const accion = activar ? "reactivar" : "eliminar";
    if (!confirm(`¿Seguro que deseas ${accion} este servidor público?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/servidores-publicos/${id}`, {
        method: activar ? "PUT" : "DELETE",
      });

      if (!resp.ok) throw new Error(await resp.text());
      alert(
        activar
          ? "♻️ Servidor público reactivado correctamente"
          : "🗑️ Servidor público eliminado correctamente"
      );
      fetchServidores();
    } catch (err) {
      console.error(`❌ Error al ${accion} servidor público:`, err);
      alert(`Error al ${accion} servidor público`);
    }
  };

  // ======================
  // 🔍 Filtrar búsqueda
  // ======================
  const servidoresFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtrados = servidores.filter((s) =>
      showDeleted ? !s.activo : s.activo
    );

    if (!term) return filtrados;

    return filtrados.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.cargo.toLowerCase().includes(term) ||
        s.id.toString().includes(term)
    );
  }, [servidores, search, showDeleted]);

  // ======================
  // 🎨 Render principal
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
            <h1 className="text-2xl font-bold">
              Catálogo de Servidores Públicos
            </h1>
            <p className="text-gray-600 text-sm">
              Consulta, crea, edita o recupera los servidores registrados.
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

          {!showDeleted && (
            <Button
              asChild
              style={{
                backgroundColor: "#235391",
                color: "white",
                cursor: "pointer",
              }}
            >
              <Link href="/catalogos/servidores-publicos/new">Nuevo</Link>
            </Button>
          )}

          {/* Botón Eliminados */}
          <Button
            variant="outline"
            className="cursor-pointer hover:shadow-sm transition"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? "← Volver a Activos" : "Eliminados"}
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

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : servidoresFiltrados.length === 0 ? (
        <p>
          {showDeleted
            ? "No hay servidores eliminados"
            : "No hay servidores activos"}
        </p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servidoresFiltrados.map((s) => (
            <Card
              key={s.id}
              className="shadow hover:shadow-lg transition border border-gray-200"
            >
              <CardHeader>
                <CardTitle>{s.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Cargo:</strong> {s.cargo || "—"}
                </p>
                <p>
                  <strong>Activo:</strong> {s.activo ? "✅ Sí" : "❌ No"}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  {showDeleted ? (
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: "#235391",
                        color: "#235391",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleEstadoServidor(s.id, true)}
                    >
                      ♻️ Reactivar
                    </Button>
                  ) : (
                    <>
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
                        <Link
                          href={`/catalogos/servidores-publicos/edit/${s.id}`}
                        >
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
                        onClick={() => toggleEstadoServidor(s.id)}
                      >
                        🗑️ Eliminar
                      </Button>
                    </>
                  )}
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
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servidoresFiltrados.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.nombre}</TableCell>
                <TableCell>{s.cargo}</TableCell>
                <TableCell>{s.activo ? "✅ Sí" : "❌ No"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {showDeleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        style={{
                          borderColor: "#235391",
                          color: "#235391",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleEstadoServidor(s.id, true)}
                      >
                        ♻️ Reactivar
                      </Button>
                    ) : (
                      <>
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
                          <Link
                            href={`/catalogos/servidores-publicos/edit/${s.id}`}
                          >
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
                          onClick={() => toggleEstadoServidor(s.id)}
                        >
                          🗑️ Eliminar
                        </Button>
                      </>
                    )}
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