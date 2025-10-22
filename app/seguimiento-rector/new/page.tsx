"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
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
        proveedores: { id: number; rfc: string; nombre: string }[];
      }[];
    }[]
  >([]);
  const [detalleGeneral, setDetalleGeneral] = useState<any>(null);

  const [selectedEstatus, setSelectedEstatus] = useState<{ [key: number]: string }>({});
  const [selectedProveedor, setSelectedProveedor] = useState<{ [key: number]: string }>({});
  const [selectedFundamento, setSelectedFundamento] = useState<{ [key: number]: string }>({});
  // Estado para importes ajustados
  const [importes, setImportes] = useState<{ [key: number]: { sinIva: number; total: number } }>({});

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
      const res = await fetch(`${API_BASE}/rector/seguimiento-detalle?p_id=${id}`);
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setDetalle([]);
        setDetalleGeneral(null);
        return;
      }

      // ✅ Mapa que agrupa partidas y rubros sin perder registros
      const partidaMap = new Map<number, any>();

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
              const match = p.match(/^\d+\)([A-Z0-9]+)\s(.+)$/);
              const provObj = match
                ? { id: d.id_seguimiento_partida_rubro_proveedor, rfc: match[1], nombre: match[2] }
                : { id: d.id_seguimiento_partida_rubro_proveedor || 0, rfc: "", nombre: p };

              if (!rubroObj.proveedores.some((pr: any) => pr.rfc === provObj.rfc)) {
                rubroObj.proveedores.push(provObj);
              }
            });
        }
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

  if (!proveedorId || !fundamentoId) {
    toast.error("❌ Selecciona proveedor y fundamento");
    return;
  }
  if (!selectedId) {
    toast.error("❌ ID de seguimiento no definido");
    return;
  }
  if (!importe || isNaN(importe.sinIva) || isNaN(importe.total)) {
    toast.error("❌ Ingresa los importes ajustados");
    return;
  }

  // Buscar el objeto del proveedor correcto
  let proveedorDbId: number | null = null;
  let proveedorRfc: string | null = null;

  const partidaObj = detalle.find((p) => p.id_partida === idPartida);
  if (partidaObj) {
    const rubroObj = partidaObj.rubros.find((r) => r.id_rubro === idRubro);
    if (rubroObj && rubroObj.proveedores && rubroObj.proveedores.length > 0) {
      const prov = rubroObj.proveedores.find(
        (p) => p.id?.toString() === proveedorId || p.rfc === proveedorId
      );
      if (prov) {
        proveedorDbId = prov.id;
        proveedorRfc = prov.rfc;
      }
    }
  }

  if (!proveedorDbId) {
    console.warn("⚠️ No se encontró ID real, se buscará por RFC en el detalle completo");

    // Buscar globalmente si no se encontró por id local
    detalle.forEach((partida) => {
      partida.rubros.forEach((rubro) => {
        rubro.proveedores.forEach((prov: any) => {
          if (prov.rfc === proveedorId || prov.rfc === proveedorRfc) {
            proveedorDbId = prov.id;
            proveedorRfc = prov.rfc;
          }
        });
      });
    });
  }

  if (!proveedorDbId) {
    toast.error("❌ No se encontró el proveedor seleccionado en la base de datos");
    return;
  }

  try {
    const payload = {
      p_estatus: selectedEstatus[idRubro],
      p_id_seguimiento_partida_rubro: Number(idRubro),
      p_id_seguimiento_partida_rubro_proveedor: proveedorDbId,
      p_id: null,
      p_importe_ajustado_sin_iva: importe.sinIva,
      p_importe_ajustado_total: importe.total,
      p_id_fundamento: Number(fundamentoId),
    };

    console.log("📦 Payload adjudicarProveedor (corregido):", payload);

    const res = await fetch(`${API_BASE}/rector/seguimiento-gestion-proveedor-adjudicado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Error al adjudicar proveedor");
    }

    toast.success("✅ Proveedor adjudicado correctamente");
    cargarDetalle(selectedId);
  } catch (err: any) {
    console.error("❌ Error adjudicando proveedor:", err);
    toast.error("❌ Error al adjudicar proveedor");
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
            <Button
              type="submit"
              className="w-full bg-green-600 text-white hover:bg-green-700 cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar Captura"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ================= CARD 2: DETALLE ================= */}
      {estatusGeneral !== "CANCELADO" && (
        <Card className="shadow-md border">
          <CardHeader>
            {/* Eliminado el CardTitle duplicado de "Detalle del Seguimiento" */}
          </CardHeader>
          <CardContent>
            {detalle.length === 0 ? (
              <p className="text-gray-500">No hay datos del seguimiento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partida asociada</TableHead>
                    <TableHead>Clave</TableHead>
                    <TableHead>Rubro</TableHead>
                    <TableHead>Estatus</TableHead>
                    {detalle.some((partida) =>
                      partida.rubros.some((rubro) =>
                        ["ADJUDICADO", "DIFERIMIENTO"].includes(selectedEstatus[rubro.id_rubro])
                      )
                    ) && (
                      <>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Fundamento</TableHead>
                        <TableHead>Importe s/IVA</TableHead>
                        <TableHead>Importe total</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalle.map((partida) => (
                    <React.Fragment key={partida.id_partida}>
                      <TableRow className="bg-gray-100">
                        <TableCell colSpan={7} className="font-semibold text-gray-800">
                          Partida #{partida.id_partida} — {partida.partida}
                        </TableCell>
                      </TableRow>
                      {partida.rubros.map((rubro) => (
                        <TableRow key={rubro.id_rubro}>
                          <TableCell></TableCell>
                          <TableCell>{rubro.id_rubro || "—"}</TableCell>
                          <TableCell>{rubro.rubro}</TableCell>
                          <TableCell>
                            <Select
                              value={selectedEstatus[rubro.id_rubro] || ""}
                              onValueChange={(val) =>
                                setSelectedEstatus({
                                  ...selectedEstatus,
                                  [rubro.id_rubro]: val,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona estatus" />
                              </SelectTrigger>
                              <SelectContent>
                                {estatusOptions.map((e) => (
                                  <SelectItem key={e} value={e}>
                                    {e}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>

                          {["ADJUDICADO", "DIFERIMIENTO"].includes(selectedEstatus[rubro.id_rubro]) ? (
                            <>
                              <TableCell>
                                {rubro.proveedores && rubro.proveedores.length > 0 ? (
                                  rubro.proveedores.map((prov: any) => (
                                    <div
                                      key={`${rubro.id_rubro}-${prov.id || prov.rfc}`}
                                      className="flex items-center space-x-2"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          selectedProveedor[rubro.id_rubro] === (prov.id ? prov.id.toString() : prov.rfc)
                                        }
                                        onChange={() => {
                                          const valor = prov.id ? prov.id.toString() : prov.rfc;
                                          setSelectedProveedor({
                                            ...selectedProveedor,
                                            [rubro.id_rubro]: valor,
                                          });
                                          console.log("✅ Proveedor seleccionado:", valor);
                                        }}
                                      />
                                      <span>
                                        {prov.rfc} — {prov.nombre}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-gray-500 italic text-sm">Sin proveedores registrados</p>
                                )}
                              </TableCell>
                              <TableCell>
                                {rubro.monto !== undefined && rubro.monto !== null
                                  ? `$${Number(rubro.monto).toLocaleString()}`
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Select
                                  onValueChange={(val) =>
                                    setSelectedFundamento({
                                      ...selectedFundamento,
                                      [rubro.id_rubro]: val,
                                    })
                                  }
                                  value={selectedFundamento[rubro.id_rubro]}
                                >
                                  <SelectTrigger>
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
                                      <SelectItem disabled value="">
                                        No hay fundamentos disponibles
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="align-middle">
                                <div className="flex items-center gap-3">
                                  {/* Importe sin IVA */}
                                  <div className="flex flex-col w-[180px]">
                                    <Label className="block mb-1 text-sm text-center"></Label>
                                    <Input
                                      value={
                                        importes[rubro.id_rubro]?.sinIva
                                          ? `$${Number(importes[rubro.id_rubro].sinIva).toLocaleString("es-MX")}`
                                          : ""
                                      }
                                      onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, "");
                                        const amount = digits ? parseInt(digits, 10) : 0;

                                        setImportes((prev) => ({
                                          ...prev,
                                          [rubro.id_rubro]: {
                                            sinIva: digits ? amount : 0,
                                            total: digits ? parseFloat((amount * 1.16).toFixed(2)) : 0,
                                          },
                                        }));
                                      }}
                                      placeholder="$0.00"
                                      inputMode="numeric"
                                      className="text-right"
                                    />
                                  </div>

                                  {/* Importe total con IVA */}
                                  <div className="flex flex-col w-[200px]">
                                    <Label className="block mb-1 text-sm text-center"></Label>
                                    <Input
                                      disabled
                                      className="text-right bg-gray-100 text-gray-700 cursor-not-allowed"
                                      value={
                                        importes[rubro.id_rubro]?.total
                                          ? `$${Number(importes[rubro.id_rubro].total).toLocaleString("es-MX", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}`
                                          : ""
                                      }
                                      placeholder="$0.00"
                                    />
                                  </div>

                                  {/* Botón adjudicar */}
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer self-end mb-1"
                                    type="button"
                                    onClick={() => adjudicarProveedor(rubro.id_rubro, partida.id_partida)}
                                  >
                                    Adjudicar
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <TableCell colSpan={5} className="text-center">
                              <Button
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                                type="button"
                                onClick={() => toast.success(`Guardado para rubro ${rubro.id_rubro}`)}
                              >
                                Guardar
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}