"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Suspense } from "react";

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

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando…</div>}>
      <NuevoProcesoPageContent />
    </Suspense>
  );
}
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

function normalizeCurrencyValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrencyMx(value: number | null, options?: Intl.NumberFormatOptions) {
  if (value === null) return "";
  return `$${value.toLocaleString("es-MX", options)}`;
}

function fromIsoToDateAndTime(iso: string | null): { fecha: string; hora: string } {
  if (!iso) return { fecha: "", hora: "" };
  const d = new Date(iso);

  // dd/mm/aaaa
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const fecha = `${dd}/${mm}/${yyyy}`;

  // HH:MM (24h)
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const hora = `${hh}:${mi}`;

  return { fecha, hora };
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
function NuevoProcesoPageContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
   const [openSalirDialog, setOpenSalirDialog] = useState(false);
  const seguimientoIdParam = searchParams.get("id");
  const initialStepParam = searchParams.get("step");
  const [step, setStep] = React.useState(initialStepParam ? Number(initialStepParam) : 1);
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
  const [mostrarServidores, setMostrarServidores] = React.useState(false);
  const [mostrarSesiones, setMostrarSesiones] = React.useState(false);
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
  const [openEliminarPartidaDialog, setOpenEliminarPartidaDialog] = useState(false);
  const [partidaAEliminar, setPartidaAEliminar] = useState<number | null>(null);
  const [procesoBloqueado, setProcesoBloqueado] = React.useState(false);
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
  // Estado para habilitar o no el botón "Nueva partida"
  const [puedeAgregarPartida, setPuedeAgregarPartida] = React.useState(false);
  const hasPersistedPartidas = React.useMemo(
    () => partidas.some((p) => Number(p.id)),
    [partidas]
  );
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
     let data = null;

      try {
        data = await resp.json();
      } catch (e) {
        console.error("❌ Error parseando JSON del backend:", e);
      }

      if (!resp.ok) {
        toast.error("Error al guardar la partida");
        setPuedeAgregarPartida(false);
        return;
      }

      // 🟡 Validar que el backend realmente envió un resultado
      if (!data || typeof data.resultado === "undefined") {
        console.warn("⚠ Backend respondió sin 'resultado':", data);
        toast.error("La partida se guardó, pero el servidor no envió confirmación.");
        setPuedeAgregarPartida(false);
        return;
      }

          // Buscar descripciones necesarias
      const partidaSel = catalogoPartidas.find(
        (p: { id: string | number }) =>
          String(p.id) === String(nuevaPartida.e_id_partida)
      );

      const fuenteSel = fuentes.find(
        (f) => String(f.id) === String(nuevaPartida.e_id_fuente_financiamiento)
      );

      // Agregar al estado
      setPartidas((prev) => [
        ...prev,
        {
          id: data.resultado,
          no_requisicion: nuevaPartida.e_no_requisicion,
          e_id_partida: nuevaPartida.e_id_partida,
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

toast.success("Partida guardada correctamente");
setPuedeAgregarPartida(true);
    } catch (err) {
      toast.error("Error al guardar la partida");
      setPuedeAgregarPartida(false);
    }
  };

  // Paso 3
  const [rubros, setRubros] = React.useState<any[]>([]);
  const [openEliminarRubroDialog, setOpenEliminarRubroDialog] = useState(false);
  const [rubroAEliminar, setRubroAEliminar] = useState<number | null>(null);
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


  React.useEffect(() => {
  if (step === 4) {
    recargarRubros();
  }
}, [step]);


  // Paso 4: Proveedores añadidos
  const [proveedores, setProveedores] = React.useState<any[]>([]);
  const [entidades, setEntidades] = React.useState<any[]>([]);
  const [selectedEntidadId, setSelectedEntidadId] = React.useState<string>("");
  // Estado para buscar y mostrar entidades federativas
  const [entidadQuery, setEntidadQuery] = React.useState("");
  const [mostrarListaEntidades, setMostrarListaEntidades] = React.useState(false);
  const [openEliminarProveedorDialog, setOpenEliminarProveedorDialog] = React.useState(false);
  // 👇 Tipo correcto para evitar errores
const [proveedorAEliminar, setProveedorAEliminar] = React.useState<{
  index: number;
  proveedor: any;
} | null>(null);

  const [forzarAutoselect, setForzarAutoselect] = useState(false);

  React.useEffect(() => {
  if (forzarAutoselect && form.e_rfc_proveedor) {
    setMostrarLista(false);

    if (rfcInputRef.current) {
      rfcInputRef.current.value = form.e_rfc_proveedor;
      rfcInputRef.current.blur();
    }

    // apagar bandera una vez aplicado
    setForzarAutoselect(false);
  }
}, [forzarAutoselect, form.e_rfc_proveedor]);

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

const [proveedoresDialog, setProveedoresDialog] = React.useState<any[]>([]);
const [searchTerm, setSearchTerm] = React.useState("");


  // Paso 4: Cargar todos los proveedores al entrar al paso 4 (solo catálogo de backend)
  // Paso 4: Cargar todos los proveedores al entrar al paso 4 (solo catálogo de backend)
// ======================================================
// 1. Cargar proveedores cuando entras al Paso 4
// ======================================================
React.useEffect(() => {
  if (step === 4) {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
        const data = await resp.json();

        // 🔥 Normaliza SIEMPRE a array
        const lista =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.proveedores)
            ? data.proveedores
            : [];

        setCatalogoProveedores(lista);
      } catch (err) {
        console.error("❌ Error al cargar proveedores:", err);
        setCatalogoProveedores([]); // fallback seguro
      }
    })();
  }
}, [step]);

// ======================================================
// 2. Cargar proveedores SOLO al abrir el diálogo "Ver proveedores"
// ======================================================
React.useEffect(() => {
  if (showVerProveedoresDialog) {
    fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`)
      .then((r) => r.json())
      .then((data) => {
        const lista =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.proveedores)
            ? data.proveedores
            : [];
        setProveedoresDialog(lista);
      })
      .catch((err) =>
        console.error("❌ Error cargando proveedores:", err)
      );
  }
}, [showVerProveedoresDialog]);

// ======================================================
// 3. Cargar entidades federativas una sola vez
// ======================================================
React.useEffect(() => {
  const fetchEntidades = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entidad-federativa?p_id=-99`);
      const data = await resp.json();

      const lista =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

      setEntidades(lista);
    } catch (err) {
      console.error("❌ Error cargando entidades:", err);
    }
  };

  fetchEntidades();
}, []);

// 🔥 FUNCIÓN GLOBAL PARA CARGAR RUBROS DESDE EL BACKEND
const recargarRubros = async () => {
  const partidasConId = partidas.filter(p => Number(p.id));

  const rubrosPorPartida = await Promise.all(
    partidasConId.map(async (partida) => {
      const resp = await fetch(
        `${API_BASE}/procesos/editar/seguimiento-partida-rubro?p_id=-99&p_id_seguimiento_partida=${partida.id}`
      );

      const data = await resp.json();

      return Array.isArray(data)
        ? data.map((r) => {
            const rubroCat = rubros.find(
              (cat) =>
                String(cat.clave) === String(r.e_id_rubro) ||
                String(cat.id) === String(r.e_id_rubro)
            );

            return {
              id: Number(r.id),
              p_e_id_rubro: r.e_id_rubro?.toString(),
              rubro_descripcion:
                rubroCat?.descripcion ||
                r.rubro_descripcion ||
                "",
              p_e_monto_presupuesto_suficiencia: Number(
                r.e_monto_presupuesto_suficiencia
              ),
              p_id_partida_asociada: partida.e_id_partida?.toString(),
              p_id_seguimiento_partida: Number(partida.id),
              estatus: r.estatus || "",
            };
          })
        : [];
    })
  );

  setPresupuestosRubro(rubrosPorPartida.flat());
};


// ======================================================
// 4. Cargar rubros y partidas al entrar al Paso 4 (mejorado)
// ======================================================
  React.useEffect(() => {
    if (step !== 4) return;

    const rubrosConId = presupuestosRubro.filter((r) => Number(r.id));
    if (rubrosConId.length === 0) {
      setProveedores([]);
      return;
    }

    let cancelado = false;

    (async () => {
      try {
        const proveedoresPorRubro = await Promise.all(
          rubrosConId.map(async (rubro) => {
            try {
              const url = `${API_BASE}/procesos/editar/seguimiento-partida-rubro-proveedor?p_id=-99&p_id_seguimiento_partida_rubro=${rubro.id}`;
              const resp = await fetch(url);
              const data = await resp.json();
              if (!resp.ok || !Array.isArray(data)) {
                console.error("❌ Error al cargar proveedores del rubro:", data);
                return [];
              }

              return data.map((prov: any) => {
                const partida = partidas.find(
                  (p) => String(p.e_id_partida) === String(rubro.p_id_partida_asociada)
                );
                const partidaTexto = partida ? `${partida.e_id_partida}` : "Partida no encontrada";

                const montoSinIva = normalizeCurrencyValue(
                  prov.e_importe_sin_iva ?? prov.importe_sin_iva ?? prov.monto_sin_iva ?? ""
                );
                const montoTotal = normalizeCurrencyValue(
                  prov.e_importe_total ?? prov.importe_total ?? prov.monto_total ?? ""
                );

                return {
                  id: prov.id,
                  e_rfc_proveedor: prov.e_rfc_proveedor || prov.rfc || "",
                  razon_social: prov.razon_social || prov.e_razon_social || "",
                  nombre_comercial: prov.nombre_comercial || prov.e_nombre_comercial || "",
                  e_importe_sin_iva: formatCurrencyMx(
                    montoSinIva !== null ? Math.round(montoSinIva) : null
                  ),
                  e_importe_total: formatCurrencyMx(montoTotal, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  p_e_id_rubro_partida: String(rubro.id),
                  rubro_partida: `${partidaTexto} | Rubro ${rubro.p_e_id_rubro} — ${rubro.rubro_descripcion}`,
                  p_id_seguimiento_partida_rubro: rubro.id,
                };
              });
            } catch (err) {
              console.error("❌ Error al consultar proveedores del rubro:", rubro.id, err);
              return [];
            }
          })
        );

        if (!cancelado) {
          setProveedores(proveedoresPorRubro.flat());
        }
      } catch (err) {
        if (!cancelado) {
          console.error("❌ Error al cargar proveedores existentes:", err);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [step, presupuestosRubro, partidas]);


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

// Paso 4: Finalizar proceso handler (actualizado con validación completa)
const handleFinalizarProceso = React.useCallback(async () => {
  console.log("🔍 Validando proveedores antes de finalizar...");

  const nuevosErrores: Record<string, string> = {};

/* ============================================================
   1️⃣ VALIDAR: TODOS LOS RUBROS DEBEN TENER PROVEEDOR
============================================================ */

const rubrosSinProveedor = presupuestosRubro.filter(
  r => !proveedores.some(p => Number(p.p_e_id_rubro_partida) === Number(r.id))
);

// Si hay rubros sin proveedor → mostrar mensaje específico
if (rubrosSinProveedor.length > 0) {
  // crear mensaje detallado
  const detalles = rubrosSinProveedor
    .map(r => {
      const id = r.p_e_id_rubro || r.e_id_rubro || r.e_id_rubro_partida || "—";
      const desc = r.rubro_descripcion || r.rubro || "Rubro sin descripción";
      return `• Rubro ${id} — ${desc}`;
    })
    .join("\n");

  toast.warning(
    `Hay rubros sin proveedor asignado:\n${detalles}`,
    { duration: 6000 }
  );

  return;
}

  /* ============================================================
     2️⃣ SI NO HAY PROVEEDORES → VALIDAR CAMPOS OBLIGATORIOS
     (solo aplica si la tabla está completamente vacía)
  ============================================================ */
  if (proveedores.length === 0) {
    if (!form.p_e_id_rubro_partida) {
      nuevosErrores.p_e_id_rubro_partida = "Este campo es obligatorio";
    }

    if (!form.e_rfc_proveedor?.trim()) {
      nuevosErrores.e_rfc_proveedor = "Este campo es obligatorio";
    }

    if (!form.e_importe_sin_iva?.trim()) {
      nuevosErrores.e_importe_sin_iva = "Este campo es obligatorio";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresProveedor(nuevosErrores);
      toast.warning("Completa los campos o añade al menos un proveedor antes de finalizar.");
      return;
    }
  }

  /* ============================================================
     3️⃣ SI TODO ESTÁ BIEN — PERMITIR FINALIZAR
  ============================================================ */
  console.log("✅ Validación correcta. Finalizando proceso...");

  setErroresProveedor({}); // limpiar errores

  try {
    /* ------------------------------------------------------------
       📩 Notificación (solo usuarios ENTE)
    ------------------------------------------------------------ */
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
            { method: "POST", headers: { "Content-Type": "application/json" } }
          );
          const data = await resp.json();
          console.log("📩 Respuesta del backend:", data);
        } catch (err) {
          console.error("❌ Error al enviar la notificación:", err);
        }
      }
    }

    /* ------------------------------------------------------------
       🎉 Finalizar proceso
    ------------------------------------------------------------ */
    toast.success("Proceso finalizado correctamente.");
    router.push("/procesos");

  } catch (err) {
    console.error("❌ Error finalizando proceso:", err);
    toast.error("Error al finalizar el proceso.");
  }
}, [
  proveedores,
  presupuestosRubro,
  form,
  router,
  user,
  folio,
  folioSeguimiento
]);

  /* ========================================
     🔹 Cargar catálogos paso 1
  ======================================== */
  React.useEffect(() => {
  if (!user?.id_ente) return;
  (async () => {
    try {
      // 🔹 Catálogos básicos paso 1
      const enteResp = await fetch(
        `${API_BASE}/catalogos/entes?p_id=${user.id_ente}&p_descripcion=-99`
      );
      const enteData = await enteResp.json();
      setEnteDescripcion(enteData?.[0]?.descripcion || "—");

      const sResp = await fetch(
        `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user.id_ente}`
      );
      const servidoresData = await sResp.json();
      setServidores(servidoresData);

      const tResp = await fetch(`${API_BASE}/procesos/tipos-evento/`);
      const tiposEventoData = await tResp.json();
      setTiposEvento(tiposEventoData);

      const nResp = await fetch(`${API_BASE}/catalogos/sesiones-numeros/`);
      const numerosSesionData = await nResp.json();
      setNumerosSesion(numerosSesionData);

      // 🔹 Si NO hay id en la URL, hasta aquí (modo "nuevo")
      if (!seguimientoIdParam) return;

      const idSeguimiento = Number(seguimientoIdParam);

      // ✅ Guardar folio/seguimiento para pasos 2,3,4
      setFolio(idSeguimiento);
      setFolioSeguimiento(idSeguimiento);
      sessionStorage.setItem("folioSeguimiento", String(idSeguimiento));

      // 🔹 Traer datos del seguimiento para edición
      const segResp = await fetch(
        `${API_BASE}/procesos/editar/seguimiento?p_id=${idSeguimiento}&p_id_ente=${user.id_ente}`
      );
      const segData = await segResp.json();

      if (Array.isArray(segData) && segData.length > 0) {
        const s = segData[0];

        // ⏱️ fecha y hora desde ISO
        const { fecha, hora } = fromIsoToDateAndTime(s.e_fecha_y_hora_reunion);

        // 🧾 Llenar el formulario principal
        setForm((prev) => ({
          ...prev,
          oficio_invitacion: s.e_oficio_invitacion || "",
          servidor_publico_cargo: s.e_servidor_publico_cargo || "",
          tipo_evento: s.e_tipo_evento?.trim() || "",
          tipo_licitacion: s.e_tipo_licitacion?.trim() || "",
          tipo_licitacion_notas: s.e_tipo_licitacion_notas || "",
          fecha,
          hora,
        }));

        // 👤 Seleccionar servidor (si viene el id)
        if (s.e_id_servidor_publico_emite) {
          const servidor = servidoresData.find(
            (sv: any) => Number(sv.id) === Number(s.e_id_servidor_publico_emite)
          );
          if (servidor) {
            setServidorSeleccionado(servidor);
            setBusquedaServidor(servidor.nombre);
          }
        }

        // 🔁 Seleccionar número de sesión (si viene el no_veces)
        if (s.e_tipo_licitacion_no_veces) {
          const sesion = numerosSesionData.find(
            (n: any) => Number(n.id) === Number(s.e_tipo_licitacion_no_veces)
          );
          if (sesion) {
            setSesionSeleccionada(sesion);
            setBusquedaSesion(sesion.descripcion);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
    }
  })();
}, [user?.id_ente, seguimientoIdParam]);

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

  // ⭐ Forzar que el valor del backend aparezca en el select
React.useEffect(() => {
  if (!tiposLicitacion.length) return;
  if (!form.tipo_licitacion) return;

  const existe = tiposLicitacion.some(
    t =>
      t.valor?.trim().toLowerCase() ===
      form.tipo_licitacion?.trim().toLowerCase()
  );

  // Si NO existe en el catálogo → agregarlo temporalmente
  if (!existe) {
    setTiposLicitacion(prev => [
      ...prev,
      { id: -1, valor: form.tipo_licitacion }
    ]);
  }
}, [tiposLicitacion, form.tipo_licitacion]);


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
  // 🧩 Tomar el id DESDE la URL o desde folio
  const idProceso = seguimientoIdParam ? Number(seguimientoIdParam) : folio || 0;

  const resp = await fetch(`${API_BASE}/procesos/editar/ente-seguimiento-captura`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      p_id: idProceso,
      p_e_id_ente: String(user.id_ente),
      p_e_oficio_invitacion: form.oficio_invitacion,
      p_e_id_servidor_publico_emite: Number(servidorSeleccionado.id),
      p_e_servidor_publico_cargo: form.servidor_publico_cargo,
      p_e_tipo_evento: form.tipo_evento,
      p_e_tipo_licitacion: form.tipo_licitacion,
      p_e_tipo_licitacion_no_veces: Number(sesionSeleccionada.id),
      p_e_tipo_licitacion_notas: form.tipo_licitacion_notas,
      p_e_fecha_y_hora_reunion: fechaHora,
      p_e_id_usuario_registra: user.id,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("⚠️ Backend error (editar paso 1):", data);
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail || data)
    );
  }

  // ✅ Aquí ya no dependes de data.resultado (ya conoces el id)
  setFolio(idProceso);
  setFolioSeguimiento(idProceso);
  sessionStorage.setItem("folioSeguimiento", String(idProceso));

  toast.success("Paso 1 actualizado correctamente");
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
        // 1) Cargar catálogos
        const [fResp, pResp] = await Promise.all([
          fetch(`${API_BASE}/catalogos/fuentes-financiamiento?p_id=-99&p_id_ramo=-99`).then((r) => r.json()),
          fetch(`${API_BASE}/catalogos/partidas?p_id=-99&p_id_capitulo=-99&p_tipo=PROVEEDURIA`).then((r) => r.json()),
        ]);
        setFuentes(Array.isArray(fResp) ? fResp : []);
        setCatalogoPartidas(Array.isArray(pResp) ? pResp : []);

        // 2) Determinar folio activo (edición / nuevo)
        const folioActivo =
          seguimientoIdParam ||
          folio ||
          folioSeguimiento ||
          Number(sessionStorage.getItem("folioSeguimiento"));

        if (!folioActivo) return;

        // 3) Cargar partidas existentes desde el backend
        const res = await fetch(
          `${API_BASE}/procesos/editar/seguimiento-partida?p_id=-99&p_id_seguimiento=${folioActivo}`
        );
        const data = await res.json();

        if (!Array.isArray(data)) {
          setPartidas([]);
          return;
        }

        // 4) Normalizar al formato que usa tu tabla y tus handlers
        const partidasNormalizadas = data.map((p: any) => ({
          id: p.id, // ID real en BD

          // Campos "e_" que usa el backend
          e_no_requisicion: p.e_no_requisicion,
          e_id_partida: p.e_id_partida,
          e_id_fuente_financiamiento: p.e_id_fuente_financiamiento,

          // Campos para mostrar en la tabla
          no_requisicion: p.e_no_requisicion,
          partida_descripcion: p.partida_descripcion ?? p.partida ?? "",
          clave_capitulo: p.id_capitulo ?? "",
          id_capitulo: p.id_capitulo ?? p.capitulo ?? "",
          capitulo: p.capitulo ?? "",
          fuente_descripcion: p.descripcion_fuente ?? p.fuente_financiamiento ?? p.f_financiamiento ?? "",
          fuente_financiamiento: p.fuente_financiamiento ?? p.f_financiamiento ?? "",
          descripcion: p.descripcion_fuente ?? p.etiquetado ?? "",
          fuente_etiquetado: p.etiquetado ?? "",
          fuente_fondo: p.fondo ?? p.fondo_fuente ?? "",
          fondo: p.fondo ?? p.fondo_fuente ?? "",
          id_ramo: p.id_ramo ?? "",
          ramo_descripcion: p.ramo ?? p.ramo_fuente ?? "",
        }));

        setPartidas(partidasNormalizadas);
      } catch (err) {
        console.error("❌ Error al cargar catálogos/partidas del paso 2:", err);
      }
    })();
  }, [step, seguimientoIdParam, folio, folioSeguimiento]);

  /**
   * Cuando el usuario abre directamente el paso 3/4 (modo edición) necesitamos
   * asegurar que las partidas y catálogos ya estén cargados para poder traer los rubros.
   */
  React.useEffect(() => {
    if (step < 3) return;

    const folioActivo =
      Number(seguimientoIdParam) ||
      folio ||
      folioSeguimiento ||
      Number(sessionStorage.getItem("folioSeguimiento"));

    if (!folioActivo) return;

    let cancelado = false;

    (async () => {
      try {
        let catalogoActual = catalogoPartidas;
        if (!catalogoActual.length) {
          const resp = await fetch(
            `${API_BASE}/catalogos/partidas?p_id=-99&p_id_capitulo=-99&p_tipo=PROVEEDURIA`
          );
          const data = await resp.json();
          catalogoActual = Array.isArray(data) ? data : [];
          if (!cancelado) setCatalogoPartidas(catalogoActual);
        }

        let fuentesActuales = fuentes;
        if (!fuentesActuales.length) {
          const resp = await fetch(
            `${API_BASE}/catalogos/fuentes-financiamiento?p_id=-99&p_id_ramo=-99`
          );
          const data = await resp.json();
          fuentesActuales = Array.isArray(data) ? data : [];
          if (!cancelado) setFuentes(fuentesActuales);
        }

        if (hasPersistedPartidas) return;

        const res = await fetch(
          `${API_BASE}/procesos/editar/seguimiento-partida?p_id=-99&p_id_seguimiento=${folioActivo}`
        );
        const data = await res.json();
        if (!Array.isArray(data) || cancelado) return;

        const partidasNormalizadas = data.map((p: any) => {
          const infoPartida = catalogoActual.find(
            (c: any) => String(c.id) === String(p.e_id_partida)
          );
          const infoFuente = fuentesActuales.find(
            (f: any) => String(f.id) === String(p.e_id_fuente_financiamiento)
          );
          return {
            ...p,
            id: p.id,
            e_no_requisicion: p.e_no_requisicion,
            e_id_partida: String(p.e_id_partida ?? ""),
            e_id_fuente_financiamiento: String(p.e_id_fuente_financiamiento ?? ""),
            partida_descripcion: infoPartida?.descripcion ?? p.partida_descripcion ?? "",
            clave_capitulo: infoPartida?.id_capitulo ?? "",
            capitulo: infoPartida?.capitulo ?? "",
            fuente_descripcion: infoFuente?.descripcion ?? "",
            fuente_etiquetado: infoFuente?.etiquetado ?? "",
            fuente_fondo: infoFuente?.fondo ?? "",
            id_ramo: infoFuente?.id_ramo ?? "",
            ramo_descripcion: infoFuente?.ramo ?? "",
          };
        });

        if (!cancelado) {
          setPartidas(partidasNormalizadas);
        }
      } catch (err) {
        if (!cancelado) {
          console.error("❌ Error al sincronizar partidas para el paso 3:", err);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [
    step,
    hasPersistedPartidas,
    seguimientoIdParam,
    folio,
    folioSeguimiento,
    catalogoPartidas.length,
    fuentes.length,
  ]);

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
     🔹 Guardar Paso 3 (ya lo tenías)
  ======================================== */
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

// 🔥 Resetear errores cuando cambia de step
React.useEffect(() => {
  setErroresForm({});
}, [step]);

// =======================================
//     🔍 VALIDACIÓN DEL STEP 2
// =======================================
const validarStep2 = () => {
  const nuevosErrores: Record<string, string> = {};

  if (!nuevaPartida.e_no_requisicion?.trim()) {
    nuevosErrores.e_no_requisicion = "Este campo es obligatorio";
  }
  if (!nuevaPartida.e_id_partida?.toString().trim()) {
    nuevosErrores.e_id_partida = "Este campo es obligatorio";
  }
  if (!nuevaPartida.e_id_fuente_financiamiento?.toString().trim()) {
    nuevosErrores.e_id_fuente_financiamiento = "Este campo es obligatorio";
  }

  setErroresForm(nuevosErrores);

  return Object.keys(nuevosErrores).length === 0;
};

  /* ========================================
     🔹 Catálogo de rubros (Paso 3)
  ======================================== */
  React.useEffect(() => {
    if (step !== 3) return;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
        const data = await resp.json();
        setRubros(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error al cargar catálogo de rubros:", err);
        setRubros([]);
      }
    })();
  }, [step]);

  // Handler para añadir partida
  const handleAddPartida = async () => {
    const errores: Record<string, string> = {};

    if (!nuevaPartida.e_no_requisicion) errores.e_no_requisicion = "Campo obligatorio";
    if (!nuevaPartida.e_id_partida) errores.e_id_partida = "Campo obligatorio";
    if (!nuevaPartida.e_id_fuente_financiamiento) errores.e_id_fuente_financiamiento = "Campo obligatorio";

    if (Object.keys(errores).length > 0) {
      setErroresForm(errores);
      toast.warning("Completa todos los campos obligatorios antes de añadir una partida.");
      return;
    }

    try {
      const folioGuardado =
        folioSeguimiento || folio || Number(sessionStorage.getItem("folioSeguimiento"));

      if (!folioGuardado) {
        toast.info("Primero debes completar el Paso 1 antes de continuar.");
        return;
      }

      // Guardar en BD
      const payload = {
        p_id_seguimiento: folioGuardado,
        p_id: 0,
        p_e_no_requisicion: String(nuevaPartida.e_no_requisicion).trim(),
        p_e_id_partida: String(nuevaPartida.e_id_partida).trim(),
        p_e_id_fuente_financiamiento: String(nuevaPartida.e_id_fuente_financiamiento).trim(),
      };

      const resp = await fetch(`${API_BASE}/procesos/editar/ente-seguimiento-partida-captura`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        console.error("❌ Error al guardar partida:", data);
        toast.error("Error al guardar la partida (HTTP)");
        return;
      }

      toast.success("Partida guardada correctamente.");

      // ⬇️⬇️ CLAVE: volver a consultar las partidas para obtener el ID real y refrescar la tabla
      const refRes = await fetch(
        `${API_BASE}/procesos/editar/seguimiento-partida?p_id=-99&p_id_seguimiento=${folioGuardado}`
      );
      const refData = await refRes.json();

      if (Array.isArray(refData)) {
        const partidasNormalizadas = refData.map((p: any) => ({
          id: p.id,
          e_no_requisicion: p.e_no_requisicion,
          e_id_partida: p.e_id_partida,
          e_id_fuente_financiamiento: p.e_id_fuente_financiamiento,
          no_requisicion: p.e_no_requisicion,
          partida_descripcion: p.partida_descripcion ?? p.partida ?? "",
          clave_capitulo: p.id_capitulo ?? "",
          id_capitulo: p.id_capitulo ?? p.capitulo ?? "",
          capitulo: p.capitulo ?? "",
          fuente_descripcion: p.descripcion_fuente ?? p.fuente_financiamiento ?? p.f_financiamiento ?? "",
          fuente_financiamiento: p.fuente_financiamiento ?? p.f_financiamiento ?? "",
          descripcion: p.descripcion_fuente ?? p.etiquetado ?? "",
          fuente_etiquetado: p.etiquetado ?? "",
          fuente_fondo: p.fondo ?? p.fondo_fuente ?? "",
          fondo: p.fondo ?? p.fondo_fuente ?? "",
          id_ramo: p.id_ramo ?? "",
          ramo_descripcion: p.ramo ?? p.ramo_fuente ?? "",
        }));
        setPartidas(partidasNormalizadas);
      }

      // Limpiar campos
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
    } catch (err) {
      console.error("❌ Error inesperado:", err);
      toast.error("Error al guardar la partida.");
    }
  };


  // Handler eliminar partida
  const handleEliminarPartida = async (idx: number) => {
    const partida = partidas[idx];
    const partidaId = partida?.id;

    try {
      if (partidaId) {
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/partida-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_accion: "ELIMINAR",
            p_id: partidaId,
            p_id_seguimiento: folioSeguimiento || folio,
            p_e_id_partida: partida.e_id_partida,
            p_e_no_requisicion: partida.e_no_requisicion ?? partida.no_requisicion,
            p_e_id_fuente_financiamiento: partida.e_id_fuente_financiamiento,
          }),
        });

        const deleteResult = await resp.json();  // ← YA NO SE LLAMA "data"

        if (!resp.ok) {
          console.error("❌ Error al eliminar partida:", deleteResult);
          toast.error("No se pudo eliminar la partida del servidor.");
          return;
        }

        toast.success(`Partida eliminada correctamente.`);
      } else {
        toast.info("Partida eliminada localmente (sin ID en base de datos).");
      }

      setPartidas((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("❌ Error al eliminar partida:", err);
      toast.error("Error de conexión al eliminar la partida.");
    }
  };

  // Handler avanzar al siguiente paso (nuevo bloque)
  const handleNext = async () => {
  try {
    const folioActual =
      folioSeguimiento || folio || Number(sessionStorage.getItem("folioSeguimiento"));

    if (!folioActual) {
      toast.info("Primero debes completar el Paso 1 antes de continuar.");
      return;
    }

    // ============================================
    //   🔥 VALIDAR SOLO SI NO HAY PARTIDAS REGISTRADAS
    // ============================================
    if (step === 2 && partidas.length === 0) {
      const nuevosErrores: Record<string, string> = {};

      if (!nuevaPartida.e_no_requisicion?.trim()) {
        nuevosErrores.e_no_requisicion = "Este campo es obligatorio";
      }
      if (!nuevaPartida.e_id_partida?.toString().trim()) {
        nuevosErrores.e_id_partida = "Este campo es obligatorio";
      }
      if (!nuevaPartida.e_id_fuente_financiamiento?.toString().trim()) {
        nuevosErrores.e_id_fuente_financiamiento = "Este campo es obligatorio";
      }

      if (Object.keys(nuevosErrores).length > 0) {
        setErroresForm(nuevosErrores);
        toast.warning("Debes completar todos los campos obligatorios.");
        return;
      }
    }

    // ============================================
    //   🔥 CONSULTAR PARTIDAS DESDE LA BD
    // ============================================
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
    const partidasActualizadas = Array.isArray(data) ? data : partidas;

    // ============================================
    //   🔥 VALIDAR QUE AL MENOS UNA PARTIDA SEA COMPLETA
    // ============================================
    const partidasValidas = partidasActualizadas.filter((p: any) => {
      const noReq = p.e_no_requisicion ?? p.no_requisicion;
      const idPartida = p.e_id_partida ?? p.partida ?? p.id_partida;
      const fuente =
        p.e_id_fuente_financiamiento ??
        p.fuente_financiamiento ??
        p.id_fuente_financiamiento;

      return (
        String(noReq || "").trim() !== "" &&
        String(idPartida || "").trim() !== "" &&
        String(fuente || "").trim() !== ""
      );
    });

    if (partidasValidas.length === 0) {
      toast.warning("Debes añadir al menos una partida antes de continuar.");
      return;
    }

    // ============================================
    //   🔥 SI TODO ESTÁ BIEN → AVANZAR
    // ============================================
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

    const rubroPartidaId =
      Number(
        proveedor.p_id_seguimiento_partida_rubro ||
          proveedor.p_e_id_rubro_partida ||
          proveedor.id_partida_rubro ||
          0
      ) || 0;

    if (!rubroPartidaId) {
      toast.warning("No se encontró el ID del rubro asociado al proveedor.");
      return;
    }

    const payload = {
      p_accion: "ELIMINAR",
      p_id: Number(proveedor.id),
      p_id_seguimiento_partida_rubro: rubroPartidaId,
      p_e_rfc_proveedor: proveedor.e_rfc_proveedor,
      p_e_importe_sin_iva: normalizeCurrencyValue(proveedor.e_importe_sin_iva) || 0,
      p_e_importe_total: normalizeCurrencyValue(proveedor.e_importe_total) || 0,
    };

    const resp = await fetch(
      `${API_BASE}/procesos/editar/ente-seguimiento-partida-rubro-proveedor-captura`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

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

React.useEffect(() => {
  // Solo cargar rubros en paso 2, 3 o 4
  if (!(step === 2 || step === 3 || step === 4)) return;

  const partidasConId = partidas.filter((p) => Number(p.id));
  if (partidasConId.length === 0) {
    setPresupuestosRubro([]);
    return;
  }

  let activo = true;

  (async () => {
    try {
      const rubrosPorPartida = await Promise.all(
        partidasConId.map(async (partida) => {
          try {
            const resp = await fetch(
              `${API_BASE}/procesos/editar/seguimiento-partida-rubro?p_id=-99&p_id_seguimiento_partida=${partida.id}`
            );
            const data = await resp.json();

            if (!resp.ok) return [];
            if (!Array.isArray(data)) return [];

            return data.map((r) => ({
              id: r.id,
              p_e_id_rubro: r.e_id_rubro?.toString() || "",
              rubro_descripcion: r.rubro_descripcion || r.rubro || "",
              p_e_monto_presupuesto_suficiencia:
                Number(r.e_monto_presupuesto_suficiencia) || 0,
              p_id_partida_asociada: partida.e_id_partida?.toString() || "",
              p_id_seguimiento_partida: Number(partida.id),
              estatus: r.estatus || "",
            }));
          } catch {
            return [];
          }
        })
      );

      if (!activo) return;
      setPresupuestosRubro(rubrosPorPartida.flat());
    } catch {
      console.error("Error cargando rubros previos");
    }
  })();

  return () => {
    activo = false;
  };
}, [step, partidas]);

  /* ========================================
     🔹 Render UI (Paso 1, 2, 3)
  ======================================== */
  // 👉 Logs para depuración del tipo de licitación
console.log("VALOR ACTUAL tipo_licitacion:", form.tipo_licitacion);
console.log("LISTA DE VALORES POSIBLES:", tiposLicitacion.map(t => t.valor));
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <StepIndicator currentStep={step} />

{/* Paso 1 */}
      {step === 1 && (
          <>
          {/* 🔥 BOTÓN SUPERIOR DE SALIR (FUERA DEL CARD) */}
<div className="flex justify-start mb-4">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setOpenSalirDialog(true)}
          style={{ backgroundColor: "#db200b", color: "white" }}
          className="cursor-pointer"
          type="button"
        >
          ←
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Salir</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  {/* --- DIALOG --- */}
  <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
    <DialogContent className="max-w-sm">
      <DialogTitle className="sr-only">Confirmación de salida</DialogTitle>

      <DialogHeader>
        <h2 className="text-lg font-bold">¿Deseas salir del proceso?</h2>
        <p className="text-sm text-gray-600">
          Si sales ahora, perderás cualquier información no guardada.
        </p>
      </DialogHeader>

      <DialogFooter className="flex justify-end gap-3 pt-4">
        <Button
          onClick={() => setOpenSalirDialog(false)}
          style={{ backgroundColor: "#db200b", color: "white" }}
          type="button"
        >
          Cancelar
        </Button>

        <Button
          onClick={() => {
            const from = searchParams.get("from");
            router.push(from === "dashboard" ? "/dashboard" : "/procesos");
          }}
          style={{ backgroundColor: "#34e004", color: "white" }}
          type="button"
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
                  <p>Avanzar al siguiente paso </p>
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
                          setMostrarServidores(val.trim().length > 0);   
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
                        onChange={(e) => {
                          setErrores(prev => ({ ...prev, tipo_evento: "" })); // 🔥 FIX
                          setForm({ ...form, tipo_evento: e.target.value });
                        }}
                      >
                        <option value="">Seleccione…</option>
                        {tiposEvento.map((t) => (
                          <option key={t.id} value={t.descripcion}>
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
                          setMostrarSesiones(val.trim().length > 0);
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
          <div className="w-[900%]">
            <Label>Usuario</Label>
            <Input
              value={user?.nombre || "Cargando..."}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
            />
          </div>

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
                  <p>Avanzar al siguiente paso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

      </CardContent>
    </Card>

    {/* ===================================================== */}
    {/* 🔥 BOTÓN INFERIOR DE SALIR (FUERA DEL CARD)            */}
    {/* ===================================================== */}
    <div className="flex justify-start items-center gap-3 w-full mt-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenSalirDialog(true)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="cursor-pointer"
              type="button"
            >
              ←
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Salir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    {/* ===================================================== */}
    {/* MODAL SALIR (NO MOVER)                                */}
    {/* ===================================================== */}
    <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            ¿Deseas salir del proceso?
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Si sales ahora, perderás cualquier información no guardada.
          </p>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-3 pt-4">
          <Button
            onClick={() => setOpenSalirDialog(false)}
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => {
              const from = searchParams.get("from");
              router.push(from === "dashboard" ? "/dashboard" : "/procesos");
            }}
            style={{ backgroundColor: "#34e004", color: "white" }}
          >
            Sí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </>
)}


{/* Paso 2 */}
{step === 2 && (
  <>
    {/* 🔥 BOTÓN SUPERIOR DE SALIR (FUERA DEL CARD) */}
    <div className="flex justify-start mb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenSalirDialog(true)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="cursor-pointer"
              type="button"
            >
              ←
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Salir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    {/* 🔥 DIALOG GLOBAL */}
    <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="sr-only">Confirmación de salida</DialogTitle>

        <DialogHeader>
          <h2 className="text-lg font-bold">¿Deseas salir del proceso?</h2>
          <p className="text-sm text-gray-600">
            Si sales ahora, perderás cualquier información no guardada.
          </p>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-3 pt-4">
          <Button
            onClick={() => setOpenSalirDialog(false)}
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => router.push("/procesos")}
            style={{ backgroundColor: "#34e004", color: "white" }}
          >
            Sí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* ============================= */}
    {/*       🔽 AQUÍ VA TU CARD      */}
    {/* ============================= */}

    <Card>
      <CardContent className="space-y-4">

        <div className="flex items-center justify-between mb-6 w-full">

          {/* IZQUIERDA → Botón volver paso 1 + título */}
          <div className="flex items-center gap-3">

            {/* BOTÓN VOLVER (PASO 1) */}
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
                  <p>Regresar al paso anterior</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* TÍTULO */}
            <h1 className="text-2xl font-bold ml-2">Paso 2: Partidas</h1>

          </div>

          {/* DERECHA → siguiente */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    onClick={handleNext}
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
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPartida();
          }}
        >

          {/* No. Requisición */}
          <div>
            <Label>No. Requisición</Label>
            <Input
              value={nuevaPartida.e_no_requisicion || ""}
              onChange={(e) =>
                setNuevaPartida({
                  ...nuevaPartida,
                  e_no_requisicion: e.target.value,
                })
              }
              placeholder="Ej. 101"
              className={`w-full ${
                erroresForm.e_no_requisicion
                  ? "border border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {erroresForm.e_no_requisicion && (
              <p className="text-sm text-red-500 mt-1">
                Este campo es obligatorio
              </p>
            )}
          </div>

          {/* Partida */}
          <div>
            <Label>Partida</Label>
            <Command>
              <CommandInput
                placeholder="Buscar partida…"
                value={nuevaPartida.e_id_partida}
                onValueChange={(val) =>
                  setNuevaPartida((prev) => ({ ...prev, e_id_partida: val }))
                }
                className={`w-full ${
                  erroresForm.e_id_partida
                    ? "border border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {Boolean(nuevaPartida.e_id_partida.trim()) && (
                <CommandList>
                  {catalogoPartidas
                    .filter((row) => {
                      const q = (nuevaPartida.e_id_partida || "").toLowerCase();
                      return (
                        row.id?.toString().toLowerCase().includes(q) ||
                        row.descripcion?.toLowerCase().includes(q)
                      );
                    })
                    .map((row) => (
                      <CommandItem
                        key={row.id}
                        onSelect={() => {
                          setNuevaPartida((prev) => ({
                            ...prev,
                            e_id_partida: row.id,
                            partida_descripcion: row.descripcion ?? "",
                            clave_capitulo: row.id_capitulo ?? "",
                            capitulo: row.capitulo ?? "",
                          }));
                        }}
                      >
                        {row.id} – {row.descripcion} – id capitulo:{" "}
                        {row.id_capitulo} – capitulo: {row.capitulo}
                      </CommandItem>
                    ))}
                  <CommandEmpty>No se encontraron partidas</CommandEmpty>
                </CommandList>
              )}
            </Command>
            {erroresForm.e_id_partida && (
              <p className="text-sm text-red-500 mt-1">Este campo es obligatorio</p>
            )}
          </div>

          {/* Fuente */}
          <div>
            <Label>Fuente de financiamiento</Label>
            <Command>
              <CommandInput
                placeholder="Buscar fuente…"
                value={nuevaPartida.e_id_fuente_financiamiento}
                onValueChange={(val) =>
                  setNuevaPartida((prev) => ({
                    ...prev,
                    e_id_fuente_financiamiento: val,
                  }))
                }
                className={`w-full ${
                  erroresForm.e_id_fuente_financiamiento
                    ? "border border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {Boolean(nuevaPartida.e_id_fuente_financiamiento.trim()) && (
                <CommandList>
                  {fuentes
                    .filter((f) => {
                      const q = (
                        nuevaPartida.e_id_fuente_financiamiento || ""
                      ).toLowerCase();
                      return (
                        f.id?.toString().toLowerCase().includes(q) ||
                        f.descripcion?.toLowerCase().includes(q) ||
                        f.etiquetado?.toLowerCase().includes(q) ||
                        f.fondo?.toLowerCase().includes(q)
                      );
                    })
                    .map((f) => (
                      <CommandItem
                        key={f.id}
                        onSelect={() => {
                          setNuevaPartida((prev) => ({
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
                        {f.id} – Descripción: {f.descripcion} – Etiquetado:{" "}
                        {f.etiquetado} – Fondo: {f.fondo}
                      </CommandItem>
                    ))}
                  <CommandEmpty>No se encontraron fuentes</CommandEmpty>
                </CommandList>
              )}
            </Command>
            {erroresForm.e_id_fuente_financiamiento && (
              <p className="text-sm text-red-500 mt-1">
                Este campo es obligatorio 
              </p>
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

        {/* TABLA */}
        <div className="overflow-hidden rounded-lg shadow-md border border-gray-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase tracking-wide">
                <th className="px-3 py-2 text-center w-[1%]"></th>
                <th className="px-3 py-2 text-center">No. Requisición</th>
                <th className="px-3 py-2 text-center">Partida</th>
                <th className="px-3 py-2 text-center">Capítulo</th>
                <th className="px-3 py-2 text-center">Fuente Financiamiento</th>
                <th className="px-3 py-2 text-center">Ramo</th>
                <th className="px-3 py-2 text-center">Fondo</th>
                <th className="px-3 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {partidas.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-3 text-center text-gray-400"
                  >
                    No hay partidas registradas.
                  </td>
                </tr>
              ) : (
                partidas
                  .filter(
                    (p) =>
                      p &&
                      p.e_id_partida &&
                      p.e_id_fuente_financiamiento
                  )
                  .map((p, index) => {
                    const rubrosDeLaPartida = presupuestosRubro.filter(
                      (r) =>
                        String(r.p_id_seguimiento_partida) ===
                        String(p.id)
                    );

                    const tieneRubroBloqueado = rubrosDeLaPartida.some(
                    (r) =>
                      r.estatus === "ADJUDICADO" ||
                      r.estatus === "DIFERIMIENTO" ||
                      r.estatus === "CANCELADO"
                  );

                    const tieneProveedorAdjudicado = rubrosDeLaPartida.some(
                      (r) =>
                        proveedores.some(
                          (prov) =>
                            prov.id_seguimiento_partida_rubro ===
                              r.id &&
                            prov.estatus === "ADJUDICADO"
                        )
                    );

                    const bloquearEliminarPartida =
                      tieneRubroBloqueado ||
                      tieneProveedorAdjudicado;

                      // Obtener el estatus real del primer rubro encontrado
                      const estatusRubro = rubrosDeLaPartida[0]?.estatus || null;

                      // Construcción del mensaje dinámico
                      let mensajeBloqueo = "";

                      if (estatusRubro === "ADJUDICADO") {
                        mensajeBloqueo = "No se puede eliminar porque el rubro está adjudicado.";
                      } else if (estatusRubro === "DIFERIMIENTO") {
                        mensajeBloqueo = "No se puede eliminar porque el rubro está en diferimiento.";
                      } else if (estatusRubro === "CANCELADO") {
                        mensajeBloqueo = "No se puede eliminar porque el rubro está cancelado.";
                      }

                      if (tieneProveedorAdjudicado) {
                        mensajeBloqueo =
                          "No se puede eliminar porque tiene proveedores adjudicados.";
                      }

                    return (
                      <tr
                        key={index}
                        className={`border-b ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        <td className="px-3 py-2 text-center w-[1%]">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        {(() => {
          // Buscar el estatus del rubro basado en los items de la partida
          const rubrosDeLaPartida = presupuestosRubro.filter(
            (r) => String(r.p_id_seguimiento_partida) === String(p.id)
          );

          // Si no hay rubros → gris
          const estatusRubro = rubrosDeLaPartida[0]?.estatus || "SIN ESTATUS";

          let color = "#939596"; // gris
          if (estatusRubro === "ADJUDICADO") color = "#22c55e";
          if (estatusRubro === "DIFERIMIENTO") color = "#ff8800";
          if (estatusRubro === "CANCELADO") color = "#ef4444";
          if (estatusRubro === "PREINGRESO") color = "#4b0082";

          return (
            <span
              className="inline-block rounded-full"
              style={{
                backgroundColor: color,
                width: "10px",
                height: "10px",
                minWidth: "10px",
                minHeight: "10px",
                boxShadow: "0 0 2px rgba(0,0,0,0.3)",
              }}
            />
          );
        })()}
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>{(() => {
          const rubrosDeLaPartida = presupuestosRubro.filter(
            (r) => String(r.p_id_seguimiento_partida) === String(p.id)
          );
          return rubrosDeLaPartida[0]?.estatus || "SIN ESTATUS";
        })()}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</td>
                        <td className="px-3 py-2 text-center">
                          {p.no_requisicion}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {`${p.e_id_partida} – ${p.partida_descripcion}`}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {p.id_capitulo}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {`${p.e_id_fuente_financiamiento} – ${p.fuente_financiamiento}`}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {p.ramo_descripcion}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {p.fondo}
                        </td>

                        <td className="px-3 py-2 text-right w-[1%]">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block">
<Button
  variant="ghost"
  size="icon"
  disabled={bloquearEliminarPartida}
  className={
    bloquearEliminarPartida
      ? "text-gray-300 cursor-not-allowed"
      : "text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
  }
  onClick={() => {
    if (bloquearEliminarPartida) return;

    // 👉 Abrimos el diálogo y guardamos la partida seleccionada
    setPartidaAEliminar(index);
    setOpenEliminarPartidaDialog(true);
  }}
>
  <Trash2 className="w-5 h-5" />
</Button>
                                </span>
                              </TooltipTrigger>

                              {bloquearEliminarPartida ? (
                                <TooltipContent side="top">
                                  <p>{mensajeBloqueo}</p>
                                </TooltipContent>
                              ) : (
                                <TooltipContent side="top">
                                  <p>Eliminar partida</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        <Dialog open={openEliminarPartidaDialog} onOpenChange={setOpenEliminarPartidaDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas eliminar esta partida?</DialogTitle>
      <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 pt-4">
      <Button
        onClick={() => setOpenEliminarPartidaDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
      >
        Cancelar
      </Button>

      <Button
        style={{ backgroundColor: "#34e004", color: "white" }}
        onClick={() => {
          if (partidaAEliminar !== null) {
            handleEliminarPartida(partidaAEliminar);
          }
          setOpenEliminarPartidaDialog(false);
        }}
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

        {/* Botones inferiores */}
        <div className="flex justify-between items-center mt-6 w-full">

          {/* VOLVER */}
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
                <p>Regresar al paso anterior</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* SIGUIENTE */}
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
                <p>Avanzar al siguiente paso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>

      </CardContent>
    </Card>
    {/* 🔥 BOTÓN SUPERIOR DE SALIR (FUERA DEL CARD) */}
    <div className="flex justify-start mb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenSalirDialog(true)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="cursor-pointer"
              type="button"
            >
              ←
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Salir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    {/* 🔥 DIALOG GLOBAL */}
    <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
      <DialogContent className="max-w-sm">
        <DialogTitle className="sr-only">Confirmación de salida</DialogTitle>

        <DialogHeader>
          <h2 className="text-lg font-bold">¿Deseas salir del proceso?</h2>
          <p className="text-sm text-gray-600">
            Si sales ahora, perderás cualquier información no guardada.
          </p>
        </DialogHeader>

        <DialogFooter className="flex justify-end gap-3 pt-4">
          <Button
            onClick={() => setOpenSalirDialog(false)}
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            Cancelar
          </Button>

          <Button
            onClick={() => router.push("/procesos")}
            style={{ backgroundColor: "#34e004", color: "white" }}
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

  // ===== VALIDACIÓN PASO 3 =====
const [erroresRubro, setErroresRubro] = React.useState<Record<string, string>>({});

const handleGuardarRubros = async () => {
  const nuevosErrores: Record<string, string> = {};

  // VALIDACIÓN SOLO SI NO HAY RUBROS AÑADIDOS
  if (presupuestosRubro.length === 0) {

    // Validar partida asociada
    if (!nuevoRubro.p_id_partida_asociada?.toString().trim()) {
      nuevosErrores.p_id_partida_asociada = "Este campo es obligatorio";
    }

    // Validar rubro
    if (!nuevoRubro.p_e_id_rubro?.toString().trim()) {
      nuevosErrores.p_e_id_rubro = "Este campo es obligatorio";
    }

    // Validar monto
    if (!nuevoRubro.p_e_monto_presupuesto_suficiencia?.toString().trim()) {
      nuevosErrores.p_e_monto_presupuesto_suficiencia = "Este campo es obligatorio";
    }

    // Si faltan campos y NO hay rubros → bloquear avance
    if (Object.keys(nuevosErrores).length > 0) {
      setErroresRubro(nuevosErrores);
      toast.warning("Por favor completa todos los campos antes de continuar o añade al menos un rubro.");
      return;
    }
  }

  // SI YA HAY RUBROS → Permitir avanzar aunque inputs estén vacíos
  setErroresRubro({});
  setStep(4);
};

  // 🟡 Ctrl+S para guardar rubros
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === 3 && ((e.ctrlKey && e.key === "s") || (e.metaKey && e.key === "s"))) {
        e.preventDefault();
        handleGuardarRubros();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, handleGuardarRubros]);

  
  if (step !== 3) return null;

return (
  <>
    {/* ========================================================= */}
    {/* BOTÓN SALIR SUPERIOR — FUERA DEL CARD */}
    {/* ========================================================= */}
    <div className="flex justify-start mb-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenSalirDialog(true)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="cursor-pointer"
              type="button"
            >
              ←
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Salir</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>

    {/* ========================================================= */}
    {/* CARD COMPLETO */}
    {/* ========================================================= */}
    <Card>
      <CardContent className="space-y-6 mt-4">

        {/* Encabezado del Paso 3 */}
        <div className="flex items-center justify-between w-full mb-6">

          {/* IZQUIERDA */}
          <div className="flex items-center gap-3">

            {/* Botón volver ← 2 */}
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
                <TooltipContent side="top">Regresar al paso anterior</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Título */}
            <h1 className="text-2xl font-bold">Paso 3: Rubros</h1>
          </div>

          {/* DERECHA — Botón avanzar */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGuardarRubros}
                    className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 transition-transform rounded-full px-4 py-2 flex items-center gap-2"
                  >
                    <span className="font-bold">4 →</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Avanzar al siguiente paso</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

          {/* ========================================================= */}
          {/* OFICIO INVITACIÓN */}
          {/* ========================================================= */}
          <div>
            <Label>Oficio de invitación</Label>
            <Input
              value={form.oficio_invitacion ?? ""}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed"
            />
          </div>

          {/* ========================================================= */}
          {/* FORMULARIO — UI NEW PAGE + lÓGICA EDIT PAGE */}
          {/* ========================================================= */}
          <div className="flex flex-col space-y-4 rounded-lg bg-white px-0 py-4">
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();

              const nuevosErrores: Record<string, string> = {};

              if (!nuevoRubro.p_id_partida_asociada?.toString().trim()) {
                nuevosErrores.p_id_partida_asociada = "Este campo es obligatorio";
              }

              if (!nuevoRubro.p_e_id_rubro?.toString().trim()) {
                nuevosErrores.p_e_id_rubro = "Este campo es obligatorio";
              }

              if (!nuevoRubro.p_e_monto_presupuesto_suficiencia?.toString().trim()) {
                nuevosErrores.p_e_monto_presupuesto_suficiencia = "Este campo es obligatorio";
              }

              if (Object.keys(nuevosErrores).length > 0) {
                setErroresRubro(nuevosErrores);
                toast.warning("Por favor completa los campos obligatorios.");
                return;
              }

              // Si pasa la validación, limpiar errores
              setErroresRubro({});

                const existe = presupuestosRubro.some(
                  (r) =>
                    r.p_e_id_rubro === nuevoRubro.p_e_id_rubro &&
                    r.p_id_partida_asociada === nuevoRubro.p_id_partida_asociada
                );

                if (existe) {
                  toast.warning("Este rubro ya fue añadido.");
                  return;
                }

                try {
                  const partidaAsociada = partidas.find(
                    (p) => String(p.e_id_partida) === String(nuevoRubro.p_id_partida_asociada)
                  );

                  if (!partidaAsociada?.id) {
                    toast.warning("La partida asociada no es válida.");
                    return;
                  }

                  const payload = {
                    p_accion: "NUEVO",
                    p_id_seguimiento_partida: Number(partidaAsociada.id),
                    p_id: 0,
                    p_e_id_rubro: nuevoRubro.p_e_id_rubro,
                    p_e_monto_presupuesto_suficiencia: parseFloat(
                      (nuevoRubro.p_e_monto_presupuesto_suficiencia || "").replace(/[^\d.-]/g, "")
                    ) || 0,
                  };

                  const resp = await fetch(
                    `${API_BASE}/procesos/editar/ente-seguimiento-partida-rubro-captura`,
                    {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    }
                  );

                  const data = await resp.json();
                  if (!resp.ok) throw new Error(JSON.stringify(data));

                await recargarRubros();
                toast.success("Rubro añadido correctamente");

                 setNuevoRubro(prev => ({
                  ...prev,
                  p_e_id_rubro: "",
                  rubro_descripcion: "",
                  p_e_monto_presupuesto_suficiencia: "",
                  // NO borrar p_id_partida_asociada
                }));

                  toast.success("Rubro añadido correctamente");
                } catch {
                  toast.error("Error al añadir rubro");
                }
              }}
            >

            {/* PARTIDA */}
            <div className="w-full">
              <Label>Partida asociada</Label>

              <select
                className={`border rounded-md p-2 w-full ${
                  erroresRubro.p_id_partida_asociada ? "border-red-500 focus:ring-red-500" : ""
                }`}
                value={nuevoRubro.p_id_partida_asociada}
                onChange={(e) => {
                  setErroresRubro((prev) => ({ ...prev, p_id_partida_asociada: "" }));
                  setNuevoRubro((prev) => ({
                    ...prev,
                    p_id_partida_asociada: e.target.value,
                  }));
                }}
              >
                <option value="">Seleccione partida...</option>
                {partidas.map((p, idx) => (
                  <option key={p.e_id_partida || idx} value={p.e_id_partida}>
                    {`Partida #${idx + 1} — ${p.e_id_partida} — ${p.partida_descripcion}`}
                  </option>
                ))}
              </select>

              {/* Mensaje de error */}
              {erroresRubro.p_id_partida_asociada && (
                <p className="text-red-500 text-xs mt-1">
                  {erroresRubro.p_id_partida_asociada}
                </p>
              )}
            </div>

             {/* Rubro */}
               <div className="w-full">
                 <Label>Rubro</Label>
                 <Command>
                   <CommandInput
                     ref={rubroInputRef}
                     value={
                     nuevoRubro.p_e_id_rubro && nuevoRubro.rubro_descripcion
                       ? `${nuevoRubro.p_e_id_rubro} — ${nuevoRubro.rubro_descripcion}`
                       : nuevoRubro.p_e_id_rubro || ""
                   }
                     placeholder="Escribe ID o nombre…"
                     className={`${erroresRubro.p_e_id_rubro ? "border border-red-500" : ""}`}
onValueChange={(val) => {
  setErroresRubro((prev) => ({ ...prev, p_e_id_rubro: "" }));

  setNuevoRubro((prev) => ({
    ...prev,
    p_e_id_rubro: val,
    rubro_descripcion: val === "" ? "" : prev.rubro_descripcion, 
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
             
                 {erroresRubro.p_e_id_rubro && (
                   <p className="text-red-500 text-xs mt-1">{erroresRubro.p_e_id_rubro}</p>
                 )}
               </div>
             
               {/* Monto + Botón en una sola fila */}
<div className="grid grid-cols-10 gap-3 w-full">

  {/* 70% → 7 columnas */}
  <div className="col-span-7">
    <Label>Monto presupuesto suficiencia</Label>
    <Input
      value={nuevoRubro.p_e_monto_presupuesto_suficiencia}
      onChange={(e) => {
        setErroresRubro((prev) => ({ ...prev, p_e_monto_presupuesto_suficiencia: "" }));
        setNuevoRubro((prev) => ({
          ...prev,
          p_e_monto_presupuesto_suficiencia: formatMoney(e.target.value),
        }));
      }}
      className={`${erroresRubro.p_e_monto_presupuesto_suficiencia ? "border border-red-500" : ""}`}
      placeholder="$0.00"
    />
    {erroresRubro.p_e_monto_presupuesto_suficiencia && (
      <p className="text-red-500 text-xs mt-1">
        {erroresRubro.p_e_monto_presupuesto_suficiencia}
      </p>
    )}
  </div>

  {/* 30% → 3 columnas */}
  <div className="col-span-3 flex items-end">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: "#10c706", color: "white" }}
          >
            Añadir rubro
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Agregar un nuevo rubro a la lista</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>

</div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* TABLA DE RUBROS */}
          {/* ========================================================= */}
          <div className="overflow-hidden rounded-lg shadow-md border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase tracking-wide">
                  <th className="px-3 py-2 text-center w-[1%]"></th>
                  <th className="px-3 py-2 font-semibold text-center">Partida</th>
                  <th className="px-3 py-2 font-semibold text-center">Clave</th>
                  <th className="px-3 py-2 font-semibold text-center">Rubro</th>
                  <th className="px-3 py-2 font-semibold text-center">Monto</th>
                  <th className="px-3 py-2 text-center" style={{ width: "40px" }}></th>
                </tr>
              </thead>

              <tbody>
  {presupuestosRubro.length === 0 ? (
    <tr>
      <td colSpan={6} className="py-3 text-center text-gray-400">
        No hay rubros añadidos.
      </td>
    </tr>
  ) : (
    presupuestosRubro.map((r, i) => (
      <tr
        key={i}
        className={`border-b ${
          i % 2 === 0 ? "bg-white" : "bg-gray-50"
        } hover:bg-gray-100`}
      >

        {/* ⭐ COLUMNA NUEVA — INDICADOR DE ESTATUS */}
        <td className="px-3 py-2 text-center w-[1%]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {(() => {
                  const estatus = r.estatus || "SIN ESTATUS";

                  let color = "#939596"; // default gris
                  if (estatus === "ADJUDICADO") color = "#22c55e";
                  if (estatus === "DIFERIMIENTO") color = "#ff8800";
                  if (estatus === "CANCELADO") color = "#ef4444";
                  if (estatus === "PREINGRESO") color = "#4b0082";

                  

                  return (
                    <span
                      className="inline-block rounded-full"
                      style={{
                        backgroundColor: color,
                        width: "10px",
                        height: "10px",
                        minWidth: "10px",
                        minHeight: "10px",
                        boxShadow: "0 0 2px rgba(0,0,0,0.25)",
                      }}
                    />
                  );
                })()}
              </TooltipTrigger>

              <TooltipContent side="top" className="text-xs">
                {r.estatus || "SIN ESTATUS"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </td>

        {/* PARTIDA */}
        <td className="px-3 py-2 text-center">
          {(() => {
            const partida = partidas.find(
              (p) =>
                String(p.e_id_partida) ===
                String(r.p_id_partida_asociada)
            );
            return partida
              ? `${partida.e_id_partida} — ${partida.partida_descripcion}`
              : "Sin asignar";
          })()}
        </td>

        {/* CLAVE */}
        <td className="px-3 py-2 text-center">{r.p_e_id_rubro}</td>

        {/* RUBRO */}
        <td className="px-3 py-2 text-center">{r.rubro_descripcion}</td>

        {/* MONTO */}
        <td className="text-right">
          {formatMoney(
            r.p_e_monto_presupuesto_suficiencia.toString()
          )}
        </td>
{/* ACCIÓN (ELIMINAR) */}
<td className="px-3 py-2 text-center">

  {/* === LÓGICA DE BLOQUEO === */}
  {(() => {
    const rubroBloqueado =
      r.estatus === "ADJUDICADO" ||
      r.estatus === "DIFERIMIENTO" ||
      r.estatus === "CANCELADO";

    let tooltipBloqueo = "Eliminar rubro";

    if (r.estatus === "ADJUDICADO")
      tooltipBloqueo = "No puedes eliminar un rubro adjudicado.";
    else if (r.estatus === "DIFERIMIENTO")
      tooltipBloqueo = "No puedes eliminar un rubro en diferimiento.";
    else if (r.estatus === "CANCELADO")
      tooltipBloqueo = "No puedes eliminar un rubro cancelado.";

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
  variant="ghost"
  size="icon"
  disabled={rubroBloqueado}
  className={
    rubroBloqueado
      ? "text-gray-300 cursor-not-allowed"
      : "text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
  }
  onClick={() => {
    if (rubroBloqueado) {
      toast.error(tooltipBloqueo);
      return;
    }

    if (presupuestosRubro.length === 1) {
      toast.warning("Agrega un rubro antes de eliminar este.");
      return;
    }

    // SOLO ponemos el índice del rubro a eliminar
    setRubroAEliminar(i);

    // SOLO abrimos el dialog
    setOpenEliminarRubroDialog(true);
  }}
>
  <Trash2 className="w-5 h-5" />
</Button>
            </span>
          </TooltipTrigger>

          {/* Tooltip dinámico */}
          <TooltipContent side="top">{tooltipBloqueo}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  })()}
</td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>

          {/* ========================================================= */}
          {/* NAVEGACIÓN INFERIOR DENTRO DEL CARD (SOLO ←2 y 4→) */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between mt-6 gap-2 w-full">
            {/* IZQUIERDA */}
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

            {/* DERECHA */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGuardarRubros}
                    className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 transition-transform rounded-full px-4 py-2 flex items-center gap-2"
                  >
                    <span className="font-bold">4 →</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Avanzar al siguiente paso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* BOTÓN SALIR — FUERA DEL CARD */}
      {/* ========================================================= */}
      <div className="flex justify-start mt-6">
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
      </div>

      {/* ========================================================= */}
      {/* DIALOG SALIR */}
      {/* ========================================================= */}
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
              style={{ backgroundColor: "#db200b", color: "white" }}
            >
              Cancelar
            </Button>

            <Button
              onClick={() => {
                const from = searchParams.get("from");
                router.push(from === "dashboard" ? "/dashboard" : "/procesos");
              }}
              style={{ backgroundColor: "#34e004", color: "white" }}
            >
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG ELIMINAR RUBRO */}
<Dialog open={openEliminarRubroDialog} onOpenChange={setOpenEliminarRubroDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas eliminar este rubro?</DialogTitle>
      <p className="text-sm text-gray-600">
        Esta acción no se puede deshacer.
      </p>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 pt-4">

      <Button
        onClick={() => setOpenEliminarRubroDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
      >
        Cancelar
      </Button>

      <Button
        style={{ backgroundColor: "#34e004", color: "white" }}
        onClick={async () => {
          if (rubroAEliminar === null) return;

          // 🔥 TU LÓGICA COMPLETA TAL CUAL SIN CAMBIOS 🔥
          const i = rubroAEliminar;
          const rubro = presupuestosRubro[i];

          if (!rubro?.id) {
            toast.error("Este rubro no tiene ID válido. Recargando datos...");
            await recargarRubros();
            return;
          }

          try {
            // === OBTENER PROVEEDORES ASOCIADOS ===
            const respProv = await fetch(
              `${API_BASE}/procesos/seguimiento/proveedores-por-rubro/${rubro.id}`
            );

            const proveedoresAsociados = respProv.ok
              ? await respProv.json()
              : [];

            if (proveedoresAsociados.length > 0) {
              const seguro = confirm(
                `⚠ Este rubro tiene ${proveedoresAsociados.length} proveedor(es) asociado(s).\n` +
                `Si continúas, estos proveedores serán ELIMINADOS.\n\n` +
                `¿Deseas continuar?`
              );
              if (!seguro) return;

              for (const prov of proveedoresAsociados) {
                const payloadProveedor = {
                  p_accion: "ELIMINAR",
                  p_id: prov.id,
                  p_id_seguimiento_partida_rubro: prov.id_seguimiento_partida_rubro,
                  p_e_rfc_proveedor: prov.e_rfc_proveedor,
                };

                await fetch(
                  `${API_BASE}/procesos/seguimiento/partida-rubro-proveedor-ente-v2/`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payloadProveedor),
                  }
                );
              }

              toast.info(
                `Se eliminaron ${proveedoresAsociados.length} proveedores asociados.`
              );
            }

            const partidaAsociada = partidas.find(
              (p) =>
                String(p.e_id_partida) ===
                String(
                  rubro.p_id_partida_asociada ??
                  rubro.p_id_partida ??
                  rubro.e_id_partida
                )
            );

            if (!partidaAsociada?.id) {
              toast.warning("Partida asociada inválida.");
              return;
            }

            const payload = {
              p_accion: "ELIMINAR",
              p_id_seguimiento_partida: Number(partidaAsociada.id),
              p_id: Number(rubro.id),
              p_e_id_rubro: rubro.p_e_id_rubro || "0",
              p_e_monto_presupuesto_suficiencia: 0,
            };

            const resp = await fetch(
              `${API_BASE}/procesos/editar/ente-seguimiento-partida-rubro-captura`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              }
            );

            const data = await resp.json();

            if (!resp.ok) {
              console.error("❌ Error al eliminar rubro:", data);
              toast.error("No se pudo eliminar el rubro del servidor.");
              return;
            }

            await recargarRubros();
            toast.success("Rubro eliminado correctamente.");
          } catch (err) {
            console.error("❌ Error al eliminar rubro:", err);
            toast.error("Error al eliminar rubro");
          }

          setOpenEliminarRubroDialog(false);
        }}
      >
        Sí
      </Button>

    </DialogFooter>
  </DialogContent>
</Dialog>
    </>
  );
})()}



{/* ========================== */}
{/*       ENCABEZADO CARD       */}
{/* ========================== */}

{/* Paso 4 */}

{step === 4 && (() => {
  return (
    <>

      {/* ------------------------------------- */}
      {/* BOTÓN SALIR — FUERA Y ARRIBA DEL CARD */}
      {/* ------------------------------------- */}
      <div className="flex justify-start mb-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setOpenSalirDialog(true)}
                style={{ backgroundColor: "#db200b", color: "white" }}
                className="cursor-pointer"
                type="button"
              >
                ←
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Salir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ========================== */}
      {/*   CARD PASO 4 COMPLETO     */}
      {/* ========================== */}
      <Card>
        <CardContent className="space-y-0">

          {/* ---------------- ENCABEZADO SUPERIOR ---------------- */}
          <div className="flex justify-between items-center w-full mb-6">

            {/* IZQUIERDA — ahora contiene SOLO VOLVER + FINALIZAR */}
            <div className="flex items-center gap-3">

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

              {/* Título */}
              <h1 className="text-2xl font-bold ml-3">Paso 4: Proveedor</h1>
            </div>

          </div>

          {/* ---------------- OFICIO ---------------- */}
          <div className="mb-4">
            <Label>Oficio de invitación</Label>
            <Input
              value={form.oficio_invitacion ?? ""}
              disabled
              className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
            />
          </div>

          {/* ---------------- FORMULARIO PRINCIPAL ---------------- */}
          <div className="flex flex-col space-y-4 rounded-lg bg-white px-0 py-4">
            <form
              className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
              onSubmit={async e => {
  e.preventDefault();

  const nuevosErrores: Record<string, string> = {};

  if (!form.p_e_id_rubro_partida) {
    nuevosErrores.p_e_id_rubro_partida = "Este campo es obligatorio";
  }

  if (!form.e_rfc_proveedor.trim()) {
    nuevosErrores.e_rfc_proveedor = "Este campo es obligatorio";
  }

  if (!form.e_importe_sin_iva?.trim()) {
    nuevosErrores.e_importe_sin_iva = "Este campo es obligatorio";
  }

  // ❌ Si hay errores → detener envío
  if (Object.keys(nuevosErrores).length > 0) {
    setErroresProveedor(nuevosErrores);
    toast.warning("Por favor completa todos los campos obligatorios.");
    return;
  }

  // ✔ Limpia errores si todo está bien
  setErroresProveedor({});

  // ⬇⬇⬇ DESDE AQUÍ VA TODA TU LÓGICA ORIGINAL (NO BORRAR NADA)
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

    const payloadProveedor = {
      p_accion: "NUEVO",
      p_id_seguimiento_partida_rubro: idRubroSeleccionado,
      p_id: 0,
      p_e_rfc_proveedor: form.e_rfc_proveedor,
      p_e_razon_social: form.razon_social,
      p_e_nombre_comercial: form.nombre_comercial,
      p_e_persona_juridica: form.persona_juridica,
      p_e_correo_electronico: form.correo_electronico,
      p_e_entidad_federativa: parseInt(selectedEntidadId),
      p_e_importe_sin_iva: parseFloat((form.e_importe_sin_iva || "").replace(/[^\d.-]/g, "")) || 0,
      p_e_importe_total: parseFloat((form.e_importe_total || "").replace(/[^\d.-]/g, "")) || 0,
    };

    const resp = await fetch(
      `${API_BASE}/procesos/seguimiento/partida-rubro-proveedor-ente-v2/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadProveedor),
      }
    );

    const data = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(data));

   toast.success("Proveedor añadido correctamente.");

// 🔄 1) Recargar catálogo ANTES del autoselect
// recargar catálogo
try {
  const proveedoresResp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
  const proveedoresData = await proveedoresResp.json();

  const lista =
    Array.isArray(proveedoresData)
      ? proveedoresData
      : Array.isArray(proveedoresData?.data)
      ? proveedoresData.data
      : Array.isArray(proveedoresData?.proveedores)
      ? proveedoresData.proveedores
      : [];

  setCatalogoProveedores(lista);
} catch (err) {
  console.error("❌ Error recargando catálogo tras crear proveedor:", err);
}


// ====================================================
// ⭐⭐ AUTORELLENAR AUTOMÁTICAMENTE EN EL STEP 4 ⭐⭐
// ====================================================


// llenar automáticamente el CommandInput del paso 4
setForm(prev => ({
  ...prev,
  e_rfc_proveedor: data.p_rfc,
  razon_social: data.p_razon_social,
  nombre_comercial: data.p_nombre_comercial,
}));

// ocultar la lista del Command
setMostrarLista(false);

// reflejar valor visual y quitar foco
if (rfcInputRef.current) {
  rfcInputRef.current.value = data.p_rfc;
  rfcInputRef.current.blur();
}


// ⛔ AHORA SÍ PUEDES CERRAR
setShowNuevoProveedorDialog(false);

// 🔄 2) Agregar a la tabla de proveedores
setProveedores(prev => [
  ...prev,
  {
    e_rfc_proveedor: form.e_rfc_proveedor,
    razon_social: form.razon_social,
    nombre_comercial: form.nombre_comercial,
    e_importe_sin_iva: form.e_importe_sin_iva,
    e_importe_total: form.e_importe_total,
    p_e_id_rubro_partida: form.p_e_id_rubro_partida,
    rubro_partida: form.rubro_partida_texto || "",
    id: data.resultado,
  },
]);

// 3) Autoseleccionar proveedor recién creado
setForm(prev => ({
  ...prev,
  e_rfc_proveedor: form.e_rfc_proveedor,
  razon_social: form.razon_social,
  nombre_comercial: form.nombre_comercial,
  e_importe_sin_iva: "",
  e_importe_total: "",
}));

// 4) Ocultar lista del Command
setMostrarLista(false);

// 5) Forzar input a mostrar el RFC y quitar foco
if (rfcInputRef.current) {
  rfcInputRef.current.value = form.e_rfc_proveedor;
  rfcInputRef.current.blur();
}

  } catch (err) {
    console.error("❌ Error al añadir proveedor:", err);
    toast.error("Error al añadir proveedor");
  }
}}
            >

              {/* ---------------- SELECT RUBRO ---------------- */}
              <div className="md:col-span-3">
                <Label>Seleccionar Rubro y Partida</Label>
                <select
                  className={`border rounded-md p-2 w-full ${
                    erroresProveedor.p_e_id_rubro_partida ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                  value={form.p_e_id_rubro_partida || ""}
                  onChange={(e) => {
                    setErroresProveedor(prev => ({ ...prev, p_e_id_rubro_partida: "" }));

                    const selectedOption = e.target.options[e.target.selectedIndex];
                    setForm(prev => ({
                      ...prev,
                      p_e_id_rubro_partida: e.target.value,
                      rubro_partida_texto: selectedOption.text,
                    }));
                  }}
                >
                  <option value="">Seleccione rubro/partida…</option>

                  {presupuestosRubro.map((r) => {
                    const idValido = r.id || Number(sessionStorage.getItem("idRubroCreado")) || 0;
                    const partidaAsociada = partidas.find(
                      (p) => String(p.e_id_partida) === String(r.p_id_partida_asociada)
                    );

                    
                    return (
                      <option key={`${r.p_e_id_rubro}-${idValido}`} value={idValido}>
                        {partidaAsociada ? partidaAsociada.e_id_partida : "Partida"} | Rubro {r.p_e_id_rubro} — {r.rubro_descripcion}
                      </option>
                    );
                  })}
                </select>
                {erroresProveedor.p_e_id_rubro_partida && (
                <p className="text-red-500 text-xs mt-1">
                  {erroresProveedor.p_e_id_rubro_partida}
                </p>
              )}
              </div>

              {/* ---------------- RFC + BOTONES ---------------- */}
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
              
                {/* --- CAMPO RFC PRINCIPAL --- */}
                <div className="relative mt-4">
                  <Command shouldFilter={false}>
                    <CommandInput
                    ref={rfcInputRef}
                    placeholder="Escribe RFC..."
                    value={form.e_rfc_proveedor}
                    className={`${erroresProveedor.e_rfc_proveedor ? "border border-red-500" : ""}`}
                  onValueChange={(value) => {

                    // 🛑 PRIORIDAD MÁXIMA:
                    // Si estamos autoseleccionando → NO abrir lista, NO actualizar form
                    if (forzarAutoselect) {
                      setMostrarLista(false);
                      setForzarAutoselect(false);
                      return;
                    }

                    // Quitar error
                    setErroresProveedor(prev => ({ ...prev, e_rfc_proveedor: "" }));

                    // Actualizar form normalmente
                    setForm(prev => ({
                      ...prev,
                      e_rfc_proveedor: value,
                    }));

                    // Mostrar lista solo si el usuario escribe
                    setMostrarLista(value.trim().length > 0);
                  }}
                  />
              
                    {/* Lista de coincidencias RFC */}
                    {form.e_rfc_proveedor.trim().length > 0 && mostrarLista && (
                      <CommandList className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {catalogoProveedores
                          .filter((p) => {
                            const rfc = p.rfc || p.e_rfc_proveedor || "";
                            return rfc
                              .toLowerCase()
                              .includes((form.e_rfc_proveedor || "").toLowerCase());
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
              
                                  if (rfcInputRef.current) {
                                    rfcInputRef.current.value = rfc;
                                    rfcInputRef.current.blur();
                                  }
              
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
              
                  {/* 🔴 MENSAJE DE ERROR */}
                  {erroresProveedor.e_rfc_proveedor && (
                    <p className="text-red-500 text-xs mt-1">
                      {erroresProveedor.e_rfc_proveedor}
                    </p>
                  )}
                </div>
              </div>

             {/* ---------------- IMPORTES ---------------- */}
<div className="md:col-span-3 flex items-end gap-2">
  <div className="flex-1">
    <Label>Importe sin IVA</Label>

    <Input
      value={form.e_importe_sin_iva || ""}
      onChange={(e) => {
        setErroresProveedor(prev => ({ ...prev, e_importe_sin_iva: "" }));

        const digits = e.target.value.replace(/\D/g, "");
        const amount = digits ? parseInt(digits, 10) : 0;

        setForm(prev => ({
          ...prev,
          e_importe_sin_iva: digits ? `$${amount.toLocaleString("es-MX")}` : "",
          e_importe_total: digits
            ? `$${(amount * 1.16).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}`
            : "",
        }));
      }}
      placeholder="$0.00"
      className={`${erroresProveedor.e_importe_sin_iva ? "border border-red-500" : ""}`}
    />

    {/* 🔴 MENSAJE DE ERROR */}
    {erroresProveedor.e_importe_sin_iva && (
      <p className="text-red-500 text-xs mt-1">
        {erroresProveedor.e_importe_sin_iva}
      </p>
    )}
  </div>

  <div className="flex-1">
    <Label>Importe total con IVA (16%)</Label>
    <Input
      disabled
      value={form.e_importe_total || ""}
      className="bg-gray-100 text-gray-700 cursor-not-allowed"
    />
  </div>

                {/* Botón añadir */}
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

        {/* ---------------- TABLA DE PROVEEDORES ---------------- */}

<div className="overflow-hidden rounded-lg shadow-md border border-gray-200">
  <table className="min-w-full text-sm">
    <thead>
      <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase tracking-wide">

        {/* ⭐ NUEVA COLUMNA DE ESTATUS */}
        <th className="px-3 py-2 text-center" style={{ width: "40px" }}></th>

        <th className="px-3 py-2 text-center">RUBRO / PARTIDA</th>
        <th className="px-3 py-2 text-center">RFC</th>
        <th className="px-3 py-2 text-center">RAZÓN SOCIAL</th>
        <th className="px-3 py-2 text-center">IMPORTE SIN IVA</th>
        <th className="px-3 py-2 text-center">IMPORTE TOTAL</th>
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
        proveedores.map((p, index) => {
          const rubro = presupuestosRubro.find(
            (r) => Number(r.id) === Number(p.p_e_id_rubro_partida)
          );

          const estatus = rubro?.estatus || "SIN ESTATUS";

          let color = "#939596";
          if (estatus === "ADJUDICADO") color = "#22c55e";
          if (estatus === "DIFERIMIENTO") color = "#ff8800";
          if (estatus === "CANCELADO") color = "#ef4444";
          if (estatus === "PREINGRESO") color = "#4b0082";

          // 🔒 Determinar si debe bloquearse eliminar proveedor
          const proveedorBloqueado =
            estatus === "ADJUDICADO" ||
            estatus === "DIFERIMIENTO" ||
            estatus === "CANCELADO";

          let tooltipBloqueo = "Eliminar proveedor";

          if (estatus === "ADJUDICADO")
            tooltipBloqueo = "No puedes eliminar un proveedor de un rubro adjudicado.";
          else if (estatus === "DIFERIMIENTO")
            tooltipBloqueo = "No puedes eliminar un proveedor de un rubro en diferimiento.";
          else if (estatus === "CANCELADO")
            tooltipBloqueo = "No puedes eliminar un proveedor de un rubro cancelado.";

          return (
            <tr
              key={index}
              className={`border-b ${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-gray-100 transition-colors`}
            >

              {/* ⭐ COLUMNA DE ESTATUS DEL RUBRO */}
              <td className="px-3 py-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="inline-block rounded-full"
                        style={{
                          width: "10px",
                          height: "10px",
                          minWidth: "10px",
                          minHeight: "10px",
                          backgroundColor: color,
                          boxShadow: "0 0 2px rgba(0,0,0,0.25)",
                          display: "inline-block",
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {estatus}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </td>

              {/* RUBRO / PARTIDA */}
              <td className="text-justify px-3 py-2">
                {p.rubro_partida || "—"}
              </td>

              {/* RFC */}
              <td className="text-center px-3 py-2">{p.e_rfc_proveedor}</td>

              {/* RAZÓN SOCIAL */}
              <td className="text-center px-3 py-2">{p.razon_social}</td>

              {/* IMPORTE SIN IVA */}
              <td className="text-center px-3 py-2">{p.e_importe_sin_iva}</td>

              {/* IMPORTE TOTAL */}
              <td className="text-center px-3 py-2">{p.e_importe_total}</td>

              {/* BOTÓN ELIMINAR (RESPETANDO ADJUDICADO) */}
              <td className="text-center px-3 py-2" style={{ width: "40px" }}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">

          {(() => {
            // 🔒 BLOQUEO COMPLETO
            const proveedorBloqueado =
              estatus === "ADJUDICADO" ||
              estatus === "DIFERIMIENTO" ||
              estatus === "CANCELADO";

            let tooltipBloqueo = "Eliminar proveedor";

            if (estatus === "ADJUDICADO")
              tooltipBloqueo = "No puedes eliminar un proveedor de un rubro adjudicado.";
            else if (estatus === "DIFERIMIENTO")
              tooltipBloqueo = "No puedes eliminar un proveedor de un rubro en diferimiento.";
            else if (estatus === "CANCELADO")
              tooltipBloqueo = "No puedes eliminar un proveedor de un rubro cancelado.";

            return (
              <Button
                variant="ghost"
                size="icon"
                disabled={proveedorBloqueado}
                className={
                  proveedorBloqueado
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                }
               onClick={() => {
                if (proveedorBloqueado) {
                  toast.error(tooltipBloqueo);
                  return;
                }
                setProveedorAEliminar({ index, proveedor: p });
                setOpenEliminarProveedorDialog(true);
              }}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            );
          })()}

        </span>
      </TooltipTrigger>

      <TooltipContent side="top">
        {(() => {
          if (estatus === "ADJUDICADO") return "Este rubro está adjudicado — No se puede eliminar proveedor.";
          if (estatus === "DIFERIMIENTO") return "Este rubro está en diferimiento — No se puede eliminar proveedor.";
          if (estatus === "CANCELADO") return "Este rubro está cancelado — No se puede eliminar proveedor.";
          return "Eliminar proveedor";
        })()}
      </TooltipContent>

    </Tooltip>
  </TooltipProvider>
</td>

            </tr>
          );
        })
      )}
    </tbody>
  </table>
</div>

<Dialog open={openEliminarProveedorDialog} onOpenChange={setOpenEliminarProveedorDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas eliminar este proveedor?</DialogTitle>
      <p className="text-sm text-gray-600">
        Esta acción no se puede deshacer.
      </p>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 pt-4">
      <Button
        onClick={() => setOpenEliminarProveedorDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
        type="button"
      >
        Cancelar
      </Button>

      <Button
        onClick={() => {
          if (!proveedorAEliminar) return;

          const { index } = proveedorAEliminar;

          // Ejecutar eliminación original
          handleEliminarProveedor(index);

          // Cerrar modal
          setOpenEliminarProveedorDialog(false);
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
        type="button"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

       {/* ---------------- NAVEGACIÓN INFERIOR ---------------- */}
<div className="flex justify-start items-center gap-3 w-full mt-6">


  {/* === VOLVER === */}
  <TooltipProvider>
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
  </TooltipProvider>

  {/* === FINALIZAR === */}
  <TooltipProvider>
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

       </CardContent>
      </Card>

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

    <DialogFooter>
      <Button
      onClick={() => setShowVerProveedoresDialog(false)}
      style={{ backgroundColor: "#db200b", color: "white" }}
      className="hover:brightness-110"
    >
      Cerrar
    </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog open={showNuevoProveedorDialog} onOpenChange={setShowNuevoProveedorDialog}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Añadir nuevo proveedor</DialogTitle>
      <p className="text-sm text-gray-500">Completa los datos del proveedor.</p>
    </DialogHeader>

    <form
      onSubmit={async (e) => {
        e.preventDefault();
        e.stopPropagation();

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

           // ⬇⬇⬇ AGREGA ESTO AQUÍ MISMO
          try {
            const proveedoresResp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
            const proveedoresData = await proveedoresResp.json();

            const lista =
              Array.isArray(proveedoresData)
                ? proveedoresData
                : Array.isArray(proveedoresData?.data)
                ? proveedoresData.data
                : Array.isArray(proveedoresData?.proveedores)
                ? proveedoresData.proveedores
                : [];

            setCatalogoProveedores(lista);
          } catch (err) {
            console.error("❌ Error recargando catálogo tras crear proveedor:", err);
          }
          // ⬆⬆⬆ FIN DEL FIX

          // 1) Recargar catálogo actualizado
try {
  const proveedoresResp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
  const proveedoresData = await proveedoresResp.json();

  const lista =
    Array.isArray(proveedoresData)
      ? proveedoresData
      : Array.isArray(proveedoresData?.data)
      ? proveedoresData.data
      : Array.isArray(proveedoresData?.proveedores)
      ? proveedoresData.proveedores
      : [];

  setCatalogoProveedores(lista);
} catch (err) {
  console.error("❌ Error recargando catálogo tras crear proveedor:", err);
}

// ======================================================
// ⭐ ACTIVAR AUTORELLENADO ANTES DE LLENAR EL RFC ⭐
// ======================================================
setForzarAutoselect(true);

// ======================================================
// ⭐ AUTOLLENAR AUTOMÁTICAMENTE DESPUÉS DE CREAR ⭐
// ======================================================
setForm(prev => ({
  ...prev,
  e_rfc_proveedor: data.p_rfc,
  razon_social: data.p_razon_social,
  nombre_comercial: data.p_nombre_comercial,
  e_importe_sin_iva: "",
  e_importe_total: "",
}));

// 🔥 Resetea el estado interno del CommandInput COMPLETAMENTE
setTimeout(() => {
  if (rfcInputRef.current) {
    rfcInputRef.current.value = "";  // limpiar internamente
    rfcInputRef.current.blur();      // quitar foco
    rfcInputRef.current.value = data.p_rfc; // re-inyectar valor final
  }
}, 10);

// reflejar visualmente
if (rfcInputRef.current) {
  rfcInputRef.current.value = data.p_rfc;
  rfcInputRef.current.blur();
}

// 4) Cerrar modal
setShowNuevoProveedorDialog(false);

        } catch (err) {
          toast.error("Error al agregar proveedor");
        }
      }}
      className="space-y-3"
    >
      <Input name="rfc" placeholder="RFC" required />
      <Input name="razon_social" placeholder="Razón Social" required />
      <Input name="nombre_comercial" placeholder="Nombre Comercial" />

      <div>
        <Label>Persona Jurídica</Label>
        <div className="space-y-2 mt-2">
          <label className="flex items-center space-x-2">
            <input type="radio" name="persona_juridica" value="PERSONA FÍSICA" />
            <span>PERSONA FÍSICA</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" name="persona_juridica" value="PERSONA MORAL" />
            <span>PERSONA MORAL</span>
          </label>
        </div>
      </div>

      <Input name="correo_electronico" placeholder="Correo electrónico" type="email" />

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

      <DialogFooter className="mt-4">
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Guardar
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

      {/* ---------------- SALIR (FUERA DEL CARD) ---------------- */}
      <div className="flex justify-start items-center gap-3 w-full mt-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setOpenSalirDialog(true)}
                style={{ backgroundColor: "#db200b", color: "white" }}
                className="cursor-pointer"
                type="button"
              >
                ←
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Salir</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* ---------------- MODAL SALIR ---------------- */}
      <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
        <DialogContent className="max-w-sm">

          <DialogTitle className="sr-only">
            Confirmación de salida del proceso
          </DialogTitle>

          <DialogHeader>
            <h2 className="text-lg font-bold">¿Deseas salir del proceso?</h2>
            <p className="text-sm text-gray-600">
              Si sales ahora, perderás cualquier información no guardada.
            </p>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              onClick={() => setOpenSalirDialog(false)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="hover:brightness-110"
              type="button"
            >
              Cancelar
            </Button>

            <Button
              onClick={() => {
                const from = searchParams.get("from");
                if (from === "dashboard") {
                  router.push("/dashboard");
                } else {
                  router.push("/procesos");
                }
              }}
              style={{ backgroundColor: "#34e004", color: "white" }}
              className="hover:brightness-110"
              type="button"
            >
              Sí
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>

    </>
  );
})()}

 </main>
  );
}