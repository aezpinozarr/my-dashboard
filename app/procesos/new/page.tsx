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
    { id: 1, label: "Oficio invitación" },
    { id: 2, label: "Partidas" },
    { id: 3, label: "Rubros" },
    { id: 4, label: "Proveedor" },
  ];

  return (
    <div className="flex justify-center items-center mb-8 pl-30">
      <div className="flex items-center w-full max-w-4xl justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center w-full">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-sm transition-all
                    ${
                      isActive
                        ? "bg-[#235391] border-[#235391] text-white scale-110"
                        : isCompleted
                        ? "bg-[#235391]/20 border-[#235391] text-[#235391]"
                        : "bg-gray-200 border-gray-300 text-gray-600"
                    }`}
                >
                  {step.id}
                </div>
                <p
                  className={`text-xs font-medium mt-2 ${
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

              {!isLast && (
                <div
                  className={`flex-1 h-[2px] mx-2 transition-all duration-500 ${
                    isCompleted ? "bg-[#235391]" : "bg-gray-300"
                  }`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================
   🔹 Componente principal (Paso 1, 2 y 3)
======================================== */
interface FormData {
  oficio_invitacion: string;
  servidor_publico_cargo: string;
  tipo_evento: string;
  tipo_licitacion: string;
  tipo_licitacion_notas: string;
  fecha: string;
  hora: string;
  e_rfc_proveedor: string;
  razon_social: string;
  nombre_comercial: string;
  persona_juridica: string;
  correo_electronico: string;
  entidad_federativa: string;
  e_importe_sin_iva: string;
  e_importe_total: string;
  p_e_id_rubro_partida: string;
}

export default function NuevoProcesoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [errores, setErrores] = React.useState<Record<string, string>>({});

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
  const [form, setForm] = React.useState<FormData>({
    oficio_invitacion: "",
    servidor_publico_cargo: "",
    tipo_evento: "",
    tipo_licitacion: "",
    tipo_licitacion_notas: "",
    fecha: "",
    hora: "",
    // Campos del paso 4
    e_rfc_proveedor: "",
    razon_social: "",
    nombre_comercial: "",
    persona_juridica: "",
    correo_electronico: "",
    entidad_federativa: "",
    e_importe_sin_iva: "",
    e_importe_total: "",
    p_e_id_rubro_partida: "",
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

  // Paso 4: Proveedores
  const [proveedores, setProveedores] = React.useState<any[]>([]);

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
    const requiredFields = ["oficio_invitacion", "tipo_evento", "tipo_licitacion", "fecha", "hora"];
    const newErrors: any = {};

    // Verificar campos vacíos
    (requiredFields as Array<keyof FormData>).forEach((field) => {
      if (!form[field]) newErrors[field as string] = "Campo obligatorio";
    });

    if (!servidorSeleccionado) newErrors.servidor_publico_cargo = "Selecciona un servidor público";
    if (!sesionSeleccionada) newErrors.tipo_licitacion_notas = "Selecciona un número de sesión";
    if (!isValidDateDDMMYYYY(form.fecha)) newErrors.fecha = "Fecha inválida";
    if (!isValidTimeHHMM(form.hora)) newErrors.hora = "Hora inválida";

    if (Object.keys(newErrors).length > 0) {
      setErrores(newErrors);
      return;
    }

    setErrores({});
    if (!user) return;

    const fechaHora = toIsoLocalDateTime(form.fecha, form.hora);
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: "NUEVO",
          p_id: 0,
          p_e_id_ente: Number(user.id_ente),
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
     🔹 Cargar montos del paso 2 en el paso 3
  ======================================== */
  React.useEffect(() => {
    if (step !== 3 || !folio) return;
    (async () => {
      try {
        // Trae todos los registros de presupuesto-ente del proceso
        const resp = await fetch(
          `${API_BASE}/procesos/seguimiento/presupuesto-ente/?p_id_proceso_seguimiento=${folio}&p_e_id_partida=-99`,
          { method: "GET" }
        );
        const data = await resp.json();

        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d: any) => ({
            p_e_id_rubro: d.e_id_partida?.toString() || "",
            rubro_descripcion: d.partida_descripcion || d.e_id_partida?.toString() || "",
            p_e_monto_presupuesto_suficiencia:
              "$" + parseFloat(d.e_monto_presupuesto_suficiencia || 0).toLocaleString("es-MX"),
            // ✅ guardar el id de partida para usarlo en el Paso 4
            p_id_partida_asociada: d.e_id_partida?.toString() || "",
          }));
          setPresupuestosRubro(mapped);
        } else {
          console.warn("⚠️ No se encontraron registros de presupuesto para el folio:", folio);
        }
      } catch (err) {
        console.error("❌ Error al cargar montos del paso 2:", err);
      }
    })();
  }, [step, folio]);

  /* ========================================
     🔹 Guardar Paso 3
  ======================================== */
  const handleGuardarRubros = async () => {
    if (!folio) return alert("No hay folio del proceso anterior");
    try {
      for (const r of presupuestosRubro) {
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/presupuesto-rubro-proveedor-ente/`, {
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
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <StepIndicator currentStep={step} />
      {/* Paso 1 */}
      {step === 1 && (
          <>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard">←</Link>
              </Button>
              <h1 className="text-2xl font-bold">Paso 1: Oficio de invitación</h1>
            </div>

            <Card>
              <CardContent className="space-y-5 mt-4">
                <div>
                  <Label>Ente</Label>
                  <Input
                    value={enteDescripcion || "Cargando..."}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                  />
                </div>

                <div>
                  <Label>Oficio de invitación</Label>
                  <Input
                    value={form.oficio_invitacion ?? ""}
                    onChange={(e) => setForm({ ...form, oficio_invitacion: e.target.value })}
                    placeholder="Ej. OF.123/2025"
                    className={`${errores.oficio_invitacion ? "border-red-500" : ""}`}
                  />
                  {errores.oficio_invitacion && (
                    <p className="text-red-600 text-xs">{errores.oficio_invitacion}</p>
                  )}
                </div>

                {/* Servidor público */}
                <div>
                  <Label>Servidor público (emite)</Label>
                  <div className={errores.servidor_publico_cargo ? "border border-red-500 rounded-md p-1" : ""}>
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
                  {errores.servidor_publico_cargo && (
                    <p className="text-red-600 text-xs">{errores.servidor_publico_cargo}</p>
                  )}
                </div>

                <div>
                  <Label>Cargo</Label>
                  <Input
                    value={form.servidor_publico_cargo ?? ""}
                    onChange={(e) => setForm({ ...form, servidor_publico_cargo: e.target.value })}
                    placeholder="Ej. Directora General"
                    className={`${errores.servidor_publico_cargo ? "border-red-500" : ""}`}
                  />
                  {/* No mensaje aquí porque el error es para el servidor público */}
                </div>

                {/* Tipo evento y licitación */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de evento</Label>
                    <select
                      className={`border rounded-md p-2 w-full ${errores.tipo_evento ? "border-red-500" : ""}`}
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
                    {errores.tipo_evento && (
                      <p className="text-red-600 text-xs">{errores.tipo_evento}</p>
                    )}
                  </div>

                  <div>
                    <Label>Tipo de licitación</Label>
                    <select
                      className={`border rounded-md p-2 w-full ${errores.tipo_licitacion ? "border-red-500" : ""}`}
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
                    {errores.tipo_licitacion && (
                      <p className="text-red-600 text-xs">{errores.tipo_licitacion}</p>
                    )}
                  </div>
                </div>

                {/* Sesión */}
                <div>
                  <Label>Número de sesión</Label>
                  <div className={errores.tipo_licitacion_notas ? "border border-red-500 rounded-md p-1" : ""}>
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
                  {errores.tipo_licitacion_notas && (
                    <p className="text-red-600 text-xs">{errores.tipo_licitacion_notas}</p>
                  )}
                </div>

                {/* Fecha / hora */}
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label>Fecha</Label>
                    <Input
                      value={form.fecha ?? ""}
                      onChange={(e) => setForm({ ...form, fecha: formatDateDDMMYYYY(e.target.value) })}
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      className={`${errores.fecha ? "border-red-500" : ""}`}
                    />
                    {errores.fecha && (
                      <p className="text-red-600 text-xs">{errores.fecha}</p>
                    )}
                  </div>
                  <div>
                    <Label>Hora</Label>
                    <Input
                      value={form.hora ?? ""}
                      onChange={(e) => setForm({ ...form, hora: formatTimeHHMM(e.target.value) })}
                      placeholder="HH:MM"
                      maxLength={5}
                      className={`${errores.hora ? "border-red-500" : ""}`}
                    />
                    {errores.hora && (
                      <p className="text-red-600 text-xs">{errores.hora}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Usuario</Label>
                  <Input
                    value={user?.nombre || "Cargando..."}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleGuardarPaso1}
                    disabled={loading}
                    style={{ backgroundColor: "#235391", color: "white" }}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Siguiente"}
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
              <h1 className="text-2xl font-bold">Paso 2: Partidas</h1>
              <div>
                <Label>Oficio de invitación</Label>
                <Input value={form.oficio_invitacion ?? ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
              </div>

              {partidas.map((p, i) => {
                const isLast = partidas.length === 1;
                return (
                  <Card key={i} className="p-4 space-y-4 border border-gray-200 relative">
                    {/* Identificador de partida */}
                    <div className="mb-2">
                      <span className="inline-block rounded px-3 py-1 bg-blue-100 text-blue-800 font-semibold text-sm">{`Partida #${i + 1}`}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={isLast ? "No se puede eliminar la última partida" : "Eliminar partida"}
                      className={
                        `absolute right-3 top-3 z-10 rounded-full p-2 transition-all duration-200
                        ${isLast
                          ? "bg-gray-200/80 cursor-not-allowed opacity-70"
                          : "bg-red-500/20 hover:bg-red-600/70 cursor-pointer hover:scale-110"
                        }`
                      }
                      onClick={() => {
                        if (!isLast) setPartidas(partidas.filter((_, idx) => idx !== i));
                      }}
                      disabled={isLast}
                      tabIndex={0}
                      onMouseEnter={e => {
                        if (isLast) {
                          (e.currentTarget as HTMLElement).setAttribute('title', 'Debe haber al menos una partida');
                        }
                      }}
                    >
                      <Trash2 className={`w-7 h-7 ${isLast ? "text-gray-400" : "text-red-600 hover:text-white"}`} />
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
                      <Input value={p.clave_capitulo ?? ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <Label>Capítulo</Label>
                      <Input value={p.capitulo ?? ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
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
                                {f.fondo ? (
                                  <span className="text-gray-500 text-xs ml-2">(Fondo: {f.fondo})</span>
                                ) : null}
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
                      <Input value={p.fuente_descripcion ?? ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <Label>Etiquetado</Label>
                      <Input value={p.fuente_etiquetado ?? ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                    </div>
                    <div>
                      <Label>Fondo</Label>
                      <Input value={p.fuente_fondo ?? ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
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
                );
              })}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  style={{ backgroundColor: "#10c706", color: "white" }}
                  onClick={() =>
                    setPartidas([
                      ...partidas,
                      {
                        id: null,
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
                    ])
                  }
                >
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
                    Siguiente
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
      <h1 className="text-2xl font-bold">Paso 3: Rubros</h1>
      <div>
        <Label>Oficio de invitación</Label>
        <Input
          value={form.oficio_invitacion ?? ""}
          disabled
          className="bg-gray-100 text-gray-700 cursor-not-allowed"
        />
      </div>

      {presupuestosRubro.map((r, i) => (
        <Card key={i} className="p-4 space-y-4 border border-gray-200 relative">
          {/* Identificador visual */}
          <div className="mb-2 flex justify-between items-center">
            <span className="inline-block rounded px-3 py-1 bg-green-100 text-green-800 font-semibold text-sm">
              {`Rubro #${i + 1}`}
            </span>
            <button
              type="button"
              className="text-red-600 hover:text-red-700"
              onClick={() => removeRubro(i)}
              title="Eliminar rubro"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Si hay más de una partida, mostrar selector */}
          {partidas.length > 1 && (
            <div>
              <Label>Partida asociada</Label>
              <select
                className="border rounded-md p-2 w-full"
                value={r.p_id_partida_asociada || ""}
                onChange={(e) =>
                  setPresupuestosRubro((prev) =>
                    prev.map((x, idx) =>
                      idx === i
                        ? { ...x, p_id_partida_asociada: e.target.value }
                        : x
                    )
                  )
                }
              >
                <option value="">Seleccione la partida…</option>
                {partidas.map((p, idx) => (
                  <option key={`${p.e_id_partida}-${idx}`} value={p.e_id_partida}>
                    {p.e_id_partida} — {p.partida_descripcion} ({p.clave_capitulo || "Sin clave"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Si solo hay una partida, mostrar encabezado "Partida #1" y el campo informativo */}
          {partidas.length === 1 && (
            <div>
              <div className="mb-2">
                <span className="inline-block rounded px-3 py-1 bg-blue-100 text-blue-800 font-semibold text-sm">
                  Partida #1
                </span>
              </div>
              <Label>Partida asociada</Label>
              <Input
                value={`Partida #1 — ${partidas[0].e_id_partida || ""} — ${partidas[0].partida_descripcion || ""}`}
                disabled
                className="bg-gray-100 text-gray-700 cursor-not-allowed"
              />
            </div>
          )}

          {/* Campo de selección del rubro */}
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

          {/* Descripción bloqueada */}
          <div>
            <Label>Descripción</Label>
            <Input
              value={r.rubro_descripcion ?? ""}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* Monto */}
          <div>
            <Label>Monto presupuesto suficiencia</Label>
            <Input
              value={r.p_e_monto_presupuesto_suficiencia ?? ""}
              onChange={(e) => {
                const val = formatMoney(e.target.value);
                setPresupuestosRubro((prev) =>
                  prev.map((x, idx) =>
                    idx === i
                      ? { ...x, p_e_monto_presupuesto_suficiencia: val }
                      : x
                  )
                );
              }}
            />
          </div>
        </Card>
      ))}

      <div className="flex justify-between">
        <Button variant="outline" style={{ backgroundColor: "#10c706", color: "white" }} onClick={addRubro}>
          <PlusCircle className="w-4 h-4 mr-2" /> Nuevo rubro
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)}>
            ← Volver al paso 2
          </Button>
          <Button
            onClick={async () => {
              if (!folio) return alert("No hay folio del proceso anterior");
              try {
                for (const r of presupuestosRubro) {
                  const partidaAsociada =
                    r.p_id_partida_asociada ||
                    (partidas.length === 1 ? partidas[0].e_id_partida : null);

                  if (!partidaAsociada) {
                    alert(
                      `Selecciona una partida para el rubro ${r.rubro_descripcion || r.p_e_id_rubro}`
                    );
                    return;
                  }

                  const resp = await fetch(
                    `${API_BASE}/procesos/seguimiento/presupuesto-rubro-ente/`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        p_accion: "NUEVO",
                        p_id_proceso_seguimiento_presupuesto: folio,
                        p_id: 0,
                        p_e_id_rubro: r.p_e_id_rubro,
                        p_e_id_partida_asociada: partidaAsociada,
                        p_e_monto_presupuesto_suficiencia: parseFloat(
                          (r.p_e_monto_presupuesto_suficiencia || "").replace(/[^\d]/g, "") || "0"
                        ),
                      }),
                    }
                  );
                  const data = await resp.json();

                  if (!resp.ok) throw new Error(data.detail || "Error al guardar rubro");
                  // Bloque corregido: agrega todos los campos requeridos cuando data.resultado tiene valor
                  if (data.resultado) {
                    console.log("✅ Rubro guardado correctamente:", {
                      rubro: r.p_e_id_rubro,
                      idGenerado: data.resultado,
                    });

                    setPresupuestosRubro((prev) =>
                      prev.map((x) =>
                        x.p_e_id_rubro === r.p_e_id_rubro
                          ? {
                              ...x,
                              id: data.resultado,
                              p_id_proceso_seguimiento_presupuesto: folio,
                              p_id_proceso_seguimiento_presupuesto_rubro: data.resultado,
                              p_e_id_rubro_partida: data.resultado,
                              // ✅ conservar el id de la partida asociada ya elegido/calculado
                              p_id_partida_asociada: x.p_id_partida_asociada || (partidas.length === 1 ? partidas[0].e_id_partida?.toString() : x.p_id_partida_asociada),
                            }
                          : x
                      )
                    );
                  }
                }

                alert("✅ Rubros guardados correctamente");
                setStep(4); // ⬅️ Avanzar al nuevo paso de Proveedores
              } catch (err) {
                console.error("❌ Error al guardar rubros:", err);
                alert("Error al guardar rubros");
              }
            }}
            style={{ backgroundColor: "#235391", color: "white" }}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}

      {/* Paso 4 */}
      {step === 4 && (
        <Card>
          <CardContent className="space-y-5 mt-4">
            <h1 className="text-2xl font-bold">Paso 4: Presupuesto Proveedor</h1>

            {proveedores.map((prov, i) => (
              <Card key={i} className="p-4 space-y-4 border border-gray-200 relative">
                <div className="mb-2 flex justify-between items-center">
                  <span className="inline-block rounded px-3 py-1 bg-blue-100 text-blue-800 font-semibold text-sm">
                    {`Proveedor #${i + 1}`}
                  </span>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setProveedores(proveedores.filter((_, idx) => idx !== i))}
                    title="Eliminar proveedor"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Oficio de invitación bloqueado */}
                <div>
                  <Label>Oficio de invitación</Label>
                  <Input
                    value={form.oficio_invitacion ?? ""}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                </div>

                {/* Select Rubro/Partida */}
                <div>
                  <Label>Seleccionar Rubro y Partida</Label>
                  <select
                    className="border rounded-md p-2 w-full"
                    value={prov.p_e_id_rubro_partida || ""}
                    onChange={(e) => {
                      const updated = [...proveedores];
                      updated[i].p_e_id_rubro_partida = e.target.value;
                      setProveedores(updated);
                    }}
                  >
                    <option value="">Seleccione rubro/partida…</option>
                    {presupuestosRubro.map((r, idx) => {
                      const idValido = r.id || r.p_id_proceso_seguimiento_presupuesto_rubro || 0;

                      // ✅ Resolver la partida asociada: si solo hay una, úsala; si hay varias, busca por el id guardado en r.p_id_partida_asociada
                      const partidaAsociada =
                        partidas.length === 1
                          ? partidas[0]
                          : partidas.find((p) => String(p.e_id_partida) === String(r.p_id_partida_asociada));

                      let textoPartida: string;
                      if (partidaAsociada) {
                        const idxPartida =
                          partidas.length === 1 ? 0 : Math.max(0, partidas.findIndex((p) => p === partidaAsociada));
                        textoPartida = `Partida #${idxPartida + 1} — ${partidaAsociada.e_id_partida} — ${partidaAsociada.partida_descripcion}`;
                      } else {
                        textoPartida = "Partida no encontrada";
                      }

                      return (
                        <option key={`${r.p_e_id_rubro}-${idValido}`} value={idValido}>
                          {textoPartida} | Rubro {r.p_e_id_rubro} — {r.rubro_descripcion}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* RFC del proveedor */}
                <div>
                  <Label>RFC del proveedor</Label>
                  <Command>
                    <CommandInput
                      placeholder="Escribe RFC, razón social o nombre comercial…"
                      value={prov.e_rfc_proveedor || ""}
                      onValueChange={async (val) => {
                        const updated = [...proveedores];
                        updated[i].e_rfc_proveedor = val;
                        setProveedores(updated);

                        try {
                          const resp = await fetch(`${API_BASE}/catalogos/proveedor/?p_rfc=-99`);
                          const data = await resp.json();
                          if (Array.isArray(data)) {
                            const filtered = data.filter((p: any) => {
                              const search = val.toLowerCase();
                              return (
                                p.rfc?.toLowerCase().includes(search) ||
                                p.razon_social?.toLowerCase().includes(search) ||
                                p.nombre_comercial?.toLowerCase().includes(search) ||
                                p.correo_electronico?.toLowerCase().includes(search)
                              );
                            });
                            setProveedores((prev) => {
                              const copy = [...prev];
                              copy[i].filtered = filtered;
                              return copy;
                            });
                          }
                        } catch (err) {
                          console.error("Error cargando proveedores", err);
                        }
                      }}
                      className={`${prov.error ? "border border-red-500" : ""}`}
                    />
                    {/* Solo mostrar CommandList si hay resultados filtrados */}
                    {prov.filtered && prov.filtered.length > 0 && (
                      <CommandList>
                        {prov.filtered.map((p: any) => (
                          <CommandItem
                            key={p.rfc}
                            onSelect={() => {
                              const updated = [...proveedores];
                              updated[i] = {
                                ...prov,
                                e_rfc_proveedor: p.rfc,
                                razon_social: p.razon_social,
                                nombre_comercial: p.nombre_comercial,
                                persona_juridica: p.persona_juridica,
                                correo_electronico: p.correo_electronico,
                                entidad_federativa: p.entidad_federativa,
                                filtered: null, // Evita mostrar “No se encontraron proveedores” después de seleccionar
                              };
                              setProveedores(updated);
                            }}
                          >
                            {p.rfc} — {p.nombre_comercial || p.razon_social}
                          </CommandItem>
                        ))}
                      </CommandList>
                    )}
                  </Command>
                </div>

                {/* Datos del proveedor bloqueados */}
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label>Razón social</Label>
                    <Input value={prov.razon_social || ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>Nombre comercial</Label>
                    <Input value={prov.nombre_comercial || ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-2">
                  <div>
                    <Label>Persona jurídica</Label>
                    <Input value={prov.persona_juridica || ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>Correo electrónico</Label>
                    <Input value={prov.correo_electronico || ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                  </div>
                  <div>
                    <Label>Entidad federativa</Label>
                    <Input value={prov.entidad_federativa || ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
                  </div>
                </div>

                {/* Importe sin IVA y total con IVA lado a lado */}
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label>Importe sin IVA</Label>
                    <Input
                      value={prov.e_importe_sin_iva || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        const formatted = val ? "$" + parseInt(val).toLocaleString("es-MX") : "";
                        const updated = [...proveedores];
                        updated[i].e_importe_sin_iva = formatted;
                        updated[i].e_importe_total = formatted
                          ? "$" + (parseInt(val) * 1.16).toLocaleString("es-MX", { minimumFractionDigits: 2 })
                          : "";
                        setProveedores(updated);
                      }}
                      placeholder="$0.00"
                      className={`${!prov.e_rfc_proveedor ? "border-red-500" : ""}`}
                    />
                  </div>

                  <div>
                    <Label>Importe total con IVA (16%)</Label>
                    <Input
                      value={prov.e_importe_total || ""}
                      disabled
                      className="bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>

              </Card>
            ))}

            {/* Botón nuevo proveedor */}
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                style={{ backgroundColor: "#10c706", color: "white" }}
                onClick={() =>
                  setProveedores([
                    ...proveedores,
                    {
                      e_rfc_proveedor: "",
                      razon_social: "",
                      nombre_comercial: "",
                      persona_juridica: "",
                      correo_electronico: "",
                      entidad_federativa: "",
                      e_importe_sin_iva: "",
                      e_importe_total: "",
                      p_e_id_rubro_partida: "",
                    },
                  ])
                }
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Nuevo proveedor
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  ← Volver al paso 3
                </Button>
                <Button
                  style={{ backgroundColor: "#235391", color: "white" }}
                  onClick={async () => {
                    if (!folio) return alert("No hay folio de proceso");

                    // 🚫 Validación: verificar que todos los proveedores tengan RFC
                    const proveedoresInvalidos = proveedores.filter(
                      (p) => !p.e_rfc_proveedor?.trim()
                    );
                    if (proveedoresInvalidos.length > 0) {
                      setProveedores((prev) =>
                        prev.map((p) =>
                          !p.e_rfc_proveedor?.trim()
                            ? { ...p, error: true }
                            : { ...p, error: false }
                        )
                      );
                      return; // Evita guardar si hay proveedores sin RFC
                    }

                    try {
                      console.log("📊 Estado actual de presupuestosRubro:", presupuestosRubro);

                      // 🚫 Validar duplicados antes de guardar
                      const duplicados = proveedores.filter(
                        (p, idx, arr) =>
                          arr.findIndex(
                            (x) =>
                              x.e_rfc_proveedor === p.e_rfc_proveedor &&
                              x.p_e_id_rubro_partida === p.p_e_id_rubro_partida
                          ) !== idx
                      );

                      if (duplicados.length > 0) {
                        alert("⚠️ No se puede guardar. Hay proveedores duplicados con el mismo rubro.");
                        return;
                      }

                      for (const prov of proveedores) {
                        if (!prov.e_rfc_proveedor) continue;

                        // 🔹 Obtener el rubro vinculado al proceso actual
                        const rubroRelacionado = presupuestosRubro.find(
                          (r: any) => r.p_id_proceso_seguimiento_presupuesto === folio
                        );

                        
                        const idRubroValido = rubroRelacionado?.id || 0;

                        console.log("🧩 Proveedor:", prov.e_rfc_proveedor);
                        console.log("➡️ ID de rubro válido:", idRubroValido);

                        if (!idRubroValido || idRubroValido === 0) {
                          alert(
                            `⚠️ No se encontró un rubro válido para el proveedor ${prov.e_rfc_proveedor}.`
                          );
                          continue;
                        }

                        // Log de depuración del payload a enviar
                        console.log("📤 Enviando payload al backend:", {
                          p_accion: "NUEVO",
                          p_id_proceso_seguimiento_presupuesto: folio,
                          p_id_proceso_seguimiento_presupuesto_rubro: idRubroValido,
                          p_id: 0,
                          p_e_rfc_proveedor: prov.e_rfc_proveedor,
                          p_e_importe_sin_iva: parseFloat(
                            (prov.e_importe_sin_iva || "").replace(/[^\d]/g, "") || "0"
                          ),
                          p_e_importe_total: parseFloat(
                            (prov.e_importe_total || "").replace(/[^\d]/g, "") || "0"
                          ),
                          p_r_importe_ajustado_sin_iva: 0,
                          p_r_importe_ajustado_total: 0,
                        });
                        
                        const resp = await fetch(
                          `${API_BASE}/procesos/seguimiento/presupuesto-proveedor/`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              p_accion: "NUEVO",
                              p_id_proceso_seguimiento_presupuesto: folio,
                              p_id_proceso_seguimiento_presupuesto_rubro: idRubroValido,
                              p_id: 0,
                              p_e_rfc_proveedor: prov.e_rfc_proveedor,
                              p_e_importe_sin_iva: parseFloat(
                                (prov.e_importe_sin_iva || "").replace(/[^\d]/g, "") || "0"
                              ),
                              p_e_importe_total: parseFloat(
                                (prov.e_importe_total || "").replace(/[^\d]/g, "") || "0"
                              ),
                              p_r_importe_ajustado_sin_iva: 0,
                              p_r_importe_ajustado_total: 0,
                            }),
                          }
                        );

                        const data = await resp.json();

                        if (!resp.ok) {
                          const msg =
                            typeof data.detail === "string"
                              ? data.detail
                              : JSON.stringify(data.detail || data) ||
                                "Error al guardar proveedor";
                          console.error("❌ Error guardando proveedor:", msg);
                          throw new Error(msg);
                        }

                        console.log("✅ Proveedor guardado correctamente:", {
                          proveedor: prov.e_rfc_proveedor,
                          rubroUsado: idRubroValido,
                          respuesta: data,
                        });
                      }

                      alert("✅ Todos los proveedores guardados correctamente");
                      router.push("/dashboard");
                    } catch (err) {
                      console.error("❌ Error al guardar proveedores:", err);
                      alert("Error al guardar proveedores");
                    }
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}