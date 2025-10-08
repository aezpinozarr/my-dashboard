"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/context/UserContext"; // ✅ importa el contexto

// Función para detectar el backend actual
const getApiBase = (): string => {
  if (typeof window === "undefined") return "";
  if (window.location.hostname.includes("railway.app"))
    return "https://backend-licitacion-production.up.railway.app";
  if (window.location.protocol === "https:")
    return "https://127.0.0.1:8000";
  return "http://127.0.0.1:8000";
};

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const { setUser } = useUser(); // ✅ acceso al contexto global
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [form, setForm] = React.useState({
    username: "",
    password: "",
  });

  // Función principal de login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const base = getApiBase();

      const resp = await fetch(`${base}/seguridad/usuarios/login`, {
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

      // ✅ Guardar en el contexto global
      setUser({
        id: data.id,
        username: data.username,
        nombre: data.nombre,
        id_ente: data.id_ente,
        tipo: data.tipo,
      });

      // 🔁 Redirigir al dashboard
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
          {/* Formulario */}
          <form className="p-6 md:p-12" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8">
              {/* Encabezado */}
              <div className="flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold">Bienvenidos de nuevo</h1>
                <p className="text-muted-foreground text-balance text-lg">
                  Iniciar sesión para acceder
                </p>
              </div>

              {/* Usuario */}
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

              {/* Contraseña */}
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

              {/* Botón principal */}
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

              {/* Mensaje de error */}
              {errorMsg && (
                <p className="text-red-600 text-center text-sm">{errorMsg}</p>
              )}
            </div>
          </form>

          {/* Imagen lateral */}
          <div className="bg-muted relative hidden md:flex items-center justify-center">
            <img
              src="/Coat_of_arms_of_the_Tabasco_Congress.svg"
              alt="Image"
              className="h-[450px] w-auto object-contain relative left-[20px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
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