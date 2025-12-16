"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

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
interface Calendario {
  id: number;
  ente: string;
  presidente: string | null;
  cargo_presidente: string | null;
  acuerdo: string | null;
  tipo_evento: string | null;
  tipo_licitacion: string | null;
  numero_sesion: string | null;
  usuario_registra: string | null;

  fechas?: CalendarioFecha[];
  fuentes?: CalendarioFuente[];
}

interface CalendarioFecha {
  fecha: string;
  hora: string;
}

interface CalendarioFuente {
  fuente: string;
  monto: string | number | null;
}

// ------------------------ PÁGINA PRINCIPAL ------------------------
export default function CalendarioConsultaPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<Calendario[]>([]);
  const [originalData, setOriginalData] = useState<Calendario[]>([]);

  const [openRow, setOpenRow] = useState<Record<number, boolean>>({});
  const [openSections, setOpenSections] = useState<
    Record<number, { fechas: boolean; fuentes: boolean }>
  >({});

  const [search, setSearch] = useState("");

  // ------------------------ FETCH INICIAL ------------------------
  const fetchAll = async () => {
    setLoading(true);

    try {
      // 1️⃣ --- Calendarios ---
      const urlCalendarios =
        user?.tipo === "ENTE"
          ? `${API_BASE}/procesos/calendario/consultar?p_id_ente=${user.id_ente}`
          : `${API_BASE}/procesos/calendario/consultar`;

      const res = await fetch(urlCalendarios);
      const json = await res.json();
      const calendarios = json?.calendario || [];

      // Normalizamos a nuestro modelo visual
    const normalized: Calendario[] = calendarios.map((row: any) => ({
    id: row.id,
    ente: row.ente ?? "—",
    presidente: row.servidor_publico ?? "—",
    cargo_presidente: row.servidor_publico_cargo ?? "—",
    acuerdo: row.acuerdo_o_numero_licitacion ?? "—",
    tipo_evento: row.tipo_evento ?? "—",
    tipo_licitacion: row.tipo_licitacion ?? "—",
    numero_sesion: row.tipo_licitacion_no_veces ?? "—",
    usuario_registra: row.id_usuario_registra ?? "—",
    fechas: [],
    fuentes: [],
    }));

      // 2️⃣ --- Fechas de cada calendario ---
      for (const cal of normalized) {
        const resF = await fetch(
          `${API_BASE}/procesos/calendario/fechas?p_id_calendario=${cal.id}`
        );
        const jsonF = await resF.json();
        cal.fechas = jsonF.calendario_fechas ?? [];
      }

      // 3️⃣ --- Fuentes de financiamiento ---
      for (const cal of normalized) {
        const resFF = await fetch(
          `${API_BASE}/procesos/calendario/fuentes-financiamiento?p_id_calendario=${cal.id}`
        );
        const jsonFF = await resFF.json();
        cal.fuentes = jsonFF.calendario_fuentes_financiamiento ?? [];
      }

      setData(normalized);
      setOriginalData(normalized);
    } catch (error) {
      console.error("❌ Error cargando calendario:", error);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  // ------------------------ BUSCADOR ------------------------
  useEffect(() => {
    if (search.trim() === "") return setData(originalData);

    const lower = search.toLowerCase();
    const filtered = originalData.filter((item) =>
      Object.values(item).some((v) =>
        String(v ?? "").toLowerCase().includes(lower)
      )
    );
    setData(filtered);
  }, [search, originalData]);

  // ------------------------ UI LOADING ------------------------
  if (loading) {
    return (
      <main className="w-full p-6 space-y-6 bg-white min-h-screen">
        <CardHeader>
          <CardTitle>Cargando calendario…</CardTitle>
        </CardHeader>
        <Skeleton className="w-full h-10" />
        <Skeleton className="w-full h-10" />
      </main>
    );
  }

  // ------------------------ RENDER PRINCIPAL ------------------------
  return (
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      {/* ------------------- HEADER ------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-gray-600 text-sm">
            Consulta los registros creados por tu ente.
          </p>

          {data.length > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              {data.length} registro{data.length !== 1 && "s"}
            </p>
          )}
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={fetchAll}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition"
              >
                <RotateCcw className="h-4 w-4 text-gray-700" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Refrescar</TooltipContent>
          </Tooltip>
          <Tooltip />
        </TooltipProvider>
      </div>

      {/* ------------------- BUSCADOR ------------------- */}
      <div className="w-full mt-2 flex gap-2 items-center">
        <Input
          type="text"
          placeholder="Buscar en todas las columnas…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        {search.trim() !== "" && (
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setData(originalData);
            }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* ------------------- TABLA PRINCIPAL ------------------- */}
      <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#2563eb] text-white">
              <TableHead className="text-center py-2">ID</TableHead>
              <TableHead className="text-center py-2">Ente</TableHead>
              <TableHead className="text-center py-2">
                Presidente del subcomité
              </TableHead>
              <TableHead className="text-center py-2">Cargo</TableHead>
              <TableHead className="text-center py-2">Acuerdo</TableHead>
              <TableHead className="text-center py-2">Tipo de evento</TableHead>
              <TableHead className="text-center py-2">
                Tipo de licitación
              </TableHead>
              <TableHead className="text-center py-2">No. sesión</TableHead>
              <TableHead className="text-center py-2">Usuario</TableHead>
              <TableHead className="text-center py-2"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4">
                  No hay registros.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow>
                    <TableCell className="text-center">{row.id}</TableCell>
                    <TableCell>{row.ente}</TableCell>
                    <TableCell>{row.presidente}</TableCell>
                    <TableCell>{row.cargo_presidente}</TableCell>
                    <TableCell>{row.acuerdo}</TableCell>
                    <TableCell>{row.tipo_evento}</TableCell>
                    <TableCell>{row.tipo_licitacion}</TableCell>
                    <TableCell>{row.numero_sesion}</TableCell>
                    <TableCell>{row.usuario_registra}</TableCell>

                    {/* Botón expandir */}
                    <TableCell>
                      <button
                        onClick={() =>
                          setOpenRow((prev) => ({
                            ...prev,
                            [row.id]: !prev[row.id],
                          }))
                        }
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        {openRow[row.id] ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>

                  {/* ------------------- FILA EXPANDIDA ------------------- */}
                  {openRow[row.id] && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-gray-50">
                        <div className="p-3 space-y-4">
                          {/* --------------------- SUB-ACCORDION FECHAS --------------------- */}
                          <Accordion
                            type="single"
                            collapsible
                            value={
                              openSections[row.id]?.fechas ? "fechas" : undefined
                            }
                            onValueChange={(val) =>
                              setOpenSections((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...(prev[row.id] || {}),
                                  fechas: val === "fechas",
                                },
                              }))
                            }
                          >
                            <AccordionItem value="fechas">
                              <AccordionTrigger>
                                Fechas de la sesión
                              </AccordionTrigger>
                              <AccordionContent>
                                {row.fechas?.length ? (
                                  <ul className="list-disc pl-6 text-sm text-gray-700">
                                    {row.fechas.map((f, i) => (
                                      <li key={i}>
                                        {f.fecha} — {f.hora}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 text-sm">
                                    No hay fechas registradas.
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>

                          {/* --------------------- SUB-ACCORDION FUENTES --------------------- */}
                          <Accordion
                            type="single"
                            collapsible
                            value={
                              openSections[row.id]?.fuentes
                                ? "fuentes"
                                : undefined
                            }
                            onValueChange={(val) =>
                              setOpenSections((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...(prev[row.id] || {}),
                                  fuentes: val === "fuentes",
                                },
                              }))
                            }
                          >
                            <AccordionItem value="fuentes">
                              <AccordionTrigger>
                                Fuentes de financiamiento
                              </AccordionTrigger>
                              <AccordionContent>
                                {row.fuentes?.length ? (
                                  <ul className="list-disc pl-6 text-sm">
                                    {row.fuentes.map((f, i) => (
                                      <li key={i}>
                                        {f.fuente} —{" "}
                                        {f.monto ?? "Sin monto"}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 text-sm">
                                    No hay fuentes registradas.
                                  </p>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
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
    </main>
  );
}