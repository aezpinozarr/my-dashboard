"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";

type Ente = { id: string; descripcion: string };

const getApiBase = (): string => {
  if (typeof window === "undefined") return "";
  if (window.location.hostname.includes("railway.app"))
    return "https://backend-licitacion-production.up.railway.app";
  if (window.location.protocol === "https:")
    return "https://127.0.0.1:8000";
  return "http://127.0.0.1:8000";
};

export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const idNum = Number(idParam);

  const [apiBase, setApiBase] = React.useState("");
  const [hoy, setHoy] = React.useState("");
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [entesFiltrados, setEntesFiltrados] = React.useState<Ente[]>([]);
  const [enteSeleccionado, setEnteSeleccionado] = React.useState<Ente | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [form, setForm] = React.useState({
    p_id: idNum,
    p_username: "",
    p_nombre: "",
    p_pass_hash: "",
    p_id_ente: "",
    p_tipo: "",
  });

  // Inicializa API base y fecha
  React.useEffect(() => {
    const base = getApiBase();
    setApiBase(base);
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    const fetchData = async () => {
      try {
        const [resUser, resEntes] = await Promise.all([
          fetch(`${base}/seguridad/usuarios/${idNum}/`),
          fetch(`${base}/catalogos/entes?p_id=-99`),
        ]);

        if (!resUser.ok) throw new Error("Error al obtener usuario");
        if (!resEntes.ok) throw new Error("Error al obtener entes");

        const dataUser = await resUser.json();
        const dataEntes = await resEntes.json();

        setEntes(Array.isArray(dataEntes) ? dataEntes : []);

        // Inicializar valores del formulario
        setForm({
          p_id: dataUser?.id || idNum,
          p_username: dataUser?.username || "",
          p_nombre: dataUser?.nombre || "",
          p_pass_hash: "",
          p_id_ente: dataUser?.id_ente || "",
          p_tipo: dataUser?.tipo || "",
        });

        const enteEncontrado = dataEntes.find((e: Ente) => e.id === dataUser?.id_ente);
        if (enteEncontrado) setEnteSeleccionado(enteEncontrado);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        alert("Error al cargar datos del usuario");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idNum]);

  // Filtro dinámico para entes
  const handleBuscarEnte = (valor: string) => {
    if (!valor.trim()) {
      setEntesFiltrados([]);
      return;
    }
    const filtrados = entes.filter((e) =>
      e.descripcion.toLowerCase().includes(valor.toLowerCase())
    );
    setEntesFiltrados(filtrados);
  };

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.p_id_ente || !form.p_tipo) {
      alert("Selecciona un ente válido y define el tipo de usuario.");
      return;
    }

    try {
      const resp = await fetch(`${apiBase}/seguridad/usuarios/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      alert("✅ Usuario actualizado correctamente");
      router.push("/seguridad/usuarios");
    } catch (err) {
      console.error("❌ Error al actualizar usuario:", err);
      alert("Error al actualizar usuario");
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando usuario...</p>;

  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/seguridad/usuarios">
          <Button variant="outline" className="cursor-pointer">
            ←
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Editar Usuario #{idNum}</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">
            Modifica la información del usuario seleccionado.
          </p>
        </div>
      </div>

      {/* FORMULARIO */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Usuario</Label>
          <Input
            value={form.p_username}
            onChange={(e) => setForm({ ...form, p_username: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Nombre completo</Label>
          <Input
            value={form.p_nombre}
            onChange={(e) => setForm({ ...form, p_nombre: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Nueva contraseña</Label>
          <Input
            type="password"
            value={form.p_pass_hash}
            onChange={(e) => setForm({ ...form, p_pass_hash: e.target.value })}
            placeholder="(Déjalo vacío si no la cambiarás)"
          />
        </div>

        {/* COMMAND DE ENTE */}
        <div>
          <Label>Selecciona Ente</Label>
          <Command className="border rounded-md">
            <CommandInput
              placeholder="Escribe para buscar..."
              onValueChange={handleBuscarEnte}
            />
            <CommandList>
              <CommandGroup heading="Coincidencias">
                {entesFiltrados.length === 0 && (
                  <div className="p-2 text-sm text-gray-500">
                    Escribe para buscar entes
                  </div>
                )}
                {entesFiltrados.map((e) => (
                  <CommandItem
                    key={e.id}
                    value={e.descripcion}
                    onSelect={() => {
                      setEnteSeleccionado(e);
                      setForm({ ...form, p_id_ente: e.id });
                      setEntesFiltrados([]);
                    }}
                  >
                    {e.descripcion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {enteSeleccionado && (
            <p className="text-xs text-gray-500 mt-1">
              Seleccionado: {enteSeleccionado.descripcion}
            </p>
          )}
        </div>

        {/* TIPO DE USUARIO */}
        <div>
          <Label>Tipo de usuario</Label>
          <Input
            placeholder="Ejemplo: ENTE o RECTOR"
            value={form.p_tipo}
            onChange={(e) =>
              setForm({ ...form, p_tipo: e.target.value.toUpperCase() })
            }
            required
          />
        </div>

        <Button
          type="submit"
          style={{ backgroundColor: "#235391", color: "white" }}
          className="w-full"
        >
          Guardar Cambios
        </Button>
      </form>
    </main>
  );
}