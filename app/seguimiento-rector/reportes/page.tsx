"use client";

import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [registros, setRegistros] = useState<Adjudicado[]>([]);
  const [registrosOriginales, setRegistrosOriginales] = useState<Adjudicado[]>([]);
  const [filtro, setFiltro] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);
  // Eliminar fechaInicio y fechaFin, usar dateRange
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [idEnte, setIdEnte] = useState("-99");

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

  // 🔍 Filtro simple
  const normalize = (v: any) =>
    (v ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  const term = normalize(filtro);

  const registrosFiltrados = registros.filter((r) =>
    [
      r.ente,
      r.ente_clasificacion,
      r.e_tipo_licitacion,
      r.rubro,
      r.rfc,
      r.razon_social,
      r.nombre_comercial,
      r.fundamento,
    ]
      .map(normalize)
      .join(" ")
      .includes(term)
  );

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
      r.e_tipo_licitacion ?? "",
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
      r.e_tipo_licitacion ?? "",
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


  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center w-10 h-10 rounded-lg shadow-md bg-white hover:bg-gray-100 transition cursor-pointer"
              aria-label="Volver al dashboard"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Adjudicaciones</h1>
          </div>
          <p className="text-gray-600 text-sm ml-[52px]">
            Listado de procesos con proveedor adjudicado.
          </p>
          {registros.length > 0 && (
            <p className="text-sm text-gray-500 mt-1 ml-[52px]">
              Mostrando {registros.length} {registros.length === 1 ? "registro" : "registros"}.
            </p>
          )}
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="cards">🏛️ Tarjetas</TabsTrigger>
            <TabsTrigger value="table">📋 Tabla</TabsTrigger>
          </TabsList>
        </Tabs>
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

      {/* Barra de búsqueda */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por ente, proveedor o rubro..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full h-11 text-base"
        />
      </div>

      {/* Contenido */}
      {loading ? (
        <p className="text-center text-gray-500">Cargando adjudicaciones...</p>
      ) : registrosFiltrados.length === 0 ? (
        <p className="text-center text-gray-600">No hay adjudicaciones en este rango.</p>
      ) : view === "table" ? (
        // 📋 Vista Tabla
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ente</TableHead>
              <TableHead>Fundamento</TableHead>
              <TableHead>Estatus general</TableHead>
              <TableHead>Fecha de emisión</TableHead>
              <TableHead>Oficio de invitación</TableHead>
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
            {registrosFiltrados.map((r) => (
              <TableRow key={`${r.id}-${r.rubro}-${r.rfc}`}>
                <TableCell>{r.ente}</TableCell>
                <TableCell>
                  {r.fundamento}
                  {r.fundamiento_clasificacion ? ` (${r.fundamiento_clasificacion})` : ""}
                </TableCell>
                <TableCell>{r.estatus || r.rubro_estatus || "—"}</TableCell>
                <TableCell>{r.r_fecha_emision}</TableCell>
                <TableCell>{r.e_oficio_invitacion ?? "—"}</TableCell>
                <TableCell>{r.e_id_partida ?? ""}</TableCell>
                <TableCell>{`${r.id_rubro ?? ""} - ${r.rubro}`}</TableCell>
                <TableCell>
                  {formatCurrency(r.e_monto_presupuesto_suficiencia)}
                </TableCell>
                <TableCell>{r.ramo ?? ""}</TableCell>
                <TableCell>
                  {formatCurrency(r.importe_ajustado_total)}
                </TableCell>
                <TableCell>{`${r.rfc} — ${r.razon_social ?? ""}`}</TableCell>
                <TableCell>{r.observaciones ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // 🏛️ Vista Tarjetas agrupadas por seguimiento
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grupos.map((grupo) => {
            // Tomar el primer registro para encabezados generales
            const encabezado = grupo.registros[0];
            return (
              <Card key={grupo.id} className="border shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    {encabezado.ente}
                    <span className="block text-sm text-gray-500">{encabezado.ente_clasificacion}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-gray-700">
                  <p>
                    <strong>Fundamento:</strong> {encabezado.fundamento}
                    {encabezado.fundamiento_clasificacion ? ` (${encabezado.fundamiento_clasificacion})` : ""}
                  </p>
                  <p>
                    <strong>Modalidad de contratación:</strong> {encabezado.e_tipo_licitacion}
                  </p>
                  <p><strong>Oficio de invitación:</strong> {encabezado.e_oficio_invitacion ?? "—"}</p>
                  <p>
                    <strong>Fecha de emisión:</strong> {encabezado.r_fecha_emision}
                  </p>
                  {/* Tabla de rubros/proveedores de este seguimiento */}
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
                  <Button
                    className="w-full mt-2 bg-[#235391] hover:bg-[#1e487d] text-white"
                    onClick={() => handleExportSinglePDF(grupo)}
                  >
                    Guardar .PDF
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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