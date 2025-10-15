"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type Rubro = {
  id: string;
  descripcion: string;
  activo: boolean;
};

export default function RubrosEliminadosPage() {
  const [rubros, setRubros] = React.useState<Rubro[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRubros = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro?p_id=-99`);
      const data = await resp.json();
      setRubros(data.filter((r: Rubro) => !r.activo));
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const recuperar = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/rubro/recuperar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert("✅ Rubro recuperado");
      fetchRubros();
    } catch (err) {
      alert("Error al recuperar");
    }
  };

  React.useEffect(() => {
    fetchRubros();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Rubros Eliminados</h1>
        <Button asChild variant="outline">
          <Link href="/catalogos/rubros">↩️ Volver</Link>
        </Button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : rubros.length === 0 ? (
        <p>No hay rubros eliminados</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rubros.map((r) => (
            <Card key={r.id} className="shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>{r.descripcion}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-gray-500">ID: {r.id}</p>
                <Button
                  onClick={() => recuperar(r.id)}
                  size="sm"
                  style={{ backgroundColor: "#235391", color: "white" }}
                >
                  🔄 Recuperar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}