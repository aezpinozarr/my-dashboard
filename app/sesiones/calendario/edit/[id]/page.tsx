// app/sesiones/calendario/[id]/edit/page.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

// ===== Tipos =====
type Ente = { id: string; descripcion: string; siglas: string; clasificacion: string; ente_tipo_descripcion: string; };
type Servidor = { id: number; nombre: string; cargo: string; };
type Clasificacion = { id: number; descripcion: string; tipo_licitacion: string; };
type Fuente = { id: number; descripcion: string; };
type Entregable = { id: number; descripcion: string; };
type Fecha = { id: number; fecha: string; hora: string; activo: boolean; };

// ===== Validación =====
const Schema = z.object({
  id_ente: z.string().min(1, "Selecciona un ente"),
  oficio_o_acta_numero: z.string().min(1).max(50),
  asunto: z.string().min(1).max(50),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Usa formato YYYY-MM-DD"),
  id_servidor_publico: z.coerce.number().min(1, "Selecciona un servidor público"),
  comite: z.string().min(1),
  modo_sesion: z.string().min(1),
  id_clasificacion_licitacion: z.coerce.number().min(1),
});

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sesionId = Number(params?.id);

  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
  });

  // ===== Estados =====
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [enteSearch, setEnteSearch] = React.useState("");
  const [selectedEnte, setSelectedEnte] = React.useState<Ente | null>(null);

  const [servidores, setServidores] = React.useState<Servidor[]>([]);
  const [servidorSearch, setServidorSearch] = React.useState("");

  const [comites, setComites] = React.useState<string[]>([]);
  const [modos, setModos] = React.useState<string[]>([]);
  const [clasificaciones, setClasificaciones] = React.useState<Clasificacion[]>([]);
  const [selectedClasificacion, setSelectedClasificacion] = React.useState<Clasificacion | null>(null);

  const [fuentes, setFuentes] = React.useState<Fuente[]>([]);
  const [selectedFuentes, setSelectedFuentes] = React.useState<number[]>([]);

  const [entregables, setEntregables] = React.useState<Entregable[]>([]);
  const [selectedEntregables, setSelectedEntregables] = React.useState<number[]>([]);

  const [fechas, setFechas] = React.useState<{ fecha: string; hora: string }[]>([]);
  const [newFecha, setNewFecha] = React.useState("");
  const [newHora, setNewHora] = React.useState("");

  // ===== Cargar catálogos =====
  React.useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99`).then((r) => r.json()),
      fetch(`${API_BASE}/catalogos/comite`).then((r) => r.json()),
      fetch(`${API_BASE}/catalogos/modo-sesion`).then((r) => r.json()),
      fetch(`${API_BASE}/catalogos/clasificacion-licitacion?p_id=-99`).then((r) => r.json()),
      fetch(`${API_BASE}/catalogos/fuentes-financiamiento`).then((r) => r.json()),
      fetch(`${API_BASE}/sesiones/entregables-popular?p_id=-99&p_id_calendario_sesiones=-99`).then((r) => r.json()),
    ])
      .then(([entesData, comitesData, modosData, clasData, fuentesData, entData]) => {
        setEntes(entesData);
        setComites(comitesData.map((c: any) => c.comite_sesion));
        setModos(modosData.map((m: any) => m.modo_sesion));
        setClasificaciones(clasData);
        setFuentes(fuentesData);
        setEntregables(entData);
      })
      .catch(console.error);
  }, []);

  // ===== Cargar sesión existente =====
  React.useEffect(() => {
    if (!sesionId) return;
    const loadSesion = async () => {
      try {
        const ses = await fetch(`${API_BASE}/sesiones/${sesionId}`).then((r) => r.json());
        form.reset(ses);

        const fuentesSel = await fetch(`${API_BASE}/sesiones-fuentes/${sesionId}`).then((r) => r.json());
        setSelectedFuentes(fuentesSel.map((f: any) => f.id_fuente_financiamiento));

        const fechasSel = await fetch(`${API_BASE}/sesiones-fechas/by-sesion/${sesionId}`).then((r) => r.json());
        setFechas(fechasSel.map((f: Fecha) => ({ fecha: f.fecha, hora: f.hora })));

        const entregSel = await fetch(`${API_BASE}/sesiones-entregables?id_calendario_sesiones=${sesionId}`).then((r) => r.json());
        setSelectedEntregables(entregSel.map((e: any) => e.id_listado_entregables));

        // cargar servidores asociados al ente
        if (ses.id_ente) {
          const serv = await fetch(`${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${ses.id_ente}`).then((r) => r.json());
          setServidores(serv);
        }
      } catch (err) {
        console.error("❌ Error cargando sesión:", err);
      }
    };
    loadSesion();
  }, [sesionId, form]);

  // ===== Watch ente para servidores =====
  React.useEffect(() => {
    const enteId = form.watch("id_ente");
    if (!enteId) {
      setServidores([]);
      setServidorSearch("");
      return;
    }
    fetch(`${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${enteId}`)
      .then((res) => res.json())
      .then((data) => setServidores(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("❌ Error cargando servidores:", err);
        setServidores([]);
      });
  }, [form.watch("id_ente")]);

  // ===== Submit =====
  const onSubmit = async (data: z.infer<typeof Schema>) => {
    try {
      const payload = { ...data, id_usuario: 1, activo: true };

      // 1) Actualizar sesión principal
      const resp = await fetch(`${API_BASE}/sesiones/${sesionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(await resp.text());

      // 2) Reset fuentes
      const fuentesExist = await fetch(`${API_BASE}/sesiones-fuentes/${sesionId}`).then((r) => r.json());
      await Promise.all(
        fuentesExist.map((f: any) =>
          fetch(`${API_BASE}/sesiones-fuentes/${sesionId}/${f.id_fuente_financiamiento}`, { method: "DELETE" })
        )
      );
      await Promise.all(
        selectedFuentes.map((fuenteId) =>
          fetch(`${API_BASE}/sesiones-fuentes/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_calendario_sesiones: sesionId, id_fuente_financiamiento: fuenteId }),
          })
        )
      );

      // 3) Reset fechas
      const fechasExist = await fetch(`${API_BASE}/sesiones-fechas/by-sesion/${sesionId}`).then((r) => r.json());
      await Promise.all(
        fechasExist.map((f: any) => fetch(`${API_BASE}/sesiones-fechas/${f.id}`, { method: "DELETE" }))
      );
      await Promise.all(
        fechas.map((f) =>
          fetch(`${API_BASE}/sesiones-fechas/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_calendario_sesiones: sesionId, fecha: f.fecha, hora: f.hora, activo: true }),
          })
        )
      );

      // 4) Reset entregables
      const entregExist = await fetch(`${API_BASE}/sesiones-entregables?id_calendario_sesiones=${sesionId}`).then((r) => r.json());
      await Promise.all(
        entregExist.map((e: any) =>
          fetch(`${API_BASE}/sesiones-entregables/`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_calendario_sesiones: sesionId, id_listado_entregables: e.id_listado_entregables }),
          })
        )
      );
      await Promise.all(
        selectedEntregables.map((entId) =>
          fetch(`${API_BASE}/sesiones-entregables/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_calendario_sesiones: sesionId, id_listado_entregables: entId }),
          })
        )
      );

      alert("✅ Sesión actualizada con éxito");
      router.push("/sesiones/calendario");
    } catch (err) {
      console.error("❌ Error al actualizar sesión:", err);
      alert("❌ Error al actualizar sesión");
    }
  };

  // ===== Aux =====
  const toggleFuente = (id: number) =>
    setSelectedFuentes((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  const toggleEntregable = (id: number) =>
    setSelectedEntregables((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));
  const addFecha = () => {
    if (!newFecha || !newHora) return;
    setFechas((prev) => [...prev, { fecha: newFecha, hora: newHora }]);
    setNewFecha(""); setNewHora("");
  };
  const removeFecha = (i: number) => setFechas((prev) => prev.filter((_, idx) => idx !== i));

  // ===== Render =====
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Sesión #{sesionId}</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">

        {/* ===== Ente público ===== */}
        <Card>
          <CardHeader><CardTitle>Ente público</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <Label>Buscar ente</Label>
            <Command>
              <CommandInput placeholder="Escribe el nombre del ente..." value={enteSearch} onValueChange={setEnteSearch}/>
              <CommandList>
                {enteSearch && (
                  <>
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                    <CommandGroup>
                      {entes.filter((e) =>
                        (e.descripcion || "").toLowerCase().includes(enteSearch.toLowerCase())
                      ).map((e) => (
                        <CommandItem key={e.id} value={e.descripcion} onSelect={() => {
                          form.setValue("id_ente", e.id, { shouldValidate: true });
                          setSelectedEnte(e);
                          setEnteSearch(e.descripcion);
                        }}>
                          {e.descripcion}
                          {form.watch("id_ente") === e.id && <Check className="ml-auto h-4 w-4 opacity-80" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input readOnly placeholder="Siglas" value={selectedEnte?.siglas || ""}/>
              <Input readOnly placeholder="Clasificación" value={selectedEnte?.clasificacion || ""}/>
              <Input readOnly placeholder="Tipo de ente" value={selectedEnte?.ente_tipo_descripcion || ""}/>
            </div>
          </CardContent>
        </Card>

        {/* ===== Datos generales ===== */}
        <Card>
          <CardHeader><CardTitle>Datos generales</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div><Label>No. Oficio</Label><Input maxLength={50} {...form.register("oficio_o_acta_numero")} /></div>
            <div><Label>Asunto</Label><Input maxLength={50} {...form.register("asunto")} /></div>
            <div><Label>Fecha</Label><Input type="date" {...form.register("fecha")} /></div>
          </CardContent>
        </Card>

        {/* ===== Servidor público ===== */}
        <Card>
          <CardHeader><CardTitle>Servidor público</CardTitle></CardHeader>
          <CardContent>
            <Command>
              <CommandInput placeholder="Escribe el nombre del servidor..." value={servidorSearch} onValueChange={setServidorSearch}/>
              <CommandList>
                {servidorSearch && (
                  <>
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                    <CommandGroup>
                      {servidores.filter((s) =>
                        (s.nombre || "").toLowerCase().includes(servidorSearch.toLowerCase())
                      ).map((s) => (
                        <CommandItem key={s.id} value={s.nombre} onSelect={() => {
                          form.setValue("id_servidor_publico", s.id, { shouldValidate: true });
                          setServidorSearch(s.nombre);
                        }}>
                          {s.nombre} {s.cargo ? `– ${s.cargo}` : ""}
                          {form.watch("id_servidor_publico") === s.id && <Check className="ml-auto h-4 w-4 opacity-80" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </CardContent>
        </Card>

        {/* ===== Clasificación de licitación ===== */}
        <Card>
          <CardHeader><CardTitle>Clasificación de licitación</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Descripción</Label>
              <select {...form.register("id_clasificacion_licitacion")} className="border rounded-md p-2 w-full"
                onChange={(e) => {
                  const selected = clasificaciones.find((c) => c.id.toString() === e.target.value);
                  setSelectedClasificacion(selected || null);
                  form.setValue("id_clasificacion_licitacion", Number(e.target.value), { shouldValidate: true });
                }}>
                <option value="">Selecciona…</option>
                {clasificaciones.map((c) => (
                  <option key={c.id} value={c.id}>{c.descripcion}</option>
                ))}
              </select>
            </div>
            <div><Label>Tipo de licitación</Label><Input readOnly value={selectedClasificacion?.tipo_licitacion || ""} /></div>
          </CardContent>
        </Card>

        {/* ===== Fuentes ===== */}
        <Card>
          <CardHeader><CardTitle>Fuentes de financiamiento</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {fuentes.map((f) => (
              <label key={`fuente-${f.id}`} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedFuentes.includes(f.id)} onChange={() => toggleFuente(f.id)} />
                {f.descripcion}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* ===== Comité y Modo ===== */}
        <Card>
          <CardHeader><CardTitle>Comité y modo</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Comité</Label>
              <select {...form.register("comite")} className="border rounded-md p-2 w-full">
                <option value="">Selecciona…</option>
                {comites.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <Label>Modo de sesión</Label>
              <select {...form.register("modo_sesion")} className="border rounded-md p-2 w-full">
                <option value="">Selecciona…</option>
                {modos.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ===== Fechas ===== */}
        <Card>
          <CardHeader><CardTitle>Fechas de la sesión</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Fecha</Label><Input type="date" value={newFecha} onChange={(e) => setNewFecha(e.target.value)} /></div>
              <div><Label>Hora</Label><Input placeholder="HH:mm:ss" value={newHora} onChange={(e) => setNewHora(e.target.value)} /></div>
            </div>
            <Button type="button" onClick={addFecha} className="w-fit bg-green-600 text-white">Añadir fecha</Button>
            {fechas.length > 0 && (
              <ul className="mt-2 space-y-2">
                {fechas.map((f, i) => (
                  <li key={`${f.fecha}-${f.hora}-${i}`} className="flex items-center justify-between border p-2 rounded">
                    <span>{f.fecha} – {f.hora}</span>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeFecha(i)}>Eliminar</Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ===== Entregables ===== */}
        <Card>
          <CardHeader><CardTitle>Entregables</CardTitle></CardHeader>
          <CardContent className="grid gap-2">
            {entregables.map((e) => (
              <label key={`ent-${e.id}`} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedEntregables.includes(e.id)} onChange={() => toggleEntregable(e.id)} />
                {e.descripcion}
              </label>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" className="w-fit bg-blue-600 text-white">Guardar cambios</Button>
      </form>
    </main>
  );
}