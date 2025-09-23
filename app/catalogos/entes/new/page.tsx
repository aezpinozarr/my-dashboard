"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const Schema = z.object({
  label: z.string().min(1, "Escribe el nombre del ente"),
  tipo: z.string().min(1, "Escribe las siglas (p. ej., SEC)").max(10),
  tipoNombre: z.string().min(1, "Escribe el tipo (p. ej., Secretaría)"),
  sector: z.string().min(1, "Escribe el sector (p. ej., Público)"),
});

type FormData = z.infer<typeof Schema>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewEntePage() {
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { label: "", tipo: "", tipoNombre: "", sector: "" },
  });

  const onSubmit = (data: FormData) => {
    const key = "catalogo-entes";
    const list = JSON.parse(localStorage.getItem(key) || "[]") as any[];

    const value = slugify(data.label || data.tipo || crypto.randomUUID());

    if (list.some((e) => e?.value === value)) {
      alert("⚠️ Ya existe un ente con ese identificador (value). Cambia el nombre.");
      return;
    }

    const nuevo = {
      value,
      label: data.label.trim(),
      tipo: data.tipo.trim(),
      tipoNombre: data.tipoNombre.trim(),
      sector: data.sector.trim(),
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      key,
      JSON.stringify([...(Array.isArray(list) ? list : []), nuevo])
    );

    alert("✅ Ente guardado.");
    router.push("/catalogos/entes");
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Nuevo ente
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Registra un ente público para usarlo en tus formularios.
      </p>

      <Separator className="my-4" />

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Datos del ente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Nombre del ente</Label>
              <Input id="label" placeholder="E.j: Secretaría de Educación" {...form.register("label")} />
              {form.formState.errors.label && (
                <p className="text-sm text-red-500">{form.formState.errors.label.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Siglas</Label>
                <Input id="tipo" placeholder="SEC" {...form.register("tipo")} />
                {form.formState.errors.tipo && (
                  <p className="text-sm text-red-500">{form.formState.errors.tipo.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipoNombre">Tipo</Label>
                <Input id="tipoNombre" placeholder="Secretaría" {...form.register("tipoNombre")} />
                {form.formState.errors.tipoNombre && (
                  <p className="text-sm text-red-500">{form.formState.errors.tipoNombre.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sector">Sector</Label>
                <Input id="sector" placeholder="Público" {...form.register("sector")} />
                {form.formState.errors.sector && (
                  <p className="text-sm text-red-500">{form.formState.errors.sector.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={() => router.push("/catalogos/entes")}
            style={{ backgroundColor: "#ee0000", color: "white" }}
            className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="mr-2 size-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: "#154c79", color: "white" }}
            className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Save className="mr-2 size-4" />
            Guardar
          </Button>
        </div>
      </form>
    </main>
  );
}