// 🚀 Force rebuild cache 2025-10-10
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { RowActionButtons } from "@/components/shared/RowActionButtons";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
} from "@tanstack/react-table";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/shared/DataTable";
import { List, LayoutGrid } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // ✅ Campo de búsqueda
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

type Usuario = {
  id: number;
  username: string;
  nombre?: string | null;
  tipo?: string | null;
  activo: boolean;
};

// ✅ Reemplazo de getApiBase() por constante global
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = React.useState<Usuario[]>([]);
  const [filtro, setFiltro] = React.useState<string>(""); // ✅ Nuevo estado para búsqueda
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [hoy, setHoy] = React.useState("");

  const [entes, setEntes] = React.useState<{ id: string; descripcion: string }[]>([]);
  const [entesFiltrados, setEntesFiltrados] = React.useState<{ id: string; descripcion: string }[]>([]);
  const [enteSeleccionado, setEnteSeleccionado] = React.useState<{ id: string; descripcion: string } | null>(null);

  // Estados para diálogo y edición
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Estado para datos del usuario editado
  const [editUserData, setEditUserData] = React.useState<{
    username: string;
    nombre: string;
    tipo: string;
    activo: boolean;
    p_id_ente?: string;
    p_pass_hash?: string;
  }>({
    username: "",
    nombre: "",
    tipo: "",
    activo: true,
    p_pass_hash: "",
  });
  const [editLoading, setEditLoading] = React.useState(false);

  // Estado para diálogo de nuevo usuario
  const [isNewDialogOpen, setIsNewDialogOpen] = React.useState(false);
  // Estado para datos del usuario nuevo
  const [newUserData, setNewUserData] = React.useState<{
    username: string;
    nombre: string;
    tipo: string;
    p_pass_hash: string;
    p_id_ente?: string;
  }>({
    username: "",
    nombre: "",
    tipo: "",
    p_pass_hash: "",
    p_id_ente: "",
  });
  const [newLoading, setNewLoading] = React.useState(false);
  const [entesFiltradosNuevo, setEntesFiltradosNuevo] = React.useState<{ id: string; descripcion: string }[]>([]);
  const [enteSeleccionadoNuevo, setEnteSeleccionadoNuevo] = React.useState<{ id: string; descripcion: string } | null>(null);

  // Inicializar fecha
  React.useEffect(() => {
    setHoy(
      new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  // Cargar usuarios
  React.useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch(`${API_BASE}/seguridad/usuarios/`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        console.log('🟢 id_ente del usuario:', data.id_ente);
        setUsuarios(Array.isArray(data) ? data.filter((u) => u.activo) : []);
      } catch (err) {
        console.error("❌ Error cargando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Función para abrir diálogo y cargar datos del usuario a editar
  const handleEditUser = async (id: number) => {
    setSelectedUserId(id);
    setEditLoading(true);
    setIsDialogOpen(true);
    try {
      const res = await fetch(`${API_BASE}/seguridad/usuarios/${id}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEditUserData({
        username: data.username || "",
        nombre: data.nombre || "",
        tipo: data.tipo || "",
        activo: data.activo ?? true,
        p_id_ente: data.id_ente || "",
        p_pass_hash: "",
      });

      const resEntes = await fetch(`${API_BASE}/catalogos/entes?p_id=-99`);
      if (!resEntes.ok) throw new Error(await resEntes.text());
      const dataEntes = await resEntes.json();
      console.log('🟢 Primeros entes:', dataEntes.map((e: any) => e.id));
      setEntes(Array.isArray(dataEntes) ? dataEntes : []);

      const enteEncontrado = dataEntes.find(
        (e: any) =>
          String(e.id).replace(/^0+/, "") ===
          String(data.id_ente).replace(/^0+/, "")
      );
      if (enteEncontrado) setEnteSeleccionado(enteEncontrado);
    } catch (err) {
      console.error("❌ Error cargando usuario para editar:", err);
      toast.error("❌ Error cargando usuario para editar");
      setIsDialogOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  // Eliminar usuario
  const eliminarUsuario = async (id: number) => {
    if (!confirm(`¿Eliminar usuario con ID ${id}?`)) return;
    try {
      const resp = await fetch(`${API_BASE}/seguridad/usuarios/${id}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error(await resp.text());
      toast.success("🗑️ Usuario eliminado correctamente");
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar usuario:", err);
      toast.error("❌ Error al eliminar usuario");
    }
  };

  // ✅ Filtrado dinámico de usuarios
  const usuariosFiltrados = React.useMemo(() => {
    const term = filtro.trim().toLowerCase();
    if (!term) return usuarios;

    return usuarios.filter((u) =>
      [u.id, u.username, u.nombre, u.tipo]
        .filter(Boolean)
        .some((field) => field!.toString().toLowerCase().includes(term))
    );
  }, [usuarios, filtro]);

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
  // Buscar entes para nuevo usuario
  const handleBuscarEnteNuevo = (valor: string) => {
    if (!valor.trim()) {
      setEntesFiltradosNuevo([]);
      return;
    }
    const filtrados = entes.filter((e) =>
      e.descripcion.toLowerCase().includes(valor.toLowerCase())
    );
    setEntesFiltradosNuevo(filtrados);
  };
  // Al abrir diálogo de nuevo usuario, cargar entes si no están cargados
  React.useEffect(() => {
    if (isNewDialogOpen && entes.length === 0) {
      fetch(`${API_BASE}/catalogos/entes?p_id=-99`)
        .then((res) => res.json())
        .then((data) => {
          setEntes(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error("❌ Error cargando entes:", err);
          toast.error("❌ Error cargando entes");
        });
    }
    if (!isNewDialogOpen) {
      setNewUserData({
        username: "",
        nombre: "",
        tipo: "",
        p_pass_hash: "",
        p_id_ente: "",
      });
      setEntesFiltradosNuevo([]);
      setEnteSeleccionadoNuevo(null);
    }
  }, [isNewDialogOpen]);

  // Manejar cambios en el formulario de nuevo usuario
  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;
    setNewUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Crear nuevo usuario
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validación básica
    if (!newUserData.username || !newUserData.p_pass_hash || !newUserData.tipo) {
      toast.error("Por favor, completa los campos obligatorios.");
      return;
    }
    setNewLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/seguridad/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_username: newUserData.username,
          p_nombre: newUserData.nombre,
          p_pass_hash: newUserData.p_pass_hash,
          p_tipo: newUserData.tipo,
          p_id_ente: newUserData.p_id_ente,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      const result = await resp.json();
      toast.success("✅ Usuario creado correctamente");

      // ✅ Si el backend devuelve el ID, obtener el usuario recién creado
      if (result.id) {
        const resUser = await fetch(`${API_BASE}/seguridad/usuarios/${result.id}`);
        if (resUser.ok) {
          const nuevoUsuario = await resUser.json();
          setUsuarios((prev) => [...prev, nuevoUsuario]);
        }
      } else {
        // Si no devuelve ID, recargar la lista completa
        const resAll = await fetch(`${API_BASE}/seguridad/usuarios/`);
        if (resAll.ok) {
          const usuariosActualizados = await resAll.json();
          setUsuarios(usuariosActualizados);
        }
      }

      // Cerrar el diálogo
      setIsNewDialogOpen(false);
    } catch (err: any) {
      console.error("❌ Error creando usuario:", err);
      toast.error("❌ Error creando usuario");
    } finally {
      setNewLoading(false);
    }
  };

  // Manejar cambios en el formulario de edición (corregido para TypeScript)
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setEditUserData((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      setEditUserData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Guardar cambios del usuario editado
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId === null) return;
    if (!editUserData.p_pass_hash) delete editUserData.p_pass_hash;
    try {
      const resp = await fetch(`${API_BASE}/seguridad/usuarios/${selectedUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editUserData),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const updatedUser = await resp.json();
      setUsuarios((prev) =>
        prev.map((u) => (u.id === selectedUserId ? updatedUser : u))
      );
      toast.success("✅ Usuario actualizado correctamente");
      setIsDialogOpen(false);
    } catch (err) {
      console.error("❌ Error actualizando usuario:", err);
      toast.error("❌ Error actualizando usuario");
    }
  };

  // ======================
  // Render principal
  // ======================
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [tableInstance, setTableInstance] = React.useState<any>(null);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // TanStack Table columns
  const columns = React.useMemo<ColumnDef<Usuario>[]>(() => [
    {
      header: "ID",
      accessorKey: "id",
      cell: info => info.getValue(),
    },
    {
      header: "Usuario",
      accessorKey: "username",
      cell: info => info.getValue(),
    },
    {
      header: "Nombre",
      accessorKey: "nombre",
      cell: info => info.getValue() || "Sin nombre",
    },
    {
      header: "Tipo",
      accessorKey: "tipo",
      cell: info => info.getValue() || "—",
    },
    {
        header: "Acciones",
        id: "acciones",
        cell: ({ row }) => (
          <div className="flex justify-start -ml-4">
            <RowActionButtons
              id={String(row.original.id)}
              editPath={`/seguridad/usuarios/edit/${row.original.id}`}
              onEdit={() => handleEditUser(row.original.id)}
              onDelete={() => eliminarUsuario(row.original.id)}
            />
          </div>
        ),
        enableSorting: false,
        size: 80,
      },

  ], []);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const table = useReactTable({
    data: usuariosFiltrados,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
          <Button
            variant="outline"
            style={{ backgroundColor: "#db200b", color: "white" }}
            className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
          >
            ←
          </Button>
        </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Usuarios</h1>
              <span className="text-xs text-gray-500 capitalize">{hoy}</span>
            </div>
            <p className="text-gray-600 text-sm">
              Consulta, crea o edita usuarios del sistema.
            </p>
            {usuariosFiltrados.length > 0 && (
              <p className="text-muted-foreground text-sm">
                Mostrando {usuariosFiltrados.length} registro{usuariosFiltrados.length !== 1 && "s"}.
              </p>
            )}
          </div>
        </div>
        {/* CONTROLES */}
        <ActionButtonsGroup
          viewMode={view}
          setViewMode={setView}
          onExport={() => console.log("Exportar CSV")}
          showExport={true}
          // newPath="/seguridad/usuarios/new"
          hideNew={false}
          table={tableInstance}
          showDeleted={showDeleted}
          setShowDeleted={setShowDeleted}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          onNewClick={() => setIsNewDialogOpen(true)}
        />
      </div>

      {/* 🔍 Barra de búsqueda */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar por nombre, usuario o tipo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full"
        />
      </div>

      {/* LISTADO */}
      {loading ? (
        <p>Cargando...</p>
      ) : usuariosFiltrados.length === 0 ? (
        <p>No se encontraron usuarios con ese criterio</p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {usuariosFiltrados.map((u) => (
            <Card key={`user-${u.id}-${u.username}`} className="shadow hover:shadow-lg transition">
              <CardHeader>
                <CardTitle>{u.nombre || "Sin nombre"}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">@{u.username}</p>
                  <p className="text-xs text-gray-400">Tipo: {u.tipo || "—"}</p>
                </div>
                <RowActionButtons
                  id={String(u.id)}
                  editPath={`/seguridad/usuarios/edit/${u.id}`}
                  onEdit={() => handleEditUser(u.id)}
                  onDelete={() => eliminarUsuario(u.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <DataTable
          data={usuariosFiltrados}
          columns={columns}
          onTableInit={setTableInstance}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          {editLoading ? (
            <p>Cargando datos...</p>
          ) : (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={editUserData.username ?? ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <Input
                  id="nombre"
                  name="nombre"
                  type="text"
                  value={editUserData.nombre ?? ""}
                  onChange={handleEditChange}
                />
              </div>
              <div>
                <Label>Nueva contraseña</Label>
                <Input
                  type="password"
                  value={editUserData.p_pass_hash ?? ""}
                  onChange={(e) =>
                    setEditUserData((prev) => ({ ...prev, p_pass_hash: e.target.value }))
                  }
                  placeholder="(Déjalo vacío si no la cambiarás)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Selecciona Ente</label>
                <Command className="border rounded-md">
                  {enteSeleccionado ? (
                    <>
                      <div className="p-2 text-sm text-gray-700 border-b bg-gray-50">
                        <span className="font-medium text-gray-800">
                          Actualmente asociado a:
                        </span>{" "}
                        <span className="text-blue-700 font-semibold">
                          {enteSeleccionado.descripcion}
                        </span>
                        <button
                          type="button"
                          className="ml-2 text-xs text-blue-600 hover:underline"
                          onClick={() => {
                            setEnteSeleccionado(null);
                            setEditUserData((prev) => ({ ...prev, p_id_ente: "" }));
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <CommandInput
                        placeholder="Escribe para buscar..."
                        onValueChange={handleBuscarEnte}
                      />
                      <CommandList>
                        <CommandGroup heading="Coincidencias">
                          {entesFiltrados.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              Escribe para buscar entes
                            </div>
                          ) : (
                            entesFiltrados.map((e) => (
                              <CommandItem
                                key={e.id}
                                value={e.descripcion}
                                onSelect={() => {
                                  setEnteSeleccionado(e);
                                  setEditUserData((prev) => ({ ...prev, p_id_ente: e.id }));
                                  setEntesFiltrados([]);
                                }}
                              >
                                {e.descripcion}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </>
                  )}
                </Command>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de usuario
                </Label>
                <div className="border rounded-md p-3 bg-white">
                  <RadioGroup
                    defaultValue={editUserData.tipo}
                    onValueChange={(value) =>
                      setEditUserData((prev) => ({ ...prev, tipo: value }))
                    }
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ENTE" id="r-ente" />
                      <Label htmlFor="r-ente" className="text-sm text-gray-700">
                        ENTE
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="RECTOR" id="r-rector" />
                      <Label htmlFor="r-rector" className="text-sm text-gray-700">
                        RECTOR
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="activo"
                  name="activo"
                  type="checkbox"
                  checked={editUserData.activo}
                  onChange={handleEditChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Activo
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: "#34e004", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* DIÁLOGO NUEVO USUARIO */}
      {/* DIÁLOGO NUEVO USUARIO */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-lg sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          {newLoading ? (
            <p>Cargando...</p>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-username" className="block text-sm font-medium text-gray-700">
                  Usuario <span className="text-red-500">*</span>
                </label>
                <Input
                  id="new-username"
                  name="username"
                  type="text"
                  value={newUserData.username}
                  onChange={handleNewChange}
                  required
                  className="rounded-md"
                />
              </div>
              <div>
                <label htmlFor="new-nombre" className="block text-sm font-medium text-gray-700">
                  Nombre completo
                </label>
                <Input
                  id="new-nombre"
                  name="nombre"
                  type="text"
                  value={newUserData.nombre}
                  onChange={handleNewChange}
                  className="rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="new-pass" className="block text-sm font-medium text-gray-700">
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="new-pass"
                  name="p_pass_hash"
                  type="password"
                  value={newUserData.p_pass_hash}
                  onChange={handleNewChange}
                  required
                  className="rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Selecciona Ente</label>
                <Command className="border rounded-md">
                  {enteSeleccionadoNuevo ? (
                    <>
                      <div className="p-2 text-sm text-gray-700 border-b bg-gray-50">
                        <span className="font-medium text-gray-800">
                          Seleccionado:
                        </span>{" "}
                        <span className="text-blue-700 font-semibold">
                          {enteSeleccionadoNuevo?.descripcion ?? ""}
                        </span>
                        <button
                          type="button"
                          className="ml-2 text-xs text-blue-600 hover:underline"
                          onClick={() => {
                            setEnteSeleccionadoNuevo(null);
                            setNewUserData((prev) => ({ ...prev, p_id_ente: "" }));
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <CommandInput
                        placeholder="Escribe para buscar..."
                        onValueChange={handleBuscarEnteNuevo}
                      />
                      <CommandList>
                        <CommandGroup heading="Coincidencias">
                          {entesFiltradosNuevo.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              Escribe para buscar entes
                            </div>
                          ) : (
                            entesFiltradosNuevo.map((e) => (
                              <CommandItem
                                key={e.id}
                                value={e.descripcion}
                                onSelect={() => {
                                  setEnteSeleccionadoNuevo(e);
                                  setNewUserData((prev) => ({ ...prev, p_id_ente: e.id }));
                                  setEntesFiltradosNuevo([]);
                                }}
                              >
                                {e.descripcion}
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </>
                  )}
                </Command>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de usuario <span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-md p-3 bg-white">
                  <RadioGroup
                    value={newUserData.tipo}
                    onValueChange={(value) =>
                      setNewUserData((prev) => ({ ...prev, tipo: value }))
                    }
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ENTE" id="new-r-ente" />
                      <Label htmlFor="new-r-ente" className="text-sm text-gray-700">
                        ENTE
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="RECTOR" id="new-r-rector" />
                      <Label htmlFor="new-r-rector" className="text-sm text-gray-700">
                        RECTOR
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewDialogOpen(false)}
                  style={{ backgroundColor: "#db200b", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: "#34e004", color: "white" }}
                  className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-105 hover:brightness-110"
                >
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}