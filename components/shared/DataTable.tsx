"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  emptyMessage?: string;
  isLoading?: boolean;
  onTableInit?: (table: any) => void;
  columnVisibility: VisibilityState;
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>;
}

export function DataTable<TData>({
  data,
  columns,
  emptyMessage = "No hay registros disponibles.",
  isLoading = false,
  onTableInit,
  columnVisibility,
  setColumnVisibility,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

React.useEffect(() => {
  onTableInit?.(table);
}, [table]);

  if (isLoading) {
    return <p className="text-gray-500 text-sm p-4">Cargando datos...</p>;
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">

      <Table>
        {/* 🔵 HEADER AZUL */}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSorted = header.column.getIsSorted();

                return (
                  <TableHead
                    key={header.id}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    className={`py-2 px-3 text-xs font-semibold text-white bg-[#2563eb] text-center border-b border-gray-300
                      ${
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:bg-[#1e4fc7]"
                          : ""
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}

                      {/* Sorting icons blancos */}
                      {isSorted === "asc" && (
                        <ChevronUp size={14} className="text-white" />
                      )}
                      {isSorted === "desc" && (
                        <ChevronDown size={14} className="text-white" />
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        {/* 🔘 CUERPO DE LA TABLA */}
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-gray-400 py-6"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, idx) => (
              <TableRow
                key={row.id}
                className={
                  idx % 2 === 0 ? "bg-white" : "bg-gray-200"
                } // 🟣 FILAS ALTERNADAS
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2 px-3">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

    </div>
  );
}