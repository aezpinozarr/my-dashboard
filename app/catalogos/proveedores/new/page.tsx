"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://127.0.0.1:8000";

type Entidad = {
  id: number;
  descripcion: string;
};

export default function NuevoProveedorPage() {
  const router = useRouter();

  const [rfc, setRfc] = React.useState("");
  const [razonSocial, setRazonSocial] = React.useState("");
  const [nombreComercial, setNombreComercial] = React.useState("");
  const [personaJuridica, setPersonaJuridica] = React.useState("");
  const [correo, setCorreo] = React.useState("");

  const [entidades, setEntidades] = React.useState<Entidad[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedEntidad, setSelectedEntidad] = React.useState<Entidad | null>(null);

  const [loading, setLoading] = React.useState(false);

  // Cargar entidades
  React.useEffect(() => {
    const fetchEntidades = async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/entidad-federativa?p_id=-99`);
        const data = await resp.json();
        if (Array.isArray(data)) setEntidades(data);
      } catch (err) {
        console.error("❌ Error cargando entidades:", err);
      }
    };
    fetchEntidades();
  }, []);

  // Guardar proveedor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntidad) {
      alert("⚠️ Debes seleccionar una entidad federativa.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfc,
          razon_social: razonSocial,
          nombre_comercial: nombreComercial ?? "",
          persona_juridica: personaJuridica ?? "",
          correo_electronico: correo ?? "",
          id_entidad_federativa: selectedEntidad.id,
          entidad_federativa: selectedEntidad.descripcion ?? "",
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());

      alert("✅ Proveedor creado correctamente");
      router.push("/catalogos/proveedores");
    } catch (err) {
      console.error("❌ Error al crear proveedor:", err);
      alert("Error al crear proveedor");
    } finally {
      setLoading(false);
    }
  };

  const resultados = entidades.filter((e) =>
    e.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Proveedor</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="RFC"
          value={rfc}
          onChange={(e) => setRfc(e.target.value.toUpperCase())}
          required
        />

        <Input
          placeholder="Razón social"
          value={razonSocial}
          onChange={(e) => setRazonSocial(e.target.value)}
          required
        />

        <Input
          placeholder="Nombre comercial (opcional)"
          value={nombreComercial}
          onChange={(e) => setNombreComercial(e.target.value)}
        />

        <Input
          placeholder="Persona jurídica (opcional)"
          value={personaJuridica}
          onChange={(e) => setPersonaJuridica(e.target.value)}
        />

        <Input
          placeholder="Correo electrónico (opcional)"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />

        {/* Command para entidad federativa */}
        <div>
          <label className="text-gray-700 text-sm font-medium">
            Entidad Federativa
          </label>
          <Command className="border rounded-md mt-1">
            <CommandInput
              placeholder="Escribe para buscar..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-48 overflow-y-auto">
              {search.trim() === "" ? (
                <div className="p-2 text-sm text-gray-500">
                  Escribe para ver resultados...
                </div>
              ) : resultados.length > 0 ? (
                resultados.map((e) => (
                  <CommandItem
                    key={e.id}
                    onSelect={() => {
                      setSelectedEntidad(e);
                      setSearch(e.descripcion);
                    }}
                    className="cursor-pointer"
                  >
                    {e.descripcion}
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty>No se encontraron resultados</CommandEmpty>
              )}
            </CommandList>
          </Command>

          {selectedEntidad && (
            <p className="text-sm text-gray-500 mt-1">
              Seleccionado: <strong>{selectedEntidad.descripcion}</strong> (ID:{" "}
              {selectedEntidad.id})
            </p>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Guardar
          </Button>

          <Button asChild variant="outline" style={{ cursor: "pointer" }}>
            <Link href="/catalogos/proveedores">Cancelar</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}