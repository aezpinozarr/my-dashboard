"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE =
  typeof window !== "undefined" && window.location.hostname.includes("railway")
    ? "https://backend-licitacion-production.up.railway.app"
    : "http://127.0.0.1:8000";

export default function DetalleProcesoPage() {
  const params = useParams();
  const id = params?.id;
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/procesos/seguimiento/detalle/?p_id=${id}`);
        const json = await res.json();
        if (json?.datos?.length > 0) {
          setData(json.datos);
        }
      } catch (error) {
        console.error("❌ Error al cargar detalle:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (!data) return <p className="text-center mt-10">No se encontraron datos.</p>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {data.map((registro: any, index: number) => (
  <div key={`${registro.id}-${index}`}>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Detalle del Proceso #{registro.id}
            </h1>
            <Link href="/procesos">
              <Button variant="outline" style={{ cursor: "pointer" }}>← Volver</Button>
            </Link>
          </div>

          {/* 🏛️ INFORMACIÓN DEL ENTE */}
          <Card key={`ente-${registro.id}`}>
            <CardHeader>
              <CardTitle>🏛️ Información del Ente</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>Ente:</strong> {registro.ente}</p>
              <p><strong>Clasificación:</strong> {registro.ente_clasificacion}</p>
              <p><strong>Tipo:</strong> {registro.id_ente_tipo}</p>
              <p><strong>Oficio invitación:</strong> {registro.e_oficio_invitacion}</p>
              <p><strong>Servidor público emite:</strong> {registro.servidor_publico_emite}</p>
              <p><strong>Cargo:</strong> {registro.e_servidor_publico_cargo}</p>
              <p><strong>Tipo de evento:</strong> {registro.e_tipo_evento}</p>
              <p><strong>Tipo de licitación:</strong> {registro.e_tipo_licitacion}</p>
              <p><strong>No. de veces:</strong> {registro.e_tipo_licitacion_no_veces}</p>
              <p><strong>Descripción:</strong> {registro.tipo_licitacion_no_veces_descripcion}</p>
              <p><strong>Fecha reunión:</strong> {registro.e_fecha_y_hora_reunion}</p>
              <p><strong>Estatus:</strong> {registro.r_estatus}</p>
            </CardContent>
          </Card>

          {/* 💰 PRESUPUESTO */}
          <Card key={`presupuesto-${registro.id}`}>
            <CardHeader>
              <CardTitle>💰 Presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>No. requisición:</strong> {registro.e_no_requisicion}</p>
              <p><strong>Partida:</strong> {registro.partida}</p>
              <p><strong>Capítulo:</strong> {registro.capitulo}</p>
              <p><strong>Clasificación:</strong> {registro.clasificacion}</p>
              <p><strong>Tipo de gasto:</strong> {registro.tipo_gasto}</p>
              <p><strong>Monto presupuestal:</strong> ${registro.e_monto_presupuesto_suficiencia?.toLocaleString()}</p>
            </CardContent>
          </Card>

          {/* 📦 RUBRO */}
          <Card key={`rubro-${registro.id}`}>
            <CardHeader>
              <CardTitle>📦 Rubro</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>Rubro:</strong> {registro.rubro}</p>
              <p><strong>Monto suficiencia rubro:</strong> ${registro.rubro_monto_presupuesto_suficiencia?.toLocaleString()}</p>
              <p><strong>Estatus:</strong> {registro.estatus}</p>
            </CardContent>
          </Card>

          {/* 🧾 PROVEEDOR */}
          <Card key={`proveedor-${registro.id}`}>
            <CardHeader>
              <CardTitle>🧾 Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>RFC:</strong> {registro.e_rfc_proveedor || "NO ASIGNADO"}</p>
              <p><strong>Importe sin IVA:</strong> {registro.e_importe_sin_iva ? `$${registro.e_importe_sin_iva.toLocaleString()}` : "—"}</p>
              <p><strong>Importe total:</strong> {registro.e_importe_total ? `$${registro.e_importe_total.toLocaleString()}` : "—"}</p>
              <p><strong>Estatus proveedor:</strong> {registro.estatus_proveedor || "—"}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </main>
  );
}