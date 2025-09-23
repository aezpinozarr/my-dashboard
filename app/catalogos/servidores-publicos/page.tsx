// app/catalogos/servidores-publicos/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Servidor = {
  value: string;      // id/slug único
  label: string;      // nombre del servidor/presidente
  enteValue: string;  // id del ente
  enteLabel: string;  // nombre del ente
  createdAt: string;  // ISO
};

function readServidores(): Servidor[] {
  try {
    const raw =
      typeof window !== "undefined"
        ? localStorage.getItem("catalogo-presidentes")
        : null;
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function ServidoresListPage() {
  const router = useRouter();
  const [items, setItems] = React.useState<Servidor[]>([]);
  const [q, setQ] = React.useState("");

  React.useEffect(() => {
    setItems(readServidores());
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "catalogo-presidentes") setItems(readServidores());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((s) =>
      [s.label, s.enteLabel].some((v) => (v ?? "").toLowerCase().includes(term))
    );
  }, [q, items]);

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Servidores públicos (Presidentes)
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Consulta y administra los servidores públicos registrados. Total: {items.length}
      </p>

      <Separator className="my-4" />

      {/* Acciones rápidas */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Nombre o ente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button
          onClick={() => router.push("/catalogos/servidores-publicos/new")}
          style={{ backgroundColor: "#154c79", color: "white" }}
          className="cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <PlusCircle className="mr-2 size-4" />
          Nuevo servidor
        </Button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay servidores para mostrar.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card key={s.value} className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.label}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1.5 text-sm">
                <div>
                  <span className="text-muted-foreground">Ente: </span>
                  <span className="font-medium">{s.enteLabel}</span>
                </div>
                <div className="mt-1.5 text-xs text-muted-foreground">
                  Registrado: {new Date(s.createdAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}