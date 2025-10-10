"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input"; // ✅ Barra de búsqueda
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // ✅ Menú de opciones
import { MoreHorizontal } from "lucide-react"; // Ícono “...”

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
  const [search, setSearch] = React.useState(""); // ✅ Estado de búsqueda
  const router = useRouter();

  // ======================
  // Cargar servidores públicos
  // ======================
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

  // ======================
  // 🔍 Filtro de búsqueda
  // ======================
  const servidoresFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return servidores;
    return servidores.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.cargo.toLowerCase().includes(term) ||
        s.ente_publico.toLowerCase().includes(term) ||
        s.ente_siglas.toLowerCase().includes(term) ||
        s.ente_clasificacion.toLowerCase().includes(term) ||
        s.id.toString().includes(term)
    );
  }, [servidores, search]);

  // ======================
  // 🔗 Función de vincular
  // ======================
  const handleVincular = (id: number) => {
    router.push(`/catalogos/servidores-publicos-ente/vincular/${id}`);
  };

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
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
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "cards" | "table")}
          >
            <TabsList>
              <TabsTrigger value="cards">📇 Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 🔴 Botón de salir */}
          <Button
            asChild
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
        </div>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por nombre, cargo o ente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 🔹 CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : servidoresFiltrados.length === 0 ? (
        <p>No hay servidores registrados</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servidoresFiltrados.map((s, index) => (
            <Card
              key={`${s.id}-${index}`}
              className="shadow hover:shadow-lg transition"
            >
              <CardHeader className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">
                  {s.nombre}
                </CardTitle>

                {/* ⚙️ Menú de opciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-100 rounded-full"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer text-sm"
                      onClick={() => handleVincular(s.id)}
                    >
                      Vincular
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Cargo:</strong> {s.cargo || "—"}
                </p>
                <p>
                  <strong>Activo:</strong> {s.activo ? "✅" : "❌"}
                </p>
                <p>
                  <strong>Ente:</strong> {s.ente_publico}
                </p>
                <p>
                  <strong>Siglas:</strong> {s.ente_siglas}
                </p>
                <p>
                  <strong>Clasificación:</strong> {s.ente_clasificacion}
                </p>
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
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servidoresFiltrados.map((s, index) => (
              <TableRow key={`${s.id}-${index}`}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.nombre}</TableCell>
                <TableCell>{s.cargo}</TableCell>
                <TableCell>{s.activo ? "✅" : "❌"}</TableCell>
                <TableCell>{s.ente_publico}</TableCell>
                <TableCell>{s.ente_siglas}</TableCell>
                <TableCell>{s.ente_clasificacion}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVincular(s.id)}
                    className="cursor-pointer"
                    style={{
                      borderColor: "#235391",
                      color: "#235391",
                    }}
                  >
                    Vincular
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}