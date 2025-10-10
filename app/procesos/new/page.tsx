"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext";
import { Loader2, PlusCircle } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

/* ============================
   API base
============================ */
const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("railway")
    ? "https://backend-licitacion-production.up.railway.app"
    : "http://127.0.0.1:8000";

/* ============================
   Utilidades
============================ */
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
function isValidDateDDMMYYYY(val: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return false;
  const [ddStr, mmStr, yyyyStr] = val.split("/");
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);
  if (yyyyStr.length !== 4 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const diasMes = [
    31,
    (yyyy % 4 === 0 && (yyyy % 100 !== 0 || yyyy % 400 === 0)) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  return dd <= diasMes[mm - 1];
}
function formatTimeHHMM(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  let out = hh;
  if (mm) out += ":" + mm;
  return out;
}
function isValidTimeHHMM(val: string): boolean {
  if (!/^(\d{2}):(\d{2})$/.test(val)) return false;
  const [h, m] = val.split(":").map(Number);
  return !(h < 0 || h > 23 || m < 0 || m > 59);
}
function toIsoLocalDateTime(dmy: string, hm: string): string {
  const [dd, mm, yyyy] = dmy.split("/");
  return `${yyyy}-${mm}-${dd}T${hm}:00`;
}
function formatCurrency(value: string): string {
  const clean = value.replace(/[^\d]/g, "");
  const num = parseFloat(clean) / 100;
  if (isNaN(num)) return "";
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

/* ============================
   Página principal
============================ */
export default function NuevoProcesoPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = React.useState(1);

  /* ============================
     PASO 1
  ============================ */
  const [loading, setLoading] = React.useState(false);
  const [enteDescripcion, setEnteDescripcion] = React.useState("");
  const [tiposLicitacion, setTiposLicitacion] = React.useState<string[]>([]);
  const [numerosSesion, setNumerosSesion] = React.useState<any[]>([]);
  const [servidores, setServidores] = React.useState<any[]>([]);
  const [busquedaServidor, setBusquedaServidor] = React.useState("");
  const [servidorSeleccionado, setServidorSeleccionado] = React.useState<any>(null);
  const [servidoresFiltrados, setServidoresFiltrados] = React.useState<any[]>([]);

  const [formEnte, setFormEnte] = React.useState({
    e_oficio_invitacion: "",
    e_servidor_publico_cargo: "",
    e_tipo_licitacion: "",
    e_tipo_licitacion_no_veces: "",
    e_tipo_licitacion_notas: "",
    e_fecha: "",
    e_hora: "",
  });

  React.useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const enteResp = await fetch(`${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99`);
        const entesData = await enteResp.json();
        const ente = Array.isArray(entesData)
          ? entesData.find((e: any) => String(e.id) === String(user.id_ente))
          : null;
        setEnteDescripcion(ente?.descripcion || "—");

        const sResp = await fetch(`${API_BASE}/catalogos/servidores-publicos?id_ente=${user.id_ente}`);
        const sData = await sResp.json();
        const normalized = Array.isArray(sData)
          ? sData.map((x: any) => ({
              id: x.id ?? x.value,
              nombre: x.nombre ?? x.label ?? "",
              cargo: x.cargo ?? "",
            }))
          : [];
        setServidores(normalized);
        setServidoresFiltrados(normalized);

        const licResp = await fetch(`${API_BASE}/procesos/tipo-licitacion`);
        setTiposLicitacion(await licResp.json());

        const nResp = await fetch(`${API_BASE}/catalogos/sesiones-numeros`);
        setNumerosSesion(await nResp.json());
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      }
    };
    load();
  }, [user]);

  React.useEffect(() => {
    const term = busquedaServidor.toLowerCase();
    setServidoresFiltrados(
      servidores.filter(
        (s) => s.nombre.toLowerCase().includes(term) || String(s.id).includes(term)
      )
    );
  }, [busquedaServidor, servidores]);

  const handleSubmitEnte = async () => {
    if (!user) return alert("No hay usuario logeado");
    if (!servidorSeleccionado) return alert("Selecciona un servidor público");

    if (!isValidDateDDMMYYYY(formEnte.e_fecha)) return alert("Fecha inválida (dd/mm/aaaa)");
    if (!isValidTimeHHMM(formEnte.e_hora)) return alert("Hora inválida (HH:MM 24h)");

    const fechaHora = toIsoLocalDateTime(formEnte.e_fecha, formEnte.e_hora);
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/ente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: "NUEVO",
          p_e_id_ente: user.id_ente,
          p_e_oficio_invitacion: formEnte.e_oficio_invitacion,
          p_e_id_servidor_publico_emite: Number(servidorSeleccionado.id),
          p_e_servidor_publico_cargo: formEnte.e_servidor_publico_cargo,
          p_e_tipo_licitacion: formEnte.e_tipo_licitacion,
          p_e_tipo_licitacion_no_veces: Number(formEnte.e_tipo_licitacion_no_veces),
          p_e_tipo_licitacion_notas: formEnte.e_tipo_licitacion_notas,
          p_e_fecha_y_hora_reunion: fechaHora,
          p_e_id_usuario_registra: user.id,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Error al guardar");

      localStorage.setItem("id_proceso", data.resultado);
      alert("✅ Paso 1 guardado correctamente");
      setCurrentStep(2);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el paso 1");
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     PASO 2
  ============================ */
  const [partidas, setPartidas] = React.useState<any[]>([]);
  const [rubros, setRubros] = React.useState<any[]>([]);
  const [fuentes, setFuentes] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentStep !== 2) return;
    const loadCatalogos = async () => {
      try {
        const [pRes, rRes, fRes] = await Promise.all([
          fetch(`${API_BASE}/catalogos/partidas/?p_id=-99&p_id_capitulo=-99`),
          fetch(`${API_BASE}/catalogos/rubro?p_id=-99`),
          fetch(`${API_BASE}/catalogos/fuentes-financiamiento/?p_id=-99&p_id_ramo=-99`),
        ]);
        setPartidas(await pRes.json());
        setRubros(await rRes.json());
        setFuentes(await fRes.json());
      } catch (err) {
        console.error("❌ Error cargando catálogos:", err);
      }
    };
    loadCatalogos();
  }, [currentStep]);

  const [listaPartidas, setListaPartidas] = React.useState<any[]>([
    {
      e_no_requisicion: "",
      e_id_partida: "",
      e_id_rubro: "",
      e_id_fuente_financiamiento: "",
      e_monto_presupuesto_suficiencia: "",
    },
  ]);

  const handleNuevaPartida = () =>
    setListaPartidas((prev) => [
      ...prev,
      {
        e_no_requisicion: "",
        e_id_partida: "",
        e_id_rubro: "",
        e_id_fuente_financiamiento: "",
        e_monto_presupuesto_suficiencia: "",
      },
    ]);

  const handleGuardarPaso2 = async () => {
    const idProceso = localStorage.getItem("id_proceso");
    if (!idProceso) return alert("No se encontró el ID del proceso");

    try {
      for (const partida of listaPartidas) {
        const resp = await fetch(`${API_BASE}/procesos/seguimiento/presupuesto-ente/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_accion: "NUEVO",
            p_id_proceso_seguimiento: Number(idProceso),
            p_id: 0,
            p_e_no_requisicion: partida.e_no_requisicion,
            p_e_id_partida: partida.e_id_partida,
            p_e_id_rubro: partida.e_id_rubro,
            p_e_id_fuente_financiamiento: partida.e_id_fuente_financiamiento,
            p_e_monto_presupuesto_suficiencia: Number(
              (partida.e_monto_presupuesto_suficiencia || "").replace(/[^0-9.-]+/g, "")
            ),
          }),
        });

        const data = await resp.json(); // 👈 capturamos respuesta
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error("❌ Error en partida:", errorText);
          throw new Error(`Error al guardar la partida: ${errorText}`);
        }

        // 👇 Guardamos el ID del presupuesto devuelto por el backend
        if (data?.resultado) {
          localStorage.setItem("id_presupuesto", data.resultado);
        }
      }

      alert("✅ Paso 2 guardado correctamente");
      setCurrentStep(3); // ⬅️ Avanzar automáticamente al Paso 3
    } catch (err) {
      console.error("❌ Error al guardar el paso 2:", err);
      alert("Error al guardar el paso 2. Revisa la consola para más detalles.");
    }
  };

  /* ============================
     PASO 3 - PROVEEDOR
  ============================ */
  const [rfcBusqueda, setRfcBusqueda] = React.useState("");
  const [proveedor, setProveedor] = React.useState<any | null>(null);
  const [importeSinIVA, setImporteSinIVA] = React.useState("");
  const [importeTotal, setImporteTotal] = React.useState("");

  const buscarProveedor = async () => {
    if (!rfcBusqueda.trim()) return alert("Ingrese un RFC para buscar");
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor/?p_rfc=${encodeURIComponent(rfcBusqueda)}`);
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        setProveedor(data[0]);
      } else {
        setProveedor(null);
        alert("No se encontró proveedor con ese RFC");
      }
    } catch (err) {
      console.error("❌ Error al buscar proveedor:", err);
    }
  };

  const handleImporteChange = (val: string) => {
    const formatted = formatCurrency(val);
    setImporteSinIVA(formatted);
    const numericValue = Number(val.replace(/[^\d]/g, "")) / 100;
    const total = numericValue * 1.16;
    setImporteTotal(
      isNaN(total)
        ? ""
        : total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
    );
  };

  const handleGuardarProveedor = async () => {
    const idPresupuesto = localStorage.getItem("id_presupuesto"); // ✅ usar ID correcto
    if (!idPresupuesto) return alert("No se encontró el ID del presupuesto");
    if (!proveedor) return alert("Selecciona un proveedor válido");
    if (!importeSinIVA) return alert("Captura el importe sin IVA");

    try {
      const resp = await fetch(`${API_BASE}/procesos/seguimiento/presupuesto-proveedor/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_accion: "NUEVO",
          p_id_proceso_seguimiento_presupuesto: Number(idPresupuesto), // ✅ corregido
          p_e_rfc_proveedor: proveedor.rfc,
          p_e_importe_sin_iva: Number((importeSinIVA || "").replace(/[^0-9.-]+/g, "")),
          p_e_importe_total: Number((importeTotal || "").replace(/[^0-9.-]+/g, "")),
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert("✅ Proveedor guardado correctamente");
      setRfcBusqueda("");
      setProveedor(null);
      setImporteSinIVA("");
      setImporteTotal("");
    } catch (err) {
      console.error("❌ Error al guardar proveedor:", err);
      alert("Error al guardar proveedor");
    }
  };

  /* ============================
     UI
  ============================ */
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" className="cursor-pointer">←</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {currentStep === 1
              ? "Proceso — Paso 1: Datos del Ente"
              : currentStep === 2
              ? "Proceso — Paso 2: Presupuesto del Ente"
              : "Proceso — Paso 3: Proveedores del Presupuesto"}
          </h1>
          <p className="text-gray-600 text-sm">
            {currentStep === 1
              ? "Completa los datos generales del ente antes de continuar."
              : currentStep === 2
              ? "Registra la información presupuestal correspondiente (puedes capturar varias partidas)."
              : "Vincula proveedores y asigna sus importes al proceso."}
          </p>
        </div>
      </div>

      {/* Paso 1 */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="space-y-5 mt-4">
            <div className="grid gap-2 md:grid-cols-2">
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
                value={formEnte.e_oficio_invitacion}
                onChange={(e) => setFormEnte({ ...formEnte, e_oficio_invitacion: e.target.value })}
                placeholder="Ej. OF.123/2025"
              />
            </div>

            <div>
              <Label>Servidor público (emite)</Label>
              <Command className="rounded-md border border-gray-300 shadow-sm bg-white">
                <CommandInput
                  placeholder="Buscar servidor..."
                  value={busquedaServidor}
                  onValueChange={setBusquedaServidor}
                  className="px-3 py-2 text-sm"
                />
                {busquedaServidor.trim() !== "" && (
                  <CommandList className="max-h-56 overflow-y-auto mt-1 border">
                    {servidoresFiltrados.length > 0 ? (
                      servidoresFiltrados.map((s) => (
                        <CommandItem
                          key={s.id}
                          onSelect={() => {
                            setServidorSeleccionado(s);
                            setFormEnte((prev) => ({
                              ...prev,
                              e_servidor_publico_cargo: s.cargo,
                            }));
                            setBusquedaServidor(s.nombre);
                          }}
                        >
                          {s.nombre}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandEmpty>No se encontraron coincidencias</CommandEmpty>
                    )}
                  </CommandList>
                )}
              </Command>
            </div>

            <div>
              <Label>Cargo</Label>
              <Input
                value={formEnte.e_servidor_publico_cargo}
                onChange={(e) =>
                  setFormEnte({ ...formEnte, e_servidor_publico_cargo: e.target.value })
                }
                placeholder="Ej. Directora General"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de licitación</Label>
                <select
                  className="border rounded-md p-2 w-full"
                  value={formEnte.e_tipo_licitacion}
                  onChange={(e) => setFormEnte({ ...formEnte, e_tipo_licitacion: e.target.value })}
                >
                  <option value="">Seleccione…</option>
                  {tiposLicitacion.map((t, i) => (
                    <option key={i} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Número de sesión</Label>
                <select
                  className="border rounded-md p-2 w-full"
                  value={formEnte.e_tipo_licitacion_no_veces}
                  onChange={(e) =>
                    setFormEnte({ ...formEnte, e_tipo_licitacion_no_veces: e.target.value })
                  }
                >
                  <option value="">Seleccione…</option>
                  {numerosSesion.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <Input
                value={formEnte.e_tipo_licitacion_notas}
                onChange={(e) =>
                  setFormEnte({ ...formEnte, e_tipo_licitacion_notas: e.target.value })
                }
                placeholder="Observaciones..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-2">
              <div>
                <Label>Fecha (dd/mm/aaaa)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  value={formEnte.e_fecha}
                  onChange={(e) =>
                    setFormEnte({ ...formEnte, e_fecha: formatDateDDMMYYYY(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Hora (HH:MM 24h)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="HH:MM"
                  maxLength={5}
                  value={formEnte.e_hora}
                  onChange={(e) =>
                    setFormEnte({ ...formEnte, e_hora: formatTimeHHMM(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmitEnte}
                disabled={loading}
                style={{ backgroundColor: "#235391", color: "white" }}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar paso 1"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 2 */}
      {currentStep === 2 && (
        <Card>
          <CardContent className="space-y-6 mt-4">
            {listaPartidas.map((p, i) => {
              const fuenteSel = fuentes.find((f) => f.id === p.e_id_fuente_financiamiento);
              const partidaSel = partidas.find((pt) => pt.id === p.e_id_partida);

              return (
                <div key={i} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <h4 className="font-semibold text-gray-700">Partida #{i + 1}</h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>No. Requisición</Label>
                      <Input
                        value={p.e_no_requisicion}
                        onChange={(e) =>
                          setListaPartidas((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, e_no_requisicion: e.target.value } : x
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Capítulo</Label>
                      <Input
                        value={partidaSel?.capitulo || ""}
                        disabled
                        placeholder="Capítulo"
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Partida</Label>
                      <select
                        className="border rounded-md p-2 w-full"
                        value={p.e_id_partida}
                        onChange={(e) =>
                          setListaPartidas((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, e_id_partida: e.target.value } : x
                            )
                          )
                        }
                      >
                        <option value="">Seleccione…</option>
                        {partidas.map((pt: any) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Fuente de financiamiento</Label>
                      <select
                        className="border rounded-md p-2 w-full"
                        value={p.e_id_fuente_financiamiento}
                        onChange={(e) =>
                          setListaPartidas((prev) =>
                            prev.map((x, idx) =>
                              idx === i ? { ...x, e_id_fuente_financiamiento: e.target.value } : x
                            )
                          )
                        }
                      >
                        <option value="">Seleccione…</option>
                        {fuentes.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rubro ahora ocupa ancho completo */}
                  <div>
                    <Label>Rubro</Label>
                    <select
                      className="border rounded-md p-2 w-full"
                      value={p.e_id_rubro}
                      onChange={(e) =>
                        setListaPartidas((prev) =>
                          prev.map((x, idx) =>
                            idx === i ? { ...x, e_id_rubro: e.target.value } : x
                          )
                        )
                      }
                    >
                      <option value="">Seleccione…</option>
                      {rubros.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.descripcion}
                        </option>
                      ))}
                    </select>
                  </div>

                  {fuenteSel && (
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Descripción</Label>
                        <Input value={fuenteSel.descripcion || ""} disabled className="bg-gray-100" />
                      </div>
                      <div>
                        <Label>Etiquetado</Label>
                        <Input value={fuenteSel.etiquetado || ""} disabled className="bg-gray-100" />
                      </div>
                      <div>
                        <Label>Fondo</Label>
                        <Input value={fuenteSel.fondo || ""} disabled className="bg-gray-100" />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Monto presupuestal</Label>
                    <Input
                      value={p.e_monto_presupuesto_suficiencia}
                      placeholder="$0.00"
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        setListaPartidas((prev) =>
                          prev.map((x, idx) =>
                            idx === i
                              ? { ...x, e_monto_presupuesto_suficiencia: formatted }
                              : x
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between">
              <Button className="bg-green-600 text-white hover:bg-green-700" onClick={handleNuevaPartida}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nueva partida
              </Button>

              <Button
                onClick={handleGuardarPaso2}
                style={{ backgroundColor: "#235391", color: "white" }}
              >
                Guardar paso 2
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paso 3 */}
      {currentStep === 3 && (
        <Card>
          <CardContent className="space-y-6 mt-4">
            <div>
              <Label>RFC del proveedor</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. ABCD123456EF7"
                  value={rfcBusqueda}
                  onChange={(e) => setRfcBusqueda(e.target.value.toUpperCase())}
                />
                <Button onClick={buscarProveedor} className="bg-blue-700 text-white">
                  Buscar
                </Button>
              </div>
            </div>

            {proveedor && (
              <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
                <p><b>RFC:</b> {proveedor.rfc}</p>
                <p><b>Razón social:</b> {proveedor.razon_social}</p>
                <p><b>Nombre comercial:</b> {proveedor.nombre_comercial}</p>
                <p><b>Persona jurídica:</b> {proveedor.persona_juridica}</p>
                <p><b>Correo electrónico:</b> {proveedor.correo_electronico}</p>
                <p><b>Entidad federativa:</b> {proveedor.entidad_federativa}</p>
              </div>
            )}

            <div>
              <Label>Importe sin IVA</Label>
              <Input
                value={importeSinIVA}
                onChange={(e) => handleImporteChange(e.target.value)}
                placeholder="$0.00"
              />
            </div>

            <div>
              <Label>Importe total con IVA (16%)</Label>
              <Input value={importeTotal} disabled className="bg-gray-100" />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleGuardarProveedor}
                style={{ backgroundColor: "#235391", color: "white" }}
              >
                Guardar proveedor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}