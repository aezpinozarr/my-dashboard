"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle, Check, X as XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/* ====== Catálogos (mismos que en new/page.tsx) ====== */
const ENTES = [
  { value: "ayto-cdmx", label: "Ayuntamiento de CDMX" },
  { value: "sec-educ", label: "Secretaría de Educación" },
  { value: "inst-salud", label: "Instituto de Salud" },
  { value: "poder-jud", label: "Poder Judicial" },
];

const PRESIDENTES: Record<string, { value: string; label: string }[]> = {
  "ayto-cdmx": [
    { value: "p1", label: "María Gómez" },
    { value: "p2", label: "Luis Ramírez" },
  ],
  "sec-educ": [
    { value: "p3", label: "Ana Torres" },
    { value: "p4", label: "Jorge Díaz" },
  ],
  "inst-salud": [{ value: "p5", label: "Leticia Cruz" }],
  "poder-jud": [{ value: "p6", label: "Sofía Hernández" }],
};

const CLASIFICACIONES = [
  { value: "adm", label: "Administrativa" },
  { value: "fin", label: "Financiera" },
  { value: "jur", label: "Jurídica" },
  { value: "tec", label: "Técnica" },
];

const ESTATUS_CHECKBOXES = [
  { key: "revisionBase", label: "Revisión de base" },
  { key: "publicacion", label: "Publicación" },
  { key: "juntaAclaracion", label: "Junta de aclaración" },
  { key: "actaPresentacion", label: "Acta de presentación" },
  { key: "falloTecnico", label: "Fallo técnico" },
  { key: "comunicacion", label: "Comunicación" },
];

/* ====== Tipos ====== */
type Sesion = {
  fechaISO: string;
  fecha: string;
  hora: string;
  estatusChecklist: Record<string, boolean>;
};

type Registro = {
  folio: string;
  ente: string;
  tipoEnte?: string;
  tipoEnteNombre?: string;
  sector?: string;
  noOficio: string;
  asunto: string;
  fecha: string;
  presidente: string;
  clasificacion?: string;
  fuentes?: string[];
  estatusGeneral?: Record<string, boolean>;
  fechasSesiones: Sesion[];
  createdAt: string;
};

export default function CalendarListPage() {
  const router = useRouter();
  const [registros, setRegistros] = React.useState<Registro[]>([]);

  React.useEffect(() => {
    async function fetchRegistros() {
      try {
        const res = await fetch("http://127.0.0.1:8000/sesiones");
        if (!res.ok) throw new Error("Error al cargar registros");
        const data = await res.json();
        setRegistros(data);
      } catch (err) {
        console.error("❌ Error al obtener registros:", err);
      }
    }
    fetchRegistros();
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Sesiones guardadas
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Aquí puedes revisar todas las sesiones que se han guardado en el calendario.
      </p>

      <Separator className="my-4" />

      {/* Botón para crear nueva sesión */}
      <div className="mb-4 flex justify-end">
        <Button
          onClick={() => router.push("/sesiones/calendario/new")}
          style={{ backgroundColor: "#154c79", color: "white" }}
          className="cursor-pointer transition-transform active:scale-95 hover:brightness-110"
        >
          <PlusCircle className="mr-2 size-4" />
          Nueva sesión
        </Button>
      </div>

      {/* Lista de registros */}
      {registros.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay registros guardados todavía.
        </p>
      ) : (
        <div className="grid gap-6">
          {registros.map((r, idx) => {
            const enteNombre =
              ENTES.find((e) => e.value === r.ente)?.label || r.ente;
            const presidenteNombre =
              Object.values(PRESIDENTES)
                .flat()
                .find((p) => p.value === r.presidente)?.label || r.presidente;
            const clasificacionNombre =
              CLASIFICACIONES.find((c) => c.value === r.clasificacion)?.label ||
              r.clasificacion;

            return (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{r.folio}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <p>
                    <strong>Ente público:</strong> {enteNombre}
                  </p>
                  <p>
                    <strong>No. Oficio:</strong> {r.noOficio}
                  </p>
                  <p>
                    <strong>Asunto:</strong> {r.asunto}
                  </p>
                  <p>
                    <strong>Presidente:</strong> {presidenteNombre}
                  </p>
                  {clasificacionNombre && (
                    <p>
                      <strong>Clasificación:</strong> {clasificacionNombre}
                    </p>
                  )}
                  {r.fuentes && r.fuentes.length > 0 && (
                    <p>
                      <strong>Fuentes:</strong> {r.fuentes.join(", ")}
                    </p>
                  )}

                  {/* Estatus general (solo los marcados) */}
                  {r.estatusGeneral && (
                    <div className="mt-3">
                      <strong>Estatus general:</strong>
                      <ul className="ml-5 mt-1 list-disc">
                        {ESTATUS_CHECKBOXES.filter(
                          (c) => r.estatusGeneral?.[c.key]
                        ).map((c) => (
                          <li key={c.key}>{c.label}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fechas de sesiones con checklist de estatus */}
                  {r.fechasSesiones?.length > 0 && (
                    <div className="mt-3 overflow-x-auto rounded-md border">
                      <div className="min-w-[720px]">
                        <div className="grid grid-cols-[120px_100px_repeat(6,140px)] gap-2 border-b bg-muted/40 p-2 font-medium">
                          <span>Fecha</span>
                          <span>Hora</span>
                          {ESTATUS_CHECKBOXES.map((c) => (
                            <span key={c.key} className="text-center">
                              {c.label}
                            </span>
                          ))}
                        </div>
                        {r.fechasSesiones.map((s, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-[120px_100px_repeat(6,140px)] items-center gap-2 p-2 text-sm"
                          >
                            <span>{s.fecha}</span>
                            <span>{s.hora}</span>
                            {ESTATUS_CHECKBOXES.map((c) => {
                              const checked = !!s.estatusChecklist?.[c.key];
                              return (
                                <span
                                  key={c.key}
                                  className="flex items-center justify-center gap-1"
                                  title={checked ? "Completado" : "Pendiente"}
                                >
                                  {checked ? (
                                    <>
                                      <Check className="size-4" />
                                      <span className="sr-only">Sí</span>
                                    </>
                                  ) : (
                                    <>
                                      <XIcon className="size-4 opacity-60" />
                                      <span className="sr-only">No</span>
                                    </>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}