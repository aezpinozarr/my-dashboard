"use client";

import * as React from "react";
import { VisibilityState } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Input
} from "@/components/ui/input"; // ✅ Barra de búsqueda
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // ✅ Menú de opciones
import { MoreHorizontal, List, LayoutGrid } from "lucide-react"; // Ícono “...”
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { DataTable } from "@/components/shared/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type Servidor = {
  id: number;
  nombre: string;
  cargo: string;
  activo: boolean;
  id_ente: string;
  ente_publico: string;
  ente_siglas: string;
  ente_clasificacion: string;
};

type Ente = {
  id: number;
  nombre: string;
  siglas: string;
  clasificacion: string;
  descripcion?: string;
};

export default function ServidoresPage() {
  const [servidores, setServidores] = React.useState<Servidor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [search, setSearch] = React.useState(""); // ✅ Estado de búsqueda
  const [tableInstance, setTableInstance] = React.useState<any>(null);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const router = useRouter();

  const [openVincular, setOpenVincular] = React.useState(false);
  const [selectedServidor, setSelectedServidor] = React.useState<Servidor | null>(null);
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [searchEnte, setSearchEnte] = React.useState("");
  const [loadingEntes, setLoadingEntes] = React.useState(false);

  // ======================
  // Cargar servidores públicos
  // ======================
  const fetchServidores = async () => {
    try {
      // 🔹 Ahora consulta todos los servidores (asociados o no)
      const resp = await fetch(
        `${API_BASE}/catalogos/servidores-publicos-ente/todos`
      );
      const data = await resp.json();
      setServidores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando servidores:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchServidores();
  }, []);

  // ======================
  // Cargar todos los entes públicos
  // ======================
  const fetchEntes = async () => {
    setLoadingEntes(true);
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entes?p_id=-99&p_descripcion=-99`);
      const data = await resp.json();
      setEntes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando entes:", err);
      setEntes([]);
    } finally {
      setLoadingEntes(false);
    }
  };

  // ======================
  // Vincular servidor a ente
  // ======================
  const vincularServidor = async (id_ente: number) => {
    if (!selectedServidor) return;
    try {
      const resp = await fetch(`${API_BASE}/catalogos/ente-servidor-publico/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_ente,
          id_servidor_publico: selectedServidor.id,
        }),
      });
      if (!resp.ok) {
        throw new Error("Error al vincular");
      }
      // Actualizar lista de servidores para reflejar el cambio
      fetchServidores();
      setOpenVincular(false);
      setSelectedServidor(null);
      setSearchEnte("");
      const enteVinculado = entes.find((e) => e.id === id_ente);
      toast.success(" Vinculación exitosa con el ente " + (enteVinculado?.descripcion || id_ente));
    } catch (err) {
      console.error("Error vinculando servidor:", err);
      toast.error("Error al vincular servidor");
    }
  };

  // ======================
  // 🔍 Filtro de búsqueda
  // ======================
  const servidoresFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return servidores;
    return servidores.filter(
      (s) =>
        s.nombre.toLowerCase().includes(term) ||
        s.cargo.toLowerCase().includes(term) ||
        s.ente_publico?.toLowerCase().includes(term) ||
        s.ente_siglas?.toLowerCase().includes(term) ||
        s.ente_clasificacion?.toLowerCase().includes(term) ||
        s.id.toString().includes(term)
    );
  }, [servidores, search]);

  // ======================
  // 🔗 Función de vincular
  // ======================
  const handleVincular = (id: number) => {
    const servidor = servidores.find((s) => s.id === id);
    if (servidor) {
      setSelectedServidor(servidor);
      setOpenVincular(true);
      fetchEntes();
    }
  };

  // ======================
  // 🎨 Render principal
  // ======================
  return (
    <>
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Título y regreso */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline">←</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Servidores Públicos</h1>
            <p className="text-gray-600 text-sm">
              Consulta de servidores públicos y sus entes asociados
            </p>
          </div>
        </div>

        <ActionButtonsGroup
          viewMode={view}
          setViewMode={setView}
          showDeleted={false}
          setShowDeleted={() => {}}
          newPath="/catalogos/servidores-publicos-ente/new"
          onExport={() => {}}
          showExport={false}
          hideNew={true}
          table={tableInstance}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por nombre, cargo o ente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 🔹 CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : servidoresFiltrados.length === 0 ? (
        <p>No hay servidores registrados</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servidoresFiltrados.map((s, index) => (
            <Card
              key={`${s.id}-${index}`}
              className="shadow hover:shadow-lg transition"
            >
              <CardHeader className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold">
                  {s.nombre}
                </CardTitle>

                {/* ⚙️ Menú de opciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-100 rounded-full"
                    >
                      <MoreHorizontal className="h-5 w-5 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer text-sm"
                      onClick={() => handleVincular(s.id)}
                    >
                      Vincular
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Cargo:</strong> {s.cargo || "—"}
                </p>
                <p>
                  <strong>Activo:</strong> {s.activo ? "✅" : "❌"}
                </p>
                <p>
                  <strong>Ente:</strong> {s.ente_publico || "Sin asociar"}
                </p>
                <p>
                  <strong>Siglas:</strong> {s.ente_siglas || "—"}
                </p>
                <p>
                  <strong>Clasificación:</strong> {s.ente_clasificacion || "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
        data={servidoresFiltrados}
        columns={[
          { header: "ID", accessorKey: "id" },
          { header: "Nombre", accessorKey: "nombre" },
          { header: "Cargo", accessorKey: "cargo" },
          {
            header: "Activo",
            accessorKey: "activo",
            cell: ({ row }) => (row.original.activo ? "✅" : "❌"),
          },
          { header: "Ente", accessorKey: "ente_publico" },
          { header: "Siglas", accessorKey: "ente_siglas" },
          { header: "Clasificación", accessorKey: "ente_clasificacion" },
          {
            header: "Acciones",
            cell: ({ row }) => (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVincular(row.original.id)}
                className="cursor-pointer"
                style={{ borderColor: "#235391", color: "#235391" }}
              >
                Vincular
              </Button>
            ),
          },
        ]}
        columnVisibility={columnVisibility} // ✅ ahora controlas desde el page
        setColumnVisibility={setColumnVisibility} // ✅ setter reactivo
        onTableInit={setTableInstance}
      />
      )}
    </main>

    <Dialog open={openVincular} onOpenChange={setOpenVincular}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Vincular servidor: {selectedServidor?.nombre}
          </DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput
            placeholder="Buscar ente público..."
            value={searchEnte}
            onValueChange={(val) => {
              setSearchEnte(val);
            }}
            autoFocus
          />
          <CommandList>
            {searchEnte.trim() === "" ? (
              <div className="p-2 text-center">Escribe para buscar un ente público...</div>
            ) : loadingEntes ? (
              <div className="p-2 text-center">Cargando...</div>
            ) : entes.filter((ente) =>
                  (ente.descripcion || "").toLowerCase().includes(searchEnte.toLowerCase()) ||
                  (ente.siglas || "").toLowerCase().includes(searchEnte.toLowerCase()) ||
                  (ente.clasificacion || "").toLowerCase().includes(searchEnte.toLowerCase()) ||
                  (ente.descripcion || "").toLowerCase().includes(searchEnte.toLowerCase())
                ).length === 0 ? (
              <CommandEmpty>No se encontraron entes.</CommandEmpty>
            ) : (
              entes
                .filter((ente) =>
                  (ente.descripcion || "").toLowerCase().includes(searchEnte.toLowerCase()) ||
                  (ente.siglas || "").toLowerCase().includes(searchEnte.toLowerCase()) ||
                  (ente.clasificacion || "").toLowerCase().includes(searchEnte.toLowerCase()) ||
                  (ente.descripcion || "").toLowerCase().includes(searchEnte.toLowerCase())
                )
                .map((ente) => (
                  <CommandItem
                    key={ente.id}
                    onSelect={() => {
                      vincularServidor(ente.id);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{ente.descripcion}</span>
                      <small className="text-muted-foreground">
                        {ente.siglas} - {ente.clasificacion}
                      </small>
                    </div>
                  </CommandItem>
                ))
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
    </>
  );
}