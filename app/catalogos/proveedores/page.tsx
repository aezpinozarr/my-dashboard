// 🚀 Force rebuild cache 2025-10-10
"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, LayoutGrid, CopyX } from "lucide-react";
import { Input } from "@/components/ui/input"; // ✅ Barra de búsqueda
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ActionButtonsGroup } from "@/components/shared/ActionButtonsGroup";
import { RowActionButtons } from "@/components/shared/RowActionButtons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

// ======================
// 🔹 Base de la API
// ======================
const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

// ======================
// 🔹 Tipado de datos
// ======================
type Proveedor = {
  rfc: string;
  razon_social: string;
  nombre_comercial: string;
  persona_juridica: string;
  correo_electronico: string;
  activo: boolean;
  id_entidad_federativa: number;
  entidad_federativa: string;
};

type EntidadFederativa = {
  id: number;
  descripcion: string;
};

// ======================
// 🔹 Componente principal
// ======================
export default function ProveedoresPage() {
  const [proveedores, setProveedores] = React.useState<Proveedor[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [search, setSearch] = React.useState(""); // ✅ Barra de búsqueda
  const [showDeleted, setShowDeleted] = React.useState(false); // ✅ Mostrar eliminados

  // Estados para edición en diálogo
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [proveedorEditando, setProveedorEditando] = React.useState<Proveedor | null>(null);
  const [entidades, setEntidades] = React.useState<EntidadFederativa[]>([]);
  const [selectedEntidad, setSelectedEntidad] = React.useState<EntidadFederativa | null>(null);
  const [searchEntidad, setSearchEntidad] = React.useState("");
  const [loadingEntidades, setLoadingEntidades] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);

  // ======================
  // Cargar proveedores
  // ======================
  const fetchProveedores = async () => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=-99`);
      const data = await resp.json();
      setProveedores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando proveedores:", err);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // Cargar entidades federativas
  // ======================
  const fetchEntidades = async () => {
    setLoadingEntidades(true);
    try {
      const resp = await fetch(`${API_BASE}/catalogos/entidad-federativa`);
      const data = await resp.json();
      setEntidades(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando entidades federativas:", err);
    } finally {
      setLoadingEntidades(false);
    }
  };

  React.useEffect(() => {
    fetchProveedores();
    fetchEntidades();
  }, []);

  // ======================
  // Eliminar o reactivar proveedor
  // ======================
  const toggleEstadoProveedor = async (rfc: string, activar = false) => {
    const accion = activar ? "reactivar" : "eliminar";
    if (!confirm(`¿Seguro que deseas ${accion} el proveedor ${rfc}?`)) return;

    try {
      const resp = await fetch(
        `${API_BASE}/catalogos/proveedor${activar ? "/recuperar" : ""}`,
        {
          method: activar ? "PUT" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rfc }),
        }
      );
      if (!resp.ok) throw new Error(await resp.text());
      toast.success(
        activar
          ? "♻️ Proveedor reactivado correctamente"
          : "🗑️ Proveedor eliminado correctamente"
      );
      fetchProveedores();
    } catch (err) {
      console.error(`❌ Error al ${accion} proveedor:`, err);
      toast.error(`Error al ${accion} proveedor`);
    }
  };

  // ======================
  // 🔍 Filtrar búsqueda
  // ======================
  const proveedoresFiltrados = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtrados = proveedores.filter((p) =>
      showDeleted ? !p.activo : p.activo
    );

    if (!term) return filtrados;

    return filtrados.filter((p) =>
      [
        p.rfc,
        p.razon_social,
        p.nombre_comercial,
        p.correo_electronico,
        p.entidad_federativa,
      ]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(term))
    );
  }, [proveedores, search, showDeleted]);

  // ======================
  // Abrir diálogo de edición con datos del proveedor
  // ======================
  const handleEditClick = async (rfc: string) => {
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor?p_rfc=${encodeURIComponent(rfc)}`);
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const p = data[0];
        setProveedorEditando({
          rfc: p.rfc,
          razon_social: p.razon_social || "",
          nombre_comercial: p.nombre_comercial || "",
          persona_juridica: p.persona_juridica || "",
          correo_electronico: p.correo_electronico || "",
          activo: p.activo,
          id_entidad_federativa: p.id_entidad_federativa,
          entidad_federativa: p.entidad_federativa,
        });
        const entidadSel = entidades.find(
          (e) => e.id === p.id_entidad_federativa
        );
        setSelectedEntidad(entidadSel || null);
        setSearchEntidad(p.entidad_federativa || "");
        setIsEditDialogOpen(true);
      } else {
        toast.error("Proveedor no encontrado");
      }
    } catch (err) {
      console.error("❌ Error cargando proveedor para edición:", err);
      toast.error("Error cargando proveedor");
    }
  };

  // ======================
  // Guardar cambios de edición
  // ======================
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorEditando) return;

    if (!proveedorEditando.razon_social.trim()) {
      toast.error("La razón social es obligatoria");
      return;
    }

    // ✅ Usa la entidad seleccionada o la del proveedor
    const entidadAUsar = selectedEntidad?.id || proveedorEditando.id_entidad_federativa;
    if (!entidadAUsar) {
      toast.error("Debe seleccionar una entidad federativa");
      return;
    }

    setSavingEdit(true);
    try {
      const resp = await fetch(`${API_BASE}/catalogos/proveedor`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfc: proveedorEditando.rfc,
          razon_social: proveedorEditando.razon_social,
          nombre_comercial: proveedorEditando.nombre_comercial,
          persona_juridica: proveedorEditando.persona_juridica,
          correo_electronico: proveedorEditando.correo_electronico,
          id_entidad_federativa: entidadAUsar,
          entidad_federativa: selectedEntidad?.descripcion || proveedorEditando.entidad_federativa,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());
      toast.success("Proveedor actualizado correctamente");
      setIsEditDialogOpen(false);
      fetchProveedores();
    } catch (err) {
      console.error("❌ Error actualizando proveedor:", err);
      toast.error("Error actualizando proveedor");
    } finally {
      setSavingEdit(false);
    }
  };

  // ======================
  // Render principal
  // ======================
  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 🔹 ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" style={{ cursor: "pointer" }}>
              ←
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Proveedores</h1>
            <p className="text-gray-600 text-sm">
              Consulta, crea, edita o recupera proveedores registrados.
            </p>
          </div>
        </div>

        {/* 🔹 CONTROLES */}
        <div className="flex items-center gap-2">
          <ActionButtonsGroup
            viewMode={view}
            setViewMode={setView}
            onExport={() => console.log("Exportar CSV (pendiente)")}
            showExport={view === "table"}
            newPath="/catalogos/proveedores/new"
            showDeleted={showDeleted}
            setShowDeleted={setShowDeleted}
          />
          <Button
            size="icon"
            variant="outline"
            title={showDeleted ? "Mostrar activos" : "Mostrar eliminados"}
            onClick={() => setShowDeleted(!showDeleted)}
            className={`transition-all border-2 shadow-sm ${
              showDeleted
                ? "border-red-600 bg-red-50 hover:bg-red-100 text-red-700"
                : "border-gray-300 hover:border-red-400 text-gray-600 hover:text-red-700"
            }`}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CopyX className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="w-full">
        <Input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* 🔹 CONTENIDO */}
      {loading ? (
        <p>Cargando...</p>
      ) : proveedoresFiltrados.length === 0 ? (
        <p>
          {showDeleted
            ? "No hay proveedores eliminados"
            : "No hay proveedores activos"}
        </p>
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proveedoresFiltrados.map((p) => (
            <Card
              key={p.rfc}
              className="shadow hover:shadow-lg transition border border-gray-200"
            >
              <CardHeader>
                <CardTitle>{p.razon_social}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>RFC:</strong> {p.rfc}</p>
                <p><strong>Nombre comercial:</strong> {p.nombre_comercial || "—"}</p>
                <p><strong>Persona jurídica:</strong> {p.persona_juridica || "—"}</p>
                <p><strong>Correo:</strong> {p.correo_electronico || "—"}</p>
                <p><strong>Entidad:</strong> {p.entidad_federativa}</p>

                <div className="flex justify-end gap-2 pt-2">
                  <RowActionButtons
                    id={p.rfc}
                    editPath="/catalogos/proveedores/edit"
                    onEdit={handleEditClick}
                    onDelete={(id) => toggleEstadoProveedor(id)}
                    onRestore={(id) => toggleEstadoProveedor(id, true)}
                    showDeleted={showDeleted}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFC</TableHead>
              <TableHead>Razón Social</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedoresFiltrados.map((p) => (
              <TableRow key={p.rfc}>
                <TableCell>{p.rfc}</TableCell>
                <TableCell>{p.razon_social}</TableCell>
                <TableCell>{p.correo_electronico}</TableCell>
                <TableCell>{p.entidad_federativa}</TableCell>
                <TableCell>
                  <div className="flex justify-start -ml-4">
                    <RowActionButtons
                      id={p.rfc}
                      editPath="/catalogos/proveedores/edit"
                      onEdit={handleEditClick}
                      onDelete={(id) => toggleEstadoProveedor(id)}
                      onRestore={(id) => toggleEstadoProveedor(id, true)}
                      showDeleted={showDeleted}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Proveedor</DialogTitle>
            <DialogDescription>
              Modifica los datos del proveedor y guarda los cambios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="rfc" className="block text-sm font-medium leading-6 text-gray-900">
                RFC
              </label>
              <Input
                id="rfc"
                type="text"
                value={proveedorEditando?.rfc || ""}
                disabled
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="razon_social" className="block text-sm font-medium leading-6 text-gray-900">
                Razón Social <span className="text-red-600">*</span>
              </label>
              <Input
                id="razon_social"
                type="text"
                value={proveedorEditando?.razon_social || ""}
                onChange={(e) =>
                  setProveedorEditando((prev) =>
                    prev ? { ...prev, razon_social: e.target.value } : prev
                  )
                }
                required
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="nombre_comercial" className="block text-sm font-medium leading-6 text-gray-900">
                Nombre Comercial
              </label>
              <Input
                id="nombre_comercial"
                type="text"
                value={proveedorEditando?.nombre_comercial || ""}
                onChange={(e) =>
                  setProveedorEditando((prev) =>
                    prev ? { ...prev, nombre_comercial: e.target.value } : prev
                  )
                }
                className="mt-1"
              />
            </div>
            {/* Persona Jurídica */}
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                Persona Jurídica
              </label>
              <RadioGroup
                value={proveedorEditando?.persona_juridica || ""}
                onValueChange={(value) =>
                  setProveedorEditando((prev) =>
                    prev ? { ...prev, persona_juridica: value } : prev
                  )
                }
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PERSONA FISICA" id="fisica" />
                  <label htmlFor="fisica" className="text-sm">PERSONA FÍSICA</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PERSONA MORAL" id="moral" />
                  <label htmlFor="moral" className="text-sm">PERSONA MORAL</label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <label htmlFor="correo_electronico" className="block text-sm font-medium leading-6 text-gray-900">
                Correo Electrónico
              </label>
              <Input
                id="correo_electronico"
                type="email"
                value={proveedorEditando?.correo_electronico || ""}
                onChange={(e) =>
                  setProveedorEditando((prev) =>
                    prev ? { ...prev, correo_electronico: e.target.value } : prev
                  )
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium leading-6 text-gray-900 mb-1">
                Entidad Federativa <span className="text-red-600">*</span>
              </label>
              <Command>
                <CommandInput
                  placeholder="Buscar entidad..."
                  value={searchEntidad}
                  onValueChange={setSearchEntidad}
                />
                <CommandGroup className="max-h-48 overflow-y-auto">
                  {searchEntidad.trim() === "" ? (
                    <div className="px-2 py-2 text-gray-500 text-sm">
                      Escribe para buscar entidades...
                    </div>
                  ) : (
                    (() => {
                      const resultados = entidades.filter((e) =>
                        e.descripcion.toLowerCase().includes(searchEntidad.toLowerCase())
                      );
                      if (resultados.length === 0) {
                        return <CommandEmpty>No se encontró entidad.</CommandEmpty>;
                      }
                      return resultados.map((e, index) => (
                        <CommandItem
                          key={`${e.id}-${index}`}
                          onSelect={() => {
                            setSelectedEntidad(e);
                            setSearchEntidad(e.descripcion); // ✅ Mostrar la selección
                          }}
                          className={`cursor-pointer ${
                            selectedEntidad?.id === e.id
                              ? "bg-accent/50"
                              : ""
                          }`}
                        >
                          {e.descripcion}
                        </CommandItem>
                      ));
                    })()
                  )}
                </CommandGroup>
              </Command>
              <p className="mt-1 text-sm text-gray-500">
                {selectedEntidad
                  ? `Seleccionado: ${selectedEntidad.descripcion}`
                  : proveedorEditando?.entidad_federativa
                  ? `Actual: ${proveedorEditando.entidad_federativa}`
                  : "Ninguna entidad seleccionada"}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={savingEdit}
                className="mr-2"
              >
                {savingEdit ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}