"use client";

import * as React from "react";
import Link from "next/link";
import { CircleCheckIcon, CircleHelpIcon, CircleIcon, Bell } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000";

const components = [
  {
    title: "Catálogos",
    href: "/catalogos/entes",
    description: "Gestiona los catálogos del sistema como entes o servidores públicos.",
  },
  {
    title: "Proveedores",
    href: "/catalogos/proveedores",
    description: "Consulta, crea o edita proveedores registrados.",
  },
  {
    title: "Usuarios",
    href: "/seguridad/usuarios",
    description: "Administra los usuarios con acceso al sistema.",
  },
];

export function MainNavigation() {
  // Definir la interfaz para las notificaciones
  interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    leido: boolean;
  }

  const isMobile = useIsMobile();
  const { open } = useSidebar();

  const [notifications, setNotifications] = React.useState<Notificacion[]>([]);
  const [hasUnread, setHasUnread] = React.useState(false);

  const userId = 1;

  React.useEffect(() => {
    fetch(`${API_BASE}/seguridad/notificaciones/?p_accion=CONSULTAR&p_id_usuario_destinatario=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.data || []);
        setHasUnread((data.data || []).some((notif: Notificacion) => !notif.leido));
      })
      .catch(() => {
        setNotifications([]);
        setHasUnread(false);
      });
  }, [userId]);

  return (
    <div
      className={`
        sticky top-0 left-0 right-0 z-10 border-b bg-white transition-all duration-300
        ${open ? "md:pl-[270px]" : "md:pl-[90px]"}
        pl-0
      `}
    >
      <div className="w-full flex justify-center">
        <div className="max-w-7xl w-full flex justify-start items-center pl-80 pr-4">
          <NavigationMenu viewport={isMobile}>
          <NavigationMenuList className="flex-wrap">
            <NavigationMenuItem>
              <NavigationMenuTrigger>Inicio</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex flex-col justify-end rounded-md bg-gradient-to-b from-slate-100 to-slate-200 p-4 no-underline outline-hidden transition-all duration-200 select-none focus:shadow-md md:p-6"
                        href="/"
                      >
                        <div className="mb-2 text-lg font-medium sm:mt-4">Panel de Control</div>
                        <p className="text-muted-foreground text-sm leading-tight">
                          Accede a los módulos principales del sistema.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/dashboard" title="Dashboard">
                    Vista general del sistema.
                  </ListItem>
                  <ListItem href="/reportes" title="Reportes">
                    Genera reportes y estadísticas.
                  </ListItem>
                  <ListItem href="/configuracion" title="Configuración">
                    Personaliza los ajustes del sistema.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Catálogos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {components.map((component) => (
                    <ListItem key={component.title} title={component.title} href={component.href}>
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/ayuda">Ayuda</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem className="hidden md:block">
              <NavigationMenuTrigger>Estado</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[200px] gap-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex-row items-center gap-2">
                        <CircleHelpIcon /> Pendiente
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex-row items-center gap-2">
                        <CircleIcon /> En proceso
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="#" className="flex-row items-center gap-2">
                        <CircleCheckIcon /> Completado
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <div className="ml-auto flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="relative">
                    <Bell />
                    {hasUnread && <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Notificaciones</SheetTitle>
                  </SheetHeader>
                  {notifications.length > 0 ? (
                    <ul>
                      {notifications.map((notif: Notificacion) => (
                        <li key={notif.id} className="mb-2 border-b pb-2">
                          <p className="text-sm font-semibold">{notif.titulo}</p>
                          <p className="text-xs text-muted-foreground">{notif.mensaje}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay notificaciones por el momento.</p>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  </div>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link href={href}>
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}