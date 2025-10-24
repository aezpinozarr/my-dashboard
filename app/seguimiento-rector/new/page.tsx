"use client";

import React, { useEffect, useState, Suspense } from "react";
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

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Cargando página...</div>}>
      <RectorForm />
    </Suspense>
  );
}

function RectorForm() {
  const { user } = useUser();

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
          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user.id_ente}`
        );
        setServidores(await sResp.json());
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

        // Generar fila adjudicada automáticamente si el registro está adjudicado
        if (
          d.estatus === "ADJUDICADO" &&
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
            index === self.findIndex(r => r.id_seguimiento_partida_rubro_proveedor_adjudicado === row.id_seguimiento_partida_rubro_proveedor_adjudicado)
        );
        return adjudicadosUnicos;
      });

      setDetalleGeneral(data[0]);
      // ✅ Guardar todas las partidas sin filtrar
      setDetalle(Array.from(partidaMap.values()));
    } catch (err) {
      console.error("❌ Error cargando detalle:", err);
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

  // Nueva función para guardar fila en la tabla inferior
  const handleGuardar = () => {
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
              <strong>Ente:</strong> {detalleGeneral.ente}
            </div>
            <div>
              <strong>Clasificación:</strong> {detalleGeneral.ente_clasificacion}
            </div>
            <div>
              <strong>Tipo de Licitación:</strong> {detalleGeneral.e_tipo_licitacion}
            </div>
            <div>
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
            <div>
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
            {/* Primera fila: Oficio, Fecha de Emisión, Fecha y Hora de reunión */}
          <div className="flex flex-wrap gap-4">
            {/* Oficio */}
            <div className="flex-1 min-w-[200px]">
              <Label>Oficio</Label>
              <Input name="oficio" placeholder="Número de oficio" />
            </div>

            {/* Fecha de Emisión */}
            <div className="flex-1 min-w-[200px]">
              <Label>Fecha de Emisión</Label>
              <Input
                value={form.fecha_emision ?? ""}
                onChange={(e) =>
                  setForm({ ...form, fecha_emision: formatDateDDMMYYYY(e.target.value) })
                }
                placeholder="dd/mm/aaaa"
                maxLength={10}
                name="fecha_emision"
                className={`${errores.fecha_emision ? "border-red-500" : ""}`}
              />
              {errores.fecha_emision && (
                <p className="text-red-600 text-xs mt-1">{errores.fecha_emision}</p>
              )}
            </div>

            {/* Fecha y Hora de reunión */}
            <div className="flex-1 min-w-[260px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Fecha reunión</Label>
                  <Input
                    value={form.fecha_reunion ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, fecha_reunion: formatDateDDMMYYYY(e.target.value) })
                    }
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    name="fecha_reunion_fecha"
                    className={`${errores.fecha_reunion ? "border-red-500" : ""}`}
                  />
                  {errores.fecha_reunion && (
                    <p className="text-red-600 text-xs mt-1">{errores.fecha_reunion}</p>
                  )}
                </div>
                <div>
                  <Label>Hora reunión (24 Hrs)</Label>
                  <Input
                    value={form.hora_reunion ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, hora_reunion: formatTimeHHMM(e.target.value) })
                    }
                    placeholder="HH:MM"
                    maxLength={5}
                    name="fecha_reunion_hora"
                    className={`${errores.hora_reunion ? "border-red-500" : ""}`}
                  />
                  {errores.hora_reunion && (
                    <p className="text-red-600 text-xs mt-1">{errores.hora_reunion}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
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
            {/* Estatus General */}
            <div>
              <Label>Estatus General</Label>
              <RadioGroup
                value={estatusGeneral}
                onValueChange={(val: string) => {
                setEstatusGeneral(val);
                if (val !== "REVISADO") {
                  setMostrarObservaciones(false);
                }
              }}
                className="flex flex-row gap-8 mt-2"
                name="estatus"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="REVISADO" id="estatus-revisado" />
                  <Label htmlFor="estatus-revisado" className="cursor-pointer">REVISADO</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="CANCELADO" id="estatus-cancelado" />
                  <Label htmlFor="estatus-cancelado" className="cursor-pointer">CANCELADO</Label>
                </div>
              </RadioGroup>
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
            </div>
            {/* Botón Guardar Captura eliminado */}
          </form>
        </CardContent>
      </Card>

      {/* ================= CARD 2: DETALLE NUEVO DISEÑO ================= */}
      {estatusGeneral !== "CANCELADO" && (
        <Card className="shadow-md border">
          <CardHeader>
            <CardTitle>Seleccionar estatus proveedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Select Partida */}
            <div>
              <Label>Partida</Label>
              <Select
                value={selectedPartidaId?.toString() ?? ""}
                onValueChange={(val) => {
                  const id = parseInt(val, 10);
                  setSelectedPartidaId(id);
                  // reset dependientes
                  setSelectedRubroId(null);
                  setSelectedProveedorLocal("");
                  setEstatusLocal("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecciona partida" /></SelectTrigger>
                <SelectContent>
                  {detalle.map((p) => (
                    <SelectItem key={p.id_partida} value={p.id_partida.toString()}>
                      {`#${p.id_partida} — ${p.partida}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Select Rubro (filtrado por partida) */}
            <div>
              <Label>Rubro</Label>
              <Select
                value={selectedRubroId?.toString() ?? ""}
                onValueChange={(val) => {
                  const id = parseInt(val, 10);
                  setSelectedRubroId(id);
                  // reset proveedor dependiente
                  setSelectedProveedorLocal("");
                  setSelectedProveedor((prev) => ({ ...prev, [id]: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona rubro" />
                </SelectTrigger>
                <SelectContent className="z-50" position="popper">
                  {detalle
                    .filter((p) => (selectedPartidaId ? p.id_partida === selectedPartidaId : false))
                    .flatMap((p) =>
                      p.rubros.map((r) => (
                        <SelectItem key={r.id_rubro} value={r.id_rubro.toString()}>
                          {`Rubro #${r.id_rubro} — ${r.rubro}`}
                        </SelectItem>
                      ))
                    )}
                </SelectContent>
              </Select>
            </div>

            {/* Select Proveedor (filtrado por rubro seleccionado) */}
            <div>
              <Label>Proveedor A Adjudicar </Label>
              <Select
                value={selectedProveedorLocal}
                onValueChange={(val) => {
                  setSelectedProveedorLocal(val);
                  if (selectedRubroId != null) {
                    setSelectedProveedor((prev) => ({ ...prev, [selectedRubroId]: val }));
                  }
                }}
                disabled={!selectedRubroId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedRubroId ? "Selecciona proveedor" : "Primero selecciona rubro"} />
                </SelectTrigger>
                <SelectContent className="z-50" position="popper">
                  {(() => {
                    if (!selectedRubroId) return null;
                    // Encuentra el rubro seleccionado dentro de la partida seleccionada
                    const rubroSel = detalle
                      .filter((p) => (selectedPartidaId ? p.id_partida === selectedPartidaId : false))
                      .flatMap((p) => p.rubros)
                      .find((r) => Number(r.id_rubro) === Number(selectedRubroId));

                    if (!rubroSel || !Array.isArray(rubroSel.proveedores) || rubroSel.proveedores.length === 0) {
                      return (
                        <SelectItem disabled value="__no_providers__">
                          No hay proveedores
                        </SelectItem>
                      );
                    }

                    return rubroSel.proveedores.map((prov) => (
                      <SelectItem
                        key={prov.id ? `prov-${prov.id}` : `prov-${prov.rfc}`}
                        value={(prov.id || prov.rfc).toString()}
                      >
                        {`${prov.rfc} ${prov.nombre}`}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            {/* Estatus, Fundamento y Monto del rubro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estatus</Label>
                <Select
                  value={estatusLocal}
                  onValueChange={(val) => {
                    setEstatusLocal(val);
                    if (selectedRubroId != null) {
                      setSelectedEstatus((prev) => ({ ...prev, [selectedRubroId]: val }));
                    }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona estatus" /></SelectTrigger>
                  <SelectContent>
                    {estatusOptions.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Fundamento</Label>
                <Select
                  value={selectedRubroId != null ? (selectedFundamento[selectedRubroId] ?? "") : ""}
                  onValueChange={(val) => {
                    if (selectedRubroId != null) {
                      setSelectedFundamento((prev) => ({ ...prev, [selectedRubroId]: val }));
                    }
                  }}
                  disabled={!["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona fundamento" /></SelectTrigger>
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
              </div>

              {/* Campo nuevo: monto del rubro */}
              <div>
                <Label>Monto del rubro</Label>
                <Input
                  disabled
                  value={
                    selectedRubroId
                      ? (() => {
                          const rubro = detalle
                            .flatMap((p) => p.rubros)
                            .find(
                              (r) => Number(r.id_rubro) === Number(selectedRubroId)
                            );
                          return rubro
                            ? `$${rubro.monto.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}`
                            : "$—";
                        })()
                      : ""
                  }
                  className="bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Montos originales del proveedor (solo vista) */}
            {selectedRubroId && selectedProveedorLocal && (() => {
              const rubro = detalle
                .flatMap((p) => p.rubros)
                .find((r) => Number(r.id_rubro) === Number(selectedRubroId));
              const proveedor = rubro?.proveedores.find(
                (prov) =>
                  prov.id?.toString() === selectedProveedorLocal ||
                  prov.rfc === selectedProveedorLocal
              );

              if (!proveedor) return null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <Label>Importe original sin IVA (Ente)</Label>
                    <Input
                      disabled
                      value={`$${proveedor.importeSinIvaOriginal.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}`}
                      className="bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label>Importe original con IVA (Ente)</Label>
                    <Input
                      disabled
                      value={`$${proveedor.importeTotalOriginal.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}`}
                      className="bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              );
            })()}
            {/* Importe sin IVA y total (habilitados solo si estatus permite) */}
            <div className="md:col-span-3 flex items-end gap-2">
              <div className="flex-1">
                <Label>Importe sin IVA (Rector)</Label>
                <Input
                  disabled={!["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal)}
                  value={
                    selectedRubroId != null && importes[selectedRubroId]?.sinIva
                      ? `$${importes[selectedRubroId].sinIva.toLocaleString("es-MX")}`
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

              <div className="flex-1">
                <Label>Importe total con IVA (Rector)</Label>
                <Input
                  disabled
                  className="bg-gray-100 text-gray-700 cursor-not-allowed"
                  value={
                    selectedRubroId != null && importes[selectedRubroId]?.total
                      ? `$${importes[selectedRubroId].total.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
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
                    if (!selectedPartidaId || !selectedRubroId || !selectedProveedorLocal) {
                      toast.error("Selecciona partida y rubro/proveedor");
                      return;
                    }

                    const esAdjudicable = ["ADJUDICADO", "DIFERIMIENTO"].includes(estatusLocal);

                    if (esAdjudicable) {
                      await adjudicarProveedor(selectedRubroId, selectedPartidaId);
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

            {/* Tabla inferior */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rubro / Proveedor</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubroProveedorRows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="space-y-1">
                        <p><strong>Rubro:</strong> #{row.rubro}</p>
                        <p><strong>RFC:</strong> {row.proveedor?.rfc || "N/A"}</p>
                        <p><strong>Razón social:</strong> {row.proveedor?.razon_social || "N/A"}</p>
                        <p><strong>Nombre comercial:</strong> {row.proveedor?.nombre_comercial || "N/A"}</p>
                        <p><strong>Persona jurídica:</strong> {row.proveedor?.persona_juridica || "N/A"}</p>
                        <p><strong>Correo:</strong> {row.proveedor?.correo_electronico || "N/A"}</p>
                        <p><strong>Entidad federativa:</strong> {row.proveedor?.entidad_federativa || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {/* Solo Detalles */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Detalles del registro</DialogTitle>
                            <DialogDescription>
                              Información adjudicada por el rector.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Partida:</strong>{" "}
                              {(() => {
                                const partidaObj = detalle.find((p) => p.id_partida === Number(row.partida));
                                return partidaObj ? `#${partidaObj.id_partida} — ${partidaObj.partida}` : row.partida || "—";
                              })()}
                            </p>
                            <p>
                              <strong>Rubro:</strong>{" "}
                              {(() => {
                                const rubroObj = detalle
                                  .flatMap((p) => p.rubros)
                                  .find((r) => Number(r.id_rubro) === Number(row.rubro));
                                return rubroObj ? `#${rubroObj.id_rubro} — ${rubroObj.rubro}` : row.rubro || "—";
                              })()}
                            </p>
                            <p>
                              <strong>Proveedor (RFC):</strong> {row.proveedor?.rfc || "No especificado"}
                            </p>
                            <p>
                              <strong>Estatus:</strong> {row.estatus}
                            </p>
                            <p>
                              <strong>Fundamento:</strong>{" "}
                              {(() => {
                                const f = fundamentos.find(
                                  (fun: any) => Number(fun.id) === Number(row.fundamento)
                                );
                                return f ? f.descripcion : row.fundamento || "N/A";
                              })()}
                            </p>
                            <p>
                              <strong>Importe sin IVA:</strong>{" "}
                              ${row.importeSinIva?.toLocaleString("es-MX") || "0.00"}
                            </p>
                            <p>
                              <strong>Importe total:</strong>{" "}
                              ${row.importeTotal?.toLocaleString("es-MX") || "0.00"}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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