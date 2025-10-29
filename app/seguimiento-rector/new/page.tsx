// eslint-disable-next-line
"use client";

import React, { useEffect, useState, Suspense } from "react";
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
    <main className="max-w-7xl mx-auto p-6 space-y-8">
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



export default function Page() {
  return (
    <Suspense fallback={<RectorSkeleton />}>
      <RectorForm />
    </Suspense>
  );
}

function RectorForm() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

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
  const [detalle, setDetalle] = useState<
    {
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
    }[]
  >([]);
  const [detalleGeneral, setDetalleGeneral] = useState<any>(null);

  const [selectedEstatus, setSelectedEstatus] = useState<{ [key: number]: string }>({});
  const [selectedProveedor, setSelectedProveedor] = useState<{ [key: number]: string }>({});
  const [selectedFundamento, setSelectedFundamento] = useState<{ [key: number]: string }>({});
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
  const [form, setForm] = useState<{ fecha_emision?: string; fecha_reunion?: string; hora_reunion?: string }>({});
  // 1️⃣ Cargar servidores públicos por ente
  // ======================================================
  useEffect(() => {
    if (!user?.id_ente) return;
    const fetchServidores = async () => {
      try {
        const sResp = await fetch(
          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=0`);
        const data = await sResp.json();
        setServidores(data.filter((s: any) => s.activo === true || s.estatus === "ACTIVO"));
      } catch (err) {
        console.error("❌ Error cargando servidores:", err);
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

        // Generar fila adjudicada automáticamente solo si el registro sigue vigente
        if (
          ["ADJUDICADO", "DIFERIMIENTO"].includes(d.estatus) &&
          d.id_seguimiento_partida_rubro_proveedor_adjudicado &&
          d.id_seguimiento_partida_rubro_proveedor_adjudicado !== 0
        ) {
          adjudicadosRows.push({
            partida: idPartida,
            rubro: idRubro,
            estatus: d.estatus,
            fundamento: d.id_fundamento,
            importeSinIva: d.importe_ajustado_sin_iva,
            importeTotal: d.importe_ajustado_total,
            id_seguimiento_partida_rubro_proveedor_adjudicado: d.id_seguimiento_partida_rubro_proveedor_adjudicado,
            proveedor: {
              rfc: d.e_rfc_proveedor,
              razon_social: d.razon_social,
              nombre_comercial: d.nombre_comercial,
              persona_juridica: d.persona_juridica,
              correo_electronico: d.correo_electronico,
              entidad_federativa: d.entidad_federativa,
            },
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

        // 🔍 Filtra solo los que siguen vigentes (estatus ADJUDICADO o DIFERIMIENTO)
        const adjudicadosVigentes = adjudicadosUnicos.filter((r) =>
          ["ADJUDICADO", "DIFERIMIENTO"].includes(r.estatus)
        );

        return adjudicadosVigentes;
      });

      setDetalleGeneral(data[0]);
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

    const payload = {
      p_accion: "EDITAR",
      p_r_suplencia_oficio_no: formEl.oficio.value,
      p_r_fecha_emision: form.fecha_emision
        ? form.fecha_emision.split("/").reverse().join("-")
        : null,
      p_r_asunto: formEl.asunto.value,
      p_r_fecha_y_hora_reunion: form.fecha_reunion && form.hora_reunion
      ? `${form.fecha_reunion.split("/").reverse().join("-")}T${form.hora_reunion}:00`
      : null,
      p_r_estatus: estatusGeneral,
      p_r_id_usuario_registra: user?.id || 1,
      p_r_id_servidor_publico_asiste: servidorSeleccionado?.id || null,
      p_r_observaciones: mostrarObservaciones ? observaciones : "",
      p_r_con_observaciones: mostrarObservaciones,
    };

    setIsSaving(true);

    try {
      const res = await fetch(`${API_BASE}/rector/seguimiento-gestion/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al registrar captura");
      }

      toast.success("✅ Captura registrada correctamente");

      // Si el estatus general es "CANCELADO", redirigir
      if (estatusGeneral === "CANCELADO") {
        router.push("/seguimiento-rector");
        return;
      }

      // Redirigir siempre después de guardar
      router.push("/seguimiento-rector");
      // Si no quieres redirigir siempre, comenta la línea anterior y descomenta la siguiente para solo recargar detalle:
      // cargarDetalle(selectedId!);
    } catch (err: any) {
      toast.error("❌ Error al registrar captura");
    } finally {
      setIsSaving(false);
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

    // 🧾 Agregar registro a la grilla inferior (guardar objeto proveedor completo)
    setRubroProveedorRows((prev) => [
      ...prev,
      {
        partida: selectedPartidaId,
        rubro: idRubro,
        proveedor: prov, // guardar objeto completo del proveedor
        estatus,
        fundamento: fundamentoId,
        importeSinIva: importe?.sinIva ?? 0,
        importeTotal: importe?.total ?? 0,
      },
    ]);

    // 🧹 Limpiar campos del formulario de "Seleccionar estatus proveedor"
    setSelectedPartidaId(null);
    setSelectedRubroId(null);
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

    // Recargar detalle visual
    cargarDetalle(selectedId);
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

  // Nueva función para guardar fila en la tabla inferior (con validación visual)
  const handleGuardar = () => {
    // Validar campos obligatorios
    const errors: { [key: string]: boolean } = {};
    if (!selectedRubroId) errors.rubro = true;
    if (!selectedProveedorLocal) errors.proveedor = true;
    if (!estatusLocal) errors.estatus = true;
    if (["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal) && !selectedFundamento[selectedRubroId ?? 0]) {
      errors.fundamento = true;
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

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      {detalleGeneral && (
        <Card className="border shadow-sm bg-gray-50">
          <CardHeader className="flex flex-row items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => router.push("/seguimiento-rector")}
              className="rounded-md shadow-sm cursor-pointer"
            >
              <span className="text-lg">←</span>
            </Button>
            <CardTitle className="text-gray-700 text-lg">
              Detalle del Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-800 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
            <div>
              <strong>ID:</strong> {selectedId}
            </div>
            <div>
              <strong>Ente:</strong> {detalleGeneral.ente}
            </div>
            <div>
              <strong>Tipo de Licitación:</strong> {detalleGeneral.e_tipo_licitacion}
            </div>
            <div className="mt-[-19px]">
              <strong>No. de veces:</strong>{" "}
              {detalleGeneral.e_tipo_licitacion_no_veces
                ? `${detalleGeneral.tipo_licitacion_no_veces_descripcion || ""}`
                : "—"}
            </div>
            <div>
              <strong>Tipo de Evento:</strong> {detalleGeneral.e_tipo_evento}
            </div>
            <div>
              <strong>Estatus actual:</strong> {detalleGeneral.r_estatus}
            </div>
            <div className="mt-[-19px]">
              <strong>Fecha de reunión:</strong> {detalleGeneral.e_fecha_y_hora_reunion || "Sin definir"}
            </div>
          </CardContent>
        </Card>
      )}
      {/* ================= CARD 1: FORMULARIO PRINCIPAL ================= */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>Gestión del Rector</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Primera fila: Oficio, Fecha de Emisión, Fecha Reunión, Hora Reunión, Estatus General (NUEVO DISEÑO) */}
            <div className="flex flex-wrap items-end justify-between gap-6">
              {/* Oficio */}
              <div className="flex flex-col min-w-[160px]">
                <Label className="text-gray-700 font-medium">Oficio</Label>
                <Input name="oficio" placeholder="Número de oficio" className="w-[180px] shadow-sm" />
              </div>

              {/* Fecha de Emisión */}
              <div className="flex flex-col min-w-[140px]">
                <Label className="text-gray-700 font-medium">Fecha de Emisión</Label>
                <Input
                  value={form.fecha_emision ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, fecha_emision: formatDateDDMMYYYY(e.target.value) })
                  }
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  name="fecha_emision"
                  className={`w-[140px] shadow-sm ${errores.fecha_emision ? "border-red-500" : ""}`}
                />
              </div>

              {/* Fecha reunión */}
              <div className="flex flex-col min-w-[140px]">
                <Label className="text-gray-700 font-medium">Fecha reunión</Label>
                <Input
                  value={form.fecha_reunion ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, fecha_reunion: formatDateDDMMYYYY(e.target.value) })
                  }
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  name="fecha_reunion_fecha"
                  className={`w-[140px] shadow-sm ${errores.fecha_reunion ? "border-red-500" : ""}`}
                />
              </div>

              {/* Hora reunión */}
              <div className="flex flex-col min-w-[100px]">
                <Label className="text-gray-700 font-medium">Hora (24 Hrs)</Label>
                <Input
                  value={form.hora_reunion ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, hora_reunion: formatTimeHHMM(e.target.value) })
                  }
                  placeholder="HH:MM"
                  maxLength={5}
                  name="fecha_reunion_hora"
                  className={`w-[100px] shadow-sm ${errores.hora_reunion ? "border-red-500" : ""}`}
                />
              </div>

              {/* Estatus General */}
              <div className="flex flex-col justify-end min-w-[300px]">
                <Label className="mb-1 text-gray-700 font-medium">Estatus General</Label>
                <RadioGroup
                  value={estatusGeneral}
                  onValueChange={(val: string) => {
                    setEstatusGeneral(val);
                    if (val !== "REVISADO") {
                      setMostrarObservaciones(false);
                    }
                  }}
                  className="flex flex-row gap-6 items-center bg-gray-50 px-3 py-2 rounded-md border border-gray-200 shadow-sm"
                  name="estatus"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="REVISADO" id="estatus-revisado" />
                    <Label htmlFor="estatus-revisado" className="cursor-pointer text-sm font-medium">REVISADO</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="CANCELADO" id="estatus-cancelado" />
                    <Label htmlFor="estatus-cancelado" className="cursor-pointer text-sm font-medium">CANCELADO</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ADJUDICADO" id="estatus-adjudicado" />
                    <Label htmlFor="estatus-adjudicado" className="cursor-pointer text-sm font-medium">ADJUDICADO</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            {/* Observaciones/Motivo de cancelación según estatus */}
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
                <Label htmlFor="observacionesCancelado">Motivo de cancelación</Label>
                <textarea
                  id="observacionesCancelado"
                  name="observacionesCancelado"
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
            {/* Asunto */}
            <div>
              <Label>Asunto</Label>
              <textarea
                name="asunto"
                placeholder="Escribe el asunto..."
                className="w-full border rounded-md p-2 resize-none"
                rows={2}
              />
            </div>
            {/* Servidor público (con Command) */}
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
            </div>
            {/* Botón Guardar Captura eliminado */}
          </form>
        </CardContent>
      </Card>

      {/* ================= CARD 2: DETALLE NUEVO DISEÑO (Accordion por partida) ================= */}
      {estatusGeneral !== "CANCELADO" && (
        <Card className="shadow-md border">
          <CardHeader>
            <CardTitle>Seleccionar proceso de adjudicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="single" collapsible className="w-full">
              {detalle.map((p) => (
                <AccordionItem key={p.id_partida} value={`partida-${p.id_partida}`}>
                  <AccordionTrigger className="flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors">
                    <span>{`#${p.id_partida} — ${p.partida}`}</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 transition-all duration-300 ease-in-out">
                    {/* Select Rubro (filtrado por partida) */}
                    <div>
                      <Label>Rubro</Label>
                      <Select
                        value={selectedRubroId != null ? String(selectedRubroId) : ""}
                        onValueChange={(val) => {
                          const id = Number(val);
                          setSelectedPartidaId(p.id_partida);
                          setSelectedRubroId(id);
                          setSelectedProveedorLocal("");
                          setSelectedProveedor((prev) => ({ ...prev, [id]: "" }));
                          setEstatusLocal("");
                          // Al cambiar el campo, quitar error si estaba
                          setValidationErrors((prev) => ({ ...prev, rubro: false }));
                        }}
                      >
                        <SelectTrigger className={`${validationErrors.rubro ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Selecciona rubro">
                            {(() => {
                              if (!selectedRubroId) return "Selecciona rubro";
                              const rubro = p.rubros.find((r) => Number(r.id_rubro) === Number(selectedRubroId));
                              return rubro ? `#${rubro.id_rubro} — ${rubro.rubro}` : "Selecciona rubro";
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-50" position="popper">
                          {p.rubros.map((r) => (
                            <SelectItem key={String(r.id_rubro)} value={String(r.id_rubro)}>
                              {`#${r.id_rubro} — ${r.rubro}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.rubro && <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>}
                    </div>

                    {/* Select Proveedor (filtrado por rubro seleccionado) */}
                    <div>
                      <Label>Proveedor A Adjudicar </Label>
                      <Select
                        value={String(selectedProveedorLocal)}
                        onValueChange={(val) => {
                          setSelectedProveedorLocal(val);
                          if (selectedRubroId != null) {
                            setSelectedProveedor((prev) => ({ ...prev, [selectedRubroId]: val }));
                          }
                          setValidationErrors((prev) => ({ ...prev, proveedor: false }));
                        }}
                        disabled={!selectedRubroId}
                      >
                        <SelectTrigger className={`${validationErrors.proveedor ? "border-red-500" : ""}`}>
                          <SelectValue placeholder={selectedRubroId ? "Selecciona proveedor" : "Primero selecciona rubro"} />
                        </SelectTrigger>
                        <SelectContent className="z-50" position="popper">
                          {(() => {
                            if (!selectedRubroId) return null;
                            // Encuentra el rubro seleccionado dentro de la partida actual
                            const rubroSel = p.rubros.find((r) => Number(r.id_rubro) === Number(selectedRubroId));
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
                      {validationErrors.proveedor && <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>}
                    </div>

                    {/* Primera fila: Estatus y Fundamento */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div>
                        <Label>Estatus</Label>
                        <Select
                          value={estatusLocal}
                          onValueChange={(val) => {
                            setEstatusLocal(val);
                            if (selectedRubroId != null) {
                              setSelectedEstatus((prev) => ({ ...prev, [selectedRubroId]: val }));
                            }
                            setValidationErrors((prev) => ({ ...prev, estatus: false }));
                          }}
                        >
                          <SelectTrigger className={`${validationErrors.estatus ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Selecciona estatus" />
                          </SelectTrigger>
                          <SelectContent>
                            {estatusOptions.map((e) => (
                              <SelectItem key={e} value={e}>{e}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.estatus && <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>}
                      </div>
                      <div>
                        <Label>Fundamento</Label>
                        <Select
                          value={selectedRubroId != null ? (selectedFundamento[selectedRubroId] ?? "") : ""}
                          onValueChange={(val) => {
                            if (selectedRubroId != null) {
                              setSelectedFundamento((prev) => ({ ...prev, [selectedRubroId]: val }));
                            }
                            setValidationErrors((prev) => ({ ...prev, fundamento: false }));
                          }}
                          disabled={!["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)}
                        >
                          <SelectTrigger className={`${validationErrors.fundamento ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Selecciona fundamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {fundamentos.length > 0 ? (
                              fundamentos.map((f: any) => (
                                <SelectItem key={f.id} value={f.id.toString()}>
                                  {f.descripcion}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem disabled value="no_fundamentos">No hay fundamentos</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {validationErrors.fundamento && <p className="text-red-600 text-xs mt-1">Campo obligatorio</p>}
                      </div>
                    </div>
                    {/* Segunda fila: Montos */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
                      {/* Monto del rubro */}
                      <div>
                        <Label>Monto del rubro</Label>
                        <Input
                          disabled
                          value={
                            selectedRubroId
                              ? (() => {
                                  const rubro = p.rubros.find(
                                    (r) => Number(r.id_rubro) === Number(selectedRubroId)
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
                      {/* Importe cotizado */}
                      <div>
                        <Label>Importe cotizado</Label>
                        <Input
                          disabled
                          value={
                            (() => {
                              if (!selectedRubroId || !selectedProveedorLocal) return "";
                              const rubro = p.rubros.find((r) => Number(r.id_rubro) === Number(selectedRubroId));
                              const proveedor = rubro?.proveedores.find(
                                (prov) =>
                                  prov.id?.toString() === selectedProveedorLocal ||
                                  prov.rfc === selectedProveedorLocal
                              );
                              return proveedor ? formatMXN(proveedor.importeSinIvaOriginal) : "";
                            })()
                          }
                          className="bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                      {/* Importe cotizado con IVA */}
                      <div>
                        <Label>Importe cotizado con IVA</Label>
                        <Input
                          disabled
                          value={
                            (() => {
                              if (!selectedRubroId || !selectedProveedorLocal) return "";
                              const rubro = p.rubros.find((r) => Number(r.id_rubro) === Number(selectedRubroId));
                              const proveedor = rubro?.proveedores.find(
                                (prov) =>
                                  prov.id?.toString() === selectedProveedorLocal ||
                                  prov.rfc === selectedProveedorLocal
                              );
                              return proveedor ? formatMXN(proveedor.importeTotalOriginal) : "";
                            })()
                          }
                          className="bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                      </div>
                      {/* Importe ajustado */}
                      <div>
                        <Label>Importe ajustado</Label>
                        <Input
                          disabled={!["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)}
                          value={
                            selectedRubroId != null && importes[selectedRubroId]?.sinIva
                              ? formatMXN(importes[selectedRubroId].sinIva)
                              : ""
                          }
                          onChange={(e) => {
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
                          placeholder="$0.00"
                        />
                      </div>
                      {/* Importe ajustado con IVA */}
                      <div>
                        <Label>Importe ajustado con IVA</Label>
                        <Input
                          disabled
                          className="bg-gray-100 text-gray-700 cursor-not-allowed"
                          value={
                            selectedRubroId != null && importes[selectedRubroId]?.total
                              ? formatMXN(importes[selectedRubroId].total)
                              : ""
                          }
                          placeholder="$0.00"
                        />
                      </div>
                    </div>

                    {/* Botón dinámico con condicionales */}
                    {(() => {
                      const yaAdjudicado = rubroProveedorRows.some(
                        (row) => Number(row.rubro) === Number(selectedRubroId)
                      );
                      return (
                        <Button
                          className="w-full text-white cursor-pointer"
                          style={{ backgroundColor: '#2563eb' }}
                          disabled={yaAdjudicado}
                          onClick={async () => {
                            // Validar campos obligatorios antes de continuar
                            const errors: { [key: string]: boolean } = {};
                            if (!selectedRubroId) errors.rubro = true;
                            if (!selectedProveedorLocal) errors.proveedor = true;
                            if (!estatusLocal) errors.estatus = true;
                            if (["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal) && !selectedFundamento[selectedRubroId ?? 0]) {
                              errors.fundamento = true;
                            }
                            if (Object.keys(errors).length > 0) {
                              setValidationErrors(errors);
                              toast.error("❌ Completa todos los campos obligatorios");
                              return;
                            }
                            if (!p.id_partida || !selectedRubroId || !selectedProveedorLocal) {
                              toast.error("Selecciona partida y rubro/proveedor");
                              return;
                            }
                            const esAdjudicable = ["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal);
                            if (esAdjudicable) {
                              await adjudicarProveedor(selectedRubroId, p.id_partida);
                            } else {
                              setRubroProveedorRows((prev) => [
                                ...prev,
                                {
                                  rubro: selectedRubroId,
                                  proveedor: selectedProveedorLocal,
                                  estatus: estatusLocal,
                                },
                              ]);
                              toast.success("Estatus guardado.");
                            }
                          }}
                        >
                          {yaAdjudicado
                            ? "Ya adjudicado"
                            : ["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)
                            ? "Adjudicar"
                            : "Guardar"}
                        </Button>
                      );
                    })()}

                    {/* Alternador de vista de tabla o card */}
                    <div className="flex justify-end mb-3">
                      <Button
                        variant={tableView === "table" ? "default" : "outline"}
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => setTableView("table")}
                      >
                        Vista Tabla
                      </Button>
                      <Button
                        variant={tableView === "card" ? "default" : "outline"}
                        size="sm"
                        className="ml-2 cursor-pointer"
                        onClick={() => setTableView("card")}
                      >
                        Vista Card
                      </Button>
                    </div>
                    {/* Tabla inferior o cards según vista */}
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
                              .filter((row) => Number(row.partida) === Number(p.id_partida))
                              .map((row, index) => {
                                const partidaObj = detalle.find((partida) => partida.id_partida === Number(row.partida));
                                const rubroObj = detalle.flatMap((pr) => pr.rubros).find((r) => Number(r.id_rubro) === Number(row.rubro));
                                const fundamentoObj = fundamentos.find((fun: any) => Number(fun.id) === Number(row.fundamento));
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="whitespace-normal break-words">
                                      <div>
                                        <strong>Rubro:</strong><br />
                                        {partidaObj
                                          ? `${partidaObj.id_partida} - ${partidaObj.partida} | ${
                                              rubroObj ? `${rubroObj.id_rubro} - ${rubroObj.rubro}` : "—"
                                            }`
                                          : "—"}
                                        <br />
                                        <strong>Proveedor:</strong><br />
                                        {`${row.proveedor?.rfc || ""} ${row.proveedor?.razon_social || ""}`}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {formatMXN(row.importeTotal)}
                                    </TableCell>
                                    <TableCell>{row.estatus || "—"}</TableCell>
                                    <TableCell className="whitespace-normal break-words">
                                      <div><strong>Fundamento:</strong> {fundamentoObj ? fundamentoObj.descripcion : "—"}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button size="sm" variant="outline" className="cursor-pointer">Detalles</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg">
                                          <DialogHeader>
                                            <DialogTitle>Detalles del registro</DialogTitle>
                                            <DialogDescription>Información adjudicada por el rector.</DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-2 text-sm">
                                            <p>
                                              <strong>Proveedor:</strong> {`${row.proveedor?.rfc || ""} ${row.proveedor?.razon_social || ""}`}
                                            </p>
                                            <p>
                                              <strong>Estatus:</strong> {row.estatus || "—"}
                                            </p>
                                            {/* 🔘 Botón para revertir adjudicación */}
                                            <div className="pt-4">
                                              <Button
                                                className="w-full bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                                onClick={async () => {
                                                  const idRegistro = row.id_seguimiento_partida_rubro_proveedor_adjudicado;
                                                  if (!idRegistro) {
                                                    toast.error("❌ No se encontró el ID de adjudicación para este registro");
                                                    return;
                                                  }

                                                  const confirmar = confirm("¿Seguro que deseas deshacer esta adjudicación?");
                                                  if (!confirmar) return;

                                                  try {
                                                    const res = await fetch(`${API_BASE}/rector/seg-partida-rubro-proveedor-deshacer/`, {
                                                      method: "POST",
                                                      headers: { "Content-Type": "application/json" },
                                                      body: JSON.stringify({ p_id: idRegistro }),
                                                    });

                                                    const data = await res.json();

                                                    if (!res.ok) {
                                                      throw new Error(data?.detail || "Error al revertir adjudicación");
                                                    }

                                                    if (data.resultado === 1) {
                                                      toast.success("✅ Adjudicación revertida correctamente");
                                                      (document.activeElement as HTMLElement | null)?.blur();
                                                      // 🔽 Quita SOLO el registro revertido de la tabla local
                                                      setRubroProveedorRows((prev) =>
                                                        prev.filter(
                                                          (r) =>
                                                            r.id_seguimiento_partida_rubro_proveedor_adjudicado !== idRegistro
                                                        )
                                                      );

                                                      // ⚙️ Actualiza el estatus visualmente
                                                      setDetalle((prev) =>
                                                        prev.map((partida) => ({
                                                          ...partida,
                                                          rubros: partida.rubros.map((rubro) => ({
                                                            ...rubro,
                                                            proveedores: rubro.proveedores.map((prov) => ({
                                                              ...prov,
                                                              estatus:
                                                                prov.id === idRegistro ? "PENDIENTE" : prov.estatus,
                                                            })),
                                                          })),
                                                        }))
                                                      );
                                                    } else {
                                                      toast.warning("⚠️ No se encontró ninguna adjudicación para revertir");
                                                    }
                                                  } catch (err: any) {
                                                    console.error("❌ Error al deshacer adjudicación:", err);
                                                    toast.error("Error al intentar revertir la adjudicación");
                                                  }
                                                }}
                                              >
                                                Deshacer adjudicación
                                              </Button>
                                            </div>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {rubroProveedorRows
                          .filter((row) => Number(row.partida) === Number(p.id_partida))
                          .map((row, index) => {
                            const partidaObj = detalle.find((partida) => partida.id_partida === Number(row.partida));
                            const rubroObj = detalle.flatMap((pr) => pr.rubros).find((r) => Number(r.id_rubro) === Number(row.rubro));
                            const fundamentoObj = fundamentos.find((fun: any) => Number(fun.id) === Number(row.fundamento));
                            return (
                              <Card key={index} className="border shadow-sm bg-gray-50 p-4">
                                <p><strong>Rubro:</strong><br />{partidaObj ? `${partidaObj.id_partida} - ${partidaObj.partida} | ${rubroObj ? `${rubroObj.id_rubro} - ${rubroObj.rubro}` : "—"}` : "—"}</p>
                                <p><strong>Proveedor:</strong> {`${row.proveedor?.rfc || ""} ${row.proveedor?.razon_social || ""}`}</p>
                                <p><strong>Monto IVA:</strong> {formatMXN(row.importeTotal)}</p>
                                <p><strong>Estatus:</strong> {row.estatus || "—"}</p>
                                <p><strong>Fundamento:</strong><br />{fundamentoObj ? fundamentoObj.descripcion : "—"}</p>
                              </Card>
                            );
                          })}
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
      {/* ================= BOTÓN FINALIZAR ================= */}
      <div className="mt-6">
        <Button
          onClick={(e) => {
            // Ejecutar handleSubmit y redirigir al finalizar
            // Creamos un evento falso para llamar handleSubmit
            // Si el form está referenciado, podemos hacer submit programático
            // Pero aquí reutilizamos la lógica
            // handleSubmit espera un evento de formulario, así que creamos uno
            // Pero como handleSubmit ya hace el push, solo lo llamamos
            // 
            // Simulamos un evento de formulario: buscamos el form del Card principal
            const formEl = document.querySelector('form');
            if (formEl) {
              // @ts-ignore
              formEl.requestSubmit ? formEl.requestSubmit() : formEl.submit();
            }
          }}
          className="w-full text-white cursor-pointer"
          style={{ backgroundColor: '#db200b' }}
          onMouseOver={e => (e.currentTarget.style.backgroundColor='#b81a09')}
          onMouseOut={e => (e.currentTarget.style.backgroundColor='#db200b')}
        >
          Finalizar
        </Button>
      </div>
    </main>
  );
}