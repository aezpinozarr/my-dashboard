"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Settings2, CopyX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { RowActionButtons } from "@/components/shared/RowActionButtons";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
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
  const [filterField, setFilterField] = React.useState("all");
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [rubroEditando, setRubroEditando] = React.useState<Rubro | null>(null);
  const [descripcionEdit, setDescripcionEdit] = React.useState("");

  // Nuevo diálogo para crear rubro
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);
  const [newId, setNewId] = React.useState("");
  const [newDescripcion, setNewDescripcion] = React.useState("");

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

  // Nuevo: manejar creación de rubro
  const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const resp = await fetch(`${API_BASE}/catalogos/rubro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      id: newId,
      descripcion: newDescripcion
    }),
    });

    if (!resp.ok) throw new Error(await resp.text());

    toast.success("Rubro creado correctamente");
    setIsNewDialogOpen(false);
    fetchRubros();
  } catch (err) {
    console.error("Error al crear rubro:", err);
    toast.error("Error al crear rubro");
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
  // 🔹 1. Acciones (primera columna)
{
  id: "acciones",
  header: () => null,          // ❌ No muestra título
  enableSorting: false,        // ❌ No ordena
  enableHiding: false,         // ❌ No puede ocultarse
  size: 1,                     // ✔ El ancho mínimo posible
  cell: ({ row }) => (
    <div className="flex justify-start pl-2">
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

  // 🔹 2. ID
  { accessorKey: "id", header: "ID" },

  // 🔹 3. Descripción
  { accessorKey: "descripcion", header: "Descripción" },

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
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
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
            <h1 className="text-2xl font-bold">Rubros</h1>
            {rubrosFiltrados.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {search.trim() === "" ? (
                <>
                  {" "}
                  <span className="font-bold">{rubrosFiltrados.length}</span> registro
                  {rubrosFiltrados.length !== 1 && "s"}.
                </>
              ) : (
                <>
                  {" "}
                  <span className="font-bold">{rubrosFiltrados.length}</span> registro
                  {rubrosFiltrados.length !== 1 && "s"} de{" "}
                  <span className="font-bold">{rubros.length}</span>.
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
            onExport={() => console.log("Exportar CSV")}
            showExport={view === "table"}
            table={table}
            showDeleted={showDeleted}
            setShowDeleted={setShowDeleted}
            onNewClick={() => setIsNewDialogOpen(true)}
          />
          <TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        size="icon"
        variant="outline"
        onClick={() => setShowDeleted(!showDeleted)}
        className={`transition-all border-2 shadow-sm ${
          showDeleted
            ? "border-red-600 bg-red-50 hover:bg-red-100 text-red-700"
            : "border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-700"
        }`}
      >
        <CopyX className="w-5 h-5" />
      </Button>
    </TooltipTrigger>

    <TooltipContent side="bottom" className="text-xs">
      {showDeleted ? "Mostrar activos" : "Mostrar eliminados"}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
          {/* Diálogo para crear nuevo rubro */}
          <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogContent className="max-w-md p-6">
              <DialogHeader className="pb-4 mb-2 border-b border-gray-200">
                <DialogTitle className="text-lg font-semibold leading-tight">
                  Nuevo Rubro
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="new-rubro-id"
                  >
                    ID del Rubro
                  </label>
                  <Input
                    id="new-rubro-id"
                    placeholder="ID"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    required
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-rubro-descripcion">
                    Descripción
                  </label>
                  <Input
                    id="new-rubro-descripcion"
                    placeholder="Descripción"
                    value={newDescripcion}
                    onChange={(e) => setNewDescripcion(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      style={{ backgroundColor: "#db200b", color: "white" }}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    style={{ backgroundColor: "#34e004", color: "white" }}
                    className="cursor-pointer"
                  >
                    Guardar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
            <option value="id">ID</option>
            <option value="descripcion">Descripción</option>
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
        {(search.trim() !== "" || filterField !== "all") && (
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
        )}
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
  className={cn(
    header.column.getCanSort() && "select-none",
    "py-2 px-3 text-xs font-semibold text-white bg-[#2563eb] text-center border-b border-gray-200"
  )}
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
                table.getRowModel().rows.map((row, idx) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      idx % 2 === 0 ? "bg-white" : "bg-gray-200", // alterna colores
                      "no-hover",
                      "transition-none"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                </React.Fragment>
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