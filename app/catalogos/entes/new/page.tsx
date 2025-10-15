"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

// ======================
// 🔹 Validación con Zod
// ======================
const Schema = z.object({
  descripcion: z.string().min(1, "Escribe la descripción").max(250),
  siglas: z.string().min(1, "Escribe siglas").max(25),
  clasificacion: z.string().min(1, "Selecciona una clasificación").max(50),
  id_ente_tipo: z.string().min(1, "Selecciona el tipo de ente"),
  activo: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;

type EnteTipo = {
  id: string;
  descripcion: string;
};

const CLASIFICACIONES = [
  { value: "Centralizada", label: "Centralizada" },
  { value: "Paraestatal", label: "Paraestatal" },
  { value: "Desconcentrada", label: "Desconcentrada" },
];

export default function EnteNewPage() {
  const router = useRouter();
  const [tiposEnte, setTiposEnte] = React.useState<EnteTipo[]>([]);
  const [tiposFiltrados, setTiposFiltrados] = React.useState<EnteTipo[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = React.useState<EnteTipo | null>(null);
  const [hoy, setHoy] = React.useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      descripcion: "",
      siglas: "",
      clasificacion: "",
      id_ente_tipo: "",
      activo: true,
    },
  });

  // ======================
  // 🕒 Fecha y datos iniciales
  // ======================
  React.useEffect(() => {
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    const fetchTipos = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalogos/ente-tipo/?p_id=-99`);
        const data = await res.json();
        setTiposEnte(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error cargando tipos de ente:", err);
      }
    };

    fetchTipos();
  }, []);

  // ======================
  // 🔎 Buscar tipo de ente
  // ======================
  const handleBuscarTipo = (valor: string) => {
    if (!valor.trim()) {
      setTiposFiltrados([]);
      return;
    }
    const filtrados = tiposEnte.filter((t) =>
      t.descripcion.toLowerCase().includes(valor.toLowerCase())
    );
    setTiposFiltrados(filtrados);
  };

  // ======================
  // 💾 Guardar
  // ======================
  const onSubmit = async (data: FormValues) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) throw new Error(await resp.text());
      alert("✅ Ente creado correctamente");
      router.push("/catalogos/entes");
    } catch (e: any) {
      console.error("❌ Error creando ente:", e);
      alert(`❌ Error: ${e?.message ?? e}`);
    }
  };

  // ======================
  // 🎨 Render
  // ======================
  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/catalogos/entes">
          <Button variant="outline" className="cursor-pointer">←</Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Nuevo Ente</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">Registra un nuevo ente público.</p>
        </div>
      </div>

      {/* 🔹 FORMULARIO */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Descripción */}
        <div>
          <Label>Descripción</Label>
          <Input
            placeholder="Nombre del ente"
            {...form.register("descripcion")}
          />
          {form.formState.errors.descripcion && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.descripcion.message}
            </p>
          )}
        </div>

        {/* Siglas */}
        <div>
          <Label>Siglas</Label>
          <Input
            placeholder="Ejemplo: SEGOB, SEE..."
            {...form.register("siglas")}
          />
          {form.formState.errors.siglas && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.siglas.message}
            </p>
          )}
        </div>

        {/* Clasificación */}
        <div>
          <Label>Clasificación</Label>
          <select
            {...form.register("clasificacion")}
            className="border rounded-md p-2 w-full"
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {CLASIFICACIONES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de ente con Command */}
        <div>
          <Label>Tipo de Ente</Label>
          <Command className="border rounded-md">
            <CommandInput
              placeholder="Buscar tipo de ente..."
              onValueChange={handleBuscarTipo}
            />
            <CommandList>
              <CommandGroup heading="Coincidencias">
                {tiposFiltrados.length === 0 && (
                  <div className="p-2 text-sm text-gray-500">
                    Escribe para buscar tipos de ente
                  </div>
                )}
                {tiposFiltrados.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={t.descripcion}
                    onSelect={() => {
                      setTipoSeleccionado(t);
                      form.setValue("id_ente_tipo", t.id);
                      setTiposFiltrados([]);
                    }}
                  >
                    {t.descripcion} ({t.id})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {tipoSeleccionado && (
            <p className="text-xs text-gray-500 mt-1">
              Seleccionado: {tipoSeleccionado.descripcion} ({tipoSeleccionado.id})
            </p>
          )}
        </div>

        {/* Activo */}
        <label className="flex items-center gap-2">
          <input type="checkbox" {...form.register("activo")} defaultChecked />
          Activo
        </label>

        {/* BOTONES */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            style={{ backgroundColor: "#235391", color: "white" }}
            className="w-full"
          >
            Guardar Ente
          </Button>
        </div>
      </form>
    </main>
  );
}