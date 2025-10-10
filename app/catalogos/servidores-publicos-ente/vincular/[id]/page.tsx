"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

type Servidor = {
  id: number;
  nombre: string;
  cargo: string;
  activo: boolean;
};

type Ente = {
  id: string;
  descripcion: string;
};

export default function VincularPage() {
  const { id } = useParams();
  const router = useRouter();

  const [servidores, setServidores] = React.useState<Servidor[]>([]);
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [selectedServidor, setSelectedServidor] = React.useState<Servidor | null>(null);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  // =========================
  // 🔹 Cargar servidores y entes
  // =========================
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [servResp, entResp] = await Promise.all([
          fetch(`${API_BASE}/catalogos/servidores-publicos?p_id=-99`),
          fetch(`${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99`),
        ]);

        const servData = await servResp.json();
        const entData = await entResp.json();

        const servidoresList = Array.isArray(servData) ? servData : [];
        setServidores(servidoresList);
        setEntes(Array.isArray(entData) ? entData : []);

        // ✅ Si venimos con un ID en la URL, seleccionar automáticamente
        const idNum = Number(id);
        if (!isNaN(idNum) && idNum > 0) {
          const servidorAuto = servidoresList.find((s) => s.id === idNum);
          if (servidorAuto) {
            setSelectedServidor(servidorAuto);
          }
        }
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // =========================
  // 🔹 Vincular servidor con ente
  // =========================
  const vincular = async (enteId: string) => {
    if (!selectedServidor) return alert("Selecciona primero un servidor público");

    try {
      const resp = await fetch(`${API_BASE}/catalogos/ente-servidor-publico/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_ente: enteId,
          id_servidor_publico: selectedServidor.id,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      alert(`✅ Vinculación exitosa con el ente ${enteId}`);
      router.push("/catalogos/servidores-publicos-ente");
    } catch (err) {
      console.error("❌ Error al vincular:", err);
      alert("Error al vincular servidor");
    }
  };

  if (loading) return <p className="p-6">Cargando...</p>;

  // =========================
  // 🔹 Render principal
  // =========================
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      {/* 🔹 Encabezado */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vincular Servidor Público</h1>
        <Button asChild variant="outline">
          <Link href="/catalogos/servidores-publicos-ente">↩️ Volver</Link>
        </Button>
      </div>

      {/* 🔹 Si ya viene un ID, saltar selección y mostrar búsqueda directamente */}
      {selectedServidor ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">
              Vincular{" "}
              <span className="text-blue-600">{selectedServidor.nombre}</span>{" "}
              con un ente:
            </h2>
            <Button variant="outline" onClick={() => setSelectedServidor(null)}>
              ← Cambiar servidor
            </Button>
          </div>

          <Card className="border border-gray-200 shadow-sm mt-4 max-w-xl mx-auto">
            <CardContent className="p-4 space-y-3">
              <p className="text-gray-600 text-sm mb-2">
                Escribe para buscar el ente al que deseas vincular:
              </p>

              <Command className="rounded-md border border-gray-300 shadow-sm bg-white">
                <CommandInput
                  placeholder="Buscar ente..."
                  value={search}
                  onValueChange={setSearch}
                  className="border-none outline-none ring-0 focus:ring-0 focus:outline-none focus:border-none px-3 py-2 text-sm w-full placeholder-gray-400 bg-transparent"
                />

                {/* Muestra opciones solo al escribir */}
                {search.trim() !== "" && (
                  <CommandList className="max-h-56 overflow-y-auto mt-1 rounded-md border border-gray-200 shadow-lg bg-white animate-in fade-in-0 slide-in-from-top-1">
                    {entes
                      .filter((e) =>
                        e.descripcion.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((e) => (
                        <CommandItem
                          key={e.id}
                          onSelect={() => vincular(e.id)}
                          className="cursor-pointer px-3 py-2 hover:bg-blue-50 transition-colors text-sm"
                        >
                          {e.descripcion}
                        </CommandItem>
                      ))}

                    {entes.filter((e) =>
                      e.descripcion.toLowerCase().includes(search.toLowerCase())
                    ).length === 0 && (
                      <CommandEmpty className="px-3 py-2 text-gray-500 text-sm">
                        No se encontraron entes
                      </CommandEmpty>
                    )}
                  </CommandList>
                )}
              </Command>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* 🔹 Si no hay ID, mostrar lista para seleccionar */}
          <h2 className="text-lg font-semibold text-gray-700">
            Selecciona el servidor que deseas vincular:
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {servidores.map((s) => (
              <Card
                key={s.id}
                className="hover:shadow-md cursor-pointer transition-all"
                onClick={() => setSelectedServidor(s)}
              >
                <CardHeader>
                  <CardTitle>{s.nombre}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>
                    <strong>Cargo:</strong> {s.cargo || "—"}
                  </p>
                  <p>
                    <strong>Activo:</strong> {s.activo ? "✅" : "❌"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}