"use client";

import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, List, LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

// TanStack Table imports
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

import { ChevronUp, ChevronDown } from "lucide-react";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type Adjudicado = {
  id: number;
  id_rubro?: string;
  ente: string;
  ente_clasificacion: string;
  e_tipo_licitacion: string;
  modalidad_contratacion?: string;
  rubro: string;
  rfc: string;
  razon_social: string;
  importe_ajustado_sin_iva: number;
  importe_ajustado_total: number;
  fundamento: string;
  fundamiento_clasificacion?: string;
  r_fecha_emision: string;
  estatus?: string;
  rubro_estatus?: string; // ✅ Nuevo campo opcional
  e_id_partida?: string;
  e_monto_presupuesto_suficiencia?: number;
  f_financiamiento?: string;
  ramo?: string;
  observaciones?: string;
  nombre_comercial?: string;
  e_oficio_invitacion?: string;
};

export default function AdjudicadosPage() {
  // TanStack Table sorting state
  const [sorting, setSorting] = useState<SortingState>([]);
  // 📌 Estados necesarios para la barra de búsqueda por campo
  const [filterField, setFilterField] = useState("all");
  const [search, setSearch] = useState("");

  // Column definitions for TanStack Table
  const columns = React.useMemo<ColumnDef<Adjudicado>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: info => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: "ente",
        header: "Ente",
        cell: info => info.getValue(),
        enableSorting: true,
      },
      {
        accessorKey: "fundamento",
        header: "Fundamento",
        cell: info => {
          const row = info.row.original;
          return (
            <>
              {row.fundamento}
              {row.fundamiento_clasificacion ? ` (${row.fundamiento_clasificacion})` : ""}
            </>
          );
        },
        enableSorting: true,
      },
      {
        accessorKey: "modalidad_contratacion",
        header: "Modalidad de contratación",
        cell: info => info.row.original.modalidad_contratacion ?? info.row.original.e_tipo_licitacion ?? "—",
        enableSorting: true,
      },
      {
        accessorKey: "estatus",
        header: "Estatus general",
        cell: info => {
          const row = info.row.original;
          return row.estatus || row.rubro_estatus || "—";
        },
        enableSorting: true,
        sortingFn: (a, b) => {
          // Simple localeCompare for estatus/rubro_estatus
          const valA = a.original.estatus || a.original.rubro_estatus || "";
          const valB = b.original.estatus || b.original.rubro_estatus || "";
          return valA.localeCompare(valB);
        },
      },
      {
        accessorKey: "r_fecha_emision",
        header: "Fecha de emisión",
        cell: info => info.getValue(),
        enableSorting: true,
        sortingFn: (a, b) => {
          // Compare as timestamps (date)
          return new Date(a.original.r_fecha_emision).getTime() - new Date(b.original.r_fecha_emision).getTime();
        },
      },
      {
        accessorKey: "e_oficio_invitacion",
        header: "Oficio de invitación",
        cell: info => info.row.original.e_oficio_invitacion ?? "—",
        enableSorting: true,
      },
      {
        accessorKey: "e_id_partida",
        header: "Partida",
        cell: info => info.row.original.e_id_partida ?? "",
        enableSorting: true,
      },
      {
        accessorKey: "rubro",
        header: "Rubro",
        cell: info => {
          const row = info.row.original;
          return `${row.id_rubro ?? ""} - ${row.rubro}`;
        },
        enableSorting: true,
        sortingFn: (a, b) => {
          const aStr = `${a.original.id_rubro ?? ""} - ${a.original.rubro}`;
          const bStr = `${b.original.id_rubro ?? ""} - ${b.original.rubro}`;
          return aStr.localeCompare(bStr);
        },
      },
      {
        accessorKey: "e_monto_presupuesto_suficiencia",
        header: "Monto del rubro",
        cell: info => formatCurrency(info.row.original.e_monto_presupuesto_suficiencia),
        enableSorting: true,
        sortingFn: (a, b) => {
          return (a.original.e_monto_presupuesto_suficiencia ?? 0) - (b.original.e_monto_presupuesto_suficiencia ?? 0);
        },
      },
      {
        accessorKey: "ramo",
        header: "Fuente de financiamiento",
        cell: info => info.row.original.ramo ?? "",
        enableSorting: true,
      },
      {
        accessorKey: "importe_ajustado_total",
        header: "Importe con IVA",
        cell: info => formatCurrency(info.row.original.importe_ajustado_total),
        enableSorting: true,
        sortingFn: (a, b) => {
          return (a.original.importe_ajustado_total ?? 0) - (b.original.importe_ajustado_total ?? 0);
        },
      },
      {
        accessorKey: "adjudicado",
        header: "Adjudicado",
        cell: info => {
          const row = info.row.original;
          return `${row.rfc} — ${row.razon_social ?? ""}`;
        },
        enableSorting: true,
      },
      {
        accessorKey: "observaciones",
        header: "Observaciones",
        cell: info => info.row.original.observaciones ?? "",
        enableSorting: true,
      },
    ],
    []
  );

  // Estados principales (registros, originales)
  const [registros, setRegistros] = useState<Adjudicado[]>([]);
  const [registrosOriginales, setRegistrosOriginales] = useState<Adjudicado[]>([]);

  // 🔍 Filtro simple (ahora usando useMemo)
  const registrosFiltrados = React.useMemo(() => {
    const normalize = (v: any) =>
      (v ?? "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const term = normalize(search);

    if (filterField === "all") {
      return registros.filter((r) =>
        [
          r.id,
          r.ente,
          r.e_oficio_invitacion,
          r.e_tipo_licitacion,
          r.modalidad_contratacion,
          r.rubro,
          r.rfc,
          r.razon_social,
          r.fundamento,
          r.estatus,
          r.rubro_estatus,
          r.observaciones,
        ]
          .map(normalize)
          .join(" ")
          .includes(term)
      );
    }

    return registros.filter((r) => {
      const value = normalize((r as any)[filterField]);
      return value.includes(term);
    });
  }, [registros, search, filterField]);

    // ✅ Memorizar solo los datos y columnas, no el hook completo
    const memoData = React.useMemo(() => registrosFiltrados, [registrosFiltrados]);
    const memoColumns = React.useMemo(() => columns, [columns]);

    // ✅ Crear instancia de TanStack Table al nivel superior (no dentro de otro hook)
    const table = useReactTable({
      data: memoData,
      columns: memoColumns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      manualSorting: false,
    });
  // Utilidad para formato de moneda
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null || isNaN(value)) return "";
    const formatted = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return formatted.replace(/\s/g, ""); // elimina espacios entre el símbolo y la cantidad
  };
  const router = useRouter();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);
  // Eliminar fechaInicio y fechaFin, usar dateRange
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [idEnte, setIdEnte] = useState("-99");
  // ✅ Control de montaje seguro para evitar render antes del DOM
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => setIsMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // 🔹 Cargar adjudicados desde el backend
  const cargarAdjudicados = async () => {
    try {
      setLoading(true);
      // Si el usuario es rector, fuerza a traer todos los entes
      const enteFinal = typeof window !== "undefined" && localStorage.getItem("userTipo")?.toLowerCase() === "rector"
        ? "-99"
        : idEnte;
      const params = new URLSearchParams({
        p_id_ente: enteFinal,
        p_fecha1: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "-99",
        p_fecha2: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "-99",
      });
      const res = await fetch(`${API_BASE}/rector/seguimiento-adjudicado?${params.toString()}`);
      const data = await res.json();

      // ✅ Normalizar para asegurar compatibilidad de campos
      const normalizados = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            id_rubro: item.id_rubro || item.e_id_rubro || item.rubro_id || item.id || "",
          }))
        : [];

      const ordenados = normalizados.sort(
        (a, b) => new Date(b.r_fecha_emision).getTime() - new Date(a.r_fecha_emision).getTime()
      );
      setRegistros(ordenados);
      setRegistrosOriginales(ordenados);
    } catch (error) {
      console.error("❌ Error al cargar adjudicados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAdjudicados();
  }, []);


  // Agrupar registros por ID de seguimiento
  // Asumimos que el campo 'id' es el identificador de seguimiento (si no, ajustar)
  type AdjudicadoGroup = {
    id: number;
    registros: Adjudicado[];
  };
  const grupos: AdjudicadoGroup[] = React.useMemo(() => {
    const map = new Map<number, Adjudicado[]>();
    for (const r of registrosFiltrados) {
      if (!map.has(r.id)) map.set(r.id, []);
      map.get(r.id)!.push(r);
    }
    return Array.from(map.entries()).map(([id, registros]) => ({ id, registros }));
  }, [registrosFiltrados]);

  // Exportar PDF de un grupo completo
  const handleExportSinglePDF = (grupo: AdjudicadoGroup) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a2" });
    const logo = "/tabasco-logo.png";
    doc.addImage(logo, "PNG", 20, 10, 60, 25);
    doc.setFontSize(20);
    doc.text("GOBIERNO DEL ESTADO DE TABASCO", 150, 25, { align: "center" });
    doc.setFontSize(14);
    doc.text("INFORME DE ADJUDICACIÓN - SEGUIMIENTO", 150, 35, { align: "center" });

    // Encabezados
    const head = [[
      "DEPENDENCIA, ÓRGANO O ENTIDAD",
      "FUNDAMENTO",
      "MODALIDAD DE CONTRATACIÓN",
      "FECHA DE EJECUCIÓN",
      "PARTIDA PRESUPUESTAL",
      "RUBRO",
      "SUFICIENCIA PRESUPUESTAL POR RUBRO",
      "FUENTE DE FINANCIAMIENTO",
      "MONTO DE ADJUDICACIÓN CON IVA",
      "PROVEEDOR ADJUDICADO",
      "OBSERVACIONES",
    ]];
    const body = grupo.registros.map((r) => [
      r.ente ?? "",
      r.fundamento ?? "",
      r.modalidad_contratacion ?? r.e_tipo_licitacion ?? "",
      r.r_fecha_emision ?? "",
      r.e_id_partida ?? "",
      `${r.id_rubro ?? ""} - ${r.rubro}`,
      formatCurrency(r.e_monto_presupuesto_suficiencia),
      r.ramo ?? "",
      formatCurrency(r.importe_ajustado_total),
      `${r.rfc ?? ""} — ${r.razon_social ?? ""}`,
      r.observaciones ?? "",
    ]);
    autoTable(doc, {
      startY: 45,
      head,
      body,
      styles: {
        fontSize: 15,
        halign: "center",
        valign: "middle",
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [153, 20, 71],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 },
        4: { cellWidth: 50 },
        5: { cellWidth: 55 },
        6: { cellWidth: 50 },
        7: { cellWidth: 55 },
        8: { cellWidth: 50 },
        9: { cellWidth: 55 },
        10: { cellWidth: 55 },
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(
          "Fuente: Sistema de Seguimiento Rector | Secretaría de Administración e Innovación Gubernamental",
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });
    doc.save(`reporte_adjudicacion_seguimiento_${grupo.id}.pdf`);
  };

  // Exportar todos los registros filtrados a un solo PDF (formato institucional)
  const handleExportAllPDF = () => {
    if (!registrosFiltrados.length) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a2" });
    const logo = "/tabasco-logo.png";
    doc.addImage(logo, "PNG", 20, 10, 60, 25);
    doc.setFontSize(20);
    doc.text("GOBIERNO DEL ESTADO DE TABASCO", 150, 25, { align: "center" });
    doc.setFontSize(14);
    doc.text("INFORME DE ADJUDICACIONES", 150, 35, { align: "center" });
    const head = [[
      "DEPENDENCIA, ÓRGANO O ENTIDAD",
      "FUNDAMENTO",
      "MODALIDAD DE CONTRATACIÓN",
      "FECHA DE EJECUCIÓN",
      "PARTIDA PRESUPUESTAL",
      "RUBRO",
      "SUFICIENCIA PRESUPUESTAL POR RUBRO",
      "FUENTE DE FINANCIAMIENTO",
      "MONTO DE ADJUDICACIÓN CON IVA",
      "PROVEEDOR ADJUDICADO",
      "OBSERVACIONES",
    ]];
    const body = registrosFiltrados.map((r) => [
      r.ente ?? "",
      r.fundamento ?? "",
      r.modalidad_contratacion ?? r.e_tipo_licitacion ?? "",
      r.r_fecha_emision ?? "",
      r.e_id_partida ?? "",
      `${r.id_rubro ?? ""} - ${r.rubro}`,
      formatCurrency(r.e_monto_presupuesto_suficiencia),
      r.ramo ?? "",
      formatCurrency(r.importe_ajustado_total),
      `${r.rfc ?? ""} — ${r.razon_social ?? ""}`,
      r.observaciones ?? "",
    ]);
    autoTable(doc, {
      startY: 45,
      head,
      body,
      styles: {
        fontSize: 15,
        halign: "center",
        valign: "middle",
        cellPadding: 4,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [153, 20, 71],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 },
        4: { cellWidth: 50 },
        5: { cellWidth: 55 },
        6: { cellWidth: 50 },
        7: { cellWidth: 55 },
        8: { cellWidth: 50 },
        9: { cellWidth: 55 },
        10: { cellWidth: 55 },
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(
          "Fuente: Sistema de Seguimiento Rector | Secretaría de Administración e Innovación Gubernamental",
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });
    doc.save("reporte_adjudicaciones.pdf");
  };

  if (!isMounted) {
    return (
      <main className="w-full p-6 space-y-6 bg-white min-h-screen">
        <p className="text-center text-gray-500">Cargando vista...</p>
      </main>
    );
  }

  return (
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
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
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Adjudicaciones</h1>
          </div>
          <p className="text-gray-600 text-sm ml-[52px]">
            Listado de procesos con proveedor adjudicado.
          </p>
          {registrosFiltrados.length > 0 && (
            <p className="text-muted-foreground text-sm ml-[52px]">
              {search.trim() === "" ? (
                <>
                  <span className="font-bold">{registrosFiltrados.length}</span> registro
                  {registrosFiltrados.length !== 1 && "s"}.
                </>
              ) : (
                <>
                  <span className="font-bold">{registrosFiltrados.length}</span> registro
                  {registrosFiltrados.length !== 1 && "s"} de{" "}
                  <span className="font-bold">{registrosOriginales.length}</span>.
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ActionButtonsGroup
            viewMode={view}
            setViewMode={setView}
            onExport={() => console.log("Exportar CSV (implementación pendiente)")}
            showExport={view === "table"}
            newPath={undefined}
            hideNew
            table={table}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[300px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                <span>Seleccionar rango de fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={es}
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3">
          <Button
            className="bg-[#235391] hover:bg-[#1e487d] text-white w-full sm:w-[150px]"
            onClick={() => {
              if (!dateRange?.from && !dateRange?.to) {
                setRegistros(registrosOriginales);
                return;
              }

              const filtrados = registrosOriginales.filter((r) => {
                if (!r.r_fecha_emision) return false;

                // 🔹 Crear fecha local sin conversión UTC
                const [year, month, day] = r.r_fecha_emision.split("-").map(Number);
                const fecha = new Date(year, month - 1, day);

                const desdeLocal = dateRange.from
                  ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate())
                  : null;
                const hastaLocal = dateRange.to
                  ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999)
                  : null;

                if (desdeLocal && fecha < desdeLocal) return false;
                if (hastaLocal && fecha > hastaLocal) return false;
                return true;
              });

              setRegistros(filtrados);
            }}
          >
            Filtrar
          </Button>

          {dateRange?.from && (
            <Button
              variant="outline"
              className="text-[#991447] border-[#991447] hover:bg-[#fbeff2] w-full sm:w-[150px]"
              onClick={() => {
                setDateRange(undefined);
                setRegistros(registrosOriginales);
              }}
            >
              Eliminar filtro
            </Button>
          )}
          {/* Botón Exportar todo en PDF (ahora junto a los filtros) */}
          <Button
            className="bg-[#991447] hover:bg-[#7a1040] text-white font-semibold px-6 py-2"
            onClick={handleExportAllPDF}
          >
            Exportar todo en PDF
          </Button>
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
          <option value="ente">Ente</option>
          <option value="e_oficio_invitacion">Oficio de invitación</option>
          <option value="fundamento">Fundamento</option>
          <option value="modalidad_contratacion">Modalidad de contratación</option>
          <option value="estatus">Estatus</option>
          <option value="r_fecha_emision">Fecha de emisión</option>
          <option value="e_id_partida">Partida</option>
          <option value="rubro">Rubro</option>
          <option value="e_monto_presupuesto_suficiencia">Monto del rubro</option>
          <option value="ramo">Fuente de financiamiento</option>
          <option value="importe_ajustado_total">Importe con IVA</option>
          <option value="observaciones">Observaciones</option>
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
              setRegistros(registrosOriginales);
            }}
            className="whitespace-nowrap"
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-center text-gray-500">Cargando adjudicaciones...</p>
      ) : registrosFiltrados.length === 0 ? (
        <p className="text-center text-gray-600">No hay adjudicaciones en este rango.</p>
      ) : (
        <div>
          {/* 📋 Vista Tabla */}
          <div className={view === "table" ? "block" : "hidden"}>
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
                          style={{
                            cursor: header.column.getCanSort() ? "pointer" : undefined,
                            userSelect: "none",
                          }}
                          className={header.column.getCanSort() ? "hover:bg-gray-100 select-none" : ""}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {isSorted === "asc" && <ChevronUp size={16} className="inline ml-1" />}
                            {isSorted === "desc" && <ChevronDown size={16} className="inline ml-1" />}
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 🏛️ Vista Tarjetas */}
          <div className={view === "cards" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "hidden"}>
            {grupos.map((grupo) => {
              const encabezado = grupo.registros[0];
              return (
                <Card
                  key={grupo.id}
                  className="border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-gray-800">
                      {encabezado.ente}
                      <span className="block text-sm text-gray-500">{encabezado.ente_clasificacion}</span>
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">ID: {grupo.id}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 text-sm space-y-2 text-gray-700">
                    <div className="flex-1">
                      <p><strong>Oficio de invitación:</strong> {encabezado.e_oficio_invitacion ?? "—"}</p>
                      <p><strong>Fecha de emisión:</strong> {encabezado.r_fecha_emision}</p>
                      <p>
                        <strong>Fundamento:</strong> {encabezado.fundamento}
                        {encabezado.fundamiento_clasificacion ? ` (${encabezado.fundamiento_clasificacion})` : ""}
                      </p>
                      <p>
                        <strong>Modalidad de contratación:</strong> {encabezado.modalidad_contratacion ?? encabezado.e_tipo_licitacion ?? "—"}
                      </p>
                      <div className="overflow-x-auto mt-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Estatus</TableHead>
                              <TableHead>Partida</TableHead>
                              <TableHead>Rubro</TableHead>
                              <TableHead>Monto del rubro</TableHead>
                              <TableHead>Fuente de financiamiento</TableHead>
                              <TableHead>Importe con IVA</TableHead>
                              <TableHead>Adjudicado</TableHead>
                              <TableHead>Observaciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grupo.registros.map((r) => (
                              <TableRow key={`${r.id}-${r.id_rubro}-${r.rfc}`}>
                                <TableCell>{r.estatus || r.rubro_estatus || "—"}</TableCell>
                                <TableCell>{r.e_id_partida ?? ""}</TableCell>
                                <TableCell>{`${r.id_rubro ?? ""} - ${r.rubro}`}</TableCell>
                                <TableCell>{formatCurrency(r.e_monto_presupuesto_suficiencia)}</TableCell>
                                <TableCell>{r.ramo ?? ""}</TableCell>
                                <TableCell>{formatCurrency(r.importe_ajustado_total)}</TableCell>
                                <TableCell>{`${r.rfc} — ${r.razon_social ?? ""}`}</TableCell>
                                <TableCell>{r.observaciones ?? ""}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <Button
                        className="w-full bg-[#235391] hover:bg-[#1e487d] text-white"
                        onClick={() => handleExportSinglePDF(grupo)}
                      >
                        Guardar .PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Cursor para cierre del dialog */}
      <style jsx global>{`
        .fixed[data-state="open"] > button {
          cursor: pointer !important;
        }
      `}</style>
    </main>
  );
}