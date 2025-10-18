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
} from "@/components/ui/command";
import { toast } from "sonner";

type Ente = {
  id: string;
  descripcion: string;
};

// ✅ Sustitución de getApiBase() por constante global con soporte para Render, Railway y local
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [hoy, setHoy] = React.useState("");
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [entesFiltrados, setEntesFiltrados] = React.useState<Ente[]>([]);
  const [enteSeleccionado, setEnteSeleccionado] = React.useState<Ente | null>(null);

  const [form, setForm] = React.useState({
    p_username: "",
    p_nombre: "",
    p_pass_hash: "",
    p_id_ente: "",
    p_tipo: "",
  });

  // 📆 Fecha y carga inicial
  React.useEffect(() => {
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    // Cargar entes
    const fetchEntes = async () => {
      try {
        const res = await fetch(`${API_BASE}/catalogos/entes?p_id=-99`);
        const data = await res.json();
        setEntes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error cargando entes:", err);
      }
    };

    fetchEntes();
  }, []);

  // 🔍 Filtro dinámico de entes
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

  // 💾 Envío de formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.p_id_ente || !form.p_tipo) {
      toast.warning("⚠️ Selecciona un ente válido y define el tipo de usuario.");
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/seguridad/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_username: form.p_username,
          p_nombre: form.p_nombre,
          p_pass_hash: form.p_pass_hash,
          p_id_ente: form.p_id_ente,
          p_tipo: form.p_tipo,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      toast.success("✅ Usuario creado correctamente");
      router.push("/seguridad/usuarios");
    } catch (err) {
      console.error("❌ Error al crear usuario:", err);
      toast.error("❌ Error al crear usuario");
    }
  };

  return (
    <main className="max-w-lg mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" className="cursor-pointer">
            ←
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Nuevo Usuario</h1>
            <span className="text-xs text-gray-500 capitalize">{hoy}</span>
          </div>
          <p className="text-gray-600 text-sm">
            Registra un nuevo usuario del sistema.
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
          <Label>Contraseña</Label>
          <Input
            type="password"
            value={form.p_pass_hash}
            onChange={(e) => setForm({ ...form, p_pass_hash: e.target.value })}
            required
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
                      setEntesFiltrados([]); // Limpia la lista
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

        {/* TIPO USUARIO */}
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
          Guardar Usuario
        </Button>
      </form>
    </main>
  );
}