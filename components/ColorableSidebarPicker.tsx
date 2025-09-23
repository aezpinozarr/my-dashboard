"use client";

import * as React from "react";
import type { ComponentProps } from "react";
import { HexColorPicker } from "react-colorful";
import { AppSidebar } from "@/components/app-sidebar";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// contraste blanco/negro simple
function getContrast(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#FFFFFF";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

type Props = ComponentProps<typeof AppSidebar> & {
  defaultColor?: string; // #RRGGBB
};

export function ColorableSidebarPicker({
  defaultColor = "#0ea5e9",
  ...props
}: Props) {
  const [color, setColor] = React.useState(defaultColor);
  const fg = React.useMemo(() => getContrast(color), [color]);

  // (opcional) persistir en localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-color");
    if (saved) setColor(saved);
  }, []);
  React.useEffect(() => {
    localStorage.setItem("sidebar-color", color);
  }, [color]);

  return (
    <div
      style={
        {
          // solo fondo y texto del sidebar; no tocamos "primary" para no cambiar acentos
          "--sidebar": color,
          "--sidebar-foreground": fg,
        } as React.CSSProperties
      }
      className="relative"
    >
      {/* Botón flotante que abre el selector */}
      <div className="absolute right-2 top-2 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Color barra
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="flex flex-col items-center gap-3">
              <HexColorPicker color={color} onChange={setColor} />
              <div className="text-xs text-muted-foreground">{color.toUpperCase()}</div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tu sidebar original, intacto */}
      <AppSidebar {...props} />
    </div>
  );
}
