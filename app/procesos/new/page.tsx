"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useUser } from "@/context/UserContext";

/* ========================================
   🔹 Configuración del backend
======================================== */
const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("railway")
    ? "https://backend-licitacion-production.up.railway.app"
    : "http://127.0.0.1:8000";

/* ========================================
   🔹 Utilidades
======================================== */
function formatDateDDMMYYYY(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  let out = dd;
  if (mm) out += "/" + mm;
  if (yyyy) out += "/" + yyyy;
  return out;
}
function formatTimeHHMM(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  let out = hh;
  if (mm) out += ":" + mm;
  return out;
}
function isValidDateDDMMYYYY(val: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return false;
  const [dd, mm, yyyy] = val.split("/").map(Number);
  const diasMes = [
    31,
    yyyy % 4 === 0 && (yyyy % 100 !== 0 || yyyy % 400 === 0) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= diasMes[mm - 1];
}
function isValidTimeHHMM(val: string) {
  if (!/^(\d{2}):(\d{2})$/.test(val)) return false;
  const [h, m] = val.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}
function toIsoLocalDateTime(dmy: string, hm: string) {
  const [dd, mm, yyyy] = dmy.split("/");
  return `${yyyy}-${mm}-${dd}T${hm}:00`;
}
function formatMoney(value: string) {
  const num = value.replace(/[^\d]/g, "");
  if (!num) return "";
  return "$" + parseInt(num).toLocaleString("es-MX");
}

/* ========================================
   🔹 Step Indicator (UI Visual)
======================================== */
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Datos del Ente" },
    { id: 2, label: "Presupuesto del Ente" },
    { id: 3, label: "Presupuesto Rubro" },
    { id: 4, label: "Confirmación" },
  ];

  return (
    <div className="flex flex-col items-start space-y-4 mb-6">
      {steps.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;

        return (
          <div key={step.id} className="flex items-center w-full">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold
                ${
                  isActive
                    ? "bg-[#235391] border-[#235391] text-white"
                    : isCompleted
                    ? "bg-[#235391]/20 border-[#235391] text-[#235391]"
                    : "bg-gray-200 border-gray-300 text-gray-600"
                }`}
            >
              {step.id}
            </div>

            <div className="flex-1 ml-4">
              <div
                className={`h-3 rounded-full transition-all duration-300
                  ${
                    isActive
                      ? "bg-[#235391] w-3/4"
                      : isCompleted
                      ? "bg-[#235391]/50 w-3/4"
                      : "bg-gray-200 w-2/4"
                  }`}
              ></div>
              <p
                className={`mt-2 text-sm font-medium ${
                  isActive
                    ? "text-[#235391]"
                    : isCompleted
                    ? "text-[#235391]/70"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ========================================
   🔹 Componente principal (Paso 1, 2 y 3)
======================================== */
export default function NuevoProcesoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Paso 1
  const [enteDescripcion, setEnteDescripcion] = React.useState("");
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [servidorSeleccionado, setServidorSeleccionado] = React.useState<any>(null);
  const [tiposEvento, setTiposEvento] = React.useState<any[]>([]);
  const [tiposLicitacion, setTiposLicitacion] = React.useState<any[]>([]);
  const [numerosSesion, setNumerosSesion] = React.useState<any[]>([]);
  const [sesionSeleccionada, setSesionSeleccionada] = React.useState<any>(null);
  const [busquedaServidor, setBusquedaServidor] = React.useState("");
  const [busquedaSesion, setBusquedaSesion] = React.useState("");
  const [mostrarServidores, setMostrarServidores] = React.useState(true);
  const [mostrarSesiones, setMostrarSesiones] = React.useState(true);
  const [form, setForm] = React.useState({
    oficio_invitacion: "",
    servidor_publico_cargo: "",
    tipo_evento: "",
    tipo_licitacion: "",
    tipo_licitacion_notas: "",
    fecha: "",
    hora: "",
  });
  const [folio, setFolio] = React.useState<number | null>(null);

  // Paso 2
  const [fuentes, setFuentes] = React.useState<any[]>([]);
  const [catalogoPartidas, setCatalogoPartidas] = React.useState<any[]>([]);
  const [partidas, setPartidas] = React.useState<any[]>([
  {
    id: null, // <--- agregado
    e_no_requisicion: "",
    e_id_partida: "",
    partida_descripcion: "",
    clave_capitulo: "",
    capitulo: "",
    e_id_fuente_financiamiento: "",
    fuente_descripcion: "",
    fuente_etiquetado: "",
    fuente_fondo: "",
    e_monto_presupuesto_suficiencia: "",
  },
]);

  // Paso 3
  const [rubros, setRubros] = React.useState<any[]>([]);
  const [presupuestosRubro, setPresupuestosRubro] = React.useState<any[]>([
    { p_e_id_rubro: "", rubro_descripcion: "", p_e_monto_presupuesto_suficiencia: "" },
  ]);

  /* ========================================
     🔹 Cargar catálogos paso 1
  ======================================== */
  React.useEffect(() => {
    if (!user?.id_ente) return;
    (async () => {
      try {
        const enteResp = await fetch(`${API_BASE}/catalogos/entes?p_id=${user.id_ente}&p_descripcion=-99`);
        const enteData = await enteResp.json();
        setEnteDescripcion(enteData?.[0]?.descripcion || "—");

        const sResp = await fetch(
          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user.id_ente}`
        );
        setServidores(await sResp.json());

        const tResp = await fetch(`${API_BASE}/procesos/tipos-evento/`);
        setTiposEvento(await tResp.json());

        const nResp = await fetch(`${API_BASE}/catalogos/sesiones-numeros/`);
        setNumerosSesion(await nResp.json());
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      }
    })();
  }, [user?.id_ente]);

  React.useEffect(() => {
    if (!form.tipo_evento) {
      setTiposLicitacion([]);
      return;
    }
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/auxiliares?p_tipo=${form.tipo_evento}`);
        setTiposLicitacion(await resp.json());
      } catch {
        setTiposLicitacion([]);
      }
    })();
  }, [form.tipo_evento]);

  /* ========================================
     🔹 Guardar Paso 1
  ======================================== */
  const handleGuardarPaso1 = async () => {
    if (!user) return alert("No hay usuario logeado");
    if (!servidorSeleccionado) return alert("Selecciona un servidor público");
    if (!form.tipo_evento) return alert("Selecciona un tipo de evento");
    if (!form.tipo_licitacion) return alert("Selecciona un tipo de licitación");
    if (!sesionSeleccionada) return alert("Selecciona un número de sesión");
    if (!isValidDateDDMMYYYY(form.fecha)) return alert("Fecha inválida");
    if (!isValidTimeHHMM(form.hora)) return alert("Hora inválida");

    const fechaHora = toIsoLocalDateTime(form.fecha, form.hora);
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: "NUEVO",
          p_id: 0,
          p_e_id_ente: String(user.id_ente),
          p_e_oficio_invitacion: form.oficio_invitacion,
          p_e_id_servidor_publico_emite: Number(servidorSeleccionado.id),
          p_e_servidor_publico_cargo: form.servidor_publico_cargo,
          p_e_tipo_licitacion: form.tipo_licitacion,
          p_e_tipo_licitacion_no_veces: Number(sesionSeleccionada.id),
          p_e_tipo_licitacion_notas: form.tipo_licitacion_notas,
          p_e_fecha_y_hora_reunion: fechaHora,
          p_e_id_usuario_registra: user.id,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Error al guardar");
      setFolio(data.resultado);
      alert("✅ Paso 1 guardado correctamente");
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el paso 1");
    } finally {
      setLoading(false);
    }
  };

  /* ========================================
     🔹 Cargar catálogos paso 2
  ======================================== */
  React.useEffect(() => {
    if (step !== 2) return;
    (async () => {
      try {
        const [fResp, pResp] = await Promise.all([
          fetch(`${API_BASE}/catalogos/fuentes-financiamiento?p_id=-99&p_id_ramo=-99`).then((r) => r.json()),
          fetch(`${API_BASE}/catalogos/partidas?p_id=-99&p_id_capitulo=-99`).then((r) => r.json()),
        ]);
        setFuentes(Array.isArray(fResp) ? fResp : []);
        setCatalogoPartidas(Array.isArray(pResp) ? pResp : []);
      } catch (err) {
        console.error("❌ Error al cargar catálogos del paso 2:", err);
      }
    })();
  }, [step]);

  /* ========================================
     🔹 Guardar Paso 2 (envía montos al paso 3)
  ======================================== */
  const handleGuardarPartidas = async () => {
  if (!folio) return alert("No hay folio del proceso anterior");
  try {
    for (const p of partidas) {
      // 🔍 Verificar si la partida ya existe en BD
      const checkResp = await fetch(
        `${API_BASE}/procesos/seguimiento/presupuesto-ente?p_id_proceso_seguimiento=${folio}&p_e_id_partida=${p.e_id_partida}`
      );
      const existente = await checkResp.json();

      // Si el backend devuelve un registro existente, usar su id
      const idExistente = Array.isArray(existente) && existente.length > 0 ? existente[0].id : null;

      // Enviar al SP con la acción correcta
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/presupuesto-ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: idExistente ? "EDITAR" : "NUEVO",
          p_id_proceso_seguimiento: folio,
          p_id: idExistente || 0,
          p_e_no_requisicion: p.e_no_requisicion,
          p_e_id_partida: p.e_id_partida,
          p_e_id_fuente_financiamiento: p.e_id_fuente_financiamiento,
          p_e_monto_presupuesto_suficiencia: parseFloat(
            (p.e_monto_presupuesto_suficiencia || "").replace(/[^\d]/g, "") || "0"
          ),
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Error al guardar presupuesto");

      // Si fue nuevo o editado correctamente, guarda el id en el estado
      if (data.resultado) {
        setPartidas((prev) =>
          prev.map((x) =>
            x.e_id_partida === p.e_id_partida ? { ...x, id: data.resultado } : x
          )
        );
      }
    }

    alert("✅ Presupuesto guardado correctamente");
    setStep(3);
  } catch (err) {
    console.error("❌ Error al guardar presupuesto:", err);
    alert("Error al guardar presupuesto");
  }
};

  /* ========================================
     🔹 Cargar catálogos paso 3
  ======================================== */
  React.useEffect(() => {
    if (step !== 3) return;
    (async () => {
      try {
        const rResp = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
        const data = await rResp.json();
        setRubros(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error al cargar rubros:", err);
      }
    })();
  }, [step]);

  /* ========================================
     🔹 Guardar Paso 3
  ======================================== */
  const handleGuardarRubros = async () => {
    if (!folio) return alert("No hay folio del proceso anterior");
    try {
      for (const r of presupuestosRubro) {
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/presupuesto-rubro-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_accion: "NUEVO",
            p_id_proceso_seguimiento_presupuesto: folio,
            p_id: 0,
            p_e_id_rubro: r.p_e_id_rubro,
            p_e_monto_presupuesto_suficiencia: parseFloat(
              (r.p_e_monto_presupuesto_suficiencia || "").replace(/[^\d]/g, "") || "0"
            ),
          }),
        });
        await resp.json();
      }
      alert("✅ Rubros guardados correctamente");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Error al guardar rubros:", err);
      alert("Error al guardar rubros");
    }
  };

  const addRubro = () => {
    setPresupuestosRubro((prev) => [
      ...prev,
      { p_e_id_rubro: "", rubro_descripcion: "", p_e_monto_presupuesto_suficiencia: "" },
    ]);
  };

  const removeRubro = (idx: number) => {
    setPresupuestosRubro((prev) => {
      if (prev.length === 1) {
        return [{ p_e_id_rubro: "", rubro_descripcion: "", p_e_monto_presupuesto_suficiencia: "" }];
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  /* ========================================
     🔹 Render UI (Paso 1, 2, 3)
  ======================================== */
  return (
    <main className="flex gap-6 max-w-7xl mx-auto p-6">
      {/* Aside: Step Indicator */}
      <aside className="sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto w-1/5 pr-4">
        <StepIndicator currentStep={step} />
      </aside>
      {/* Section: Steps Content */}
      <section className="flex-1 w-4/5 pl-4">
        {/* Paso 1 */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard">←</Link>
              </Button>
              <h1 className="text-2xl font-bold">Proceso — Paso 1: Datos del Ente</h1>
            </div>

            <Card>
              <CardContent className="space-y-5 mt-4">
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label>Ente</Label>
                    <Input value={enteDescripcion || "Cargando..."} disabled />
                  </div>
                  <div>
                    <Label>Usuario</Label>
                    <Input value={user?.nombre || "Cargando..."} disabled />
                  </div>
                </div>

                <div>
                  <Label>Oficio de invitación</Label>
                  <Input
                    value={form.oficio_invitacion ?? ""}
                    onChange={(e) => setForm({ ...form, oficio_invitacion: e.target.value })}
                    placeholder="Ej. OF.123/2025"
                  />
                </div>

                {/* Servidor público */}
                <div>
                  <Label>Servidor público (emite)</Label>
                  <Command>
                    <CommandInput
                      placeholder="Escribe para buscar…"
                      value={busquedaServidor}
                      onValueChange={(val) => {
                        setBusquedaServidor(val);
                        setMostrarServidores(true);
                      }}
                    />
                    {mostrarServidores && (
                      <CommandList>
                        {busquedaServidor.trim() !== "" ? (
                          servidores
                            .filter((s) =>
                              (s.nombre || "").toLowerCase().includes(busquedaServidor.toLowerCase())
                            )
                            .map((s) => (
                              <CommandItem
                                key={s.id}
                                onSelect={() => {
                                  setServidorSeleccionado(s);
                                  setForm((prev) => ({ ...prev, servidor_publico_cargo: s.cargo || "" }));
                                  setBusquedaServidor(s.nombre);
                                  setMostrarServidores(false);
                                }}
                              >
                                {s.nombre}
                              </CommandItem>
                            ))
                        ) : (
                          <CommandEmpty>Escribe para buscar un servidor</CommandEmpty>
                        )}
                      </CommandList>
                    )}
                  </Command>
                </div>

                <div>
                  <Label>Cargo</Label>
                  <Input
                    value={form.servidor_publico_cargo ?? ""}
                    onChange={(e) => setForm({ ...form, servidor_publico_cargo: e.target.value })}
                    placeholder="Ej. Directora General"
                  />
                </div>

                {/* Tipo evento y licitación */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de evento</Label>
                    <select
                      className="border rounded-md p-2 w-full"
                      value={form.tipo_evento}
                      onChange={(e) => setForm({ ...form, tipo_evento: e.target.value })}
                    >
                      <option value="">Seleccione…</option>
                      {tiposEvento.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Tipo de licitación</Label>
                    <select
                      className="border rounded-md p-2 w-full"
                      value={form.tipo_licitacion}
                      onChange={(e) => setForm({ ...form, tipo_licitacion: e.target.value })}
                      disabled={!form.tipo_evento}
                    >
                      <option value="">
                        {form.tipo_evento ? "Seleccione…" : "Seleccione un tipo de evento primero"}
                      </option>
                      {tiposLicitacion.map((a) => (
                        <option key={a.id} value={a.valor}>
                          {a.valor}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sesión */}
                <div>
                  <Label>Número de sesión</Label>
                  <Command>
                    <CommandInput
                      placeholder="Escribe para buscar…"
                      value={busquedaSesion}
                      onValueChange={(val) => {
                        setBusquedaSesion(val);
                        setMostrarSesiones(true);
                      }}
                    />
                    {mostrarSesiones && (
                      <CommandList>
                        {busquedaSesion.trim() !== "" ? (
                          numerosSesion
                            .filter((n) =>
                              (n.descripcion || "").toLowerCase().includes(busquedaSesion.toLowerCase())
                            )
                            .map((n) => (
                              <CommandItem
                                key={n.id}
                                onSelect={() => {
                                  setSesionSeleccionada(n);
                                  setBusquedaSesion(n.descripcion);
                                  setMostrarSesiones(false);
                                }}
                              >
                                {n.descripcion}
                              </CommandItem>
                            ))
                        ) : (
                          <CommandEmpty>Escribe para buscar una sesión</CommandEmpty>
                        )}
                      </CommandList>
                    )}
                  </Command>
                </div>

                {/* Fecha / hora */}
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label>Fecha (dd/mm/aaaa)</Label>
                    <Input
                      value={form.fecha ?? ""}
                      onChange={(e) => setForm({ ...form, fecha: formatDateDDMMYYYY(e.target.value) })}
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label>Hora (HH:MM)</Label>
                    <Input
                      value={form.hora ?? ""}
                      onChange={(e) => setForm({ ...form, hora: formatTimeHHMM(e.target.value) })}
                      placeholder="HH:MM"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGuardarPaso1}
                    disabled={loading}
                    style={{ backgroundColor: "#235391", color: "white" }}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar paso 1"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Paso 2 */}
        {step === 2 && (
          <Card>
            <CardContent className="space-y-5 mt-4">
              <h1 className="text-2xl font-bold">Paso 2 — Presupuesto del Ente</h1>
              <div>
                <Label>Folio</Label>
                <Input value={folio ?? ""} disabled />
              </div>

              {partidas.map((p, i) => (
                <Card key={i} className="p-4 space-y-4 border border-gray-200 relative">
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-red-600 hover:text-red-700"
                    onClick={() => setPartidas(partidas.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div>
                    <Label>No. Requisición</Label>
                    <Input
                      value={p.e_no_requisicion ?? ""}
                      onChange={(e) =>
                        setPartidas((prev) =>
                          prev.map((x, idx) =>
                            idx === i ? { ...x, e_no_requisicion: e.target.value } : x
                          )
                        )
                      }
                    />
                  </div>

                  {/* Partida */}
                  <div>
                    <Label>Partida</Label>
                    <Command>
                      <CommandInput
                        placeholder="Escribe ID o descripción…"
                        value={p.e_id_partida ?? ""}
                        onValueChange={(val) =>
                          setPartidas((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, e_id_partida: val } : x
                            )
                          )
                        }
                      />
                      {Boolean((p.e_id_partida || "").trim()) && (
                        <CommandList>
                          {catalogoPartidas
                            .filter((row: any) => {
                              const q = (p.e_id_partida || "").toLowerCase();
                              return (
                                row.id?.toString().toLowerCase().includes(q) ||
                                row.descripcion?.toLowerCase().includes(q)
                              );
                            })
                            .map((row: any) => (
                              <CommandItem
                                key={row.id}
                                onSelect={() =>
                                  setPartidas((prev) =>
                                    prev.map((x, idx) =>
                                      idx === i
                                        ? {
                                            ...x,
                                            e_id_partida: row.id,
                                            partida_descripcion: row.descripcion ?? "",
                                            clave_capitulo: row.id_capitulo ?? "",
                                            capitulo: row.capitulo ?? "",
                                          }
                                        : x
                                    )
                                  )
                                }
                              >
                                {row.id} — {row.descripcion}
                              </CommandItem>
                            ))}
                          <CommandEmpty>No se encontraron partidas</CommandEmpty>
                        </CommandList>
                      )}
                    </Command>
                  </div>

                  {/* Capítulo bloqueado */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Clave capítulo</Label>
                      <Input value={p.clave_capitulo ?? ""} disabled />
                    </div>
                    <div>
                      <Label>Capítulo</Label>
                      <Input value={p.capitulo ?? ""} disabled />
                    </div>
                  </div>

                  {/* Fuente de financiamiento */}
                  <div>
                    <Label>Fuente de financiamiento</Label>
                    <Command>
                      <CommandInput
                        placeholder="Escribe ID o nombre…"
                        value={p.e_id_fuente_financiamiento ?? ""}
                        onValueChange={(val) =>
                          setPartidas((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, e_id_fuente_financiamiento: val } : x
                            )
                          )
                        }
                      />
                      {Boolean((p.e_id_fuente_financiamiento || "").trim()) && (
                        <CommandList>
                          {fuentes
                            .filter((f: any) => {
                              const q = (p.e_id_fuente_financiamiento || "").toLowerCase();
                              return (
                                f.id?.toString().toLowerCase().includes(q) ||
                                f.descripcion?.toLowerCase().includes(q)
                              );
                            })
                            .map((f: any) => (
                              <CommandItem
                                key={f.id}
                                onSelect={() =>
                                  setPartidas((prev) =>
                                    prev.map((x, idx) =>
                                      idx === i
                                        ? {
                                            ...x,
                                            e_id_fuente_financiamiento: f.id,
                                            fuente_descripcion: f.descripcion ?? "",
                                            fuente_etiquetado: f.etiquetado ?? "",
                                            fuente_fondo: f.fondo ?? "",
                                          }
                                        : x
                                    )
                                  )
                                }
                              >
                                {f.id} — {f.descripcion}
                              </CommandItem>
                            ))}
                          <CommandEmpty>No se encontraron fuentes</CommandEmpty>
                        </CommandList>
                      )}
                    </Command>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>Descripción</Label>
                      <Input value={p.fuente_descripcion ?? ""} disabled />
                    </div>
                    <div>
                      <Label>Etiquetado</Label>
                      <Input value={p.fuente_etiquetado ?? ""} disabled />
                    </div>
                    <div>
                      <Label>Fondo</Label>
                      <Input value={p.fuente_fondo ?? ""} disabled />
                    </div>
                  </div>

                  <div>
                    <Label>Monto presupuesto suficiencia</Label>
                    <Input
                      value={p.e_monto_presupuesto_suficiencia ?? ""}
                      onChange={(e) => {
                        const val = formatMoney(e.target.value);
                        setPartidas((prev) =>
                          prev.map((x, idx) =>
                            idx === i ? { ...x, e_monto_presupuesto_suficiencia: val } : x
                          )
                        );
                      }}
                    />
                  </div>
                </Card>
              ))}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setPartidas([...partidas, partidas[0]])}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Nueva partida
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Volver al paso 1
                  </Button>
                  <Button
                    onClick={handleGuardarPartidas}
                    style={{ backgroundColor: "#235391", color: "white" }}
                  >
                    Guardar presupuesto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 3 */}
        {step === 3 && (
          <Card>
            <CardContent className="space-y-5 mt-4">
              <h1 className="text-2xl font-bold">Paso 3 — Presupuesto por Rubro</h1>
              <div>
                <Label>Folio</Label>
                <Input value={folio ?? ""} disabled />
              </div>

              {presupuestosRubro.map((r, i) => (
                <Card key={i} className="p-4 space-y-4 border border-gray-200 relative">
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-red-600 hover:text-red-700"
                    onClick={() => removeRubro(i)}
                    title="Eliminar rubro"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  <div>
                    <Label>Rubro</Label>
                    <Command>
                      <CommandInput
                        placeholder="Escribe ID o nombre…"
                        value={r.p_e_id_rubro ?? ""}
                        onValueChange={(val) =>
                          setPresupuestosRubro((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, p_e_id_rubro: val } : x
                            )
                          )
                        }
                      />
                      {Boolean((r.p_e_id_rubro || "").trim()) && (
                        <CommandList>
                          {rubros
                            .filter((rb) => {
                              const q = (r.p_e_id_rubro || "").toLowerCase();
                              return (
                                rb.id?.toString().toLowerCase().includes(q) ||
                                rb.descripcion?.toLowerCase().includes(q)
                              );
                            })
                            .map((rb) => (
                              <CommandItem
                                key={rb.id}
                                onSelect={() =>
                                  setPresupuestosRubro((prev) =>
                                    prev.map((x, idx) =>
                                      idx === i
                                        ? {
                                            ...x,
                                            p_e_id_rubro: rb.id,
                                            rubro_descripcion: rb.descripcion,
                                          }
                                        : x
                                    )
                                  )
                                }
                              >
                                {rb.id} — {rb.descripcion}
                              </CommandItem>
                            ))}
                          <CommandEmpty>No se encontraron rubros</CommandEmpty>
                        </CommandList>
                      )}
                    </Command>
                  </div>

                  <div>
                    <Label>Descripción</Label>
                    <Input value={r.rubro_descripcion ?? ""} disabled />
                  </div>

                  <div>
                    <Label>Monto presupuesto suficiencia</Label>
                    <Input
                      value={r.p_e_monto_presupuesto_suficiencia ?? ""}
                      disabled
                    />
                  </div>
                </Card>
              ))}

              <div className="flex justify-between">
                <Button variant="outline" onClick={addRubro}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Nuevo rubro
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    ← Volver al paso 2
                  </Button>
                  <Button
                    onClick={handleGuardarRubros}
                    style={{ backgroundColor: "#235391", color: "white" }}
                  >
                    Finalizar proceso
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}