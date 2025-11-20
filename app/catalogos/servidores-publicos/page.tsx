// 🚀 Force rebuild cache 2025-10-10
"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ZodError } from "zod";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
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
// 🔹 Esquema de validación con Zod para nuevo/editar servidor
// ======================
const servidorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  cargo: z.string().min(1, "El cargo es requerido"),
  activo: z.boolean(),
});

// ======================
// 🔹 Componente principal
// ======================
export default function ServidoresPublicosPage() {
  const [servidores, setServidores] = React.useState<ServidorPublico[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [search, setSearch] = React.useState(""); // ✅ Búsqueda
  const [showDeleted, setShowDeleted] = React.useState(false); // ✅ Ver eliminados
  // Filtro avanzado
  const [filterField, setFilterField] = React.useState("all");


  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedServidor, setSelectedServidor] = React.useState<ServidorPublico | null>(null);

  // Nuevo diálogo y estado para creación
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);
  const [newServidor, setNewServidor] = React.useState<{ nombre: string; cargo: string; activo: boolean }>({
    nombre: "",
    cargo: "",
    activo: true,
  });
  const [newFormErrors, setNewFormErrors] = React.useState<{ nombre?: string; cargo?: string }>({});

  // ======================
  // Cargar servidores públicos
  // ======================
  const fetchServidores = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/servidores-publicos?p_id=-99`);
      const data = await resp.json();
      setServidores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando servidores públicos:", err);
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
    if (!window.confirm(`¿Seguro que deseas ${accion} este servidor público?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/servidores-publicos/${id}`, {
        method: activar ? "PUT" : "DELETE",
      });

      if (!resp.ok) throw new Error(await resp.text());
      toast.success(
        activar
          ? "♻️ Servidor público reactivado correctamente"
          : "🗑️ Servidor público eliminado correctamente"
      );
      fetchServidores();
    } catch (err) {
      console.error(`❌ Error al ${accion} servidor público:`, err);
      toast.error(`Error al ${accion} servidor público`);
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
  const [columnVisibility, setColumnVisibility] = React.useState({});
  const table = useReactTable({
    data: servidoresFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  });

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
          <Button
            variant="outline"
            style={{ backgroundColor: "#db200b", color: "white" }}
            className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
          >
            ←
          </Button>
        </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Servidores Públicos
            </h1>
            {servidoresFiltrados.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {search.trim() === "" ? (
                <>
                  Mostrando{" "}
                  <span className="font-bold">{servidoresFiltrados.length}</span>{" "}
                  registro{servidoresFiltrados.length !== 1 && "s"}.
                </>
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-bold">{servidoresFiltrados.length}</span>{" "}
                  registro{servidoresFiltrados.length !== 1 && "s"} de{" "}
                  <span className="font-bold">{servidores.length}</span>.
                </>
              )}
            </p>
          )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ActionButtonsGroup
            viewMode={view}
            setViewMode={setView}
            onExport={() => console.log("Exportar CSV (pendiente)")}
            showExport={view === "table"}
            showDeleted={showDeleted}
            setShowDeleted={setShowDeleted}
            table={table}
            onNewClick={() => {
              setNewServidor({ nombre: "", cargo: "", activo: true });
              setNewFormErrors({});
              setIsNewDialogOpen(true);
            }}
          />
        </div>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA CON FILTROS */}
      <div className="w-full mt-2 flex gap-2 items-center">
        {/* Selector de categoría */}
        <div className="w-40">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="nombre">Nombre</option>
            <option value="cargo">Cargo</option>
          </select>
        </div>

        {/* Input de búsqueda */}
        <Input
          type="text"
          placeholder={
            filterField === "all"
              ? "Buscar en todo…"
              : `Buscar por ${filterField.replace(/_/g, " ")}…`
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        {/* Botón limpiar filtros */}
        {search.trim() !== "" || filterField !== "all" ? (
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setFilterField("all");
            }}
            className="whitespace-nowrap"
          >
            Limpiar
          </Button>
        ) : null}
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
                      Reactivar
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
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
          />
        </div>
      )}

      {/* Dialogo para editar servidor */}
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
                  toast.success("✅ Servidor actualizado correctamente");
                  setIsEditDialogOpen(false);
                  fetchServidores();
                } catch (err) {
                  toast.error("Error actualizando servidor");
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
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: "#34e004", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogo para nuevo servidor */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Servidor Público</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setNewFormErrors({});
              try {
                const parsed = servidorSchema.parse(newServidor);
                // POST nuevo servidor
                const res = await fetch(`${API_BASE}/catalogos/servidores-publicos/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(parsed),
                });
                if (!res.ok) throw new Error(await res.text());
                toast.success("Servidor creado correctamente");
                setIsNewDialogOpen(false);
                fetchServidores();
              } catch (err) {
                if (err instanceof ZodError) {
                  const fieldErrors: { nombre?: string; cargo?: string } = {};
                  (err as ZodError).issues.forEach((e) => {
                    if (e.path[0] === "nombre") fieldErrors.nombre = e.message;
                    if (e.path[0] === "cargo") fieldErrors.cargo = e.message;
                  });
                  setNewFormErrors(fieldErrors);
                } else {
                  toast.error("Error creando servidor");
                }
              }
            }}
            className="space-y-4"
          >
            <div>
              <Label>Nombre</Label>
              <Input
                value={newServidor.nombre}
                onChange={(e) =>
                  setNewServidor({ ...newServidor, nombre: e.target.value })
                }
                required
                aria-invalid={!!newFormErrors.nombre}
                aria-describedby="nombre-error"
              />
              {newFormErrors.nombre && (
                <p className="text-red-600 text-sm mt-1" id="nombre-error">{newFormErrors.nombre}</p>
              )}
            </div>

            <div>
              <Label>Cargo</Label>
              <Input
                value={newServidor.cargo}
                onChange={(e) =>
                  setNewServidor({ ...newServidor, cargo: e.target.value })
                }
                required
                aria-invalid={!!newFormErrors.cargo}
                aria-describedby="cargo-error"
              />
              {newFormErrors.cargo && (
                <p className="text-red-600 text-sm mt-1" id="cargo-error">{newFormErrors.cargo}</p>
              )}
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newServidor.activo}
                onChange={(e) =>
                  setNewServidor({ ...newServidor, activo: e.target.checked })
                }
              />{" "}
              Activo
            </label>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewDialogOpen(false)}
                style={{ backgroundColor: "#db200b", color: "white" }}
                className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: "#34e004", color: "white" }}
                className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
              >
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}