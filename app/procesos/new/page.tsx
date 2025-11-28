"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
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
import { Loader2, PlusCircle, Trash2, Eye, UserPlus } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";



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
  rubro_partida_texto?: string;
  error?: boolean;
  filteredProvs?: any[];
}


interface Proveedor {
  rfc: string;
  razon_social: string;
  correo_electronico: string;
  entidad_federativa: string;
}

interface ServidorPublico {
  id: number;
  nombre: string;
  cargo: string;
  id_ente: number;
}
export default function NuevoProcesoPage() {
  const { user } = useUser();
  const [openSalirDialog, setOpenSalirDialog] = useState(false);
  const params = useSearchParams();   // ← AQUÍ SE DEFINE params ✔

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

  const from = params.get("from"); // "dashboard" o null
  const router = useRouter();
  const [step, setStep] = React.useState<number>(1);
  const [loading, setLoading] = React.useState(false);
  const [errores, setErrores] = React.useState<Record<string, string>>({});
  // Estado global para errores visuales de partidas (paso 2)
  const [erroresPartida, setErroresPartida] = React.useState<Record<string, string>>({});
  
  const handleBotonSuperior = () => {
  if (step === 1) {
    handleGuardarPaso1();
  } else {
    setStep(step + 1);
  }
};
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

  // Paso 1: Dialogos y formulario para servidores públicos
  const [verServidoresDialogOpen, setVerServidoresDialogOpen] = React.useState(false);
  const [addServidorDialogOpen, setAddServidorDialogOpen] = React.useState(false);
  const [nuevoServidorNombre, setNuevoServidorNombre] = React.useState("");
  const [nuevoServidorCargo, setNuevoServidorCargo] = React.useState("");
  const [addServidorLoading, setAddServidorLoading] = React.useState(false);

  // Paso 2
  const [fuentes, setFuentes] = React.useState<any[]>([]);
  const [catalogoPartidas, setCatalogoPartidas] = React.useState<any[]>([]);
  const [partidas, setPartidas] = React.useState<any[]>([]);
  // Estado para habilitar o no el botón "Nueva partida"
  const [puedeAgregarPartida, setPuedeAgregarPartida] = React.useState(false);
  // Paso 2: Guardar la partida actual (por índice) y habilitar "Nueva partida"
  const handleGuardarPartidaActual = async (index: number) => {
    // Validar que la partida correspondiente tenga todos los campos obligatorios
    const partidaActual = partidas[index];
    if (
      !partidaActual.e_no_requisicion ||
      !partidaActual.e_id_partida ||
      !partidaActual.e_id_fuente_financiamiento
    ) {
      toast.warning("Completa todos los campos obligatorios de la partida antes de guardar.");
      return;
    }
    try {
      const folioGuardado =
        folioSeguimiento ||
        folio ||
        Number(sessionStorage.getItem("folioSeguimiento"));
      if (!folioGuardado) {
        toast.info("Primero debes completar el Paso 1 antes de continuar.");
        return;
      }
      const payload = {
        p_accion: "NUEVO",
        p_id_seguimiento: folioGuardado,
        p_id: 0,
        p_e_no_requisicion: String(partidaActual.e_no_requisicion ?? "").trim(),
        p_e_id_partida: String(partidaActual.e_id_partida ?? "").trim(),
        p_e_id_fuente_financiamiento: String(partidaActual.e_id_fuente_financiamiento ?? "").trim(),
      };
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error("Error al guardar la partida");
        setPuedeAgregarPartida(false);
        return;
      }
      // Si la respuesta es correcta, guardar id en la partida y habilitar el botón "Nueva partida"
      if (data.resultado) {
        setPartidas((prev) =>
          prev.map((x, idx) =>
            idx === index ? { ...x, id: data.resultado } : x
          )
        );
        toast.success("Partida guardada correctamente");
        setPuedeAgregarPartida(true);
      } else {
        toast.error("Error al guardar la partida");
        setPuedeAgregarPartida(false);
      }
    } catch (err) {
      toast.error("Error al guardar la partida");
      setPuedeAgregarPartida(false);
    }
  };

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
  const [entidades, setEntidades] = React.useState<any[]>([]);
  const [selectedEntidadId, setSelectedEntidadId] = React.useState<string>("");
  // Estado para buscar y mostrar entidades federativas
  const [entidadQuery, setEntidadQuery] = React.useState("");
  const [mostrarListaEntidades, setMostrarListaEntidades] = React.useState(false);

  // Mantener sincronizado el ID seleccionado
  const selectedEntidadRef = React.useRef<string>("");
  React.useEffect(() => {
    selectedEntidadRef.current = selectedEntidadId;
  }, [selectedEntidadId]);

// Cargar entidades federativas al abrir el paso
React.useEffect(() => {
  const fetchEntidades = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entidad-federativa?p_id=-99`);
      const data = await resp.json();
      if (Array.isArray(data)) setEntidades(data);
    } catch (err) {
      console.error("❌ Error cargando entidades:", err);
    }
  };
  fetchEntidades();
}, []);
  // Paso 4: Catálogo de proveedores del backend (solo para búsqueda)
  const [catalogoProveedores, setCatalogoProveedores] = React.useState<any[]>([]);
  // Paso 4 - errores de proveedor
  const [erroresProveedor, setErroresProveedor] = React.useState<Record<string, string>>({});

  const [mostrarLista, setMostrarLista] = React.useState(true);
  const [showVerProveedoresDialog, setShowVerProveedoresDialog] = React.useState(false);
  const [showNuevoProveedorDialog, setShowNuevoProveedorDialog] = React.useState(false);
  const [proveedoresDialog, setProveedoresDialog] = React.useState<Proveedor[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Paso 4: Cargar todos los proveedores al entrar al paso 4 (solo catálogo de backend)
  // Paso 4: Cargar todos los proveedores al entrar al paso 4 (solo catálogo de backend)
React.useEffect(() => {
  if (step === 4) {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
        const data = await resp.json();
        setCatalogoProveedores(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error al cargar proveedores:", err);
      }
    })();
  }
}, [step]);

// Cargar proveedores solo cuando se abre el diálogo "Ver proveedores"
React.useEffect(() => {
  if (showVerProveedoresDialog) {
    fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`)
      .then((r) => r.json())
      .then(setProveedoresDialog)
      .catch((err) => console.error("❌ Error cargando proveedores:", err));
  }
}, [showVerProveedoresDialog]);

React.useEffect(() => {
  const fetchEntidades = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entidad-federativa?p_id=-99`);
      const data = await resp.json();
      if (Array.isArray(data)) setEntidades(data);
    } catch (err) {
      console.error("❌ Error cargando entidades:", err);
    }
  };
  fetchEntidades();
}, []);


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

  // Paso 4: Finalizar proceso handler (actualizado)
const handleFinalizarProceso = React.useCallback(async () => {
  console.log("🔍 Validando proveedores antes de finalizar...");

  // ===============================
  // 🔴 VALIDACIÓN DE CAMPOS (cuando NO hay proveedores)
  // ===============================
  if (proveedores.length === 0) {
    const nuevosErrores: Record<string, string> = {};

    if (!form.p_e_id_rubro_partida)
      nuevosErrores.p_e_id_rubro_partida = "Selecciona un rubro/partida.";

    if (!form.e_rfc_proveedor?.trim())
      nuevosErrores.e_rfc_proveedor = "El RFC es obligatorio.";

    if (!form.e_importe_sin_iva)
      nuevosErrores.e_importe_sin_iva = "Ingresa un importe válido.";

    // 👀 guardar errores → esto ya pinta los bordes rojos en los inputs
    setErroresProveedor(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      toast.warning("Debes añadir al menos un proveedor antes de finalizar.");
      return;
    }
  }

  // ===============================
  // 🟢 SI YA HAY PROVEEDORES — PERMITIR FINALIZAR
  // ===============================
  if (proveedores.length > 0) {
    console.log("✅ Ya existe al menos un proveedor añadido:", proveedores);

    try {
      const folioFinal =
        folioSeguimiento ||
        folio ||
        Number(sessionStorage.getItem("folioSeguimiento")) ||
        null;

      if (user && folioFinal) {
        const tipoNormalizado = (user.tipo || "").toString().trim().toUpperCase();
        if (tipoNormalizado === "ENTE") {
          const mensaje = `El usuario ${user.nombre} ha completado el seguimiento #${folioFinal}`;
          const params = new URLSearchParams();
          params.append("p_accion", "CREAR");
          params.append("p_id_usuario_origen", String(user.id));
          params.append("p_id_ente", String(user.id_ente));
          params.append("p_mensaje_extra", mensaje);

          console.log("🚀 Enviando notificación (ENTE → RECTORES):", params.toString());

          try {
            const resp = await fetch(
              `${API_BASE}/seguridad/notificaciones/?${params.toString()}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }
            );

            const data = await resp.json();
            console.log("📩 Respuesta del backend:", data);
          } catch (err) {
            console.error("❌ Error al enviar la notificación:", err);
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ No se pudo enviar la notificación al rector:", err);
    }

    toast.success("Proceso finalizado correctamente.");
    router.push("/procesos");
    return;
  }

  // ===============================
  // 🔁 VALIDACIÓN REDUNDANTE
  // ===============================
  const yaAgregoProveedor = proveedores.some(
    (p) => p && p.e_rfc_proveedor && p.e_importe_sin_iva
  );

  if (yaAgregoProveedor) {
    console.log("✅ Proveedor válido detectado.");

    try {
      const folioFinal =
        folioSeguimiento ||
        folio ||
        Number(sessionStorage.getItem("folioSeguimiento")) ||
        null;

      if (user && folioFinal) {
        const tipoNormalizado = (user.tipo || "").toString().trim().toUpperCase();
        if (tipoNormalizado === "ENTE") {
          const mensaje = `El usuario ${user.nombre} ha completado el seguimiento #${folioFinal}`;
          const params = new URLSearchParams();
          params.append("p_accion", "CREAR");
          params.append("p_id_usuario_origen", String(user.id));
          params.append("p_id_ente", String(user.id_ente));
          params.append("p_mensaje_extra", mensaje);

          console.log("🚀 Enviando notificación:", params.toString());

          try {
            const resp = await fetch(
              `${API_BASE}/seguridad/notificaciones/?${params.toString()}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }
            );
            const data = await resp.json();
            console.log("📩 Respuesta:", data);
          } catch (err) {
            console.error("❌ Error enviando notificación:", err);
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ No se pudo enviar la notificación:", err);
    }

    toast.success("Proceso finalizado correctamente.");
    router.push("/procesos");
    return;
  }

  // ⚠️ Si no hay proveedores
  toast.warning("Debes añadir al menos un proveedor antes de finalizar.");
}, [proveedores, router, user, folio, folioSeguimiento]);

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
      setPartidas([]);
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
          fetch(`${API_BASE}/catalogos/partidas?p_id=-99&p_id_capitulo=-99&p_tipo=PROVEEDURIA`).then((r) => r.json()),
        ]);
        setFuentes(Array.isArray(fResp) ? fResp : []);
        setCatalogoPartidas(Array.isArray(pResp) ? pResp : []);
        // ✅ Si ya existe un folio, consultar las partidas registradas previamente
        const folioActivo = folio || folioSeguimiento || Number(sessionStorage.getItem("folioSeguimiento"));
        if (folioActivo) {
          const res = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              p_accion: "CONSULTAR",
              p_id_seguimiento: folioActivo,
              p_e_id_partida: -99,
            }),
          });
          const data = await res.json();
          console.log("📌 RESPUESTA REAL DEL BACKEND:", data);   // ← AQUI
          if (Array.isArray(data) && data.length > 0) {
            setPartidas(data);
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
const [erroresRubro, setErroresRubro] = React.useState<Record<string, string>>({});

const handleGuardarRubros = async () => {
  const nuevosErrores: Record<string, string> = {};

  // 🚨 Si NO hay rubros añadidos → validar formulario
  if (presupuestosRubro.length === 0) {
    if (!nuevoRubro.p_id_partida_asociada)
      nuevosErrores.p_id_partida_asociada = "Selecciona una partida asociada";

    if (!nuevoRubro.p_e_id_rubro)
      nuevosErrores.p_e_id_rubro = "El campo de rubro es obligatorio";

    if (!nuevoRubro.p_e_monto_presupuesto_suficiencia)
      nuevosErrores.p_e_monto_presupuesto_suficiencia = "Debes ingresar un monto válido";
  }

  setErroresRubro(nuevosErrores);

  // ⛔ Detener si no hay rubros y hay errores
  if (presupuestosRubro.length === 0 && Object.keys(nuevosErrores).length > 0) {
    toast.warning("Por favor completa todos los campos antes de continuar o añade al menos un rubro.");
    return;
  }

  // 🟢 Si ya hay rubros añadidos, permitir avanzar
  setStep(4);
};

  // Paso 2: hooks y handlers
  const [nuevaPartida, setNuevaPartida] = React.useState({
    e_no_requisicion: "",
    e_id_partida: "",
    partida_descripcion: "",
    clave_capitulo: "",
    capitulo: "",
    e_id_fuente_financiamiento: "",
    fuente_descripcion: "",
    fuente_etiquetado: "",
    fuente_fondo: "",
    id_ramo: "",          
    ramo_descripcion: "",    
  });

  const [erroresForm, setErroresForm] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    setErroresForm({});
  }, [step]);

  // Handler para añadir partida
  const handleAddPartida = async () => {
    const errores: Record<string, string> = {};

    // Validar campos obligatorios
    if (!nuevaPartida.e_no_requisicion) errores.e_no_requisicion = "Campo obligatorio";
    if (!nuevaPartida.e_id_partida) errores.e_id_partida = "Campo obligatorio";
    if (!nuevaPartida.e_id_fuente_financiamiento) errores.e_id_fuente_financiamiento = "Campo obligatorio";

    if (Object.keys(errores).length > 0) {
      setErroresForm(errores);
      toast.warning("Completa todos los campos obligatorios antes de añadir una partida.");
      return;
    }

    // Si YA EXISTE una partida pero aún NO tiene id (no está guardada en BD)
    if (partidas.length > 0 && !partidas[0].id) {
    toast.warning("Primero guarda la partida actual antes de añadir otra.");
    return;
    }

    try {
      const folioGuardado =
        folioSeguimiento || folio || Number(sessionStorage.getItem("folioSeguimiento"));
      if (!folioGuardado) {
        toast.info("Primero debes completar el Paso 1 antes de continuar.");
        return;
      }

      const payload = {
        p_accion: "NUEVO",
        p_id_seguimiento: folioGuardado,
        p_id: 0,
        p_e_no_requisicion: String(nuevaPartida.e_no_requisicion ?? "").trim(),
        p_e_id_partida: String(nuevaPartida.e_id_partida ?? "").trim(),
        p_e_id_fuente_financiamiento: String(nuevaPartida.e_id_fuente_financiamiento ?? "").trim(),
      };

      const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error("Error al guardar la partida");
        return;
      }

      if (data.resultado) {
        // Definir el valor de partidaSel correctamente tipado
        const partidaSel = catalogoPartidas.find(
          (p: { id: string | number }) => String(p.id) === String(nuevaPartida.e_id_partida)
        );
        const fuenteSel = fuentes.find((f) => String(f.id) === String(nuevaPartida.e_id_fuente_financiamiento));

        setPartidas((prev) => [
          ...prev,
          {
            id: data.resultado,
            no_requisicion: nuevaPartida.e_no_requisicion,
            e_id_partida: nuevaPartida.e_id_partida,
            e_id_fuente_financiamiento: nuevaPartida.e_id_fuente_financiamiento,
            partida_descripcion: partidaSel?.descripcion ?? "",
            id_capitulo: partidaSel?.id_capitulo ?? "",
            capitulo: partidaSel?.capitulo ?? "",
            fuente_financiamiento: fuenteSel?.descripcion ?? "",
            descripcion: partidaSel?.descripcion ?? "",
            etiquetado: fuenteSel?.etiquetado ?? "",
            fondo: fuenteSel?.fondo ?? "",
            id_ramo: fuenteSel?.id_ramo ?? "",
            ramo_descripcion: fuenteSel?.ramo ?? "",
          },
        ]);

        setNuevaPartida({
          e_no_requisicion: "",
          e_id_partida: "",
          partida_descripcion: "",
          clave_capitulo: "",
          capitulo: "",
          e_id_fuente_financiamiento: "",
          fuente_descripcion: "",
          fuente_etiquetado: "",
          fuente_fondo: "",
          id_ramo: "",
          ramo_descripcion: "",

        });
        setErroresForm({});
        toast.success("Partida guardada correctamente");
      } else {
        toast.error("Error al guardar la partida");
      }
    } catch (err) {
      toast.error("Error al guardar la partida");
    }
  };

  // Handler eliminar partida
  const handleEliminarPartida = async (idx: number) => {
    console.log("🗑️ Eliminando partida con índice:", idx, partidas[idx]);
    const partidaId = partidas[idx]?.id;

    try {
      // ✅ Verificamos si tiene ID válido
      if (partidaId) {
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_accion: "ELIMINAR",
            p_id: partidaId,
            p_id_seguimiento: folioSeguimiento || folio,
            p_e_id_partida: partidas[idx].e_id_partida,
            p_e_no_requisicion: partidas[idx].e_no_requisicion,
            p_e_id_fuente_financiamiento: partidas[idx].e_id_fuente_financiamiento,
          }),
        });

        const data = await resp.json();

        if (!resp.ok) {
          console.error("❌ Error al eliminar partida:", data);
          toast.error("No se pudo eliminar la partida del servidor.");
          return;
        }

        toast.success(`Partida eliminada correctamente.`);
      } else {
        // ⚠️ Si no tiene ID válido, solo la eliminamos del frontend
        toast.info("Partida eliminada localmente (sin ID en base de datos).");
      }

      // 🧹 En ambos casos, eliminar del estado local
      setPartidas((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("❌ Error al eliminar partida:", err);
      toast.error("Error de conexión al eliminar la partida.");
    }
  };

  // Handler avanzar al siguiente paso (nuevo bloque)
const handleNext = async () => {
  try {
    const folioActual = folioSeguimiento || folio || Number(sessionStorage.getItem("folioSeguimiento"));
    if (!folioActual) {
      toast.info("Primero debes completar el Paso 1 antes de continuar.");
      return;
    }

    // 🔹 Traer partidas actualizadas desde la BD
    const res = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        p_accion: "CONSULTAR",
        p_id_seguimiento: folioActual,
        p_e_id_partida: -99,
      }),
    });

    const data = await res.json();

    // 🔹 AQUI EL FIX IMPORTANTE
    let partidasActualizadas = Array.isArray(data)
      ? data.map(p => ({ ...p, id: p.id })) // ← aseguramos que id exista
      : partidas;

    // 🔹 Validar si hay al menos una partida
    const partidasValidas = partidasActualizadas.filter((p) => {
      const noReq = p.e_no_requisicion ?? p.no_requisicion;
      const idPartida = p.e_id_partida ?? p.partida ?? p.id_partida;
      const fuente = p.e_id_fuente_financiamiento ?? p.fuente_financiamiento ?? p.id_fuente_financiamiento;
      return (
        String(noReq || "").trim() !== "" &&
        String(idPartida || "").trim() !== "" &&
        String(fuente || "").trim() !== ""
      );
    });

    if (partidasValidas.length === 0) {

  // 🔥 Marcar errores en campos vacíos (borde rojo)
  setErroresForm({
  e_no_requisicion:
    nuevaPartida.e_no_requisicion.trim() === "" ? "Este campo es obligatorio" : "",

  e_id_partida:
    nuevaPartida.e_id_partida.trim() === "" ? "Selecciona una partida" : "",

  e_id_fuente_financiamiento:
    nuevaPartida.e_id_fuente_financiamiento.trim() === "" ? "Selecciona una fuente de financiamiento" : ""
    });
  toast.warning("Debes añadir al menos una partida antes de continuar.");
  return;
}

    setErroresForm({});
    setPartidas(partidasValidas);
    toast.success("Partidas validadas correctamente.");
    setStep(3);
  } catch (err) {
    console.error("❌ Error en handleNext:", err);
    toast.error("Error al validar las partidas.");
  }
};

  /* ========================================
     🔹 Handler para eliminar proveedor del paso 4
  ======================================== */
  // ✅ Handler para eliminar proveedor del paso 4
  const handleEliminarProveedor = async (idx: number) => {
  try {
    const proveedor = proveedores[idx];
    if (!proveedor) return;

    const folioActual = folioSeguimiento || folio;
    if (!folioActual) {
      toast.warning("Folio de seguimiento no disponible.");
      return;
    }

    // 🔹 Endpoint actualizado con versión v2
    const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-rubro-proveedor-ente-v2/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
      p_accion: "ELIMINAR",
      p_id: proveedor.id,
      p_id_seguimiento_partida_rubro:
      proveedor.p_id_seguimiento_partida_rubro ||
      proveedor.id_partida_rubro ||
      proveedor.p_id_seguimiento_partida ||
      proveedor.id_partida ||
      0,
    p_e_rfc_proveedor: proveedor.e_rfc_proveedor,
  }),
});

    let data: any = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }

    if (!resp.ok) {
      console.error("❌ Error al eliminar proveedor:", data);
      toast.error("No se pudo eliminar el proveedor del servidor.");
      return;
    }

    toast.success("Proveedor eliminado correctamente.");
    setProveedores((prev) => prev.filter((_, i) => i !== idx));
  } catch (err) {
    console.error("❌ Error al eliminar proveedor:", err);
    toast.error("Error de conexión al eliminar el proveedor.");
  }
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

    {/* 🔥 BOTÓN DE SALIR — FUERA DEL CARD */}
    <div className="flex justify-start mb-4">
      <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setOpenSalirDialog(true)}
                style={{ backgroundColor: "#db200b", color: "white" }}
                className="cursor-pointer rounded-md"
              >
                ←
              </Button>
            </TooltipTrigger>

            <TooltipContent side="top">
              <p>Salir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
            <DialogDescription>
              Si sales ahora, perderás cualquier información no guardada.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 mt-4">

            <Button
              onClick={() => setOpenSalirDialog(false)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="hover:brightness-110"
            >
              Cancelar
            </Button>

            <Button
              onClick={() => {
                const from = params.get("from");
                if (from === "dashboard") {
                  router.push("/dashboard");
                } else {
                  router.push("/procesos");
                }
              }}
              style={{ backgroundColor: "#34e004", color: "white" }}
              className="hover:brightness-110"
            >
              Sí
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

              <Card>
              <CardContent className="space-y-4">
                
        {/* Encabezado dentro del Card */}
        <div className="flex justify-between items-center mb-6">

          {/* IZQUIERDA → botón rojo + título */}
          <div className="flex items-center gap-3">


            <h1 className="text-2xl font-bold">Paso 1: Oficio de invitación</h1>
          </div>

              {/* DERECHA → botón azul */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleBotonSuperior}
                    disabled={loading && step === 1}
                    className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 
                              transition-transform flex items-center gap-1 rounded-full px-4 py-2 cursor-pointer"
                  >
                    {loading && step === 1 ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="font-bold">Guardando...</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">{step + 1}</span>
                        <span className="font-bold">→</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>

                {/* 💬 El tooltip */}
                <TooltipContent side="top">
                  <p>Avanza al siguiente paso </p>
                </TooltipContent>

              </Tooltip>
            </TooltipProvider>

</div>
                
                <div>
                  <Label>Ente</Label>
                  <Input
                    value={enteDescripcion || "Cargando..."}
                    disabled
                    className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                  />
                </div>

                                {/* Oficio de invitación + Fecha + Hora en la misma línea */}
                <div className="flex gap-4 flex-wrap md:flex-nowrap">
                  {/* Campo: Oficio de invitación */}
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

                  {/* Campo: Fecha */}
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

                  {/* Campo: Hora */}
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
                  {/* Botones para ver y añadir servidores públicos */}
                  <div className="flex gap-3 mt-2">
                    {/* Ver servidores públicos */}
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
                    {/* Añadir servidor público */}
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

                              // ✅ Refrescar lista
                              const sResp = await fetch(
                                `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user?.id_ente}`
                              );
                              const nuevosServidores = await sResp.json();
                              setServidores(nuevosServidores);

                              // ✅ Buscar el servidor recién añadido
                              const nuevoServidor = nuevosServidores.find(
                                (s: ServidorPublico) =>
                                  s.nombre?.toLowerCase() === nuevoServidorNombre.toLowerCase() &&
                                  s.cargo?.toLowerCase() === nuevoServidorCargo.toLowerCase()
                              );

                              if (nuevoServidor) {
                                // 🔹 Seleccionarlo automáticamente
                                setServidorSeleccionado(nuevoServidor);
                                setForm((prev) => ({ ...prev, servidor_publico_cargo: nuevoServidor.cargo || "" }));
                                setBusquedaServidor(nuevoServidor.nombre);
                                setMostrarServidores(false); // ✅ cierra el CommandList automáticamente al seleccionar
                                toast.success(`Servidor "${nuevoServidor.nombre}" seleccionado automáticamente`);
                              }

                              // ✅ Limpiar y cerrar
                              setNuevoServidorNombre("");
                              setNuevoServidorCargo("");
                              setAddServidorDialogOpen(false);
                            } catch (err) {
                              toast.error("Error al añadir servidor público.");
                            } finally {
                              setAddServidorLoading(false);
                            }
                          }}
                        >
                          <div>
                            <Label>Ente perteneciente</Label>
                            <Input
                              value={enteDescripcion || "Cargando..."}
                              disabled
                              className="bg-gray-100 text-gray-700 cursor-not-allowed"
                            />
                          </div>
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
                              type="button"
                              className="bg-[#db200b] text-white hover:bg-[#b81a09]"
                              onClick={() => setAddServidorDialogOpen(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              className="bg-[#34e004] text-white hover:bg-[#2bc103]"
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
                
                {/* Usuario + Botón avanzar EN LA MISMA LÍNEA */}
                <div className="flex items-end justify-between gap-4">

                  {/* Campo Usuario */}
                  <div className="w-[900%]">
                    <Label>Usuario</Label>
                    <Input
                      value={user?.nombre || "Cargando..."}
                      disabled
                      className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                    />
                  </div>

                  {/* Botón avanzar */}
                  <div className="w-[30%] flex justify-end">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleGuardarPaso1}
                            disabled={loading}
                            className="bg-[#235391] hover:bg-[#1e3a8a] transition-transform 
                                    hover:scale-105 rounded-full px-4 py-2"
                          >
                            <div className="flex items-center gap-2">
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <span className="text-white font-bold">{step + 1}</span>
                                  <span className="text-white font-bold">→</span>
                                </>
                              )}
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Avanza al siguiente paso</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                </div>
              </CardContent>
            </Card>
            {/* 🔥 BOTÓN DE SALIR INFERIOR — FUERA DEL CARD */}
<div className="flex justify-start mt-4">
  <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpenSalirDialog(true)}
            style={{ backgroundColor: "#db200b", color: "white" }}
            className="cursor-pointer rounded-md"
          >
            ←
          </Button>
        </TooltipTrigger>

        <TooltipContent side="top">
          <p>Salir</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
        <DialogDescription>
          Si sales ahora, perderás cualquier información no guardada.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="flex justify-end gap-3 mt-4">
        <Button
          onClick={() => setOpenSalirDialog(false)}
          style={{ backgroundColor: "#db200b", color: "white" }}
          className="hover:brightness-110"
        >
          Cancelar
        </Button>

        <Button
          onClick={() => {
            const from = params.get("from");
            if (from === "dashboard") {
              router.push("/dashboard");
            } else {
              router.push("/procesos");
            }
          }}
          style={{ backgroundColor: "#34e004", color: "white" }}
          className="hover:brightness-110"
        >
          Sí
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
          </>
      )}

{/* Paso 2 */}
{step === 2 && (
  <>
    {/* 🔥 BOTÓN SALIR ARRIBA (FUERA DEL CARD) */}
<div className="flex justify-start mb-4">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setOpenSalirDialog(true)}
          variant="default"
          className="bg-[#db200b] text-white hover:bg-[#db200b]"
          type="button"
        >
          ←
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Salir</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>

{/* 🔥 DIALOG GLOBAL */}
<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <DialogContent className="max-w-sm">

    <DialogHeader>
      <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
      <DialogDescription>
        Si sales ahora, perderás cualquier información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">

      <Button
        onClick={() => setOpenSalirDialog(false)}
        variant="default"
        className="bg-[#db200b] text-white hover:bg-[#db200b]"
        type="button"
      >
        Cancelar
      </Button>

      <Button
        onClick={() => {
          const from = params.get("from");
          router.push(from === "dashboard" ? "/dashboard" : "/procesos");
        }}
        variant="default"
        className="bg-[#34e004] text-white hover:bg-[#34e004]"
        type="button"
      >
        Sí
      </Button>

    </DialogFooter>

  </DialogContent>
</Dialog>
  
  <Card>
    <CardContent className="space-y-4">

      <div className="flex items-center justify-between mb-6 w-full">

        {/* IZQUIERDA → Botón salir + volver paso anterior + título */}
        <div className="flex items-center gap-3">

          

          {/* BOTÓN VOLVER PASO ANTERIOR  — AHORA AQUÍ A LA IZQUIERDA */}
          {step > 1 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[#235391] font-bold">← {step - 1}</span>
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="top">
                  <p>Regresar al paso anterior</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* TÍTULO */}
          <h1 className="text-2xl font-bold">Paso 2: Partidas</h1>
        </div>

        {/* DERECHA → Botón siguiente (se queda donde está) */}
        <div className="flex items-center gap-2">
          {step < 4 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleNext}
                    className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 transition-transform flex items-center gap-1 rounded-full px-4 py-2"
                  >
                    <span className="font-bold">{step + 1} →</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Avanza al siguiente paso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

      </div>
            {/* Oficio de invitación bloqueado */}
            <div>
              <Label>Oficio de invitación</Label>
              <Input
                value={form.oficio_invitacion ?? ""}
                disabled
                className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
              />
            </div>
            {/* Formulario superior */}
           <form
          className="flex flex-col space-y-4 rounded-lg bg-white px-0 py-4"
          onSubmit={e => {
            e.preventDefault();
            handleAddPartida();
          }}
        >
              {/* No. Requisición */}
              <div>
                <Label>No. Requisición</Label>
                <Input
                  value={nuevaPartida.e_no_requisicion || ""}
                  onChange={e => setNuevaPartida({ ...nuevaPartida, e_no_requisicion: e.target.value })}
                  placeholder="Ej. 101"
                  className={`w-full ${erroresForm.e_no_requisicion ? "border border-red-500 focus:ring-red-500" : ""}`}
                />
                {erroresForm.e_no_requisicion && (
                  <p className="text-sm text-red-500 mt-1">Este campo es obligatorio</p>
                )}
              </div>
              {/* Partida */}
              <div>
                <Label>Partida</Label>
                <Command>
                  <CommandInput
                    placeholder="Buscar partida…"
                    value={nuevaPartida.e_id_partida}
                    onValueChange={val => setNuevaPartida(prev => ({ ...prev, e_id_partida: val }))}
                    className={`w-full ${erroresForm.e_id_partida ? "border border-red-500 focus:ring-red-500" : ""}`}
                  />
                  {Boolean(nuevaPartida.e_id_partida.trim()) && (
                    <CommandList>
                      {catalogoPartidas
                        .filter(row => {
                          const q = (nuevaPartida.e_id_partida || "").toLowerCase();
                          return (
                            row.id?.toString().toLowerCase().includes(q) ||
                            row.descripcion?.toLowerCase().includes(q)
                          );
                        })
                        .map(row => (
                          <CommandItem
                            key={row.id}
                            onSelect={() => {
                              setNuevaPartida(prev => ({
                                ...prev,
                                e_id_partida: row.id,
                                partida_descripcion: row.descripcion ?? "",
                                clave_capitulo: row.id_capitulo ?? "",
                                capitulo: row.capitulo ?? "",
                              }));
                            }}
                          >
                            {row.id} – {row.descripcion} – id capitulo: {row.id_capitulo} – capitulo: {row.capitulo}
                          </CommandItem>
                        ))}
                      <CommandEmpty>No se encontraron partidas</CommandEmpty>
                    </CommandList>
                  )}
                </Command>
                {erroresForm.e_id_partida && (
                  <p className="text-sm text-red-500 mt-1">Selecciona una partida</p>
                )}
              </div>
              {/* Fuente de financiamiento */}
              <div>
                <Label>Fuente de financiamiento</Label>
                <Command>
                  <CommandInput
                    placeholder="Buscar fuente…"
                    value={nuevaPartida.e_id_fuente_financiamiento}
                    onValueChange={val => setNuevaPartida(prev => ({ ...prev, e_id_fuente_financiamiento: val }))}
                    className={`w-full ${erroresForm.e_id_fuente_financiamiento ? "border border-red-500 focus:ring-red-500" : ""}`}
                  />
                  {Boolean(nuevaPartida.e_id_fuente_financiamiento.trim()) && (
                    <CommandList>
                      {fuentes
                        .filter(f => {
                          const q = (nuevaPartida.e_id_fuente_financiamiento || "").toLowerCase();
                          return (
                            f.id?.toString().toLowerCase().includes(q) ||
                            f.descripcion?.toLowerCase().includes(q) ||
                            f.etiquetado?.toLowerCase().includes(q) ||
                            f.fondo?.toLowerCase().includes(q)
                          );
                        })
                        .map(f => (
                          <CommandItem
                            key={f.id}
                            onSelect={() => {
                              setNuevaPartida(prev => ({
                                ...prev,
                                e_id_fuente_financiamiento: f.id,
                                fuente_descripcion: f.descripcion ?? "",
                                fuente_etiquetado: f.etiquetado ?? "",
                                fuente_fondo: f.fondo ?? "",
                                id_ramo: f.id_ramo ?? "",
                                ramo_descripcion: f.ramo ?? "",
                              }));
                            }}
                          >
                            {f.id} – Descripción: {f.descripcion} – Etiquetado: {f.etiquetado} – Fondo: {f.fondo}
                          </CommandItem>
                        ))}
                      <CommandEmpty>No se encontraron fuentes</CommandEmpty>
                    </CommandList>
                  )}
                </Command>
                {erroresForm.e_id_fuente_financiamiento && (
                  <p className="text-sm text-red-500 mt-1">Selecciona una fuente de financiamiento</p>
                )}
              </div>
              {/* Botón añadir partida */}
              <div className="flex justify-end mt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        style={{ backgroundColor: "#10c706", color: "white" }}
                      >
                        Añadir partida
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Guarda la partida seleccionada</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </form>
            {/* Tabla de partidas - DISEÑO MEJORADO */}
            <div className="overflow-hidden rounded-lg shadow-md border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase tracking-wide">
                    <th className="px-3 py-2 font-semibold text-center">No. Requisición</th>
                    <th className="px-3 py-2 font-semibold text-center">Partida</th>
                    <th className="px-3 py-2 font-semibold text-center">Capítulo</th>
                    <th className="px-3 py-2 font-semibold text-center">Fuente Financiamiento</th>
                    <th className="px-3 py-2 font-semibold text-center">Ramo</th>
                    <th className="px-3 py-2 font-semibold text-center">Fondo</th>
                    <th className="px-3 py-2 font-semibold text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {partidas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-3 text-center text-gray-400">
                        No hay partidas registradas.
                      </td>
                    </tr>
                  ) : (
                partidas
                  .filter(
                    (p) =>
                      p &&
                      (p.e_id_partida !== null && p.e_id_partida !== "" && p.e_id_partida !== "-") &&
                      (p.e_id_fuente_financiamiento !== null && p.e_id_fuente_financiamiento !== "")
                  )
                  .map((p, index) => {
                    console.log("📌 COLUMNAS DE LA PARTIDA:", p);
                    return (
                      <tr
                        key={index}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-3 py-2 text-center">{p.no_requisicion}</td>
                        <td className="px-3 py-2 text-center">
                          {`${p.e_id_partida} – ${p.partida_descripcion}`}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {`${p.id_capitulo}`}
                        </td>
                        <td className="px-3 py-2 text-center">
                        {`${p.e_id_fuente_financiamiento} – ${p.fuente_financiamiento}`}
                      </td>
                        <td className="px-3 py-2 text-center">{p.ramo_descripcion}</td>
                        <td className="px-3 py-2 text-center">{p.fondo}</td>
                        <td className="px-3 py-2 text-right w-[1%]">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            onClick={() => handleEliminarPartida(index)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>

              {/* Botones inferiores alineados */}
<div className="flex justify-between items-center mt-6 w-full">

  {/* ================================ */}
  {/* IZQUIERDA → SALIR + VOLVER */}
  {/* ================================ */}
  <div className="flex items-center gap-2">


    {/* Botón Volver (paso 1) */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={() => setStep(1)}
            className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2"
          >
            <span className="text-[#235391] font-bold">← 1</span>
          </Button>
        </TooltipTrigger>

        <TooltipContent side="top">
          <p>Regresa al paso anterior</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

  </div>

  {/* ================================ */}
  {/* DERECHA → SIGUIENTE */}
  {/* ================================ */}
  <div>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={handleNext}
            className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 transition-transform rounded-full px-4 py-2 flex items-center gap-2"
          >
            <span className="font-bold">3 →</span>
          </Button>
        </TooltipTrigger>

        <TooltipContent side="top">
          <p>Avanza al siguiente paso</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

</div>
          </CardContent>
        </Card>
       {/* 🔥 BOTÓN SALIR ARRIBA (FUERA DEL CARD) */}
<div className="flex justify-start mb-4">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setOpenSalirDialog(true)}
          variant="default"
          className="bg-[#db200b] text-white hover:bg-[#db200b]"
          type="button"
        >
          ←
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Salir</TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>

{/* 🔥 DIALOG GLOBAL */}
<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <DialogContent className="max-w-sm">

    <DialogHeader>
      <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
      <DialogDescription>
        Si sales ahora, perderás cualquier información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">

      <Button
        onClick={() => setOpenSalirDialog(false)}
        variant="default"
        className="bg-[#db200b] text-white hover:bg-[#db200b]"
        type="button"
      >
        Cancelar
      </Button>

      <Button
        onClick={() => {
          const from = params.get("from");
          router.push(from === "dashboard" ? "/dashboard" : "/procesos");
        }}
        variant="default"
        className="bg-[#34e004] text-white hover:bg-[#34e004]"
        type="button"
      >
        Sí
      </Button>

    </DialogFooter>

  </DialogContent>
</Dialog>

  </>
)}

   {/* Paso 3 */}
{(() => {
  const rubroInputRef = React.useRef<any>(null);
  const [mostrarRubros, setMostrarRubros] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 3 && ((e.ctrlKey && e.key === "s") || (e.metaKey && e.key === "s"))) {
        e.preventDefault();
        handleGuardarRubros();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  if (step !== 3) return null;

  return (
    <Card>
  <CardContent className="space-y-4">

    {/* Encabezado del Paso 3 */}
    <div className="flex items-center justify-between w-full mb-6">

      {/* IZQUIERDA → Botón regresar + botón salir + título */}
      <div className="flex items-center gap-3">

        {/* BOTÓN SALIR (SE MANTIENE) */}
        <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setOpenSalirDialog(true)}
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="cursor-pointer"
                >
                  ←
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Salir</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
              <DialogDescription>
                Si sales ahora, perderás cualquier información no guardada.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-3 mt-4">
              {/* CANCELAR */}
              <Button
                onClick={() => setOpenSalirDialog(false)}
                style={{ backgroundColor: "#db200b", color: "white" }}
                className="hover:brightness-110"
              >
                Cancelar
              </Button>

              {/* SÍ */}
              <Button
                onClick={() => {
                  const from = params.get("from");
                  if (from === "dashboard") {
                    router.push("/dashboard");
                  } else {
                    router.push("/procesos");
                  }
                }}
                style={{ backgroundColor: "#34e004", color: "white" }}
                className="hover:brightness-110"
              >
                Sí
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 🔵 BOTÓN VOLVER AL PASO 2 → AHORA A LA IZQUIERDA */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2"
              >
                <span className="text-[#235391] font-bold">← 2</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Regresar al paso anterior</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* TÍTULO */}
        <h1 className="text-2xl font-bold">Paso 3: Rubros</h1>
      </div>

      {/* DERECHA → SOLO BOTÓN AVANZAR */}
      <div className="flex items-center gap-2">
        {step < 4 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleGuardarRubros}
                  className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 transition-transform rounded-full px-4 py-2 flex items-center gap-2"
                >
                  <span className="font-bold">{step + 1} →</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Avanzar al siguiente paso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

    </div>

        {/* Oficio invitación */}
        <div>
          <Label>Oficio de invitación</Label>
          <Input
            value={form.oficio_invitacion ?? ""}
            disabled
            className="bg-gray-100 text-gray-700 cursor-not-allowed"
          />
        </div>

        {/* Formulario rubros */}
        <div className="flex flex-col space-y-4 rounded-lg bg-white px-0 py-4">
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!nuevoRubro.p_e_id_rubro) {
                rubroInputRef.current?.focus();
                toast.warning("Completa los campos antes de añadir el rubro.");
                return;
              }
              if (!nuevoRubro.p_e_monto_presupuesto_suficiencia || !nuevoRubro.p_id_partida_asociada) {
                toast.warning("Completa los campos antes de añadir el rubro.");
                return;
              }

              const existeRubro = presupuestosRubro.some(
                (r) =>
                  r.p_e_id_rubro === nuevoRubro.p_e_id_rubro &&
                  r.p_id_partida_asociada === nuevoRubro.p_id_partida_asociada
              );
              if (existeRubro) {
                toast.warning("Este rubro ya fue añadido.");
                return;
              }

              try {
                const partidaAsociada = partidas.find(
                  (p) => String(p.e_id_partida) === String(nuevoRubro.p_id_partida_asociada)
                );
                if (!partidaAsociada || !partidaAsociada.id) {
                  toast.warning("La partida asociada no es válida.");
                  return;
                }

                const payload = {
                  p_accion: "NUEVO",
                  p_id_seguimiento_partida: Number(partidaAsociada.id),
                  p_id: 0,
                  p_e_id_rubro: nuevoRubro.p_e_id_rubro,
                  p_e_monto_presupuesto_suficiencia: parseFloat(
                    (nuevoRubro.p_e_monto_presupuesto_suficiencia || "").replace(/[^\d]/g, "")
                  ),
                };

                const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-rubro-ente-v2/`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                const data = await resp.json();
                if (!resp.ok) throw new Error(JSON.stringify(data));

                setPresupuestosRubro((prev) => [
                  ...prev,
                  { ...nuevoRubro, id: data.resultado },
                ]);

                setNuevoRubro((prev) => ({
                  ...prev,
                  p_e_id_rubro: "",
                  rubro_descripcion: "",
                  p_e_monto_presupuesto_suficiencia: "",
                }));

                toast.success("Rubro añadido correctamente");
              } catch (err) {
                toast.error("Error al añadir rubro");
              }
            }}
          >
            {/* Partida asociada */}
            <div>
              <Label>Partida asociada</Label>
              <select
                className={`border rounded-md p-2 w-full ${
                  erroresRubro.p_id_partida_asociada ? "border-red-500" : ""
                }`}
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
            </div>

            {/* Rubro + Monto */}
            <div className="flex gap-4">
              <div className="w-[70%]">
                <Label>Rubro</Label>

                <Command>
    <CommandInput
      ref={rubroInputRef}
      value={nuevoRubro.rubro_descripcion || nuevoRubro.p_e_id_rubro}
      placeholder="Escribe ID o nombre…"
      className={`${erroresRubro.p_e_id_rubro ? "border border-red-500" : ""}`}
      onValueChange={(val) => {
        setNuevoRubro((prev) => ({
          ...prev,
          p_e_id_rubro: val,
          rubro_descripcion: "",
        }));
        setMostrarRubros(true);
      }}
    />

    {mostrarRubros && (
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
              onSelect={() => {
                // ✔ Guarda el ID
                // ✔ Guarda la descripción
                // ✔ Llena el Input con "id — descripcion"
                // ✔ Cierra el CommandList
                setNuevoRubro((prev) => ({
                  ...prev,
                  p_e_id_rubro: rb.id.toString(),
                  rubro_descripcion: rb.descripcion,
                }));
                setMostrarRubros(false);
              }}
            >
              {rb.id} — {rb.descripcion}
            </CommandItem>
          ))}

        <CommandEmpty>No se encontraron rubros</CommandEmpty>
      </CommandList>
    )}
  </Command>
              </div>

              <div className="w-[30%]">
                <Label>Monto presupuesto suficiencia</Label>
                <Input
                value={nuevoRubro.p_e_monto_presupuesto_suficiencia}
                onChange={(e) =>
                  setNuevoRubro((prev) => ({
                    ...prev,
                    p_e_monto_presupuesto_suficiencia: formatMoney(e.target.value),
                  }))
                }
                placeholder="$0.00"
                className={`${erroresRubro.p_e_monto_presupuesto_suficiencia ? "border border-red-500" : ""}`}
              />
              </div>
            </div>

            {/* Botón añadir */}
            <div className="flex justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button style={{ backgroundColor: "#10c706", color: "white" }}>
                      Añadir rubro
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Agregar un nuevo rubro a la lista</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </form>
        </div>

        {/* TABLA */}
        <div className="overflow-hidden rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase tracking-wide">
                <th className="px-3 py-2 font-semibold text-center">Partida asociada</th>
                <th className="px-3 py-2 font-semibold text-center">Clave</th>
                <th className="px-3 py-2 font-semibold text-center">Rubro</th>
                <th className="px-3 py-2 font-semibold text-center">Monto</th>
                <th className="px-3 py-2 text-center" style={{ width: "40px" }}></th>
              </tr>
            </thead>

            <tbody>
              {presupuestosRubro.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-gray-400">
                    No hay rubros añadidos.
                  </td>
                </tr>
              ) : (
                presupuestosRubro.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-b ${i % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100`}
                  >
                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const partida = partidas.find(
                          (p) => String(p.e_id_partida) === String(r.p_id_partida_asociada)
                        );
                        return partida
                          ? `${partida.e_id_partida} — ${partida.partida_descripcion}`
                          : "Sin asignar";
                      })()}
                    </td>
                    <td className="px-3 py-2 text-center">{r.p_e_id_rubro}</td>
                    <td className="px-3 py-2 text-center">{r.rubro_descripcion}</td>
                    <td className="px-3 py-2 text-right">
                      {r.p_e_monto_presupuesto_suficiencia}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ width: "40px" }}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={async () => {
                          const rubro = presupuestosRubro[i];
                          if (!rubro || !rubro.id) {
                            toast.warning("Este rubro no tiene ID.");
                            setPresupuestosRubro((prev) => prev.filter((_, idx) => idx !== i));
                            return;
                          }
                          if (!confirm("¿Seguro que deseas eliminar este rubro?")) return;
                          try {
                            const partidaAsociada = partidas.find(
                              (p) => String(p.e_id_partida) === String(rubro.p_id_partida_asociada)
                            );
                            if (!partidaAsociada || !partidaAsociada.id) {
                              toast.warning("Partida asociada inválida.");
                              return;
                            }
                            const payload = {
                              p_accion: "ELIMINAR",
                              p_id_seguimiento_partida: Number(partidaAsociada.id),
                              p_id: Number(rubro.id),
                            };
                            const resp = await fetch(
                              `${API_BASE}/procesos/seguimiento/partida-rubro-ente-v2/`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload),
                              }
                            );
                            const data = await resp.json();
                            if (!resp.ok) throw new Error(JSON.stringify(data));
                            toast.success("Rubro eliminado correctamente.");
                            setPresupuestosRubro((prev) => prev.filter((_, idx) => idx !== i));
                          } catch (err) {
                            toast.error("Error al eliminar rubro");
                          }
                        }}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between mt-6 gap-2 w-full">

          {/* Botón rojo */}
          <div className="flex justify-start">
<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setOpenSalirDialog(true)}
          style={{ backgroundColor: "#db200b", color: "white" }}
          className="cursor-pointer"
        >
          ←
        </Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>Salir</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
      <DialogDescription>
        Si sales ahora, perderás cualquier información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">
      {/* CANCELAR */}
      <Button
        onClick={() => setOpenSalirDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* SÍ */}
      <Button
        onClick={() => {
          const from = params.get("from");
          if (from === "dashboard") {
            router.push("/dashboard");
          } else {
            router.push("/procesos");
          }
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
          </div>

          {/* Derecha: botones de paso — MISMO DISEÑO QUE LOS SUPERIORES */}
  <div className="flex items-center gap-2">

    {/* Volver al paso anterior */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2"
          >
            <span className="text-[#235391] font-bold">← {step - 1}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Regresar al paso anterior</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    {/* Siguiente */}
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleGuardarRubros}
            className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 transition-transform rounded-full px-4 py-2 flex items-center gap-2"
          >
            <span className="font-bold">{step + 1} →</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Avanzar al siguiente paso</p>
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
            <CardContent className="space-y-0">
              <div>
            </div>


             {/* Encabezado con título y navegación superior */}
              <div className="flex justify-between items-center w-full mb-6">

               {/* IZQUIERDA → botón rojo + título */}
                <div className="flex items-center gap-3">

<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setOpenSalirDialog(true)}
          style={{ backgroundColor: "#db200b", color: "white" }}
          className="cursor-pointer"
        >
          ←
        </Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>Salir</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
      <DialogDescription>
        Si sales ahora, perderás cualquier información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">
      {/* CANCELAR */}
      <Button
        onClick={() => setOpenSalirDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* SÍ */}
      <Button
        onClick={() => {
          const from = params.get("from");
          if (from === "dashboard") {
            router.push("/dashboard");
          } else {
            router.push("/procesos");
          }
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

                  <h1 className="text-2xl font-bold">Paso 4: Proveedor</h1>
                </div>

                {/* DERECHA → volver y finalizar */}
                <div className="flex items-center gap-2">

                  {/* Volver */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => setStep(step - 1)}
                          className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2"
                        >
                          <span className="text-[#235391] font-bold">← {step - 1}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Regresar al paso anterior</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Finalizar */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleFinalizarProceso}
                          className="text-white hover:scale-105 transition-transform rounded-full px-4 py-2"
                          style={{ backgroundColor: '#FFBF00' }}
                        >
                          Finalizar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Finalizar proceso</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                </div>
              </div>

      {/* Campo de Oficio de invitación - abajo del título */}
      <div className="mb-4">
        <Label>Oficio de invitación</Label>
        <Input
          value={form.oficio_invitacion ?? ""}
          disabled
          className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
        />
        </div>

        {/* Formulario para añadir proveedor */}
        <div className="flex flex-col space-y-4 rounded-lg bg-white px-0 py-4">
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
                p_e_razon_social: form.razon_social,
                p_e_nombre_comercial: form.nombre_comercial,
                p_e_persona_juridica: form.persona_juridica,
                p_e_correo_electronico: form.correo_electronico,
                p_e_entidad_federativa: parseInt(selectedEntidadId), // ✅ nuevo campo
                p_e_importe_sin_iva: parseFloat((form.e_importe_sin_iva || "").replace(/[^\d.-]/g, "")) || 0,
                p_e_importe_total: parseFloat((form.e_importe_total || "").replace(/[^\d.-]/g, "")) || 0,
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
                    rubro_partida: form.rubro_partida_texto || "", // ✅ muestra el texto del select

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
              className={`border rounded-md p-2 w-full ${
                erroresProveedor.p_e_id_rubro_partida ? "border-red-500 focus:ring-red-500" : ""
              }`}
              value={form.p_e_id_rubro_partida || ""}
              onChange={(e) => {
                setErroresProveedor((prev) => ({ ...prev, p_e_id_rubro_partida: "" })); // ← limpia el error
                const selectedOption = e.target.options[e.target.selectedIndex];
                setForm((prev) => ({
                  ...prev,
                  p_e_id_rubro_partida: e.target.value,
                  rubro_partida_texto: selectedOption.text,
                }));
              }}
            >
                <option value="">Seleccione rubro/partida…</option>
                {presupuestosRubro.map((r, idx) => {
                  const idValido = r.id || Number(sessionStorage.getItem("idRubroCreado")) || 0;
                  const partidaAsociada =
                    partidas.find((p) => String(p.e_id_partida) === String(r.p_id_partida_asociada));
                  const textoPartida = partidaAsociada
                    ? `${partidaAsociada.e_id_partida}`
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
              {/* Botones Ver/Añadir Proveedor */}
<div className="flex items-center gap-3 mt-3">
  <Button
    type="button"
    variant="outline"
    onClick={() => setShowVerProveedoresDialog(true)}
    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
  >
    <Eye className="w-5 h-5" />
    Ver proveedores
  </Button>

  <Button
    type="button"
    variant="outline"
    onClick={() => setShowNuevoProveedorDialog(true)}
    className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
  >
    <UserPlus className="w-5 h-5" />
    Añadir proveedor
  </Button>
</div>

{/* Dialog para ver proveedores */}
<Dialog open={showVerProveedoresDialog} onOpenChange={setShowVerProveedoresDialog}>
  <DialogContent className="max-w-4xl">
    <DialogHeader>
      <DialogTitle>Listado de Proveedores</DialogTitle>
      <p className="text-sm text-gray-500">Consulta los proveedores registrados.</p>
    </DialogHeader>

    <Input
      placeholder="Buscar por RFC o razón social..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="my-3"
    />

    <div className="max-h-[400px] overflow-y-auto border rounded-md">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">RFC</th>
            <th className="py-2 px-4 text-left">Razón Social</th>
            <th className="py-2 px-4 text-left">Correo</th>
            <th className="py-2 px-4 text-left">Entidad</th>
          </tr>
        </thead>
        <tbody>
          {proveedoresDialog
            .filter(
              (p) =>
                p.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.razon_social.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((prov) => (
              <tr key={prov.rfc} className="border-b">
                <td className="py-2 px-4">{prov.rfc}</td>
                <td className="py-2 px-4">{prov.razon_social}</td>
                <td className="py-2 px-4">{prov.correo_electronico}</td>
                <td className="py-2 px-4">{prov.entidad_federativa}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </DialogContent>
</Dialog>

{/* Dialog para añadir proveedor */}
<Dialog open={showNuevoProveedorDialog} onOpenChange={setShowNuevoProveedorDialog}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Añadir nuevo proveedor</DialogTitle>
      <p className="text-sm text-gray-500">Completa los datos del proveedor.</p>
    </DialogHeader>

    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation(); // 🚫 Evita que el evento llegue al formulario principal
        const form = e.currentTarget;
        const data = {
          p_rfc: form.rfc.value,
          p_razon_social: form.razon_social.value,
          p_nombre_comercial: form.nombre_comercial.value,
          p_persona_juridica: form.persona_juridica.value,
          p_correo_electronico: form.correo_electronico.value,
          p_id_entidad_federativa: parseInt(selectedEntidadId || "0"),
        };

        try {
          const resp = await fetch(`${API_BASE}/catalogos/sp_cat_proveedor_gestionar_dialog`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await resp.json();
          if (!resp.ok) throw new Error(result.detail || "Error en la petición");
          toast.success("Proveedor agregado correctamente");
          setShowNuevoProveedorDialog(false);
          // 🔄 Actualizar el catálogo de proveedores después de añadir uno nuevo
          try {
            const proveedoresResp = await fetch(`${API_BASE}/catalogos/proveedores`);
            const proveedoresData = await proveedoresResp.json();
            setCatalogoProveedores(proveedoresData);
          } catch (err) {
            console.error("❌ Error al refrescar catálogo de proveedores:", err);
          }
        } catch (err) {
          toast.error("Error al agregar proveedor");
        }
      }}
      className="space-y-3"
    >
      <Input name="rfc" placeholder="RFC" required />
      <Input name="razon_social" placeholder="Razón Social" required />
      <Input name="nombre_comercial" placeholder="Nombre Comercial" />

      {/* Persona Jurídica */}
      <div>
        <Label>Persona Jurídica</Label>
        <div className="space-y-2 mt-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="persona_juridica"
              value="PERSONA FÍSICA"
            />
            <span>PERSONA FÍSICA</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="persona_juridica"
              value="PERSONA MORAL"
            />
            <span>PERSONA MORAL</span>
          </label>
        </div>
      </div>

      <Input name="correo_electronico" placeholder="Correo electrónico" type="email" />

      {/* Entidad Federativa */}
      <div>
        <Label>Entidad Federativa</Label>
        <Command>
          <CommandInput
            placeholder="Buscar entidad..."
            value={entidadQuery}
            onValueChange={(val) => {
              setEntidadQuery(val);
              setMostrarListaEntidades(val.trim().length > 0);
            }}
          />

          {mostrarListaEntidades && entidadQuery.trim().length > 0 && (
            <CommandList>
              {entidades
                .filter((ent) =>
                  ent.descripcion.toLowerCase().includes(entidadQuery.toLowerCase())
                )
                .map((ent) => (
                  <CommandItem
                    key={ent.id}
                    onSelect={() => {
                      setSelectedEntidadId(String(ent.id));
                      setEntidadQuery(ent.descripcion);
                      setMostrarListaEntidades(false);
                    }}
                  >
                    {ent.descripcion}
                  </CommandItem>
                ))}
            </CommandList>
          )}
        </Command>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          onClick={() => setShowNuevoProveedorDialog(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
          Guardar
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
              <div className="relative">
                <div className="mt-4">
                  <Command shouldFilter={false}>
                  <CommandInput
                    ref={rfcInputRef}
                    placeholder="Escribe RFC..."
                    className={`${
                      erroresProveedor.e_rfc_proveedor ? "border border-red-500 focus:ring-red-500" : ""
                    }`}
                    value={form.e_rfc_proveedor}
                    onValueChange={(value) => {
                      setErroresProveedor((prev) => ({ ...prev, e_rfc_proveedor: "" })); // ← limpiar error
                      setForm((prev) => ({
                        ...prev,
                        e_rfc_proveedor: value,
                      }));
                      if (value.trim().length > 0) setMostrarLista(true);
                      else setMostrarLista(false);
                    }}
                  />
                    {/* ✅ Mostrar CommandList solo cuando el usuario escribe */}
                    {form.e_rfc_proveedor.trim().length > 0 && mostrarLista && (
                      <CommandList className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
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

                                  // ✅ Inserta el valor seleccionado directamente en el input
                                  if (rfcInputRef.current) {
                                    rfcInputRef.current.value = rfc;
                                    rfcInputRef.current.blur(); // 🔒 Cierra el foco para que desaparezca la lista
                                  }

                                  // ✅ Oculta la lista inmediatamente al seleccionar
                                  setMostrarLista(false);
                                }}
                              >
                                {rfc} — {p.razon_social || "—"} — {p.nombre_comercial || "—"}
                              </CommandItem>
                            );
                          })}
                        {catalogoProveedores.length === 0 && (
                          <CommandEmpty>No se encontraron resultados</CommandEmpty>
                        )}
                      </CommandList>
                    )}
                  </Command>
                </div>
              </div>
            </div>

            {/* Importe sin IVA y total */}
            <div className="md:col-span-3 flex items-end gap-2">
              <div className="flex-1">
                <Label>Importe sin IVA</Label>
                <Input
                value={form.e_importe_sin_iva || ""}
                onChange={(e) => {
                  setErroresProveedor((prev) => ({ ...prev, e_importe_sin_iva: "" })); // ← limpiar error
                  const digits = e.target.value.replace(/\D/g, "");
                  const amount = digits ? parseInt(digits, 10) : 0;
                  setForm((prev) => ({
                    ...prev,
                    e_importe_sin_iva: digits ? `$${amount.toLocaleString("es-MX")}` : "",
                    e_importe_total: digits
                      ? `$${(amount * 1.16).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`
                      : "",
                  }));
                }}
                placeholder="$0.00"
                className={`${
                  erroresProveedor.e_importe_sin_iva ? "border border-red-500 focus:ring-red-500" : ""
                }`}
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
{/* Tabla de proveedores añadidos */}
<div className="overflow-hidden rounded-lg shadow-md border border-gray-200">
  <table className="min-w-full text-sm">
    <thead>
      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase tracking-wide">
        <th className="px-3 py-2 font-semibold text-center">Rubro / Partida</th>
        <th className="px-3 py-2 font-semibold text-center">RFC</th>
        <th className="px-3 py-2 font-semibold text-center">Razón social</th>
        <th className="px-3 py-2 font-semibold text-center">Importe sin IVA</th>
        <th className="px-3 py-2 font-semibold text-center">Importe total</th>
        <th className="px-3 py-2 text-center" style={{ width: "40px" }}></th>
      </tr>
    </thead>
    <tbody>
      {proveedores.length === 0 ? (
        <tr>
          <td colSpan={7} className="py-3 text-center text-gray-400">
            No hay proveedores añadidos.
          </td>
        </tr>
      ) : (
        proveedores.map((p, index) => (
          <tr
            key={index}
            className={`border-b ${
              index % 2 === 0 ? "bg-white" : "bg-gray-50"
            } hover:bg-gray-100 transition-colors`}
          >
            <td className="text-justify leading-tight">{p.rubro_partida || "—"}</td>
            <td className="px-3 py-2 text-center">{p.e_rfc_proveedor}</td>
            <td className="px-3 py-2 text-center">{p.razon_social}</td>
            <td className="px-3 py-2 text-center">{p.e_importe_sin_iva}</td>
            <td className="px-3 py-2 text-center">{p.e_importe_total}</td>
            <td className="px-3 py-2 text-center" style={{ width: "40px" }}>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => handleEliminarProveedor(index)}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

{/* --- NAVEGACIÓN INFERIOR COMPLETAMENTE ALINEADA --- */}
<div className="flex justify-between items-center w-full mt-6">

{/* Botón rojo – VOLVER AL DASHBOARD */}
<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setOpenSalirDialog(true)}
          style={{ backgroundColor: "#db200b", color: "white" }}
          className="cursor-pointer"
        >
          ←
        </Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>Salir</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
      <DialogDescription>
        Si sales ahora, perderás cualquier información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">
      {/* CANCELAR */}
      <Button
        onClick={() => setOpenSalirDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* SÍ */}
      <Button
        onClick={() => {
          const from = params.get("from");
          if (from === "dashboard") {
            router.push("/dashboard");
          } else {
            router.push("/procesos");
          }
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

  {/* Botones DERECHA – IGUALITOS A LOS SUPERIORES */}
  <div className="flex items-center gap-2">
    <TooltipProvider>

      {/* Volver – igual al superior */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={() => setStep(3)}
            className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2"
          >
            <span className="text-[#235391] font-bold">← 3</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Regresar al paso anterior</p>
        </TooltipContent>
      </Tooltip>

      {/* Finalizar – igual al superior */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={handleFinalizarProceso}
            className="text-white hover:scale-105 transition-transform rounded-full px-4 py-2"
            style={{ backgroundColor: "#FFBF00" }}
          >
            Finalizar
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Finalizar proceso</p>
        </TooltipContent>
      </Tooltip>

    </TooltipProvider>
  </div>
</div>
      </CardContent>
    </Card>
  );
})()} {/* ← cierra el paso 4 */}

    </main>
  );
}