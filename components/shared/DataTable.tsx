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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  emptyMessage?: string;
  isLoading?: boolean;
  onTableInit?: (table: any) => void;
  columnVisibility: VisibilityState; // ✅ viene del page.tsx
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>; // ✅ viene del page.tsx
}

export function DataTable<TData>({
  data,
  columns,
  emptyMessage = "No hay registros disponibles.",
  isLoading = false,
  onTableInit,
  columnVisibility,
  setColumnVisibility, // ✅ ahora lo recibimos como prop
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

const table = useReactTable({
  data,
  columns,
  state: { sorting, columnVisibility }, // ✅ usa el que viene por prop
  onSortingChange: setSorting,
  onColumnVisibilityChange: setColumnVisibility, // ✅ también viene por prop
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
});

  React.useEffect(() => {
    if (onTableInit) {
      onTableInit(table);
    }
  }, [onTableInit, table, columnVisibility, sorting]);

  if (isLoading) {
    return <p className="text-gray-500 text-sm p-4">Cargando datos...</p>;
  }

  return (
    <div className="w-full overflow-x-auto border rounded-lg bg-white shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const isSorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={`${
                      header.column.getCanSort() ? "hover:bg-gray-100 cursor-pointer select-none" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {isSorted === "asc" && <ChevronUp size={14} />}
                      {isSorted === "desc" && <ChevronDown size={14} />}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-gray-400 py-6">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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