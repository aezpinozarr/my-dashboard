"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle, Loader2, LayoutGrid, List, ChevronDown, ChevronUp, Settings2, ChevronRight, Download, PlusCircle, LogOut, EllipsisVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { Input } from "@/components/ui/input";
// Shadcn Table + TanStack Table
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

interface Seguimiento {
  id: number;
  e_oficio_invitacion: string;
  ente: string;
  ente_clasificacion: string;
  e_tipo_evento: string;
  e_tipo_licitacion: string;
  e_tipo_licitacion_no_veces: number;
  tipo_licitacion_no_veces_descripcion: string;
  e_fecha_y_hora_reunion: string;
  servidor_publico_emite: string;
  e_servidor_publico_cargo: string;
  r_suplencia_oficio_no: string | null;
  r_fecha_emision: string | null;
  r_asunto: string | null;
  r_fecha_y_hora_reunion: string | null;
  seguimiento_estatus: string | null;
  partida: string | null;
  capitulo: string | null;
  clasificacion: string | null;
  tipo_gasto: string | null;
  f_financiamiento: string | null;
  etiquetado: string | null;
  fondo: string | null;
  ramo: string | null;
  rubro: string | null;
  e_monto_presupuesto_suficiencia: string | null;
  proveedores: string | null;
  id_seguimiento_partida_rubro?: number | null;
  presupuestos?: {
     id_partida?: number | null;
    id_rubro?: number | null;
    partida: string | null;
    capitulo: string | null;
    clasificacion: string | null;
    tipo_gasto: string | null;
    f_financiamiento: string | null;
    etiquetado: string | null;
    fondo: string | null;
    ramo: string | null;
    rubro: string | null;
    estatus: string | null; 
    e_monto_presupuesto_suficiencia: string | null;
    proveedores: string | null;
  }[];
}

export default function ProcesosPage() {
  const { user } = useUser();
const [userLoaded, setUserLoaded] = useState(false);
useEffect(() => {
  if (user !== null) {
    setUserLoaded(true);
  }
}, [user]);


  const [data, setData] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [originalData, setOriginalData] = useState<Seguimiento[]>([]);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, { rector: boolean; presupuesto: boolean }>>({});
  // --- TABLE VIEW LOGIC ---
  // Column definitions for TanStack Table
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
  ente_clasificacion: false,
  e_servidor_publico_cargo: false,
});



  const [sorting, setSorting] = React.useState<SortingState>([]);
  // Column visibility for Rector and Presupuesto subtables
  const [columnVisibilityRector, setColumnVisibilityRector] = useState<Record<string, boolean>>({});
  const [columnVisibilityPresupuesto, setColumnVisibilityPresupuesto] = useState<Record<string, boolean>>({});
  // Estado de apertura de los menús de columnas para subtables
  const [openRectorMenu, setOpenRectorMenu] = useState(false);
  const [openPresupuestoMenu, setOpenPresupuestoMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Column definitions for Rector subtable
  const columnsRector = [
    { id: "r_suplencia_oficio_no", header: "Oficio suplencia" },
    { id: "r_fecha_emision", header: "Fecha de emisión" },
    { id: "r_asunto", header: "Asunto" },
    { id: "r_fecha_y_hora_reunion", header: "Fecha reunión" },
    { id: "estatus", header: "Estatus" },
  ];

  // Column definitions for Presupuesto subtable
  const columnsPresupuesto = [
    { id: "partida", header: "Partida" },
    { id: "capitulo", header: "Capítulo" },
    { id: "clasificacion", header: "Clasificación" },
    { id: "tipo_gasto", header: "Tipo de Gasto" },
    { id: "f_financiamiento", header: "Fuente Financiamiento" },
    { id: "rubro", header: "Rubro" },
    { id: "estatus", header: "Estatus" },
    { id: "e_monto_presupuesto_suficiencia", header: "Monto" },
    { id: "proveedores", header: "Proveedores" },
  ];

  useEffect(() => {
  // Espera a que el user esté completamente cargado
  if (!userLoaded) return;
  if (!user) return;

  const fetchData = async () => {
    try {
      let url = "";

      // 🟦 RECTOR → trae TODO
      if (user.tipo === "RECTOR") {
        url = `${API_BASE}/procesos/seguimiento/partida-rubro-proveedor-ente/all`;
        console.log("👑 Usuario RECTOR → cargando todos los entes");
      }

      // 🟪 ENTE → solo trae su ente
      else if (user.tipo === "ENTE") {
        if (!user.id_ente) {
          console.error("❌ ENTE sin id_ente");
          setLoading(false);
          return;
        }

        url = `${API_BASE}/procesos/seguimiento/partida-rubro-proveedor-ente/by-ente?p_id_ente=${user.id_ente}`;
        console.log(`🏛 Usuario ENTE → cargando datos del ente ${user.id_ente}`);
      }

      // Tipo desconocido
      else {
        console.error("❌ Tipo de usuario desconocido:", user.tipo);
        setLoading(false);
        return;
      }

      // 🔥 Fetch
      const res = await fetch(url);
      const json = await res.json();
      const rows = json.resultado || [];

      // 🔄 Consolidación
      const map = new Map();

      for (const row of rows) {
        const id = row.id;

      if (!map.has(id)) {
        map.set(id, {
          ...row,
          seguimiento_estatus: row.estatus, // el correcto (viene de v_seguimiento)
          presupuestos: []
        });
      } else {
        // Si ya existe, NO volver a asignar estatus (porque las filas del rubro traen PREINGRESO)
        const item = map.get(id);
        item.presupuestos = item.presupuestos ?? [];
      }

        const item = map.get(id);

        if (row.partida || row.rubro) {
          item.presupuestos.push({
            e_id_partida: row.e_id_partida ?? null,
            e_id_rubro: row.e_id_rubro ?? null,
            partida: row.partida,
            capitulo: row.capitulo,
            clasificacion: row.clasificacion,
            tipo_gasto: row.tipo_gasto,
            f_financiamiento: row.f_financiamiento,
            etiquetado: row.etiquetado,
            fondo: row.fondo,
            ramo: row.ramo,
            rubro: row.rubro,
            estatus: row.rubro_estatus,
            e_monto_presupuesto_suficiencia: row.e_monto_presupuesto_suficiencia,
            proveedores: row.razon_social,
          });
        }
      }

      const final = Array.from(map.values());
      setData(final);
      setOriginalData(final);

    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [userLoaded]);

  useEffect(() => {
    let filtered = originalData;

    if (search.trim() !== "") {
      const lower = search.toLowerCase();

      filtered = originalData.filter((item) => {
        if (filterField === "all") {
          return Object.values(item).some((val) =>
            String(val ?? "").toLowerCase().includes(lower)
          );
        } else {
          const value = String((item as any)[filterField] ?? "").toLowerCase();
          return value.includes(lower);
        }
      });
    }

    setData(filtered);
  }, [search, filterField, originalData]);

  const StatusBadge = ({ value }: { value: any }) =>
    value ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 bg-green-50 text-green-700">
        <CheckCircle className="w-3 h-3" /> Completado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-300 bg-gray-50 text-gray-700">
        <Loader2 className="w-3 h-3" /> Pendiente
      </span>
    );

  // Formatea cualquier valor a moneda MXN de manera segura
  const formatMXN = (v: any) => {
    const n = Number(v);
    if (!isFinite(n)) return "—";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  };

  // Contextual menu for actions
  // Needs router for push navigation
  const { useRouter } = require('next/navigation');
  const router = useRouter();

  // Contextual menu component for actions
  function RowActionsMenu({ id, estatus }: { id: number; estatus?: string | null }) {
    if (!['PREREGISTRADO',].includes(estatus ?? '')) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0 -mt-1"
        >
          <EllipsisVertical
            size={18}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          />
          <span className="sr-only">Más acciones</span>
        </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/procesos/edit?id=${id}&step=1`)}>
            Editar paso 1: Oficio de invitación
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/procesos/edit?id=${id}&step=2`)}>
            Editar paso 2: Partidas
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/procesos/edit?id=${id}&step=3`)}>
            Editar paso 3: Rubros
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/procesos/edit?id=${id}&step=4`)}>
            Editar paso 4: Proveedor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const columns = React.useMemo<ColumnDef<Seguimiento>[]>(
    () => [
      {
        id: "expander",
        header: "",
        cell: ({ row }) => {
          // Estatus color
          const value = row.original.seguimiento_estatus
          let color = "bg-gray-300";
          if (value === "PREREGISTRADO") color = "bg-yellow-400";
          else if (value === "REVISADO") color = "bg-green-500";
          else if (value === "CANCELADO") color = "bg-red-500";
          const tooltipText =
            value === "PREREGISTRADO"
              ? "PREREGISTRADO"
              : value === "REVISADO"
              ? "REVISADO"
              : value === "CANCELADO"
              ? "CANCELADO"
              : "Sin estatus";
          return (
            <div className="flex items-center gap-2 items-baseline mt-[2px]">
              <button
                aria-label={expandedRows[row.original.id] ? "Cerrar detalle" : "Abrir detalle"}
                className={cn(
                  "transition-colors rounded p-1 text-gray-500 hover:text-blue-700 focus-visible:ring-1 focus-visible:ring-blue-400",
                  "outline-none cursor-pointer hover:bg-gray-100",
                  "translate-y-[-2px]"
                )}
                onClick={() =>
                  setExpandedRows((prev) => ({
                    ...prev,
                    [row.original.id]: !prev[row.original.id],
                  }))
                }
                tabIndex={0}
                type="button"
                style={{ minWidth: 28, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {expandedRows[row.original.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`w-3 h-3 rounded-full ${color} cursor-pointer transition-colors translate-y-[-2px]`} />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <RowActionsMenu id={row.original.id} estatus={row.original.seguimiento_estatus} />
            </div>
          );
        },
        enableSorting: false,
        size: 60,
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ getValue }: { getValue: () => any }) => <span className="font-semibold">{getValue() ?? "—"}</span>,
        size: 60,
      },
      {
        accessorKey: "e_oficio_invitacion",
        header: "Oficio de invitación",
        cell: ({ getValue }) => (
          <div className="text-center w-full">
            {String(getValue() ?? "—")}
          </div>
        ),
      },
      {
        accessorKey: "ente",
        header: "Ente",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 150,
      },
      {
        accessorKey: "e_fecha_y_hora_reunion",
        header: "Fecha de reunión",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 140,
      },
          {
      accessorKey: "ente_clasificacion",
      header: () => <div className="text-center w-full">Clasificación</div>,
      cell: ({ getValue }) => (
        <div className="text-center w-full">
          {String(getValue() ?? "—")}
        </div>
      ),
      size: 180,
    },
      {
        accessorKey: "e_tipo_evento",
        header: "Tipo de Evento",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 120,
      },
      {
        accessorKey: "e_tipo_licitacion",
        header: "Tipo de Licitación",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 120,
      },
      {
        accessorKey: "tipo_licitacion_no_veces_descripcion",
        header: () => <div className="text-center w-full">No. de veces</div>,
        cell: ({ getValue }) => (
          <div className="text-center w-full">
            {String(getValue() ?? "—")}
          </div>
        ),
      },
      {
        accessorKey: "servidor_publico_emite",
        header: () => <div className="text-center w-full">Emite</div>,
        cell: ({ getValue }) => (
          <div className="text-center w-full">
            {String(getValue() ?? "—")}
          </div>
        ),
      },
      {
        accessorKey: "e_servidor_publico_cargo",
        header: () => <div className="text-center w-full">Cargo</div>,
        cell: ({ getValue }) => (
          <div className="text-center w-full">
            {String(getValue() ?? "—")}
          </div>
        ),
      },
    ],
    [expandedRows]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualExpanding: true,
    enableRowSelection: false,
    debugTable: false,
  });

  if (loading) {
    return (
      <main className="w-full p-6 space-y-6 bg-white min-h-screen">
        <CardHeader>
          <CardTitle>Cargando Seguimientos...</CardTitle>
        </CardHeader>
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-10 my-2" />
          ))}
        </div>
      </main>
    );
  }

  // --- CARDS/ACCORDION VIEW LOGIC ---
  // Reuse openItem for single open accordion

  return (
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  ←
                </Button>
              </Link>
            </TooltipTrigger>

            <TooltipContent side="bottom" className="text-xs">
              Salir
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
          <div>
            <h1 className="text-2xl font-bold">
              Seguimiento de Procesos
            </h1>
            <p className="text-gray-600 text-sm">
              Registros elaborados por tu ente.
            </p>
            {data.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {search.trim() === "" ? (
                <>
                  <span className="font-bold">{data.length}</span> registro
                  {data.length !== 1 && "s"}.
                </>
              ) : (
                <>
                  <span className="font-bold">{data.length}</span> registro
                  {data.length !== 1 && "s"} de{" "}
                  <span className="font-bold">{originalData.length}</span>.
                </>
              )}
            </p>
          )}
          </div>
        </div>
        <ActionButtonsGroup
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={() => console.log("Exportar CSV (implementación pendiente)")}
          showExport={viewMode === "table"}
          newPath="/procesos/new"
          table={table} // ✅ pasa la instancia de la tabla
        />
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
            <option value="ente">Ente</option>
            <option value="e_oficio_invitacion">Oficio</option>
            <option value="e_tipo_licitacion">Tipo Licitación</option>
            <option value="servidor_publico_emite">Servidor Público</option>
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
              setData(originalData);
            }}
            className="whitespace-nowrap"
          >
            Limpiar
          </Button>
        ) : null}
      </div>

      {/* --- VISTA TABLA --- */}
      {viewMode === "table" && (
        <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {table.getHeaderGroups()[0].headers.map((header) => (
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
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center text-gray-400">
                    No hay datos disponibles.
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
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2 px-3 align-top">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedRows[row.original.id] && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="bg-gray-50 border-t-0">
                          {/* --- Subtablas de detalles rector y presupuestales --- */}
                          <div className="p-2">
                            {/* Subtabla de Datos del Rector */}
                            <div className="mt-2 border rounded-md bg-white mb-4">
                              <div className="w-full flex items-center justify-between text-left text-gray-800 font-semibold px-3 py-2 bg-gray-50 border-b hover:bg-gray-100 transition-all duration-300 select-none">
                                <button
                                  type="button"
                                  aria-label={expandedSections[row.original.id]?.rector ? "Cerrar detalle" : "Abrir detalle"}
                                  className="flex items-center gap-2 focus:outline-none"
                                  onClick={() =>
                                    setExpandedSections((prev) => ({
                                      ...prev,
                                      [row.original.id]: {
                                        ...(prev[row.original.id] || {}),
                                        rector: !prev[row.original.id]?.rector,
                                      },
                                    }))
                                  }
                                >
                                  <ChevronRight
                                    size={16}
                                    className={cn(
                                      "transition-transform duration-300",
                                      expandedSections[row.original.id]?.rector && "rotate-90"
                                    )}
                                  />
                                  Datos del Rector
                                </button>
                                <div className="relative">
                                  {isMounted && (
                                    <DropdownMenu modal={false}>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="flex gap-2 items-center">
                                          <Settings2 size={14} />
                                          <span className="hidden sm:inline">Personalizar Columnas</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent forceMount align="end" className="max-h-80 overflow-auto">
                                        {columnsRector.map((col) => (
                                          <DropdownMenuCheckboxItem
                                            key={col.id}
                                            checked={columnVisibilityRector[col.id] ?? true}
                                            onCheckedChange={(checked) => {
                                              setColumnVisibilityRector((prev) => ({
                                                ...prev,
                                                [col.id]: checked,
                                              }));
                                            }}
                                            onSelect={(e) => e.preventDefault()}
                                          >
                                            {col.header}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                              {expandedSections[row.original.id]?.rector && (
                                <>
                                  <div className="overflow-x-auto">
                                    <Table className="table-auto w-full">
                                      <TableHeader>
                                        <TableRow className="bg-gray-50">
                                          {columnsRector
                                            .filter(col => columnVisibilityRector[col.id] ?? true)
                                            .map(col => (
                                              <TableHead key={col.id} className="px-2 py-1 text-sm font-semibold whitespace-nowrap">
                                                {col.header}
                                              </TableHead>
                                            ))}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        <TableRow>
                                          {columnsRector
                                            .filter(col => columnVisibilityRector[col.id] ?? true)
                                            .map(col => (
                                              <TableCell key={col.id} className="px-2 py-1 text-sm whitespace-nowrap">
                                                {(row.original as Record<string, any>)[col.id] ?? "—"}
                                                <br />
                                                <StatusBadge value={(row.original as Record<string, any>)[col.id]} />
                                              </TableCell>
                                            ))}
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Subtabla de Detalles Presupuestales */}
                            <div className="mt-4 border rounded-md bg-white">
                              <div className="w-full flex items-center justify-between text-left text-gray-800 font-semibold px-3 py-2 bg-gray-50 border-b hover:bg-gray-100 transition-all duration-300 select-none">
                                <button
                                  type="button"
                                  aria-label={expandedSections[row.original.id]?.presupuesto ? "Cerrar detalle" : "Abrir detalle"}
                                  className="flex items-center gap-2 focus:outline-none"
                                  onClick={() =>
                                    setExpandedSections((prev) => ({
                                      ...prev,
                                      [row.original.id]: {
                                        ...(prev[row.original.id] || {}),
                                        presupuesto: !prev[row.original.id]?.presupuesto,
                                      },
                                    }))
                                  }
                                >
                                  <ChevronRight
                                    size={16}
                                    className={cn(
                                      "transition-transform duration-300",
                                      expandedSections[row.original.id]?.presupuesto && "rotate-90"
                                    )}
                                  />
                                  Detalles Presupuestales
                                </button>
                                <div className="relative">
                                  {isMounted && (
                                    <DropdownMenu modal={false}>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="flex gap-2 items-center">
                                          <Settings2 size={14} />
                                          <span className="hidden sm:inline">Personalizar Columnas</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent forceMount align="end" className="max-h-80 overflow-auto">
                                        {columnsPresupuesto.map((col) => (
                                          <DropdownMenuCheckboxItem
                                            key={col.id}
                                            checked={columnVisibilityPresupuesto[col.id] ?? true}
                                            onCheckedChange={(checked) => {
                                              setColumnVisibilityPresupuesto((prev) => ({
                                                ...prev,
                                                [col.id]: checked,
                                              }));
                                            }}
                                            onSelect={(e) => e.preventDefault()}
                                          >
                                            {col.header}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>

                              {expandedSections[row.original.id]?.presupuesto && (
                                <>
                                  <div className="overflow-x-auto p-2">
                                    <Table className="table-auto w-full">
                                      <TableHeader>
                                        <TableRow className="bg-gray-50">
                                          {columnsPresupuesto
                                            .filter(col => columnVisibilityPresupuesto[col.id] ?? true)
                                            .map(col => (
                                              <TableHead key={col.id} className="px-2 py-1 text-sm font-semibold whitespace-nowrap">
                                                {col.header}
                                              </TableHead>
                                            ))}
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(() => {
                                          // 🔍 Presupuestos del seguimiento:
                                          console.log("🔍 Presupuestos del seguimiento:", row.original.presupuestos);
                                          return row.original.presupuestos && row.original.presupuestos.length > 0 ? (
                                            row.original.presupuestos.map((pres, idx) => (
                                              <TableRow key={idx}>
                                              {columnsPresupuesto
                                                .filter(col => columnVisibilityPresupuesto[col.id] ?? true)
                                                .map(col => (
                                                  <TableCell key={col.id} className="px-2 py-1 text-sm whitespace-nowrap">
                                                    {col.id === "estatus" ? (
                                                      // ⭐ Indicador de estatus con tooltip (sin texto)
                                                      (() => {
                                                        const estatus = pres.estatus || "—";

                                                        let color = "#939596"; // gris default
                                                        if (estatus === "ADJUDICADO") color = "#22c55e";
                                                        if (estatus === "DIFERIMIENTO") color = "#ff8800";
                                                        if (estatus === "CANCELADO") color = "#ef4444";

                                                        return (
                                                          <TooltipProvider delayDuration={100}>
                                                            <Tooltip>
                                                              <TooltipTrigger asChild>
                                                                <span
                                                                  className="w-3 h-3 rounded-full inline-block cursor-default"
                                                                  style={{ backgroundColor: color }}
                                                                />
                                                              </TooltipTrigger>
                                                              <TooltipContent side="top" className="text-xs">
                                                                {estatus}
                                                              </TooltipContent>
                                                            </Tooltip>
                                                          </TooltipProvider>
                                                        );
                                                      })()
                                                    ) : col.id === "e_monto_presupuesto_suficiencia" ? (
                                                      formatMXN((pres as Record<string, any>)[col.id])
                                                    ) : col.id === "proveedores" ? (
                                                      pres.proveedores ? (
                                                        <ul className="list-disc pl-4">
                                                          {pres.proveedores.split(";").map((prov, i) => (
                                                            <li key={i}>{prov.trim()}</li>
                                                          ))}
                                                        </ul>
                                                      ) : (
                                                        "—"
                                                      )
                                                    ) : col.id === "partida" ? (
                                                      `${(pres as any)?.e_id_partida ? "#" + (pres as any).e_id_partida + " - " : ""}${pres.partida || "—"}`
                                                    ) : col.id === "rubro" ? (
                                                      `${(pres as any)?.e_id_rubro ? "#" + (pres as any).e_id_rubro + " - " : ""}${pres.rubro || "—"}`
                                                    ) : (
                                                      (pres as Record<string, any>)[col.id] ?? "—"
                                                    )}
                                                  </TableCell>
                                                ))}
                                            </TableRow>
                                            ))
                                          ) : (
                                            <TableRow>
                                              <TableCell
                                                colSpan={columnsPresupuesto.filter(col => columnVisibilityPresupuesto[col.id] ?? true).length}
                                                className="text-center text-gray-500 italic px-2 py-1 text-sm"
                                              >
                                                No hay datos presupuestales disponibles.
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })()}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* --- VISTA TARJETAS/ACORDEÓN --- */}
      {viewMode === "cards" && (
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4 mt-4"
          value={openItem || undefined}
          onValueChange={(value: string | undefined) => setOpenItem(value || null)}
        >
          {data.map((item: Seguimiento, index: number) => {
            const uniqueKey = `item-${item.id}-${item.id_seguimiento_partida_rubro ?? "norubro"}-${index}`;
            const isOpen = openItem === uniqueKey;
            return (
              <AccordionItem
                key={uniqueKey}
                value={uniqueKey}
                className={`border rounded-md overflow-hidden bg-gray-50 ${
                  isOpen ? "shadow-md border-blue-300" : "border-gray-200"
                }`}
              >
                {/* Menú contextual fuera del AccordionTrigger */}
                <div className="flex justify-end p-2">
                  <RowActionsMenu id={item.id} estatus={item.seguimiento_estatus} />
                </div>
                <AccordionTrigger className="p-0 focus-visible:ring-0">
                  <div className="relative">
                    <div className="cursor-pointer p-5 grid grid-cols-1 md:grid-cols-3 gap-4 w-full pr-8 transition-none bg-gray-50">
                      <div className="flex items-center justify-center">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`w-3 h-3 rounded-full cursor-pointer ${
                                  item.seguimiento_estatus === "PREREGISTRADO"
                                    ? "bg-yellow-400"
                                    : item.seguimiento_estatus === "REVISADO"
                                    ? "bg-green-500"
                                    : item.seguimiento_estatus === "CANCELADO"
                                    ? "bg-red-500"
                                    : "bg-gray-300"
                                }`}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              {item.seguimiento_estatus === "PREREGISTRADO"
                                ? "PREREGISTRADO"
                                : item.seguimiento_estatus === "REVISADO"
                                ? "REVISADO"
                                : item.seguimiento_estatus === "CANCELADO"
                                ? "CANCELADO"
                                : "Sin estatus"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <div className="font-semibold text-gray-700">{item.id}</div>
                      <div className="text-gray-700 truncate">{item.e_oficio_invitacion || "—"}</div>
                      <div className="text-gray-700 truncate">{item.ente || "—"}</div>
                      <div className="md:col-span-3 mt-4 bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                        <h3 className="text-gray-800 font-semibold mb-3">
                          Datos del Ente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
                          <p><strong>Clasificación:</strong> {item.ente_clasificacion || "—"}</p>
                          <p><strong>Tipo de Evento:</strong> {item.e_tipo_evento || "—"}</p>
                          <p><strong>Tipo de Licitación:</strong> {item.e_tipo_licitacion || "—"}</p>
                          <p><strong>No. de veces:</strong> {item.tipo_licitacion_no_veces_descripcion || "—"}</p>
                          <p><strong>Servidor Público que emite:</strong> {item.servidor_publico_emite || "—"}</p>
                          <p><strong>Cargo:</strong> {item.e_servidor_publico_cargo || "—"}</p>
                          <p><strong>Fecha de reunión:</strong> {item.e_fecha_y_hora_reunion || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="bg-gray-50 border-t-4 border-blue-300 rounded-b-md mb-6 px-5 py-4 text-sm text-gray-700 space-y-6">
                  <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                    <h3 className="text-gray-800 font-semibold mb-3">
                      Datos del Rector
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700 text-sm">
                      <p><strong>Oficio suplencia:</strong> {item.r_suplencia_oficio_no || "—"} <StatusBadge value={item.r_suplencia_oficio_no} /></p>
                      <p><strong>Fecha de emisión:</strong> {item.r_fecha_emision || "—"} <StatusBadge value={item.r_fecha_emision} /></p>
                      <p><strong>Asunto:</strong> {item.r_asunto || "—"} <StatusBadge value={item.r_asunto} /></p>
                      <p><strong>Fecha reunión:</strong> {item.r_fecha_y_hora_reunion || "—"} <StatusBadge value={item.r_fecha_y_hora_reunion} /></p>
                      <p><strong>Estatus:</strong> {item.seguimiento_estatus || "—"} <StatusBadge value={item.seguimiento_estatus} /></p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                    <h3 className="text-gray-800 font-semibold mb-3">
                      Datos Presupuestales
                    </h3>
                    {item.presupuestos && item.presupuestos.length > 0 ? (
                      item.presupuestos.map((pres, idx) => (
                        <div key={idx} className="mb-4 pb-4 border-b border-gray-100 last:border-none">
                          <p><strong>Partida:</strong> {pres.partida || "—"}</p>
                          <p><strong>Capítulo:</strong> {pres.capitulo || "—"}</p>
                          <p><strong>Clasificación:</strong> {pres.clasificacion || "—"}</p>
                          <p><strong>Tipo de Gasto:</strong> {pres.tipo_gasto || "—"}</p>
                          <p><strong>Fuente de Financiamiento:</strong> {pres.f_financiamiento || "—"}</p>
                          <p><strong>Etiquetado:</strong> {pres.etiquetado || "—"}</p>
                          <p><strong>Fondo:</strong> {pres.fondo || "—"}</p>
                          <p><strong>Ramo:</strong> {pres.ramo || "—"}</p>
                          <p><strong>Rubro:</strong> {pres.rubro || "—"}</p>
                          <p><strong>Monto Presupuesto Suficiencia:</strong> {formatMXN(pres.e_monto_presupuesto_suficiencia)}</p>
                          <div>
                            <strong>Proveedores:</strong>
                            {pres.proveedores ? (
                              <ul className="list-disc pl-6 mt-1 text-gray-700">
                                {pres.proveedores.split(";").map((prov, i) => (
                                  <li key={i}>{prov.trim()}</li>
                                ))}
                              </ul>
                            ) : (
                              <span> — </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No hay datos presupuestales disponibles.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </main>
  );
}