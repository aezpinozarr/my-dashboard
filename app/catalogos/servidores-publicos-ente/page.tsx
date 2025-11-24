"use client";

import * as React from "react";
import { VisibilityState } from "@tanstack/react-table";
import Link from "next/link";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
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
  // Filtro avanzado
  const [filterField, setFilterField] = React.useState("all");
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
    <main className="w-full p-6 space-y-6 bg-white min-h-screen">
      {/* 🔹 ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Título y regreso */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/dashboard">
          <Button
            variant="outline"
            style={{ backgroundColor: "#db200b", color: "white" }}
            className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
          >
            ←
          </Button>
        </Link>
      </TooltipTrigger>

      <TooltipContent side="bottom" className="text-xs">
        Salir
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
          <div>
            <h1 className="text-2xl font-bold">Servidores Públicos</h1>
            {servidoresFiltrados.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {search.trim() === "" ? (
                <>
                  Mostrando{" "}
                  <span className="font-bold">{servidoresFiltrados.length}</span>{" "}
                  registro{servidoresFiltrados.length !== 1 && "s"}.
                </>
              ) : (
                <>
                  Mostrando{" "}
                  <span className="font-bold">{servidoresFiltrados.length}</span>{" "}
                  registro{servidoresFiltrados.length !== 1 && "s"} de{" "}
                  <span className="font-bold">{servidores.length}</span>.
                </>
              )}
            </p>
          )}
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

      {/* 🔍 BARRA DE BÚSQUEDA CON FILTROS */}
      <div className="w-full mt-2 flex gap-2 items-center">
        {/* Selector de categoría */}
        <div className="w-40">
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="nombre">Nombre</option>
            <option value="cargo">Cargo</option>
            <option value="ente_publico">Ente Público</option>
            <option value="ente_siglas">Siglas</option>
            <option value="ente_clasificacion">Clasificación</option>
          </select>
        </div>

        {/* Input de búsqueda */}
        <Input
          type="text"
          placeholder={
            filterField === "all"
              ? "Buscar en todo…"
              : `Buscar por ${filterField.replace(/_/g, " ")}…`
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        {/* Botón limpiar filtros */}
        {search.trim() !== "" || filterField !== "all" ? (
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setFilterField("all");
            }}
            className="whitespace-nowrap"
          >
            Limpiar
          </Button>
        ) : null}
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
  {
    accessorKey: "id",
    header: () => <div className="text-center w-full">ID</div>,
    cell: ({ getValue }) => (
      <div className="text-center w-full">
        {String(getValue() ?? "—")}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: "nombre",
    header: () => <div className="text-center w-full">Nombre</div>,
    cell: ({ getValue }) => (
      <div className="text-center w-full">
        {String(getValue() ?? "—")}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "cargo",
    header: () => <div className="text-center w-full">Cargo</div>,
    cell: ({ getValue }) => (
      <div className="text-center w-full">
        {String(getValue() ?? "—")}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "activo",
    header: () => <div className="text-center w-full">Activo</div>,
    cell: ({ row }) => (
      <div className="text-center w-full">
        {row.original.activo ? "✅ Sí" : "❌ No"}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "ente_publico",
    header: () => <div className="text-center w-full">Ente</div>,
    cell: ({ getValue }) => (
      <div className="text-center w-full">
        {String(getValue() ?? "—")}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "ente_siglas",
    header: () => <div className="text-center w-full">Siglas</div>,
    cell: ({ getValue }) => (
      <div className="text-center w-full">
        {String(getValue() ?? "—")}
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: "ente_clasificacion",
    header: () => <div className="text-center w-full">Clasificación</div>,
    cell: ({ getValue }) => (
      <div className="text-center w-full">
        {String(getValue() ?? "—")}
      </div>
    ),
    size: 180,
  },
  {
    id: "acciones",
    header: () => <div className="text-center w-full">Acciones</div>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-center w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVincular(row.original.id)}
          className="cursor-pointer"
          style={{ borderColor: "#235391", color: "#235391" }}
        >
          Vincular
        </Button>
      </div>
    ),
    size: 160,
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