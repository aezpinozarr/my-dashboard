"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Gobierno De Tabasco",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    
  ],
  navMain: [
    {
      title: "Sesiones",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Calendario",
          url: "/sesiones/calendario",
        },

        {
          title: "Nueva sesión (Calendario)",
          url: "/sesiones/calendario/new",
        },

        {
          title: "Fechas de sesiones (Pivot)",
          url: "/sesiones/fechas-pivot",
        },
      ],
    },
    {
      title: "Catálogos",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Entes",
          url: "/catalogos/entes",
        },

        {
          title: "Rubros",
          url: "/catalogos/rubros",
        },

        {
          title: "Proveedores",
          url: "/catalogos/proveedores",
        },

         {
          title: "Servidores Públicos",
          url: "/catalogos/servidores-publicos",
        },

        {
          title: "Entes Servidores Público",
          url: "/catalogos/servidores-publicos-ente",
        },
      ],
    },
  ],
  
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
