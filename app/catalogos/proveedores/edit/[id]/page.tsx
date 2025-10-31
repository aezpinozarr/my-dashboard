"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";

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

export default function EditarProveedorPage() {
  const router = useRouter();
  const { id } = useParams(); // RFC

  const [razonSocial, setRazonSocial] = React.useState("");
  const [nombreComercial, setNombreComercial] = React.useState("");
  const [personaJuridica, setPersonaJuridica] = React.useState("");
  const [correo, setCorreo] = React.useState("");

  const [entidades, setEntidades] = React.useState<Entidad[]>([]);
  const [selectedEntidad, setSelectedEntidad] = React.useState<Entidad | null>(null);
  const [search, setSearch] = React.useState("");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

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

  // Cargar proveedor
  React.useEffect(() => {
    const fetchProveedor = async () => {
      try {
        const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=${id}`);
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          const p = data[0];
          setRazonSocial(p.razon_social || "");
          setNombreComercial(p.nombre_comercial || "");
          setPersonaJuridica(p.persona_juridica || "");
          setCorreo(p.correo_electronico || "");
          setSelectedEntidad({
            id: p.id_entidad_federativa,
            descripcion: p.entidad_federativa,
          });
        }
      } catch (err) {
        console.error("❌ Error cargando proveedor:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProveedor();
  }, [id]);

  // Actualizar
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntidad) {
      toast.warning("Debes seleccionar una entidad federativa.");
      return;
    }

    setSaving(true);
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfc: id,
          razon_social: razonSocial,
          nombre_comercial: nombreComercial ?? "",
          persona_juridica: personaJuridica ?? "",
          correo_electronico: correo ?? "",
          id_entidad_federativa: selectedEntidad.id,
          entidad_federativa: selectedEntidad.descripcion ?? "",
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      toast.success("Proveedor actualizado correctamente.");
      router.push("/catalogos/proveedores");
    } catch (err) {
      console.error("❌ Error al actualizar proveedor:", err);
      toast.error("Error al actualizar proveedor.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center mt-6">Cargando...</p>;

  const resultados = entidades.filter((e) =>
    e.descripcion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Editar Proveedor</h1>

      <form onSubmit={handleUpdate} className="space-y-4">
        <Input value={String(id)} disabled />
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
            disabled={saving}
            style={{
              backgroundColor: "#235391",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Guardar Cambios
          </Button>

          <Button asChild variant="outline" style={{ cursor: "pointer" }}>
            <Link href="/catalogos/proveedores">Cancelar</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}