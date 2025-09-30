"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

/* =========================
   Validación con Zod
   ========================= */
const Schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  edad: z
    .number({ invalid_type_error: "La edad debe ser un número" })
    .min(1, "Debe ser mayor que 0"),
});

export default function NewClientePage() {
  const router = useRouter();

  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      nombre: "",
      edad: undefined,
    },
  });

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const onSubmit = async (data: z.infer<typeof Schema>) => {
    try {
      const resp = await fetch(`${API_BASE}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        throw new Error(txt || "Error al guardar en backend");
      }

      const saved = await resp.json();
      alert(`✅ Cliente creado con éxito`);

      form.reset();
      router.push("/clientes"); // redirige al listado
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo guardar el cliente.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" type="button" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Nuevo cliente
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Completa los datos del cliente y guarda para registrarlo en la base de datos.
      </p>

      <Separator className="my-4" />

      {/* Formulario */}
      <form
        id="cliente-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-6"
        noValidate
      >
        <Card>
          <CardHeader>
            <CardTitle>Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                placeholder="Nombre del cliente"
                {...form.register("nombre")}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            {/* Edad */}
            <div className="grid gap-2">
              <Label>Edad</Label>
              <Input
                type="number"
                placeholder="Edad"
                {...form.register("edad", { valueAsNumber: true })}
              />
              {form.formState.errors.edad && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.edad.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={() => router.push("/dashboard")}
            style={{ backgroundColor: "black", color: "white" }}
          >
            <LogOut className="mr-2 size-4" />
            Salir
          </Button>

          <Button
            type="submit"
            style={{ backgroundColor: "#0bdb12", color: "black" }}
          >
            <Save className="mr-2 size-4" />
            Guardar
          </Button>
        </div>
      </form>
    </main>
    
  );
}