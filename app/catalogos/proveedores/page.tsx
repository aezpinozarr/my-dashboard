// 🚀 Force rebuild cache 2025-10-10
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
import { Input } from "@/components/ui/input"; // ✅ Barra de búsqueda

// ======================
// 🔹 Base de la API
// ======================
const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("railway")
    ? "https://backend-licitacion-production.up.railway.app"
    : "http://127.0.0.1:8000";

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
  const [search, setSearch] = React.useState(""); // ✅ Barra de búsqueda
  const [showDeleted, setShowDeleted] = React.useState(false); // ✅ Mostrar eliminados

  // ======================
  // Cargar proveedores
  // ======================
  const fetchProveedores = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
      const data = await resp.json();
      setProveedores(Array.isArray(data) ? data : []);
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
  // Eliminar o reactivar proveedor
  // ======================
  const toggleEstadoProveedor = async (rfc: string, activar = false) => {
    const accion = activar ? "reactivar" : "eliminar";
    if (!confirm(`¿Seguro que deseas ${accion} el proveedor ${rfc}?`)) return;

    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor`, {
        method: activar ? "PUT" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfc }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      alert(
        activar
          ? "♻️ Proveedor reactivado correctamente"
          : "🗑️ Proveedor eliminado correctamente"
      );
      fetchProveedores();
    } catch (err) {
      console.error(`❌ Error al ${accion} proveedor:`, err);
      alert(`Error al ${accion} proveedor`);
    }
  };

  // ======================
  // 🔍 Filtrar búsqueda
  // ======================
  const proveedoresFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtrados = proveedores.filter((p) =>
      showDeleted ? !p.activo : p.activo
    );

    if (!term) return filtrados;

    return filtrados.filter((p) =>
      [
        p.rfc,
        p.razon_social,
        p.nombre_comercial,
        p.correo_electronico,
        p.entidad_federativa,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    );
  }, [proveedores, search, showDeleted]);

  // ======================
  // Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
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
              Consulta, crea, edita o recupera proveedores registrados.
            </p>
          </div>
        </div>

        {/* 🔹 CONTROLES */}
        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards">📇 Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          {!showDeleted && (
            <Button
              asChild
              style={{
                backgroundColor: "#235391",
                color: "white",
                cursor: "pointer",
              }}
            >
              <Link href="/catalogos/proveedores/new">Nuevo</Link>
            </Button>
          )}

          {/* Botón eliminados (outline + hover suave) */}
          <Button
            variant="outline"
            className="cursor-pointer hover:shadow-sm transition"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? "← Volver a Activos" : "Eliminados"}
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

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 🔹 CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : proveedoresFiltrados.length === 0 ? (
        <p>
          {showDeleted
            ? "No hay proveedores eliminados"
            : "No hay proveedores activos"}
        </p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proveedoresFiltrados.map((p) => (
            <Card
              key={p.rfc}
              className="shadow hover:shadow-lg transition border border-gray-200"
            >
              <CardHeader>
                <CardTitle>{p.razon_social}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>RFC:</strong> {p.rfc}</p>
                <p><strong>Nombre comercial:</strong> {p.nombre_comercial || "—"}</p>
                <p><strong>Persona jurídica:</strong> {p.persona_juridica || "—"}</p>
                <p><strong>Correo:</strong> {p.correo_electronico || "—"}</p>
                <p><strong>Entidad:</strong> {p.entidad_federativa}</p>

                <div className="flex justify-end gap-2 pt-2">
                  {showDeleted ? (
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        borderColor: "#235391",
                        color: "#235391",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleEstadoProveedor(p.rfc, true)}
                    >
                      ♻️ Reactivar
                    </Button>
                  ) : (
                    <>
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
                        onClick={() => toggleEstadoProveedor(p.rfc)}
                      >
                        🗑️ Eliminar
                      </Button>
                    </>
                  )}
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
            {proveedoresFiltrados.map((p) => (
              <TableRow key={p.rfc}>
                <TableCell>{p.rfc}</TableCell>
                <TableCell>{p.razon_social}</TableCell>
                <TableCell>{p.correo_electronico}</TableCell>
                <TableCell>{p.entidad_federativa}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {showDeleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        style={{
                          borderColor: "#235391",
                          color: "#235391",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleEstadoProveedor(p.rfc, true)}
                      >
                        ♻️ Reactivar
                      </Button>
                    ) : (
                      <>
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
                          onClick={() => toggleEstadoProveedor(p.rfc)}
                        >
                          🗑️ Eliminar
                        </Button>
                      </>
                    )}
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