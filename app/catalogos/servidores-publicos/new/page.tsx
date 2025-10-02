// app/catalogos/servidores-publicos/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

const Schema = z.object({
  nombre: z.string().min(1, "Escribe el nombre"),
  cargo: z.string().min(1, "Escribe el cargo"),
  activo: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;

export default function NewServidorPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { nombre: "", cargo: "", activo: true },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch(`${API_BASE}/catalogos/servidores-publicos/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      alert("Servidor creado ✅");
      router.push("/catalogos/servidores-publicos");
    } catch (e: any) {
      console.error("❌ Error creando servidor:", e);
      alert(`❌ Error creando servidor:\n${e?.message ?? e}`);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Servidor Público</h1>
          <p className="text-gray-600">Aquí puedes registrar un nuevo servidor público.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del servidor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <div>
              <Label>Nombre</Label>
              <Input {...form.register("nombre")} placeholder="Nombre completo" />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.nombre.message}</p>
              )}
            </div>
            <div>
              <Label>Cargo</Label>
              <Input {...form.register("cargo")} placeholder="Cargo del servidor" />
              {form.formState.errors.cargo && (
                <p className="text-sm text-red-600 mt-1">{form.formState.errors.cargo.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register("activo")} defaultChecked />
              Activo
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-[#235391] text-white">Guardar</Button>
              <Button
                type="button"
                className="bg-[#db200b] text-white"
                onClick={() => router.push("/dashboard")}
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