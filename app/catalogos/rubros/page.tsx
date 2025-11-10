"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Settings2, CopyX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { RowActionButtons } from "@/components/shared/RowActionButtons";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// ======================
// 🔹 Tipado y configuración base
// ======================
type Rubro = {
  id: string;
  descripcion: string;
  activo: boolean;
};

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
  const [search, setSearch] = React.useState("");
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [rubroEditando, setRubroEditando] = React.useState<Rubro | null>(null);
  const [descripcionEdit, setDescripcionEdit] = React.useState("");

  // ======================
  // 🔄 Cargar rubros
  // ======================
  const fetchRubros = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
      const data = await resp.json();
      setRubros(Array.isArray(data) ? data : []);
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
      toast.success("🗑️ Rubro eliminado correctamente");
      fetchRubros();
    } catch (err) {
      console.error("❌ Error al eliminar rubro:", err);
      toast.error("Error al eliminar rubro");
    }
  };

  // ======================
  // ♻️ Reactivar rubro
  // ======================
  const reactivarRubro = async (id: string) => {
    if (!confirm(`¿Deseas reactivar el rubro ${id}?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro/recuperar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      toast.success("✅ Rubro reactivado correctamente");
      fetchRubros();
    } catch (err) {
      console.error("❌ Error al reactivar rubro:", err);
      toast.error("Error al reactivar rubro");
    }
  };

  const handleEditClick = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=${id}`);
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        setRubroEditando(data[0]);
        setDescripcionEdit(data[0].descripcion);
        setIsEditDialogOpen(true);
      }
    } catch (err) {
      console.error("❌ Error al cargar rubro:", err);
      toast.error("Error al cargar datos del rubro");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rubroEditando?.id,
          descripcion: descripcionEdit,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success("✅ Rubro actualizado correctamente");
      setIsEditDialogOpen(false);
      setRubroEditando(null);
      fetchRubros();
    } catch (err) {
      console.error("❌ Error al actualizar rubro:", err);
      toast.error("Error al actualizar rubro");
    }
  };

  // ======================
  // 🔍 Filtrar rubros
  // ======================
  const rubrosFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtrados = rubros.filter((r) => (showDeleted ? !r.activo : r.activo));
    if (!term) return filtrados;
    return filtrados.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.descripcion.toLowerCase().includes(term)
    );
  }, [rubros, search, showDeleted]);

  // ======================
  // 🧩 Columnas para TanStack Table
  // ======================
  const columns = React.useMemo<ColumnDef<Rubro>[]>(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "descripcion", header: "Descripción" },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ getValue }) => (getValue() ? "✅" : "❌"),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex justify-start -ml-4">
          <RowActionButtons
            id={row.original.id}
            editPath=""
            onEdit={() => handleEditClick(row.original.id)}
            onDelete={() => eliminarRubro(row.original.id)}
            onRestore={() => reactivarRubro(row.original.id)}
            showDeleted={showDeleted}
          />
        </div>
      ),
    },
  ], [showDeleted]);

  const table = useReactTable({
    data: rubrosFiltrados,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" 
                style={{ backgroundColor: "#db200b", color: "white" }}
                className="cursor-pointer">
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
        <div className="flex items-center gap-3">
          <ActionButtonsGroup
            viewMode={view}
            setViewMode={setView}
            onExport={() => console.log("Exportar CSV")}
            showExport={view === "table"}
            newPath="/catalogos/rubros/new"
            table={table}
            showDeleted={showDeleted}
            setShowDeleted={setShowDeleted}
          />
          <Button
            size="icon"
            variant="outline"
            title={showDeleted ? "Mostrar activos" : "Mostrar eliminados"}
            onClick={() => setShowDeleted(!showDeleted)}
            className={`transition-all border-2 shadow-sm ${
              showDeleted
                ? "border-red-600 bg-red-50 hover:bg-red-100 text-red-700"
                : "border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-700"
            }`}
          >
            <CopyX className="w-5 h-5" />
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
        <p>No hay rubros disponibles</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rubrosFiltrados.map((r) => (
            <Card
              key={r.id}
              className="shadow hover:shadow-lg transition border border-gray-200"
            >
              <CardHeader>
                <CardTitle>{r.descripcion}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-gray-500">ID: {r.id}</p>
                <RowActionButtons
                  id={r.id}
                  editPath=""
                  onEdit={() => handleEditClick(r.id)}
                  onDelete={() => eliminarRubro(r.id)}
                  onRestore={() => reactivarRubro(r.id)}
                  showDeleted={showDeleted}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const isSorted = header.column.getIsSorted();
                    return (
                      <TableHead
                        key={header.id}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        style={{ cursor: header.column.getCanSort() ? "pointer" : undefined }}
                        className={header.column.getCanSort() ? "hover:bg-gray-100 select-none" : ""}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {isSorted === "asc" && <ChevronUp size={16} />}
                          {isSorted === "desc" && <ChevronDown size={16} />}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-gray-400">
                    No hay rubros disponibles.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="pb-4 mb-2 border-b border-gray-200">
            <DialogTitle className="text-lg font-semibold leading-tight">
              Editar Rubro {rubroEditando?.id}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input value={rubroEditando?.id || ""} disabled />
            <Input
              placeholder="Descripción"
              value={descripcionEdit}
              onChange={(e) => setDescripcionEdit(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  type="button"
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Cancelar
                </Button>
              </DialogClose>
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