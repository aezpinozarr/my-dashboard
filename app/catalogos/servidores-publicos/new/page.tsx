"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  nombre: z.string().min(1, "Escribe el nombre del servidor público"),
  cargo: z.string().min(1, "Escribe el cargo"),
  activo: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;

export default function NuevoServidorPage() {
  const router = useRouter();
  const [hoy, setHoy] = React.useState("");

  // ======================
  // 🕒 Cargar fecha actual
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
  }, []);

  // ======================
  // 📋 Configurar formulario
  // ======================
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { nombre: "", cargo: "", activo: true },
  });

  // ======================
  // 💾 Guardar servidor público
  // ======================
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

      alert("✅ Servidor público creado correctamente");
      router.push("/catalogos/servidores-publicos");
    } catch (e: any) {
      console.error("❌ Error creando servidor:", e);
      alert(`❌ Error creando servidor:\n${e?.message ?? e}`);
    }
  };

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/catalogos/servidores-publicos">
          <Button variant="outline" className="cursor-pointer">←</Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Nuevo Servidor Público</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">Registra un nuevo servidor público del sistema.</p>
        </div>
      </div>

      {/* 🔹 FORMULARIO */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Nombre */}
        <div>
          <Label>Nombre completo</Label>
          <Input
            placeholder="Ejemplo: Juan Pérez López"
            {...form.register("nombre")}
          />
          {form.formState.errors.nombre && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.nombre.message}
            </p>
          )}
        </div>

        {/* Cargo */}
        <div>
          <Label>Cargo</Label>
          <Input
            placeholder="Ejemplo: Director de Finanzas"
            {...form.register("cargo")}
          />
          {form.formState.errors.cargo && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.cargo.message}
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
            Guardar Servidor
          </Button>
        </div>
      </form>
    </main>
  );
}