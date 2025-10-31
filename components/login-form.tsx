"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext"; // ✅ Contexto global

// 🔧 NUEVA función para detectar API base correctamente
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000");

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const { setUser } = useUser();
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [form, setForm] = React.useState({
    username: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const resp = await fetch(`${API_BASE}/seguridad/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_username: form.username,
          p_password: form.password,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.exito) {
        throw new Error(data.mensaje || "Error de autenticación");
      }

      // ✅ Guardar sesión global con los datos correctos
      setUser({
        id: data.usuario.id,
        username: data.usuario.username,
        nombre: data.usuario.nombre,
        id_ente: data.usuario.id_ente,
        tipo: data.usuario.tipo,
      });

      // ✅ Guardar cookie
      document.cookie = `session_token=${data.usuario.username}; path=/; secure; samesite=strict`;

      // ✅ Redirigir al dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ Error al autenticar usuario:", err);
      setErrorMsg(err.message || "Error al autenticar usuario");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* FORMULARIO */}
          <form className="p-6 md:p-12" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold">Bienvenidos de nuevo</h1>
                <p className="text-muted-foreground text-balance text-lg">
                  Iniciar sesión para acceder
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Usuario"
                  required
                  className="h-12 text-lg"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="h-12 text-lg"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              {errorMsg && (
                <p className="text-red-600 text-center text-sm">{errorMsg}</p>
              )}
            </div>
          </form>

          {/* IMAGEN LATERAL */}
          <div className="bg-muted relative hidden md:flex items-center justify-center">
            <img
              src="/Coat_of_arms_of_the_Tabasco_Congress.svg"
              alt="Image"
              className="h-[450px] w-auto object-contain relative left-[20px]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>.
      </div>
    </div>
  );
}