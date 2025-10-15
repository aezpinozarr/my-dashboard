"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

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
  const [hoy, setHoy] = React.useState("");

  // ======================
  // 🕒 Cargar fecha actual y entidades
  // ======================
  React.useEffect(() => {
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

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

  // ======================
  // 💾 Guardar Proveedor
  // ======================
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
      alert("❌ Error al crear proveedor");
    } finally {
      setLoading(false);
    }
  };

  const resultados = entidades.filter((e) =>
    e.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/catalogos/proveedores">
          <Button variant="outline" className="cursor-pointer">←</Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Nuevo Proveedor</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">Registra un nuevo proveedor en el sistema.</p>
        </div>
      </div>

      {/* 🔹 FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* RFC */}
        <div>
          <Label>RFC</Label>
          <Input
            placeholder="Ejemplo: ABC123456T78"
            value={rfc}
            onChange={(e) => setRfc(e.target.value.toUpperCase())}
            required
          />
        </div>

        {/* Razón Social */}
        <div>
          <Label>Razón Social</Label>
          <Input
            placeholder="Nombre legal de la empresa"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            required
          />
        </div>

        {/* Nombre Comercial */}
        <div>
          <Label>Nombre Comercial (opcional)</Label>
          <Input
            placeholder="Nombre con el que opera la empresa"
            value={nombreComercial}
            onChange={(e) => setNombreComercial(e.target.value)}
          />
        </div>

        {/* Persona Jurídica */}
        <div>
          <Label>Persona Jurídica (opcional)</Label>
          <Input
            placeholder="Ejemplo: S.A. de C.V., S.C., etc."
            value={personaJuridica}
            onChange={(e) => setPersonaJuridica(e.target.value)}
          />
        </div>

        {/* Correo Electrónico */}
        <div>
          <Label>Correo Electrónico (opcional)</Label>
          <Input
            type="email"
            placeholder="correo@ejemplo.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        {/* ENTIDAD FEDERATIVA */}
        <div>
          <Label>Entidad Federativa</Label>
          <Command className="border rounded-md">
            <CommandInput
              placeholder="Buscar entidad..."
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
            <p className="text-xs text-gray-500 mt-1">
              Seleccionado: {selectedEntidad.descripcion} (ID: {selectedEntidad.id})
            </p>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            className="w-full"
          >
            {loading ? "Guardando..." : "Guardar Proveedor"}
          </Button>
        </div>
      </form>
    </main>
  );
}