// 🚀 Force rebuild cache 2025-10-10
"use client";

import * as React from "react";
import { RotateCcw, CopyX } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { RowActionButtons } from "@/components/shared/RowActionButtons";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Settings2, ChevronUp, ChevronDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// ======================
// 🔹 Base de la API
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
type Ente = {
  id: string;
  descripcion: string;
  siglas: string;
  clasificacion: string;
  id_ente_tipo: string;
  ente_tipo_descripcion: string;
  activo: boolean;
};

type EnteTipo = {
  id: string;
  descripcion: string;
};

// ======================
// 🔹 Schema para validación con zod
// ======================
const enteSchema = z.object({
  descripcion: z.string().min(3, "La descripción es requerida y debe tener al menos 3 caracteres"),
  siglas: z.string().optional(),
  clasificacion: z.enum(["Centralizada", "Paraestatal", "Desconcentrada"]),
  id_ente_tipo: z.string().min(1, "El tipo de ente es requerido"),
  activo: z.boolean(),
});

type EnteFormData = z.infer<typeof enteSchema>;

// ======================
// 🔹 Componente principal
// ======================
export default function EntesPage() {
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const [servidores, setServidores] = React.useState<any[]>([]);
  const [enteSeleccionado, setEnteSeleccionado] = React.useState<string | null>(null);

  // Estado para campo de filtro de búsqueda
  const [filterField, setFilterField] = React.useState("all");

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Estados para edición en modal
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [enteEditando, setEnteEditando] = React.useState<Ente | null>(null);

  const [enteTipos, setEnteTipos] = React.useState<EnteTipo[]>([]);
  // Estado para el diálogo de nuevo ente
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);

  const fetchEnteTipos = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/ente-tipo?p_id=-99`);
      const data = await resp.json();
      setEnteTipos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando tipos de ente:", err);
    }
  };

  const fetchServidores = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/servidores-publicos-ente?p_id_ente=${id}`);
      const data = await resp.json();
      setServidores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando servidores públicos:", err);
    }
  };

  // ======================
  // Cargar entes
  // ======================
  const fetchEntes = async () => {
    try {
      const url = `${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99&p_activo=${showDeleted ? "0" : "1"}`;
      const resp = await fetch(url);
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
    fetchEnteTipos();
  }, [showDeleted]);

  // ======================
  // Eliminar o reactivar ente
  // ======================
  const toggleEstado = async (id: string, activar = false) => {
    const accion = activar ? "reactivar" : "eliminar";
    if (!confirm(`¿Seguro que deseas ${accion} el ente ${id}?`)) return;

    try {
      const endpoint = activar
        ? `${API_BASE}/catalogos/entes/${id}/reactivar`
        : `${API_BASE}/catalogos/entes/${id}`;

      const method = activar ? "PUT" : "DELETE";

      const resp = await fetch(endpoint, { method });

      if (!resp.ok) throw new Error(await resp.text());
      toast.success(
        activar
          ? "♻️ Ente reactivado correctamente"
          : "🗑️ Ente eliminado correctamente"
      );
      fetchEntes();
    } catch (err) {
      console.error(`❌ Error al ${accion} ente:`, err);
      toast.error(`Error al ${accion} ente`);
    }
  };

  // ======================
  // Filtrar entes con selector de campo
  // ======================
  const entesFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term === "") return entes;

    return entes.filter((e) => {
      const normalize = (v: any) =>
        v?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ?? "";

      if (filterField === "all") {
        return [
          e.id,
          e.descripcion,
          e.siglas,
          e.clasificacion,
          e.ente_tipo_descripcion,
        ]
          .filter(Boolean)
          .some((field) => normalize(field).includes(normalize(term)));
      } else {
        return normalize((e as any)[filterField]).includes(normalize(term));
      }
    });
  }, [entes, search, filterField]);

  // ======================
  // Definir columnas para TanStack Table
  // ======================
  const columns = React.useMemo<ColumnDef<Ente>[]>(() => [
    {
    id: "acciones",
    header: () => null,

    enableSorting: false,
    enableHiding: false,
    size: 1,

    cell: ({ row }) => (
      <div
        className="
          sticky right-0 
          z-20
          bg-inherit 
          pr-3 flex justify-end
        "
      >
        <RowActionButtons
          id={row.original.id}
          editPath="/catalogos/entes/edit"
          onEdit={() => handleEditClick(row.original.id)}
          onDelete={() => toggleEstado(row.original.id)}
          onRestore={() => toggleEstado(row.original.id, true)}
          showDeleted={showDeleted}
        />
      </div>
    ),
  },
  
    { accessorKey: "id", header: () => <div className="text-center w-full">ID</div>,
      cell: ({ getValue }) => (
        <div className="text-center w-full">
          {String(getValue() ?? "—")}
        </div>
      ),
      size: 180,
    },
    { accessorKey: "descripcion", header: () => <div className="text-center w-full">Descripción</div>,
      cell: ({ getValue }) => (
        <div className="text-center w-full">
          {String(getValue() ?? "—")}
        </div>
      ),
      size: 180,
    },
    { accessorKey: "siglas", header: () => <div className="text-center w-full">Siglas</div>,
      cell: ({ getValue }) => (
        <div className="text-center w-full">
          {String(getValue() ?? "—")}
        </div>
      ),
      size: 180,
    },
    { accessorKey: "clasificacion",       header: () => <div className="text-center w-full">Clasificación</div>,
      cell: ({ getValue }) => (
        <div className="text-center w-full">
          {String(getValue() ?? "—")}
        </div>
      ),
      size: 180,
    },
    { accessorKey: "ente_tipo_descripcion",       header: () => <div className="text-center w-full">Tipo</div>,
      cell: ({ getValue }) => (
        <div className="text-center w-full">
          {String(getValue() ?? "—")}
        </div>
      ),
      size: 180,
    },

  ], [showDeleted]);

  const table = useReactTable({
    data: entesFiltrados,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ======================
  // Formulario edición con react-hook-form y zod
  // ======================
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<EnteFormData>({
    resolver: zodResolver(enteSchema),
    defaultValues: {
      descripcion: "",
      siglas: "",
      clasificacion: "Centralizada",
      id_ente_tipo: "",
      activo: true,
    },
  });

  React.useEffect(() => {
    if (enteEditando) {
      reset({
        descripcion: enteEditando.descripcion ?? "",
        siglas: enteEditando.siglas ?? "",
        clasificacion: (enteEditando.clasificacion as "Centralizada" | "Paraestatal" | "Desconcentrada") ?? "Centralizada",
        id_ente_tipo: String(enteEditando.id_ente_tipo ?? ""),
        activo: Boolean(enteEditando.activo),
      });
    }
  }, [enteEditando, reset]);

  const onSubmit = async (data: EnteFormData) => {
    if (!enteEditando) return;
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes/${String(enteEditando.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success("✅ Ente actualizado con éxito");
      setIsEditDialogOpen(false);
      setEnteEditando(null);
      fetchEntes();
    } catch (err) {
      console.error("❌ Error actualizando ente:", err);
      toast.error("Error actualizando ente");
    }
  };

  // ======================
  // Abrir diálogo de edición
  // ======================
  const handleEditClick = (id: string) => {
    const ente = entes.find((e) => e.id === id);
    if (!ente) return;
    setEnteEditando(ente);
    setIsEditDialogOpen(true);
  };

  // ======================
  // Render principal
  // ======================
  return (
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
              style={{ backgroundColor: "#db200b", color: "white" }}
            >
              ←
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Entes</h1>
            {entesFiltrados.length > 0 && (
  <p className="text-muted-foreground text-sm">
    {search.trim() === "" ? (
      <>
        {" "}
        <span className="font-bold">{entes.length}</span> registro
        {entes.length !== 1 && "s"}.
      </>
    ) : (
      <>
        {" "}
        <span className="font-bold">{entesFiltrados.length}</span> registro
        {entesFiltrados.length !== 1 && "s"} de{" "}
        <span className="font-bold">{entes.length}</span>.
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
                } transition-transform duration-150 ease-in-out hover:scale-105 cursor-pointer hover:brightness-110`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CopyX className="w-5 h-5" />
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom" className="text-xs">
              {showDeleted ? "Mostrar activos" : "Mostrar eliminados"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        </div>
      </div>

      {/* 🔍 Barra de búsqueda con filtros */}
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
            <option value="siglas">Siglas</option>
            <option value="clasificacion">Clasificación</option>
            <option value="ente_tipo_descripcion">Tipo de ente</option>
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

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : entesFiltrados.length === 0 ? (
        <p>{showDeleted ? "No hay entes eliminados" : "No hay entes activos"}</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entesFiltrados.map((e) => (
            <Card
              key={e.id}
              className="shadow hover:shadow-lg transition border border-gray-200"
            >
              <CardHeader>
                <CardTitle>{e.descripcion}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>ID:</strong> {e.id}</p>
                <p><strong>Siglas:</strong> {e.siglas || "—"}</p>
                <p><strong>Clasificación:</strong> {e.clasificacion || "—"}</p>
                <p><strong>Tipo:</strong> {e.ente_tipo_descripcion || "—"}</p>
                <p>
                  <strong>{showDeleted ? "Estado:" : "Activo:"}</strong>{" "}
                  {showDeleted
                    ? "🗑️ Eliminado"
                    : e.activo
                    ? "✅ Sí"
                    : "❌ No"}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{
                          borderColor: "#235391",
                          color: "#235391",
                          marginTop: "7px", // Alinear altura de botón ver servidores
                        }}
                        onClick={() => {
                          setEnteSeleccionado(e.descripcion);
                          fetchServidores(e.id);
                        }}
                        className="transition-transform duration-150 ease-in-out hover:scale-105 cursor-pointer cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                      >
                        👥 Ver Servidores
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl p-8">
                      <DialogHeader className="pb-4 mb-2 border-b border-gray-200">
                        <DialogTitle className="text-lg font-semibold leading-tight">
                          Servidores públicos — {enteSeleccionado}
                        </DialogTitle>
                      </DialogHeader>
                      {servidores.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay servidores registrados para este ente.</p>
                      ) : (
                        <ul className="text-sm space-y-2 max-h-[400px] overflow-y-auto pr-2">
                          {servidores.map((s) => (
                            <li key={s.id} className="border-b pb-1">
                              <strong>{s.nombre}</strong> — {s.cargo}
                              {s.activo === false && (
                                <span className="ml-2 text-xs text-red-500">(Inactivo)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </DialogContent>
                  </Dialog>
                  <RowActionButtons
                    id={e.id}
                    editPath="/catalogos/entes/edit"
                    onDelete={(id) => toggleEstado(id)}
                    onRestore={(id) => toggleEstado(id, true)}
                    showDeleted={showDeleted}
                    onEdit={handleEditClick}
                  />
                </div>
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
  style={{
    minWidth: header.getSize() ? header.getSize() : undefined,
    cursor: header.column.getCanSort() ? "pointer" : undefined,
  }}
  onClick={
    header.column.getCanSort()
      ? header.column.getToggleSortingHandler()
      : undefined
  }
  className={cn(
    header.column.getCanSort() && "select-none",
    "py-2 px-3 text-xs font-semibold text-white bg-[#2563eb] text-center border-b border-gray-200"
  )}
  aria-sort={
    header.column.getIsSorted()
      ? header.column.getIsSorted() === "asc"
        ? "ascending"
        : "descending"
      : undefined
  }
>
  <div className="flex items-center justify-center gap-1">
    {flexRender(header.column.columnDef.header, header.getContext())}
    {header.column.getCanSort() && (
      <span>
        {header.column.getIsSorted() === "asc" && (
          <ChevronUp size={14} className="inline" />
        )}
        {header.column.getIsSorted() === "desc" && (
          <ChevronDown size={14} className="inline" />
        )}
      </span>
    )}
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
                    No hay entes disponibles.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, idx) => (
                <React.Fragment key={row.original.id}>
                  <TableRow
                    className={cn(
                      idx % 2 === 0 ? "bg-white" : "bg-gray-200",
                      "no-hover",
                      "transition-none"
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="py-2 px-3 align-middle">
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

      {/* Dialog para edición de ente */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) { setIsEditDialogOpen(false); setEnteEditando(null); } }}>
        <DialogContent className="max-w-3xl p-8">
          <DialogHeader className="pb-4 mb-2 border-b border-gray-200">
            <DialogTitle className="text-lg font-semibold leading-tight">
              Editar Ente {enteEditando?.id}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="descripcion" className="block font-medium mb-1">Descripción</label>
              <Input id="descripcion" {...register("descripcion")} />
              {errors.descripcion && <p className="text-red-600 text-sm mt-1">{errors.descripcion.message}</p>}
            </div>
            <div>
              <label htmlFor="siglas" className="block font-medium mb-1">Siglas</label>
              <Input id="siglas" {...register("siglas")} />
              {errors.siglas && <p className="text-red-600 text-sm mt-1">{errors.siglas.message}</p>}
            </div>
            <div>
              <label htmlFor="clasificacion" className="block font-medium mb-1">Clasificación</label>
              <select id="clasificacion" {...register("clasificacion")} className="w-full rounded border border-gray-300 px-3 py-2">
                <option value="Centralizada">Centralizada</option>
                <option value="Paraestatal">Paraestatal</option>
                <option value="Desconcentrada">Desconcentrada</option>
              </select>
              {errors.clasificacion && <p className="text-red-600 text-sm mt-1">{errors.clasificacion.message}</p>}
            </div>
            <div>
              <label htmlFor="id_ente_tipo" className="block font-medium mb-1">Tipo de ente</label>
              <select id="id_ente_tipo" {...register("id_ente_tipo")} className="w-full rounded border border-gray-300 px-3 py-2">
                <option value="">Seleccione un tipo</option>
                {enteTipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>{tipo.descripcion}</option>
                ))}
              </select>
              {errors.id_ente_tipo && <p className="text-red-600 text-sm mt-1">{errors.id_ente_tipo.message}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                {...register("activo")}
                className="w-4 h-4"
              />
              <label htmlFor="activo" className="select-none">Activo</label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="transition-transform duration-150 ease-in-out hover:scale-105 cursor-pointer cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: "#34e004", color: "white" }}
                className="transition-transform duration-150 ease-in-out hover:scale-105 cursor-pointer cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para crear nuevo ente */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Nuevo Ente</DialogTitle>
            <p className="text-sm text-gray-500">Registra un nuevo ente público.</p>
          </DialogHeader>
          <NewEnteDialogForm
            enteTipos={enteTipos}
            setIsNewDialogOpen={setIsNewDialogOpen}
            fetchEntes={fetchEntes}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
// ========== Nuevo diálogo funcional para crear entes ==========
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

type NewEnteDialogFormProps = {
  enteTipos: EnteTipo[];
  setIsNewDialogOpen: (open: boolean) => void;
  fetchEntes: () => void;
};

function NewEnteDialogForm({ enteTipos, setIsNewDialogOpen, fetchEntes }: NewEnteDialogFormProps) {
  const [tiposFiltrados, setTiposFiltrados] = React.useState<EnteTipo[]>(enteTipos);
  const [isCommandOpen, setIsCommandOpen] = React.useState(false);
  const [selectedTipo, setSelectedTipo] = React.useState<string>("");
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof enteSchema>>({
    resolver: zodResolver(enteSchema),
    defaultValues: {
      descripcion: "",
      siglas: "",
      clasificacion: undefined,
      id_ente_tipo: "",
      activo: true,
    },
  });

  React.useEffect(() => {
    setTiposFiltrados(enteTipos);
  }, [enteTipos]);

  const onSubmit: SubmitHandler<z.infer<typeof enteSchema>> = async (data) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success("Ente creado correctamente");
      setIsNewDialogOpen(false);
      fetchEntes();
      reset();
      setSelectedTipo("");
      setIsCommandOpen(false);
    } catch (e: any) {
      toast.error(`❌ Error: ${e?.message ?? e}`);
    }
  };

  // Mantener sincrónico el texto seleccionado si el id cambia por reset
  React.useEffect(() => {
    setTimeout(() => {
      const currentTipoId =
        (document.querySelector('[name="id_ente_tipo"]') as HTMLInputElement)?.value || "";
      if (!currentTipoId) {
        setSelectedTipo("");
        return;
      }
      const tipo = enteTipos.find((t) => t.id === currentTipoId);
      if (tipo) setSelectedTipo(tipo.descripcion);
    }, 0);
    // eslint-disable-next-line
  }, [reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <Input placeholder="Nombre del ente" {...register("descripcion")} />
        {errors.descripcion && (
          <p className="text-sm text-red-600">{errors.descripcion.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Siglas</label>
        <Input placeholder="Ejemplo: SEGOB, SEE..." {...register("siglas")} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Clasificación</label>
        <select
          {...register("clasificacion")}
          className="border rounded-md p-2 w-full"
          defaultValue=""
        >
          <option value="" disabled>Selecciona una opción...</option>
          <option value="Centralizada">Centralizada</option>
          <option value="Paraestatal">Paraestatal</option>
          <option value="Desconcentrada">Desconcentrada</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo de ente</label>
        <Command className="border rounded-md">
          <CommandInput
            placeholder="Buscar tipo de ente..."
            value={selectedTipo}
            onValueChange={(val) => {
              setSelectedTipo(val);
              // Solo abrir el listado si el usuario escribe algo
              if (val.length > 0) {
                setIsCommandOpen(true);
              } else {
                setIsCommandOpen(false);
              }
              const filtrados = enteTipos.filter((t) =>
                t.descripcion.toLowerCase().includes(val.toLowerCase())
              );
              setTiposFiltrados(filtrados);
            }}
            onFocus={() => {
              // Solo abrir si hay valor escrito
              if (selectedTipo.length > 0) setIsCommandOpen(true);
            }}
            autoComplete="off"
            // Para evitar que el input muestre el id seleccionado, solo la descripción
          />
          {isCommandOpen && (
            <CommandList>
              <CommandGroup heading="Coincidencias">
                {tiposFiltrados.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                ) : (
                  tiposFiltrados.map((t) => (
                    <CommandItem
                      key={t.id}
                      onSelect={() => {
                        setSelectedTipo(t.descripcion);
                        setValue("id_ente_tipo", t.id, { shouldValidate: true });
                        setIsCommandOpen(false);
                      }}
                    >
                      {t.descripcion}
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
        {errors.id_ente_tipo && (
          <p className="text-sm text-red-600">{errors.id_ente_tipo.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" {...register("activo")} defaultChecked />
        Activo
      </label>

      <div className="flex justify-end gap-2 pt-3">
        <DialogClose asChild>
          <Button
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
  );
}