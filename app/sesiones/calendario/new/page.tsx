// app/sesiones/calendario/new/page.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

// Tipos
type Ente = {
  id: string;
  descripcion: string;
  siglas: string;
  clasificacion: string;
  ente_tipo_descripcion: string;
};

type Servidor = {
  id: number;
  nombre: string;
  cargo: string;
};

type Clasificacion = {
  id: number;
  descripcion: string;
  tipo_licitacion: string;
};

type Fuente = {
  id: number;
  descripcion: string;
};

type Entregable = {
  id: number;
  descripcion: string;
  estatus?: boolean;
};

// Validación
const Schema = z.object({
  id_ente: z.string().min(1, "Selecciona un ente"),
  oficio_o_acta_numero: z.string().min(1).max(50),
  asunto: z.string().min(1).max(50),
  fecha: z
    .string()
    .min(1, "Escribe la fecha")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usa formato YYYY-MM-DD"),
  id_servidor_publico: z.coerce.number().min(1, "Selecciona un servidor público"),
  comite: z.string().min(1),
  modo_sesion: z.string().min(1),
  id_clasificacion_licitacion: z.coerce.number().min(
    1,
    "Selecciona una clasificación"
  ),
});

export default function NewSessionPage() {
  const router = useRouter();
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      id_ente: "",
      oficio_o_acta_numero: "",
      asunto: "",
      fecha: "",
      id_servidor_publico: 0,
      comite: "",
      modo_sesion: "",
      id_clasificacion_licitacion: 0,
    },
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
  const [selectedClasificacion, setSelectedClasificacion] =
    React.useState<Clasificacion | null>(null);

  const [fuentes, setFuentes] = React.useState<Fuente[]>([]);
  const [selectedFuentes, setSelectedFuentes] = React.useState<number[]>([]);

  // ===== Entregables =====
  const [entregables, setEntregables] = React.useState<Entregable[]>([]);
  const [selectedEntregables, setSelectedEntregables] = React.useState<number[]>([]);

  // ===== Fechas de la sesión =====
  const [fechas, setFechas] = React.useState<{ fecha: string; hora: string }[]>([]);
  const [newFecha, setNewFecha] = React.useState("");
  const [newHora, setNewHora] = React.useState("");

  const addFecha = () => {
    if (!newFecha || !/^\d{4}-\d{2}-\d{2}$/.test(newFecha)) {
      alert("La fecha debe tener formato YYYY-MM-DD");
      return;
    }
    if (!newHora || !/^\d{2}:\d{2}(:\d{2})?$/.test(newHora)) {
      alert("La hora debe tener formato HH:mm o HH:mm:ss");
      return;
    }
    setFechas((prev) => [...prev, { fecha: newFecha, hora: newHora }]);
    setNewFecha("");
    setNewHora("");
  };

  const removeFecha = (i: number) => {
    setFechas((prev) => prev.filter((_, idx) => idx !== i));
  };

  // ===== Cargar catálogos =====
  React.useEffect(() => {
    fetch(`${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99`)
      .then((res) => res.json())
      .then((data) => setEntes(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_BASE}/catalogos/comite`)
      .then((res) => res.json())
      .then((data) =>
        setComites(Array.isArray(data) ? data.map((c) => c.comite_sesion) : [])
      )
      .catch(console.error);

    fetch(`${API_BASE}/catalogos/modo-sesion`)
      .then((res) => res.json())
      .then((data) =>
        setModos(Array.isArray(data) ? data.map((m) => m.modo_sesion) : [])
      )
      .catch(console.error);

    fetch(`${API_BASE}/catalogos/clasificacion-licitacion?p_id=-99`)
      .then((res) => res.json())
      .then((data) => setClasificaciones(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_BASE}/catalogos/fuentes-financiamiento`)
      .then((res) => res.json())
      .then((data) => setFuentes(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(
      `${API_BASE}/sesiones/entregables-popular?p_id=-99&p_id_calendario_sesiones=-99`
    )
      .then((res) => res.json())
      .then((data) => setEntregables(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // ===== Watch ente y cargar servidores =====
  React.useEffect(() => {
    const enteId = form.watch("id_ente");
    if (!enteId) {
      setServidores([]);
      setServidorSearch("");
      return;
    }
    fetch(
      `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=${enteId}`
    )
      .then((res) => res.json())
      .then((data) => setServidores(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("❌ Error cargando servidores:", err);
        setServidores([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("id_ente")]);

  // ===== Filtros =====
  const entesFiltrados = entes.filter((e) =>
    (e.descripcion || "").toLowerCase().includes(enteSearch.toLowerCase())
  );

  const servidoresFiltrados = servidores.filter((s) =>
    (s.nombre || "").toLowerCase().includes(servidorSearch.toLowerCase())
  );

// ===== Submit =====
const onSubmit = async (data: z.infer<typeof Schema>) => {
  try {
    const payload = { ...data, id_usuario: 1, activo: true };

    // 1) Crear sesión
    const resp = await fetch(`${API_BASE}/sesiones/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const sesionId: number = await resp.json(); // 👈 este ID se usa en los demás POST

    // 2) Guardar fuentes seleccionadas
    await Promise.all(
      selectedFuentes.map((fuenteId) =>
        fetch(`${API_BASE}/sesiones-fuentes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_calendario_sesiones: sesionId,
            id_fuente_financiamiento: fuenteId,
          }),
        })
      )
    );

    // 3) Guardar fechas de la sesión ✅
    await Promise.all(
      fechas.map((f) =>
        fetch(`${API_BASE}/sesiones-fechas/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_calendario_sesiones: sesionId, // 👈 como número
            fecha: f.fecha, // "YYYY-MM-DD"
            hora: f.hora,   // "HH:mm" o "HH:mm:ss"
            activo: true,
          }),
        })
      )
    );

    // 4) Guardar entregables seleccionados ✅
    await Promise.all(
      selectedEntregables.map((entregableId) =>
        fetch(`${API_BASE}/sesiones-entregables/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_calendario_sesiones: sesionId,
            id_listado_entregables: entregableId,
          }),
        })
      )
    );

    alert("✅ Sesión guardada con éxito");
    router.push("/sesiones/calendario");
  } catch (err) {
    console.error("❌ Error al guardar sesión:", err);
    alert("❌ Error al guardar sesión");
  }
};

  // ===== Toggles =====
  const toggleFuente = (id: number) => {
    setSelectedFuentes((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleEntregable = (id: number) => {
    setSelectedEntregables((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // ===== Render =====
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Nueva Sesión</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
        {/* ===== Ente público ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Ente público</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Label>Buscar ente</Label>
            <Command>
              <CommandInput
                placeholder="Escribe el nombre del ente..."
                value={enteSearch}
                onValueChange={setEnteSearch}
              />
              <CommandList>
                {enteSearch && (
                  <>
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                    <CommandGroup>
                      {entesFiltrados.map((e) => (
                        <CommandItem
                          key={e.id}
                          value={e.descripcion}
                          onSelect={() => {
                            form.setValue("id_ente", e.id, {
                              shouldValidate: true,
                            });
                            setSelectedEnte(e);
                            setEnteSearch(e.descripcion);
                          }}
                        >
                          {e.descripcion}
                          {form.watch("id_ente") === e.id && (
                            <Check className="ml-auto h-4 w-4 opacity-80" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                readOnly
                placeholder="Siglas"
                value={selectedEnte?.siglas || ""}
              />
              <Input
                readOnly
                placeholder="Clasificación"
                value={selectedEnte?.clasificacion || ""}
              />
              <Input
                readOnly
                placeholder="Tipo de ente"
                value={selectedEnte?.ente_tipo_descripcion || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== Datos generales ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Datos generales</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>No. Oficio</Label>
              <Input
                maxLength={50}
                {...form.register("oficio_o_acta_numero")}
              />
            </div>
            <div>
              <Label>Asunto</Label>
              <Input maxLength={50} {...form.register("asunto")} />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input type="date" {...form.register("fecha")} />
            </div>
          </CardContent>
        </Card>

        {/* ===== Servidor público ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Servidor público</CardTitle>
          </CardHeader>
          <CardContent>
            <Command>
              <CommandInput
                placeholder={
                  form.watch("id_ente")
                    ? "Escribe el nombre del servidor..."
                    : "Primero selecciona un ente"
                }
                value={servidorSearch}
                onValueChange={setServidorSearch}
                disabled={!form.watch("id_ente")}
              />
              <CommandList>
                {servidorSearch && form.watch("id_ente") && (
                  <>
                    <CommandEmpty>No se encontraron resultados</CommandEmpty>
                    <CommandGroup>
                      {servidoresFiltrados.map((s) => (
                        <CommandItem
                          key={s.id}
                          value={s.nombre}
                          onSelect={() => {
                            form.setValue("id_servidor_publico", s.id, {
                              shouldValidate: true,
                            });
                            setServidorSearch(s.nombre);
                          }}
                        >
                          {s.nombre} {s.cargo ? `– ${s.cargo}` : ""}
                          {form.watch("id_servidor_publico") === s.id && (
                            <Check className="ml-auto h-4 w-4 opacity-80" />
                          )}
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
          <CardHeader>
            <CardTitle>Clasificación de licitación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Descripción</Label>
              <select
                {...form.register("id_clasificacion_licitacion")}
                className="border rounded-md p-2 w-full"
                onChange={(e) => {
                  const selected = clasificaciones.find(
                    (c) => c.id.toString() === e.target.value
                  );
                  setSelectedClasificacion(selected || null);
                  form.setValue(
                    "id_clasificacion_licitacion",
                    Number(e.target.value),
                    { shouldValidate: true }
                  );
                }}
              >
                <option value="">Selecciona…</option>
                {clasificaciones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Tipo de licitación</Label>
              <Input
                readOnly
                value={selectedClasificacion?.tipo_licitacion || ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* ===== Fuentes de financiamiento ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Fuentes de financiamiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {fuentes.map((f) => (
              <label key={`fuente-${f.id}`} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFuentes.includes(f.id)}
                  onChange={() => toggleFuente(f.id)}
                />
                {f.descripcion}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* ===== Comité y Modo ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Comité y modo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Comité</Label>
              <select
                {...form.register("comite")}
                className="border rounded-md p-2 w-full"
              >
                <option value="">Selecciona…</option>
                {comites.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Modo de sesión</Label>
              <select
                {...form.register("modo_sesion")}
                className="border rounded-md p-2 w-full"
              >
                <option value="">Selecciona…</option>
                {modos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ===== Fechas de la sesión ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Fechas de la sesión</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Fecha (YYYY-MM-DD)</Label>
                <Input
                  type="date"
                  value={newFecha}
                  onChange={(e) => setNewFecha(e.target.value)}
                />
              </div>
              <div>
                <Label>Hora (HH:mm o HH:mm:ss)</Label>
                <Input
                  placeholder="HH:mm:ss"
                  value={newHora}
                  onChange={(e) => setNewHora(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={addFecha}
              className="w-fit bg-green-600 text-white"
            >
              Añadir fecha
            </Button>

            {fechas.length > 0 && (
              <ul className="mt-2 space-y-2">
                {fechas.map((f, i) => (
                  <li
                    key={`${f.fecha}-${f.hora}-${i}`}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <span>
                      {f.fecha} – {f.hora}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFecha(i)}
                    >
                      Eliminar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* ===== Entregables ===== */}
        <Card>
          <CardHeader>
            <CardTitle>Entregables</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {entregables.map((e) => (
              <label key={`ent-${e.id}`} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEntregables.includes(e.id)}
                  onChange={() => toggleEntregable(e.id)}
                />
                {e.descripcion}
              </label>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" className="w-fit bg-blue-600 text-white">
          Guardar
        </Button>
      </form>
    </main>
  );
}