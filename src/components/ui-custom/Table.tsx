import React, { useState, useMemo, Fragment } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc" | null;

interface TableProps<T = any> {
  columns: {
    key: keyof T | string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean; // Por defecto true, usar false para deshabilitarlo
    sortType?: "string" | "number" | "date";
    width?: string; // Nuevo: ancho personalizado (ej: "10%", "100px", etc.)
  }[];
  data: T[];
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
  // Nuevas props para selección múltiple
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (selectedItems: T[]) => void;
  getItemId?: (item: T) => string | number;
  // Nueva prop para personalizar el estilo de las filas
  getRowClassName?: (item: T) => string;
  // Nueva prop para click-to-edit en cards
  onCardClick?: (item: T) => void;
  // Nueva prop para ordenamiento inicial
  defaultSort?: {
    key: string;
    direction: "asc" | "desc";
  };
  // Nueva prop para renderizado de cards en mobile
  renderCard?: (item: T) => React.ReactNode;
  // Nuevo: Espaciado opcional para cards
  cardSpacing?: string;
  // 🆕 NUEVAS FUNCIONALIDADES
  // Fila de totales al final
  renderFooterRow?: () => React.ReactNode;
  // Agrupamiento por columna
  groupBy?: keyof T | string;
  renderGroupHeader?: (groupKey: string, groupRows: T[]) => React.ReactNode;
  // Modos de visualización
  mode?: "default" | "budget" | "construction";
}

export function Table<T = any>({
  columns,
  data,
  emptyState,
  isLoading = false,
  className,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId = (item: T) => (item as any).id,
  getRowClassName,
  onCardClick,
  defaultSort,
  renderCard,
  cardSpacing = "space-y-2",
  // 🆕 NUEVAS FUNCIONALIDADES
  renderFooterRow,
  groupBy,
  renderGroupHeader,
  mode = "default",
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSort?.key || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction || null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const showPagination = data.length > itemsPerPage;

  // Helper function to handle sort logic
  const handleSort = (
    key: string,
    sortType: "string" | "number" | "date" = "string",
  ) => {
    if (sortKey === key) {
      setSortDirection((prev) => {
        if (prev === "asc") return "desc";
        if (prev === "desc") return null;
        return "asc";
      });
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    if (sortDirection === null) {
      setSortKey(null);
    }
  };

  // 🆕 AGRUPAMIENTO DE DATOS
  const groupedData = useMemo(() => {
    const sortedData = (() => {
      if (!sortKey || !sortDirection) return data;

      return [...data].sort((a, b) => {
        const column = columns.find((col) => col.key === sortKey);
        const sortType = column?.sortType || "string";

        const aValue = a[sortKey as keyof T];
        const bValue = b[sortKey as keyof T];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? -1 : 1;
        if (bValue == null) return sortDirection === "asc" ? 1 : -1;

        let comparison = 0;

        switch (sortType) {
          case "number":
            comparison = (Number(aValue) || 0) - (Number(bValue) || 0);
            break;
          case "date":
            const dateA = new Date(String(aValue));
            const dateB = new Date(String(bValue));
            comparison = dateA.getTime() - dateB.getTime();
            
            // If dates are equal and we're sorting by movement_date, 
            // use created_at as secondary criteria
            if (comparison === 0 && sortKey === "movement_date") {
              const createdA = new Date(String((a as any).created_at || aValue));
              const createdB = new Date(String((b as any).created_at || bValue));
              comparison = createdA.getTime() - createdB.getTime();
            }
            break;
          case "string":
          default:
            comparison = String(aValue).localeCompare(String(bValue));
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
    })();

    // Si no hay agrupamiento, devolver los datos como un solo grupo
    if (!groupBy) {
      return { 'all': sortedData };
    }

    // Agrupar datos por la clave especificada
    const grouped = sortedData.reduce((acc, item) => {
      const groupKey = String(item[groupBy as keyof T] || 'Sin grupo');
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>);

    return grouped;
  }, [data, sortKey, sortDirection, columns, groupBy]);

  // Aplanar datos agrupados para paginación
  const flattenedData = useMemo(() => {
    return Object.values(groupedData).flat();
  }, [groupedData]);

  // Pagination - usando flattenedData en lugar de sortedData
  const totalPages = Math.ceil(flattenedData.length / itemsPerPage);
  const paginatedData = showPagination
    ? flattenedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      )
    : flattenedData;

  const isItemSelected = (item: T) => {
    return selectedItems.some(
      (selectedItem) => getItemId(selectedItem) === getItemId(item),
    );
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(
        selectedItems.filter(
          (selectedItem) => getItemId(selectedItem) !== getItemId(item),
        ),
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      // Add all items from current page to selection
      const newSelectedItems = [...selectedItems];
      paginatedData.forEach((item) => {
        if (!isItemSelected(item)) {
          newSelectedItems.push(item);
        }
      });
      onSelectionChange(newSelectedItems);
    } else {
      // Remove all items from current page from selection
      const currentPageIds = new Set(
        paginatedData.map((item) => getItemId(item)),
      );
      const filteredSelection = selectedItems.filter(
        (item) => !currentPageIds.has(getItemId(item)),
      );
      onSelectionChange(filteredSelection);
    }
  };

  const getGridTemplateColumns = () => {
    const baseColumns = columns
      .map((col) => col.width || "minmax(0, 1fr)")
      .join(" ");
    return selectable ? `40px ${baseColumns}` : baseColumns;
  };

  // Function to get sort icon for column header
  const getSortIcon = (key: string) => {
    if (sortKey !== key)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    if (sortDirection === "asc")
      return <ChevronUp className="ml-1 h-3 w-3 text-accent" />;
    if (sortDirection === "desc")
      return <ChevronDown className="ml-1 h-3 w-3 text-accent" />;
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
  };

  // Handle the special case for numbers with thousands formatting (accounting for TypeScript strict mode)
  const formatSortableValue = (key: string, value: any): any => {
    const column = columns.find((col) => col.key === key);
    if (column?.sortType === "number" && typeof value === "number") {
      return value as T[keyof T];
    }
    if (column?.sortType === "number" && typeof value !== "number") {
      return Number(value) as T[keyof T];
    }
    if (column?.sortType === "string" && typeof value !== "string") {
      return String(value) as T[keyof T];
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Desktop loading skeleton */}
        <div className="hidden lg:block">
          <div
            className="grid gap-4 p-4 bg-muted/50 rounded-lg"
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
          >
            {columns.map((_, index) => (
              <div key={index} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid gap-4 p-4 border rounded-lg"
              style={{ gridTemplateColumns: getGridTemplateColumns() }}
            >
              {columns.map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-muted/50 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile loading skeleton */}
        <div className="lg:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg mb-2">
              <div className="space-y-3">
                {columns.slice(0, 4).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return <div className={cn("space-y-3", className)}>{emptyState}</div>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-t-lg border border-[var(--table-header-border)]">
        {/* Column Headers */}
        <div
          className="grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]"
          style={{ gridTemplateColumns: getGridTemplateColumns() }}
        >
          {selectable && (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={
                  paginatedData.length > 0 &&
                  paginatedData.every((item) => isItemSelected(item))
                }
                onCheckedChange={handleSelectAll}
                aria-label="Seleccionar todos"
                className="h-3 w-3"
              />
            </div>
          )}
          {columns.map((column) => (
            <button
              key={String(column.key)}
              className={cn(
                "flex items-center justify-start text-left transition-colors hover:text-accent",
                column.sortable !== false && "cursor-pointer",
              )}
              onClick={() =>
                column.sortable !== false &&
                handleSort(String(column.key), column.sortType)
              }
              disabled={column.sortable === false}
            >
              {column.label}
              {column.sortable !== false && getSortIcon(String(column.key))}
            </button>
          ))}
        </div>

        {/* Table Rows con agrupamiento */}
        <div>
          {groupBy ? (
            // Renderizado con agrupamiento
            Object.entries(groupedData).map(([groupKey, groupRows]) => (
              <Fragment key={groupKey}>
                {/* Header de grupo */}
                {renderGroupHeader && (
                  <div className={cn(
                    "grid gap-4 px-4 py-3",
                    mode === "budget" && "bg-[var(--accent)] text-white border-b border-[var(--table-row-border)]",
                    mode === "construction" && "bg-[var(--accent)] text-white border-b border-[var(--table-row-border)]",
                    mode === "default" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]",
                    "text-xs font-medium"
                  )}
                  style={{ gridTemplateColumns: getGridTemplateColumns() }}
                  >
                    {renderGroupHeader(groupKey, groupRows)}
                  </div>
                )}
                
                {/* Filas del grupo */}
                {groupRows.map((item, index) => (
                  <div
                    key={getItemId(item)}
                    className={cn(
                      "group relative grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors",
                      index < groupRows.length - 1 ? "border-b border-[var(--table-row-border)]" : "",
                      getRowClassName?.(item),
                    )}
                    style={{ gridTemplateColumns: getGridTemplateColumns() }}
                  >
                    {selectable && (
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isItemSelected(item)}
                          onCheckedChange={(checked) =>
                            handleSelectItem(item, checked as boolean)
                          }
                          aria-label={`Seleccionar fila ${index + 1}`}
                          className="h-3 w-3"
                        />
                      </div>
                    )}
                    {columns.map((column) => (
                      <div
                        key={String(column.key)}
                        className={cn(
                          "text-xs flex items-center justify-start",
                          mode === "budget" && "text-[var(--table-row-fg)]",
                          mode === "construction" && "text-[var(--table-row-fg)]"
                        )}
                      >
                        {column.render
                          ? column.render(item)
                          : String(item[column.key as keyof T] || "-")}
                      </div>
                    ))}
                  </div>
                ))}
              </Fragment>
            ))
          ) : (
            // Renderizado sin agrupamiento (comportamiento original)
            paginatedData.map((item, index) => (
              <div
                key={getItemId(item)}
                className={cn(
                  "group relative grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-xs hover:bg-[var(--table-row-hover-bg)] transition-colors",
                  index < paginatedData.length - 1
                    ? "border-b border-[var(--table-row-border)]"
                    : "",
                  getRowClassName?.(item),
                )}
                style={{ gridTemplateColumns: getGridTemplateColumns() }}
              >
                {selectable && (
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isItemSelected(item)}
                      onCheckedChange={(checked) =>
                        handleSelectItem(item, checked as boolean)
                      }
                      aria-label={`Seleccionar fila ${index + 1}`}
                      className="h-3 w-3"
                    />
                  </div>
                )}
                {columns.map((column) => (
                  <div
                    key={String(column.key)}
                    className="text-xs flex items-center justify-start"
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || "-")}
                  </div>
                ))}
              </div>
            ))
          )}
          
          {/* 🆕 FILA DE TOTALES */}
          {renderFooterRow && (
            <div className={cn(
              "grid gap-4 px-4 py-3",
              mode === "budget" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]",
              mode === "construction" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]",
              mode === "default" && "bg-[var(--table-header-bg)] text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]",
              "text-xs font-medium"
            )}
            style={{ gridTemplateColumns: getGridTemplateColumns() }}
            >
              {renderFooterRow()}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {paginatedData.map((item, index) =>
          renderCard ? (
            // Use custom card renderer if provided
            <div key={index} onClick={() => onCardClick?.(item)}>
              {renderCard(item)}
            </div>
          ) : (
            // Default card layout
            <div
              key={index}
              className={cn(
                "p-3 border border-[var(--card-border)] rounded-lg mb-2 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] transition-colors cursor-pointer",
                getRowClassName?.(item),
              )}
              onClick={() => onCardClick?.(item)}
            >
              {selectable && (
                <div className="flex items-center justify-between mb-2 pb-2 border-b">
                  <span className="text-xs font-medium text-muted-foreground">
                    Seleccionar
                  </span>
                  <Checkbox
                    checked={isItemSelected(item)}
                    onCheckedChange={(checked) => {
                      handleSelectItem(item, checked === true);
                    }}
                    aria-label="Seleccionar elemento"
                    className="h-4 w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {columns
                  .filter((_, idx) => idx < 6)
                  .map((column) => {
                    const value = column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || "-");

                    return (
                      <div
                        key={String(column.key)}
                        className="flex flex-col min-w-0"
                      >
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {column.label}
                        </span>
                        <div className="text-sm font-medium truncate">
                          {value}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {columns.length > 6 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {columns.slice(6).map((column) => {
                      const value = column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] || "-");

                      return (
                        <div
                          key={String(column.key)}
                          className="flex flex-col min-w-0"
                        >
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {column.label}
                          </span>
                          <div className="text-sm font-medium truncate">
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {/* Pagination Controls */}
      {showPagination && (
        <div className="mt-4 pt-4 border-t border-[var(--table-border)]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[var(--muted-fg)]">
              Mostrando{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                flattenedData.length,
              )}{" "}
              a {Math.min(currentPage * itemsPerPage, flattenedData.length)} de{" "}
              {flattenedData.length} entradas
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => {
                  // Show first page, last page, current page, and pages around current
                  const isVisible =
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 1;

                  if (
                    !isVisible &&
                    pageNum !== 2 &&
                    pageNum !== totalPages - 1
                  ) {
                    // Show ellipsis
                    if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span
                          key={pageNum}
                          className="px-1 text-[var(--muted-fg)]"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[32px]"
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
