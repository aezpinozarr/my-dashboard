"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  ente: string;
  ente_clasificacion: string;
  e_tipo_licitacion: string;
  rubro: string;
  rfc: string;
  razon_social: string;
  importe_ajustado_sin_iva: number;
  importe_ajustado_total: number;
  fundamento: string;
  fundamiento_clasificacion: string;
  r_fecha_emision: string;
  estatus?: string;
  e_id_partida?: string;
  e_monto_presupuesto_suficiencia?: number;
  f_financiamiento?: string;
  observaciones?: string;
};

export default function AdjudicadosPage() {
  const router = useRouter();
  const [registros, setRegistros] = useState<Adjudicado[]>([]);
  const [filtro, setFiltro] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [idEnte, setIdEnte] = useState("-99");

  // 🔹 Cargar adjudicados desde el backend
  const cargarAdjudicados = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        p_id_ente: idEnte,
        p_fecha1: fechaInicio || "-99",
        p_fecha2: fechaFin || "-99",
      });
      const res = await fetch(`${API_BASE}/rector/seguimiento-adjudicado?${params.toString()}`);
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error al cargar adjudicados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAdjudicados();
  }, []);

  // Export individual PDF (nuevo formato tipo tabla Excel)
  const handleExportSinglePDF = (r: Adjudicado) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a2" });

    // Encabezado institucional
    doc.setFontSize(18);
    doc.text("GOBIERNO DEL ESTADO DE TABASCO", 20, 20);
    doc.setFontSize(14);
    doc.text("INFORME DE ADJUDICACIÓN INDIVIDUAL", 20, 30);

    // Encabezados tipo tabla institucional
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
      "OBSERVACIONES"
    ]];

    const body = [[
      r.ente ?? "",
      r.fundamento ?? "",
      r.e_tipo_licitacion ?? "",
      r.r_fecha_emision ?? "",
      r.e_id_partida ?? "",
      r.rubro ?? "",
      r.e_monto_presupuesto_suficiencia !== undefined
        ? `$${r.e_monto_presupuesto_suficiencia.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
        : "",
      r.f_financiamiento ?? "",
      r.importe_ajustado_total !== undefined
        ? `$${r.importe_ajustado_total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
        : "",
      r.razon_social ?? "",
      r.observaciones ?? "",
    ]];

    autoTable(doc, {
      startY: 40,
      head,
      body,
      styles: {
        fontSize: 15,
        halign: "center",
        valign: "middle",
        cellPadding: 4,
        overflow: "linebreak",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [198, 207, 231],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 55 }, // Ente
        1: { cellWidth: 50 }, // Fundamento
        2: { cellWidth: 46 }, // Modalidad
        3: { cellWidth: 40 }, // Fecha
        4: { cellWidth: 45 }, // Partida
        5: { cellWidth: 55 }, // Rubro
        6: { cellWidth: 50 }, // Suficiencia
        7: { cellWidth: 50 }, // Financiamiento
        8: { cellWidth: 50 }, // Monto con IVA
        9: { cellWidth: 55 }, // Proveedor
        10: { cellWidth: 55 }, // Observaciones
      },
      margin: { left: 15, right: 15 },
      tableWidth: "auto",
      pageBreak: "auto",
      didDrawPage: (data) => {
        doc.setFontSize(10);
        doc.text(
          "Fuente: Sistema de Seguimiento Rector | Secretaría de Administración e Innovación Gubernamental",
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`reporte_adjudicacion_${r.id}.pdf`);
  };

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
      <div className="grid sm:grid-cols-3 gap-4">
        <Input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          placeholder="Fecha inicio"
        />
        <Input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          placeholder="Fecha fin"
        />
        <Button
          className="bg-[#235391] hover:bg-[#1e487d] text-white"
          onClick={cargarAdjudicados}
        >
          Filtrar
        </Button>
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
              <TableHead>Partida</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead>Monto del rubro</TableHead>
              <TableHead>Fuente de financiamiento</TableHead>
              <TableHead>Importe con IVA</TableHead>
              <TableHead>Proveedor adjudicado</TableHead>
              <TableHead>Observaciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrosFiltrados.map((r) => (
              <TableRow key={`${r.id}-${r.rubro}-${r.rfc}`}>
                <TableCell>{r.ente}</TableCell>
                <TableCell>{r.fundamento}</TableCell>
                <TableCell>{r.estatus ?? ""}</TableCell>
                <TableCell>{r.r_fecha_emision}</TableCell>
                <TableCell>{r.e_id_partida ?? ""}</TableCell>
                <TableCell>{r.rubro}</TableCell>
                <TableCell>
                  {r.e_monto_presupuesto_suficiencia !== undefined
                    ? `$${r.e_monto_presupuesto_suficiencia.toLocaleString("es-MX")}`
                    : ""}
                </TableCell>
                <TableCell>{r.f_financiamiento ?? ""}</TableCell>
                <TableCell>
                  {r.importe_ajustado_total !== undefined
                    ? `$${r.importe_ajustado_total.toLocaleString("es-MX")}`
                    : ""}
                </TableCell>
                <TableCell>{r.rfc}</TableCell>
                <TableCell>{r.observaciones ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // 🏛️ Vista Tarjetas
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {registrosFiltrados.map((r) => (
            <Card key={`${r.id}-${r.rubro}-${r.rfc}`} className="border shadow-sm hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">
                  {r.ente}
                  <span className="block text-sm text-gray-500">{r.ente_clasificacion}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2 text-gray-700">
                <p><strong>Fundamento:</strong> {r.fundamento}</p>
                <p><strong>Estatus general:</strong> {r.estatus ?? ""}</p>
                <p><strong>Fecha de emisión:</strong> {r.r_fecha_emision}</p>
                <p><strong>Partida:</strong> {r.e_id_partida ?? ""}</p>
                <p><strong>Rubro:</strong> {r.rubro}</p>
                <p><strong>Monto del rubro:</strong> {r.e_monto_presupuesto_suficiencia !== undefined ? `$${r.e_monto_presupuesto_suficiencia.toLocaleString("es-MX")}` : ""}</p>
                <p><strong>Fuente de financiamiento:</strong> {r.f_financiamiento ?? ""}</p>
                <p><strong>Importe con IVA:</strong> {r.importe_ajustado_total !== undefined ? `$${r.importe_ajustado_total.toLocaleString("es-MX")}` : ""}</p>
                <p><strong>Proveedor adjudicado:</strong> {r.rfc}</p>
                <p><strong>Observaciones:</strong> {r.observaciones ?? ""}</p>
                <Button
                  className="w-full mt-2 bg-[#235391] hover:bg-[#1e487d] text-white"
                  onClick={() => handleExportSinglePDF(r)}
                >
                  Guardar .PDF
                </Button>
              </CardContent>
            </Card>
          ))}
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