"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  Row,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

// Re-export ColumnDef so consumers only need one import
export type { ColumnDef }

// ---------------------------------------------------------------------------
// Global fuzzy filter function
// ---------------------------------------------------------------------------

const globalFilterFn: FilterFn<unknown> = (
  row: Row<unknown>,
  _columnId: string,
  value: string,
) => {
  const search = value.toLowerCase()
  return Object.values(row.original as Record<string, unknown>).some((cell) =>
    String(cell ?? "")
      .toLowerCase()
      .includes(search),
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  /** Default number of rows per page (default: 100) */
  pageSize?: number
  /** Show global search input above the table */
  searchable?: boolean
  /** Placeholder for the search input */
  searchPlaceholder?: string
  /** Additional class for the wrapper */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<TData>({
  columns,
  data,
  pageSize = 100,
  searchable = true,
  searchPlaceholder = "Buscar…",
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  // Track which column headers have their filter input open
  const [openFilters, setOpenFilters] = React.useState<Set<string>>(new Set())

  const table = useReactTable({
    data,
    columns,
    filterFns: { global: globalFilterFn },
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const { pageIndex } = table.getState().pagination
  const totalFiltered = table.getFilteredRowModel().rows.length

  function toggleFilterOpen(columnId: string) {
    setOpenFilters((prev) => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }

  function clearColumnFilter(columnId: string) {
    table.getColumn(columnId)?.setFilterValue(undefined)
    setOpenFilters((prev) => {
      const next = new Set(prev)
      next.delete(columnId)
      return next
    })
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* ── Toolbar ── */}
      {searchable && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
            {globalFilter && (
              <button
                type="button"
                onClick={() => setGlobalFilter("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {totalFiltered.toLocaleString("es-PE")} de {data.length.toLocaleString("es-PE")} filas
          </span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-auto rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const col = header.column
                  const canSort = col.getCanSort()
                  const canFilter = col.getCanFilter()
                  const sorted = col.getIsSorted()
                  const filterValue = col.getFilterValue() as string | undefined
                  const hasActiveFilter = !!filterValue
                  const filterOpen = openFilters.has(header.id) || hasActiveFilter
                  // Respect column size; enforce 68px minimum
                  const declaredSize = header.getSize()
                  const width = declaredSize !== 150 ? Math.max(68, declaredSize) : undefined

                  return (
                    <TableHead
                      key={header.id}
                      className="p-0 text-xs"
                      style={{ width, minWidth: 68 }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex flex-col">
                          {/* ── Header row: label + sort + filter toggle ── */}
                          <div
                            className={cn(
                              "flex items-center gap-1 px-2 py-2 whitespace-nowrap",
                              (canSort || canFilter) && "cursor-pointer select-none",
                              canSort && "hover:text-foreground",
                            )}
                            onClick={() => {
                              if (canSort) col.toggleSorting()
                              if (canFilter && !canSort) toggleFilterOpen(header.id)
                            }}
                          >
                            <span className="flex-1">
                              {flexRender(col.columnDef.header, header.getContext())}
                            </span>

                            {/* Sort icon */}
                            {canSort && (
                              <span className="shrink-0 text-muted-foreground">
                                {sorted === "asc" ? (
                                  <ArrowUp className="size-3" />
                                ) : sorted === "desc" ? (
                                  <ArrowDown className="size-3" />
                                ) : (
                                  <ArrowUpDown className="size-3 opacity-40" />
                                )}
                              </span>
                            )}

                            {/* Filter toggle button */}
                            {canFilter && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFilterOpen(header.id)
                                }}
                                className={cn(
                                  "shrink-0 rounded p-0.5 transition-colors",
                                  hasActiveFilter
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground",
                                )}
                                title={filterOpen ? "Ocultar filtro" : "Filtrar columna"}
                              >
                                <Filter className="size-3" />
                              </button>
                            )}
                          </div>

                          {/* ── Filter input (shown on toggle) ── */}
                          {canFilter && filterOpen && (
                            <div className="flex items-center gap-1 border-t px-2 py-1.5">
                              <Input
                                autoFocus
                                value={filterValue ?? ""}
                                onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                                placeholder="Filtrar…"
                                className="h-6 min-w-0 flex-1 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {hasActiveFilter && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    clearColumnFilter(header.id)
                                  }}
                                  className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  {globalFilter || columnFilters.length > 0
                    ? "Sin resultados para la búsqueda."
                    : "No hay datos."}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/20">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ minWidth: 68 }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Página {pageIndex + 1} de {table.getPageCount()} ·{" "}
            {totalFiltered.toLocaleString("es-PE")} resultados
            {columnFilters.length > 0 || globalFilter
              ? ` (filtrado de ${data.length.toLocaleString("es-PE")})`
              : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-7 px-2"
            >
              <ChevronLeft className="size-3.5" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-7 px-2"
            >
              Siguiente
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}