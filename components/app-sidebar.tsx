"use client";

import * as React from "react";
import { Bot, GalleryVerticalEnd, SquareTerminal } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext"; // ✅ Usa el contexto global

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser(); // ✅ Accede a los datos del usuario logueado

  // ✅ Construye la información del usuario desde el contexto
  const userData = user
    ? {
        name: user.nombre || user.username,
        email: `${user.username}@correo.com`,
        avatar: "/avatars/default.jpg",
      }
    : {
        name: "Invitado",
        email: "sin-sesion@local",
        avatar: "/avatars/default.jpg",
      };

  // ✅ Menú principal dinámico
  const navData = [
    {
      title: "Sesiones",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Calendario", url: "/sesiones/calendario" },
        { title: "Nueva sesión (Calendario)", url: "/sesiones/calendario/new" },
        { title: "Fechas de sesiones (Pivot)", url: "/sesiones/fechas-pivot" },
      ],
    },
    {
      title: "Seguridad",
      url: "#",
      icon: Bot,
      isActive: true,
      items: [{ title: "Usuarios", url: "/seguridad/usuarios" }],
    },
    {
      title: "Catálogos",
      url: "#",
      icon: Bot,
      items: [
        { title: "Entes", url: "/catalogos/entes" },
        { title: "Rubros", url: "/catalogos/rubros" },
        { title: "Proveedores", url: "/catalogos/proveedores" },
        { title: "Servidores Públicos", url: "/catalogos/servidores-publicos" },
        { title: "Entes Servidores Público", url: "/catalogos/servidores-publicos-ente" },
      ],
    },

    {
      title: "Procesos",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Nuevo seguimiento", url: "/procesos/new" },
      ],
    },
  ];

  // ✅ Equipos (TeamSwitcher)
  const teams = [
    {
      name: "Gobierno de Tabasco",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Encabezado */}
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>

      {/* Contenido principal */}
      <SidebarContent>
        <NavMain items={navData} />
      </SidebarContent>

      {/* Footer: usuario logueado */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      {/* Botón flotante (colapsar/expandir) */}
      <SidebarRail />
    </Sidebar>
  );
}