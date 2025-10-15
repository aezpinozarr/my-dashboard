"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function NuevoRubroPage() {
  const router = useRouter();
  const [id, setId] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [hoy, setHoy] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
  // 💾 Guardar Rubro
  // ======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, descripcion }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      alert("✅ Rubro creado correctamente");
      router.push("/catalogos/rubros");
    } catch (err) {
      console.error("❌ Error al crear rubro:", err);
      alert("❌ Error al crear rubro");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/catalogos/rubros">
          <Button variant="outline" className="cursor-pointer">←</Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Nuevo Rubro</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">Registra un nuevo rubro presupuestal.</p>
        </div>
      </div>

      {/* 🔹 FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID */}
        <div>
          <Label>ID del Rubro</Label>
          <Input
            placeholder="Ejemplo: 101"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <Label>Descripción</Label>
          <Input
            placeholder="Nombre o descripción del rubro"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        </div>

        {/* BOTONES */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            className="w-full"
          >
            {loading ? "Guardando..." : "Guardar Rubro"}
          </Button>
        </div>
      </form>
    </main>
  );
}