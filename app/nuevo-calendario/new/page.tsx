"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSearchParams, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/* ================================================
   🔹 CONFIG
================================================== */
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

interface Servidor {
  id: number;
  id_ente: number;
  nombre: string;
  cargo: string;
}

/* ================================================
   🔹 STEP INDICATOR
================================================== */
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: "Registro" },
    { id: 2, label: "F. Financiamiento" },
    { id: 3, label: "Fechas" },
  ];

  return (
    <div className="flex flex-col gap-6 w-48">

      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex flex-col items-start">

            {/* 🔵 CÍRCULO + TEXTO */}
            <div className="flex items-center gap-3">

              {/* CÍRCULO */}
              <div
                className={`
                  flex items-center justify-center
                  w-10 h-10 rounded-full font-bold text-sm transition-all

                  /* 🔵 Paso activo */
                  ${
                    isActive
                      ? "bg-[#235391] border-[3px] border-[#235391] text-white scale-110"
                      : ""
                  }

                  /* 🔵 Paso completado (borde grueso azul, fondo claro) */
                  ${
                    isCompleted && !isActive
                      ? "bg-[#235391]/20 border-[3px] border-[#235391] text-[#235391]"
                      : ""
                  }

                  /* ⚪ Paso pendiente */
                  ${
                    !isActive && !isCompleted
                      ? "bg-gray-200 border-[2px] border-gray-300 text-gray-600"
                      : ""
                  }
                `}
              >
                {step.id}
              </div>

              {/* TEXTO */}
              <span
                className={`text-sm font-medium transition-all
                  ${isActive ? "text-[#235391]" : ""}
                  ${isCompleted && !isActive ? "text-[#235391]/80" : ""}
                  ${!isActive && !isCompleted ? "text-gray-600" : ""}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* LÍNEA VERTICAL */}
            {!isLast && (
              <div
                className={`
                  ml-5 h-8 border-l-2 transition-all duration-500
                  ${isCompleted ? "border-[#235391]" : "border-gray-300"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
    MAIN PAGE
   MARCADO PROFESIONAL POR SECCIONES
========================================================= */

export default function NuevoCalendarioPage() {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  /* =========================================================
     PASO 1: ESTADOS / VARIABLES
     Todo lo que pertenece al registro inicial
  ========================================================= */
  const [enteDescripcion, setEnteDescripcion] = useState("");
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [mostrarServidores, setMostrarServidores] = useState(false);
  const [servidorSeleccionado, setServidorSeleccionado] = useState<any>(null);
  const [cargoServidor, setCargoServidor] = useState("");
  const [dialogVerServidores, setDialogVerServidores] = useState(false);
  const [dialogNuevoServidor, setDialogNuevoServidor] = useState(false);
  const [nuevoServidorNombre, setNuevoServidorNombre] = useState("");
  const [nuevoServidorCargo, setNuevoServidorCargo] = useState("");
  const [acuerdo, setAcuerdo] = useState("");
  const [tipoEvento, setTipoEvento] = useState("");
  const [tiposEvento, setTiposEvento] = useState<any[]>([]);
const [busquedaSesion, setBusquedaSesion] = useState("");
const [mostrarSesiones, setMostrarSesiones] = useState(false);
const [numerosSesion, setNumerosSesion] = useState<any[]>([]);
const [tiposLicitacion, setTiposLicitacion] = useState<any[]>([]);
const [tipoLicitacion, setTipoLicitacion] = useState("");
const [errorTipoLicitacion, setErrorTipoLicitacion] = useState("");
const [sesionSeleccionada, setSesionSeleccionada] = useState<any>(null);
const [errores, setErrores] = useState({ tipo_licitacion_notas: "" });
const [idCalendario, setIdCalendario] = useState<number | null>(null);
const [openSalirDialog, setOpenSalirDialog] = useState(false);
const router = useRouter();
const params = useSearchParams();


/* Errores específicos del PASO 1 */
const [formErrors, setFormErrors] = useState({
  acuerdo: "",
  servidor: "",
  cargo: "",
  tipoEvento: "",
  tipoLicitacion: "",
  sesion: "",
});

  const id = user?.id;
  const id_ente = Number(user?.id_ente);

  /* ================================================
  CARGA INICIAL DE DATOS NECESARIOS DEL PASO 1
  ================================================== */
  useEffect(() => {
    if (!id_ente) return;

    async function load() {
      try {
        const res = await fetch(
          `${API_BASE}/catalogos/entes?p_id=${id_ente}&p_descripcion=-99`
        );
        const ente = await res.json();
        setEnteDescripcion(ente?.[0]?.descripcion || "—");

        const serv = await fetch(
          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${id_ente}`
        );
        setServidores(await serv.json());

        const te = await fetch(`${API_BASE}/procesos/tipos-evento/`);
        setTiposEvento(await te.json());
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      }

      setLoading(false);
    }

    load();
  }, [id_ente]);

    /* =========================================================
     CARGA DE SESIONES (PASO 1)
  ========================================================= */
useEffect(() => {
  async function loadSesiones() {
    try {
      const res = await fetch(`${API_BASE}/catalogos/sesiones-numeros/`);
      const data = await res.json();

      console.log("SESIONES:", data);

      setNumerosSesion(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error cargando números de sesión:", e);
      setNumerosSesion([]);
    }
  }

  loadSesiones();
}, []);

  /* =========================================================
    CARGAR AUXILIARES (TIPOS DE LICITACIÓN) (PASO 1)
  ========================================================= */
async function cargarAuxiliares(tipoEventoSeleccionado: string) {
  try {
    const res = await fetch(
      `${API_BASE}/catalogos/auxiliares?p_tipo=${encodeURIComponent(tipoEventoSeleccionado)}`
    );
    const data = await res.json();

    if (Array.isArray(data)) {
      setTiposLicitacion(data);
    } else {
      setTiposLicitacion([]);
    }

    setTipoLicitacion(""); // reinicia selección
  } catch (error) {
    console.error("Error cargando auxiliares:", error);
    setTiposLicitacion([]);
  }
}

  if (userLoading) return <p className="p-6">Cargando usuario…</p>;
  if (!user) return <p className="p-6">No hay usuario autenticado</p>;
  if (loading) return <p className="p-6">Cargando…</p>;

  /* =========================================================
    HANDLER PRINCIPAL DEL PASO 1: CREAR CALENDARIO
  ========================================================= */
  async function crearCalendario() {

  // VALIDACIÓN DE CAMPOS (PEGAR AQUÍ)
  const newErrors: any = {};

  if (!acuerdo.trim()) newErrors.acuerdo = "Este campo es obligatorio";
  if (!servidorSeleccionado) newErrors.servidor = "Este campo es obligatorio";
  if (!cargoServidor.trim()) {
    newErrors.cargo = "Este campo es obligatorio";
  }
  if (!tipoEvento) newErrors.tipoEvento = "Este campo es obligatorio";
  if (!tipoLicitacion) newErrors.tipoLicitacion = "Este campo es obligatorio";
  if (!sesionSeleccionada) newErrors.sesion = "Este campo es obligatorio";

  // Si hay errores → marcarlos y NO continuar
  if (Object.keys(newErrors).length > 0) {
    setFormErrors(newErrors);
    toast.error("Por favor complete los campos requeridos.");
    return;
  }

  // Si NO hay errores → limpiar mensajes
  setFormErrors({
  acuerdo: "",
  servidor: "",
  cargo: "",
  tipoEvento: "",
  tipoLicitacion: "",
  sesion: "",
});
  
    console.log("📤 Payload enviado al backend:", JSON.stringify({
      p_accion: "NUEVO",
      p_id: 0,
      p_acuerdo_o_numero_licitacion: acuerdo,
      p_id_ente: String(id_ente),
      p_id_servidor_publico: servidorSeleccionado?.id,
      p_servidor_publico_cargo: servidorSeleccionado?.cargo,
      p_tipo_licitacion: tipoLicitacion,
      p_tipo_licitacion_no_veces: sesionSeleccionada?.id ?? 0,
      p_tipo_evento: tipoEvento,
      p_id_usuario_registra: id,
    }, null, 2));

    // Payload del Paso 1
    const body = {
      p_accion: "NUEVO",
      p_id: 0,
      p_acuerdo_o_numero_licitacion: acuerdo,
      p_id_ente: String(id_ente),
      p_id_servidor_publico: servidorSeleccionado.id,
      p_servidor_publico_cargo: servidorSeleccionado.cargo,
      p_tipo_licitacion: tipoLicitacion,
      p_tipo_licitacion_no_veces: sesionSeleccionada?.id ?? 0,
      p_tipo_evento: tipoEvento,
      p_id_usuario_registra: id,
    };


    const r = await fetch(`${API_BASE}/procesos/calendario/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const rawText = await r.text();
    console.log("📥 Respuesta RAW del backend:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ Error al parsear JSON:", rawText);
      toast.error("Respuesta inválida del servidor");
      return;
    }

    console.log("📥 Respuesta JSON:", data);

    if (data?.resultado) {
    toast.success("Calendario creado correctamente");
    setIdCalendario(Number(data.id ?? data.resultado));
    setStep(2); // Avanzar al paso 2
    return;
    }

    toast.error("Error al crear calendario");
  }

    /* =========================================================
     UI DEL PASO 1 (REGISTRO)
     COMPLETAMENTE MARCADA
  ========================================================= */

// Paso 1: Crear calendario
return (
  <div className="bg-white min-h-screen">
    <div className="p-4 max-w-6xl mx-auto">

      {/* 🟦 CONTENEDOR PRINCIPAL: STEPPER + CARD */}
      <div className="flex gap-10 items-start">

        {/* 📌 STEPPER FUERA DEL CARD */}
        <div className="w-56">
          <StepIndicator currentStep={step} />
        </div>

        {/* 📌 COLUMNA DERECHA */}
        <div className="flex-1">

          {/* --- BOTÓN SALIR (ARRIBA DEL TÍTULO) --- */}
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
                  >
                    Cancelar
                  </Button>

                  <Button
                    onClick={() => {
                      const from = params.get("from");
                      router.push(from === "dashboard" ? "/dashboard" : "/nuevo-calendario/");
                    }}
                    style={{ backgroundColor: "#34e004", color: "white" }}
                  >
                    Sí
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {step === 1 && (
          <>
          {/* 📌 CARD A LA DERECHA */}
          <Card className="pt-4 pb-6 px-4 shadow-md border rounded-xl flex-1">

          <CardContent>

            {/* ENCABEZADO: Título + Botón Paso 2 */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Paso 1: Crear calendario</h1>

              {/* Botón Paso 2 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={crearCalendario}
                      className="bg-[#235391] hover:bg-[#1e3a8a] transition-transform hover:scale-105 rounded-full px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">2</span>
                        <span className="text-white font-bold">→</span>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Avanzar al siguiente paso</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* ENTE */}
            <div className="mb-4">
              <Label>Ente</Label>
              <Input value={enteDescripcion} disabled className="bg-gray-100" />
            </div>

            {/* PRESIDENTE */}
            <div className="mb-6">
              <Label>Presidente(a) del subcomité de compras</Label>

              <Command>
                <CommandInput
                  placeholder="Buscar servidor…"
                  value={busquedaServidor}
                  className={`${formErrors.servidor ? "border border-red-500" : ""}`}
                  onValueChange={(v) => {
                    setFormErrors((prev) => ({ ...prev, servidor: "" }));
                    setBusquedaServidor(v);

                    if (v.trim() === "") {
                      setServidorSeleccionado(null);
                      setCargoServidor("");
                      setMostrarServidores(false);
                      return;
                    }
                    setMostrarServidores(true);
                  }}
                />

                {mostrarServidores && (
                  <CommandList className="max-h-64 overflow-y-auto">
                    {servidores
                      .filter((s) =>
                        `${s.nombre} ${s.cargo}`
                          .toLowerCase()
                          .includes(busquedaServidor.toLowerCase())
                      )
                      .map((s) => (
                        <CommandItem
                          key={s.id}
                        onSelect={() => {
                          setServidorSeleccionado(s);
                          setCargoServidor(s.cargo);

                          // ⚡ LIMPIAR ERRORES DE SERVIDOR Y CARGO AQUÍ
                          setFormErrors(prev => ({
                            ...prev,
                            servidor: "",
                            cargo: "",
                          }));

                          setBusquedaServidor(s.nombre);
                          setMostrarServidores(false);
                        }}
                        >
                          {s.nombre}
                        </CommandItem>
                      ))}
                    <CommandEmpty>No se encontraron servidores</CommandEmpty>
                  </CommandList>
                )}
              </Command>

              <div className="flex gap-4 mt-2">
                <Button variant="outline" onClick={() => setDialogVerServidores(true)}>
                  <Eye className="w-4 h-4" /> Ver servidores
                </Button>

                <Button variant="outline" onClick={() => setDialogNuevoServidor(true)}>
                  <UserPlus className="w-4 h-4" /> Añadir servidor
                </Button>
              </div>
              {formErrors.servidor && (
                <p className="text-red-600 text-xs mt-1">{formErrors.servidor}</p>
              )}
            </div>

            {/* CARGO AUTOPUPULADO */}
            {servidorSeleccionado && (
              <div className="mt-4 mb-6">
                <Label>Cargo</Label>
                <Input
                  value={cargoServidor}
                  onChange={(e) => {
                    setCargoServidor(e.target.value);
                    setFormErrors((prev) => ({ ...prev, cargo: "" }));
                  }}
                  placeholder="Cargo del servidor"
                  className={`${formErrors.cargo ? "border border-red-500" : ""}`}
                />
                {formErrors.cargo && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.cargo}</p>
                )}
              </div>
            )}

            {/* ACUERDO */}
            <div className="mb-6">
              <Label>Acuerdo</Label>
              <Input
                value={acuerdo}
                onChange={(e) => {
                  setAcuerdo(e.target.value);
                  setFormErrors((prev) => ({ ...prev, acuerdo: "" }));
                }}
                placeholder="Ej. AC-2025-DIC-001"
                className={`${formErrors.acuerdo ? "border border-red-500" : ""}`}
              />
              {formErrors.acuerdo && (
                <p className="text-red-600 text-xs mt-1">{formErrors.acuerdo}</p>
              )}
            </div>

            {/* TIPO DE EVENTO + TIPO DE LICITACIÓN */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              {/* TIPO DE EVENTO */}
              <div>
                <Label>Tipo de evento</Label>
                <select
                  className={`border rounded-md p-2 w-full ${formErrors.tipoEvento ? "border-red-500" : ""}`}
                  value={tipoEvento}
                  onChange={async (e) => {
                    setFormErrors((prev) => ({ ...prev, tipoEvento: "" }));
                    const value = e.target.value;
                    setTipoEvento(value);
                    setErrorTipoLicitacion("");

                    if (value) await cargarAuxiliares(value);
                    else setTiposLicitacion([]);
                  }}
                >
                  <option value="">Seleccione…</option>
                  {tiposEvento.map((t) => (
                    <option key={t.id} value={t.descripcion}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
                {formErrors.tipoEvento && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.tipoEvento}</p>
                )}
              </div>

              {/* TIPO DE LICITACIÓN */}
              <div>
                <Label>Tipo de licitación</Label>
                <select
                  className={`border rounded-md p-2 w-full ${formErrors.tipoLicitacion ? "border-red-500" : ""}`}
                  value={tipoLicitacion}
                  onChange={(e) => {
                    setFormErrors((prev) => ({ ...prev, tipoLicitacion: "" }));
                    setTipoLicitacion(e.target.value);
                  }}
                  disabled={!tipoEvento || tiposLicitacion.length === 0}
                >
                  <option value="">
                    {tipoEvento ? "Seleccione…" : "Seleccione un tipo de evento primero"}
                  </option>

                  {tiposLicitacion.map((a) => (
                    <option key={a.id} value={a.valor}>
                      {a.valor}
                    </option>
                  ))}
                </select>
                {formErrors.tipoLicitacion && (
                  <p className="text-red-600 text-xs mt-1">{formErrors.tipoLicitacion}</p>
                )}
              </div>
            </div>

            {/* SESIÓN */}
            <div className="mb-6">
              <Label>Número de sesión</Label>
              <div>
                <Command>
                  <CommandInput
                    placeholder="Escribe para buscar…"
                    value={busquedaSesion}
                    className={`${formErrors.sesion ? "border border-red-500" : ""}`}
                    onValueChange={(val) => {
                      setFormErrors((prev) => ({ ...prev, sesion: "" }));
                      setBusquedaSesion(val);
                      setMostrarSesiones(true);
                    }}
                  />

                  {mostrarSesiones && (
                    <CommandList>
                      {busquedaSesion.trim() !== "" ? (
                        numerosSesion
                          .filter((n) =>
                            (n.descripcion || "")
                              .toLowerCase()
                              .includes(busquedaSesion.toLowerCase())
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
              {formErrors.sesion && (
                <p className="text-red-600 text-xs mt-1">{formErrors.sesion}</p>
              )}
            </div>

            {/* Usuario + Botón avanzar */}
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <Label>Usuario</Label>
                <Input
                  value={user?.nombre || "Cargando..."}
                  disabled
                  className="bg-gray-100 text-gray-700 cursor-not-allowed w-full"
                />
              </div>

              <div className="w-auto flex justify-end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={crearCalendario}
                        className="bg-[#235391] hover:bg-[#1e3a8a] transition-transform hover:scale-105 rounded-full px-4 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">2</span>
                          <span className="text-white font-bold">→</span>
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
        {/* --- BOTÓN SALIR (ABAJO DEL CARD, MISMO ESTILO QUE EL SUPERIOR) --- */}
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
                >
                  Cancelar
                </Button>

                <Button
                  onClick={() => {
                    const from = params.get("from");
                    router.push(from === "dashboard" ? "/dashboard" : "/nuevo-calendario/");
                  }}
                  style={{ backgroundColor: "#34e004", color: "white" }}
                >
                  Sí
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        </>
        )}
        {/* 🔥 RENDER PASO 2 ABAJO DEL PASO 1 */}
        {step === 2 && idCalendario && (
          <div className="mt-2">
            <Paso2FuentesFinanciamiento
              idCalendario={idCalendario}
              idUsuario={user?.id}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          </div>
        )}

        {step === 3 && idCalendario !== null && (
          <div className="mt-2">
            <Paso3Fechas
              idCalendario={idCalendario}
              idUsuario={user?.id ?? 0}
              onBack={() => setStep(2)}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  </div>
);
}

interface FuenteFinanciamiento {
  id: string;
  descripcion: string;
  etiquetado?: string;
  fondo?: string;
  id_ramo?: string;
  ramo?: string;
  clasificacion?: string;
}

interface Paso2Props {
  idCalendario: number;
  idUsuario: number;
  onNext: () => void;
  onBack: () => void;
}

function Paso2FuentesFinanciamiento({ idCalendario, idUsuario, onNext, onBack, }: Paso2Props) {
  const [openSalirDialog, setOpenSalirDialog] = useState(false);
  const [fuentesCatalogo, setFuentesCatalogo] = useState<FuenteFinanciamiento[]>([]);
  const [busquedaFuente, setBusquedaFuente] = useState("");
  const [seleccionFuente, setSeleccionFuente] = useState<FuenteFinanciamiento | null>(null);

  const [fuentesAgregadas, setFuentesAgregadas] = useState<FuenteFinanciamiento[]>([]);
  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [fuenteAEliminar, setFuenteAEliminar] = useState<FuenteFinanciamiento | null>(null);
  const router = useRouter();
  /* ===========================
     Cargar catálogo de fuentes
  ============================*/
  useEffect(() => {
    async function load() {
      const r = await fetch(`${API_BASE}/catalogos/fuentes-financiamiento/?p_id=-99&p_id_ramo=-99`);
      const data = await r.json();
      setFuentesCatalogo(data);
    }
    load();
  }, []);

  /* ===========================
     Añadir fuente
  ============================*/
  async function handleAddFuente() {
    if (!seleccionFuente) {
      toast.error("Seleccione una fuente antes de continuar");
      return;
    }

    const body = {
      p_accion: "NUEVO",
      p_id_calendario: idCalendario,
      p_id_fuente_financiamiento: seleccionFuente.id,
      p_id_usuario_registra: idUsuario,
    };

    const r = await fetch(`${API_BASE}/procesos/calendario/fuentes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!data?.resultado) {
      toast.error("No se pudo agregar la fuente");
      return;
    }

    setFuentesAgregadas((prev) => [...prev, seleccionFuente]);
    setSeleccionFuente(null);
    setBusquedaFuente("");
    toast.success("Fuente agregada al calendario");
  }

/* ===========================
   Eliminar fuente
===========================*/
async function handleEliminarFuente() {
  if (!fuenteAEliminar) return;

  const body = {
    p_accion: "ELIMINAR",
    p_id_calendario: idCalendario,
    p_id_fuente_financiamiento: fuenteAEliminar.id,
    p_id_usuario_registra: idUsuario,
  };

  try {
    const r = await fetch(`${API_BASE}/procesos/calendario/fuentes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    // ❌ Si hubo error en backend
    if (!data?.resultado) {
      toast.error("No se pudo eliminar la fuente");
      return;
    }

    // ✔ Eliminar de la tabla
    setFuentesAgregadas((prev) =>
      prev.filter((f) => f.id !== fuenteAEliminar.id)
    );

    // ✔ Cerrar modal
    setOpenEliminarDialog(false);

    // 🎉 Mostrar toast
    toast.success("Fuente eliminada correctamente");

  } catch (error) {
    console.error("Error eliminando fuente:", error);
    toast.error("Error al eliminar la fuente");
  }
}

  // Paso 2: Fuentes de financiamiento
  return (
    <>
      <Card>
        <CardContent className="space-y-4">

          {/* ENCABEZADO */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#235391] font-bold">← 1</span>
                </Button>
              </TooltipTrigger>

              <TooltipContent side="top">
                <p>Regresar al paso anterior</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
              <h1 className="text-2xl font-bold">Paso 2: Fuentes de financiamiento</h1>
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onNext}
                    className="bg-[#235391] text-white rounded-full px-4 py-2 hover:scale-105"
                  >
                    3 →
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Avanzar al siguiente paso</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* FORMULARIO DE AGREGAR FUENTE */}
          <div>
            <Label>Fuente de financiamiento</Label>

            <Command>
              <CommandInput
                placeholder="Buscar fuente…"
                value={busquedaFuente}
                onValueChange={(val) => {
                  setBusquedaFuente(val);
                  setSeleccionFuente(null); // limpiamos selección si vuelve a escribir
                }}
                className="w-full"
              />

              {Boolean(busquedaFuente.trim()) && !seleccionFuente && (
                <CommandList className="max-h-60 overflow-y-auto border rounded-md bg-white z-50">

                  {fuentesCatalogo
                    .filter((f) => {
                      const q = busquedaFuente.toLowerCase();
                      return (
                        f.id?.toLowerCase().includes(q) ||
                        f.descripcion?.toLowerCase().includes(q) ||
                        f.etiquetado?.toLowerCase().includes(q) ||
                        f.fondo?.toLowerCase().includes(q) ||
                        f.ramo?.toLowerCase().includes(q) ||
                        f.clasificacion?.toLowerCase().includes(q)
                      );
                    })
                    .map((f) => (
                      <CommandItem
                        key={f.id}
                        onSelect={() => {
                          setSeleccionFuente(f);

                          // 🔥 Igual que la funcionalidad que quieres
                          setBusquedaFuente(
                            `${f.id} – Descripción: ${f.descripcion} – Etiquetado: ${f.etiquetado} – Fondo: ${f.fondo}`
                          );
                        }}
                        className="py-2 cursor-pointer"
                      >
                      <span className="text-sm">
                        {f.id} – Descripción: {f.descripcion} – Etiquetado: {f.etiquetado} – Fondo: {f.fondo}
                      </span>
                      </CommandItem>
                    ))}

                  <CommandEmpty>No se encontraron fuentes</CommandEmpty>
                </CommandList>
              )}
            </Command>

            <div className="flex justify-end mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleAddFuente}
                    type="button"
                    style={{ backgroundColor: "#10c706", color: "white" }}
                  >
                    Añadir fuente
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Agrega la fuente seleccionada al calendario</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </div>
          </div>

          {/* TABLA COMPLETA */}
        <div className="overflow-hidden rounded-lg shadow-md border border-gray-200 mt-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase">
                <th className="px-3 py-2 text-center">Fuente Financiamiento</th>
                <th className="px-3 py-2 text-center">Etiquetado</th>
                <th className="px-3 py-2 text-center">Fondo</th>
                <th className="px-3 py-2 text-center">Ramo</th>
                <th className="px-3 py-2 text-center"></th>
              </tr>
            </thead>

            <tbody>
              {fuentesAgregadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-3 text-gray-400">
                    No hay fuentes agregadas
                  </td>
                </tr>
              ) : (
                fuentesAgregadas.map((f) => (
                  <tr key={f.id} className="border-b hover:bg-gray-50">
                   <td className="px-3 py-2 text-center"> {f.id} – {f.descripcion}</td>
                    <td className="px-3 py-2 text-center">{f.etiquetado}</td>
                    <td className="px-3 py-2 text-center">{f.fondo}</td>
                    <td className="px-3 py-2 text-center">{f.ramo}</td>
                    <td className="px-3 py-2 text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={() => {
                            setFuenteAEliminar(f);
                            setOpenEliminarDialog(true);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent side="top">
                        Eliminar fuente
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
         {/* BOTONES DE NAVEGACIÓN INFERIORES */}
        <div className="flex justify-between items-center mt-6">

          {/* Botón regresar */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#235391] font-bold">← 1</span>
                </Button>
              </TooltipTrigger>

              <TooltipContent side="top">
                <p>Regresar al paso anterior</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Botón avanzar */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onNext}
                  className="bg-[#235391] text-white rounded-full px-4 py-2 hover:scale-105"
                >
                  3 →
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Avanzar al siguiente paso</TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>       
        </CardContent>
      </Card>

    {/* BOTÓN SALIR INFERIOR (FUERA DEL CARD, MISMO ESTILO QUE EL SUPERIOR) */}
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
            >
              Cancelar
            </Button>

            <Button
              onClick={() => router.push("/nuevo-calendario")}
              style={{ backgroundColor: "#34e004", color: "white" }}
            >
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

     {/* DIALOG ELIMINAR */}
      <Dialog open={openEliminarDialog} onOpenChange={setOpenEliminarDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Deseas eliminar esta fuente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 mt-6">
            <Button
              className="bg-[#db200b] text-white px-5"
              onClick={() => setOpenEliminarDialog(false)}
            >
              Cancelar
            </Button>

            <Button
              className="bg-[#34e004] text-white px-5"
              onClick={handleEliminarFuente}
            >
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* =========================================================
   PASO 3 — FECHAS DEL CALENDARIO
========================================================= */

interface Paso3Props {
  idCalendario: number;
  idUsuario: number;
  onBack: () => void;
}

/* =============================
   FUNCIONES DE FORMATEO Y VALIDACIÓN
============================= */

// Formatea ddmmaaaa → dd/mm/aaaa
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

// Formatea hhmm → HH:mm
function formatTimeHHMM(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  const hh = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  let out = hh;
  if (mm) out += ":" + mm;
  return out;
}

// Valida fecha dd/mm/aaaa
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

// Valida hora HH:mm
function isValidTimeHHMM(val: string) {
  if (!/^(\d{2}):(\d{2})$/.test(val)) return false;
  const [h, m] = val.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// Convierte fecha/hora a ISO para postgres
function toIsoLocalDateTime(dmy: string, hm: string) {
  const [dd, mm, yyyy] = dmy.split("/");
  return `${yyyy}-${mm}-${dd}T${hm}:00`;
}

function Paso3Fechas({ idCalendario, idUsuario, onBack }: Paso3Props) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [openSalirDialog, setOpenSalirDialog] = useState(false);
  const router = useRouter();
  const [fechasAgregadas, setFechasAgregadas] = useState<
    { fecha: string; hora: string }[]
  >([]);

  const [openEliminarDialog, setOpenEliminarDialog] = useState(false);
  const [fechaAEliminar, setFechaAEliminar] =
    useState<{ fecha: string; hora: string } | null>(null);

  /* ========= FORMATEO DE INPUTS ========= */
  function handleFechaChange(e: any) {
    setFecha(formatDateDDMMYYYY(e.target.value));
  }

  function handleHoraChange(e: any) {
    setHora(formatTimeHHMM(e.target.value));
  }

  /* ========= AÑADIR FECHA ========= */
  async function handleAddFecha() {
    if (!isValidDateDDMMYYYY(fecha)) {
      toast.error("La fecha no es válida.");
      return;
    }
    if (!isValidTimeHHMM(hora)) {
      toast.error("La hora no es válida.");
      return;
    }

    const fechaISO = fecha.split("/").reverse().join("-"); // yyyy-mm-dd
    const horaISO = toIsoLocalDateTime(fecha, hora); // yyyy-mm-ddTHH:mm:ss

    const body = {
      p_accion: "NUEVO",
      p_id_calendario: idCalendario,
      p_fecha: fechaISO,
      p_hora: horaISO,
      p_id_usuario_registra: idUsuario,
    };

    const r = await fetch(`${API_BASE}/procesos/calendario/fechas/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!data?.resultado) {
      toast.error("No se pudo agregar la fecha.");
      return;
    }

    setFechasAgregadas((prev) => [...prev, { fecha, hora }]);
    setFecha("");
    setHora("");
    toast.success("Fecha agregada.");
  }

  /* ========= ELIMINAR FECHA ========= */
  async function handleEliminarFecha() {
    if (!fechaAEliminar) return;

    const fechaISO = fechaAEliminar.fecha.split("/").reverse().join("-");

    const body = {
      p_accion: "ELIMINAR",
      p_id_calendario: idCalendario,
      p_fecha: fechaISO,
      p_hora: null,
      p_id_usuario_registra: idUsuario,
    };

    const r = await fetch(`${API_BASE}/procesos/calendario/fechas/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!data?.resultado) {
      toast.error("No se pudo eliminar la fecha.");
      return;
    }

    setFechasAgregadas((prev) =>
      prev.filter(
        (f) =>
          !(
            f.fecha === fechaAEliminar.fecha &&
            f.hora === fechaAEliminar.hora
          )
      )
    );

    setOpenEliminarDialog(false);
    toast.success("Fecha eliminada.");
  }


  // Paso 3: Fechas de la sesión
  return (
    <>
      <Card className="pt-4 pb-6 px-4 shadow-md border rounded-xl flex-1">
        <CardContent className="space-y-4">
          {/* ENCABEZADO */}
          {/* ENCABEZADO */}
          <div className="flex items-center gap-4 mb-6">

            {/* BOTÓN REGRESAR */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-[#235391] font-bold">← 2</span>
                  </Button>
                </TooltipTrigger>

                <TooltipContent side="top">
                  <p>Regresar al paso anterior</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* BOTÓN FINALIZAR */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      toast.success("Aquí ejecutarías la lógica de finalizar.");
                    }}
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

            {/* TÍTULO ALADO DEL BOTÓN */}
            <h1 className="text-2xl font-bold">
              Paso 3: Fechas de la sesión
            </h1>

          </div>
          {/* FORMULARIO */}
          <div className="flex items-end gap-4 mt-2">

            {/* FECHA */}
            <div className="flex flex-col w-40">
              <Label>Fecha</Label>
              <Input
                value={fecha}
                onChange={handleFechaChange}
                placeholder="dd/mm/aaaa"
                className="h-10"
              />
            </div>

            {/* HORA */}
            <div className="flex flex-col w-32">
              <Label>Hora (24 hrs)</Label>
              <Input
                value={hora}
                onChange={handleHoraChange}
                placeholder="HH:mm"
                className="h-10"
              />
            </div>

            {/* BOTÓN AÑADIR */}
            <div className="pt-[22px]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleAddFecha}
                      type="button"
                      style={{ backgroundColor: "#10c706", color: "white", height: "40px" }}
                    >
                      Añadir fecha
                    </Button>
                  </TooltipTrigger>

                  <TooltipContent side="top">
                    <p>Agrega la fecha seleccionada al calendario</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* TABLA */}
          <div className="overflow-hidden rounded-lg shadow-md border border-gray-200 mt-6">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#1e3a8a] to-[#235391] text-white text-xs uppercase">
                  <th className="px-3 py-2 text-center">Fecha</th>
                  <th className="px-3 py-2 text-center">Hora</th>
                  <th className="px-3 py-2 text-center"></th>
                </tr>
              </thead>

              <tbody>
                {fechasAgregadas.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-3 text-gray-400">
                      No hay fechas agregadas
                    </td>
                  </tr>
                ) : (
                  fechasAgregadas.map((f, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 text-center">
                        {f.fecha}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {f.hora}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                onClick={() => {
                                  setFechaAEliminar(f);
                                  setOpenEliminarDialog(true);
                                }}
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>

                            <TooltipContent side="top">
                              Eliminar fecha
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

         {/* BOTONES INFERIORES (JUNTOS, COMO ARRIBA) */}
<div className="flex items-center gap-4 mt-6">

  {/* Botón regresar */}
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={onBack}
          className="hover:scale-105 transition-transform rounded-full px-4 py-2 border border-[#235391] flex items-center gap-2 cursor-pointer"
        >
          <span className="text-[#235391] font-bold">← 2</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        Regresar al paso anterior
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>

  {/* Botón finalizar */}
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => toast.success("Aquí ejecutarías la lógica de finalizar.")}
          className="text-white hover:scale-105 transition-transform rounded-full px-4 py-2"
          style={{ backgroundColor: "#FFBF00" }}
        >
          Finalizar
        </Button>
      </TooltipTrigger>

      <TooltipContent side="top">
        Finalizar proceso
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>

</CardContent>
</Card>

{/* BOTÓN SALIR INFERIOR (FUERA DEL CARD, MISMO DISEÑO QUE EL SUPERIOR) */}
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

    {/* DIALOG SALIR */}
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
          onClick={() => router.push("/nuevo-calendario")}
          style={{ backgroundColor: "#34e004", color: "white" }}
        >
          Sí
        </Button>
      </DialogFooter>
    </DialogContent>

  </Dialog>
</div>

      {/* DIALOG ELIMINAR */}
      <Dialog open={openEliminarDialog} onOpenChange={setOpenEliminarDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar esta fecha?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-3 mt-6">
            <Button
              className="bg-[#db200b] text-white px-5"
              onClick={() => setOpenEliminarDialog(false)}
            >
              Cancelar
            </Button>

            <Button
              className="bg-[#34e004] text-white px-5"
              onClick={handleEliminarFecha}
            >
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}