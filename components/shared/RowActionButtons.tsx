"use client";

import { Button } from "@/components/ui/button";
import { SquarePen, Trash2, RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface RowActionButtonsProps {
  id: string;
  editPath: string;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  showDeleted?: boolean;
  onEdit?: (id: string) => void;
}

export const RowActionButtons: React.FC<RowActionButtonsProps> = ({
  id,
  editPath,
  onDelete,
  onRestore,
  showDeleted = false,
  onEdit,
}) => {
  return (
    <TooltipProvider>
      <div className="flex justify-end gap-2 pt-2">

        {showDeleted ? (
          /* 🔄 Reactivar */
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore?.(id)}
                className="flex items-center justify-center gap-2 border-green-600 text-green-700 hover:bg-green-50 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom">Reactivar</TooltipContent>
          </Tooltip>
        ) : (
          <>
            {/* ✏️ Editar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit?.(id)}
                  className="flex items-center justify-center gap-2 border-blue-600 text-blue-700 hover:bg-blue-50 transition-all"
                >
                  <SquarePen className="w-4 h-4" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="bottom">Editar</TooltipContent>
            </Tooltip>

            {/* 🗑️ Eliminar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(id)}
                  className="flex items-center justify-center gap-2 border-red-600 text-red-700 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="bottom">Eliminar</TooltipContent>
            </Tooltip>
          </>
        )}

      </div>
    </TooltipProvider>
  );
};