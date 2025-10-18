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
  CommandGroup, // ✅ agregado
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
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
  error?: boolean;
  filteredProvs?: any[];
}

export default function NuevoProcesoPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [errores, setErrores] = React.useState<Record<string, string>>({});
  // Estado global para errores visuales de partidas (paso 2)
  const [erroresPartida, setErroresPartida] = React.useState<Record<string, string>>({});

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
  const [folioSeguimiento, setFolioSeguimiento] = React.useState<number | null>(null);

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
  const [nuevoRubro, setNuevoRubro] = React.useState({
    p_e_id_rubro: "",
    rubro_descripcion: "",
    p_e_monto_presupuesto_suficiencia: "",
    p_id_partida_asociada: "",
  });
  const [presupuestosRubro, setPresupuestosRubro] = React.useState<any[]>([
    {
      p_e_id_rubro: "",
      rubro_descripcion: "",
      p_e_monto_presupuesto_suficiencia: "",
      p_id_partida_asociada: "",
    },
  ]);

  // Paso 4: Proveedores añadidos
  const [proveedores, setProveedores] = React.useState<any[]>([]);
  // Paso 4: Catálogo de proveedores del backend (solo para búsqueda)
  const [catalogoProveedores, setCatalogoProveedores] = React.useState<any[]>([]);
  // Paso 4 - errores de proveedor
  const [erroresProveedor, setErroresProveedor] = React.useState<Record<string, string>>({});


  // Paso 4: Cargar todos los proveedores al entrar al paso 4 (solo catálogo de backend)
  React.useEffect(() => {
    if (step === 4) {
      (async () => {
        try {
          const resp = await fetch(`${API_BASE}/catalogos/proveedor/?p_rfc=-99`);
          const data = await resp.json();
          setCatalogoProveedores(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Error al cargar proveedores:", err);
        }
      })();
    }
  }, [step]);

  // Paso 4: Ref para RFC input
  const rfcInputRef = React.useRef<any>(null);

  // Paso 4: Atajo de teclado Ctrl+S / Cmd+S para finalizar proceso
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 4 && ((e.ctrlKey && e.key === "s") || (e.metaKey && e.key === "s"))) {
        e.preventDefault();
        handleFinalizarProceso();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Paso 4: Finalizar proceso handler (simplificado, solo toast, sin validaciones visuales ni backend)
  const handleFinalizarProceso = React.useCallback(async () => {
    console.log("🔍 Validando proveedores antes de finalizar...");

    // ✅ Permitir finalizar si ya hay al menos un proveedor añadido
    if (proveedores.length > 0) {
      console.log("✅ Ya existe al menos un proveedor añadido:", proveedores);
      toast.success("Proceso finalizado correctamente.");
      router.push("/procesos");
      return;
    }

    // 🧩 Validación rápida adicional (por si los datos aún no se actualizaron)
    const yaAgregoProveedor = proveedores.some(
      (p) => p && p.e_rfc_proveedor && p.e_importe_sin_iva
    );
    if (yaAgregoProveedor) {
      console.log("✅ Proveedor válido detectado.");
      toast.success("Proceso finalizado correctamente.");
      router.push("/procesos");
      return;
    }

    // ⚠️ Si no hay proveedores, solo mostrar toast de advertencia (sin marcar campos)
    toast.warning("Debes añadir al menos un proveedor antes de finalizar.");
  }, [proveedores, router]);

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
    // Incluye todos los campos requeridos
    const requiredFields = [
      "oficio_invitacion",
      "servidor_publico_cargo",
      "tipo_evento",
      "tipo_licitacion",
      "fecha",
      "hora",
    ];
    const newErrors: any = {};

    // Verificar campos vacíos (mensaje uniforme)
    (requiredFields as Array<keyof FormData>).forEach((field) => {
      if (!form[field]) newErrors[field as string] = "Este campo es obligatorio";
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
    if (!user) return;

    // Detectar si es edición o nuevo
    const accion = folio ? "EDITAR" : "NUEVO";
    const idProceso = folio || 0;

    const fechaHora = toIsoLocalDateTime(form.fecha, form.hora);
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: accion,
          p_id: idProceso,
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
      console.log("📘 Resultado backend Paso 1 (guardar oficio):", data);
      if (data?.resultado) {
        setFolioSeguimiento(data.resultado);
        console.log("✅ ID de seguimiento asignado:", data.resultado);
      } else {
        console.warn("⚠️ El backend no devolvió un resultado válido:", data);
      }
      if (!resp.ok) {
        console.error("⚠️ Backend error:", data);
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail || data)
        );
      }

      setFolio(data.resultado);
      // ✅ Reiniciar pasos dependientes al actualizar el folio
      setPartidas([
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
      ]);
      setPresupuestosRubro([]);
      setProveedores([]);
      toast.success("Paso 1 guardado correctamente");
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
        // ✅ Si ya existe un folio, consultar las partidas registradas previamente
        if (folio) {
          try {
            const res = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                p_accion: "CONSULTAR",
                p_id_seguimiento: folio,
                p_e_id_partida: -99,
              }),
            });
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setPartidas(data);
            }
          } catch (err) {
            console.error("❌ Error al recargar partidas existentes:", err);
          }
        }
      } catch (err) {
        console.error("❌ Error al cargar catálogos del paso 2:", err);
      }
    })();
  }, [step]);

  /* ========================================
     🔹 Guardar Paso 2 (envía montos al paso 3)
  ======================================== */
  /* ========================================
     🔹 Guardar Paso 2 (envía montos al paso 3)
  ======================================== */
  const handleGuardarPartidas = async () => {
    // Validación de campos obligatorios en cada partida
    const tieneCamposVacios = partidas.some(
      (p) =>
        !p.e_no_requisicion ||
        !p.e_id_partida ||
        !p.e_id_fuente_financiamiento
    );
    if (tieneCamposVacios) {
      toast.warning(
        "Por favor completa todos los campos obligatorios en cada partida antes de continuar."
      );
      return;
    }
    try {
      // ✅ Forzar obtención del folio desde sessionStorage si aún no está en el estado
      const folioGuardado =
        folioSeguimiento || Number(sessionStorage.getItem("folioSeguimiento"));

      if (!folioGuardado) {
        console.error("⚠️ No hay folio de seguimiento disponible");
        toast.info("Primero debes completar el Paso 1 antes de continuar.");
        return;
      }

      console.log("📘 Usando folio de seguimiento para guardar partidas:", folioGuardado);

      for (const p of partidas) {
        // 🔍 Verificar si la partida ya existe en BD usando POST CONSULTAR
        const checkResp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_accion: "CONSULTAR",
            p_id_seguimiento: folioGuardado,
            p_e_id_partida: p.e_id_partida,
          }),
        });
        const existente = await checkResp.json();

        // Si el backend devuelve un registro existente, usar su id
        const idExistente = Array.isArray(existente) && existente.length > 0 ? existente[0].id : null;

        // Decidir acción y id
        const accion = idExistente ? "EDITAR" : "NUEVO";
        const idRegistro = idExistente || 0;

        // 🧹 Limpiar y formatear los datos a enviar antes del fetch
        const payload = {
          p_accion: String(accion).toUpperCase(),
          p_id_seguimiento: folioGuardado,
          p_id: Number(idRegistro) || 0,
          p_e_no_requisicion: String(p.e_no_requisicion ?? "").trim(),
          p_e_id_partida: String(p.e_id_partida ?? "").trim(),
          p_e_id_fuente_financiamiento: String(p.e_id_fuente_financiamiento ?? "").trim(),
        };

        // Log de los datos a enviar
        console.log("📦 Enviando payload a backend (partida-ente):", payload);

        // Enviar al SP con la acción correcta
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await resp.json();
        if (!resp.ok) {
          console.error("❌ Error detallado del backend:", data);
          const mensajeError =
            Array.isArray(data.detail)
              ? data.detail.map((d: any) => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
              : data.detail || "Error al guardar presupuesto";
          throw new Error(mensajeError);
        }

        // Si fue nuevo o editado correctamente, guarda el id en el estado
        if (data.resultado) {
          setPartidas((prev) =>
            prev.map((x) =>
              x.e_id_partida === p.e_id_partida ? { ...x, id: data.resultado } : x
            )
          );
        }
      }

      toast.success("Presupuesto guardado correctamente");
      setStep(3);
    } catch (err) {
      console.error("❌ Error al guardar presupuesto:", err);
      toast.error("Error al guardar presupuesto");
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
        // Trae todos los registros de partida-ente del proceso usando POST CONSULTAR
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_accion: "CONSULTAR",
            p_id_seguimiento: folio,
            p_e_id_partida: -99,
          }),
        });
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
  // Errores para el formulario de rubros
  const [erroresRubro, setErroresRubro] = React.useState<Record<string, string>>({});
  const handleGuardarRubros = async () => {
    const nuevosErrores: Record<string, string> = {};

    if (presupuestosRubro.length === 0) {
      if (!nuevoRubro.p_id_partida_asociada)
        nuevosErrores.p_id_partida_asociada = "Selecciona una partida asociada";
      if (!nuevoRubro.p_e_id_rubro)
        nuevosErrores.p_e_id_rubro = "El campo de rubro es obligatorio";
      if (!nuevoRubro.p_e_monto_presupuesto_suficiencia)
        nuevosErrores.p_e_monto_presupuesto_suficiencia = "Debes ingresar un monto válido";
    }

    setErroresRubro(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      toast.warning("Por favor completa todos los campos antes de continuar o añade al menos un rubro.");
      return; // ❌ Evita avanzar al siguiente paso si no hay rubros añadidos
    }

    // ✅ Si ya hay rubros o se completaron los campos, permitir avanzar
    setStep(4);
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
                    <p className="text-red-600 text-xs mt-1">{errores.oficio_invitacion}</p>
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
                    <p className="text-red-600 text-xs mt-1">{errores.tipo_licitacion_notas}</p>
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
                      <p className="text-red-600 text-xs mt-1">{errores.fecha}</p>
                    )}
                  </div>
                  <div>
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
                          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Siguiente"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Guarda la información y avanza al paso 2</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </>
      )}

      {/* Paso 2 */}
      {step === 2 && (() => {
        // Reemplaza handleGuardarPartidas con validación visual (usando erroresPartida/setErroresPartida global)
        const handleGuardarPartidasValidado = async () => {
          // Validación visual de campos obligatorios en cada partida
          const nuevosErrores: Record<string, string> = {};
          partidas.forEach((p, i) => {
            if (!p.e_no_requisicion) {
              nuevosErrores[`requisicion-${i}`] = "Este campo es obligatorio";
            }
            if (!p.e_id_partida) {
              nuevosErrores[`partida-${i}`] = "Este campo es obligatorio";
            }
            if (!p.e_id_fuente_financiamiento) {
              nuevosErrores[`fuente-${i}`] = "Este campo es obligatorio";
            }
          });
          if (Object.keys(nuevosErrores).length > 0) {
            setErroresPartida(nuevosErrores);
            toast.warning("Por favor completa todos los campos obligatorios antes de continuar.");
            return;
          }
          setErroresPartida({});
          // Lógica original de handleGuardarPartidas
          try {
            const folioGuardado =
              folioSeguimiento || Number(sessionStorage.getItem("folioSeguimiento"));
            if (!folioGuardado) {
              console.error("⚠️ No hay folio de seguimiento disponible");
              toast.info("Primero debes completar el Paso 1 antes de continuar.");
              return;
            }
            console.log("📘 Usando folio de seguimiento para guardar partidas:", folioGuardado);
            for (const p of partidas) {
              // 🔍 Verificar si la partida ya existe en BD usando POST CONSULTAR
              const checkResp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  p_accion: "CONSULTAR",
                  p_id_seguimiento: folioGuardado,
                  p_e_id_partida: p.e_id_partida,
                }),
              });
              const existente = await checkResp.json();
              const idExistente =
                Array.isArray(existente) && existente.length > 0 ? existente[0].id : null;
              const accion = idExistente ? "EDITAR" : "NUEVO";
              const idRegistro = idExistente || 0;
              const payload = {
                p_accion: String(accion).toUpperCase(),
                p_id_seguimiento: folioGuardado,
                p_id: Number(idRegistro) || 0,
                p_e_no_requisicion: String(p.e_no_requisicion ?? "").trim(),
                p_e_id_partida: String(p.e_id_partida ?? "").trim(),
                p_e_id_fuente_financiamiento: String(p.e_id_fuente_financiamiento ?? "").trim(),
              };
              // Log de los datos a enviar
              console.log("📦 Enviando payload a backend (partida-ente):", payload);
              const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await resp.json();
              if (!resp.ok) {
                console.error("❌ Error detallado del backend:", data);
                const mensajeError =
                  Array.isArray(data.detail)
                    ? data.detail.map((d: any) => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
                    : data.detail || "Error al guardar presupuesto";
                throw new Error(mensajeError);
              }
              if (data.resultado) {
                setPartidas((prev) =>
                  prev.map((x) =>
                    x.e_id_partida === p.e_id_partida ? { ...x, id: data.resultado } : x
                  )
                );
              }
            }
            toast.success("Presupuesto guardado correctamente");
            setStep(3);
          } catch (err) {
            console.error("❌ Error al guardar presupuesto:", err);
            toast.error("Error al guardar presupuesto");
          }
        };

        return (
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
                        className={erroresPartida[`requisicion-${i}`] ? "border-red-500" : ""}
                      />
                      {erroresPartida[`requisicion-${i}`] && (
                        <p className="text-red-600 text-xs mt-1">{erroresPartida[`requisicion-${i}`]}</p>
                      )}
                    </div>

                  {/* Partida */}
                  <div>
                    <Label>Partida</Label>
                    <div className={erroresPartida[`partida-${i}`] ? "border border-red-500 rounded-md p-1" : ""}>
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
                    {erroresPartida[`partida-${i}`] && (
                      <p className="text-red-600 text-xs mt-1">{erroresPartida[`partida-${i}`]}</p>
                    )}
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
                    <div className={erroresPartida[`fuente-${i}`] ? "border border-red-500 rounded-md p-1" : ""}>
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
                                  f.descripcion?.toLowerCase().includes(q) ||
                                  f.ramo?.toLowerCase().includes(q) ||
                                  f.fondo?.toLowerCase().includes(q)
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
                    {erroresPartida[`fuente-${i}`] && (
                      <p className="text-red-600 text-xs mt-1">{erroresPartida[`fuente-${i}`]}</p>
                    )}
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

                  </Card>
                );
              })}

              <div className="flex justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Agrega una nueva partida presupuestal</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" onClick={() => setStep(1)}>
                          ← Volver al paso 1
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Regresa al paso anterior</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleGuardarPartidasValidado}
                          style={{ backgroundColor: "#235391", color: "white" }}
                        >
                          Siguiente
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Guarda las partidas y avanza al paso 3</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

    {/* Paso 3 */}
{(() => {
  // Paso 3: Rubros - refs y focus
  const rubroInputRef = React.useRef<any>(null);
  // Atajo de teclado Ctrl+S / Cmd+S para guardar rubros solo en step 3
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 3 && ((e.ctrlKey && e.key === "s") || (e.metaKey && e.key === "s"))) {
        e.preventDefault();
        handleGuardarRubros();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  // Render paso 3
  if (step !== 3) return null;
  return (
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

        {/* Formulario de añadir rubro */}
        <div className="p-4 rounded border border-gray-200 bg-gray-50 mb-4">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              // Focus automático si falta el rubro
              if (!nuevoRubro.p_e_id_rubro) {
                if (rubroInputRef.current && rubroInputRef.current.focus) {
                  rubroInputRef.current.focus();
                }
                toast.warning("Completa los campos antes de añadir el rubro.");
                return;
              }
              if (!nuevoRubro.p_e_monto_presupuesto_suficiencia || !nuevoRubro.p_id_partida_asociada) {
                toast.warning("Completa los campos antes de añadir el rubro.");
                return;
              }

              // 🚫 Validar rubros duplicados
              const existeRubro = presupuestosRubro.some(
                (r) =>
                  r.p_e_id_rubro === nuevoRubro.p_e_id_rubro &&
                  r.p_id_partida_asociada === nuevoRubro.p_id_partida_asociada
              );
              if (existeRubro) {
                toast.warning("Este rubro ya fue añadido a la partida seleccionada.");
                return;
              }

              try {
                // Buscar la partida asociada
                const partidaAsociada = partidas.find(
                  (p) => String(p.e_id_partida) === String(nuevoRubro.p_id_partida_asociada)
                );
                if (!partidaAsociada || !partidaAsociada.id) {
                  toast.warning("La partida asociada no tiene un ID válido.");
                  return;
                }

                // Crear payload para el SP v2
                const payload = {
                  p_accion: "NUEVO",
                  p_id_seguimiento_partida: Number(partidaAsociada.id),
                  p_id: 0,
                  p_e_id_rubro: nuevoRubro.p_e_id_rubro,
                  p_e_monto_presupuesto_suficiencia: parseFloat(
                    (nuevoRubro.p_e_monto_presupuesto_suficiencia || "").replace(/[^\d]/g, "") || "0"
                  ),
                };

                console.log("📦 Enviando nuevo rubro al backend v2:", payload);

                const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-rubro-ente-v2/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(JSON.stringify(data));

                console.log("✅ Rubro guardado en BD:", data);

                // Refrescar localmente la tabla
                setPresupuestosRubro((prev) => [
                  ...prev,
                  {
                    ...nuevoRubro,
                    id: data.resultado,
                  },
                ]);

                // Mantener la partida seleccionada (no reiniciar)
                setNuevoRubro((prev) => ({
                  ...prev,
                  p_e_id_rubro: "",
                  rubro_descripcion: "",
                  p_e_monto_presupuesto_suficiencia: "",
                }));

                toast.success("Rubro añadido correctamente");
              } catch (err) {
                console.error("❌ Error al añadir rubro:", err);
                toast.error("Error al añadir rubro");
              }
            }}
          >
            {/* Partida asociada */}
            <div className="w-full md:col-span-3">
              <Label>Partida asociada</Label>
              <select
                className={`border rounded-md p-2 w-full ${erroresRubro.p_id_partida_asociada ? "border-red-500" : ""}`}
                value={nuevoRubro.p_id_partida_asociada}
                onChange={(e) =>
                  setNuevoRubro((prev) => ({
                    ...prev,
                    p_id_partida_asociada: e.target.value,
                  }))
                }
              >
                <option value="">Seleccione partida...</option>
                {partidas.map((p, idx) => (
                  <option key={p.e_id_partida || idx} value={p.e_id_partida}>
                    {`Partida #${idx + 1} — ${p.e_id_partida} — ${p.partida_descripcion}`}
                  </option>
                ))}
              </select>
              {erroresRubro.p_id_partida_asociada && (
                <p className="text-red-600 text-xs mt-1">{erroresRubro.p_id_partida_asociada}</p>
              )}
            </div>
            {/* 🔹 Rubro y Monto en la misma fila con proporciones 70/30 */}
            <div className="flex gap-4">
              {/* Campo de Rubro (70%) */}
              <div className="w-[70%]">
                <Label>Rubro</Label>
                <Command>
                  <CommandInput
                    ref={rubroInputRef}
                    placeholder="Escribe ID o nombre…"
                    value={nuevoRubro.p_e_id_rubro}
                    onValueChange={val => {
                      setNuevoRubro(prev => ({
                        ...prev,
                        p_e_id_rubro: val,
                        rubro_descripcion: "",
                      }));
                    }}
                  />
                  {Boolean((nuevoRubro.p_e_id_rubro || "").trim()) && (
                    <CommandList>
                      {rubros
                        .filter((rb) => {
                          const q = (nuevoRubro.p_e_id_rubro || "").toLowerCase();
                          return (
                            rb.id?.toString().toLowerCase().includes(q) ||
                            rb.descripcion?.toLowerCase().includes(q)
                          );
                        })
                        .map((rb) => (
                          <CommandItem
                            key={rb.id}
                            onSelect={() =>
                              setNuevoRubro(prev => ({
                                ...prev,
                                p_e_id_rubro: rb.id,
                                rubro_descripcion: rb.descripcion,
                              }))
                            }
                          >
                            {rb.id} — {rb.descripcion}
                          </CommandItem>
                        ))}
                      <CommandEmpty>No se encontraron rubros</CommandEmpty>
                    </CommandList>
                  )}
                </Command>
                {erroresRubro.p_e_id_rubro && (
                  <p className="text-red-600 text-xs mt-1">{erroresRubro.p_e_id_rubro}</p>
                )}
              </div>

              {/* Campo de Monto (30%) */}
              <div className="w-[30%]">
                <Label>Monto presupuesto suficiencia</Label>
                <Input
                  value={nuevoRubro.p_e_monto_presupuesto_suficiencia}
                  onChange={e =>
                    setNuevoRubro(prev => ({
                      ...prev,
                      p_e_monto_presupuesto_suficiencia: formatMoney(e.target.value),
                    }))
                  }
                  placeholder="$0.00"
                  className={`w-full ${erroresRubro.p_e_monto_presupuesto_suficiencia ? "border-red-500" : ""}`}
                />
                {erroresRubro.p_e_monto_presupuesto_suficiencia && (
                  <p className="text-red-600 text-xs mt-1">{erroresRubro.p_e_monto_presupuesto_suficiencia}</p>
                )}
              </div>
            </div>
            <div className="md:col-span-3 flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      style={{ backgroundColor: "#10c706", color: "white" }}
                    >
                      Añadir rubro
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Guarda el rubro seleccionado y su monto</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </div>

        {/* Lista de rubros añadidos */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-center">Partida asociada</th>
                <th className="py-2 px-4 border-b text-center">Clave</th>
                <th className="py-2 px-4 border-b text-center">Rubro</th>
                <th className="py-2 px-4 border-b text-left">Monto</th>
                <th className="py-2 px-4 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {presupuestosRubro.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-3">No hay rubros añadidos.</td>
                </tr>
              )}
              {presupuestosRubro.map((r, i) => (
                <tr key={i}>
                  <td className="py-2 px-4 border-b">
                    {(() => {
                      const partida = partidas.find(
                        (p) => String(p.e_id_partida) === String(r.p_id_partida_asociada)
                      );
                      return partida
                        ? `Partida #${partidas.indexOf(partida) + 1} — ${partida.e_id_partida} — ${partida.partida_descripcion}`
                        : "Sin asignar";
                    })()}
                  </td>
                  <td className="py-2 px-4 border-b">{r.p_e_id_rubro}</td>
                  <td className="py-2 px-4 border-b">{r.rubro_descripcion}</td>
                  <td className="py-2 px-4 border-b">{r.p_e_monto_presupuesto_suficiencia}</td>
                  <td className="py-2 px-4 border-b text-right">
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-white hover:bg-red-600 p-2"
                      onClick={async () => {
                        const rubro = presupuestosRubro[i];
                        if (!rubro || !rubro.id) {
                          toast.warning("Este rubro aún no tiene ID en la base de datos.");
                          setPresupuestosRubro((prev) => prev.filter((_, idx) => idx !== i));
                          return;
                        }

                        if (!confirm("¿Seguro que deseas eliminar este rubro?")) return;

                        try {
                          const partidaAsociada = partidas.find(
                            (p) => String(p.e_id_partida) === String(rubro.p_id_partida_asociada)
                          );
                          if (!partidaAsociada || !partidaAsociada.id) {
                            toast.warning("La partida asociada no tiene un ID válido.");
                            return;
                          }

                          const payload = {
                            p_accion: "ELIMINAR",
                            p_id_seguimiento_partida: Number(partidaAsociada.id),
                            p_id: Number(rubro.id),
                          };

                          console.log("🗑️ Eliminando rubro en backend:", payload);

                          const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-rubro-ente-v2/`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });

                          const data = await resp.json();
                          if (!resp.ok) throw new Error(JSON.stringify(data));

                          toast.success("Rubro eliminado correctamente.");
                          setPresupuestosRubro((prev) => prev.filter((_, idx) => idx !== i));
                        } catch (err) {
                          console.error("❌ Error al eliminar rubro:", err);
                          toast.error("Error al eliminar rubro");
                        }
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between mt-6">
          {/* No "Nuevo rubro" aquí, el formulario está arriba */}
          <span />
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={() => setStep(2)}>
                    ← Volver al paso 2
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Regresa al paso anterior</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGuardarRubros}
                    style={{ backgroundColor: "#235391", color: "white" }}
                  >
                    Siguiente
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Avanza al paso de proveedores</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
})()}

      {/* Paso 4 */}
{step === 4 && (() => {
  return (
    <Card>
      <CardContent className="space-y-5 mt-4">
        <h1 className="text-2xl font-bold">Paso 4: Proveedor</h1>

        {/* Formulario para añadir proveedor */}
        <div className="p-4 rounded border border-gray-200 bg-gray-50 mb-4">
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
            onSubmit={async e => {
              e.preventDefault();

              if (!form.p_e_id_rubro_partida || !form.e_rfc_proveedor.trim() || !form.e_importe_sin_iva) {
                toast.warning("Por favor completa todos los campos obligatorios antes de continuar.");
                return;
              }

              try {
                const existe = proveedores.some(
                  (p) =>
                    p.e_rfc_proveedor === form.e_rfc_proveedor &&
                    p.p_e_id_rubro_partida === form.p_e_id_rubro_partida
                );
                if (existe) {
                  toast.warning("Este proveedor ya fue añadido para ese rubro/partida.");
                  return;
                }

                const idRubroSeleccionado = Number(form.p_e_id_rubro_partida);
                if (!idRubroSeleccionado || Number.isNaN(idRubroSeleccionado)) {
                  toast.warning("Selecciona un rubro/partida válido.");
                  return;
                }

                const payloadProveedor = {
                  p_accion: "NUEVO",
                  p_id_seguimiento_partida_rubro: idRubroSeleccionado,
                  p_id: 0,
                  p_e_rfc_proveedor: form.e_rfc_proveedor,
                  p_e_importe_sin_iva: parseFloat((form.e_importe_sin_iva || "").replace(/[^0-9.]/g, "")) || 0,
                  p_e_importe_total: parseFloat((form.e_importe_total || "").replace(/[^0-9.]/g, "")) || 0,
                };

                const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-rubro-proveedor-ente-v2/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payloadProveedor),
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(JSON.stringify(data));

                toast.success("Proveedor añadido correctamente.");
                setProveedores(prev => [
                  ...prev,
                  {
                    e_rfc_proveedor: form.e_rfc_proveedor,
                    razon_social: form.razon_social,
                    nombre_comercial: form.nombre_comercial,
                    e_importe_sin_iva: form.e_importe_sin_iva,
                    e_importe_total: form.e_importe_total,
                    p_e_id_rubro_partida: form.p_e_id_rubro_partida,
                    id: data.resultado,
                  },
                ]);

                setForm(prev => ({
                  ...prev,
                  e_rfc_proveedor: "",
                  e_importe_sin_iva: "",
                  e_importe_total: "",
                  p_e_id_rubro_partida: prev.p_e_id_rubro_partida,
                }));
              } catch (err) {
                console.error("❌ Error al añadir proveedor:", err);
                toast.error("Error al añadir proveedor");
              }
            }}
          >
            {/* Rubro / Partida */}
            <div className="md:col-span-3">
              <Label>Seleccionar Rubro y Partida</Label>
              <select
                className="border rounded-md p-2 w-full"
                value={form.p_e_id_rubro_partida || ""}
                onChange={e => setForm(prev => ({
                  ...prev,
                  p_e_id_rubro_partida: e.target.value,
                }))}
              >
                <option value="">Seleccione rubro/partida…</option>
                {presupuestosRubro.map((r, idx) => {
                  const idValido = r.id || Number(sessionStorage.getItem("idRubroCreado")) || 0;
                  const partidaAsociada =
                    partidas.find((p) => String(p.e_id_partida) === String(r.p_id_partida_asociada));
                  const textoPartida = partidaAsociada
                    ? `${partidaAsociada.e_id_partida} — ${partidaAsociada.partida_descripcion}`
                    : "Partida no encontrada";
                  return (
                    <option key={`${r.p_e_id_rubro}-${idValido}`} value={idValido}>
                      {textoPartida} | Rubro {r.p_e_id_rubro} — {r.rubro_descripcion}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* RFC del proveedor */}
            <div className="md:col-span-3">
              <Label>RFC del proveedor</Label>
              <Command>
                <CommandInput
                  ref={rfcInputRef}
                  placeholder="Escribe RFC..."
                  value={form.e_rfc_proveedor}
                  onValueChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      e_rfc_proveedor: value,
                    }));
                  }}
                />
                <CommandList>
                  {catalogoProveedores
                    .filter((p) => {
                      const rfc = p.rfc || p.e_rfc_proveedor || "";
                      return rfc.toLowerCase().includes((form.e_rfc_proveedor || "").toLowerCase());
                    })
                    .map((p) => {
                      const rfc = p.rfc || p.e_rfc_proveedor;
                      return (
                        <CommandItem
                          key={rfc}
                          value={rfc}
                          onSelect={() => {
                            setForm((prev) => ({
                              ...prev,
                              e_rfc_proveedor: rfc,
                              razon_social: p.razon_social || "",
                              nombre_comercial: p.nombre_comercial || "",
                            }));
                          }}
                        >
                          {rfc} — {p.razon_social || "—"} — {p.nombre_comercial || "—"}
                        </CommandItem>
                      );
                    })}
                </CommandList>
              </Command>
            </div>

            {/* Importe sin IVA y total */}
            <div className="md:col-span-3 flex items-end gap-2">
              <div className="flex-1">
                <Label>Importe sin IVA</Label>
                <Input
                  value={form.e_importe_sin_iva || ""}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    const amount = digits ? parseInt(digits, 10) : 0;

                    setForm((prev) => ({
                      ...prev,
                      e_importe_sin_iva: digits ? `$${amount.toLocaleString("es-MX")}` : "",
                      e_importe_total: digits
                        ? `$${(amount * 1.16).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "",
                    }));
                  }}
                  placeholder="$0.00"
                />
              </div>

              <div className="flex-1">
                <Label>Importe total con IVA (16%)</Label>
                <Input
                  disabled
                  className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  value={form.e_importe_total || ""}
                />
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      style={{ backgroundColor: "#10c706", color: "white" }}
                      className="h-[38px] px-4 flex-shrink-0"
                    >
                      Añadir proveedor
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Guarda el proveedor y su monto</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </div>

        {/* Tabla de proveedores */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b text-left">Rubro / Partida</th>
                <th className="py-2 px-4 border-b text-left">RFC</th>
                <th className="py-2 px-4 border-b text-left">Razón social</th>
                <th className="py-2 px-4 border-b text-left">Nombre comercial</th>
                <th className="py-2 px-4 border-b text-left">Importe sin IVA</th>
                <th className="py-2 px-4 border-b text-left">Importe total</th>
                <th className="py-2 px-4 border-b text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-3">
                    No hay proveedores añadidos.
                  </td>
                </tr>
              )}
              {proveedores.map((prov, i) => (
                <tr key={i}>
                  <td className="py-2 px-4 border-b">
                    {(() => {
                      const rubro = presupuestosRubro.find(
                        r => String(r.id || Number(sessionStorage.getItem("idRubroCreado")) || 0) === String(prov.p_e_id_rubro_partida)
                      );
                      if (!rubro) return "No asignado";
                      const partidaAsociada =
                        partidas.find((p) => String(p.e_id_partida) === String(rubro.p_id_partida_asociada));
                      const textoPartida = partidaAsociada
                        ? `${partidaAsociada.e_id_partida} — ${partidaAsociada.partida_descripcion}`
                        : "Partida no encontrada";
                      return `${textoPartida} | Rubro ${rubro.p_e_id_rubro} — ${rubro.rubro_descripcion}`;
                    })()}
                  </td>
                  <td className="py-2 px-4 border-b">{prov.e_rfc_proveedor}</td>
                  <td className="py-2 px-4 border-b">{prov.razon_social}</td>
                  <td className="py-2 px-4 border-b">{prov.nombre_comercial}</td>
                  <td className="py-2 px-4 border-b">{prov.e_importe_sin_iva}</td>
                  <td className="py-2 px-4 border-b">{prov.e_importe_total}</td>
                  <td className="py-2 px-4 border-b">
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-white hover:bg-red-600 p-2"
                      onClick={() => {
                        if (confirm("¿Seguro que deseas eliminar este proveedor?")) {
                          setProveedores(prev => prev.filter((_, idx) => idx !== i));
                          toast.success("Proveedor eliminado correctamente.");
                        }
                      }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-start gap-3 mt-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" onClick={() => setStep(3)}>
                  ← Volver al paso 3
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Regresa al paso anterior para revisar los rubros</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  onClick={handleFinalizarProceso}
                >
                  Finalizar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guarda y finaliza el proceso actual</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
                </div>
      </CardContent>
    </Card>
  );
})()} {/* ← cierra el paso 4 */}

    </main>
  );
}