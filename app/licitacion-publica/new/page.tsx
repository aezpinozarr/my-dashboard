"use client";
import { Suspense } from "react";

export default function NuevoCalendarioPageWrapper() {
  return (
    <Suspense fallback={<div>Cargando…</div>}>
      <NuevoCalendarioPage />
    </Suspense>
  );
}

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
  DialogTrigger,
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
    { id: 3, label: "Actos" },
  ];

  return (
    <div className="flex flex-col gap-6 w-48">

      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex flex-col items-start">

            {/* CÍRCULO + TEXTO */}
            <div className="flex items-center gap-3">

              {/* CÍRCULO */}
              <div
                className={`
                  flex items-center justify-center
                  w-10 h-10 rounded-full font-bold text-sm transition-all

                  /* Paso activo */
                  ${
                    isActive
                      ? "bg-[#235391] border-[3px] border-[#235391] text-white scale-110"
                      : ""
                  }

                  /* Paso completado (borde grueso azul, fondo claro) */
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

function NuevoCalendarioPage() {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const stepFromURL = searchParams.get("step");
  const idFromURL = searchParams.get("idCalendario");

  // Cuando viene idCalendario en URL → asignarlo al estado
  useEffect(() => {
    if (idFromURL) {
      setIdCalendario(Number(idFromURL));
    }
  }, [idFromURL]);

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
        // Auto-seleccionar "LICITACIÓN PUBLICA"
        const defaultEvento = "LICITACION PUBLICA";
        setTipoEvento(defaultEvento);

        // Cargar automáticamente los auxiliares correspondientes
        cargarAuxiliares(defaultEvento);
      } catch (err) {
        console.error("❌ Error al cargar datos:", err);
      }

      setLoading(false);
    }

    load();
  }, [id_ente]);

// Funciona para cuando damos click en editar paso
useEffect(() => {
  if (!idCalendario) return;           // solo depende del id
  if (servidores.length === 0) return; // ya cargaron
  if (numerosSesion.length === 0) return;

  async function loadCalendario() {
    try {
      const res = await fetch(
        `${API_BASE}/procesos/calendario/consultar?p_id=${idCalendario}&p_id_ente=-99`
      );
      const data = await res.json();
      const cal = data?.calendario?.[0];

      if (!cal) return;

      // Número de licitación
      setAcuerdo(cal.acuerdo_o_numero_licitacion);

      // Servidor público
      const servidor = servidores.find(
        s => Number(s.id) === Number(cal.id_servidor_publico)
      );

      if (servidor) {
        setServidorSeleccionado(servidor);
        setBusquedaServidor(servidor.nombre);
        setCargoServidor(servidor.cargo);
      }

      // Tipo de evento
      setTipoEvento(cal.tipo_evento);

      // Cargar auxiliares según tipo de evento
      await cargarAuxiliares(cal.tipo_evento);

      // Tipo de licitación
      setTipoLicitacion(cal.tipo_licitacion);

      // Sesión
      const sesion = numerosSesion.find(
        s => Number(s.id) === Number(cal.tipo_licitacion_no_veces)
      );

      if (sesion) {
        setSesionSeleccionada(sesion);
        setBusquedaSesion(sesion.descripcion);
      }

      // Ir al paso correcto si viene por URL
      if (stepFromURL) {
        setStep(Number(stepFromURL));
      }
    } catch (err) {
      console.error("❌ Error cargando calendario:", err);
    }
  }

  loadCalendario();
}, [idCalendario, servidores, numerosSesion]);

// Cuando venga ?step=2 o ?step=3 → Ir directo al paso indicado
useEffect(() => {
  if (!stepFromURL) return;

  // Convertir a número
  const stepNumber = Number(stepFromURL);

  // Validar que el calendario ya se cargó
  if (idFromURL && idCalendario) {
    setStep(stepNumber);
  }
}, [stepFromURL, idCalendario]);

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
  // Si ya existe un calendario → NO volverlo a crear
if (idCalendario) {
  editarCalendario();   // 👈 nuevo
} else {
  crearCalendario();
}

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
    toast.success("Licitación creada correctamente");
    setIdCalendario(Number(data.id ?? data.resultado));
    setStep(2); // Avanzar al paso 2
    return;
    }

    toast.error("Error al crear calendario");
  }

  /* =========================================================
  HANDLER PRINCIPAL DEL PASO 1: EDITAR CALENDARIO
  ========================================================= */
  async function editarCalendario() {
  // Validar igual que en creación
  const newErrors: any = {};

  if (!acuerdo.trim()) newErrors.acuerdo = "Este campo es obligatorio";
  if (!servidorSeleccionado) newErrors.servidor = "Este campo es obligatorio";
  if (!cargoServidor.trim()) newErrors.cargo = "Este campo es obligatorio";
  if (!tipoEvento) newErrors.tipoEvento = "Este campo es obligatorio";
  if (!tipoLicitacion) newErrors.tipoLicitacion = "Este campo es obligatorio";
  if (!sesionSeleccionada) newErrors.sesion = "Este campo es obligatorio";

  if (Object.keys(newErrors).length > 0) {
    setFormErrors(newErrors);
    toast.error("Complete los campos requeridos.");
    return;
  }

  // Payload de actualización
  const body = {
    p_accion: "EDITAR",
    p_id: idCalendario,
    p_acuerdo_o_numero_licitacion: acuerdo,
    p_id_ente: Number(id_ente),
    p_id_servidor_publico: servidorSeleccionado.id,
    p_servidor_publico_cargo: servidorSeleccionado.cargo,
    p_tipo_licitacion: tipoLicitacion,
    p_tipo_licitacion_no_veces: sesionSeleccionada.id,
    p_tipo_evento: tipoEvento,
    p_id_usuario_registra: user?.id,
  };

  console.log("📤 Editando calendario:", body);

  const r = await fetch(`${API_BASE}/procesos/calendario/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const raw = await r.text();
  console.log("📥 RAW:", raw);

  let data;
  try { data = JSON.parse(raw); } catch (err) {
    toast.error("Error en la respuesta del servidor");
    return;
  }

  if (data?.resultado) {
    toast.success("Calendario actualizado correctamente");
    setStep(2);
  } else {
    toast.error("No se pudo actualizar el calendario");
  }
}
    /* =========================================================
     UI DEL PASO 1 (REGISTRO)
     COMPLETAMENTE MARCADA
  ========================================================= */

// Paso 1: Crear licitación pública 
return (
  <div className="bg-white min-h-screen">
    <div className="p-4 max-w-6xl mx-auto">

      {/* 🟦 CONTENEDOR PRINCIPAL: STEPPER + CARD */}
      <div className="flex gap-10 items-start">

        {/* STEPPER FUERA DEL CARD */}
        <div className="w-56">
          <StepIndicator currentStep={step} />
        </div>

        {/* COLUMNA DERECHA */}
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
                      router.push(from === "dashboard" ? "/dashboard" : "/licitacion-publica/");
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
          {/* CARD A LA DERECHA */}
          <Card className="pt-4 pb-6 px-4 shadow-md border rounded-xl flex-1">

          <CardContent>

            {/* ENCABEZADO: Título + Botón Paso 2 */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Paso 1: Licitación pública</h1>

              {/* Botón Paso 2 */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  onClick={() => {
                  if (idCalendario) {
                    editarCalendario();
                  } else {
                    crearCalendario();
                  }
                  }}
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
              <Label>Servidor público (emite)</Label>

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

      {/* Ver servidores públicos */}
      <Dialog open={dialogVerServidores} onOpenChange={setDialogVerServidores}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            type="button"
          >
            <Eye className="w-4 h-4" />
            Ver servidores públicos
          </Button>
        </DialogTrigger>

        {/* Dialog más pequeño y scrollable */}
        <DialogContent className="max-w-md max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Servidores públicos del ente</DialogTitle>
            <DialogDescription>
              Lista de servidores públicos registrados para este ente.
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
                {servidores
                  .filter(s => String(s.id_ente) === String(user?.id_ente))
                  .map((s, idx) => (
                    <tr key={s.id || idx}>
                      <td className="py-2 px-4 border-b">{s.nombre}</td>
                      <td className="py-2 px-4 border-b">{s.cargo}</td>
                    </tr>
                  ))}

                {servidores.filter(s => String(s.id_ente) === String(user?.id_ente)).length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-2 px-4 text-center text-gray-400">
                      No hay servidores públicos para este ente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => setDialogVerServidores(false)}
              style={{ backgroundColor: "#db200b", color: "white" }}
              className="hover:brightness-110"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Añadir servidor */}
      <Dialog open={dialogNuevoServidor} onOpenChange={setDialogNuevoServidor}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            type="button"
          >
            <UserPlus className="w-4 h-4" /> Añadir servidor
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir nuevo servidor público</DialogTitle>
            <DialogDescription>
              Completa los campos para registrar un nuevo servidor público para este ente.
            </DialogDescription>
            <p className="text-sm text-gray-500 mt-1">
              El servidor se asociará automáticamente al ente al que perteneces.
            </p>
          </DialogHeader>

          <form
            className="space-y-4 mt-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!nuevoServidorNombre.trim() || !nuevoServidorCargo.trim()) {
                toast.warning("Por favor ingresa nombre y cargo.");
                return;
              }
              try {
                const url = `${API_BASE}/catalogos/ente-y-servidor-publico-gestionar-ambos?p_id_ente=${user?.id_ente}&p_nombre=${encodeURIComponent(
                  nuevoServidorNombre
                )}&p_cargo=${encodeURIComponent(nuevoServidorCargo)}`;
                const resp = await fetch(url, { method: "POST" });
                if (!resp.ok) {
                  toast.error("Error al añadir servidor público.");
                  return;
                }

                const sResp = await fetch(
                  `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user?.id_ente}`
                );
                const nuevosServidores = await sResp.json();
                setServidores(nuevosServidores);

                const nuevoServidor = nuevosServidores.find(
                  (s) =>
                    s.nombre?.toLowerCase() === nuevoServidorNombre.toLowerCase() &&
                    s.cargo?.toLowerCase() === nuevoServidorCargo.toLowerCase()
                );

                if (nuevoServidor) {
                  setServidorSeleccionado(nuevoServidor);
                  setCargoServidor(nuevoServidor.cargo || "");
                  setBusquedaServidor(nuevoServidor.nombre);
                  setMostrarServidores(false);
                  toast.success(`Servidor "${nuevoServidor.nombre}" seleccionado automáticamente`);
                }

                setNuevoServidorNombre("");
                setNuevoServidorCargo("");
                setDialogNuevoServidor(false);
              } catch (err) {
                toast.error("Error al añadir servidor público.");
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
                onClick={() => setDialogNuevoServidor(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#34e004] text-white hover:bg-[#2bc103]">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

            {/* NÚMERO DE LICITACIÓN */}
            <div className="mb-6">
              <Label>Número de licitación</Label>
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
                disabled
                className="border rounded-md p-2 w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                value={tipoEvento}
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
                    onClick={() => {
                    if (idCalendario) {
                      editarCalendario();
                    } else {
                      crearCalendario();
                    }
                    }}
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
                    router.push(from === "dashboard" ? "/dashboard" : "/licitacion-publica/");
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
        {/* RENDER PASO 2 ABAJO DEL PASO 1 */}
        {step === 2 && idCalendario && (
          <div className="mt-2">
            <Paso2FuentesFinanciamiento
              key={step}   // 👈 Fuerza remount
              idCalendario={idCalendario}
              idUsuario={user?.id}
              numeroLicitacion={acuerdo}   // 👈 AÑADIDO
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          </div>
        )}

        {/* 🔥 RENDER PASO 3 ABAJO DEL PASO 2 */}
        {step === 3 && idCalendario && (
        <div className="mt-2">
            <Paso3SeleccionarActos
            idCalendario={idCalendario}
            idUsuario={user?.id}
            numeroLicitacion={acuerdo}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
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
  numeroLicitacion: string; 
  onNext: () => void;
  onBack: () => void;
}

function Paso2FuentesFinanciamiento({ idCalendario, idUsuario, numeroLicitacion, onNext, onBack, }: Paso2Props) {
  const [openSalirDialog, setOpenSalirDialog] = useState(false);
  const [fuentesCatalogo, setFuentesCatalogo] = useState<FuenteFinanciamiento[]>([]);
  const [busquedaFuente, setBusquedaFuente] = useState("");
  const [seleccionFuente, setSeleccionFuente] = useState<FuenteFinanciamiento | null>(null);
  const [errorFuente, setErrorFuente] = useState("");
  const [errorListaVacia, setErrorListaVacia] = useState("");  
  const [fuentesAgregadas, setFuentesAgregadas] = useState<FuenteFinanciamiento[]>([]);
useEffect(() => {
  async function cargarFuentesExistentes() {
    const r = await fetch(
      `${API_BASE}/procesos/calendario/fuentes-financiamiento?p_id_calendario=${idCalendario}`
    );

    const data = await r.json();

    const fuentes = data?.fuentes ?? data?.items ?? [];

    // Usamos el catálogo para reconstruir fondo, ramo, etiquetado completo
    const normalizadas = fuentes.map(f => {
      const fromCatalog = fuentesCatalogo.find(c => c.id === f.id_fuente_financiamiento);

      return {
        id: f.id_fuente_financiamiento,
        descripcion: f.fuente_descripcion,

        // Etiquetado: lo devuelve backend en fecha_y_hora_sistema
        etiquetado: f.fecha_y_hora_sistema,

        // Fondo y ramo los sacamos del catálogo, porque backend NO los envía
        fondo: fromCatalog?.fondo ?? "-",
        ramo: fromCatalog?.ramo ?? "-",
      };
    });

    setFuentesAgregadas(normalizadas);
  }

  // Solo cargar si ya tenemos el catálogo de fuentes disponible
  if (fuentesCatalogo.length > 0) {
    cargarFuentesExistentes();
  }
}, [idCalendario, fuentesCatalogo]);
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
  setErrorFuente("");
  setErrorListaVacia("");

  if (!seleccionFuente) {
    setErrorFuente("Este campo es obligatorio");
    toast.error("Seleccione una fuente antes de continuar");
    return;
  }

  // Validar duplicados antes de enviar al backend
  const yaExiste = fuentesAgregadas.some(
    (f) => String(f.id) === String(seleccionFuente.id)
  );

  if (yaExiste) {
    toast.warning("Ya añadiste esta fuente");
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

  // limpiar estados
  setSeleccionFuente(null);
  setBusquedaFuente("");
  setErrorFuente("");
  setErrorListaVacia("");

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

    // Mostrar toast
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
                    onClick={() => {
                    if (fuentesAgregadas.length === 0) {
                    setErrorFuente("Este campo es obligatorio"); 
                    setErrorListaVacia(""); 
                    toast.error("Debe agregar una fuente antes de continuar");
                    return;
                    }
                      onNext();
                    }}
                    className="bg-[#235391] hover:bg-[#1e3a8a] transition-transform hover:scale-105 rounded-full px-4 py-2"
                  >
                    3 →
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Avanzar al siguiente paso</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* FORMULARIO DE AGREGAR FUENTE */}
          {/* Número de licitación */}
          <div className="mb-4">
            <Label>Número de licitación</Label>
            <Input
              value={numeroLicitacion}
              disabled
              className="bg-gray-100 text-gray-700 !cursor-not-allowed !pointer-events-auto"

            />
          </div>
          <div>
            <Label>Fuente de financiamiento</Label>

            <Command>
            <CommandInput
            placeholder="Buscar fuente…"
            value={busquedaFuente}
            onValueChange={(val) => {
                setBusquedaFuente(val);
                setSeleccionFuente(null);
                setErrorFuente(""); // limpia error
            }}
            className={`w-full ${errorFuente ? "border border-red-500" : ""}`}
            />
              {errorFuente && (
            <p className="text-red-600 text-xs mt-1">{errorFuente}</p>
            )}

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
              <tr key="sin-fuentes">
                <td colSpan={8} className="text-center py-3 text-gray-400">
                  No hay fuentes agregadas
                </td>
              </tr>
            ) : (
              fuentesAgregadas.map((f) => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">{f.id} – {f.descripcion}</td>
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
                  onClick={() => {
                if (fuentesAgregadas.length === 0) {
                setErrorFuente("Este campo es obligatorio");
                setErrorListaVacia(""); 
                toast.error("Debe agregar una fuente antes de continuar");
                return;
                }
                    onNext();
                  }}
                  className="bg-[#235391] hover:bg-[#1e3a8a] transition-transform hover:scale-105 rounded-full px-4 py-2"
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
              onClick={() => router.push("/licitacion-publica")}
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

// Paso 3: Seleccionar actos 

function toBackendDate(date: string) { 
  // Convierte 27/02/2025 → 2025-02-27
  const [dd, mm, yyyy] = date.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

function toBackendTime(time: string) {
  // Convierte 12:30 → 12:30:00
  return time.length === 5 ? `${time}:00` : time;
}

// Convierte "2025-02-27" → "27/02/2025" o mantiene "27/02/2025"
export function formatDateDDMMYYYY(input: string): string {
  if (!input) return "";

  // Si viene como yyyy-mm-dd (por el date picker)
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [yyyy, mm, dd] = input.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  // Control manual del usuario (dd/mm/yyyy)
  const cleaned = input.replace(/[^\d]/g, "");
  let dd = cleaned.slice(0, 2);
  let mm = cleaned.slice(2, 4);
  let yyyy = cleaned.slice(4, 8);

  return [dd, mm, yyyy].filter(Boolean).join("/");
}

// Convierte entrada manual "1234" → "12:34"
export function formatTimeHHMM(input: string): string {
  const cleaned = input.replace(/[^\d]/g, "");

  let hh = cleaned.slice(0, 2);
  let mm = cleaned.slice(2, 4);

  return [hh, mm].filter(Boolean).join(":");
}

interface Acto {
  id: number;
  descripcion: string;
  estatus: boolean;
  fecha?: string;  // <- ya usas este campo también
  hora?: string;   // <- AÑADE ESTA LÍNEA
}

interface Paso3Props {
  idCalendario: number;
  idUsuario: number;
  numeroLicitacion: string;
  onBack: () => void;
  onNext: () => void;
}

function Paso3SeleccionarActos({
  idCalendario,
  idUsuario,
  numeroLicitacion,
  onBack,
  onNext
}: Paso3Props) {

  const [catalogoActos, setCatalogoActos] = useState<Acto[]>([]);
  const [openSalirDialog, setOpenSalirDialog] = useState(false);
  const [errores, setErrores] = useState<{ [id: number]: { fecha?: string; hora?: string } }>({});
  const [horaGlobal, setHoraGlobal] = useState("");
  const [tocoFinalizar, setTocoFinalizar] = useState(false);
  const [ocultarHorasIndividuales, setOcultarHorasIndividuales] = useState(false);

useEffect(() => {
  async function loadActos() {
    // 1️⃣ Cargar catálogo de entregables
    const r1 = await fetch(
      `${API_BASE}/sesiones/entregables-popular?p_id=-99&p_id_calendario_sesiones=-99`
    );
    const catalogo: any[] = await r1.json();

    // 2️⃣ Cargar actos guardados si estamos editando
    const r2 = await fetch(
      `${API_BASE}/procesos/calendario/acto-popular?p_id_calendario=${idCalendario}&p_id_listado_entregables=-99`
    );
    const guardados = await r2.json();
    const itemsGuardados: any[] = guardados?.items ?? [];

    // 3️⃣ Convertir guardados a diccionario
    const mapGuardados: Record<number, { fecha: string; hora: string }> = {};

    itemsGuardados.forEach((a: any) => {
      mapGuardados[a.id_listado_entregables] = {
        fecha: formatDateDDMMYYYY(a.fecha),
        hora: a.hora ? a.hora.substring(11, 16) : ""
      };
    });

    // 4️⃣ Fusionar catálogo + valores guardados
    const fusion = catalogo.map((acto: any) => {
      const encontrado = mapGuardados[acto.id];

      return {
        ...acto,
        fecha: encontrado?.fecha ?? "",
        hora: encontrado?.hora ?? ""
      };
    });

    setCatalogoActos(fusion);

    // 5️⃣ Detectar si todas las horas son iguales → activar horaGlobal
    const horas: string[] = fusion
      .map((a: any) => a.hora)
      .filter((h: string) => h);

    if (horas.length > 0) {
      const todasIguales = horas.every((h: string) => h === horas[0]);
      if (todasIguales) {
        setHoraGlobal(horas[0]);
        setOcultarHorasIndividuales(true);
      }
    }
  }

  if (idCalendario) loadActos();
}, [idCalendario]);



  /* =========================================================
     Finalizar — Guardar TODOS los actos seleccionados
  ========================================================= */

  async function finalizarActos() {
  setTocoFinalizar(true); 
  const nuevosErrores: any = {};
  let tieneErrores = false;


// Validación de horas: si NO hay hora global, entonces TODAS las individuales deben tener hora
if (!horaGlobal) {
  const actosSinHora = catalogoActos.some(a => !a.hora || a.hora.trim() === "");

  if (actosSinHora) {
    toast.error("Debe ingresar una hora global o completar la hora de cada acto");
    return;
  }
}

  // Validar fechas de cada acto
  catalogoActos.forEach((acto) => {
    if (!(acto as any).fecha) {
      nuevosErrores[acto.id] = { fecha: "Debe ingresar una fecha" };
      tieneErrores = true;
    }
  });

  if (tieneErrores) {
    setErrores(nuevosErrores);
    toast.error("Debe completar las fechas antes de continuar");
    return;
  }

  // Enviar 1 a 1 al backend
for (const acto of catalogoActos) {
  const horaFinal = horaGlobal || acto.hora;

  const body = {
    p_accion: "NUEVO",
    p_id_calendario: idCalendario,
    p_id_listado_entregables: acto.id,
  p_fecha: toBackendDate(acto.fecha!),
  p_hora: toBackendTime(horaFinal!),
    p_id_usuario_registra: idUsuario,
  };


  console.log("📤 Enviando acto:", body);

  await fetch(`${API_BASE}/procesos/calendario/acto/gestionar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

  toast.success("Actos guardados correctamente");
  router.push("/licitacion-publica");
}

 /* =========================================================
     UI DEL PASO 3
========================================================= */

const router = useRouter(); // 👈 NECESARIO

return (
  <>
    <Card className="mt-4 shadow-md">
      <CardContent className="space-y-6">

        {/* ENCABEZADO SUPERIOR */}
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
                  onClick={finalizarActos}
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

          {/* TÍTULO */}
          <h1 className="text-2xl font-bold">Paso 3: Seleccionar actos</h1>
        </div>
        {/* NÚMERO DE LICITACIÓN (solo lectura) */}
        <div className="mb-4">
          <Label>Número de licitación</Label>
          <Input
            value={numeroLicitacion}
            disabled
            className="bg-gray-100 text-gray-700 !cursor-not-allowed !pointer-events-auto"
          />
        </div>

        {/* HORA GLOBAL */}
        <div className="mb-4">
          <Label>Hora (24 hrs)</Label>
          <Input
            value={horaGlobal}
          onChange={(e) => {
            const nuevaHora = formatTimeHHMM(e.target.value);
            setHoraGlobal(nuevaHora);

            if (nuevaHora.trim() !== "") {
              // usuario está escribiendo → ocultamos inputs individuales
              setOcultarHorasIndividuales(true);

              // actualizamos horas individuales automáticamente
              setCatalogoActos(prev =>
                prev.map(a => ({
                  ...a,
                  hora: nuevaHora
                }))
              );
            } else {
              // usuario borró la hora global → mostramos inputs limpios
              setOcultarHorasIndividuales(false);

              setCatalogoActos(prev =>
                prev.map(a => ({
                  ...a,
                  hora: "" // limpiar horas individuales
                }))
              );
            }
          }}
            placeholder="HH:MM"
            maxLength={5}
            className={`${
            tocoFinalizar &&
            horaGlobal === "" &&
            catalogoActos.some(a => !a.hora || a.hora.trim() === "")
              ? "border border-red-500"
              : ""
          }`}
          />
        {tocoFinalizar &&
        horaGlobal === "" &&
        catalogoActos.some(a => !a.hora || a.hora.trim() === "") && (
          <p className="text-red-600 text-xs">
            Debe ingresar una hora global o completar todas las horas individuales
          </p>
        )}
        </div>
        {/* LISTA DE ACTOS */}
        <div className="space-y-4">
          {catalogoActos.map((acto) => {
          const error = errores[acto.id] || {};

            return (
              <div
                key={acto.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  
                  {/* CHECKBOX */}
                <span className="font-medium">{acto.descripcion}</span>

              <div className="flex items-center gap-6 mt-4">

                  {/* FECHA */}
                  <div className="w-32">
                    <Label>Fecha</Label>
                    <Input
                      value={(acto as any).fecha ?? ""}
                      onChange={(e) => {
                        const value = formatDateDDMMYYYY(e.target.value);

                        setErrores((prev) => ({
                          ...prev,
                          [acto.id]: { fecha: "" }
                        }));

                        setCatalogoActos((prev) =>
                          prev.map((a) =>
                            a.id === acto.id ? { ...a, fecha: value } : a
                          )
                        );
                      }}
                      placeholder="dd/mm/aaaa"
                      maxLength={10}
                      className={`${error.fecha ? "border border-red-500" : ""}`}
                    />
                    {error.fecha && <p className="text-red-600 text-xs">{error.fecha}</p>}
                  </div>

                  {/* HORA INDIVIDUAL */}
                  <div className="w-24">
                    <Label>Hora (24 hrs)</Label>

                    {!ocultarHorasIndividuales ? (
                      <Input
                        type="text"
                        inputMode="text"
                        value={acto.hora ?? ""}
                        onChange={(e) => {
                          const value = formatTimeHHMM(e.target.value);
                          setCatalogoActos(prev =>
                            prev.map(a =>
                              a.id === acto.id ? { ...a, hora: value } : a
                            )
                          );
                        }}
                        placeholder="HH:MM"
                        maxLength={5}
                      />
                    ) : (
                      <p className="text-gray-400 text-sm">Usando hora global</p>
                    )}
                  </div>

                </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* BOTONES INFERIORES */}
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
              <TooltipContent side="top">Regresar al paso anterior</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Botón finalizar */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={finalizarActos}
                  className="text-white hover:scale-105 transition-transform rounded-full px-4 py-2"
                  style={{ backgroundColor: "#FFBF00" }}
                >
                  Finalizar
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Finalizar proceso</TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>
      </CardContent>
    </Card>

    {/* BOTÓN SALIR INFERIOR */}
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
            <TooltipContent side="top">Salir</TooltipContent>
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
              onClick={() => router.push("/licitacion-publica")}
              style={{ backgroundColor: "#34e004", color: "white" }}
            >
              Sí
            </Button>
          </DialogFooter>
        </DialogContent>
         </Dialog>
    </div>
  </>
); 
}    
