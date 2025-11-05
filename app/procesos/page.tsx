"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle, Loader2, LayoutGrid, List, ChevronDown, ChevronUp, Settings2, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Shadcn Table + TanStack Table
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
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
  r_estatus: string | null;
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
  }[];
}

export default function ProcesosPage() {
  const [data, setData] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, { rector: boolean; presupuesto: boolean }>>({});
  // --- TABLE VIEW LOGIC ---
  // Column definitions for TanStack Table
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
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
    { id: "r_estatus", header: "Estatus" },
  ];

  // Column definitions for Presupuesto subtable
  const columnsPresupuesto = [
    { id: "partida", header: "Partida" },
    { id: "capitulo", header: "Capítulo" },
    { id: "clasificacion", header: "Clasificación" },
    { id: "tipo_gasto", header: "Tipo de Gasto" },
    { id: "f_financiamiento", header: "Fuente Financiamiento" },
    { id: "rubro", header: "Rubro" },
    { id: "e_monto_presupuesto_suficiencia", header: "Monto" },
    { id: "proveedores", header: "Proveedores" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEnte, resRector] = await Promise.all([
          fetch(`${API_BASE}/procesos/ente-seguimiento/`),
          fetch(`${API_BASE}/procesos/rector-seguimiento-detallev1/`)
        ]);

        const jsonEnte = await resEnte.json();
        const jsonRector = await resRector.json();

        // 🔹 Extraemos el array correcto (puede venir en data o directamente)
        const enteData = Array.isArray(jsonEnte)
          ? jsonEnte
          : jsonEnte.data || [];

        const rectorData = Array.isArray(jsonRector)
          ? jsonRector
          : jsonRector.data || [];

        // 🔹 Creamos un mapa con los datos del ente
        const enteMap = new Map<number, any>();
        for (const item of enteData) {
          if (item.id !== undefined && item.id !== null) {
            enteMap.set(item.id, item);
          }
        }

        // 🔹 Hacemos merge: el del rector sobrescribe los del ente
        const merged: any[] = rectorData.map((rectorItem: any) => {
          const id = rectorItem.id;
          const enteItem = enteMap.get(id) || {};
          return { ...enteItem, ...rectorItem };
        });

        // 🔹 Agregamos los del ente que no tienen datos del rector
        for (const [id, enteItem] of enteMap.entries()) {
          if (!merged.find((item: any) => item.id === id)) {
            merged.push(enteItem);
          }
        }

        // 🔹 Ordenamos de más reciente a más antiguo
        merged.sort((a, b) => (b.id || 0) - (a.id || 0));

        // 🔹 Agrupamos por ID para consolidar los registros duplicados
        const groupedMap = new Map<number, any>();

        for (const item of merged) {
          const existing = groupedMap.get(item.id);

          if (existing) {
            // Busca si ya existe el mismo rubro dentro de los presupuestos del seguimiento
            const sameRubro = existing.presupuestos.find(
              (p: any) => p.rubro === item.rubro && p.partida === item.partida
            );

            if (sameRubro) {
              // 🔹 Fusiona proveedores únicos
              const newProviders = item.proveedores
                ? item.proveedores.split(";").map((prov: string) => prov.trim())
                : [];

              const existingProviders = sameRubro.proveedores
                ? sameRubro.proveedores.split(";").map((prov: string) => prov.trim())
                : [];

              const mergedProviders = Array.from(
                new Set([...existingProviders, ...newProviders])
              ).filter(Boolean);

              sameRubro.proveedores = mergedProviders.join("; ");
            } else {
              // Si no existe ese rubro aún, agrégalo como nuevo
              existing.presupuestos.push({
                partida: item.partida,
                capitulo: item.capitulo,
                clasificacion: item.clasificacion,
                tipo_gasto: item.tipo_gasto,
                f_financiamiento: item.f_financiamiento,
                etiquetado: item.etiquetado,
                fondo: item.fondo,
                ramo: item.ramo,
                rubro: item.rubro,
                e_monto_presupuesto_suficiencia: item.e_monto_presupuesto_suficiencia,
                proveedores: item.proveedores,
              });
            }
          } else {
            // 🔹 Nuevo seguimiento con su primer rubro
            groupedMap.set(item.id, {
              ...item,
              presupuestos: [
                {
                  partida: item.partida,
                  capitulo: item.capitulo,
                  clasificacion: item.clasificacion,
                  tipo_gasto: item.tipo_gasto,
                  f_financiamiento: item.f_financiamiento,
                  etiquetado: item.etiquetado,
                  fondo: item.fondo,
                  ramo: item.ramo,
                  rubro: item.rubro,
                  e_monto_presupuesto_suficiencia: item.e_monto_presupuesto_suficiencia,
                  proveedores: item.proveedores,
                },
              ],
            });
          }
        }

        // 🔹 Convertimos el mapa en un array consolidado
        const groupedData = Array.from(groupedMap.values());
        setData(groupedData);
        // setData(merged);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const columns = React.useMemo<ColumnDef<Seguimiento>[]>(
    () => [
      {
        id: "expander",
        header: "",
        cell: ({ row }) => (
          <button
            aria-label={expandedRows[row.original.id] ? "Cerrar detalle" : "Abrir detalle"}
            className={cn(
              "transition-colors rounded p-1 text-gray-500 hover:text-blue-700 focus-visible:ring-1 focus-visible:ring-blue-400",
              "outline-none"
            )}
            onClick={() =>
              setExpandedRows((prev) => ({
                ...prev,
                [row.original.id]: !prev[row.original.id],
              }))
            }
            tabIndex={0}
            type="button"
          >
            {expandedRows[row.original.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        ),
        enableSorting: false,
        size: 40,
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
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 180,
      },
      {
        accessorKey: "ente",
        header: "Ente",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 150,
      },
      {
        accessorKey: "ente_clasificacion",
        header: "Clasificación",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 120,
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
        header: "No. de veces",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 110,
      },
      {
        accessorKey: "servidor_publico_emite",
        header: "Servidor Público que emite",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 160,
      },
      {
        accessorKey: "e_servidor_publico_cargo",
        header: "Cargo",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 120,
      },
      {
        accessorKey: "e_fecha_y_hora_reunion",
        header: "Fecha de reunión",
        cell: ({ getValue }: { getValue: () => any }) => getValue() || "—",
        size: 140,
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
      <main className="max-w-6xl mx-auto p-6 space-y-6 bg-white min-h-screen">
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
    <main className="max-w-6xl mx-auto p-6 space-y-6 bg-white min-h-screen">
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
              Detalle de Procesos
            </h1>
            <p className="text-gray-600 text-sm">
              Consulta todos los seguimientos registrados por tu ente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Customize Columns (solo en modo tabla) */}
          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-2 items-center">
                  <Settings2 size={16} />
                  <span className="hidden sm:inline"> Personalizar Columnas</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
                {table.getAllLeafColumns().map((column) =>
                  column.id !== "expander" ? (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={() => column.toggleVisibility()}
                    >
                      {flexRender(column.columnDef.header, { column, table } as any)}
                    </DropdownMenuCheckboxItem>
                  ) : null
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Botón Exportar a .CSV (solo en modo tabla) */}
          {viewMode === "table" && (
            <Button
              variant="outline"
              style={{ backgroundColor: "#10c706", color: "white" }}
              onClick={() => console.log("Exportar CSV (implementación pendiente)")}
            >
              Exportar a .CSV
            </Button>
          )}
          {/* Botones Nuevo y Salir */}
          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
          >
            <Link href="/procesos/new">Nuevo</Link>
          </Button>
          <Button
            asChild
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
          {/* Botones de cambio de vista (movidos al final) */}
          <div className="flex gap-1 ml-4">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "rounded-full",
                viewMode === "table" ? "bg-blue-100 text-blue-700" : ""
              )}
              aria-label="Vista tabla"
              onClick={() => setViewMode("table")}
            >
              <List size={20} />
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon"
              className={cn(
                "rounded-full",
                viewMode === "cards" ? "bg-blue-100 text-blue-700" : ""
              )}
              aria-label="Vista tarjetas"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid size={20} />
            </Button>
          </div>
        </div>
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
                      header.column.getCanSort() && "select-none hover:bg-gray-100",
                      "py-2 px-3 text-xs font-semibold text-gray-600 border-b border-gray-200 bg-gray-50"
                    )}
                    aria-sort={
                      header.column.getIsSorted()
                        ? header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span>
                          {header.column.getIsSorted() === "asc" && <ChevronUp size={14} className="inline" />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown size={14} className="inline" />}
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
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.original.id}>
                    <TableRow
                      className={cn(
                        "transition-colors",
                        expandedRows[row.original.id] && "bg-blue-50"
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
                                        {row.original.presupuestos && row.original.presupuestos.length > 0 ? (
                                          row.original.presupuestos.map((pres, idx) => (
                                            <TableRow key={idx}>
                                              {columnsPresupuesto
                                                .filter(col => columnVisibilityPresupuesto[col.id] ?? true)
                                                .map(col => (
                                                  <TableCell key={col.id} className="px-2 py-1 text-sm whitespace-nowrap">
                                                    {col.id === "e_monto_presupuesto_suficiencia"
                                                      ? formatMXN((pres as Record<string, any>)[col.id])
                                                      : col.id === "proveedores"
                                                      ? (pres.proveedores
                                                          ? (
                                                            <ul className="list-disc pl-4">
                                                              {pres.proveedores.split(";").map((prov, i) => (
                                                                <li key={i}>{prov.trim()}</li>
                                                              ))}
                                                            </ul>
                                                          )
                                                          : "—")
                                                      : (pres as Record<string, any>)[col.id] ?? "—"}
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
                                        )}
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
                <AccordionTrigger className="p-0 focus-visible:ring-0">
                  <div className="cursor-pointer p-5 grid grid-cols-1 md:grid-cols-3 gap-4 w-full pr-8 transition-none bg-gray-50">
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
                      <p><strong>Estatus:</strong> {item.r_estatus || "—"} <StatusBadge value={item.r_estatus} /></p>
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