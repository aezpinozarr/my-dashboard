"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

export default function EditarRubroPage() {
  const { id } = useParams();
  const router = useRouter();
  const [descripcion, setDescripcion] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRubro = async () => {
      const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=${id}`);
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        setDescripcion(data[0].descripcion);
      }
      setLoading(false);
    };
    fetchRubro();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, descripcion }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert("✅ Rubro actualizado correctamente");
      router.push("/catalogos/rubros");
    } catch (err) {
      console.error("❌ Error al actualizar:", err);
      alert("Error al actualizar el rubro");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Editar Rubro</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <Input value={id as string} disabled />
        <Input
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />
        <div className="flex justify-between">
          <Button
            type="submit"
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: "pointer",
            }}
          >
            Guardar Cambios
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