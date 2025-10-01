// app/catalogos/entes/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

// ======================
// Validación con Zod
// ======================
const Schema = z.object({
  descripcion: z.string().min(1, "Escribe la descripción").max(250),
  siglas: z.string().min(1, "Escribe siglas").max(25),
  clasificacion: z.string().min(1, "Selecciona una clasificación").max(50),
  id_ente_tipo: z
    .string()
    .min(1, "Selecciona el tipo de ente")
    .max(5, "Solo códigos de hasta 5 caracteres"),
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

 // Cargar tipos de ente desde el backend
React.useEffect(() => {
  fetch(`${API_BASE}/catalogos/ente-tipo/?p_id=-99`)
    .then((res) => res.json())
    .then((data) => {
      console.log("Tipos ente cargados:", data); // 👈 Verifica en consola
      setTiposEnte(Array.isArray(data) ? data : []);
    })
    .catch((err) => {
      console.error("❌ Error cargando tipos de ente:", err);
      setTiposEnte([]);
    });
}, []);

  const onSubmit = async (data: FormValues) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText);
      }

      alert("✅ Ente creado con éxito");
      router.push("/catalogos/entes");
    } catch (e: any) {
      console.error("❌ Error creando ente:", e);
      alert(`❌ Error creando ente:\n${e?.message ?? e}`);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Encabezado + acciones */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nuevo ente</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Salir al menú</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/catalogos/entes">Ver entes</Link>
          </Button>
        </div>
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
            {/* Descripción */}
            <div>
              <Label>Descripción</Label>
              <Input
                {...form.register("descripcion")}
                placeholder="Nombre del ente"
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
                {...form.register("siglas")}
                placeholder="p. ej. SEGOB, SEE..."
                maxLength={25}
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

            {/* Tipo de ente */}
            <div>
              <Label>Tipo de ente</Label>
              <select
                {...form.register("id_ente_tipo")}
                className="border rounded-md p-2 w-full"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona…
                </option>
                {tiposEnte.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.descripcion} ({t.id})
                  </option>
                ))}
              </select>
              {form.formState.errors.id_ente_tipo && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.id_ente_tipo.message}
                </p>
              )}
            </div>

            {/* Activo */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...form.register("activo")}
                defaultChecked
              />
              Activo
            </label>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="bg-blue-600 text-white">
                Guardar
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
