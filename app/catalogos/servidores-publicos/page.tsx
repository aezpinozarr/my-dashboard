// 🚀 Force rebuild cache 2025-10-10
"use client";

import * as React from "react";
// import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
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
import { List, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input"; // ✅ Barra de búsqueda
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { DataTable } from "@/components/shared/DataTable";
import { RowActionButtons } from "@/components/shared/RowActionButtons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// ======================
// 🔹 Base de la API sin variables de entorno
// ======================
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
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
  const [tableInstance, setTableInstance] = React.useState<any>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedServidor, setSelectedServidor] = React.useState<ServidorPublico | null>(null);

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

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "nombre", header: "Nombre" },
    { accessorKey: "cargo", header: "Cargo" },
    { accessorKey: "activo", header: "Activo",
      cell: ({ getValue }: any) => (getValue() ? "✅ Sí" : "❌ No")
    },
  ];

  // ======================
  // Instancia de tabla TanStack
  // ======================
  // const table = useReactTable({
  //   data: servidoresFiltrados,
  //   columns,
  //   getCoreRowModel: getCoreRowModel(),
  // });

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

        <div className="flex items-center gap-3">
          <ActionButtonsGroup
            viewMode={view}
            setViewMode={setView}
            onExport={() => console.log("Exportar CSV (pendiente)")}
            showExport={view === "table"}
            newPath="/catalogos/servidores-publicos/new"
            // table={table}
            showDeleted={showDeleted}
            setShowDeleted={setShowDeleted}
            table={tableInstance}
          />
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
                    <RowActionButtons
                      id={String(s.id)}
                      editPath="#"
                      onEdit={() => {
                        setSelectedServidor(s);
                        setIsEditDialogOpen(true);
                      }}
                      onDelete={() => toggleEstadoServidor(s.id)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">
          <DataTable
            data={servidoresFiltrados}
            columns={columns}
            isLoading={loading}
            onTableReady={setTableInstance}
          />
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Servidor Público</DialogTitle>
          </DialogHeader>
          {selectedServidor && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch(`${API_BASE}/catalogos/servidores-publicos/`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(selectedServidor),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  alert("✅ Servidor actualizado correctamente");
                  setIsEditDialogOpen(false);
                  fetchServidores();
                } catch (err) {
                  alert("❌ Error actualizando servidor");
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label>Nombre</Label>
                <Input
                  value={selectedServidor.nombre}
                  onChange={(e) =>
                    setSelectedServidor({ ...selectedServidor, nombre: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Cargo</Label>
                <Input
                  value={selectedServidor.cargo}
                  onChange={(e) =>
                    setSelectedServidor({ ...selectedServidor, cargo: e.target.value })
                  }
                  required
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedServidor.activo}
                  onChange={(e) =>
                    setSelectedServidor({ ...selectedServidor, activo: e.target.checked })
                  }
                />{" "}
                Activo
              </label>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#235391] text-white">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}