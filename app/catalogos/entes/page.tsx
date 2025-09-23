"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Ente = {
  value: string;
  label: string;
  tipo: string;
  tipoNombre: string;
  sector: string;
  createdAt?: string;
};

function readEntes(): Ente[] {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("catalogo-entes")
        : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function EntesPage() {
  const router = useRouter();
  const [entes, setEntes] = React.useState<Ente[]>([]);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setEntes(readEntes());
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "catalogo-entes") setEntes(readEntes());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entes;
    return entes.filter((e) =>
      [e.label, e.tipo, e.tipoNombre, e.sector].some((v) =>
        (v ?? "").toLowerCase().includes(term)
      )
    );
  }, [q, entes]);

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      {/* Botón de regresar */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Entes públicos
        </h1>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Consulta y administra los entes registrados. Total: {entes.length}
      </p>

      <Separator className="my-4" />

      {/* Buscador + Nuevo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div className="grid gap-2 w-full sm:max-w-sm">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Nombre, siglas, tipo o sector…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button
          onClick={() => router.push("/catalogos/entes/new")}
          style={{ backgroundColor: "#154c79", color: "white" }}
          className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <PlusCircle className="mr-2 size-4" />
          Nuevo ente
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay entes para mostrar.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.value} className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1.5 text-sm">
                <div>
                  <span className="text-muted-foreground">Siglas: </span>
                  <span className="font-medium">{e.tipo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo: </span>
                  <span className="font-medium">{e.tipoNombre}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sector: </span>
                  <span className="font-medium">{e.sector}</span>
                </div>
                {e.createdAt && (
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    Registrado: {new Date(e.createdAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}