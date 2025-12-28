"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import Link from "next/link";

// --- UI Components ---
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RotateCcw,
  Loader2,
  EllipsisVertical
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

// --- TanStack Table ---
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ------------------------ API BASE ------------------------
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

// ------------------------ INTERFACES ------------------------
interface CalendarioFecha {
  fecha: string;
  hora: string;
}

interface CalendarioFuente {
  id_fuente_financiamiento: string;
  fuente_descripcion: string;
}

interface Calendario {
  id: number;
  ente: string;
  presidente: string;
  cargo_presidente: string;
  acuerdo: string;
  tipo_evento: string;
  tipo_licitacion: string;
  numero_sesion: string;
  usuario_registra: string;
  estatus?: string;  
  fechas?: CalendarioFecha[];
  actos?: any[]; 
  fuentes?: CalendarioFuente[];
}

function numeroSesionToTexto(num: any): string {
  const n = Number(num);
  if (!Number.isFinite(n) || n <= 0) return "—";

  const unidades = [
    "",
    "primera",
    "segunda",
    "tercera",
    "cuarta",
    "quinta",
    "sexta",
    "séptima",
    "octava",
    "novena",
  ];

  const decenas = [
    "",
    "décima",
    "vigésima",
    "trigésima",
    "cuadragésima",
    "quincuagésima",
    "sexagésima",
    "septuagésima",
    "octogésima",
    "nonagésima",
  ];

  const centenas = [
    "",
    "centésima",
    "ducentésima",
    "tricentésima",
    "cuadringentésima",
    "quingentésima",
    "sexcentésima",
    "septingentésima",
    "octingentésima",
    "noningentésima",
  ];

  if (n < 1000) {
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    let texto = "";

    if (c > 0) texto += centenas[c];
    if (d > 0) texto += (texto ? " " : "") + decenas[d];
    if (u > 0) texto += (texto ? " " : "") + unidades[u];

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  return `Sesión ${n}`;
}

// =========================================================================
// =====================   PAGE COMPONENT   ================================
// =========================================================================

export default function CalendarioPage() {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [data, setData] = useState<Calendario[]>([]);
  const [originalData, setOriginalData] = useState<Calendario[]>([]);

  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<
    Record<number, { fechas?: boolean; fuentes?: boolean; actos?: boolean }>
  >({});
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // --- Sorting ---
  const [sorting, setSorting] = useState<SortingState>([]);

  const [usuariosMap, setUsuariosMap] = useState<Record<string, string>>({});

  // =========================================================================
  // =========================== FETCH DATA ==================================
  // =========================================================================
  const fetchAll = async () => {
    setLoading(true);

    try {
      const url =
        user?.tipo === "ENTE"
          ? `${API_BASE}/procesos/calendario/consultar?p_id_ente=${user.id_ente}`
          : `${API_BASE}/procesos/calendario/consultar`;

      const res = await fetch(url);
      const json = await res.json();

      const calendarios = json?.calendario || [];

      // Fetch usuarios
      try {
        const resUsers = await fetch(`${API_BASE}/seguridad/usuarios/`);
        const usuarios = await resUsers.json(); 
        const map: Record<string, string> = {};
        usuarios.forEach((u: any) => {
          map[String(u.id)] = u.nombre_completo ?? u.nombre ?? "";
        });
        setUsuariosMap(map);
      } catch (err) {
        console.warn("No se pudo cargar usuarios:", err);
      }

      const normalized: Calendario[] = calendarios.map((c: any) => ({
        id: c.id,
        ente: c.ente ?? "—",
        presidente: c.servidor_publico ?? "—",
        cargo_presidente: c.servidor_publico_cargo ?? "—",
        acuerdo: c.acuerdo_o_numero_licitacion ?? "—",
        tipo_evento: c.tipo_evento ?? "—",
        tipo_licitacion: c.tipo_licitacion ?? "—",
        numero_sesion: c.tipo_licitacion_no_veces ?? "—",
        usuario_registra: c.id_usuario_registra ?? "—",
        estatus: c.estatus ?? "PREREGISTRADO",   

        fechas: [],
        actos: [], 
        fuentes: [],
      }));

async function safeJSON(response: Response, label: string) {
  try {
    if (!response.ok) {
      console.warn(`⚠️ Error HTTP en ${label}:`, response.status);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(`⚠️ Error al parsear JSON en ${label}:`, err);
    return null;
  }
}

await Promise.all(
  normalized.map(async (cal) => {

    const urlFechas = `${API_BASE}/procesos/calendario/fechas?p_id_calendario=${cal.id}`;
    const urlFuentes = `${API_BASE}/procesos/calendario/fuentes-financiamiento?p_id_calendario=${cal.id}`;
    const urlActos = `${API_BASE}/procesos/calendario/acto-popular?p_id_calendario=${cal.id}&p_id_listado_entregables=-99`;

    const [r1, r2, r3] = await Promise.all([
      fetch(urlFechas).catch(() => null),
      fetch(urlFuentes).catch(() => null),
      fetch(urlActos).catch(() => null),
    ]);

    const fechasJson = r1 ? await safeJSON(r1, "fechas") : null;
    const fuentesJson = r2 ? await safeJSON(r2, "fuentes") : null;
    const actosJson = r3 ? await safeJSON(r3, "actos") : null;

    console.log("🔍 RESPUESTAS PARA CALENDARIO:", cal.id, {
    fechasJson,
    fuentesJson,
    actosJson,
    });

    cal.fechas = Array.isArray(fechasJson?.fechas) ? fechasJson.fechas : [];
    cal.fuentes = Array.isArray(fuentesJson?.fuentes) ? fuentesJson.fuentes : [];
    cal.actos = Array.isArray(actosJson?.items) ? actosJson.items : [];
  })
);

    // Ordenar por ID DESC
    normalized.sort((a, b) => Number(b.id) - Number(a.id));

    // GUARDAR DESPUÉS de llenar actos/fuentes/fechas
    setData(normalized);
    setOriginalData(normalized);
    } catch (err) {
      console.error("❌ Error:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  // =========================================================================
  // ========================= BÚSQUEDA ======================================
  // =========================================================================
  useEffect(() => {
    if (search.trim() === "") {
      setData(originalData);
      return;
    }

    const lower = search.toLowerCase();
    const filtered = originalData.filter((item) =>
      Object.values(item).some((val) =>
        String(val ?? "").toLowerCase().includes(lower)
      )
    );

    setData(filtered);
  }, [search, originalData]);

  // =========================================================================
  // ========================= COLUMNS (TanStack) =============================
  // =========================================================================
  const columns = React.useMemo<ColumnDef<Calendario>[]>(
    () => [
      // ===================================================
      // Columna FANTASMA (expand)
      // ===================================================
      {
        id: "expander",
        header: "",
        cell: ({ row }) => (
          <button
            className={cn(
              "transition-colors rounded p-1 text-gray-500 hover:text-blue-700 hover:bg-gray-100",
              "flex items-center justify-center"
            )}
            onClick={() =>
              setExpandedRows((prev) => ({
                ...prev,
                [row.original.id]: !prev[row.original.id],
              }))
            }
          >
            {expandedRows[row.original.id] ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
        ),
        size: 60,
      },

      {
        id: "estatus",
        header: "",
        size: 60,
        cell: ({ row }) => {
            const estatus = row.original.estatus ?? "—";

            // COLORES según el estatus
            const colores: Record<string, string> = {
            PREREGISTRADO: "bg-yellow-400",
            REGISTRADO: "bg-green-500",
            CANCELADO: "bg-red-500",
            EN_PROCESO: "bg-blue-500",
            };

            const color = colores[estatus] ?? "bg-gray-400";

            return (
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <div
                    className={`w-4 h-4 rounded-full mx-auto cursor-default ${color}`}
                    ></div>
                </TooltipTrigger>
                <TooltipContent>{estatus}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            );
        },
        },
      {
        id: "options",
        header: "",
        size: 60,
        cell: ({ row }) => {
            const id = row.original.id;

            return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <button
                    className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition"
                >
                    <EllipsisVertical size={18} />
                </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                <Link href={`/licitacion-publica/new?idCalendario=${id}&step=1`}>
                    Editar paso 1: Licitación pública
                </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link href={`/licitacion-publica/new?idCalendario=${id}&step=2`}>
                    Editar paso 2: Fuentes de financiamiento
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <Link href={`/licitacion-publica/new?idCalendario=${id}&step=3`}>
                    Editar paso 3: Actos
                    </Link>
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            );
        },
        },

      // ===================================================
      { accessorKey: "id", header: "ID", cell: (info) => info.getValue() ?? "—" },
      {
        accessorKey: "ente",
        header: "Ente",
        cell: (info) => info.getValue() ?? "—",
      },
      {
        accessorKey: "presidente",
        header: "Presidente",
        cell: (info) => info.getValue() ?? "—",
      },
      {
        accessorKey: "cargo_presidente",
        header: "Cargo",
        cell: (info) => info.getValue() ?? "—",
      },
      {
        accessorKey: "acuerdo",
        header: "No. Licitación pública",
        cell: (info) => info.getValue() ?? "—",
      },
      {
        accessorKey: "tipo_evento",
        header: "Tipo Evento",
        cell: (info) => info.getValue() ?? "—",
      },
      {
        accessorKey: "tipo_licitacion",
        header: "Tipo Licitación",
        cell: (info) => info.getValue() ?? "—",
      },
      {
        accessorKey: "numero_sesion",
        header: "No. Sesión",
        cell: (info) => numeroSesionToTexto(String(info.getValue() ?? "—")),
      },
      {
        accessorKey: "usuario_registra",
        header: "Usuario",
        cell: (info) => usuariosMap[String(info.getValue())] ?? "—",
      },
    ],
    [expandedRows, usuariosMap]
  );

  // =========================================================================
  // =========================== TABLE INSTANCE ===============================
  // =========================================================================
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // =========================================================================
  // =========================== LOADING =====================================
  // =========================================================================
  if (loading) {
    return (
      <main className="w-full p-6 bg-white min-h-screen space-y-4">
        <CardHeader>
          <CardTitle>Cargando licitaciones públicas...</CardTitle>
        </CardHeader>
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </main>
    );
  }

  // =========================================================================
  // =========================== RENDER PAGE =================================
  // =========================================================================

  return (
    <main className="w-full p-6 bg-white min-h-screen space-y-6">
      {/* ================================================================
         ENCABEZADO (idéntico a PROCESOS PAGE)
      ================================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* IZQUIERDA */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    style={{ backgroundColor: "#db200b", color: "white" }}
                    className="hover:brightness-110 hover:scale-105"
                  >
                    ←
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">Salir</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div>
            <h1 className="text-2xl font-bold">Licitaciones públicas</h1>
            <p className="text-gray-600 text-sm">
              Consulta las licitaciones creadas por tu ente.
            </p>

            {data.length > 0 && (
              <p className="text-muted-foreground text-sm">
                <span className="font-bold">{data.length}</span> registro
                {data.length !== 1 && "s"}
              </p>
            )}
          </div>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={fetchAll}
                  className="h-9 w-9 flex items-center justify-center rounded-full border-gray-300 hover:bg-gray-100"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-gray-700" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Refrescar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* --- BOTÓN NUEVO (igual que en Procesos Page) --- */}
          <ActionButtonsGroup
            viewMode={viewMode}
            setViewMode={setViewMode}
            onExport={() => {}}
            showExport={false}
            newPath="/licitacion-publica/new"
            table={table}
          />
        </div>
      </div>

      {/* ================================================================
         BARRA DE BÚSQUEDA
      ================================================================ */}
      <div className="w-full flex gap-2 items-center">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        {search.trim() !== "" && (
          <Button
            variant="outline"
            onClick={() => setSearch("")}
            className="whitespace-nowrap"
          >
            Limpiar
          </Button>
        )}
      </div>

{viewMode === "cards" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
    {data.map((item: Calendario) => (
      <div
        key={item.id}
        className="relative border rounded-lg shadow-sm p-4 bg-white hover:shadow-md transition cursor-pointer space-y-2"
      >
          {/* INDICADOR DE ESTATUS */}
  <div className="absolute top-3 right-3">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`w-4 h-4 rounded-full cursor-default ${
              item.estatus === "PREREGISTRADO"
                ? "bg-yellow-400"
                : item.estatus === "REGISTRADO"
                ? "bg-green-500"
                : item.estatus === "CANCELADO"
                ? "bg-red-500"
                : item.estatus === "EN_PROCESO"
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
          ></div>
        </TooltipTrigger>
        <TooltipContent>{item.estatus}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
        {/* TÍTULO */}
        <h2 className="text-lg font-bold">
          Licitación Pública #{item.id}
        </h2>

        {/* NO. LICITACIÓN EN GRANDE */}
        <p className="text-xl font-semibold text-gray-800">
          No. Licitación: {item.acuerdo}
        </p>

        {/* INFO PRINCIPAL */}
        <p className="text-sm text-gray-700 font-semibold">{item.ente}</p>
        <p className="text-sm text-gray-600">Presidente: {item.presidente}</p>
        <p className="text-sm text-gray-600">Cargo: {item.cargo_presidente}</p>
        <p className="text-sm text-gray-600">Tipo de evento: {item.tipo_evento}</p>
        <p className="text-sm text-gray-600">Tipo de licitación: {item.tipo_licitacion}</p>
        <p className="text-sm text-gray-600">
          No. Sesión: {numeroSesionToTexto(item.numero_sesion)}
        </p>

        <div className="border-t my-3" />

        {/* ACTOS */}
        <details className="group mt-3">
          <summary className="cursor-pointer font-medium flex items-center gap-2">
            <ChevronRight className="group-open:rotate-90 transition-transform" size={16} />
            Actos
          </summary>

          <div className="mt-2 ml-6 text-sm text-gray-700">
            {item.actos?.length ? (
              <ul className="list-disc">
                {item.actos.map((a, i) => {
                  const fecha = a.fecha
                    ? new Date(a.fecha).toLocaleDateString("es-MX")
                    : "—";

                  const hora = a.hora
                    ? a.hora.substring(11, 16)
                    : "—";

                  return (
                    <li key={i} className="mb-2">
                      <span className="font-medium">{a.descripcion}</span>
                      <br />
                      <span className="text-gray-600">Fecha: {fecha}</span> —{" "}
                      <span className="text-gray-600">Hora: {hora}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">No hay actos registrados.</p>
            )}
          </div>
        </details>

        {/* FUENTES */}
        <details className="group mt-3">
          <summary className="cursor-pointer font-medium flex items-center gap-2">
            <ChevronRight className="group-open:rotate-90 transition-transform" size={16} />
            Fuente de financiamiento
          </summary>

          <div className="mt-2 ml-6 text-sm text-gray-700">
            {item.fuentes?.length ? (
              <ul className="list-disc">
                {item.fuentes.map((f, i) => (
                  <li key={i}>
                    {f.id_fuente_financiamiento} — {f.fuente_descripcion}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay fuentes registradas.</p>
            )}
          </div>
        </details>
      </div>
    ))}
  </div>
)}

      {/* ================================================================
         TABLA PRINCIPAL (idéntica a Procesos Page)
      ================================================================ */}
      {viewMode === "table" && (
        <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                {table.getHeaderGroups()[0].headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "py-2 px-3 text-xs font-semibold text-white bg-[#2563eb] text-center",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp size={14} />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown size={14} />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-4 text-gray-500"
                  >
                    No hay registros.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row, index) => (
                  <React.Fragment key={row.original.id}>
                    {/* ==================== FILA PRINCIPAL ==================== */}
                    <TableRow
                      className={
                        index % 2 === 0 ? "bg-white" : "bg-gray-100/60"
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2 px-3 text-center">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {/* ==================== FILA EXPANDIDA ==================== */}
                    {expandedRows[row.original.id] && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="bg-gray-50">
                          <div className="p-3 space-y-4">

                           {/* ==================== SUBTABLA ACTOS ==================== */}
                            <div className="border rounded-md bg-white">
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b font-semibold">
                                <button
                                type="button"
                                onClick={() =>
                                    setExpandedSections((prev) => ({
                                    ...prev,
                                    [row.original.id]: {
                                        ...(prev[row.original.id] || {}),
                                        actos: !prev[row.original.id]?.actos,
                                    },
                                    }))
                                }
                                className="flex items-center gap-2"
                                >
                                <ChevronRight
                                    size={16}
                                    className={cn(
                                    "transition-transform",
                                    expandedSections[row.original.id]?.actos && "rotate-90"
                                    )}
                                />
                                Actos
                                </button>
                            </div>

                            {(expandedSections[row.original.id]?.actos ?? false) && (
                                <div className="p-3">
                                {row.original.actos?.length ? (
                                    <ul className="list-disc pl-6 text-sm text-gray-700">
                                    {row.original.actos.map((a: any, i: number) => {
                                        const fecha = a.fecha
                                        ? new Date(a.fecha).toLocaleDateString("es-MX")
                                        : "—";

                                        const hora = a.hora
                                        ? a.hora.substring(11, 16)
                                        : "—";

                                        return (
                                        <li key={i}>
                                            <span className="font-medium">{a.descripcion}</span>
                                            <br />
                                            <span className="text-gray-600">Fecha: {fecha}</span> —{" "}
                                            <span className="text-gray-600">Hora: {hora}</span>
                                        </li>
                                        );
                                    })}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 text-sm">No hay actos registrados.</p>
                                )}
                                </div>
                            )}
                            </div>

                            {/* ==================== SUBTABLA FUENTES ==================== */}
                            <div className="border rounded-md bg-white">
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b font-semibold">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSections((prev) => ({
                                      ...prev,
                                      [row.original.id]: {
                                        ...(prev[row.original.id] || {}),
                                        fuentes:
                                          !prev[row.original.id]?.fuentes,
                                      },
                                    }))
                                  }
                                  className="flex items-center gap-2"
                                >
                                  <ChevronRight
                                    size={16}
                                    className={cn(
                                      "transition-transform",
                                      expandedSections[row.original.id]?.fuentes &&
                                        "rotate-90"
                                    )}
                                  />
                                  Fuente de financiamiento
                                </button>
                              </div>

                              {(expandedSections[row.original.id]?.fuentes ?? false) && (
                                <div className="p-3">
                                  {row.original.fuentes?.length ? (
                                    <ul className="list-disc pl-6 text-sm text-gray-700">
                                      {row.original.fuentes.map((f, i) => (
                                        <li key={i}>
                                          {f.id_fuente_financiamiento} —{" "}
                                          {f.fuente_descripcion}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-500 text-sm">
                                      No hay fuentes registradas.
                                    </p>
                                  )}
                                </div>
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
    </main>
  );
}