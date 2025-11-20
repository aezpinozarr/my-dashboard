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

interface Props {
  viewMode: "table" | "cards";
  setViewMode: (mode: "table" | "cards") => void;
  onExport?: () => void;
  showExport?: boolean;
  newPath?: string;
  hideNew?: boolean;
  table?: any; // ✅ nueva prop para recibir la instancia de la tabla
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
    <div className="flex flex-col items-end gap-2">
      {/* Fila superior: selector de vista a la izquierda y Nuevo/Salir a la derecha */}
      <div className="flex items-center justify-between w-full">
        
        {viewMode === "table" && (
          <div className="flex items-center rounded-full border border-gray-300 overflow-hidden shadow-sm bg-white mr-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-[#F1F3F4] transition-all duration-200"
                  title="Columnas"
                >
                  <Settings2 size={18} className="text-gray-700" />
                </button>
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
                      {column.columnDef.header as string}
                    </DropdownMenuCheckboxItem>
                  ) : null
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border-l border-gray-300 hover:bg-[#F1F3F4] transition-all duration-200"
              title="Exportar CSV"
            >
              <Download size={18} className="text-gray-700" />
            </button>
          </div>
        )}

        {/* Selector de vista estilo Google Drive */}
        <div className="flex items-center rounded-full border border-gray-300 overflow-hidden shadow-sm bg-white mr-6">
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
        </div>

        {/* Nuevo y Salir unidos estilo selector */}
        <div className="flex items-center rounded-full overflow-hidden shadow-sm border border-gray-300 bg-white">
          
          {/* Nuevo */}
          {!hideNew && (
            <button
              onClick={() => {
                if (newPath) {
                  router.push(newPath);
                } else if (onNewClick) {
                  onNewClick();
                }
              }}
              className="px-4 py-2 flex items-center justify-center bg-[#34e004] hover:bg-[#34e004] text-white text-sm transition-all duration-200"
              title="Nuevo"
            >
              <PlusCircle size={20} />
            </button>
          )}

          {/* Divider */}
          {!hideNew && (
            <div className="w-px bg-gray-300" />
          )}

          {/* Salir */}
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 flex items-center justify-center bg-[#db200b] hover:bg-[#db200b] text-white text-sm transition-all duration-200"
            title="Salir al dashboard"
          >
            <LogOut size={20} />
          </button>

        </div>

      </div>

    </div>
  );
}