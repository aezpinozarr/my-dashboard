"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

type Servidor = {
  id: number;
  nombre: string;
  cargo: string;
  activo: boolean;
  id_ente: string;
  ente_publico: string;
  ente_siglas: string;
  ente_clasificacion: string;
};

export default function ServidoresPage() {
  const [servidores, setServidores] = React.useState<Servidor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");

  const fetchServidores = async () => {
    try {
      const resp = await fetch(
        `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=-99`
      );
      const data = await resp.json();
      setServidores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando servidores:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchServidores();
  }, []);

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Título y regreso */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline">←</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Servidores Públicos</h1>
            <p className="text-gray-600 text-sm">
              Consulta de servidores públicos y sus entes asociados
            </p>
          </div>
        </div>

        {/* Controles derechos */}
        <div className="flex items-center gap-4">
          {/* Vista tipo cards / tabla */}
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "cards" | "table")}
          >
            <TabsList>
              <TabsTrigger value="cards">📇 Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 🔵 Botón de vincular (sin ente preseleccionado) */}
          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
          >
            {/* ✅ Llevamos a la ruta base para seleccionar servidor */}
            <Link href="/catalogos/servidores-publicos-ente/vincular/0">
              Vincular Servidores
            </Link>
          </Button>

          {/* 🔴 Botón de salir */}
          <Button
            asChild
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <p>Cargando...</p>
      ) : servidores.length === 0 ? (
        <p>No hay servidores registrados</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servidores.map((s, index) => (
            <Card key={`${s.id}-${index}`} className="shadow hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {s.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Cargo:</strong> {s.cargo || "—"}</p>
                <p><strong>Activo:</strong> {s.activo ? "✅" : "❌"}</p>
                <p><strong>Ente:</strong> {s.ente_publico}</p>
                <p><strong>Siglas:</strong> {s.ente_siglas}</p>
                <p><strong>Clasificación:</strong> {s.ente_clasificacion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Ente</TableHead>
              <TableHead>Siglas</TableHead>
              <TableHead>Clasificación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servidores.map((s, index) => (
              <TableRow key={`${s.id}-${index}`}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.nombre}</TableCell>
                <TableCell>{s.cargo}</TableCell>
                <TableCell>{s.activo ? "✅" : "❌"}</TableCell>
                <TableCell>{s.ente_publico}</TableCell>
                <TableCell>{s.ente_siglas}</TableCell>
                <TableCell>{s.ente_clasificacion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}