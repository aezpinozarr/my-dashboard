"use client";

import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext"; // ✅ usamos el contexto global
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NotificationBadge } from "@/components/Notifications/NotificationBadge";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState, useEffect } from "react";

// ✅ Detectar automáticamente el entorno de ejecución
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.hostname.includes("railway")
      ? "https://backend-licitacion-production.up.railway.app"
      : window.location.hostname.includes("onrender")
      ? "https://backend-licitacion-1.onrender.com"
      : "http://127.0.0.1:8000"
    : "http://127.0.0.1:8000");

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { user, logout } = useUser(); // ✅ datos y cierre de sesión global

  const [enteDescripcion, setEnteDescripcion] = useState<string>("");

  useEffect(() => {
    if (user?.id_ente && !(user as any)?.ente_descripcion) {
      const url = `${API_BASE}/catalogos/entes?p_id=${user.id_ente}`;
      fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setEnteDescripcion(data[0].descripcion || "");
          }
        })
        .catch((err) => console.error("Error cargando descripción del ente:", err));
    }
  }, [user?.id_ente, user]);

  // ✅ Datos dinámicos o fallback
  const name = user?.nombre || user?.username || "Invitado";
  const userTipo = user?.tipo?.toUpperCase() || "SIN TIPO";
  // ✅ Obtener descripción real del ente desde el backend (ya incluida en la sesión o desde fetch)
  const userEnte = enteDescripcion || (user as any)?.ente_descripcion || "Sin ente asignado";
  const userSubinfo = `${userTipo} — ${userEnte}`;
  const avatar = "/avatars/default.jpg";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout(); // Limpia contexto + localStorage
    router.push("/");
  };

  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const url = `${API_BASE}/seguridad/notificaciones/?p_accion=CONSULTAR&p_id_usuario_destinatario=${user.id}`;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setNotifications(data.data);
          setHasUnread(data.data.some((n: any) => !n.leida));
        } else {
          console.warn("No se encontraron notificaciones");
        }
      })
      .catch((err) => console.error("Error cargando notificaciones:", err));
  }, [user?.id]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{userSubinfo}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Header del menú */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{userSubinfo}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Opciones extra */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Sheet>
                  <SheetTrigger asChild onClick={() => setHasUnread(false)}>
                    <div className="flex items-center w-full cursor-pointer px-2 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
                      <div className="relative mr-2">
                        <Bell className="h-4 w-4" />
                        {hasUnread && (
                          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <span className="text-sm font-normal">Notificaciones</span>
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Notificaciones</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-3 max-h-[80vh] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n: any) => (
                          <div key={n.id} className="border rounded-lg p-3">
                            <p className="text-sm font-medium">{n.mensaje}</p>
                            <p className="text-xs text-muted-foreground mt-1">{n.fecha}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center mt-10">
                          No hay notificaciones por el momento.
                        </p>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* ✅ Logout funcional */}
            <DropdownMenuItem onClick={handleLogout} className="flex items-center w-full cursor-pointer px-2 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="text-sm font-normal">Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}