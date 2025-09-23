"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"   // spinner de lucide-react

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    // Simulación de petición async (ejemplo: login con backend)
    await new Promise((res) => setTimeout(res, 1500))

    // Redirigir al dashboard
    router.push("/dashboard")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-12" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8">
              {/* Encabezado */}
              <div className="flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold">Bienvenidos de nuevo</h1>
                <p className="text-muted-foreground text-balance text-lg">
                  Iniciar sesión para acceder
                </p>
              </div>

              {/* Correo */}
              <div className="grid gap-3">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  className="h-12 text-lg"
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
  )
}