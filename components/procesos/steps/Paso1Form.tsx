"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Loader2, Eye, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

interface Paso1FormProps {
  idSeguimiento: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function Paso1Form({ idSeguimiento, onClose, onSaved }: Paso1FormProps) {
  const { user } = useUser();

  // -------------------------
  // ESTADOS
  // -------------------------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState<any>({});

  const [enteDescripcion, setEnteDescripcion] = useState("");

  const [servidores, setServidores] = useState<any[]>([]);
  const [tiposEvento, setTiposEvento] = useState<any[]>([]);
  const [tiposLicitacion, setTiposLicitacion] = useState<any[]>([]);
  const [numerosSesion, setNumerosSesion] = useState<any[]>([]);

  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [mostrarServidores, setMostrarServidores] = useState(false);

  const [busquedaSesion, setBusquedaSesion] = useState("");
  const [mostrarSesiones, setMostrarSesiones] = useState(false);

  const [servidorSeleccionado, setServidorSeleccionado] = useState<any>(null);
  const [sesionSeleccionada, setSesionSeleccionada] = useState<any>(null);

  const [form, setForm] = useState({
    oficio_invitacion: "",
    fecha: "",
    hora: "",
    servidor_publico_cargo: "",
    tipo_evento: "",
    tipo_licitacion: "",
    tipo_licitacion_notas: "",
  });

  // -------------------------
  // Estados faltantes (diálogos)
  // -------------------------
  const [verServidoresDialogOpen, setVerServidoresDialogOpen] = useState(false);
  const [addServidorDialogOpen, setAddServidorDialogOpen] = useState(false);
  const [nuevoServidorNombre, setNuevoServidorNombre] = useState("");
  const [nuevoServidorCargo, setNuevoServidorCargo] = useState("");
  const [addServidorLoading, setAddServidorLoading] = useState(false);

  // -------------------------
  // CARGA INICIAL
  // -------------------------
  useEffect(() => {
    if (!idSeguimiento || !user?.id_ente) return;

    const loadData = async () => {
      try {
        const det = await fetch(
          `${API_BASE}/procesos/editar/seguimiento?p_id=${idSeguimiento}&p_id_ente=${user.id_ente}`
        );
        const raw = await det.json();
        const d = Array.isArray(raw) ? raw[0] : raw;

        // catálogos
        const enteResp = await fetch(
          `${API_BASE}/catalogos/entes?p_id=${user.id_ente}&p_descripcion=-99`
        );
        const enteData = await enteResp.json();
        setEnteDescripcion(enteData?.[0]?.descripcion || "—");

        const srv = await fetch(
          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user.id_ente}`
        ).then((r) => r.json());

        const eventos = await fetch(`${API_BASE}/procesos/tipos-evento/`).then((r) => r.json());
        const sesiones = await fetch(`${API_BASE}/catalogos/sesiones-numeros/`).then((r) => r.json());

        setServidores(srv);
        setTiposEvento(eventos);
        setNumerosSesion(sesiones);

        // detectar valores
        const fechaISO = d?.e_fecha_y_hora_reunion?.split("T")[0] ?? "";
        const horaISO = d?.e_fecha_y_hora_reunion?.split("T")[1]?.substring(0, 5) ?? "";

        setForm({
          oficio_invitacion: d?.e_oficio_invitacion ?? "",
          fecha: reverseISO(fechaISO),
          hora: horaISO,
          servidor_publico_cargo: d?.e_servidor_publico_cargo ?? "",
          tipo_evento: d?.e_tipo_evento ?? "",
          tipo_licitacion: d?.e_tipo_licitacion ?? "",
          tipo_licitacion_notas: d?.tipo_licitacion_no_veces_descripcion ?? "",
        });

        if (d?.id_servidor_publico_emite) {
          const sv = srv.find((x: any) => x.id === d.id_servidor_publico_emite);
          if (sv) setServidorSeleccionado(sv);
        }

        if (d?.e_tipo_licitacion_no_veces) {
          const se = sesiones.find((x: any) => x.id === d.e_tipo_licitacion_no_veces);
          if (se) setSesionSeleccionada(se);
        }

        if (d?.e_tipo_evento) {
          const resp = await fetch(`${API_BASE}/catalogos/auxiliares?p_tipo=${d.e_tipo_evento}`);
          setTiposLicitacion(await resp.json());
        }
      } catch (err) {
        console.error("❌ Error cargando paso 1:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [idSeguimiento, user?.id_ente]);

  // cargar licitaciones cuando cambia el tipo de evento
  useEffect(() => {
    if (!form.tipo_evento) return;

    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/auxiliares?p_tipo=${form.tipo_evento}`);
        setTiposLicitacion(await resp.json());
      } catch {
        setTiposLicitacion([]);
      }
    })();
  }, [form.tipo_evento]);

    // Cerrar lista de servidores cuando la búsqueda queda vacía
    useEffect(() => {
    if (busquedaServidor.trim() === "") {
        setMostrarServidores(false);
    }
    }, [busquedaServidor]);

    // Cerrar lista de sesiones cuando la búsqueda queda vacía
    useEffect(() => {
    if (busquedaSesion.trim() === "") {
        setMostrarSesiones(false);
    }
    }, [busquedaSesion]);

  // -------------------------
  // GUARDAR CAMBIOS
  // -------------------------
  const handleSave = async () => {
    const req = {
      p_id: idSeguimiento,
      p_e_oficio_invitacion: form.oficio_invitacion,
      p_e_id_servidor_publico_emite: Number(servidorSeleccionado?.id),
      p_e_servidor_publico_cargo: form.servidor_publico_cargo,
      p_e_tipo_licitacion: form.tipo_licitacion,
      p_e_tipo_licitacion_no_veces: Number(sesionSeleccionada?.id),
      p_e_tipo_licitacion_notas: form.tipo_licitacion_notas,
      p_e_fecha_y_hora_reunion: toIsoLocalDateTime(form.fecha, form.hora),
      p_e_id_usuario_registra: user?.id,
      p_e_tipo_evento: form.tipo_evento,
    };

    setSaving(true);

    try {
      const resp = await fetch(`${API_BASE}/procesos/editar/ente-seguimiento-captura`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });

      if (!resp.ok) throw new Error("Error al guardar");

      toast.success("Cambios guardados correctamente");
      onSaved();
    } catch (err) {
      console.error("❌ Error guardando paso 1:", err);
      toast.error("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <p className="text-center py-6 text-gray-500">Cargando...</p>;

  // -------------------------
  // UI COMPLETO INCLUYENDO LOS DIÁLOGOS
  // -------------------------
  return (
    <div className="space-y-6">

      {/* Ente */}
      <div>
        <Label>Ente</Label>
        <Input disabled value={enteDescripcion} className="bg-gray-100 text-gray-700" />
      </div>

      {/* Oficio + Fecha + Hora */}
      <div className="flex gap-4 flex-wrap md:flex-nowrap">
        <div className="w-full md:w-[60%]">
          <Label>Oficio de invitación</Label>
          <Input
            value={form.oficio_invitacion}
            onChange={(e) => setForm({ ...form, oficio_invitacion: e.target.value })}
          />
        </div>

        <div className="w-full md:w-[20%] flex flex-col">
          <Label>Fecha</Label>
          <Input
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: formatDateDDMMYYYY(e.target.value) })}
            placeholder="dd/mm/aaaa"
            maxLength={10}
          />
        </div>

        <div className="w-full md:w-[20%] flex flex-col">
          <Label className="leading-none">Hora (24 Hrs)</Label>
          <Input
            value={form.hora}
            onChange={(e) => setForm({ ...form, hora: formatTimeHHMM(e.target.value) })}
            placeholder="HH:MM"
            maxLength={5}
          />
        </div>
      </div>

      {/* Servidor público */}
      <div>
        <Label>Servidor público (emite)</Label>
        
        <Command>
          <CommandInput
            placeholder="Escribe para buscar…"
            value={busquedaServidor}
            onValueChange={(v) => {
              setBusquedaServidor(v);
              setMostrarServidores(v.trim().length > 0);
            }}
          />


          {mostrarServidores && (
            <CommandList>
              {servidores
                .filter((s) =>
                  (s.nombre || "").toLowerCase().includes(busquedaServidor.toLowerCase())
                )
                .map((s) => (
                  <CommandItem
                    key={s.id}
                    onSelect={() => {
                      setServidorSeleccionado(s);
                      setForm({ ...form, servidor_publico_cargo: s.cargo || "" });
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

        {/* Botones de diálogos debajo */}
        <div className="flex gap-3 mt-2">

          {/* Ver servidores */}
          <Dialog open={verServidoresDialogOpen} onOpenChange={setVerServidoresDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                <Eye className="w-4 h-4 mr-2" />
                Ver servidores públicos
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Servidores públicos del ente</DialogTitle>
                <DialogDescription>
                  Lista de servidores registrados para este ente.
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
                      .map((s, i) => (
                        <tr key={i}>
                          <td className="py-2 px-4 border-b">{s.nombre}</td>
                          <td className="py-2 px-4 border-b">{s.cargo}</td>
                        </tr>
                      ))}

                    {servidores.filter((s) => String(s.id_ente) === String(user?.id_ente)).length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-3 text-center text-gray-400">
                          No hay servidores registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <DialogFooter>
                <Button onClick={() => setVerServidoresDialogOpen(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Añadir servidor */}
          <Dialog open={addServidorDialogOpen} onOpenChange={setAddServidorDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Añadir servidor público
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Añadir servidor público</DialogTitle>
                <DialogDescription>
                  Complete los datos para añadir un nuevo servidor.
                </DialogDescription>
              </DialogHeader>

              {/* Formulario */}
              <div className="space-y-4 mt-3">

                <div>
                  <Label>Ente</Label>
                  <Input value={enteDescripcion} disabled className="bg-gray-100" />
                </div>

                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={nuevoServidorNombre}
                    onChange={(e) => setNuevoServidorNombre(e.target.value)}
                    placeholder="Nombre completo"
                  />
                </div>

                <div>
                  <Label>Cargo</Label>
                  <Input
                    value={nuevoServidorCargo}
                    onChange={(e) => setNuevoServidorCargo(e.target.value)}
                    placeholder="Cargo"
                  />
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setAddServidorDialogOpen(false)}
                  >
                    Cancelar
                  </Button>

                  <Button
                    className="bg-[#34e004] text-white hover:bg-[#2bc103]"
                    disabled={addServidorLoading}
                    onClick={async () => {
                      if (!nuevoServidorNombre || !nuevoServidorCargo) {
                        toast.warning("Debes ingresar nombre y cargo");
                        return;
                      }

                      setAddServidorLoading(true);

                      try {
                        const url = `${API_BASE}/catalogos/ente-y-servidor-publico-gestionar-ambos?p_id_ente=${user?.id_ente}&p_nombre=${encodeURIComponent(
                          nuevoServidorNombre
                        )}&p_cargo=${encodeURIComponent(nuevoServidorCargo)}`;

                        const resp = await fetch(url, { method: "POST" });
                        if (!resp.ok) {
                          toast.error("Error al añadir servidor");
                          return;
                        }

                        // refrescar lista
                        const sResp = await fetch(
                          `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${user?.id_ente}`
                        );
                        const nuevos = await sResp.json();
                        setServidores(nuevos);

                        const nuevo = nuevos.find(
                          (x: any) =>
                            x.nombre?.toLowerCase() === nuevoServidorNombre.toLowerCase() &&
                            x.cargo?.toLowerCase() === nuevoServidorCargo.toLowerCase()
                        );

                        if (nuevo) {
                          setServidorSeleccionado(nuevo);
                          setForm((prev) => ({
                            ...prev,
                            servidor_publico_cargo: nuevo.cargo,
                          }));
                          setBusquedaServidor(nuevo.nombre);
                          setMostrarServidores(false);

                          toast.success("Servidor añadido y seleccionado");
                        }

                        setNuevoServidorNombre("");
                        setNuevoServidorCargo("");
                        setAddServidorDialogOpen(false);
                      } catch (err) {
                        toast.error("Error inesperado");
                      } finally {
                        setAddServidorLoading(false);
                      }
                    }}
                  >
                    {addServidorLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>

        </div>

        {errores.servidor_publico_cargo && (
          <p className="text-red-600 text-xs mt-1">{errores.servidor_publico_cargo}</p>
        )}
      </div>

      {/* Cargo */}
      <div>
        <Label>Cargo</Label>
        <Input
          value={form.servidor_publico_cargo}
          onChange={(e) => setForm({ ...form, servidor_publico_cargo: e.target.value })}
        />
      </div>

      {/* Tipo evento + licitación */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Tipo de evento</Label>
          <select
            className="border rounded-md p-2 w-full"
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
        </div>

        <div>
          <Label>Tipo de licitación</Label>
          <select
            className="border rounded-md p-2 w-full"
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
        </div>
      </div>

      {/* Sesión */}
      <div>
        <Label>Número de sesión</Label>
        <Command>
          <CommandInput
            placeholder="Escribe para buscar…"
            value={busquedaSesion}
            onValueChange={(v) => {
              setBusquedaSesion(v);
              setMostrarSesiones(v.trim().length > 0);
            }}
          />

          {mostrarSesiones && (
            <CommandList>
              {numerosSesion
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
                ))}

              <CommandEmpty>No se encontraron sesiones</CommandEmpty>
            </CommandList>
          )}
        </Command>
      </div>

      {/* Usuario */}
      <div>
        <Label>Usuario</Label>
        <Input disabled value={user?.nombre || "Cargando..."} />
      </div>

      {/* Botones */}
      <DialogFooter className="mt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>

        <Button
          className="bg-[#235391] text-white"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ──────────────────────────────────────── */
/*     UTILIDADES                           */
/* ──────────────────────────────────────── */
function reverseISO(iso: string) {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

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

function toIsoLocalDateTime(dmy: string, hm: string) {
  const [dd, mm, yyyy] = dmy.split("/");
  return `${yyyy}-${mm}-${dd}T${hm}:00`;
}