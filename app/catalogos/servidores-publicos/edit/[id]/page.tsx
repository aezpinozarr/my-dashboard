"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

// ==========================
// Validación con Zod
// ==========================
const Schema = z.object({
  id: z.number().optional(),
  nombre: z.string().min(1, "Escribe el nombre"),
  cargo: z.string().min(1, "Escribe el cargo"),
  activo: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;

export default function EditServidorPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { id, nombre: "", cargo: "", activo: true },
  });

  // Cargar datos del servidor
  React.useEffect(() => {
    fetch(`${API_BASE}/catalogos/servidores-publicos?p_id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]) {
          form.reset({
            id: data[0].id,
            nombre: data[0].nombre,
            cargo: data[0].cargo,
            activo: data[0].activo,
          });
        }
      });
  }, [id]);

  // Guardar cambios (PUT)
  const onSubmit = async (data: FormValues) => {
    const res = await fetch(`${API_BASE}/catalogos/servidores-publicos/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        nombre: data.nombre,
        cargo: data.cargo,
        activo: data.activo,
      }),
    });

    if (res.ok) {
      alert("Servidor actualizado ✅");
      router.push("/catalogos/servidores-publicos"); // 🔙 Redirige al listado
    } else {
      const errText = await res.text();
      alert("❌ Error actualizando servidor:\n" + errText);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        {/* 🔙 Flecha que regresa al listado */}
        <Button variant="ghost" onClick={() => router.push("/catalogos/servidores-publicos")}>
          ←
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Servidor Público</h1>
          <p className="text-gray-600">
            Aquí puedes modificar la información del servidor público
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar datos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div>
              <Label>Nombre</Label>
              <Input {...form.register("nombre")} placeholder="Nombre completo" />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input {...form.register("cargo")} placeholder="Cargo del servidor" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("activo")} /> Activo
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#235391] text-white">
                Guardar
              </Button>
              <Button
                type="button"
                className="bg-[#db200b] text-white"
                onClick={() => router.push("/catalogos/servidores-publicos")}
              >
                Salir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}