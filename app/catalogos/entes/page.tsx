// app/catalogos/entes/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

type Ente = {
  id: string;
  descripcion: string;
  siglas: string;
  clasificacion: string;
  id_ente_tipo: string;
  ente_tipo_descripcion: string;
  activo: boolean;
};

export default function EntesPage() {
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchEntes = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes`);
      const data = await resp.json();
      setEntes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando entes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres eliminar este ente?")) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes/${id}`, {
        method: "DELETE",
      });

      if (!resp.ok) throw new Error(await resp.text());

      alert("✅ Ente eliminado con éxito");
      fetchEntes(); // recargar lista
    } catch (err) {
      console.error("❌ Error eliminando ente:", err);
      alert("❌ Error eliminando ente");
    }
  };

  React.useEffect(() => {
    fetchEntes();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-2xl hover:text-blue-600">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Entes registrados</h1>
            <p className="text-gray-600 text-sm">
              Aquí puedes consultar, crear, editar y eliminar entes.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
          >
            <Link href="/catalogos/entes/new">➕ Nuevo ente</Link>
          </Button>

          <Button asChild style={{ backgroundColor: "#db200b", color: "white" }}>
            <Link href="/dashboard">↩️ Salir</Link>
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Siglas</TableHead>
            <TableHead>Clasificación</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7}>Cargando...</TableCell>
            </TableRow>
          ) : entes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7}>No hay entes registrados</TableCell>
            </TableRow>
          ) : (
            entes.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.id}</TableCell>
                <TableCell>{e.descripcion}</TableCell>
                <TableCell>{e.siglas}</TableCell>
                <TableCell>{e.clasificacion}</TableCell>
                <TableCell>{e.ente_tipo_descripcion}</TableCell>
                <TableCell>{e.activo ? "✅" : "❌"}</TableCell>
                <TableCell>
                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/catalogos/entes/edit/${e.id}`}>
                          ✏️ Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(e.id)}
                        className="text-red-600"
                      >
                        🗑️ Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </main>
  );
}