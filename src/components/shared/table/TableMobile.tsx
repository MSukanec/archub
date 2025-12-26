import { Fragment, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Column,
  EmptyStateConfig,
  RowAction,
  PrimaryRowAction,
  LeadingRowAction,
} from "./types";
import { TABLE_LABELS } from "./constants";
interface TableMobileProps<T> {
  columns: Column<T>[];
  data: T[];
  paginatedData: T[];
  hasOriginalData: boolean;
  hasFilteredData: boolean;
  hasActiveSearch: boolean;
  searchValue: string;
  selectable: boolean;
  isItemSelected: (item: T) => boolean;
  onSelectItem: (item: T, checked: boolean) => void;
  getItemId: (item: T) => string | number;
  onCardClick?: (item: T) => void;
  renderCard?: (item: T) => ReactNode;
  cardSpacing?: string;
  emptyState?: ReactNode;
  emptyStateConfig?: EmptyStateConfig;
  getRowClassName?: (item: T) => string;
  getIsInactive?: (item: T) => boolean;
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}
export function TableMobile<T>({
  columns,
  data,
  paginatedData,
  hasOriginalData,
  hasFilteredData,
  hasActiveSearch,
  searchValue,
  selectable,
  isItemSelected,
  onSelectItem,
  getItemId,
  onCardClick,
  renderCard,
  cardSpacing = "space-y-2",
  emptyState,
  emptyStateConfig,
  getRowClassName,
  getIsInactive,
  showPagination,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
}: TableMobileProps<T>) {
  if (!hasOriginalData) {
    return (
      <div className="lg:hidden">
        {emptyStateConfig ? (
          <div className="p-6">
            <EmptyState
              icon={emptyStateConfig.icon}
              title={emptyStateConfig.title}
              description={emptyStateConfig.description}
              action={
                emptyStateConfig.action ||
                (emptyStateConfig.actionButton ? (
                  <Button onClick={emptyStateConfig.actionButton.onClick}>
                    {emptyStateConfig.actionButton.label}
                  </Button>
                ) : undefined)
              }
            />
          </div>
        ) : emptyState ? (
          <div className="p-8 text-center">{emptyState}</div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {TABLE_LABELS.empty.noData}
          </div>
        )}
      </div>
    );
  }
  if (!hasFilteredData && hasActiveSearch) {
    return (
      <div className="lg:hidden p-8 text-center">
        <div className="text-sm text-muted-foreground">
          {TABLE_LABELS.empty.noResults} "{searchValue}"
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {TABLE_LABELS.empty.tryDifferent}
        </div>
      </div>
    );
  }
  return (
    <div className={cn("lg:hidden", cardSpacing)}>
      {paginatedData.map((item, index) => {
        const isInactive = getIsInactive ? getIsInactive(item) : false;
        if (renderCard) {
          return (
            <div
              key={getItemId(item)}
              className={cn(
                "relative",
                onCardClick && "cursor-pointer",
                isInactive && "opacity-50"
              )}
              onClick={() => onCardClick?.(item)}
            >
              {selectable && (
                <div
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isItemSelected(item)}
                    onCheckedChange={(checked) =>
                      onSelectItem(item, checked as boolean)
                    }
                    aria-label={`Seleccionar item ${index + 1}`}
                    className="h-4 w-4"
                  />
                </div>
              )}
              {renderCard(item)}
            </div>
          );
        }
        return (
          <div
            key={getItemId(item)}
            className={cn(
              "p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors",
              onCardClick && "cursor-pointer",
              isInactive && "opacity-50",
              getRowClassName?.(item)
            )}
            onClick={() => onCardClick?.(item)}
          >
            {selectable && (
              <div
                className="flex justify-end mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isItemSelected(item)}
                  onCheckedChange={(checked) =>
                    onSelectItem(item, checked as boolean)
                  }
                  aria-label={`Seleccionar item ${index + 1}`}
                  className="h-4 w-4"
                />
              </div>
            )}
            <div className="space-y-2">
              {columns.slice(0, 4).map((column) => (
                <div key={String(column.key)} className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    <span className={column.labelClassName}>{column.label}</span>
                  </span>
                  <span className="text-sm font-medium">
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || "-")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {showPagination && (
        <div className="flex items-center justify-between px-2 py-3">
          <div className="text-xs text-muted-foreground">
            {TABLE_LABELS.pagination.showing}{" "}
            {(currentPage - 1) * 100 + 1} -{" "}
            {Math.min(currentPage * 100, data.length)}{" "}
            {TABLE_LABELS.pagination.of} {data.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
