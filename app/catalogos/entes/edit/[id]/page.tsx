// app/catalogos/entes/edit/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

const CLASIFICACIONES = [
  { value: "Centralizada", label: "Centralizada" },
  { value: "Paraestatal", label: "Paraestatal" },
  { value: "Desconcentrada", label: "Desconcentrada" },
];

// Este select se llenará desde el endpoint de ente-tipo
type TipoEnte = { id: string; descripcion: string };

const Schema = z.object({
  descripcion: z.string().min(1, "Escribe la descripción").max(250),
  siglas: z.string().min(1, "Escribe siglas").max(25),
  clasificacion: z.string().min(1).max(50),
  id_ente_tipo: z.string().min(1).max(5),
  activo: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;

export default function EditEntePage() {
  const params = useParams();
  const enteId = params?.id as string;
  const router = useRouter();

  const [tiposEnte, setTiposEnte] = React.useState<TipoEnte[]>([]);
  const [loading, setLoading] = React.useState(true);

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

  // Cargar datos actuales del ente + catálogos
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [resEnte, resTipos] = await Promise.all([
          fetch(`${API_BASE}/catalogos/entes?p_id=${enteId}&p_descripcion=-99`),
          fetch(`${API_BASE}/catalogos/ente-tipo?p_id=-99`),
        ]);

        const dataEnte = await resEnte.json();
        const dataTipos = await resTipos.json();

        setTiposEnte(Array.isArray(dataTipos) ? dataTipos : []);

        if (dataEnte && dataEnte.length > 0) {
          const e = dataEnte[0];
          form.reset({
            descripcion: e.descripcion,
            siglas: e.siglas,
            clasificacion: e.clasificacion,
            id_ente_tipo: e.id_ente_tipo,
            activo: e.activo,
          });
        }
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [enteId, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes/${enteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      alert("✅ Ente actualizado con éxito");
      router.push("/catalogos/entes");
    } catch (e: any) {
      console.error("❌ Error editando ente:", e);
      alert(`❌ Error editando ente:\n${e?.message ?? e}`);
    }
  };

  if (loading) {
    return <p className="p-6">Cargando...</p>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editar ente</h1>
        <Button variant="outline" asChild>
          <Link href="/catalogos/entes">↩️ Volver</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del ente</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-5"
            noValidate
          >
            <div>
              <Label>Descripción</Label>
              <Input {...form.register("descripcion")} />
            </div>

            <div>
              <Label>Siglas</Label>
              <Input {...form.register("siglas")} />
            </div>

            <div>
              <Label>Clasificación</Label>
              <select
                {...form.register("clasificacion")}
                className="border p-2 rounded w-full"
                defaultValue={form.watch("clasificacion") || ""}
              >
                <option value="">Selecciona…</option>
                {CLASIFICACIONES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Tipo de ente</Label>
              <select
                {...form.register("id_ente_tipo")}
                className="border p-2 rounded w-full"
                defaultValue={form.watch("id_ente_tipo") || ""}
              >
                <option value="">Selecciona…</option>
                {tiposEnte.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.descripcion} ({t.id})
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("activo")} />
              Activo
            </label>

            <div className="flex gap-3 pt-3">
              <Button type="submit" className="bg-blue-600 text-white">
                Guardar cambios
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/catalogos/entes">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}