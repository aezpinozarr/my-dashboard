"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import { useUser } from "@/context/UserContext"; // ✅ Importamos el contexto del usuario

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type Registro = {
  id: number;
  id_proceso_seguimiento: number;
  ente: string;
  ente_clasificacion: string;
  id_ente_tipo: string;
  partida: string;
  capitulo: string;
  clasificacion: string;
  tipo_gasto: string;
  rubro: string;
  e_monto_presupuesto_suficiencia: number;
  e_rfc_proveedor: string | null;
  e_importe_total: number | null;
  estatus: string;
};

export default function DetallePresupuestoPage() {
  const { user } = useUser(); // ✅ obtenemos datos del usuario logueado
  const [registros, setRegistros] = React.useState<Registro[]>([]);
  const [view, setView] = React.useState<"table" | "cards">("cards");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
  const fetchData = async () => {
    try {
      if (!user) return;

      let url = `${API_BASE}/procesos/seguimiento/presupuesto-proveedor/all`;

      // ✅ Si es ENTE, usa el nuevo endpoint by-ente
      if ((user.tipo || user.tipo_usuario)?.toUpperCase() === "ENTE" && user.id_ente) {
        url = `${API_BASE}/procesos/seguimiento/presupuesto-proveedor/by-ente?p_id_ente=${Number(user.id_ente)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setRegistros(data.resultado || []);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user]);

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
            <h1 className="text-2xl font-bold">
              Detalle Presupuesto — Proveedores
            </h1>
            <p className="text-gray-600 text-sm">
              Consulta todos los datos presupuestales registrados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="cards">🏛️ Tarjetas</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            asChild
            style={{ backgroundColor: "#235391", color: "white" }}
          >
            <Link href="/procesos/new">Nuevo</Link>
          </Button>

          <Button
            asChild
            style={{ backgroundColor: "#db200b", color: "white" }}
          >
            <Link href="/dashboard">Salir</Link>
          </Button>
        </div>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : registros.length === 0 ? (
        <p>No hay registros disponibles.</p>
      ) : view === "table" ? (
        // =======================
        // 🧾 VISTA TABLA
        // =======================
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Proceso</TableHead>
              <TableHead>Ente</TableHead>
              <TableHead>Clasificación Ente</TableHead>
              <TableHead>Tipo Ente</TableHead>
              <TableHead>Partida</TableHead>
              <TableHead>Rubro</TableHead>
              <TableHead>Tipo Gasto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Importe Total</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((r, index) => (
              <TableRow key={`${r.id}-${r.id_proceso_seguimiento}-${r.e_rfc_proveedor || "NA"}-${index}`}>
                <TableCell>
                  <Link className="text-blue-700 underline" href={`/procesos/view/${r.id_proceso_seguimiento}`}>
                    {r.id_proceso_seguimiento}
                  </Link>
                </TableCell>
                <TableCell>{r.ente}</TableCell>
                <TableCell>{r.ente_clasificacion}</TableCell>
                <TableCell>{r.id_ente_tipo}</TableCell>
                <TableCell>{r.partida || "—"}</TableCell>
                <TableCell>{r.rubro || "—"}</TableCell>
                <TableCell>
                  {r.tipo_gasto || "—"}
                </TableCell>
                <TableCell>
                  {r.e_monto_presupuesto_suficiencia
                    ? `$${r.e_monto_presupuesto_suficiencia.toLocaleString()}`
                    : "$0"}
                </TableCell>
                <TableCell>
                  {r.e_rfc_proveedor ? r.e_rfc_proveedor : "NO ASIGNADO"}
                </TableCell>
                <TableCell>
                  {r.e_importe_total !== null && r.e_importe_total !== undefined
                    ? `$${r.e_importe_total.toLocaleString()}`
                    : "—"}
                </TableCell>
                <TableCell>{r.estatus}</TableCell>
                <TableCell>
                  <Link href={`/procesos/view/${r.id_proceso_seguimiento}`}>
                    <Button variant="outline" style={{ cursor: "pointer" }}>Ver detalle</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        // =======================
        // 💳 VISTA TARJETAS
        // =======================
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {registros.map((r, index) => (
            <Card
              key={`${r.id}-${r.id_proceso_seguimiento}-${r.e_rfc_proveedor || "NA"}-${index}`}
              className="shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">
                  {r.ente}{" "}
                  <span className="text-gray-500">({r.ente_clasificacion})</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>ID Proceso:</strong> {r.id_proceso_seguimiento}
                </p>
                <p>
                  <strong>Tipo Ente:</strong> {r.id_ente_tipo}
                </p>
                <p>
                  <strong>Partida:</strong> {r.partida || "—"}
                </p>
                <p>
                  <strong>Rubro:</strong> {r.rubro || "—"}
                </p>
                <p>
                  <strong>Tipo Gasto:</strong>{" "}
                  {r.tipo_gasto || "—"}
                </p>
                <p>
                  <strong>Monto:</strong>{" "}
                  {r.e_monto_presupuesto_suficiencia
                    ? `$${r.e_monto_presupuesto_suficiencia.toLocaleString()}`
                    : "$0"}
                </p>
                <p>
                  <strong>Proveedor:</strong>{" "}
                  {r.e_rfc_proveedor ? r.e_rfc_proveedor : "NO ASIGNADO"}
                </p>
                <p>
                  <strong>Importe Total:</strong>{" "}
                  {r.e_importe_total !== null && r.e_importe_total !== undefined
                    ? `$${r.e_importe_total.toLocaleString()}`
                    : "—"}
                </p>
                <p>
                  <strong>Estatus:</strong> {r.estatus}
                </p>
                <div className="pt-2">
                  <Link href={`/procesos/view/${r.id_proceso_seguimiento}`}>
                    <Button variant="outline" style={{ cursor: "pointer" }}>Ver detalle</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}