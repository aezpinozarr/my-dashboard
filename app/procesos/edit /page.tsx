

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Eye, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

/* ========================================
   🔹 Configuración del backend
======================================== */
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

/* ========================================
   🔹 Utilidades
======================================== */
function formatDateDDMMYYYY(raw: string): string {
  if (!raw) return "";
  // Si viene un ISO (yyyy-mm-dd), formatear
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.substring(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
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
  if (!raw) return "";
  // Si viene un ISO, extraer hh:mm
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const t = raw.split("T")[1]?.slice(0,5) ?? "";
    return t;
  }
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

/* ========================================
   🔹 Step Indicator (sólo paso 1 activo)
======================================== */
function StepIndicator() {
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
          const isActive = step.id === 1;
          const isCompleted = false;
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
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========================================
   🔹 Tipos
======================================== */
interface FormData {
  oficio_invitacion: string;
  servidor_publico_cargo: string;
  tipo_evento: string;
  tipo_licitacion: string;
  tipo_licitacion_notas: string; // aquí usas el número de sesión
  fecha: string;
  hora: string;
}

export default function EditProcesoPaso1Page() {
  const { user } = useUser();
  const router = useRouter();
  const params = useSearchParams();
  const seguimientoId = params.get("id"); // /procesos/edit?id=123

  const [loading, setLoading] = React.useState(false);
  const [errores, setErrores] = React.useState<Record<string, string>>({});

  // Catálogos / datos
  const [enteDescripcion, setEnteDescripcion] = React.useState("");
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [servidorSeleccionado, setServidorSeleccionado] = React.useState<any>(null);
  const [tiposEvento, setTiposEvento] = React.useState<any[]>([]);
  const [tiposLicitacion, setTiposLicitacion] = React.useState<any[]>([]);
  const [numerosSesion, setNumerosSesion] = React.useState<any[]>([]);
  const [sesionSeleccionada, setSesionSeleccionada] = React.useState<any>(null);

  const [busquedaServidor, setBusquedaServidor] = React.useState("");
  const [mostrarServidores, setMostrarServidores] = React.useState(true);

  const [busquedaSesion, setBusquedaSesion] = React.useState("");
  const [mostrarSesiones, setMostrarSesiones] = React.useState(true);

  // Dialogs añadir / ver servidores
  const [verServidoresDialogOpen, setVerServidoresDialogOpen] = React.useState(false);
  const [addServidorDialogOpen, setAddServidorDialogOpen] = React.useState(false);
  const [nuevoServidorNombre, setNuevoServidorNombre] = React.useState("");
  const [nuevoServidorCargo, setNuevoServidorCargo] = React.useState("");
  const [addServidorLoading, setAddServidorLoading] = React.useState(false);

  const [form, setForm] = React.useState<FormData>({
    oficio_invitacion: "",
    servidor_publico_cargo: "",
    tipo_evento: "",
    tipo_licitacion: "",
    tipo_licitacion_notas: "",
    fecha: "",
    hora: "",
  });

  // ================================
  // Cargar catálogos base
  // ================================
  React.useEffect(() => {
    (async () => {
      try {
        // Ente
        if (user?.id_ente) {
          const enteResp = await fetch(`${API_BASE}/catalogos/entes?p_id=${user.id_ente}&p_descripcion=-99&p_activo=-99`);
          const enteData = await enteResp.json();
          setEnteDescripcion(enteData?.[0]?.descripcion || "—");
        }
        // Servidores por ente
        if (user?.id_ente) {
          const sResp = await fetch(
            `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user.id_ente}`
          );
          setServidores(await sResp.json());
        }
        // Tipos de evento
        const tResp = await fetch(`${API_BASE}/procesos/tipos-evento/`);
        setTiposEvento(await tResp.json());
        // Numeros de sesión
        const nResp = await fetch(`${API_BASE}/catalogos/sesiones-numeros/`);
        setNumerosSesion(await nResp.json());
      } catch (err) {
        console.error("❌ Error catálogos:", err);
      }
    })();
  }, [user?.id_ente]);

  // ================================
  // Cargar seguimiento existente
  // ================================
  React.useEffect(() => {
    if (!seguimientoId) return;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/procesos/seguimiento?p_id=${seguimientoId}&p_id_ente=-99`);
        const arr = await resp.json();
        const row = Array.isArray(arr) ? arr[0] : null;
        if (!row) {
          toast.error("No se encontró el seguimiento.");
          return;
        }

        // Preseleccionar servidor si coincide
        let servidor = null;
        if (row.e_id_servidor_publico_emite) {
          servidor = { id: row.e_id_servidor_publico_emite, nombre: row.servidor_publico_emite, cargo: row.e_servidor_publico_cargo };
          setServidorSeleccionado(servidor);
          setBusquedaServidor(row.servidor_publico_emite || "");
        }

        // Preseleccionar número de sesión (tipo_licitacion_no_veces) en el command
        let sesion = null;
        if (row.e_tipo_licitacion_no_veces) {
          const match = (numerosSesion || []).find((x:any) => String(x.id) === String(row.e_tipo_licitacion_no_veces));
          sesion = match || { id: row.e_tipo_licitacion_no_veces, descripcion: row.tipo_licitacion_no_veces_descripcion || String(row.e_tipo_licitacion_no_veces) };
          setSesionSeleccionada(sesion);
          setBusquedaSesion(sesion.descripcion || "");
        }

        setForm({
          oficio_invitacion: row.e_oficio_invitacion || "",
          servidor_publico_cargo: row.e_servidor_publico_cargo || "",
          tipo_evento: row.e_tipo_evento || "",
          tipo_licitacion: row.e_tipo_licitacion || "",
          tipo_licitacion_notas: row.e_tipo_licitacion_notas || "",
          fecha: formatDateDDMMYYYY(row.e_fecha_y_hora_reunion || row.r_fecha_y_hora_reunion || ""),
          hora: formatTimeHHMM(row.e_fecha_y_hora_reunion || row.r_fecha_y_hora_reunion || ""),
        });
      } catch (err) {
        console.error("❌ Error al cargar seguimiento:", err);
        toast.error("Error al cargar el seguimiento.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seguimientoId, JSON.stringify(numerosSesion)]);

  // Cuando cambia tipo_evento, cargar auxiliares -> tipos_licitacion
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

  // ================================
  // Guardar (EDITAR) Paso 1
  // ================================
  const handleGuardarPaso1 = async () => {
    if (!seguimientoId) {
      toast.warning("Falta el parámetro ?id del seguimiento.");
      return;
    }

    const requiredFields: (keyof FormData)[] = [
      "oficio_invitacion",
      "servidor_publico_cargo",
      "tipo_evento",
      "tipo_licitacion",
      "fecha",
      "hora",
    ];
    const newErrors: Record<string, string> = {};
    requiredFields.forEach((f) => {
      if (!form[f]) newErrors[f] = "Este campo es obligatorio";
    });
    if (!servidorSeleccionado) newErrors.servidor_publico_cargo = "Este campo es obligatorio";
    if (!sesionSeleccionada) newErrors.tipo_licitacion_notas = "Este campo es obligatorio";
    if (form.fecha && !isValidDateDDMMYYYY(form.fecha)) newErrors.fecha = "Fecha inválida";
    if (form.hora && !isValidTimeHHMM(form.hora)) newErrors.hora = "Hora inválida";

    if (Object.keys(newErrors).length > 0) {
      setErrores(newErrors);
      return;
    }
    setErrores({});

    const fechaHora = toIsoLocalDateTime(form.fecha, form.hora);

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: "EDITAR",
          p_id: Number(seguimientoId),
          p_e_id_ente: String(user?.id_ente || ""),
          p_e_oficio_invitacion: form.oficio_invitacion,
          p_e_id_servidor_publico_emite: Number(servidorSeleccionado.id),
          p_e_servidor_publico_cargo: form.servidor_publico_cargo,
          p_e_tipo_licitacion: form.tipo_licitacion,
          p_e_tipo_licitacion_no_veces: Number(sesionSeleccionada.id),
          p_e_tipo_licitacion_notas: form.tipo_licitacion_notas,
          p_e_fecha_y_hora_reunion: fechaHora,
          p_e_id_usuario_registra: user?.id ?? 0,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error("⚠️ Backend error:", data);
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      toast.success("Paso 1 actualizado correctamente.");
      // Puedes redirigir al paso 2 de edición cuando lo tengamos:
      // router.push(`/procesos/edit/partidas?id=${seguimientoId}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el paso 1.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <StepIndicator />

      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="outline">
          <Link href="/procesos">←</Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar — Paso 1: Oficio de invitación</h1>
      </div>

      <Card>
        <CardContent className="space-y-5 mt-4">
          <div>
            <Label>Folio seguimiento</Label>
            <Input value={seguimientoId || ""} disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
          </div>

          <div>
            <Label>Ente</Label>
            <Input
              value={enteDescripcion || "Cargando..."}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
            />
          </div>

          {/* Oficio de invitación + Fecha + Hora */}
          <div className="flex gap-4 flex-wrap md:flex-nowrap">
            <div className="w-full md:w-[60%]">
              <Label>Oficio de invitación</Label>
              <Input
                value={form.oficio_invitacion ?? ""}
                onChange={(e) => setForm({ ...form, oficio_invitacion: e.target.value })}
                placeholder="Ej. OF.123/2025"
                className={`${errores.oficio_invitacion ? "border-red-500" : ""}`}
              />
              {errores.oficio_invitacion && (
                <p className="text-red-600 text-xs mt-1">{errores.oficio_invitacion}</p>
              )}
            </div>

            <div className="w-full md:w-[20%]">
              <Label>Fecha</Label>
              <Input
                value={form.fecha ?? ""}
                onChange={(e) => setForm({ ...form, fecha: formatDateDDMMYYYY(e.target.value) })}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className={`${errores.fecha ? "border-red-500" : ""}`}
              />
              {errores.fecha && (
                <p className="text-red-600 text-xs mt-1">{errores.fecha}</p>
              )}
            </div>

            <div className="w-full md:w-[20%]">
              <Label>Hora (24 Hrs)</Label>
              <Input
                value={form.hora ?? ""}
                onChange={(e) => setForm({ ...form, hora: formatTimeHHMM(e.target.value) })}
                placeholder="HH:MM"
                maxLength={5}
                className={`${errores.hora ? "border-red-500" : ""}`}
              />
              {errores.hora && (
                <p className="text-red-600 text-xs mt-1">{errores.hora}</p>
              )}
            </div>
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

            {/* Botones Ver/Añadir servidores públicos */}
            <div className="flex gap-3 mt-2">
              {/* Ver servidores */}
              <Dialog open={verServidoresDialogOpen} onOpenChange={setVerServidoresDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    type="button"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver servidores públicos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Servidores públicos del ente</DialogTitle>
                    <DialogDescription>
                      Lista de servidores públicos registrados para este ente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-x-auto mt-2">
                    <table className="min-w-full bg-white border border-gray-200 rounded">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b text-left">Nombre</th>
                          <th className="py-2 px-4 border-b text-left">Cargo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servidores
                          .filter((s) => String(s.id_ente) === String(user?.id_ente))
                          .map((s, idx) => (
                            <tr key={s.id || idx}>
                              <td className="py-2 px-4 border-b">{s.nombre}</td>
                              <td className="py-2 px-4 border-b">{s.cargo}</td>
                            </tr>
                          ))}
                        {servidores.filter((s) => String(s.id_ente) === String(user?.id_ente)).length === 0 && (
                          <tr>
                            <td colSpan={2} className="py-2 px-4 text-center text-gray-400">
                              No hay servidores públicos para este ente.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setVerServidoresDialogOpen(false)}>
                      Cerrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Añadir servidor */}
              <Dialog open={addServidorDialogOpen} onOpenChange={setAddServidorDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    type="button"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Añadir servidor público
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Añadir nuevo servidor público</DialogTitle>
                    <DialogDescription>
                      Completa los campos para registrar un nuevo servidor público para este ente.
                    </DialogDescription>
                    <p className="text-sm text-gray-500 mt-1">El servidor se asociará automáticamente al ente al que perteneces.</p>
                  </DialogHeader>
                  <form
                    className="space-y-4 mt-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!nuevoServidorNombre.trim() || !nuevoServidorCargo.trim()) {
                        toast.warning("Por favor ingresa nombre y cargo.");
                        return;
                      }
                      setAddServidorLoading(true);
                      try {
                        const url = `${API_BASE}/catalogos/ente-y-servidor-publico-gestionar-ambos?p_id_ente=${user?.id_ente}&p_nombre=${encodeURIComponent(
                          nuevoServidorNombre
                        )}&p_cargo=${encodeURIComponent(nuevoServidorCargo)}`;
                        const resp = await fetch(url, { method: "POST" });
                        if (!resp.ok) {
                          toast.error("Error al añadir servidor público.");
                          return;
                        }
                        // Refrescar
                        const sResp = await fetch(
                          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user?.id_ente}`
                        );
                        setServidores(await sResp.json());
                        setNuevoServidorNombre("");
                        setNuevoServidorCargo("");
                        setAddServidorDialogOpen(false);
                        toast.success("Servidor público añadido correctamente");
                      } catch (err) {
                        toast.error("Error al añadir servidor público.");
                      } finally {
                        setAddServidorLoading(false);
                      }
                    }}
                  >
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={nuevoServidorNombre}
                        onChange={(e) => setNuevoServidorNombre(e.target.value)}
                        placeholder="Nombre del servidor público"
                      />
                    </div>
                    <div>
                      <Label>Cargo</Label>
                      <Input
                        value={nuevoServidorCargo}
                        onChange={(e) => setNuevoServidorCargo(e.target.value)}
                        placeholder="Cargo del servidor público"
                      />
                    </div>
                    <DialogFooter className="mt-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => setAddServidorDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                        type="submit"
                        disabled={addServidorLoading}
                      >
                        {addServidorLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {errores.servidor_publico_cargo && (
              <p className="text-red-600 text-xs mt-1">{errores.servidor_publico_cargo}</p>
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
            {errores.servidor_publico_cargo && (
              <p className="text-red-600 text-xs mt-1">{errores.servidor_publico_cargo}</p>
            )}
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
                <p className="text-red-600 text-xs mt-1">{errores.tipo_evento}</p>
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
                <p className="text-red-600 text-xs mt-1">{errores.tipo_licitacion}</p>
              )}
            </div>
          </div>

          {/* Número de sesión */}
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
              <p className="text-red-600 text-xs mt-1">{errores.tipo_licitacion_notas}</p>
            )}
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGuardarPaso1}
                    disabled={loading}
                    style={{ backgroundColor: "#235391", color: "white" }}
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar cambios"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Actualiza la información del paso 1</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}