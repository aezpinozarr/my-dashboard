// app/catalogos/servidores-publicos/new/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

/* =========================
   Tipos y utilidades
   ========================= */

type Ente = {
  value: string;      // id/slug único del ente
  label: string;      // nombre del ente
  tipo: string;
  tipoNombre: string;
  sector: string;
  createdAt?: string;
};

type Servidor = {
  value: string;       // id/slug único del servidor
  label: string;       // nombre del servidor
  enteValue: string;   // referencia al 'value' del ente
  enteLabel: string;   // nombre del ente
  createdAt: string;
};

const SCHEMA = z.object({
  nombre: z.string().min(1, "Escribe el nombre completo"),
  enteValue: z.string().min(1, "Selecciona el ente público"),
});

type FormData = z.infer<typeof SCHEMA>;

function readEntes(): Ente[] {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("catalogo-entes")
        : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function readServidores(): Servidor[] {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("catalogo-presidentes")
        : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeServidores(list: Servidor[]) {
  localStorage.setItem("catalogo-presidentes", JSON.stringify(list));
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================
   Página
   ========================= */

export default function NewServidorPublicoPage() {
  const router = useRouter();

  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [enteSearch, setEnteSearch] = React.useState("");

  React.useEffect(() => {
    setEntes(readEntes());
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      nombre: "",
      enteValue: "",
    },
  });

  const enteValue = form.watch("enteValue");
  const enteSeleccionado = entes.find((e) => e.value === enteValue);

  const onSubmit = (data: FormData) => {
    const now = new Date().toISOString();
    const servidores = readServidores();

    // Generar 'value' único
    let base = slugify(data.nombre);
    if (!base) base = `srv-${Date.now()}`;
    let unique = base;
    let i = 1;
    while (servidores.some((s) => s.value === unique)) {
      unique = `${base}-${i++}`;
    }

    const nuevo: Servidor = {
      value: unique,
      label: data.nombre.trim(),
      enteValue: data.enteValue,
      enteLabel: enteSeleccionado?.label ?? "",
      createdAt: now,
    };

    writeServidores([...servidores, nuevo]);

    alert(`✅ Servidor público creado.\nNombre: ${nuevo.label}\nEnte: ${nuevo.enteLabel}`);
    router.push("/catalogos/servidores-publicos");
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      {/* Encabezado con volver */}
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
          Nuevo servidor público (Presidente)
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Registra un nuevo presidente y asígnalo a un ente público.
      </p>

      <Separator className="my-4" />

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Datos del servidor público</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="Ej. María Gómez"
                {...form.register("nombre")}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-500">{form.formState.errors.nombre.message}</p>
              )}
            </div>

            {/* Ente (Command) */}
            <div className="grid gap-2">
              <Label>Ente público</Label>
              <Command>
                <CommandInput
                  placeholder="Escribe para buscar ente…"
                  value={enteSearch}
                  onValueChange={setEnteSearch}
                />
                <CommandList>
                  {enteSearch && (
                    <>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup>
                        {entes
                          .filter((e) =>
                            [e.label, e.tipo, e.tipoNombre, e.sector]
                              .join(" ")
                              .toLowerCase()
                              .includes(enteSearch.toLowerCase())
                          )
                          .map((item) => (
                            <CommandItem
                              key={item.value}
                              value={item.label}
                              onSelect={() => {
                                form.setValue("enteValue", item.value, { shouldValidate: true });
                                setEnteSearch(item.label);
                              }}
                            >
                              {item.label}
                              {form.watch("enteValue") === item.value && (
                                <Check className="ml-auto h-4 w-4 opacity-80" />
                              )}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
              {form.formState.errors.enteValue && (
                <p className="text-sm text-red-500">{form.formState.errors.enteValue.message}</p>
              )}

              {/* Metadatos del ente seleccionado (solo lectura) */}
              {enteSeleccionado && (
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Input readOnly value={enteSeleccionado.tipo} className="cursor-not-allowed bg-muted/50" />
                  <Input readOnly value={enteSeleccionado.tipoNombre} className="cursor-not-allowed bg-muted/50" />
                  <Input readOnly value={enteSeleccionado.sector} className="cursor-not-allowed bg-muted/50" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            onClick={() => router.back()}
            style={{ backgroundColor: "#ee0000", color: "white" }}
            className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="mr-2 size-4" /> Cancelar
          </Button>
          <Button
            type="submit"
            style={{ backgroundColor: "#154c79", color: "white" }}
            className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Save className="mr-2 size-4" /> Guardar
          </Button>
        </div>
      </form>
    </main>
  );
}