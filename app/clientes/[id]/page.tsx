// app/clientes/[id]/page.tsx
"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

type Cliente = {
  id: number;
  nombre: string;
  edad: number;
  fecha_creacion: string;
};

export default function ClienteDetailPage() {
  const { id } = useParams(); // obtiene el id de la URL
  const router = useRouter();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const resp = await fetch(`${API_BASE}/clientes/${id}`);
        if (!resp.ok) throw new Error("Error al obtener cliente");
        const data = await resp.json();
        setCliente(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCliente();
  }, [id, API_BASE]);

  return (
    <main className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold sm:text-2xl">
          Detalle de cliente
        </h1>
      </div>

      <Separator className="my-4" />

      {loading && <p className="text-muted-foreground">Cargando...</p>}

      {!loading && !cliente && (
        <p className="text-red-500">❌ Cliente no encontrado.</p>
      )}

      {cliente && (
        <Card>
          <CardHeader>
            <CardTitle>{cliente.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p>
              <strong>ID:</strong> {cliente.id}
            </p>
            <p>
              <strong>Edad:</strong> {cliente.edad}
            </p>
            <p>
              <strong>Fecha de creación:</strong>{" "}
              {new Date(cliente.fecha_creacion).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}