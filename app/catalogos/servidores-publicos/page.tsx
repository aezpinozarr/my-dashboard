"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react"; // ✅ Ícono de flecha

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

type ServidorPublico = {
  id: number;
  nombre: string;
  cargo: string;
  activo: boolean;
};

export default function ServidoresPage() {
  const [servidores, setServidores] = React.useState<ServidorPublico[]>([]);
  const router = useRouter();

  const fetchData = async () => {
    const res = await fetch(`${API_BASE}/catalogos/servidores-publicos?p_id=-99`);
    const data = await res.json();

    // ✅ Mostrar solo los servidores activos
    const activos = Array.isArray(data)
      ? data.filter((s: ServidorPublico) => s.activo)
      : [];
    setServidores(activos);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este servidor público?")) return;
    const res = await fetch(`${API_BASE}/catalogos/servidores-publicos/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      alert("Servidor eliminado ✅");
      fetchData(); // recarga la lista y ya no mostrará los inactivos
    } else {
      alert("❌ Error eliminando servidor");
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        {/* 🔙 Flecha con icono */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Servidores Públicos</h1>
            <p className="text-gray-600">
              Aquí puedes consultar y gestionar los servidores públicos
            </p>
          </div>
        </div>

        {/* Botones de acciones */}
        <div className="flex gap-2">
          <Button asChild className="bg-[#235391] text-white">
            <Link href="/catalogos/servidores-publicos/new">Nuevo Servidor Público</Link>
          </Button>
          <Button
            className="bg-[#db200b] text-white"
            onClick={() => router.push("/dashboard")}
          >
            Salir
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de servidores</CardTitle>
        </CardHeader>
        <CardContent>
          {servidores.length === 0 ? (
            <p className="text-gray-500">No hay servidores registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servidores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.id}</TableCell>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.cargo}</TableCell>
                    <TableCell>{s.activo ? "✅ Sí" : "❌ No"}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/catalogos/servidores-publicos/edit/${s.id}`)
                        }
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(s.id)}
                      >
                        🗑️ Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}