"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ==========================
//  Validación con Zod
// ==========================
const ClienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  edad: z.coerce.number().min(0, "La edad debe ser un número positivo"),
});

type ClienteForm = z.infer<typeof ClienteSchema>;

export default function NewClientePage() {
  const router = useRouter();
  const [mensaje, setMensaje] = React.useState<string>("");

  const form = useForm<ClienteForm>({
    resolver: zodResolver(ClienteSchema),
    defaultValues: {
      nombre: "",
      edad: 0,
    },
  });

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  // ==========================
  //  Guardar cliente
  // ==========================
  const onSubmit = async (data: ClienteForm) => {
    try {
      const resp = await fetch(`${API_BASE}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || "Error al crear cliente");
      }

      const nuevo = await resp.json();
      setMensaje(`✅ Cliente creado con ID: ${nuevo.id}`);
      form.reset();
    } catch (err: any) {
      console.error(err);
      setMensaje("❌ Error al guardar cliente");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Nuevo Cliente
        </h1>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Ingresa los datos del cliente y guárdalos en la base de datos.
      </p>

      <Separator className="my-4" />

      <Card>
        <CardHeader>
          <CardTitle>Formulario</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-6"
            noValidate
          >
            {/* Nombre */}
            <div className="grid gap-2">
              <Label>Nombre</Label>
              <Input
                {...form.register("nombre")}
                placeholder="Escribe el nombre"
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
                {...form.register("edad", { valueAsNumber: true })}
                placeholder="Ejemplo: 25"
              />
              {form.formState.errors.edad && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.edad.message}
                </p>
              )}
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end">
              <Button
                type="submit"
                style={{ backgroundColor: "#154c79", color: "white" }}
                className="cursor-pointer hover:opacity-90"
              >
                <Save className="mr-2 size-4" /> Guardar
              </Button>
            </div>
          </form>

          {mensaje && (
            <p className="mt-4 text-sm font-medium text-blue-600">{mensaje}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}