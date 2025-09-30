"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  X,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Cliente {
  id: number;
  nombre: string;
  edad: number;
  fecha_creacion: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]); // 👈 ahora empieza vacío
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const router = useRouter();
  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const fetchClientes = async () => {
    try {
      const resp = await fetch(`${API_BASE}/clientes`);
      if (!resp.ok) throw new Error("Error al cargar clientes");
      const data = await resp.json();
      setClientes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  // Filtrado flexible: si no hay filtros seleccionados, busca en todos los campos
  const clientesFiltrados = search
    ? clientes.filter((c) => {
        const campos = activeFilters.length > 0
          ? activeFilters
          : ["id", "nombre", "edad", "fecha_creacion"];
        return campos.some((f) => {
          const valor = String(c[f as keyof Cliente]).toLowerCase();
          return valor.includes(search.toLowerCase());
        });
      })
    : clientes;

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lista de clientes</h1>
        <div className="flex gap-2">
          {/* Botón para cambiar vista */}
          <Button
            onClick={() => setView(view === "cards" ? "table" : "cards")}
            style={{ backgroundColor: "#154c79", color: "white" }}
            className="cursor-pointer transition-transform active:scale-95 hover:brightness-110"
          >
            {view === "cards" ? (
              <>
                <TableIcon className="mr-2 size-4" />
                Ver en Tabla
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 size-4" />
                Ver en Cards
              </>
            )}
          </Button>

          {/* Botón nuevo cliente */}
          <Button
            onClick={() => router.push("/clientes/new")}
            style={{ backgroundColor: "#0bdb12", color: "black" }}
            className="cursor-pointer transition-transform active:scale-95 hover:brightness-110"
          >
            <Plus className="mr-2 size-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda + botón de filtros */}
      <div className="flex gap-2 relative">
        <Input
          placeholder={`Buscar en: ${
            activeFilters.length > 0
              ? activeFilters.join(", ")
              : "todos los campos"
          }`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Botón Filtros */}
        <Button
          variant="outline"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className="flex items-center gap-1 cursor-pointer transition-transform active:scale-95 hover:brightness-110"
        >
          Filtros <ChevronDown className="size-4" />
        </Button>

        {showFilterMenu && (
          <div className="absolute top-full right-0 mt-1 w-48 rounded-md border bg-white shadow-md z-10 p-2">
            {["id", "nombre", "edad", "fecha_creacion"].map((f) => (
              <label
                key={f}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 rounded"
              >
                <input
                  type="checkbox"
                  checked={activeFilters.includes(f)}
                  onChange={() => toggleFilter(f)}
                />
                {f === "fecha_creacion"
                  ? "Fecha de creación"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Filtros activos */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-full text-sm"
            >
              {f === "fecha_creacion"
                ? "Fecha de creación"
                : f.charAt(0).toUpperCase() + f.slice(1)}
              <button
                onClick={() => toggleFilter(f)}
                className="text-gray-600 hover:text-black"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Vista dinámica */}
      {view === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientesFiltrados.map((c) => (
            <Card
              key={c.id}
              className="cursor-pointer hover:shadow-md transition"
            >
              <CardHeader className="flex items-center justify-between">
                <CardTitle>
                  {c.id} - {c.nombre}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/clientes/${c.id}/edit`)}
                    >
                      <Pencil className="mr-2 size-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (confirm("¿Seguro que deseas eliminar este cliente?")) {
                          await fetch(`${API_BASE}/clientes/${c.id}`, {
                            method: "DELETE",
                          });
                          fetchClientes();
                        }
                      }}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 size-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <p>Edad: {c.edad}</p>
                <p className="text-sm text-gray-500">
                  Creado el: {new Date(c.fecha_creacion).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Nombre</th>
                <th className="border p-2 text-left">Edad</th>
                <th className="border p-2 text-left">Fecha de Creación</th>
                <th className="border p-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="border p-2">{c.id}</td>
                  <td className="border p-2">{c.nombre}</td>
                  <td className="border p-2">{c.edad}</td>
                  <td className="border p-2">
                    {new Date(c.fecha_creacion).toLocaleString()}
                  </td>
                  <td className="border p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/clientes/${c.id}/edit`)}
                        >
                          <Pencil className="mr-2 size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            if (
                              confirm("¿Seguro que deseas eliminar este cliente?")
                            ) {
                              await fetch(`${API_BASE}/clientes/${c.id}`, {
                                method: "DELETE",
                              });
                              fetchClientes();
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 size-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}