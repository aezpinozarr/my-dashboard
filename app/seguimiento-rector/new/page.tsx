"use client";
import { Eye, UserPlus, Loader2 } from "lucide-react";
import { Trash2 } from 'lucide-react';

// eslint-disable-next-line
import React, { useEffect, useState, Suspense, useMemo } from "react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import Link from "next/link";
function StepIndicator({ step, steps }: { step: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, idx) => {
        const isActive = idx + 1 === step;
        const isCompleted = idx + 1 < step;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={
                  [
                    "flex items-center justify-center rounded-full border font-bold transition-all duration-300 ease-in-out",
                    "w-10 h-10 text-lg",
                    isActive
                      ? "bg-[#235391] text-white border-[#235391] shadow-lg"
                      : isCompleted
                      ? "bg-blue-100 text-[#235391] border-[#235391]"
                      : "bg-gray-200 text-gray-400 border-gray-300"
                  ].join(" ")
                }
              >
                {idx + 1}
              </div>
              <span
                className={
                  [
                    "mt-2 text-sm text-center transition-all duration-300 ease-in-out",
                    isActive
                      ? "font-semibold text-[#235391]"
                      : isCompleted
                      ? "text-[#235391]"
                      : "text-gray-500"
                  ].join(" ")
                }
                style={{ width: 140 }}
              >
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="mx-2 flex items-center"
                style={{
                  width: 48,
                  minWidth: 32,
                  maxWidth: 60,
                  height: "2px",
                  background: step > idx + 1 ? "#235391" : "#e5e7eb",
                  transition: "all 0.3s ease-in-out"
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";

import { useSearchParams, useRouter } from "next/navigation";

type ServidorPublico = {
  id: number;
  nombre: string;
  cargo: string;
  id_ente?: number;
};


const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

const formatDateDDMMYYYY = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})\/(\d{2})(\d)/, "$1/$2/$3")
    .slice(0, 10);
};

const formatTimeHHMM = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1:$2")
    .slice(0, 5);
};

// Skeleton loader for RectorForm
function RectorSkeleton() {
  return (
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      <Card className="border shadow-sm bg-gray-50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}

// =========================================================
// 🔵 Tipo fuerte para detalle (partidas → rubros → proveedores)
// =========================================================
export type TipoDetallePartidaRubro = {
  id_partida: number;
  partida: string;
  rubros: {
    id_rubro: number;
    rubro: string;
    monto: number;
    id_seguimiento_partida_rubro: number;
    id_seguimiento_partida_rubro_proveedor_adjudicado?: number | null;
    proveedores: {
      id: number;
      rfc: string;
      nombre: string;
      importeSinIvaOriginal: number;
      importeTotalOriginal: number;
      estatus?: string;
    }[];
  }[];
};

export default function Page() {
  return (
    <Suspense fallback={<RectorSkeleton />}>
      <RectorForm />
    </Suspense>
  );
}

function RectorForm() {
  // Paso visual y control de flujo
  const [step, setStep] = useState(1);
  const [openSalirDialog, setOpenSalirDialog] = React.useState(false);
  // Estados para gestión de servidores públicos del ente 0
  const [verServidoresDialogOpen, setVerServidoresDialogOpen] = React.useState(false);
  const [addServidorDialogOpen, setAddServidorDialogOpen] = React.useState(false);
  const [nuevoServidorNombre, setNuevoServidorNombre] = React.useState("");
  const [nuevoServidorCargo, setNuevoServidorCargo] = React.useState("");
  const [addServidorLoading, setAddServidorLoading] = React.useState(false);
  // Para tooltips
  const [showTooltipAvanzarTop, setShowTooltipAvanzarTop] = useState(false);
  const [showTooltipAvanzarBottom, setShowTooltipAvanzarBottom] = useState(false);
  const [showTooltipFinalizar, setShowTooltipFinalizar] = useState(false);
  const [estatusPorRubro, setEstatusPorRubro] = useState<{ [key: number]: string }>({});

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  // 🔥🔥🔥 AQUÍ — EXACTAMENTE AQUÍ — PEGA ESTA FUNCIÓN 🔥🔥🔥
const handleDelete = async (row: any) => {
  console.log("ROW COMPLETO:", row);

  const estatus = row.estatus;
  let payload = {};

  if (estatus === "ADJUDICADO" || estatus === "DIFERIMIENTO") {
    payload = {
      p_id_seguimiento_partida_rubro: row.id_seguimiento_partida_rubro,
      p_id_proveedor: row.id_seguimiento_partida_rubro_proveedor_adjudicado
    };
  } else {
    payload = {
      p_id_seguimiento_partida_rubro: row.id_seguimiento_partida_rubro,
      p_id_proveedor: -99
    };
  }

  try {
    const res = await fetch(
      `${API_BASE}/rector/seg-partida-rubro-proveedor-deshacer/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail);

    toast.success("Reversión realizada correctamente");

    setEstatusPorRubro(prev => {
      const copy = { ...prev };
      delete copy[row.rubro];
      return copy;
    });

    setSelectedEstatus(prev => {
      const copy = { ...prev };
      delete copy[row.rubro];
      return copy;
    });

    setEstatusLocal("");

    setRubroProveedorRows(prev =>
      prev.filter(r =>
        !(Number(r.partida) === Number(row.partida) &&
          Number(r.rubro) === Number(row.rubro))
      )
    );

  } catch {
    toast.error("Error al intentar revertir adjudicación");
  }
};
// 🔥🔥🔥 FIN — ESTE ES EL LUGAR CORRECTO 🔥🔥🔥

  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  // Estado para controlar el accordion abierto en el paso 2
  const [accordionOpen, setAccordionOpen] = useState<string | undefined>();

  const [idSeguimientoPartidaRubro, setIdSeguimientoPartidaRubro] = useState<number | null>(null);

  // ⭐ Función para obtener color según estatus
const getEstatusColor = (estatus: string | undefined) => {
  switch (estatus) {
    case "ADJUDICADO":
      return "#22c55e"; // verde
    case "DIFERIMIENTO":
      return "#ff8800"; // naranja
    case "DESIERTO":
      return "#939596"; // gris solicitado
    case "CANCELADO":
      return "#ef4444"; // rojo
    default:
      return null; // sin punto
  }
};

const getEstatusPorRubroId = (idPartida: number, idRubro: number) => {
  // 1) Estatus seleccionado por el usuario
  if (selectedEstatus[idRubro]) return selectedEstatus[idRubro];

  // 2) Si ya está adjudicado en UI local
  const row = rubroProveedorRows.find(
    (x) => Number(x.rubro) === Number(idRubro)
  );
  if (row?.estatus) return row.estatus;

  // 3) Estatus REAL recibido desde backend
  const key = `${idPartida}-${idRubro}`;
  return estatusRubrosBackend[key];
};


  // Estado para controlar autoselect visual del servidor público
  const [autoSelectActivo, setAutoSelectActivo] = useState(false);

  const formatMXN = (v: any) => {
    const n = Number(v);
    if (!isFinite(n)) return "—";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  };

  const searchParams = useSearchParams();
  const router = useRouter();

  // ===== Estados generales =====
  const [servidores, setServidores] = useState<any[]>([]);
  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [mostrarServidores, setMostrarServidores] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState<any>(null);

  const [estatusOptions, setEstatusOptions] = useState<string[]>([]);
  const [fundamentos, setFundamentos] = useState<any[]>([]);
  // Changed detalle state to grouped by partida
  const [detalle, setDetalle] = useState<TipoDetallePartidaRubro[]>([]);
  const [detalleGeneral, setDetalleGeneral] = useState<any>(null);

  const [selectedEstatus, setSelectedEstatus] = useState<{ [key: number]: string }>({});
  const [selectedProveedor, setSelectedProveedor] = useState<{ [key: number]: string }>({});
  const [selectedFundamento, setSelectedFundamento] = useState<{ [key: number]: string }>({});
  const [bloqueoInmediato, setBloqueoInmediato] = useState({});

  // ======================================================
// ⭐ Cargar estatus reales de los rubros desde backend
// ======================================================
const [estatusRubrosBackend, setEstatusRubrosBackend] = useState<{ [key: string]: string }>({});

useEffect(() => {
  if (!detalle || detalle.length === 0) return;

  async function cargarRubros() {
    let estatusMap: { [key: string]: string } = {};

    for (const partida of detalle) {
      const res = await fetch(
        `${API_BASE}/procesos/editar/seguimiento-partida-rubro?p_id=-99&p_id_seguimiento_partida=${partida.id_partida}`
      );

      const data = await res.json();

      data.forEach((rubro: any) => {
      const rubroId = Number(rubro.e_id_rubro); 
      const key = `${partida.id_partida}-${rubroId}`;
      estatusMap[key] = rubro.estatus;
    });
    }

    setEstatusRubrosBackend(estatusMap);
  }

  cargarRubros();
}, [detalle]);
  // Estado para importes ajustados
  const [importes, setImportes] = useState<{ [key: number]: { sinIva: number; total: number } }>({});
  // Estado para las filas agregadas manualmente
  const [rubroProveedorRows, setRubroProveedorRows] = useState<any[]>([]);
  // --- Estado local para el nuevo card (UI controlado)
  const [selectedPartidaId, setSelectedPartidaId] = useState<number | null>(null);
  const [selectedRubroId, setSelectedRubroId] = useState<number | null>(null);
  const [selectedProveedorLocal, setSelectedProveedorLocal] = useState<string>("");
  const [estatusLocal, setEstatusLocal] = useState<string>("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Estado para errores de validación de campos Rubro, Proveedor, Estatus y Fundamento
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: boolean }>({});

  // Estado para alternar vista de tabla o tarjetas en la tabla inferior
  const [tableView, setTableView] = useState<"table" | "card">("table");

  // ======================================================
  const [errores, setErrores] = useState<{ fecha_emision?: string; fecha_reunion?: string; hora_reunion?: string }>({});
  const [form, setForm] = useState<{
    fecha_emision?: string;
    fecha_reunion?: string;
    hora_reunion?: string;
    oficio?: string;
    asunto?: string;
  }>({});

  // Estado para errores del paso 1
const [formErrors, setFormErrors] = useState({
  oficio: false,
  fecha_emision: false,
  fecha_reunion: false,
  hora_reunion: false,
  servidor: false,
  asunto: false,
  estatus: false,
});

  // Estado para errores de validación del formulario del paso 1
  // Validación de campos obligatorios del paso 1
const validateStep1Fields = () => {
  const errors: any = {};

  if (!form.oficio?.trim()) errors.oficio = true;
  if (!form.fecha_emision?.trim()) errors.fecha_emision = true;
  if (!form.fecha_reunion?.trim()) errors.fecha_reunion = true;
  if (!form.hora_reunion?.trim()) errors.hora_reunion = true;

  if (!servidorSeleccionado) errors.servidor = true;
  if (!form.asunto?.trim()) errors.asunto = true;
  if (!estatusGeneral?.trim()) errors.estatus = true;

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
  // 1️⃣ Cargar servidores públicos por ente (solo ente 0)
useEffect(() => {
  if (!user?.id_ente) return;

  const fetchServidores = async () => {
    try {
      const parseServidores = (raw: any) => {
        const base = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.resultado)
          ? raw.resultado
          : Array.isArray(raw?.data)
          ? raw.data
          : [];
        // Dejar únicamente los del ente 0
        return base.filter((s: any) => String(s.id_ente) === "0" || Number(s.id_ente) === 0);
      };

      // 1) Intento directo: solo ente 0
      let resp = await fetch(
        `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=0`
      );
      let json = await resp.json();
      let lista = parseServidores(json);

      // 2) Fallback: traer todos y filtrar a ente 0
      if (!Array.isArray(lista) || lista.length === 0) {
        const respAll = await fetch(
          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99`
        );
        const jsonAll = await respAll.json();
        lista = parseServidores(jsonAll);
      }

      setServidores(lista);
    } catch (err) {
      console.error("❌ Error cargando servidores:", err);
      setServidores([]);
    }
  };

  fetchServidores();
}, [user]);

  // ======================================================
  // 2️⃣ Cargar enums y fundamentos
  // ======================================================
  useEffect(() => {
    // Cargar estatus
    fetch(`${API_BASE}/procesos/enum-seguimiento-partida-rubro-estatus`)
      .then((res) => res.json())
      .then((data) => setEstatusOptions(data.map((d: any) => d.estatus)))
      .catch((err) => console.error("❌ Error cargando estatus:", err));

    // ✅ Cargar fundamentos (corregido el endpoint y estructura)
    fetch(`${API_BASE}/catalogos/cat-fundamiento?p_id=-99`)
      .then((res) => res.json())
      .then((data) => {
        console.log("📘 Fundamentos cargados:", data);
        // Asegurar que siempre sea un arreglo
        setFundamentos(Array.isArray(data) ? data : data.resultado || []);
      })
      .catch((err) => console.error("❌ Error cargando fundamentos:", err));
  }, []);

  // ======================================================
  // 3️⃣ Cargar detalle (SP: sp_rector_seguimiento_detalle)
  // Nueva versión agrupando correctamente por partida, rubro y proveedores
  // ======================================================
  const cargarDetalle = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rector/seguimiento-detalle?p_id=${id}&incluir_detalle_proveedor=true`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setDetalle([]);
        setDetalleGeneral(null);
        return;
      }

      // ✅ Mapa que agrupa partidas y rubros sin perder registros
      const partidaMap = new Map<number, any>();

      // Array para filas adjudicadas automáticamente
      const adjudicadosRows: any[] = [];

      data.forEach((d: any) => {
        const idPartida = Number(d.e_id_partida || d.id_partida);
        const idRubro = d.id_rubro || d.e_id_rubro;

        // Crear partida si no existe
        if (!partidaMap.has(idPartida)) {
          partidaMap.set(idPartida, {
            id_partida: idPartida,
            partida: d.partida,
            rubros: [],
          });
        }

        const partidaObj = partidaMap.get(idPartida);

        // Buscar rubro o crearlo
        let rubroObj = partidaObj.rubros.find((r: any) => r.id_rubro === idRubro);
        if (!rubroObj) {
          rubroObj = {
            id_rubro: idRubro,
            rubro: d.rubro,
            monto: Number(d.e_monto_presupuesto_suficiencia) || 0,
            id_seguimiento_partida_rubro: d.id_seguimiento_partida_rubro, // ✅ agregado
            id_seguimiento_partida_rubro_proveedor: d.id_seguimiento_partida_rubro_proveedor,
            proveedores: [],
          };
          partidaObj.rubros.push(rubroObj);
        }

        // Agregar proveedores si existen
        if (d.proveedores) {
          d.proveedores
            .split(";")
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0)
            .forEach((p: string) => {
              // Extraer RFC y nombre con expresión regular
              const match = p.match(/^\d+\)([A-Z0-9]+)\s(.+)$/);

              // Buscar si el proveedor ya existe en rubroObj
              const rfc = match ? match[1] : "";
              const nombre = match ? match[2] : p;

              // Intentar obtener el id del proveedor desde la base de datos si viene nulo
              const idProveedor =
                d.id_seguimiento_partida_rubro_proveedor && d.id_seguimiento_partida_rubro_proveedor !== 0
                  ? d.id_seguimiento_partida_rubro_proveedor
                  : d.e_id_seguimiento_partida_rubro_proveedor || d.id_proveedor || 0;

              // Estructura completa compatible con el SP
              const provObj = {
                id: idProveedor,
                rfc,
                nombre,
                importeSinIvaOriginal: Number(d.e_importe_sin_iva) || 0,
                importeTotalOriginal: Number(d.e_importe_total) || 0,
              };

              // Evitar duplicados exactos (mismo ID y RFC)
              const existeProveedor = rubroObj.proveedores.some(
                (pr: any) => pr.id === provObj.id && pr.rfc === provObj.rfc
              );
              if (!existeProveedor) {
                rubroObj.proveedores.push(provObj);
              }
            });
        }
          
        // Agregar fila SOLO si el rubro debe aparecer en la tabla final
          if (
            ["ADJUDICADO", "DIFERIMIENTO", "CANCELADO", "DESIERTO"].includes(d.estatus)
          ) {
          // 🔄 Agregar SIEMPRE el rubro, sin importar su estatus
          // Agregar fila SIEMPRE, sin importar estatus
          adjudicadosRows.push({
            partida: idPartida,
            rubro: idRubro,
            estatus: d.estatus ?? "",
            fundamento: d.id_fundamento ?? null,

            importeSinIva:
              d.importe_ajustado_sin_iva ??
              d.e_importe_sin_iva ??
              0,

            importeTotal:
              d.importe_ajustado_total ??
              d.e_importe_total ??
              0,

            id_seguimiento_partida_rubro_proveedor_adjudicado:
              d.id_seguimiento_partida_rubro_proveedor_adjudicado ?? null,

              id_seguimiento_partida_rubro: d.id_seguimiento_partida_rubro,

            proveedor: d.e_rfc_proveedor
              ? {
                  rfc: d.e_rfc_proveedor,
                  razon_social: d.razon_social,
                  nombre_comercial: d.nombre_comercial,
                  persona_juridica: d.persona_juridica,
                  correo_electronico: d.correo_electronico,
                  entidad_federativa: d.entidad_federativa,
                }
              : null,
          });
        }
      });

      // ✅ Si hay adjudicados existentes, mostrarlos automáticamente en la grilla
      setRubroProveedorRows(() => {
        const adjudicadosUnicos = adjudicadosRows.filter(
          (row, index, self) =>
            index ===
            self.findIndex(
              (r) =>
                r.id_seguimiento_partida_rubro_proveedor_adjudicado ===
                row.id_seguimiento_partida_rubro_proveedor_adjudicado
            )
        );

        return adjudicadosRows; 
      });

      setDetalleGeneral(data[0]);
      // 🟦 Sincronizar los valores iniciales del formulario con los datos del seguimiento cargado
      setForm({
        oficio: data[0]?.r_suplencia_oficio_no || data[0]?.e_oficio_invitacion || "",
        fecha_emision: data[0]?.r_fecha_emision
          ? (() => {
              const [yyyy, mm, dd] = data[0].r_fecha_emision.split("-");
              return `${dd}/${mm}/${yyyy}`;
            })()
          : "",
        fecha_reunion: data[0]?.e_fecha_y_hora_reunion
          ? (() => {
              const [f] = data[0].e_fecha_y_hora_reunion.split(/[T ]/);
              const [yyyy, mm, dd] = f.split("-");
              return `${dd}/${mm}/${yyyy}`;
            })()
          : "",
        hora_reunion: data[0]?.e_fecha_y_hora_reunion
          ? (() => {
              const [, h] = data[0].e_fecha_y_hora_reunion.split(/[T ]/);
              const [hh, min] = h.split(":");
              return `${hh}:${min}`;
            })()
          : "",
        asunto: data[0]?.r_asunto || data[0]?.e_asunto || "",
      });
      // 🟩 Sincronizar estatus y servidor público (asiste)
      if (data[0]?.r_estatus) {
        setEstatusGeneral(data[0].r_estatus);
      }
      if (data[0]?.r_id_servidor_publico_asiste) {
        const servidor = servidores.find(
          (s) => s.id === data[0].r_id_servidor_publico_asiste
        );
        if (servidor) {
          setServidorSeleccionado(servidor);
          setBusquedaServidor(servidor.nombre);
        }
      }
      // 🟩 Mantener los campos actualizados localmente en detalleGeneral pero sin sobrescribir si ya hay datos locales
      setDetalleGeneral((prev: any) => {
        if (!data[0]) return prev;
        return {
          ...prev,
          ...data[0],
          e_oficio_invitacion: data[0].e_oficio_invitacion || prev?.e_oficio_invitacion,
          e_asunto: data[0].e_asunto || prev?.e_asunto,
        };
      });
      // Lógica para poblar el estado form con fecha/hora de reunión si existen
      if (data[0] && data[0].e_fecha_y_hora_reunion) {
        // Formato esperado: "YYYY-MM-DDTHH:MM:SS" o "YYYY-MM-DD HH:MM:SS"
        const fechaHora = data[0].e_fecha_y_hora_reunion;
        let fecha = "";
        let hora = "";
        if (typeof fechaHora === "string") {
          // Permitir ambos formatos
          const [f, h] = fechaHora.split(/[T ]/);
          if (f) {
            const [yyyy, mm, dd] = f.split("-");
            if (yyyy && mm && dd) {
              fecha = `${dd}/${mm}/${yyyy}`;
            }
          }
          if (h) {
            const [hh, min] = h.split(":");
            if (hh && min) {
              hora = `${hh}:${min}`;
            }
          }
        }
        setForm((prev) => ({
          ...prev,
          fecha_reunion: fecha,
          hora_reunion: hora,
        }));
      }
      // ✅ Guardar todas las partidas sin filtrar
      setDetalle(Array.from(partidaMap.values()));
    } catch (err) {
      console.error("❌ Error cargando detalle:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================
  // 4️⃣ Enviar formulario principal (SP: sp_rector_seguimiento_gestion)
  // ======================================================
  // Estado para controlar el envío/carga
  const [isSaving, setIsSaving] = useState(false);
  // Estado para estatus general
  const [estatusGeneral, setEstatusGeneral] = useState<string>("");
  // Observaciones y control de UI
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  const [observaciones, setObservaciones] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    // Evitar envío durante autoselect de servidor público
    if (autoSelectActivo) {
      console.log("⏭️ Auto-select activo, se omite envío del formulario");
      return;
    }

    // Validación: Debe seleccionarse un estatus general (REVISADO o CANCELADO)
    if (!estatusGeneral) {
      toast.error("❌ Debes seleccionar un estatus general (REVISADO o CANCELADO)");
      return;
    }

    // ✅ Función para normalizar valores según tipo
    const normalize = (key: string, value: any) => {
      if (value === undefined || value === null || value === "" || value === "null" || value === "undefined") {
        return null;
      }

      // Campos de fecha → formato correcto
      if (key.includes("fecha") && typeof value === "string") {
        if (value.includes("/")) {
          const [dd, mm, yyyy] = value.split("/");
          return `${yyyy}-${mm}-${dd}`;
        }
        return value;
      }

      // Campos de hora
      if (key.includes("hora") && typeof value === "string") {
        return value.length === 5 ? `${value}:00` : value;
      }

      // Campos numéricos
      if (key.includes("_id") || key.includes("id_") || key.startsWith("p_r_id")) {
        return isNaN(Number(value)) ? null : Number(value);
      }

      return value;
    };

    // ✅ Construir payload completamente validado
    const payload: Record<string, any> = {
      p_accion: "EDITAR",
      p_r_suplencia_oficio_no: normalize("oficio", formEl.oficio.value),
      p_r_fecha_emision: form.fecha_emision
        ? form.fecha_emision.includes("/")
          ? form.fecha_emision.split("/").reverse().join("-")
          : form.fecha_emision
        : null,
      p_r_asunto: form.asunto?.trim() || null,
      p_r_fecha_y_hora_reunion:
        form.fecha_reunion && form.hora_reunion
          ? `${normalize("fecha_reunion", form.fecha_reunion)}T${normalize("hora_reunion", form.hora_reunion)}`
          : null,
      p_r_estatus: normalize("estatus", estatusGeneral),
      p_r_id_servidor_publico_asiste: servidorSeleccionado?.id ? Number(servidorSeleccionado.id) : 0,
      p_r_id_usuario_registra: normalize("p_r_id_usuario_registra", user?.id),
      p_r_observaciones: normalize("observaciones", mostrarObservaciones ? observaciones : ""),
      p_r_con_observaciones: normalize("con_observaciones", mostrarObservaciones),
    };

    setIsSaving(true);

    try {
      const res = await fetch(
        `${API_BASE}/rector/seguimiento-gestion/${selectedId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          console.warn("⚠️ Respuesta no JSON del backend");
        }

        console.error("❌ Error detallado del backend:", data);

        if (Array.isArray(data?.detail)) {
          // 🔍 Mostrar todos los errores del backend de manera legible
          const mensajes = data.detail.map(
            (err: any) => `${err.loc?.[1] || "campo desconocido"}: ${err.msg}`
          ).join("\n");
          toast.error(`❌ Error de validación en backend:\n${mensajes}`);
          console.table(data.detail);
          return;
        } else if (data?.detail) {
          toast.error(`❌ ${data.detail}`);
          return;
        } else {
          console.warn("⚠️ Backend devolvió error sin detalle, pero se omitirá el toast");
          return;
        }
      }

      toast.success("Captura registrada correctamente");

      // ✅ Mantener campos actualizados localmente en detalleGeneral
      setDetalleGeneral((prev: any) => ({
        ...prev,
        e_oficio_invitacion: formEl.oficio.value,
        e_asunto: formEl.asunto.value,
        e_fecha_y_hora_reunion:
          form.fecha_reunion && form.hora_reunion
            ? `${form.fecha_reunion.split("/").reverse().join("-")}T${form.hora_reunion}:00`
            : prev.e_fecha_y_hora_reunion,
      }));

      // 🔍 Obtener el usuario tipo ENTE que registró el seguimiento
      let idUsuarioEnte: number | null = null;
      try {
        const segRes = await fetch(
          `${API_BASE}/rector/seguimiento-detalle?p_id=${selectedId}`
        );
        const segData = await segRes.json();
        idUsuarioEnte = segData?.[0]?.e_id_usuario_registra || null;
      } catch (err) {
        console.warn("⚠️ No se pudo obtener e_id_usuario_registra:", err);
      }

      // 🚀 Enviar notificación al usuario que registró el seguimiento
      if (idUsuarioEnte) {
        const mensaje =
          estatusGeneral === "CANCELADO"
            ? `El rector canceló tu seguimiento #${selectedId}. Motivo: ${observaciones}`
            : estatusGeneral === "REVISADO"
            ? mostrarObservaciones && observaciones
              ? `El rector revisó tu seguimiento #${selectedId} con observaciones: ${observaciones}`
              : `El rector revisó tu seguimiento #${selectedId} sin observaciones.`
            : "";

        const url = `${API_BASE}/seguridad/notificaciones/?p_accion=CREAR&p_id_usuario_origen=${user?.id}&p_id_notificacion=${selectedId}&p_mensaje_extra=${encodeURIComponent(
          mensaje
        )}&p_estatus=${estatusGeneral}`;
        console.log("🚀 Enviando notificación (RECTOR → ENTE):", url);
        try {
          await fetch(url, { method: "POST" });
        } catch (err) {
          console.warn("⚠️ Error enviando notificación:", err);
        }
      }

      // ✅ Si el estatus general es "CANCELADO", redirigir al listado
      if (estatusGeneral === "CANCELADO") {
        router.push("/seguimiento-rector");
        return;
      }

      // ✅ Si el guardado fue exitoso y el estatus es REVISADO, avanzar al paso 2 sin redirigir
      if (estatusGeneral === "REVISADO") {
        setStep(2);
        return;
      }
      // Si no quieres redirigir siempre, comenta la línea anterior y descomenta la siguiente para solo recargar detalle:
      // cargarDetalle(selectedId!);
    } catch (err: any) {
      console.error("❌ Error al registrar captura:", err);
    } finally {
      setIsSaving(false);
    }
  };

// ======================================================
// 6️⃣ Finalizar proceso (llama al SP sp_rector_seguimiento_gestion_estatus)
// ======================================================
const finalizarProceso = async () => {
  if (!selectedId) {
    toast.error("❌ No se encontró el ID del seguimiento");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/rector/seguimiento-gestion-estatus/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Error al finalizar proceso:", data);
      toast.error("No se pudo finalizar el proceso");
      return;
    }

    toast.success("Proceso finalizado y estatus actualizado a REVISADO");

    // ✅ Actualizar visualmente el estatus en el frontend
    setEstatusGeneral("REVISADO");
    setDetalleGeneral((prev: any) => ({
      ...prev,
      r_estatus: "REVISADO",
    }));

    // Redirigir al listado de seguimientos después de unos segundos
    setTimeout(() => router.push("/seguimiento-rector"), 1000);

  } catch (err) {
    console.error("❌ Error de red al finalizar proceso:", err);
    toast.error("Error de conexión con el servidor");
  }
};
// ======================================================
// 4️⃣.b Adjudicar proveedor (SP: sp_rector_seguimiento_gestion_proveedor_adjudicado)
// ======================================================
const adjudicarProveedor = async (idRubro: number, idPartida: number) => {
  const proveedorId = selectedProveedor[idRubro];
  const fundamentoId = selectedFundamento[idRubro];
  const importe = importes[idRubro];
  const estatus = selectedEstatus[idRubro];

  if (!proveedorId) {
    toast.error("❌ Selecciona un proveedor antes de adjudicar");
    return;
  }
  if (!selectedId) {
    toast.error("❌ ID de seguimiento no definido");
    return;
  }
  if (!estatus) {
    toast.error("❌ Selecciona un estatus antes de adjudicar");
    return;
  }

  const requiereFundamento = ["ADJUDICADO", "DIFERIMIENTO"].includes(estatus);

  if (requiereFundamento && !fundamentoId) {
    toast.error("❌ Selecciona fundamento legal antes de adjudicar");
    return;
  }

  if (
    requiereFundamento &&
    (!importe || isNaN(importe.sinIva) || isNaN(importe.total) || importe.sinIva <= 0)
  ) {
    toast.error("❌ Ingresa los importes ajustados correctamente");
    return;
  }

  // Buscar datos en detalle
  const partidaObj = detalle.find((p) => p.id_partida === idPartida);
  if (!partidaObj) {
    toast.error("❌ No se encontró la partida seleccionada");
    return;
  }

  console.log("🧩 Buscando rubro:", idRubro, "en", partidaObj.rubros);
  const rubroObj = partidaObj.rubros.find(
    (r) => Number(r.id_rubro) === Number(idRubro)
  );
  if (!rubroObj) {
    toast.error("❌ No se encontró el rubro seleccionado");
    return;
  }

  const idSeguimientoPartidaRubro = rubroObj.id_seguimiento_partida_rubro;
  if (!idSeguimientoPartidaRubro) {
    toast.error("❌ No se encontró el id_seguimiento_partida_rubro");
    return;
  }

  // 🚫 Validación: No permitir adjudicar si ya hay un registro adjudicado en este rubro
  // Buscamos en rubroProveedorRows si hay un registro adjudicado para este rubro
  const yaAdjudicado = rubroProveedorRows.some(
    (row) =>
      Number(row.rubro) === Number(idRubro) &&
      (row.estatus === "ADJUDICADO" || row.estatus === "DIFERIMIENTO")
  );
  if (yaAdjudicado) {
    toast.error("❌ Ya existe un registro adjudicado para este rubro. No puedes adjudicar dos veces.");
    return;
  }

  // Buscar proveedor real
  let proveedorDbId: number | null = null;
  let proveedorRfc: string | null = null;

  const prov = rubroObj.proveedores.find(
    (p: { id: number; rfc: string; nombre: string }) =>
      p.id?.toString() === proveedorId || p.rfc === proveedorId
  );

  if (prov) {
    proveedorDbId = prov.id;
    proveedorRfc = prov.rfc;
  } else {
    detalle.forEach((partida) => {
      partida.rubros.forEach((rubro) => {
        rubro.proveedores.forEach((p: any) => {
          if (p.rfc === proveedorId) {
            proveedorDbId = p.id;
            proveedorRfc = p.rfc;
          }
        });
      });
    });
  }

  if (!proveedorDbId) {
    toast.error("❌ No se encontró el proveedor seleccionado en la base de datos");
    return;
  }

  // 🔍 Verificar si ya existe adjudicado en backend (para obtener p_id existente)
  // Guardar la partida abierta antes de recargar
  const partidaAbierta = accordionOpen;
  let pIdExistente: number | null = null;
  try {
    const checkRes = await fetch(
      `${API_BASE}/rector/verificar-adjudicado?p_id_rubro_proveedor=${proveedorDbId}`
    );
    const checkData = await checkRes.json();
    if (checkRes.ok && checkData?.id) {
      pIdExistente = checkData.id;
      console.log("🔎 ID adjudicado existente encontrado:", pIdExistente);
    } else {
      console.log("ℹ️ No existe adjudicado previo, se insertará uno nuevo");
    }
  } catch (err) {
    console.warn("⚠️ Error verificando adjudicado:", err);
    pIdExistente = null;
  }

  // Construir payload
  const payload = {
    p_estatus: estatus,
    p_id_seguimiento_partida_rubro: idSeguimientoPartidaRubro,
    p_id_seguimiento_partida_rubro_proveedor: proveedorDbId,
    p_id: pIdExistente, // ← aquí se envía el ID correcto (o null si es nuevo)
    p_importe_ajustado_sin_iva: requiereFundamento ? importe.sinIva : 0,
    p_importe_ajustado_total: requiereFundamento ? importe.total : 0,
    p_id_fundamento: requiereFundamento ? Number(fundamentoId) : 0,
  };

  try {
    console.log("📤 Enviando payload al backend:", payload);

    const res = await fetch(`${API_BASE}/rector/seguimiento-gestion-proveedor-adjudicado/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    console.log("🛰️ Respuesta del backend:", data);

    const nuevoId =
    typeof data === "number"
      ? data
      : data?.id ?? null;

    if (!res.ok) {
      throw new Error(data?.detail || "Error al adjudicar proveedor");
    }

    if (typeof data === "number" && data > 0) {
      toast.success(`✅ Proveedor adjudicado correctamente (ID generado: ${data})`);
    } else if (data?.id) {
      toast.success(`✅ Proveedor adjudicado correctamente (ID generado: ${data.id})`);
    } else {
      toast.warning("⚠️ Guardado correcto pero sin ID devuelto por el backend");
    }

  // 🔍 Obtener el usuario tipo ENTE que registró el seguimiento
  let idUsuarioEnte: number | null = null;
  try {
    const segRes = await fetch(`${API_BASE}/rector/seguimiento-detalle?p_id=${selectedId}`);
    const segData = await segRes.json();
    idUsuarioEnte = segData?.[0]?.e_id_usuario_registra || null;
  } catch (err) {
    console.warn("⚠️ No se pudo obtener e_id_usuario_registra:", err);
  }

  // 🚀 Enviar notificación al usuario que registró el seguimiento (ENTE)
  if (prov && idUsuarioEnte) {
    const mensaje = `El rector adjudicó el proveedor ${prov.nombre || "Proveedor desconocido"} (${prov.rfc}) para el rubro #${idRubro} del seguimiento #${selectedId}.`;
    const url = `${API_BASE}/seguridad/notificaciones/?p_accion=CREAR&p_id_usuario_origen=${user?.id}&p_id_usuario_destinatario=${idUsuarioEnte}&p_id_notificacion=${selectedId}&p_mensaje_extra=${encodeURIComponent(mensaje)}&p_estatus=ADJUDICADO`;
    console.log("🚀 Enviando notificación (RECTOR → ENTE específico):", url);
    try {
      await fetch(url, { method: "POST" });
    } catch (err) {
      console.warn("⚠️ Error enviando notificación:", err);
    }
  }

    // 🧾 Agregar registro a la grilla inferior (guardar objeto proveedor completo)
// Agregar fila completa lógica unificada

// 👉 Obtener partida y rubro seleccionados correctamente
const partidaObj = detalle.find(pp => pp.id_partida === selectedPartidaId);

const rubroObj = partidaObj?.rubros.find(
  rr => Number(rr.id_rubro) === Number(selectedRubroId)
);

// 👉 ESTE ya será el ID real correcto
const idRealSegPR = rubroObj?.id_seguimiento_partida_rubro;

console.log("🔥 ID REAL DEL RUBRO:", idRealSegPR);

// 👉 Guardar la fila en el estado
setRubroProveedorRows(prev => [
  ...prev.filter(
    row =>
      !(
        Number(row.partida) === Number(selectedPartidaId) &&
        Number(row.rubro) === Number(selectedRubroId)
      )
  ),

  {
    partida: selectedPartidaId,
    rubro: selectedRubroId,
    estatus,
proveedor: prov
  ? {
      rfc: prov.rfc ?? "",
      razon_social: prov.nombre ?? "",
      nombre_comercial: prov.nombre ?? "",
    }
  : null,
    fundamento: fundamentoId,
    importeSinIva: importe?.sinIva ?? 0,
    importeTotal: importe?.total ?? 0,

    id_seguimiento_partida_rubro_proveedor_adjudicado: nuevoId ?? null,

    // ⭐ ESTO es lo que antes salía undefined
        id_seguimiento_partida_rubro: idRealSegPR,
  },
]);

    // 🧹 Limpiar campos del formulario de "Seleccionar estatus proveedor"
   // NO limpiamos partida ni rubro, solo limpiamos selects
setSelectedProveedorLocal("");
setEstatusLocal("");
setSelectedEstatus((prev) => {
  const newState = { ...prev };
  delete newState[idRubro];
  return newState;
});
setSelectedFundamento((prev) => {
  const newState = { ...prev };
  delete newState[idRubro];
  return newState;
});
setImportes((prev) => {
  const newState = { ...prev };
  delete newState[idRubro];
  return newState;
});

    // 🔄 Ya no recargamos detalle después de adjudicar para evitar que desaparezca el card de "Seleccionar proceso de adjudicación"
  } catch (err: any) {
    console.error("❌ Error adjudicando proveedor:", err);
    toast.error(`❌ Error al adjudicar: ${err.message || "Revisa consola o backend"}`);
  }
};

  // ======================================================
  // 5️⃣ Simulación de carga inicial (ahora con id dinámico de searchParams)
  // ======================================================
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const procesoId = Number(idParam);
      setSelectedId(procesoId);
      cargarDetalle(procesoId);
    }
  }, [searchParams]);

  // Bloque para sincronizar el servidor seleccionado si existe en detalleGeneral
  useEffect(() => {
    if (detalleGeneral?.r_id_servidor_publico_asiste && servidores.length > 0) {
      const servidor = servidores.find(
        (s) => s.id === detalleGeneral.r_id_servidor_publico_asiste
      );
      if (servidor) {
        setServidorSeleccionado(servidor);
        setBusquedaServidor(servidor.nombre);
      }
    }
  }, [detalleGeneral, servidores]);

  // Mantener sincronizados partida y rubro según el accordion abierto
useEffect(() => {
  if (!accordionOpen) return;

  const match = accordionOpen.match(/^partida-(\d+)-rubro-(\d+)$/);
  if (!match) return;

  const [, partida, rubro] = match;

  setSelectedPartidaId(Number(partida));
  setSelectedRubroId(Number(rubro));
}, [accordionOpen]);

const yaAdjudicadoMemo = useMemo(() => {
  if (!selectedRubroId || !selectedPartidaId) return false;

  // 1. Estatus REAL backend
  const key = `${selectedPartidaId}-${selectedRubroId}`;
  const estatusBackend = estatusRubrosBackend[key];
  if (["ADJUDICADO", "DIFERIMIENTO", "CANCELADO", "DESIERTO"].includes(estatusBackend)) {
    return true;
  }

  // 2. Estatus local (tabla inferior)
  const estatusLocalRow = rubroProveedorRows.find(
    r =>
      Number(r.partida) === Number(selectedPartidaId) &&
      Number(r.rubro) === Number(selectedRubroId) &&
      ["ADJUDICADO", "DIFERIMIENTO", "DESIERTO", "CANCELADO"].includes(r.estatus)
  );
  if (estatusLocalRow) return true;

  // 3. Estatus en memoria
  const estatusMem = estatusPorRubro[selectedRubroId];
  if (["ADJUDICADO", "DIFERIMIENTO", "CANCELADO", "DESIERTO"].includes(estatusMem)) {
    return true;
  }

  return false;

}, [
  selectedRubroId,
  selectedPartidaId,
  estatusRubrosBackend,
  rubroProveedorRows,
  estatusPorRubro   // ✔ este sí
]);


  // Nueva función para guardar fila en la tabla inferior (con validación visual)
  const handleGuardar = () => {
    // Validar campos obligatorios
    const errors: Record<string, boolean> = {};

    if (!selectedRubroId) errors.rubro = true;
    if (!estatusLocal) errors.estatus = true;

    // 👉 SOLO pedir proveedor y fundamento en ADJUDICADO o DIFERIMIENTO
    if (["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)) {

      if (!selectedProveedorLocal) errors.proveedor = true;

      if (!selectedFundamento[selectedRubroId ?? 0]) {
        errors.fundamento = true;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("❌ Completa todos los campos obligatorios");
      return;
    }
    const newRow = {
      partida: "Partida seleccionada",
      rubro: "Rubro seleccionado",
      proveedor: "Proveedor seleccionado",
      estatus: estatusGeneral,
      fundamento: selectedFundamento[selectedId ?? 0],
      importeSinIva: importes[selectedId ?? 0]?.sinIva,
      importeTotal: importes[selectedId ?? 0]?.total,
    };
    setRubroProveedorRows((prev) => [...prev, newRow]);
  };

  if (isLoading) {
    return <RectorSkeleton />;
  }

  // Paso y flujo visual
  const steps = ["Gestión del rector", "Adjudicación"];
  // Determinar paso máximo según estatus
  const pasoActual = (() => {
    if (estatusGeneral === "CANCELADO") return 1;
    if (step === 2) return 2;
    return 1;
  })();

    console.log("DETALLE COMPLETO:", JSON.stringify(detalle, null, 2));
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Step Indicator visual */}
      <StepIndicator step={pasoActual} steps={steps} />


{/* ============================
  BOTONES SUPERIORES – PASO 1 – SALIR + AVANZAR/FINALIZAR ALINEADOS
============================ */}
{detalleGeneral && pasoActual === 1 && (
  <div className="flex items-center justify-between mb-3">

    {/* 🔴 Flecha SALIR con Dialog */}
    <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        type="button"
        onClick={() => setOpenSalirDialog(true)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="rounded-md shadow-sm cursor-pointer"
      >
        <span className="text-lg">←</span>
      </Button>
    </TooltipTrigger>

    {/* 🔥 Tooltip HACIA ARRIBA */}
    <TooltipContent
      side="top"
      align="center"
      className="text-xs"
    >
      Salir
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Deseas salir del proceso?</DialogTitle>
          <DialogDescription>
            Si sales ahora, podrías perder información no guardada.
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
              setOpenSalirDialog(false);
              router.push("/seguimiento-rector");
            }}
            style={{ backgroundColor: "#34e004", color: "white" }}
          >
            Sí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* 🔵 DERECHA – Botones del PASO 1 */}
    <div className="flex gap-3">

      {/* ⭐ AVANZAR PASO 2 (REVISADO) */}
      {estatusGeneral === "REVISADO" && (
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (!validateStep1Fields()) return;

          const formEl = document.querySelector("form");
          if (formEl) {
            formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
          }

          setTimeout(() => setStep(2), 500);
        }}
        className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 
                   transition-transform flex items-center gap-1 rounded-full px-4 py-2 cursor-pointer"
      >
        <span className="font-bold">2</span>
        <span className="font-bold">→</span>
      </Button>
    </TooltipTrigger>

    {/* 🔥 Tooltip ARRIBA */}
    <TooltipContent 
      side="top" 
      align="center"
      className="text-xs"
    >
      Avanzar al siguiente paso
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
      )}

      {/* ⭐ FINALIZAR PROCESO (CANCELADO) */}
      {estatusGeneral === "CANCELADO" && (
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        className="text-white hover:brightness-110"
        style={{ backgroundColor: "#FFBF00" }}
        onClick={() => {
          const formEl = document.querySelector("form");
          if (formEl) {
            formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
          }
        }}
      >
        Finalizar proceso
      </Button>
    </TooltipTrigger>

    {/* 🔥 Tooltip ARRIBA */}
    <TooltipContent 
      side="top" 
      align="center"
      className="text-xs"
    >
      Terminar proceso. No se podrá avanzar a adjudicación.
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
      )}

    </div>
  </div>
)}

 {pasoActual === 2 && (
  <div className="flex justify-start items-center gap-3 mt-10">

{/* Botón rojo SALIR con Tooltip + Dialog */}
<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
<Button
  variant="outline"
  size="icon"
  type="button"
  onClick={() => setOpenSalirDialog(true)}
  style={{ backgroundColor: "#db200b", color: "white" }}
  className="rounded-md shadow-sm cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
>
  <span className="text-lg">←</span>
</Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>Salir</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  {/* ----- Diálogo de confirmación ----- */}
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas salir?</DialogTitle>
      <DialogDescription>
        Si sales ahora, podrías perder información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">
      {/* Cancelar */}
      <Button
        onClick={() => setOpenSalirDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* Confirmar salida */}
      <Button
        onClick={() => {
          setOpenSalirDialog(false);
          router.push("/seguimiento-rector"); // 👈 tu misma ruta del Link original
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    {/* Botones derecha ahora junto al botón salir */}
    {estatusGeneral === "REVISADO" && (
      <>

        {/* BOTÓN REGRESAR AL PASO ANTERIOR */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
<Button
  variant="outline"
  onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
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

        {/* BOTÓN FINALIZAR PROCESO */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={finalizarProceso}
                style={{ backgroundColor: "#FFBF00", color: "white" }}
                className="cursor-pointer hover:brightness-110"
              >
                Finalizar proceso
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Finalizar el proceso</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </>
    )}

  </div>
)}

<Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas eliminar este registro?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">

      {/* CANCELAR */}
      <Button
        onClick={() => setOpenDeleteDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* CONFIRMAR ELIMINAR */}
      <Button
        onClick={async () => {
          if (!rowToDelete) return;

          await handleDelete(rowToDelete); // 👈 Ejecuta tu lógica que ya tienes
          setOpenDeleteDialog(false);
          setRowToDelete(null);
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      {/* Card Detalle del Seguimiento SIEMPRE visible */}
{detalleGeneral && (
  <Card className="border shadow-sm bg-gray-50">
    
    {/* HEADER — AHORA CON EL BOTÓN ARRIBA A LA DERECHA */}
    <CardHeader className="flex flex-row items-center justify-between">

{/* IZQUIERDA: Flecha + Título + Oficio + Botones superiores */}
<div className="flex items-center gap-3">
  {/* Texto */}
  <div className="flex flex-col">
    <CardTitle className="text-gray-700 text-lg">Detalle del Seguimiento</CardTitle>
    <span className="text-gray-600 font-medium">
      Oficio de invitación:{" "}
      <span className="text-gray-800">
        {detalleGeneral.e_oficio_invitacion || "—"}
      </span>
    </span>
  </div>
</div>


    </CardHeader>

    {/* CONTENIDO DEL CARD */}
    <CardContent className="text-sm text-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">

      {/* ID */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <strong>ID:</strong> {selectedId}
      </div>

      {/* Ente */}
      <div>
        <strong>Ente:</strong> {detalleGeneral.ente}
      </div>

      {/* Tipo de Licitación */}
      <div>
        <strong>Tipo de Licitación:</strong> {detalleGeneral.e_tipo_licitacion}
      </div>

      {/* No. de veces */}
      <div className="mt-[-19px]">
        <strong>No. de veces:</strong>{" "}
        {detalleGeneral.e_tipo_licitacion_no_veces
          ? `${detalleGeneral.tipo_licitacion_no_veces_descripcion || ""}`
          : "—"}
      </div>

      {/* Tipo de Evento */}
      <div>
        <strong>Tipo de Evento:</strong> {detalleGeneral.e_tipo_evento}
      </div>

      {/* Estatus */}
      <div className="flex items-center gap-2 col-span-2 sm:col-span-1 mt-[-4px]">
        <strong>Estatus actual:</strong>
        <span
          className={`px-3 py-1 text-sm font-semibold rounded-md ${
            (estatusGeneral || detalleGeneral.r_estatus) === "PREREGISTRADO"
              ? "bg-yellow-100 text-yellow-800"
              : (estatusGeneral || detalleGeneral.r_estatus) === "REVISADO"
              ? "bg-green-100 text-green-800"
              : (estatusGeneral || detalleGeneral.r_estatus) === "CANCELADO"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {estatusGeneral || detalleGeneral.r_estatus || "—"}
        </span>
      </div>

    </CardContent>

  </Card>
)}

     {/* Paso 1: Gestión del Rector */}
{pasoActual === 1 && (
  <>

    <Card className="shadow-md border w-full pt-1">
      <CardHeader className="flex flex-row items-center justify-between py-1">
        <CardTitle className="text-lg">Gestión del Rector</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-4 mt-[-10px]">

          <div className="flex flex-wrap items-end justify-between gap-6">

        <div className="flex flex-col min-w-[160px]">
          <Label className="text-gray-700 font-medium">Oficio</Label>

         <Input
        name="oficio"
        value={form.oficio ?? detalleGeneral?.e_oficio_invitacion ?? ""}
        onChange={(e) => {
          setForm({ ...form, oficio: e.target.value });

          // 👉 Limpia el error cuando el usuario escribe
          if (formErrors.oficio) {
            setFormErrors((prev) => ({ ...prev, oficio: false }));
          }
        }}
        placeholder="Número de oficio"
        className={`w-[320px] shadow-sm ${formErrors.oficio ? "border-red-500" : ""}`}
      />

      {formErrors.oficio && (
        <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
      )}
        </div>


      <div className="flex flex-col min-w-[140px]">
        <Label className="text-gray-700 font-medium">Fecha de Emisión</Label>

        <Input
        value={form.fecha_emision ?? ""}
        onChange={(e) => {
          setForm({ ...form, fecha_emision: formatDateDDMMYYYY(e.target.value) });

          if (formErrors.fecha_emision) {
            setFormErrors((prev) => ({ ...prev, fecha_emision: false }));
          }
        }}
        placeholder="dd/mm/aaaa"
        maxLength={10}
        name="fecha_emision"
        className={`w-[140px] shadow-sm ${
          formErrors.fecha_emision ? "border-red-500" : ""
        }`}
      />

      {formErrors.fecha_emision && (
        <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
      )}
      </div>

            <div className="flex flex-col min-w-[140px]">
            <Label className="text-gray-700 font-medium">Fecha reunión</Label>

            <Input
            value={form.fecha_reunion ?? ""}
            onChange={(e) => {
              setForm({ ...form, fecha_reunion: formatDateDDMMYYYY(e.target.value) });

              if (formErrors.fecha_reunion) {
                setFormErrors((prev) => ({ ...prev, fecha_reunion: false }));
              }
            }}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            name="fecha_reunion_fecha"
            className={`w-[140px] shadow-sm ${
              formErrors.fecha_reunion ? "border-red-500" : ""
            }`}
          />

          {formErrors.fecha_reunion && (
            <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
          )}
          </div>



            <div className="flex flex-col min-w-[100px]">
          <Label className="text-gray-700 font-medium">Hora (24 Hrs)</Label>

         <Input
          value={form.hora_reunion ?? ""}
          onChange={(e) => {
            setForm({ ...form, hora_reunion: formatTimeHHMM(e.target.value) });

            if (formErrors.hora_reunion) {
              setFormErrors((prev) => ({ ...prev, hora_reunion: false }));
            }
          }}
          placeholder="HH:MM"
          maxLength={5}
          name="fecha_reunion_hora"
          className={`w-[100px] shadow-sm ${
            formErrors.hora_reunion ? "border-red-500" : ""
          }`}
        />

        {formErrors.hora_reunion && (
          <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
        )}
        </div>

            <div className="flex flex-col justify-end min-w-[300px]">
              <Label className="mb-1 text-gray-700 font-medium">Estatus General</Label>
              <RadioGroup
                value={estatusGeneral}
                onValueChange={(val: string) => {
                  setEstatusGeneral(val);
                  if (val !== "REVISADO") setMostrarObservaciones(false);
                }}
                className="flex flex-row gap-6 items-center bg-gray-50 px-3 py-2 rounded-md border border-gray-200 shadow-sm"
                name="estatus"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="REVISADO" id="estatus-revisado" />
                  <Label htmlFor="estatus-revisado" className="cursor-pointer text-sm font-medium">
                    REVISADO
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="CANCELADO" id="estatus-cancelado" />
                  <Label htmlFor="estatus-cancelado" className="cursor-pointer text-sm font-medium">
                    CANCELADO
                  </Label>
                </div>
              </RadioGroup>
              NOTA: El Estatus se actualiza al finalizar el proceso
            </div>


          </div>

          {estatusGeneral === "REVISADO" && (
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarObservaciones}
                  onChange={(e) => setMostrarObservaciones(e.target.checked)}
                  className="accent-blue-600"
                />
                Observaciones
              </label>

              {mostrarObservaciones && (
                <div className="mt-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <textarea
                    id="observaciones"
                    name="observaciones"
                    className="w-full border rounded-md p-2 resize-none"
                    rows={2}
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {estatusGeneral === "CANCELADO" && (
            <div className="mt-2">
              <Label>Motivo de cancelación</Label>
              <textarea
                className="w-full border rounded-md p-2 resize-none"
                rows={2}
                value={observaciones}
                onChange={(e) => {
                  setObservaciones(e.target.value);
                  setMostrarObservaciones(true);
                }}
                placeholder="Escribe el motivo de la cancelación..."
              />
            </div>
          )}

          <div>
          <Label>Asunto</Label>
          <textarea
          name="asunto"
          value={form.asunto ?? detalleGeneral?.e_asunto ?? ""}
          onChange={(e) => {
            setForm({ ...form, asunto: e.target.value });

            if (formErrors.asunto) {
              setFormErrors((prev) => ({ ...prev, asunto: false }));
            }
          }}
          placeholder="Escribe el asunto..."
          className={`w-full border rounded-md p-2 resize-none ${
            formErrors.asunto ? "border-red-500" : ""
          }`}
          rows={2}
        />

        {formErrors.asunto && (
          <p className="text-xs text-red-600 mt-1">Este campo es obligatorio</p>
        )}
        </div>

          <div>
            <Label>Servidor público (asiste)</Label>

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
                            setForm((prev) => ({
                              ...prev,
                              servidor_publico_cargo: s.cargo || "",
                              id_servidor_publico_asiste: s.id,
                            }));
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

            {servidorSeleccionado && (
              <p className="text-sm text-gray-600 mt-1">
                Seleccionado: <strong>{servidorSeleccionado.nombre}</strong>
              </p>
            )}

            {!servidorSeleccionado && formErrors.servidor && (
              <p className="text-xs text-red-600 mt-1">Campo obligatorio</p>
            )}

            <div className="flex gap-3 mt-2 items-center">

{/* Ver servidores públicos */}
<Dialog open={verServidoresDialogOpen} onOpenChange={setVerServidoresDialogOpen}>
  <DialogTrigger asChild>
    <Button
      variant="outline"
      className="border-gray-300 text-gray-700 hover:bg-gray-100"
      type="button"
    >
      <Eye className="w-4 h-4 mr-2" />
      Ver servidores públicos
    </Button>
  </DialogTrigger>

  {/* Dialog más pequeño y con altura máxima */}
  <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
    <DialogHeader>
      <DialogTitle>Servidores públicos del ente 0</DialogTitle>
      <DialogDescription>
        Lista de servidores públicos registrados para el ente 0.
      </DialogDescription>
    </DialogHeader>

    {/* Contenedor scrollable */}
    <div className="overflow-y-auto mt-2 border rounded-md max-h-[50vh]">
      <table className="min-w-full bg-white border-collapse">
        <thead className="sticky top-0 bg-gray-100 z-10">
          <tr>
            <th className="py-2 px-4 border-b text-left">Nombre</th>
            <th className="py-2 px-4 border-b text-left">Cargo</th>
          </tr>
        </thead>
        <tbody>
          {servidores.map((s, idx) => (
            <tr key={s.id || idx}>
              <td className="py-2 px-4 border-b">{s.nombre}</td>
              <td className="py-2 px-4 border-b">{s.cargo}</td>
            </tr>
          ))}

          {servidores.length === 0 && (
            <tr>
              <td colSpan={2} className="py-2 px-4 text-center text-gray-400">
                No hay servidores públicos para el ente 0.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <DialogFooter className="mt-4">
    <Button
      onClick={() => setVerServidoresDialogOpen(false)}
      style={{
        backgroundColor: "#db200b",
        color: "white"
      }}
      className="hover:brightness-110"
    >
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
                      Completa los campos para registrar un nuevo servidor público del ente 0.
                    </DialogDescription>
                  </DialogHeader>

                  <form className="space-y-4 mt-2" onSubmit={(e) => e.preventDefault()}>
                    <div>
                      <Label>Ente perteneciente</Label>
                      <Input value="Ente 0 (Rector)" disabled className="bg-gray-100 text-gray-700 cursor-not-allowed" />
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
                        type="button"
                        className="bg-[#34e004] text-white hover:bg-[#2bc103]"
                        onClick={async () => {
                          if (!nuevoServidorNombre.trim() || !nuevoServidorCargo.trim()) {
                            toast.warning("Por favor ingresa nombre y cargo.");
                            return;
                          }

                          setAddServidorLoading(true);

                          try {
                            const url = `${API_BASE}/catalogos/ente-y-servidor-publico-gestionar-ambos?p_id_ente=0&p_nombre=${encodeURIComponent(
                              nuevoServidorNombre
                            )}&p_cargo=${encodeURIComponent(nuevoServidorCargo)}`;

                            const resp = await fetch(url, { method: "POST" });
                            if (!resp.ok) {
                              toast.error("Error al añadir servidor público.");
                              return;
                            }

                            const sResp = await fetch(
                              `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=0`
                            );
                            const nuevosServidores = await sResp.json();
                            setServidores(nuevosServidores);

                            const nuevoServidor = nuevosServidores.find(
                              (s: ServidorPublico) =>
                                s.nombre?.toLowerCase() === nuevoServidorNombre.toLowerCase() &&
                                s.cargo?.toLowerCase() === nuevoServidorCargo.toLowerCase()
                            );

                            if (nuevoServidor) {
                              setServidorSeleccionado(nuevoServidor);
                              setForm((prev) => ({
                                ...prev,
                                id_servidor_publico_asiste: nuevoServidor.id,
                              }));
                              setBusquedaServidor(nuevoServidor.nombre);
                              setMostrarServidores(false);
                            }

                            setNuevoServidorNombre("");
                            setNuevoServidorCargo("");
                            setAddServidorDialogOpen(false);

                          } catch (err) {
                            toast.error("Error al añadir servidor público.");
                          } finally {
                            setAddServidorLoading(false);
                          }
                        }}
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
          </div>

        </form>
      </CardContent>
    </Card>

    {/* ============================
  BARRA SUPERIOR DE CONTROL (Salir + Avanzar/Finalizar)
============================ */}
{pasoActual === 1 && (
  <div className="flex w-full justify-between items-center mb-4">

    {/* 🔴 BOTÓN DE SALIR */}
    <Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setOpenSalirDialog(true)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="cursor-pointer rounded-md shadow-sm"
              size="icon"
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
            Si sales ahora, podrías perder información no guardada.
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
              setOpenSalirDialog(false);
              router.push("/seguimiento-rector");
            }}
            style={{ backgroundColor: "#34e004", color: "white" }}
            className="hover:brightness-110"
          >
            Sí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* ⭐ CONTENEDOR DE BOTONES DERECHA */}
    <div className="flex gap-3">

      {/* ➤ AVANZAR AL PASO 2 (REVISADO) */}
      {estatusGeneral === "REVISADO" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
<Button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    if (!validateStep1Fields()) return;

    const formEl = document.querySelector("form");
    if (formEl) {
      formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
    }

    setTimeout(() => setStep(2), 500);
  }}
  className="bg-[#235391] text-white hover:bg-[#1e3a8a] hover:scale-105 
             transition-transform flex items-center gap-1 rounded-full px-4 py-2 cursor-pointer"
>
  <span className="font-bold">2</span>
  <span className="font-bold">→</span>
</Button>
            </TooltipTrigger>

            <TooltipContent side="top" className="text-xs">
              Avanzar al siguiente paso
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* 🔴 FINALIZAR PROCESO (CANCELADO) */}
      {estatusGeneral === "CANCELADO" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
            <Button
              type="button"
              className="text-white hover:brightness-110"
              style={{ backgroundColor: "#FFBF00" }}   // ⭐ COLOR NUEVO
              onClick={() => {
                const formEl = document.querySelector("form");
                if (formEl) {
                  formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
                }
              }}
            >
              Finalizar proceso
            </Button>
            </TooltipTrigger>

            <TooltipContent side="top" className="text-xs">
              Terminar proceso. No se podrá avanzar a adjudicación.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

    </div>

  </div>
)}
  </>
)}

{/* Paso 2: Seleccionar proceso de adjudicación */}
{pasoActual === 2 && estatusGeneral === "REVISADO" && (
  <Card className="shadow-md border">
    <CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>Seleccionar proceso de adjudicación</CardTitle>

</CardHeader>
    <CardContent className="space-y-6">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={accordionOpen}
        onValueChange={setAccordionOpen}
      >

        {detalle.flatMap((p) =>
          p.rubros.map((r) => {
            const itemValue = `partida-${p.id_partida}-rubro-${r.id_rubro}`;
            
               // AGREGA ESTE LOG AQUI:
              console.log("RUBRO SELECCIONADO:", {
                id_partida: p.id_partida,
                id_rubro: r.id_rubro,
                id_seguimiento_partida_rubro: r.id_seguimiento_partida_rubro,
                descripcion: r.rubro
              });


            // Obtener estatus del rubro actual
            const estatusRubro = getEstatusPorRubroId(p.id_partida, r.id_rubro);
            const estatusColor = getEstatusColor(estatusRubro);


            return (
              <AccordionItem key={itemValue} value={itemValue} className="mb-2">

               {/* ------- TRIGGER MODIFICADO CON INDICADOR IZQUIERDA -------- */}
              {/* ------- TRIGGER MODIFICADO CON INDICADOR IZQUIERDA -------- */}
<AccordionTrigger
  onClick={() => {
    setAccordionOpen(itemValue);
    setSelectedPartidaId(p.id_partida);
    setSelectedRubroId(r.id_rubro);

    // ⭐ Guardar el ID REAL inmediatamente
    setIdSeguimientoPartidaRubro(r.id_seguimiento_partida_rubro);
    console.log("🔥 ID FIJADO AL SELECCIONAR:", r.id_seguimiento_partida_rubro);

    // ⭐⭐⭐ REINICIAR ESTADOS PARA ESTE RUBRO ⭐⭐⭐

    // Limpiar estatus mostrado
    setEstatusLocal("");

    // Limpiar proveedor seleccionado
    setSelectedProveedorLocal("");

    // Limpiar fundamento de este rubro
    setSelectedFundamento(prev => {
      const copy = { ...prev };
      delete copy[r.id_rubro];
      return copy;
    });

    // Limpiar importes calculados para este rubro
    setImportes(prev => {
      const copy = { ...prev };
      delete copy[r.id_rubro];
      return copy;
    });

    // Limpiar errores visuales
    setValidationErrors({});
  }}
  className={`
    px-3 py-2 transition-colors cursor-pointer
    flex flex-row justify-between items-center
    ${accordionOpen === itemValue ? "bg-[#faf89d]" : "bg-[#c1def7]"}
  `}
>
                <div className="flex items-center gap-2">

                  {/* 🔥 Obtener estatus REAL desde el backend */}
                  {(() => {
                    const estatusRubro = getEstatusPorRubroId(p.id_partida, r.id_rubro);
                    const estatusColor = getEstatusColor(estatusRubro) || undefined;

                    return (
                      <>
                        {/* 🔴🟢 Punto de color */}
                        {estatusColor && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: estatusColor }}
                            title={estatusRubro || ""}
                          ></span>
                        )}
                      </>
                    );
                  })()}

                  <span className="font-medium">
                    {p.id_partida} | Rubro #{r.id_rubro} – {r.rubro}
                  </span>
                </div>
              </AccordionTrigger>
                {/* ------- FIN DEL TRIGGER CON INDICADOR -------- */}

                <AccordionContent className="space-y-6 transition-all duration-300 ease-in-out">
                  {/* 🔒 Bloqueo automático según estatus */}
                  {(() => {
                    const bloqueado = ["DESIERTO", "CANCELADO"].includes(estatusLocal);
                    return null;
                  })()}


                                    {/* ------------------- ESTATUS Y FUNDAMENTO ------------------- */}
                  <div className="grid grid-cols-10 gap-4 mb-2">

                    {/* ESTATUS */}
                    <div className="col-span-3">
                      <Label>Estatus</Label>

                      <Select
                        value={estatusLocal}
                        onValueChange={(val) => {
                          setEstatusLocal(val);

                          if (selectedRubroId != null) {
                            setSelectedEstatus((prev) => ({
                              ...prev,
                              [selectedRubroId]: val,
                            }));
                          }

                          if (["CANCELADO", "DESIERTO"].includes(val) && selectedRubroId != null) {
                            setSelectedFundamento(prev => ({
                              ...prev,
                              [selectedRubroId]: "", // fundamento vacío, NO rompe tipos
                            }));
                          }

                          setValidationErrors((prev) => ({
                            ...prev,
                            estatus: false,
                          }));
                        }}
                      >
                        <SelectTrigger className={`${validationErrors.estatus ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Selecciona estatus" />
                        </SelectTrigger>

                        <SelectContent>
                          {estatusOptions.map((e) => {
                            let colorClass = "bg-[#939596]"; // gris desierto
                            if (e === "ADJUDICADO") colorClass = "bg-[#22c55e]";
                            if (e === "DIFERIMIENTO") colorClass = "bg-[#ff8800]";
                            if (e === "CANCELADO") colorClass = "bg-[#ef4444]";

                            return (
                              <SelectItem key={e} value={e}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                                  {e}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {validationErrors.estatus && (
                        <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>
                      )}
                    </div>

                    {/* FUNDAMENTO */}
                    <div className="col-span-7">
                      <Label>Fundamento</Label>

                      <Select
                        value={
                          selectedRubroId != null
                            ? selectedFundamento[selectedRubroId] ?? ""
                            : ""
                        }
                        onValueChange={(val) => {
                          if (selectedRubroId != null) {
                            setSelectedFundamento((prev) => ({
                              ...prev,
                              [selectedRubroId]: val,
                            }));
                          }

                          setValidationErrors((prev) => ({
                            ...prev,
                            fundamento: false,
                          }));
                        }}
                        disabled={["DESIERTO", "CANCELADO"].includes(estatusLocal) || !["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)}
                      >
                        <SelectTrigger className={`${validationErrors.fundamento ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Selecciona fundamento" />
                        </SelectTrigger>

                        <SelectContent>
                          {fundamentos.length > 0 ? (
                            fundamentos.map((f) => (
                              <SelectItem key={f.id} value={f.id.toString()}>
                                {f.descripcion}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem disabled value="no_fundamentos">
                              No hay fundamentos
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>

                      {validationErrors.fundamento && (
                        <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>
                      )}
                    </div>
                  </div>

                  {/* Select Proveedor */}
                  <div>
                    <Label>Proveedor A Adjudicar</Label>
                    <Select
                      value={String(selectedProveedorLocal)}
                      onValueChange={(val) => {
                        setSelectedProveedorLocal(val);

                        if (selectedRubroId != null) {
                          setSelectedProveedor((prev) => ({
                            ...prev,
                            [selectedRubroId]: val,
                          }));
                        }

                        const rubroSel = p.rubros.find(
                          (rr) => Number(rr.id_rubro) === Number(selectedRubroId)
                        );

                        const proveedorSel = rubroSel?.proveedores.find(
                          (prov) => prov.id?.toString() === val || prov.rfc === val
                        );

                        if (proveedorSel) {
                          const sinIva = proveedorSel.importeSinIvaOriginal;
                          const total = proveedorSel.importeTotalOriginal;

                          if (selectedRubroId != null) {
                            setImportes((prev) => ({
                              ...prev,
                              [Number(selectedRubroId)]: { sinIva, total },
                            }));
                          }
                        }

                        setValidationErrors((prev) => ({
                          ...prev,
                          proveedor: false,
                        }));
                      }}

                      // 🔥🔥 NUEVA LÓGICA DE BLOQUEO DEL SELECT
                      disabled={
                        !selectedRubroId ||                   // No hay rubro seleccionado
                        !estatusLocal ||                      // No se ha elegido estatus
                        (
                          ["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal) &&
                          !selectedFundamento[selectedRubroId ?? 0]   // Fundamento requerido
                        ) ||
                        ["DESIERTO", "CANCELADO"].includes(estatusLocal) // Bloqueo natural
                      }
                    >
                      <SelectTrigger
                        className={`${validationErrors.proveedor ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Selecciona proveedor" />
                      </SelectTrigger>

                      <SelectContent className="z-50" position="popper">
                        {(() => {
                          if (!selectedRubroId) return null;

                          const rubroSel = p.rubros.find(
                            (rr) => Number(rr.id_rubro) === Number(selectedRubroId)
                          );

                          if (!rubroSel || !Array.isArray(rubroSel.proveedores) || rubroSel.proveedores.length === 0) {
                            return (
                              <SelectItem disabled value="__no_providers__">
                                No hay proveedores
                              </SelectItem>
                            );
                          }

                          return rubroSel.proveedores.map((prov) => (
                            <SelectItem
                              key={prov.id ? `prov-${String(prov.id)}` : `prov-${prov.rfc}`}
                              value={String(prov.id || prov.rfc)}
                            >
                              {`${prov.rfc} ${prov.nombre}`}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>

                    {validationErrors.proveedor && (
                      <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>
                    )}
                  </div>

                  {/* Montos */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
                    <div>
                      <Label>Monto del rubro</Label>
                      <Input
                        disabled
                        value={
                          selectedRubroId
                            ? (() => {
                                const rubro = p.rubros.find(
                                  (rr) =>
                                    Number(rr.id_rubro) ===
                                    Number(selectedRubroId)
                                );
                                return rubro
                                  ? formatMXN(rubro.monto)
                                  : "$—";
                              })()
                            : ""
                        }
                        className="bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <Label>Importe cotizado</Label>
                      <Input
                        disabled
                        value={
                          (() => {
                            if (
                              !selectedRubroId ||
                              !selectedProveedorLocal
                            )
                              return "";
                            const rubro = p.rubros.find(
                              (rr) =>
                                Number(rr.id_rubro) ===
                                Number(selectedRubroId)
                            );
                            const proveedor = rubro?.proveedores.find(
                              (prov) =>
                                prov.id?.toString() ===
                                  selectedProveedorLocal ||
                                prov.rfc === selectedProveedorLocal
                            );
                            return proveedor
                              ? formatMXN(proveedor.importeSinIvaOriginal)
                              : "";
                          })()
                        }
                        className="bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <Label>Importe cotizado con IVA</Label>
                      <Input
                        disabled
                        value={
                          (() => {
                            if (
                              !selectedRubroId ||
                              !selectedProveedorLocal
                            )
                              return "";
                            const rubro = p.rubros.find(
                              (rr) =>
                                Number(rr.id_rubro) ===
                                Number(selectedRubroId)
                            );
                            const proveedor = rubro?.proveedores.find(
                              (prov) =>
                                prov.id?.toString() ===
                                  selectedProveedorLocal ||
                                prov.rfc === selectedProveedorLocal
                            );
                            return proveedor
                              ? formatMXN(proveedor.importeTotalOriginal)
                              : "";
                          })()
                        }
                        className="bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <Label>Importe ajustado</Label>
                      <Input
                        disabled={["DESIERTO", "CANCELADO"].includes(estatusLocal)}
                        onChange={["DESIERTO", "CANCELADO"].includes(estatusLocal) ? undefined : (e) => {
                          if (selectedRubroId == null) return;
                          const digits = e.target.value.replace(/\D/g, "");
                          const amount = digits ? parseInt(digits, 10) : 0;
                          setImportes((prev) => ({
                            ...prev,
                            [selectedRubroId]: {
                              sinIva: amount,
                              total: Number((amount * 1.16).toFixed(2)),
                            },
                          }));
                        }}
                        value={
                          selectedRubroId != null &&
                          importes[selectedRubroId]?.sinIva
                            ? formatMXN(importes[selectedRubroId].sinIva)
                            : ""
                        }
                        placeholder="$0.00"
                      />
                    </div>

                    <div>
                      <Label>Importe ajustado con IVA</Label>
                      <Input
                        disabled
                        className="bg-gray-100 text-gray-700 cursor-not-allowed"
                        value={
                          selectedRubroId != null &&
                          importes[selectedRubroId]?.total
                            ? formatMXN(importes[selectedRubroId].total)
                            : ""
                        }
                        placeholder="$0.00"
                      />
                    </div>
                  </div>

                {/* Botón Guardar / Adjudicar */}
{(() => {

  // Si YA está adjudicado, diferido, cancelado o desierto
  if (yaAdjudicadoMemo) {
    return (
      <div
        className="w-full text-center py-3 rounded-md text-white font-semibold"
        style={{
          backgroundColor: "#A5B4FC",
          opacity: 0.8,
          cursor: "not-allowed",
        }}
      >
        Guardado
      </div>
    );
  }

  // Si NO está adjudicado → mostrar botón normal
  return (
    <Button
      className="w-full text-white cursor-pointer"
      style={{ backgroundColor: "#2563eb" }}
      onClick={async () => {

        // ---------- VALIDACIONES ----------
        const errors: Record<string, boolean> = {};

        if (!selectedRubroId) errors.rubro = true;
        if (!estatusLocal) errors.estatus = true;

        if (["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)) {
          if (!selectedProveedorLocal) errors.proveedor = true;
          if (!selectedFundamento[selectedRubroId ?? 0]) errors.fundamento = true;
        }

        if (["CANCELADO", "DESIERTO"].includes(estatusLocal)) {
          delete errors.proveedor;
        }

        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          toast.error("❌ Completa todos los campos obligatorios");
          return;
        }
        // ------------------------------------

        const esAdjudicable = ["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal);

        // ADJUDICAR PROVEEDOR
        if (esAdjudicable) {
          if (selectedRubroId == null) {
            toast.error("❌ No se encontró el rubro seleccionado");
            return;
          }

          await adjudicarProveedor(
            Number(selectedRubroId),
            Number(p.id_partida)
          );
          return;
        }

        // ---------- GUARDAR DESIERTO / CANCELADO ----------
        // Obtener el ID REAL de seguimiento_partida_rubro
        const partidaObj = detalle.find(pp => pp.id_partida === p.id_partida);
        const rubroObj = partidaObj?.rubros.find(
          rr => Number(rr.id_rubro) === Number(selectedRubroId)
        );

        const idRealSegPR = rubroObj?.id_seguimiento_partida_rubro;

        if (!idRealSegPR) {
          toast.error("❌ No se encontró id_seguimiento_partida_rubro");
          return;
        }

        try {
          const res = await fetch(
            `${API_BASE}/rector/seguimiento-gestion-proveedor-adjudicado/`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                p_estatus: estatusLocal,
                p_id_seguimiento_partida_rubro: idRealSegPR,
                p_id_seguimiento_partida_rubro_proveedor: 0,
                p_id: 0,
                p_importe_ajustado_sin_iva: 0,
                p_importe_ajustado_total: 0,
                p_id_fundamento: 0,
              }),
            }
          );

          const data = await res.json();
          if (!res.ok) throw new Error(data?.detail);

          // -------- ACTUALIZAR TABLA INFERIOR --------
          setRubroProveedorRows(prev => [
            ...prev.filter(row =>
              !(Number(row.partida) === Number(p.id_partida) &&
                Number(row.rubro) === Number(selectedRubroId))
            ),
            {
              partida: p.id_partida,
              rubro: selectedRubroId,
              estatus: estatusLocal,
              proveedor: null,
              fundamento: null,
              importeSinIva: 0,
              importeTotal: 0,
              id_seguimiento_partida_rubro: idRealSegPR,
              id_seguimiento_partida_rubro_proveedor_adjudicado: null,
            },
          ]);

          // Para bloquear el botón sin cerrar accordion
          setEstatusPorRubro(prev => ({
            ...prev,
            [Number(selectedRubroId)]: estatusLocal,
          }));

          toast.success("Estatus guardado correctamente en la base de datos.");

        } catch (err) {
          console.error("❌ Error guardando estatus:", err);
          toast.error("Error al guardar estatus.");
        }
      }}
    >
      {["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)
        ? "Adjudicar"
        : "Guardar"}
    </Button>
  );
})()}

                  {/* Alternador Tabla/Card */}
                  <div className="flex justify-end mb-3">
                    <Button
                      variant={
                        tableView === "table" ? "default" : "outline"
                      }
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setTableView("table")}
                    >
                      Vista Tabla
                    </Button>
                    <Button
                      variant={
                        tableView === "card" ? "default" : "outline"
                      }
                      size="sm"
                      className="ml-2 cursor-pointer"
                      onClick={() => setTableView("card")}
                    >
                      Vista Card
                    </Button>
                  </div>

                  {/* TABLA */}
                  {tableView === "table" ? (
                    <div className="bg-gray-100 p-4 rounded-md border border-gray-300 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rubro | Proveedor</TableHead>
                            <TableHead>Monto IVA</TableHead>
                            <TableHead>Estatus</TableHead>
                            <TableHead>Fundamento</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        
                       <TableBody>
                      {rubroProveedorRows
                        .filter(
                          (row) =>
                            Number(row.partida) === Number(p.id_partida) &&
                            Number(row.rubro) === Number(r.id_rubro)
                        )
                        .map((row, index) => {
                              const partidaObj = detalle.find(
                                (partida) =>
                                  partida.id_partida ===
                                  Number(row.partida)
                              );
                              const rubroObj = detalle
                                .flatMap((pr) => pr.rubros)
                                .find(
                                  (rr) =>
                                    Number(rr.id_rubro) ===
                                    Number(row.rubro)
                                );
                              const fundamentoObj = fundamentos.find(
                                (fun) =>
                                  Number(fun.id) ===
                                  Number(row.fundamento)
                              );

                              return (
                                <TableRow key={index}>
                                  <TableCell className="whitespace-normal break-words">
                                    <div>
                                      <strong>Rubro:</strong>
                                      <br />
                                      {partidaObj
                                        ? `${partidaObj.id_partida} | ${
                                            rubroObj
                                              ? `${rubroObj.id_rubro} - ${rubroObj.rubro}`
                                              : "—"
                                          }`
                                        : "—"}
                                      <br />
                                      <strong>Proveedor:</strong>
                                      <br />
                                      {`${row.proveedor?.rfc || ""} ${
                                        row.proveedor?.razon_social || ""
                                      }`}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    {formatMXN(row.importeTotal)}
                                  </TableCell>

                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {row.estatus && (
                                      <span
                                        className={`w-2.5 h-2.5 rounded-full`}
                                        style={{
                                          backgroundColor:
                                            row.estatus === "ADJUDICADO"
                                              ? "#22c55e"
                                              : row.estatus === "DIFERIMIENTO"
                                              ? "#ff8800"
                                              : row.estatus === "CANCELADO"
                                              ? "#ef4444"
                                              : row.estatus === "PREINGRESO"
                                              ? "#4b0082"
                                              : "#939596",
                                        }}
                                      ></span>
                                    )}
                                      {row.estatus || "—"}
                                    </div>
                                  </TableCell>

                                  <TableCell className="whitespace-normal break-words">
                                    <strong></strong>{" "}
                                    {fundamentoObj
                                      ? fundamentoObj.descripcion
                                      : "—"}
                                  </TableCell>

                                  <TableCell>
<Button
  size="sm"
  variant="destructive"
  className="cursor-pointer flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
  onClick={() => {
    setRowToDelete(row);     // Guarda la fila a eliminar
    setOpenDeleteDialog(true); // Abre dialog
  }}
>
  <Trash2 size={18} />
</Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    /* Modo Card */
                    <div className="grid gap-4">
                      {rubroProveedorRows
                      .filter(
                        (row) =>
                          Number(row.partida) === Number(p.id_partida) &&
                          Number(row.rubro) === Number(r.id_rubro)
                      )
                        .map((row, index) => {
                          const partidaObj = detalle.find(
                            (partida) =>
                              partida.id_partida === Number(row.partida)
                          );
                          const rubroObj = detalle
                            .flatMap((pr) => pr.rubros)
                            .find(
                              (rr) =>
                                Number(rr.id_rubro) === Number(row.rubro)
                            );
                          const fundamentoObj = fundamentos.find(
                            (fun) =>
                              Number(fun.id) === Number(row.fundamento)
                          );

                          return (
                            <Card
                              key={index}
                              className="border shadow-sm bg-gray-50 p-4"
                            >
                              <p>
                                <strong>Rubro:</strong>
                                <br />
                                {partidaObj
                                  ? `${partidaObj.id_partida} | ${
                                      rubroObj
                                        ? `${rubroObj.id_rubro} - ${rubroObj.rubro}`
                                        : "—"
                                    }`
                                  : "—"}
                              </p>

                              <p>
                                <strong>Proveedor:</strong>{" "}
                                {`${row.proveedor?.rfc || ""} ${
                                  row.proveedor?.razon_social || ""
                                }`}
                              </p>

                              <p>
                                <strong>Monto IVA:</strong>{" "}
                                {formatMXN(row.importeTotal)}
                              </p>

                             <p className="flex items-center gap-2">
                              <strong>Estatus:</strong>

                              {row.estatus ? (
                                <>
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor:
                                        row.estatus === "ADJUDICADO"
                                          ? "#22c55e"
                                          : row.estatus === "DIFERIMIENTO"
                                          ? "#ff8800"
                                          : row.estatus === "CANCELADO"
                                          ? "#ef4444"
                                            : row.estatus === "PREINGRESO"
                                          ? "#4b0082"
                                          : "#939596",
                                    }}
                                  ></span>

                                  {row.estatus}
                                </>
                              ) : (
                                "—"
                              )}
                            </p>

                              <p>
                                <strong>Fundamento:</strong>{" "}
                                {fundamentoObj
                                  ? fundamentoObj.descripcion
                                  : "—"}
                              </p>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })
        )}

      </Accordion>
    </CardContent>
  </Card>
)}

   {pasoActual === 2 && (
  <div className="flex justify-start items-center gap-3 mt-10">

{/* Botón rojo SALIR con Tooltip + Dialog */}
<Dialog open={openSalirDialog} onOpenChange={setOpenSalirDialog}>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
<Button
  variant="outline"
  size="icon"
  type="button"
  onClick={() => setOpenSalirDialog(true)}
  style={{ backgroundColor: "#db200b", color: "white" }}
  className="rounded-md shadow-sm cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
>
  <span className="text-lg">←</span>
</Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        <p>Salir</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  {/* ----- Diálogo de confirmación ----- */}
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas salir?</DialogTitle>
      <DialogDescription>
        Si sales ahora, podrías perder información no guardada.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">
      {/* Cancelar */}
      <Button
        onClick={() => setOpenSalirDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* Confirmar salida */}
      <Button
        onClick={() => {
          setOpenSalirDialog(false);
          router.push("/seguimiento-rector"); // 👈 tu misma ruta del Link original
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    {/* Botones derecha ahora junto al botón salir */}
    {estatusGeneral === "REVISADO" && (
      <>

        {/* BOTÓN REGRESAR AL PASO ANTERIOR */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
<Button
  variant="outline"
  onClick={() => setStep((prev) => Math.max(prev - 1, 1))}
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

        {/* BOTÓN FINALIZAR PROCESO */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={finalizarProceso}
                style={{ backgroundColor: "#FFBF00", color: "white" }}
                className="cursor-pointer hover:brightness-110"
              >
                Finalizar proceso
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Finalizar el proceso</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

      </>
    )}

  </div>
)}

<Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>¿Deseas eliminar este registro?</DialogTitle>
      <DialogDescription>
        Esta acción no se puede deshacer.
      </DialogDescription>
    </DialogHeader>

    <DialogFooter className="flex justify-end gap-3 mt-4">

      {/* CANCELAR */}
      <Button
        onClick={() => setOpenDeleteDialog(false)}
        style={{ backgroundColor: "#db200b", color: "white" }}
        className="hover:brightness-110"
      >
        Cancelar
      </Button>

      {/* CONFIRMAR ELIMINAR */}
      <Button
        onClick={async () => {
          if (!rowToDelete) return;

          await handleDelete(rowToDelete); // 👈 Ejecuta tu lógica que ya tienes
          setOpenDeleteDialog(false);
          setRowToDelete(null);
        }}
        style={{ backgroundColor: "#34e004", color: "white" }}
        className="hover:brightness-110"
      >
        Sí
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </main>
  );
}