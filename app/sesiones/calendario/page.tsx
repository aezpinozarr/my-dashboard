// app/sesiones/calendario/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

// ======================
// Tipos
// ======================
type Sesion = {
  id: number;
  id_ente: string;
  oficio_o_acta_numero: string;
  asunto: string;
  fecha: string;
  id_servidor_publico: number | null;
  comite: string | null;
  modo_sesion: string | null;
  id_clasificacion_licitacion: number | null;
  activo: boolean;
};

type Fuente = {
  id_calendario_sesiones: number;
  id_fuente_financiamiento: number;
  fuente_descripcion: string; // 👈 usamos el concatenado del SP
};

type Fecha = {
  id: number | null;
  id_calendario_sesiones: number;
  fecha: string;
  hora: string;
  activo: boolean;
};

type Entregable = {
  id_listado_entregables: number;
  descripcion: string;
};

// ======================
// Página principal
// ======================
export default function SesionesPage() {
  const [sesiones, setSesiones] = React.useState<Sesion[]>([]);
  const [entesMap, setEntesMap] = React.useState<Record<string, string>>({});
  const [servidoresMap, setServidoresMap] = React.useState<Record<number, string>>({});
  const [clasificacionMap, setClasificacionMap] = React.useState<Record<number, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"cards" | "table">("cards");
  const [switching, setSwitching] = React.useState(false);

  const fetchData = async () => {
    try {
      const respSes = await fetch(`${API_BASE}/sesiones/`);
      const dataSes = await respSes.json();
      setSesiones(Array.isArray(dataSes) ? dataSes : []);

      const respEntes = await fetch(`${API_BASE}/catalogos/entes`);
      const dataEntes = await respEntes.json();
      const entesDict: Record<string, string> = {};
      if (Array.isArray(dataEntes)) {
        dataEntes.forEach((e: { id: string; descripcion: string }) => {
          entesDict[e.id] = e.descripcion;
        });
      }
      setEntesMap(entesDict);

      const respServ = await fetch(
        `${API_BASE}/catalogos/servidores-publicos-ente?p_id=-99&p_id_ente=-99`
      );
      const dataServ = await respServ.json();
      const servDict: Record<number, string> = {};
      if (Array.isArray(dataServ)) {
        dataServ.forEach((s: { id: number; nombre: string }) => {
          servDict[s.id] = s.nombre;
        });
      }
      setServidoresMap(servDict);

      const respClas = await fetch(`${API_BASE}/catalogos/clasificacion-licitacion`);
      const dataClas = await respClas.json();
      const clasDict: Record<number, string> = {};
      if (Array.isArray(dataClas)) {
        dataClas.forEach((c: { id: number; descripcion: string }) => {
          clasDict[c.id] = c.descripcion;
        });
      }
      setClasificacionMap(clasDict);
    } catch (err) {
      console.error("❌ Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleViewChange = (v: "cards" | "table") => {
    setSwitching(true);
    setView(v);
    setTimeout(() => setSwitching(false), 400);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-md" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      {/* ===== Encabezado ===== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/dashboard" aria-label="Regresar al dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sesiones registradas</h1>
            <p className="text-gray-600 text-sm">
              Aquí puedes consultar, crear, editar y eliminar sesiones del calendario.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Tabs value={view} onValueChange={(v) => handleViewChange(v as "cards" | "table")}>
            <TabsList>
              <TabsTrigger value="cards">📇 Cards</TabsTrigger>
              <TabsTrigger value="table">📋 Tabla</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild style={{ backgroundColor: "#235391", color: "white" }}>
            <Link href="/sesiones/calendario/new">Nueva sesión</Link>
          </Button>
        </div>
      </div>

      {/* ===== Contenido ===== */}
      {sesiones.length === 0 ? (
        <p>No hay sesiones registradas.</p>
      ) : switching ? (
        view === "cards" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 11 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 11 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : view === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sesiones.map((s) => (
            <SesionCard
              key={s.id}
              sesion={s}
              entesMap={entesMap}
              servidoresMap={servidoresMap}
              clasificacionMap={clasificacionMap}
              onDeleted={fetchData}
            />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Asunto</TableHead>
              <TableHead>Oficio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Ente</TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Clasificación</TableHead>
              <TableHead>Fuentes</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Entregables</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sesiones.map((s) => (
              <SesionRow
                key={s.id}
                sesion={s}
                entesMap={entesMap}
                servidoresMap={servidoresMap}
                clasificacionMap={clasificacionMap}
                onDeleted={fetchData}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}

// ======================
// Tarjeta por sesión (Cards)
// ======================
function SesionCard({ sesion, entesMap, servidoresMap, clasificacionMap, onDeleted }: any) {
  const router = useRouter();
  const [fuentes, setFuentes] = React.useState<Fuente[]>([]);
  const [fechas, setFechas] = React.useState<Fecha[]>([]);
  const [entregables, setEntregables] = React.useState<Entregable[]>([]);

  React.useEffect(() => {
    fetch(`${API_BASE}/sesiones-fuentes/${sesion.id}`)
      .then((res) => res.json())
      .then((data: Fuente[]) => setFuentes(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_BASE}/sesiones-fechas/by-sesion/${sesion.id}`)
      .then((res) => res.json())
      .then((data: Fecha[]) => setFechas(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch(`${API_BASE}/sesiones-entregables/?id_calendario_sesiones=${sesion.id}`)
      .then((res) => res.json())
      .then((data: Entregable[]) => setEntregables(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [sesion.id]);

  return (
    <Card className="shadow-md hover:shadow-lg transition">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">
          Sesión #{sesion.id} – {sesion.asunto}
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">⋮</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => router.push(`/sesiones/calendario/edit/${sesion.id}`)}>
              ✏️ Editar
            </DropdownMenuItem>
            <DropdownMenuItem>🗑️ Eliminar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="grid gap-2 text-sm">
        <p><strong>Oficio:</strong> {sesion.oficio_o_acta_numero}</p>
        <p><strong>Fecha:</strong> {sesion.fecha}</p>
        <p><strong>Ente:</strong> {entesMap[sesion.id_ente]}</p>
        <p><strong>Servidor:</strong> {sesion.id_servidor_publico ? servidoresMap[sesion.id_servidor_publico] : "No asignado"}</p>
        <p><strong>Comité:</strong> {sesion.comite}</p>
        <p><strong>Modo:</strong> {sesion.modo_sesion}</p>
        <p><strong>Clasificación:</strong> {sesion.id_clasificacion_licitacion ? clasificacionMap[sesion.id_clasificacion_licitacion] : "No asignada"}</p>

        {/* Fuentes */}
        <div>
          <strong>Fuentes:</strong>{" "}
          {fuentes.length > 0 ? (
            <ul className="list-disc list-inside">
              {fuentes.map((f, i) => (
                <li key={`fuente-${i}`}>{f.fuente_descripcion}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500">Ninguna</span>
          )}
        </div>

        {/* Fechas */}
        <div>
          <strong>Fechas:</strong>{" "}
          {fechas.length > 0 ? (
            <ul className="list-disc list-inside">
              {fechas.map((f, i) => (
                <li key={`fecha-${i}`}>{f.fecha} – {f.hora}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-500">Ninguna</span>
          )}
        </div>

        {/* Entregables */}
        <div>
          <strong>Entregables:</strong>{" "}
          {entregables.length > 0 ? (
            <ul className="list-disc list-inside">
              {entregables.map((e, i) => <li key={`ent-${i}`}>{e.descripcion}</li>)}
            </ul>
          ) : (
            <span className="text-gray-500">Ninguno</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ======================
// Fila por sesión (Tabla)
// ======================
function SesionRow({ sesion, entesMap, servidoresMap, clasificacionMap, onDeleted }: any) {
  const router = useRouter();
  const [fuentes, setFuentes] = React.useState<Fuente[]>([]);

  React.useEffect(() => {
    fetch(`${API_BASE}/sesiones-fuentes/${sesion.id}`)
      .then((res) => res.json())
      .then((data: Fuente[]) => setFuentes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, [sesion.id]);

  return (
    <TableRow>
      <TableCell>{sesion.id}</TableCell>
      <TableCell>{sesion.asunto}</TableCell>
      <TableCell>{sesion.oficio_o_acta_numero}</TableCell>
      <TableCell>{sesion.fecha}</TableCell>
      <TableCell>{entesMap[sesion.id_ente]}</TableCell>
      <TableCell>{sesion.id_servidor_publico ? servidoresMap[sesion.id_servidor_publico] : "No asignado"}</TableCell>
      <TableCell>{sesion.id_clasificacion_licitacion ? clasificacionMap[sesion.id_clasificacion_licitacion] : "No asignada"}</TableCell>
      <TableCell>{fuentes.length > 0 ? fuentes.map((f) => f.fuente_descripcion).join(", ") : "—"}</TableCell>
    </TableRow>
  );
}