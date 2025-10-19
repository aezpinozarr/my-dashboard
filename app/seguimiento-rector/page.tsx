"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

type Seguimiento = {
  id: number;
  e_oficio_invitacion: string;
  e_tipo_evento: string;
  e_tipo_licitacion: string;
  e_fecha_y_hora_reunion: string;
  r_suplencia_oficio_no: string | null;
  r_fecha_emision: string | null;
  r_asunto: string | null;
  r_fecha_y_hora_reunion: string | null;
  r_estatus: string | null;
};

export default function SeguimientoRectorPage() {
  const { user } = useUser();
  const [seguimientos, setSeguimientos] = React.useState<Seguimiento[]>([]);
  const [view, setView] = React.useState<"table" | "cards">("cards");
  const [loading, setLoading] = React.useState(true);

  const [selected, setSelected] = React.useState<Seguimiento | null>(null);
  const [formData, setFormData] = React.useState({
    p_r_suplencia_oficio_no: "",
    p_r_fecha_emision: "",
    p_r_asunto: "",
    p_r_fecha_y_hora_reunion: "",
    p_r_estatus: "PREREGISTRADO",
    p_r_id_usuario_registra: 15,
    p_r_id_servidor_publico_asiste: 29,
  });
  // Ref para guardar el valor previo del campo hora
  const timePrevRef = React.useRef<string>("");

  // Obtener la fecha actual en formato ISO sin segundos
  const todayISO = new Date().toISOString().slice(0, 16);

  // ============================
  // 🔹 Obtener seguimientos
  // ============================
  const fetchSeguimientos = async () => {
    try {
      const res = await fetch(`${API_BASE}/rector/`);
      if (!res.ok) throw new Error("Error al obtener los seguimientos");
      const data = await res.json();
      setSeguimientos(data);
    } catch (err) {
      toast.error("Error al cargar los seguimientos");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSeguimientos();
  }, []);

  // ============================
  // 🔹 Manejar formulario (actualizado)
  // ============================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Validar año (solo 4 dígitos válidos)
    if (name === "p_r_fecha_emision" || name === "p_r_fecha_y_hora_reunion") {
      const match = value.match(/^(\d{4})/);
      if (match && match[1].length > 4) return;

      // Si se está escribiendo manualmente y pasa de 4 dígitos, se bloquea
      if (value.length > 10 && !value.includes("T")) return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!selected) return;

    const payload = {
      p_accion: "EDITAR",
      ...formData,
    };

    try {
      const res = await fetch(`${API_BASE}/rector/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error en la actualización");

      toast.success("Seguimiento actualizado correctamente");
      setSelected(null);
      fetchSeguimientos();
    } catch (err) {
      toast.error("No se pudo actualizar el seguimiento");
    }
  };

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" style={{ cursor: "pointer" }}>
              ←
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Seguimientos — Rector</h1>
            <p className="text-gray-600 text-sm">
              Visualiza los seguimientos y captura la información
              correspondiente.
            </p>
          </div>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="table" style={{ cursor: "pointer" }}>
              📋 Tabla
            </TabsTrigger>
            <TabsTrigger value="cards" style={{ cursor: "pointer" }}>
              🏛️ Tarjetas
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* CONTENIDO */}
      {loading ? (
        <p>Cargando seguimientos...</p>
      ) : seguimientos.length === 0 ? (
        <p>No hay seguimientos disponibles.</p>
      ) : view === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Oficio invitación</TableHead>
              <TableHead>Tipo evento</TableHead>
              <TableHead>Tipo licitación</TableHead>
              <TableHead>Fecha sesión</TableHead>
              <TableHead>Estatus</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {seguimientos.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.e_oficio_invitacion}</TableCell>
                <TableCell>{s.e_tipo_evento}</TableCell>
                <TableCell>{s.e_tipo_licitacion}</TableCell>
                <TableCell>
                  {s.e_fecha_y_hora_reunion
                    ? new Date(s.e_fecha_y_hora_reunion).toLocaleString(
                        "es-MX",
                        { hour12: false }
                      )
                    : "—"}
                </TableCell>
                <TableCell>{s.r_estatus || "PREREGISTRADO"}</TableCell>
                <TableCell>
                  <Button
                    style={{
                      backgroundColor: "#235391",
                      color: "white",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelected(s);
                      setFormData({
                        p_r_suplencia_oficio_no: s.r_suplencia_oficio_no || "",
                        p_r_fecha_emision: s.r_fecha_emision || "",
                        p_r_asunto: s.r_asunto || "",
                        p_r_fecha_y_hora_reunion:
                          s.r_fecha_y_hora_reunion || "",
                        p_r_estatus: s.r_estatus || "PREREGISTRADO",
                        p_r_id_usuario_registra: 15,
                        p_r_id_servidor_publico_asiste: 29,
                      });
                    }}
                  >
                    Capturar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {seguimientos.map((s) => (
            <Card
              key={s.id}
              className="shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">
                  {s.e_oficio_invitacion}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-sm space-y-1">
                <p>
                  <strong>Tipo evento:</strong> {s.e_tipo_evento}
                </p>
                <p>
                  <strong>Tipo licitación:</strong> {s.e_tipo_licitacion}
                </p>
                <p>
                  <strong>Fecha:</strong>{" "}
                  {s.e_fecha_y_hora_reunion
                    ? new Date(s.e_fecha_y_hora_reunion).toLocaleString(
                        "es-MX",
                        { hour12: false }
                      )
                    : "—"}
                </p>
                <p>
                  <strong>Estatus:</strong> {s.r_estatus || "PREREGISTRADO"}
                </p>
                <div className="pt-2">
                  <Button
                    style={{
                      backgroundColor: "#235391",
                      color: "white",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setSelected(s);
                      setFormData({
                        p_r_suplencia_oficio_no: s.r_suplencia_oficio_no || "",
                        p_r_fecha_emision: s.r_fecha_emision || "",
                        p_r_asunto: s.r_asunto || "",
                        p_r_fecha_y_hora_reunion:
                          s.r_fecha_y_hora_reunion || "",
                        p_r_estatus: s.r_estatus || "PREREGISTRADO",
                        p_r_id_usuario_registra: 15,
                        p_r_id_servidor_publico_asiste: 29,
                      });
                    }}
                  >
                    Capturar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DIALOG */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Captura de seguimiento #{selected?.id}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Suplencia oficio No</Label>
                <Input
                  name="p_r_suplencia_oficio_no"
                  value={formData.p_r_suplencia_oficio_no}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label>Fecha emisión</Label>
                <Input
                  type="date"
                  name="p_r_fecha_emision"
                  value={formData.p_r_fecha_emision}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value;
                    const year = val.split("-")[0];
                    // Bloquear si el año tiene más de 4 dígitos o si no se borra primero
                    if (year && year.length > 4) return;
                    handleChange(e);
                  }}
                  pattern="\d{4}-\d{2}-\d{2}"
                />
              </div>
            </div>

            <div>
              <Label>Fecha y hora reunión</Label>
              <div className="grid md:grid-cols-2 gap-2">
                <Input
                  type="date"
                  name="p_r_fecha_y_hora_reunion_fecha"
                  value={
                    formData.p_r_fecha_y_hora_reunion
                      ? formData.p_r_fecha_y_hora_reunion.split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    const fecha = e.target.value;

                    // No tocar el campo de hora al escribir la fecha
                    setFormData((prev) => {
                      // Si el valor actual tiene formato "HH:MM", lo conservamos sin tocar
                      const current = prev.p_r_fecha_y_hora_reunion || "";
                      const horaValida =
                        typeof current === "string" && /^[0-2]\d:[0-5]\d$/.test(current)
                          ? current
                          : current.includes("T")
                          ? current.split("T")[1]
                          : "";

                      // Solo combinar cuando haya hora válida
                      if (horaValida) {
                        return {
                          ...prev,
                          p_r_fecha_y_hora_reunion: `${fecha}T${horaValida}`,
                        };
                      }

                      // Si aún no hay hora, guardar solo la fecha
                      return {
                        ...prev,
                        p_r_fecha_y_hora_reunion: fecha,
                      };
                    });
                  }}
                />
                <Input
                  type="text"
                  name="p_r_fecha_y_hora_reunion_hora"
                  placeholder="HH:MM"
                  inputMode="numeric"
                  pattern="^([01]\\d|2[0-3]):[0-5]\\d$"
                  value={(() => {
                    const v = formData.p_r_fecha_y_hora_reunion || "";
                    if (typeof v !== "string") return "";
                    if (v.includes("T")) {
                      return v.split("T")[1]?.slice(0, 5) || "";
                    }
                    // Si el estado guarda solo la hora (ej. "17:30"), muéstrala
                    if (/^[0-2]\d:[0-5]\d$/.test(v)) {
                      return v.slice(0, 5);
                    }
                    // Si solo hay fecha (ej. "2025-10-19"), NO mostrar nada en el input de hora
                    return "";
                  })()}
                  onChange={(e) => {
                    const prev = timePrevRef.current || "";
                    let raw = e.target.value.replace(/[^\d:]/g, "");

                    // Detectar si es borrado (longitud menor que antes)
                    const isDeleting = raw.length < prev.length;

                    if (isDeleting) {
                      // Si queda solo ":" o termina con ":" (por ej. "17:")
                      if (raw === ":" || /:$/.test(raw)) {
                        raw = raw.replace(/:$/, ""); // quitar ":" final
                      }
                      // Quitar cualquier ":" intermedio al borrar
                      raw = raw.replace(/:/g, "");
                    } else {
                      // En escritura, eliminar ":" del input para reinsertarlo correctamente
                      raw = raw.replace(/:/g, "");
                    }

                    // Limitar a 4 dígitos (HHMM)
                    if (raw.length > 4) raw = raw.slice(0, 4);

                    // Volver a insertar ":" cuando haya 3 o 4 dígitos (HH: M o HH:MM)
                    let formatted = raw;
                    if (raw.length >= 3) {
                      formatted = `${raw.slice(0, 2)}:${raw.slice(2)}`;
                    } else {
                      // Cuando hay 0,1,2 dígitos, no mostramos ":" para evitar que "se atore" al borrar
                      formatted = raw;
                    }

                    // Si el usuario borró todo
                    if (formatted === "") {
                      setFormData({
                        ...formData,
                        p_r_fecha_y_hora_reunion: "",
                      });
                      timePrevRef.current = "";
                      return;
                    }

                    // Nueva lógica: armar el ISO solo si ya hay fecha seleccionada
                    const fecha = formData.p_r_fecha_y_hora_reunion?.split("T")[0];

                    if (!fecha) {
                      // Si aún no hay fecha, solo guardamos la hora parcialmente
                      setFormData({
                        ...formData,
                        p_r_fecha_y_hora_reunion: formatted, // solo la hora sin fecha
                      });
                    } else {
                      setFormData({
                        ...formData,
                        p_r_fecha_y_hora_reunion: `${fecha}T${formatted}`,
                      });
                    }

                    // Guardar el valor formateado como "previo" para la siguiente pulsación
                    timePrevRef.current = formatted;
                  }}
                  maxLength={5}
                  className="text-[16px]"
                />
              </div>
            </div>

            <div>
              <Label>Asunto</Label>
              <Input
                name="p_r_asunto"
                value={formData.p_r_asunto}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label>Estatus</Label>
              <Input
                name="p_r_estatus"
                value={formData.p_r_estatus}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setSelected(null)}
              style={{
                backgroundColor: "#db200b",
                color: "white",
                cursor: "pointer",
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              style={{
                backgroundColor: "#235391",
                color: "white",
                cursor: "pointer",
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}