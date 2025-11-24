"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Settings2,
  Download,
  PlusCircle,
  LogOut,
  LayoutGrid,
  List,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface Props {
  viewMode: "table" | "cards";
  setViewMode: (mode: "table" | "cards") => void;
  onExport?: () => void;
  showExport?: boolean;
  newPath?: string;
  hideNew?: boolean;
  table?: any;
  showDeleted: boolean;
  setShowDeleted: React.Dispatch<React.SetStateAction<boolean>>;
  columnVisibility?: Record<string, boolean>;
  setColumnVisibility?: (v: Record<string, boolean>) => void;
  onNewClick?: () => void;
}

export function ActionButtonsGroup({
  viewMode,
  setViewMode,
  onExport,
  showExport = true,
  newPath,
  hideNew,
  table,
  columnVisibility,
  setColumnVisibility,
  onNewClick,
}: Props) {
  const router = useRouter();

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center justify-between w-full">
          
          {/* ---------------------- TOOLTIP: CONFIGURAR COLUMNAS + EXPORTAR ---------------------- */}
          {viewMode === "table" && (
            <div className="flex items-center rounded-full border border-gray-300 overflow-hidden shadow-sm bg-white mr-3">

              {/* Configurar columnas */}
              {/* Personalizar columnas */}
<Tooltip>
  <TooltipTrigger asChild>
    <button
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-[#F1F3F4] transition-all duration-200"
      onClick={(e) => {
        e.stopPropagation(); // ⚠ evita que el tooltip se cancele
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="flex items-center">
            <Settings2 size={18} className="text-gray-700" />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="max-h-80 overflow-auto">
          {table?.getAllLeafColumns().map((column: any) =>
            column.id !== "expander" ? (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={
                  columnVisibility && column.id in columnVisibility
                    ? columnVisibility[column.id]
                    : column.getIsVisible()
                }
                onCheckedChange={(checked) => {
                  if (setColumnVisibility) {
                    setColumnVisibility({
                      ...columnVisibility,
                      [column.id]: checked,
                    });
                  }
                  column.toggleVisibility(checked);
                }}
              >
                {typeof column.columnDef.header === "function"
                ? column.columnDef.header({ column })
                : column.columnDef.header}
              </DropdownMenuCheckboxItem>
            ) : null
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </button>
  </TooltipTrigger>

  <TooltipContent side="bottom">
    Personalizar columnas
  </TooltipContent>
</Tooltip>

              {/* Exportar CSV */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border-l border-gray-300 hover:bg-[#F1F3F4] transition-all duration-200"
                  >
                    <Download size={18} className="text-gray-700" />
                  </button>
                </TooltipTrigger>

                <TooltipContent side="bottom">Exportar CSV</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* ---------------------- TOOLTIP: SELECTOR VISTA TABLA / TARJETAS ---------------------- */}
          <div className="flex items-center rounded-full border border-gray-300 overflow-hidden shadow-sm bg-white mr-6">

            {/* Vista tabla */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200",
                    viewMode === "table"
                      ? "bg-[#E8F0FE] text-[#1A73E8] font-medium"
                      : "text-gray-600 hover:bg-[#F1F3F4]"
                  )}
                >
                  <List
                    size={18}
                    className={cn(
                      "transition-colors duration-200",
                      viewMode === "table" ? "text-[#1A73E8]" : "text-gray-600"
                    )}
                  />
                  {viewMode === "table" && (
                    <CheckCircle size={16} className="text-[#1A73E8]" />
                  )}
                </button>
              </TooltipTrigger>

              <TooltipContent side="bottom">Vista de tabla</TooltipContent>
            </Tooltip>

            {/* Vista tarjetas */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm transition-all duration-200 border-l border-gray-300",
                    viewMode === "cards"
                      ? "bg-[#E8F0FE] text-[#1A73E8] font-medium"
                      : "text-gray-600 hover:bg-[#F1F3F4]"
                  )}
                >
                  <LayoutGrid
                    size={18}
                    className={cn(
                      "transition-colors duration-200",
                      viewMode === "cards" ? "text-[#1A73E8]" : "text-gray-600"
                    )}
                  />
                  {viewMode === "cards" && (
                    <CheckCircle size={16} className="text-[#1A73E8]" />
                  )}
                </button>
              </TooltipTrigger>

              <TooltipContent side="bottom">Vista de tarjetas</TooltipContent>
            </Tooltip>

          </div>

          {/* ---------------------- TOOLTIP: NUEVO + SALIR ---------------------- */}
          <div className="flex items-center rounded-full overflow-hidden shadow-sm border border-gray-300 bg-white">

            {/* Nuevo */}
            {!hideNew && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (newPath) router.push(newPath);
                      else if (onNewClick) onNewClick();
                    }}
                    className="px-4 py-2 flex items-center justify-center bg-[#34e004] hover:bg-[#2fcc03] text-white text-sm transition-all duration-200"
                  >
                    <PlusCircle size={20} />
                  </button>
                </TooltipTrigger>

                <TooltipContent side="bottom">Nuevo</TooltipContent>
              </Tooltip>
            )}

            {!hideNew && <div className="w-px bg-gray-300" />}

            {/* Salir */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 flex items-center justify-center bg-[#db200b] hover:bg-[#c61b0a] text-white text-sm transition-all duration-200"
                >
                  <LogOut size={20} />
                </button>
              </TooltipTrigger>

              <TooltipContent side="bottom">Salir</TooltipContent>
            </Tooltip>

          </div>

        </div>
      </div>
    </TooltipProvider>
  );
}