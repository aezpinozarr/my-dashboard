"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

export default function NuevoRubroPage() {
  const router = useRouter();
  const [id, setId] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
      alert("❌ Error al crear rubro");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Rubro</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="ID del rubro"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
        />
        <Input
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />
        <div className="flex justify-between">
          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Guardar
          </Button>
          <Button
            asChild
            variant="outline"
            style={{ cursor: "pointer" }}
          >
            <Link href="/catalogos/rubros">Cancelar</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}