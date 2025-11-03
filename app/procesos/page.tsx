"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
        <Loader2 className="w-3 h-3 animate-spin" /> Pendiente
      </span>
    );

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
        </div>
      </div>

      {/* Table header row */}
      <div className="hidden md:grid grid-cols-3 border-b border-gray-200 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-600 rounded-t-md">
        <div>ID</div>
        <div>Oficio de invitación</div>
        <div>Ente</div>
      </div>
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
    </main>
  );
}