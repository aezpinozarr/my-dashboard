// app/sesiones/calendario/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  X,
  Calendar as CalendarIcon,
  Check,
  Plus,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import type { CheckedState } from "@radix-ui/react-checkbox";

/* =========================
   Catálogos (demo)
   ========================= */

type Ente = {
  value: string;
  label: string;
  tipo: string;
  tipoNombre: string;
  sector: string;
};

const ENTES: Ente[] = [
  { value: "ayto-cdmx", label: "Ayuntamiento de CDMX", tipo: "MUN", tipoNombre: "Municipal", sector: "Público" },
  { value: "sec-educ", label: "Secretaría de Educación", tipo: "SEC", tipoNombre: "Secretaría", sector: "Público" },
  { value: "inst-salud", label: "Instituto de Salud", tipo: "INS", tipoNombre: "Instituto", sector: "Público" },
  { value: "poder-jud", label: "Poder Judicial", tipo: "POD", tipoNombre: "Poder", sector: "Público" },
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

/* =========================
   Utilidades
   ========================= */

// ---- Folio: solo incrementa al GUARDAR ----
const FOLIO_YEAR = new Date().getFullYear();
const FOLIO_LAST_KEY = `folioLastCommitted-${FOLIO_YEAR}`;
const FOLIO_PREFIX = `ID-${FOLIO_YEAR}-`;
const FOLIO_PAD = 4;

function getLastCommittedFolioCount(): number {
  const n = Number(localStorage.getItem(FOLIO_LAST_KEY) ?? "0");
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function setLastCommittedFolioCount(n: number) {
  localStorage.setItem(FOLIO_LAST_KEY, String(n));
}
function formatFolio(n: number) {
  return `${FOLIO_PREFIX}${String(n).padStart(FOLIO_PAD, "0")}`;
}
function nextFolioCandidate(): string {
  const last = getLastCommittedFolioCount();
  return formatFolio(last + 1);
}
function parseFolioNumber(folio: string): number | null {
  const re = new RegExp(`^${FOLIO_PREFIX}(\\d{${FOLIO_PAD}})$`);
  const m = re.exec(folio.trim());
  if (!m) return null;
  const num = Number(m[1]);
  return Number.isFinite(num) ? num : null;
}
function nextFolioAfter(currentFolio: string): string {
  const last = getLastCommittedFolioCount();
  const cur = parseFolioNumber(currentFolio) ?? last;
  return formatFolio(Math.max(last, cur) + 1);
}

function limit(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

// Fecha dd/mm/aaaa
function toDDMMYYYY(date?: Date) {
  if (!date || isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function parseDDMMYYYY(s: string): Date | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return undefined;
  const dd = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) return undefined;
  return d;
}
function maskDateInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
  return parts.filter(Boolean).map((p, i) => (i < 2 && p.length === 2 ? p + "/" : p)).join("").slice(0, 10);
}

// Hora 24h hh:mm
function maskTime24h(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const parts = [digits.slice(0, 2), digits.slice(2, 4)];
  return parts.filter(Boolean).join(":").slice(0, 5);
}
function isValidTime24h(hhmm: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return false;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

/* =========================
   Validación con Zod
   ========================= */

const Schema = z.object({
  folio: z.string().min(1),
  ente: z.string().min(1, "Selecciona el ente público"),
  tipoEnte: z.string().optional(),
  tipoEnteNombre: z.string().optional(),
  sector: z.string().optional(),
  noOficio: z
    .string({ required_error: "Escribe el No. de oficio" })
    .min(1, "Escribe el No. de oficio")
    .max(50, "Máx. 50 caracteres"),
  asunto: z
    .string({ required_error: "Escribe el asunto" })
    .min(1, "Escribe el asunto")
    .max(50, "Máx. 50 caracteres"),
  fecha: z.date({ required_error: "Escribe la fecha en formato dd/mm/aaaa" }),
  presidente: z.string().min(1, "Selecciona el presidente"),
  tipoLicitacion: z.enum(["Simplificado", "Pública"], {
    required_error: "Selecciona el tipo de licitación",
  }),
  clasificacion: z.string().optional(),
  fuentes: z.array(z.string()).optional(),
});

/* =========================
   Componente principal
   ========================= */

export default function NewCalendarSessionPage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      folio: "",
      ente: "",
      tipoEnte: "",
      tipoEnteNombre: "",
      sector: "",
      noOficio: "",
      asunto: "",
      fecha: undefined,
      presidente: "",
      tipoLicitacion: undefined as unknown as "Simplificado" | "Pública",
      clasificacion: "",
      fuentes: [],
    },
  });

  // Folio candidato al montar (no compromete contador)
  React.useEffect(() => {
    form.setValue("folio", nextFolioCandidate(), { shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fechaTexto, setFechaTexto] = React.useState("");
  const [enteSearch, setEnteSearch] = React.useState("");
  const [presidenteSearch, setPresidenteSearch] = React.useState("");

  type Sesion = {
    fechaISO: string;
    fecha: string;
    hora: string;
    estatusChecklist: Record<string, boolean>;
  };
  const [sesionFechaTexto, setSesionFechaTexto] = React.useState("");
  const [sesionHoraTexto, setSesionHoraTexto] = React.useState("");
  const [sesionError, setSesionError] = React.useState<string>("");
  const [sesiones, setSesiones] = React.useState<Sesion[]>([]);

  const [saveAsArmed, setSaveAsArmed] = React.useState(false);

  // Estatus global independiente de fechas
  const [estatus, setEstatus] = React.useState<Record<string, boolean>>(
    () => ESTATUS_CHECKBOXES.reduce((acc, c) => ((acc[c.key] = false), acc), {} as Record<string, boolean>)
  );

  const enteValue = form.watch("ente");
  React.useEffect(() => {
    const e = ENTES.find((x) => x.value === enteValue);
    form.setValue("tipoEnte", e?.tipo ?? "");
    form.setValue("tipoEnteNombre", e?.tipoNombre ?? "");
    form.setValue("sector", e?.sector ?? "");
    form.setValue("presidente", "");
    setPresidenteSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enteValue]);

  // ===== Select-all Fuentes =====
  const fuentes = form.watch("fuentes") || [];
  const allFuentes = ["Recursos propios", "Federal", "Municipal", "Internacional", "Estatal", "Mixto"];
  const fuentesAll = allFuentes.every((f) => fuentes.includes(f));
  const fuentesSome = allFuentes.some((f) => fuentes.includes(f));
  const fuentesSelectAllState: CheckedState = fuentesAll ? true : fuentesSome ? "indeterminate" : false;

  // ===== Select-all Estatus =====
  const estAll = ESTATUS_CHECKBOXES.every((c) => estatus[c.key]);
  const estSome = ESTATUS_CHECKBOXES.some((c) => estatus[c.key]);
  const estSelectAllState: CheckedState = estAll ? true : estSome ? "indeterminate" : false;

  // ===== Barras flotantes (arriba/abajo) =====
  const [showTopBar, setShowTopBar] = React.useState(false);
  const [showBottomBar, setShowBottomBar] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      const threshold = 300; // px antes del inicio/fin
      const y = window.scrollY || document.documentElement.scrollTop;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const distTop = y;
      const distBottom = docH - (y + vh);

      setShowTopBar(distTop < threshold);
      setShowBottomBar(distBottom < threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const FORM_ID = "cal-sesiones-form";

  // ==== Barra de acciones compacta (con Salir) ====
  function ActionBar({ position }: { position: "top" | "bottom" }) {
    return (
      <div
        className={cn(
          "fixed left-0 right-0 z-40 px-4 pointer-events-none",
          position === "top" ? "top-4" : "bottom-4"
        )}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-end">
            <div className="inline-flex items-center gap-2 rounded-xl border bg-background p-2 shadow pointer-events-auto">
              {/* Nuevo */}
              <Button
                type="button"
                form={FORM_ID}
                onClick={handleNuevo}
                style={{ backgroundColor: "#154c79", color: "white" }}
                className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
                title="Limpiar y crear un nuevo folio"
              >
                <Plus className="mr-2 size-4" />
                Nuevo
              </Button>

              {/* Guardar */}
              <Button
                type="submit"
                form={FORM_ID}
                style={{ backgroundColor: "#0bdb12", color: "black" }}
                className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
                title="Guardar registro"
              >
                <Save className="mr-2 size-4" /> Guardar
              </Button>

              {/* Guardar como… */}
              <Button
                type="button"
                form={FORM_ID}
                onClick={handleGuardarComo}
                disabled={saveAsArmed}
                style={{
                  backgroundColor: saveAsArmed ? "#d1db0b80" : "#d1db0b",
                  color: "black",
                }}
                className="cursor-pointer hover:opacity-90 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring/50"
                title={
                  saveAsArmed
                    ? "Ya generaste un nuevo folio. Presiona Guardar para confirmar."
                    : "Generar nuevo folio manteniendo los campos"
                }
              >
                Guardar como…
              </Button>

              {/* Eliminar */}
              <Button
                type="button"
                form={FORM_ID}
                onClick={handleEliminar}
                style={{ backgroundColor: "#ee0000", color: "white" }}
                className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
                title="Eliminar lo capturado"
              >
                <X className="mr-2 size-4" /> Eliminar
              </Button>

              {/* Salir → /dashboard */}
              <Button
                type="button"
                onClick={() => router.push("/dashboard")}
                style={{ backgroundColor: "black", color: "white" }}
                className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
                title="Volver al dashboard"
              >
                <LogOut className="mr-2 size-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Guardar (ANTES: localStorage -> AHORA: POST a backend) ----
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const onSubmit = async (data: z.infer<typeof Schema>) => {
    if (!form.getValues("noOficio")?.trim() || !form.getValues("asunto")?.trim()) {
      alert("Por favor completa los campos obligatorios: No. Oficio y Asunto.");
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/sesiones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          fecha: toDDMMYYYY(data.fecha),     // Enviamos dd/mm/aaaa como usas en UI
          estatusGeneral: estatus,
          fechasSesiones: sesiones,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || "Error al guardar en backend");
      }

      const saved = await resp.json();
      alert(`✅ Guardado.\nFolio: ${saved.folio ?? data.folio}`);

      // Mantienes tu contador local de folios
      const last = getLastCommittedFolioCount();
      const usedNum = parseFolioNumber(data.folio) ?? last + 1;
      if (usedNum > last) setLastCommittedFolioCount(usedNum);

      form.setValue("folio", nextFolioCandidate(), { shouldValidate: true });
      setSaveAsArmed(false);
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo guardar en el backend.");
    }
  };

  // ---- Guardar como… (se mantiene igual) ----
  function handleGuardarComo() {
    if (!form.getValues("noOficio")?.trim() || !form.getValues("asunto")?.trim()) {
      alert("Para 'Guardar como…' primero llena No. Oficio y Asunto.");
      return;
    }
    const currentFolio = form.getValues("folio");
    const nuevo = nextFolioAfter(currentFolio);
    form.setValue("folio", nuevo, { shouldValidate: true });
    setSaveAsArmed(true);
  }

  // ---- Nuevo (igual que antes) ----
  function handleNuevo() {
    if (!confirm("¿Crear un nuevo registro y limpiar el formulario?")) return;

    form.reset({
      folio: nextFolioCandidate(),
      ente: "",
      tipoEnte: "",
      tipoEnteNombre: "",
      sector: "",
      noOficio: "",
      asunto: "",
      fecha: undefined,
      presidente: "",
      tipoLicitacion: undefined as unknown as "Simplificado" | "Pública",
      clasificacion: "",
      fuentes: [],
    });
    setFechaTexto("");
    setEnteSearch("");
    setPresidenteSearch("");
    setSesiones([]);
    setSesionFechaTexto("");
    setSesionHoraTexto("");
    setSesionError("");
    setSaveAsArmed(false);
    setEstatus(ESTATUS_CHECKBOXES.reduce((acc, c) => ((acc[c.key] = false), acc), {} as Record<string, boolean>));
  }

  // ---- Eliminar (igual que antes) ----
  function handleEliminar() {
    if (!confirm("¿Eliminar lo capturado y reiniciar el formulario?")) return;
    handleNuevo();
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6">
      {/* Barra flotante superior (compacta, no tapa el título) */}
      {showTopBar && <ActionBar position="top" />}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" type="button" onClick={() => router.back()} className="cursor-pointer">
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Nueva sesión
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Completa los campos y guarda. El folio se genera automáticamente.
      </p>

      <Separator className="my-4" />

      {/* FORM */}
      <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
        {/* ===== Datos del formulario ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del formulario</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            {/* Folio */}
            <div className="grid gap-2">
              <Label>Folio interno (ID)</Label>
              <Input readOnly {...form.register("folio")} className="cursor-not-allowed bg-muted/50" />
            </div>

            {/* Ente público */}
            <div className="grid gap-2">
              <Label>Ente público</Label>
              <Command>
                <CommandInput
                  placeholder="Escribe para buscar ente…"
                  value={enteSearch}
                  onValueChange={setEnteSearch}
                />
                <CommandList>
                  {enteSearch && (
                    <>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup>
                        {ENTES.filter((e) =>
                          e.label.toLowerCase().includes(enteSearch.toLowerCase())
                        ).map((item) => (
                          <CommandItem
                            key={item.value}
                            value={item.label}
                            onSelect={() => {
                              form.setValue("ente", item.value, { shouldValidate: true });
                              setEnteSearch(item.label);
                            }}
                          >
                            {item.label}
                            {form.watch("ente") === item.value && (
                              <Check className="ml-auto h-4 w-4 opacity-80" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
              {form.formState.errors.ente && (
                <p className="text-sm text-red-500">{form.formState.errors.ente.message}</p>
              )}
            </div>

            {/* Tipo de ente */}
            <div className="grid gap-2">
              <Label>Tipo de ente</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input readOnly {...form.register("tipoEnte")} className="cursor-not-allowed bg-muted/50" />
                <Input readOnly {...form.register("tipoEnteNombre")} className="cursor-not-allowed bg-muted/50" />
                <Input readOnly {...form.register("sector")} className="cursor-not-allowed bg-muted/50" />
              </div>
            </div>

            {/* No. Oficio + Asunto + Fecha */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 relative">
                <Label>No. Oficio</Label>
                <Input
                  placeholder="No. de oficio"
                  required
                  {...form.register("noOficio")}
                  value={form.watch("noOficio")}
                  onChange={(e) =>
                    form.setValue("noOficio", limit(e.target.value, 50), { shouldValidate: true })
                  }
                />
                {form.formState.errors.noOficio && (
                  <p className="absolute left-0 top-full mt-1 text-sm text-red-500">
                    {form.formState.errors.noOficio.message as string}
                  </p>
                )}
              </div>

              <div className="grid gap-2 relative">
                <Label>Asunto</Label>
                <Input
                  placeholder="Asunto"
                  required
                  {...form.register("asunto")}
                  value={form.watch("asunto")}
                  onChange={(e) =>
                    form.setValue("asunto", limit(e.target.value, 50), { shouldValidate: true })
                  }
                />
                {form.formState.errors.asunto && (
                  <p className="absolute left-0 top-full mt-1 text-sm text-red-500">
                    {form.formState.errors.asunto.message as string}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div className="grid gap-2 relative">
                <Label htmlFor="fechaTexto">Fecha (dd/mm/aaaa)</Label>
                <div className="relative">
                  <Input
                    id="fechaTexto"
                    inputMode="numeric"
                    placeholder="dd/mm/aaaa"
                    value={fechaTexto}
                    onChange={(e) => {
                      const masked = maskDateInput(e.target.value);
                      setFechaTexto(masked);
                      const parsed = parseDDMMYYYY(masked);
                      if (parsed) {
                        form.clearErrors("fecha");
                        form.setValue("fecha", parsed as Date, { shouldValidate: true });
                      }
                    }}
                    onBlur={() => {
                      const parsed = parseDDMMYYYY(fechaTexto);
                      if (!parsed) {
                        form.setError("fecha", {
                          type: "manual",
                          message: "Formato inválido. Usa dd/mm/aaaa",
                        });
                      } else {
                        form.clearErrors("fecha");
                        form.setValue("fecha", parsed as Date, { shouldValidate: true });
                      }
                    }}
                    className="pr-9"
                  />
                  <CalendarIcon className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 opacity-60" />
                </div>
                {form.formState.errors.fecha && (
                  <p className="absolute left-0 top-full mt-1 text-sm text-red-500">
                    {form.formState.errors.fecha.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* Presidente */}
            <div className="grid gap-2">
              <Label>Presidente</Label>
              <Command>
                <CommandInput
                  placeholder={enteValue ? "Escribe para buscar presidente…" : "Primero elige un ente"}
                  value={presidenteSearch}
                  onValueChange={setPresidenteSearch}
                  disabled={!enteValue}
                />
                <CommandList>
                  {presidenteSearch && enteValue && (
                    <>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup>
                        {(PRESIDENTES[enteValue] ?? [])
                          .filter((p) =>
                            p.label.toLowerCase().includes(presidenteSearch.toLowerCase())
                          )
                          .map((item) => (
                            <CommandItem
                              key={item.value}
                              value={item.label}
                              onSelect={() => {
                                form.setValue("presidente", item.value, { shouldValidate: true });
                                setPresidenteSearch(item.label);
                              }}
                            >
                              {item.label}
                              {form.watch("presidente") === item.value && (
                                <Check className="ml-auto h-4 w-4 opacity-80" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </div>

            {/* Tipo de licitación + Clasificación */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tipo de licitación</Label>
                <div className="flex flex-wrap gap-3">
                  {(["Simplificado", "Pública"] as const).map((opt) => {
                    const checked = form.watch("tipoLicitacion") === opt;
                    return (
                      <Label
                        key={opt}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                          checked ? "border-blue-600 bg-blue-50" : ""
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() =>
                            form.setValue("tipoLicitacion", opt, { shouldValidate: true })
                          }
                        />
                        <span>{opt}</span>
                      </Label>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Clasificación</Label>
                <select {...form.register("clasificacion")} className="border rounded-md p-2">
                  <option value="">Selecciona…</option>
                  {CLASIFICACIONES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== Fuentes de financiamiento ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Fuentes de financiamiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Label className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Checkbox
                checked={fuentesSelectAllState}
                onCheckedChange={(v) => {
                  const turnOn = v === true;
                  form.setValue("fuentes", turnOn ? [...allFuentes] : [], { shouldValidate: true });
                }}
              />
              Seleccionar todo
            </Label>

            {allFuentes.map((fuente) => {
              const checked = fuentes.includes(fuente);
              return (
                <Label key={fuente} className="flex items-center gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const current = form.getValues("fuentes") || [];
                      const next = isChecked ? [...current, fuente] : current.filter((f: string) => f !== fuente);
                      form.setValue("fuentes", next, { shouldValidate: true });
                    }}
                  />
                  <span>{fuente}</span>
                </Label>
              );
            })}
          </CardContent>
        </Card>

        {/* ===== Fecha de sesiones ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Fecha de sesiones</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
              <div className="grid gap-1.5">
                <Label>Fecha (dd/mm/aaaa)</Label>
                <Input
                  placeholder="dd/mm/aaaa"
                  value={sesionFechaTexto}
                  onChange={(e) => setSesionFechaTexto(maskDateInput(e.target.value))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Hora (24 h)</Label>
                <Input
                  placeholder="hh:mm"
                  value={sesionHoraTexto}
                  onChange={(e) => setSesionHoraTexto(maskTime24h(e.target.value))}
                  maxLength={5}
                />
              </div>
              <div className="sm:justify-self-end">
                <Button
                  type="button"
                  onClick={() => {
                    setSesionError("");
                    const fechaParsed = parseDDMMYYYY(sesionFechaTexto);
                    if (!fechaParsed) {
                      setSesionError("Fecha inválida. Usa dd/mm/aaaa.");
                      return;
                    }
                    const horaMasked = maskTime24h(sesionHoraTexto);
                    if (!isValidTime24h(horaMasked)) {
                      setSesionError("Hora inválida. Usa formato 24 h.");
                      return;
                    }
                    setSesiones((rows) => [
                      ...rows,
                      {
                        fechaISO: fechaParsed.toISOString(),
                        fecha: toDDMMYYYY(fechaParsed),
                        hora: horaMasked,
                        estatusChecklist: {},
                      },
                    ]);
                    setSesionHoraTexto("");
                  }}
                  style={{ backgroundColor: "#154c79", color: "white" }}
                  className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  Anexar
                </Button>
              </div>
            </div>

            {sesionError && <p className="text-sm text-red-500">{sesionError}</p>}

            {sesiones.length > 0 && (
              <div className="border rounded-md">
                <div className="grid grid-cols-2 p-2 font-medium bg-muted/40">
                  <span>Fecha</span>
                  <span>Hora</span>
                </div>
                {sesiones.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-2 p-2 text-sm">
                    <span>{row.fecha}</span>
                    <span>{row.hora}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== Estatus (independiente) ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Estatus</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Checkbox
                checked={estSelectAllState}
                onCheckedChange={(v) => {
                  const turnOn = v === true;
                  setEstatus(
                    ESTATUS_CHECKBOXES.reduce((acc, c) => ((acc[c.key] = turnOn), acc), {} as Record<string, boolean>)
                  );
                }}
              />
              Seleccionar todo
            </Label>

            {ESTATUS_CHECKBOXES.map((c) => (
              <Label key={c.key} className="flex items-center gap-2 rounded-lg border p-3">
                <Checkbox
                  checked={!!estatus[c.key]}
                  onCheckedChange={(v) => {
                    const next = v === true;
                    setEstatus((prev) => ({ ...prev, [c.key]: next }));
                  }}
                />
                {c.label}
              </Label>
            ))}
          </CardContent>
        </Card>
      </form>

      {/* Barra flotante inferior (compacta, con Salir) */}
      {showBottomBar && <ActionBar position="bottom" />}
    </main>
  );
}