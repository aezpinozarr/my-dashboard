"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Cliente {
  id: number;
  nombre: string;
  edad: number;
  fecha_creacion: string;
}

export default function EditClientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id; // id del cliente
  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");

  // === Traer cliente existente ===
  useEffect(() => {
    if (!id) return;
    const fetchCliente = async () => {
      try {
        const resp = await fetch(`${API_BASE}/clientes/${id}`);
        if (!resp.ok) throw new Error("Error al obtener cliente");
        const data = await resp.json();
        setCliente(data);
        setNombre(data.nombre);
        setEdad(data.edad);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCliente();
  }, [id, API_BASE]);

  // === Guardar cambios ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resp = await fetch(`${API_BASE}/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, edad }),
      });
      if (!resp.ok) throw new Error("Error al actualizar cliente");
      await resp.json();
      router.push("/clientes"); // regresar a la lista
    } catch (err) {
      console.error(err);
    }
  };

  if (!cliente) return <p className="p-6">Cargando cliente...</p>;

  return (
    <main className="mx-auto w-full max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Cliente</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Edad</label>
          <Input
            type="number"
            value={edad}
            onChange={(e) =>
              setEdad(e.target.value === "" ? "" : Number(e.target.value))
            }
            required
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            style={{ backgroundColor: "#154c79", color: "white" }}
            className="cursor-pointer transition-transform active:scale-95 hover:brightness-110"
          >
            Guardar Cambios
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/clientes")}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}