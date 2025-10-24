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
import { useUser } from "@/context/UserContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  const userData = user
    ? {
        name: user.nombre || user.username,
        email: `${user.username}`,
        avatar: "/avatars/default.jpg",
      }
    : {
        name: "Invitado",
        email: "sin-sesion@local",
        avatar: "/avatars/default.jpg",
      };

  // ======================================
  // 💾 Estado de menús abiertos (persistente)
  // ======================================
  const [openMenus, setOpenMenus] = React.useState<string[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false); // ← se usa para montar NavMain solo después de cargar localStorage

  // Cargar desde localStorage al iniciar
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebarOpenMenus");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setOpenMenus(parsed);
      }
    } catch {
      setOpenMenus([]);
    } finally {
      // 🔁 fuerza render cuando ya cargó el estado guardado
      setIsLoaded(true);
    }
  }, []);

  // Guardar al cambiar
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("sidebarOpenMenus", JSON.stringify(openMenus));
    }
  }, [openMenus, isLoaded]);

  // Alternar apertura
  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  // ===============================
  // 🧭 Menú principal
  // ===============================
  const navData = [
    {
      title: "Sesiones",
      url: "#",
      icon: SquareTerminal,
      isActive: openMenus.includes("Sesiones"),
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
      isActive: openMenus.includes("Seguridad"),
      items: [{ title: "Usuarios", url: "/seguridad/usuarios" }],
    },
    {
      title: "Catálogos",
      url: "#",
      icon: Bot,
      isActive: openMenus.includes("Catálogos"),
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
      isActive: openMenus.includes("Procesos"),
      items: [
        { title: "Seguimiento de procesos", url: "/procesos" },
        { title: "Nuevo seguimiento", url: "/procesos/new" },
      ],
    },

  
// ✅ Solo visible para usuarios tipo RECTOR
...(user?.tipo?.toLowerCase() === "rector"
  ? [
      {
        title: "Rector",
        url: "#",
        icon: SquareTerminal,
        isActive: openMenus.includes("Rector"),
        items: [
          { title: "Seguimiento de rector", url: "/seguimiento-rector" },
          { title: "Reportes P. Ajudicados", url: "/seguimiento-rector/reportes" },
        ],
      },
    ]
  : []),

  ];

  const teams = [
    {
      name: "Gobierno de Tabasco",
      logo: GalleryVerticalEnd,
      plan: "Empresa",
    },
  ];

  // 🔁 mientras carga el estado, no renderizamos NavMain (evita cierre visual)
  if (!isLoaded) return null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain
          items={navData}
          openMenus={openMenus}
          onToggleMenu={toggleMenu}
        />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}