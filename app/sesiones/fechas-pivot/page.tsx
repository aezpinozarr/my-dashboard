// app/sesiones/calendario/pivot/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type SesionPivot = {
  id: number;
  id_calendario_sesiones: number;
  id_ente: string;
  descripcion: string;
  licitacion_clasificacion: string;
  licitacion_tipo: string;
  ENE: string | null;
  FEB: string | null;
  MAR: string | null;
  ABR: string | null;
  MAY: string | null;
  JUN: string | null;
  JUL: string | null;
  AGO: string | null;
  SEP: string | null;
  OCT: string | null;
  NOV: string | null;
  DIC: string | null;
};

type Ente = { id: string; descripcion: string };
type Clasificacion = { id: number; descripcion: string };

export default function PivotPage() {
  const router = useRouter();
  const [sesiones, setSesiones] = React.useState<SesionPivot[]>([]);
  const [loading, setLoading] = React.useState(true);

  // filtros
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [clasificaciones, setClasificaciones] = React.useState<Clasificacion[]>([]);
  const [selectedEnte, setSelectedEnte] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState(""); 
  const [selectedClasificacion, setSelectedClasificacion] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedEnte) params.append("p_id_ente", selectedEnte);
      if (selectedClasificacion) params.append("p_id_clasificacion_licitacion", selectedClasificacion);

      const url = `${API_BASE}/sesiones-fechas-pivot/${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setSesiones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando pivot:", err);
    } finally {
      setLoading(false);
    }
  };

  // cargar catálogos
  React.useEffect(() => {
    fetch(`${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99`)
      .then((res) => res.json())
      .then((data) => setEntes(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_BASE}/catalogos/clasificacion-licitacion?p_id=-99`)
      .then((res) => res.json())
      .then((data) => setClasificaciones(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetchData();
  }, []);

  // recargar cuando cambian filtros
  React.useEffect(() => {
    fetchData();
  }, [selectedEnte, selectedClasificacion]);

  return (
    <main className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard">← Regresar</Link>
          </Button>
          <h1 className="text-2xl font-bold">Sesiones – Fechas Pivot</h1>
        </div>
        <Button style={{ backgroundColor: "#db200b", color: "white" }} asChild>
          <Link href="/dashboard">Salir</Link>
        </Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Command para ente */}
        <div>
          <label className="font-semibold text-sm">Ente</label>
          <div className="relative">
            <Command className="border rounded-md">
              <CommandInput
                placeholder="Buscar ente..."
                className="p-2 w-full"
                value={searchTerm}
                onValueChange={(value) => {
                  setSearchTerm(value);
                  if (value.trim() === "") {
                    setSelectedEnte("");
                    setShowSuggestions(false);
                  } else {
                    setShowSuggestions(true);
                  }
                }}
              />
              {showSuggestions && searchTerm.trim() !== "" && (
                <CommandList className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-y-auto shadow">
                  {entes
                    .filter((e) =>
                      e.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((e) => (
                      <CommandItem
                        key={e.id}
                        onSelect={() => {
                          setSelectedEnte(e.id);
                          setSearchTerm(e.descripcion);
                          setShowSuggestions(false); // cierra lista
                        }}
                        className={`cursor-pointer px-2 py-1 ${
                          selectedEnte === e.id ? "bg-blue-100" : ""
                        }`}
                      >
                        {e.descripcion}
                      </CommandItem>
                    ))}
                </CommandList>
              )}
            </Command>
          </div>
        </div>

        {/* Select normal para clasificación */}
        <div>
          <label className="font-semibold text-sm">Clasificación</label>
          <select
            className="border p-2 rounded w-full"
            value={selectedClasificacion}
            onChange={(e) => setSelectedClasificacion(e.target.value)}
          >
            <option value="">Todas</option>
            {clasificaciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descripcion}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p>Cargando...</p>
      ) : sesiones.length === 0 ? (
        <p>No hay resultados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-300 w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">ID</th>
                <th className="border px-2 py-1">Calendario</th>
                <th className="border px-2 py-1">Ente</th>
                <th className="border px-2 py-1">Descripción</th>
                <th className="border px-2 py-1">Clasificación</th>
                <th className="border px-2 py-1">Tipo</th>
                {["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"].map((mes) => (
                  <th key={mes} className="border px-2 py-1">{mes}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id}>
                  <td className="border px-2 py-1">{s.id}</td>
                  <td className="border px-2 py-1">{s.id_calendario_sesiones}</td>
                  <td className="border px-2 py-1">{s.id_ente}</td>
                  <td className="border px-2 py-1">{s.descripcion}</td>
                  <td className="border px-2 py-1">{s.licitacion_clasificacion}</td>
                  <td className="border px-2 py-1">{s.licitacion_tipo}</td>
                  {["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"].map((mes) => (
                    <td key={mes} className="border px-2 py-1">
                      {s[mes as keyof SesionPivot]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}