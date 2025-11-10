"use client";

import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { Settings2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { List, LayoutGrid, ChevronUp, ChevronDown } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type Preregistro = {
  id: number;
  ente: string;
  ente_clasificacion: string;
  id_ente_tipo: string;
  e_oficio_invitacion: string;
  e_tipo_licitacion: string;
  e_tipo_licitacion_no_veces: number;
  tipo_licitacion_no_veces_descripcion: string;
  e_fecha_y_hora_reunion: string | null;
  r_suplencia_oficio_no: string | null;
  r_fecha_emision: string | null;
  r_asunto: string | null;
  r_fecha_y_hora_reunion: string | null;
  r_estatus: string;
  servidor_publico_emite: string;
  e_servidor_publico_cargo: string;
  e_tipo_evento?: string | null;
};

export default function SeguimientoRectorPage() {
  const [registros, setRegistros] = useState<Preregistro[]>([]);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const router = useRouter();

  const [detalle, setDetalle] = useState<any[]>([]);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    id: true,
    ente: true,
    e_oficio_invitacion: true,
    ente_clasificacion: true,
    e_tipo_licitacion: true,
    tipo_licitacion_no_veces_descripcion: true,
    servidor_publico_emite: true,
    e_fecha_y_hora_reunion: true,
    r_estatus: true,
    acciones: true,
  });

  const [sorting, setSorting] = useState<SortingState>([]);

  // ===============================
  // TanStack Table definition
  // ===============================
  const columns: ColumnDef<Preregistro>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => <span className="font-semibold">{String(getValue() ?? "—")}</span>,
      size: 60,
    },
    {
      accessorKey: "e_oficio_invitacion",
      header: "Oficio de Invitación",
      cell: ({ getValue }) => getValue() || "—",
      size: 180,
    },
    {
      accessorKey: "ente",
      header: "Ente",
      cell: ({ getValue }) => getValue() || "—",
      size: 150,
    },
    {
      accessorKey: "ente_clasificacion",
      header: "Clasificación",
      cell: ({ getValue }) => getValue() || "—",
      size: 120,
    },
    {
      accessorKey: "e_tipo_licitacion",
      header: "Tipo Licitación",
      cell: ({ getValue }) => getValue() || "—",
      size: 120,
    },
    {
      accessorKey: "tipo_licitacion_no_veces_descripcion",
      header: "No. Veces",
      cell: ({ getValue }) => getValue() || "—",
      size: 110,
    },
    {
      accessorKey: "servidor_publico_emite",
      header: "Emite",
      cell: ({ getValue }) => getValue() || "—",
      size: 160,
    },
    {
      accessorKey: "e_fecha_y_hora_reunion",
      header: "Fecha Reunión",
      cell: ({ getValue }) => getValue() || "—",
      size: 140,
    },
    {
      accessorKey: "r_estatus",
      header: "Estatus",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            row.original.r_estatus === "PREREGISTRADO"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {row.original.r_estatus}
        </span>
      ),
      size: 120,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <Link href={`/seguimiento-rector/new?id=${row.original.id}`}>
          <Button className="bg-[#235391] hover:bg-[#1e487d] text-white cursor-pointer">Captura</Button>
        </Link>
      ),
      enableSorting: false,
      size: 100,
    },
  ];

  const table = useReactTable({
    data: registros,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const cargarDetalle = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/rector/seguimiento-detalle?p_id=${id}`);
      const data = await res.json();
      setDetalle(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error al cargar detalle:", err);
      setDetalle([]);
    }
  };

  // ===============================
  // 🔹 Cargar preregistrados
  // ===============================
  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/rector/seguimiento-preregistrados`);
      const data = await res.json();
      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data.resultado)
        ? data.resultado
        : [];

      const sorted = lista.sort((a: any, b: any) => b.id - a.id);
      setRegistros(sorted);
    } catch (err) {
      console.error("❌ Error al cargar preregistrados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  // 🔎 Normalizador para búsqueda (quita acentos y homogeneiza a minúsculas)
  const normalize = (v: any) =>
    (v ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const term = normalize(filtro);

  const registrosFiltrados = registros.filter((r) => {
    const haystack = [
      r.id, // ✅ permite buscar por ID
      r.ente,
      r.ente_clasificacion,
      r.id_ente_tipo,
      r.e_oficio_invitacion,
      r.e_tipo_licitacion,
      r.tipo_licitacion_no_veces_descripcion,
      r.servidor_publico_emite,
      r.r_estatus,
    ]
      .map(normalize)
      .join(" ");

    return haystack.includes(term);
  });


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

  // Agrupa detalle por e_id_partida
  const detalleAgrupado = detalle.reduce((acc: Record<string, any>, item) => {
    const key = item.e_id_partida || "sin_partida";
    if (!acc[key]) {
      acc[key] = {
        e_id_partida: item.e_id_partida,
        partida: item.partida,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  // ===============================
  // 🔹 Render
  // ===============================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
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
            <h1 className="text-2xl font-bold text-gray-900">Seguimiento Rector — Preregistrados</h1>
            <p className="text-gray-600 text-sm">
              Listado de procesos preregistrados concluidos por los entes.
            </p>

            {registros.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Mostrando {registros.length} {registros.length === 1 ? "registro" : "registros"}.
              </p>
            )}

          </div>
        </div>

        <div className="flex items-center space-x-3">
          <ActionButtonsGroup
            viewMode={view}
            setViewMode={setView}
            onExport={() => console.log("Exportar CSV (implementación pendiente)")}
            showExport={view === "table"}
            newPath={undefined}
            hideNew
            table={table} // ✅ se pasa la instancia de la tabla para personalizar columnas
          />
        </div>
      </div>

      {/* 🔍 Barra de búsqueda */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por nombre, usuario o tipo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full h-11 text-base"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Cargando registros...</p>
      ) : registrosFiltrados.length === 0 ? (
        <p className="text-center text-gray-600">No hay registros preregistrados.</p>
      ) : view === "table" ? (
        // =======================
        // 📋 VISTA TABLA (TanStack)
        // =======================
        <>
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
                    className={`py-2 px-3 text-xs font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 ${
                      header.column.getCanSort() ? "select-none hover:bg-gray-100" : ""
                    }`}
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
                          {header.column.getIsSorted() === "asc" && <ChevronUp size={14} />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown size={14} />}
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
                  <TableRow key={row.original.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2 px-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      ) : (
        // =======================
        // 🏛️ VISTA TARJETAS
        // =======================
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {registrosFiltrados.map((r) => (
            <Card key={r.id} className="border shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">
                  {r.ente}
                  <span className="block text-sm text-gray-500">{r.ente_clasificacion}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1 text-gray-700">
                <p><strong>ID:</strong> {r.id}</p>
                <p><strong>Oficio de Invitación:</strong> {r.e_oficio_invitacion || "—"}</p>
                <p><strong>Tipo Licitación:</strong> {r.e_tipo_licitacion}</p>
                <p><strong>No. Veces:</strong> {r.tipo_licitacion_no_veces_descripcion}</p>
                <p><strong>Emite:</strong> {r.servidor_publico_emite}</p>
                <p><strong>Fecha reunión:</strong>{" "}
                  {r.e_fecha_y_hora_reunion
                    ? new Date(r.e_fecha_y_hora_reunion).toLocaleString("es-MX", {
                      dateStyle: "short",
                      timeStyle: "short",
                      hour12: false, // ✅ fuerza formato de 24 horas
                    })
                    : "—"}
                </p>
                <p>
                  <strong>Estatus:</strong>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      r.r_estatus === "PREREGISTRADO"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {r.r_estatus}
                  </span>
                </p>

                <div className="pt-3">
                  <Link href={`/seguimiento-rector/new?id=${r.id}`}>
                    <Button className="w-full bg-[#235391] text-white hover:bg-[#1e487d] cursor-pointer">Captura</Button>
                  </Link>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        onClick={() => cargarDetalle(r.id)}
                        className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300 cursor-pointer mt-2"
                      >
                        Ver detalles
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="max-w-[900px] overflow-x-hidden overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>ID del seguimiento: {detalle[0]?.id || "—"}</SheetTitle>
                        <p className="text-sm text-gray-900 mt-1">
                          <strong>Oficio de Invitación:</strong> {detalle[0]?.e_oficio_invitacion || "—"}
                        </p>
                      </SheetHeader>
                      <div className="mt-4 space-y-4 text-sm text-gray-800">

                        <div className="mt-6 border-t pt-4 space-y-6">
                          <h3 className="font-semibold text-gray-700">Partidas y Rubros registrados</h3>
                          {detalle.length > 0 ? (
                            <Accordion type="single" collapsible className="space-y-4">
                              {Object.values(detalleAgrupado).map(({ e_id_partida, partida, items }) => {
                                // Agrupar items por e_id_rubro
                                const rubrosAgrupados = items.reduce((acc: Record<string, any>, item: any) => {
                                  const key = item.e_id_rubro || "sin_rubro";
                                  if (!acc[key]) {
                                    acc[key] = {
                                      e_id_rubro: item.e_id_rubro,
                                      rubro: item.rubro,
                                      proveedores: [],
                                    };
                                  }
                                  acc[key].proveedores.push(item);
                                  return acc;
                                }, {});

                                return (
                                  <AccordionItem key={e_id_partida || "sin_partida"} value={String(e_id_partida) || "sin_partida"} className="border border-gray-200 rounded-md">
                                    <AccordionTrigger className="px-4 py-2 font-semibold text-gray-800">
                                      {e_id_partida ? `${e_id_partida} — ${partida || "Sin descripción"}` : "Sin partida"}
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 py-2 space-y-4 bg-gray-50">
                                      {Object.values(rubrosAgrupados).map(({ e_id_rubro, rubro, proveedores }: any) => (
                                        <div key={e_id_rubro || "sin_rubro"} className="border border-gray-300 rounded-md p-3 bg-white space-y-3">
                                          <p className="font-semibold text-gray-800 border-b border-gray-200 pb-1">
                                            {e_id_rubro ? `${e_id_rubro} — ${rubro || "Sin nombre"}` : "Sin rubro"}
                                          </p>
                                          <div className="space-y-2">
                                            {proveedores.map((prov: any, i: number) => (
                                              <div key={i} className="border border-gray-200 rounded-md p-2 flex flex-col bg-gray-50">
                                                {/* Proveedores participantes */}
                                                {prov.e_rfc_proveedor && (
                                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 pb-2 mb-2">
                                                    <p className="text-sm font-medium text-gray-700">
                                                      Proveedor participante: <span className="font-semibold">{prov.e_rfc_proveedor}</span>
                                                    </p>
                                                    <div className="flex gap-4 text-sm text-gray-600 mt-1 sm:mt-0">
                                                      <p><strong>Monto sin IVA:</strong> {formatMXN(prov.e_importe_sin_iva)}</p>
                                                      <p><strong>Monto Total:</strong> {formatMXN(prov.e_importe_total)}</p>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Proveedor adjudicado */}
                                                {prov.r_rfc_proveedor_adjudicado && (
                                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-green-50 p-2 rounded-md">
                                                    <p className="text-sm font-medium text-green-700">
                                                      ✅ Adjudicado: <span className="font-semibold">{prov.r_rfc_proveedor_adjudicado}</span>
                                                    </p>
                                                    <div className="flex gap-4 text-sm text-green-700 mt-1 sm:mt-0">
                                                      <p><strong>Monto sin IVA:</strong> {formatMXN(prov.r_importe_ajustado_sin_iva)}</p>
                                                      <p><strong>Monto Total:</strong> {formatMXN(prov.r_importe_ajustado_total)}</p>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          ) : (
                            <p className="text-gray-500 mt-2">No hay partidas registradas.</p>
                          )}
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    {/* Regla global para el cursor pointer en el botón de cierre del Sheet */}
    <style jsx global>{`
      .fixed[data-state="open"] > button {
        cursor: pointer !important;
      }
    `}</style>
    </main>
  );
}