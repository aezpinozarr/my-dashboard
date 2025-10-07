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

// ======================
// 🔹 Función universal para detectar entorno
// ======================
const getApiBase = () => {
  // 🟢 En producción (Railway), usar siempre HTTPS
  if (
    typeof window !== "undefined" &&
    window.location.hostname.includes("railway")
  ) {
    return "https://backend-licitacion-production.up.railway.app";
  }

  // 🧩 En desarrollo local
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000"
  );
};

const API_BASE = getApiBase();

// ======================
// 🔹 Tipado de datos
// ======================
type Proveedor = {
  rfc: string;
  razon_social: string;
  nombre_comercial: string;
  persona_juridica: string;
  correo_electronico: string;
  activo: boolean;
  id_entidad_federativa: number;
  entidad_federativa: string;
};

// ======================
// 🔹 Componente principal
// ======================
export default function ProveedoresPage() {
  const [proveedores, setProveedores] = React.useState<Proveedor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");

  // ======================
  // Cargar proveedores
  // ======================
  const fetchProveedores = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
      const data = await resp.json();
      setProveedores(Array.isArray(data) ? data.filter((p) => p.activo) : []);
    } catch (err) {
      console.error("❌ Error cargando proveedores:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProveedores();
  }, []);

  // ======================
  // Eliminar proveedor (inactivar)
  // ======================
  const eliminarProveedor = async (rfc: string) => {
    if (!confirm(`¿Seguro que deseas eliminar el proveedor ${rfc}?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfc }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert("🗑️ Proveedor eliminado correctamente");
      fetchProveedores();
    } catch (err) {
      console.error("❌ Error al eliminar proveedor:", err);
      alert("Error al eliminar proveedor");
    }
  };

  // ======================
  // Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" style={{ cursor: "pointer" }}>
              ←
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Proveedores</h1>
            <p className="text-gray-600 text-sm">
              Consulta, crea o edita proveedores registrados.
            </p>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards">📇 Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            asChild
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Link href="/catalogos/proveedores/new">Nuevo Proveedor</Link>
          </Button>

          <Button
            asChild
            style={{
              backgroundColor: "#db200b",
              color: "white",
              cursor: "pointer",
            }}
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : proveedores.length === 0 ? (
        <p>No hay proveedores activos</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proveedores.map((p) => (
            <Card key={p.rfc} className="shadow hover:shadow-lg transition">
              <CardHeader>
                <CardTitle>{p.razon_social}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>RFC:</strong> {p.rfc}
                </p>
                <p>
                  <strong>Nombre comercial:</strong>{" "}
                  {p.nombre_comercial || "—"}
                </p>
                <p>
                  <strong>Persona jurídica:</strong>{" "}
                  {p.persona_juridica || "—"}
                </p>
                <p>
                  <strong>Correo:</strong> {p.correo_electronico || "—"}
                </p>
                <p>
                  <strong>Entidad:</strong> {p.entidad_federativa}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    style={{
                      borderColor: "#235391",
                      color: "#235391",
                      cursor: "pointer",
                    }}
                  >
                    <Link href={`/catalogos/proveedores/edit/${p.rfc}`}>
                      ✏️ Editar
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    style={{
                      borderColor: "#db200b",
                      color: "#db200b",
                      cursor: "pointer",
                    }}
                    onClick={() => eliminarProveedor(p.rfc)}
                  >
                    🗑️ Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFC</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedores.map((p) => (
              <TableRow key={p.rfc}>
                <TableCell>{p.rfc}</TableCell>
                <TableCell>{p.razon_social}</TableCell>
                <TableCell>{p.correo_electronico}</TableCell>
                <TableCell>{p.entidad_federativa}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: "#235391",
                        color: "#235391",
                        cursor: "pointer",
                      }}
                    >
                      <Link href={`/catalogos/proveedores/edit/${p.rfc}`}>
                        ✏️ Editar
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: "#db200b",
                        color: "#db200b",
                        cursor: "pointer",
                      }}
                      onClick={() => eliminarProveedor(p.rfc)}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
