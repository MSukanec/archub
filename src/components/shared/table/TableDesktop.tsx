import { Fragment, ReactNode } from "react";
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
import { EmptyState } from "@/components/shared/EmptyState";
import { TableTopBar } from "./TableTopBar";
import { TableRow, InactiveSeparator } from "./TableRow";
import { TableGroup } from "./TableGroup";
import {
  Column,
  TopBarConfig,
  EmptyStateConfig,
  RowAction,
  PrimaryRowAction,
  LeadingRowAction,
  TableMode,
  SortDirection,
  HeaderActions,
} from "./types";
import { getColumnAlignment, getJustifyClass } from "./utils";
import { TABLE_LABELS } from "./constants";

interface TableDesktopProps<T> {
  columns: Column<T>[];
  data: T[];
  paginatedData: T[];
  groupedData: Record<string, T[]>;
  hasOriginalData: boolean;
  hasFilteredData: boolean;
  hasActiveSearch: boolean;
  searchValue: string;
  gridTemplateColumns: string;
  sortKey: string | null;
  sortDirection: SortDirection;
  onSort: (key: string, sortType?: "string" | "number" | "date") => void;
  selectable: boolean;
  selectedItems: T[];
  isItemSelected: (item: T) => boolean;
  onSelectItem: (item: T, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onClearSelection: () => void;
  selectedCount: number;
  getItemId: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => RowAction[];
  primaryRowAction?: (item: T) => PrimaryRowAction | null;
  leadingRowAction?: (item: T) => LeadingRowAction | null;
  hideActions?: boolean;
  getRowClassName?: (item: T) => string;
  groupBy?: keyof T | string;
  renderGroupHeader?: (groupKey: string, groupRows: T[]) => ReactNode;
  mode?: TableMode;
  topBar?: TopBarConfig;
  searchInputValue: string;
  onSearchChange: (value: string) => void;
  isFilterActive: boolean;
  onClearFilters: () => void;
  headerActions?: HeaderActions;
  showDoubleHeader?: boolean;
  emptyState?: ReactNode;
  emptyStateConfig?: EmptyStateConfig;
  renderFooterRow?: () => ReactNode;
  getIsInactive?: (item: T) => boolean;
  inactiveSeparatorLabel?: string;
  showInactiveSeparator?: boolean;
  showPagination: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function TableDesktop<T>({
  columns,
  data,
  paginatedData,
  groupedData,
  hasOriginalData,
  hasFilteredData,
  hasActiveSearch,
  searchValue,
  gridTemplateColumns,
  sortKey,
  sortDirection,
  onSort,
  selectable,
  selectedItems,
  isItemSelected,
  onSelectItem,
  onSelectAll,
  onClearSelection,
  selectedCount,
  getItemId,
  onRowClick,
  rowActions,
  primaryRowAction,
  leadingRowAction,
  hideActions = false,
  getRowClassName,
  groupBy,
  renderGroupHeader,
  mode = "default",
  topBar,
  searchInputValue,
  onSearchChange,
  isFilterActive,
  onClearFilters,
  headerActions,
  showDoubleHeader = false,
  emptyState,
  emptyStateConfig,
  renderFooterRow,
  getIsInactive,
  inactiveSeparatorLabel = TABLE_LABELS.inactive.separator,
  showInactiveSeparator = true,
  showPagination,
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
}: TableDesktopProps<T>) {
  const getSortIcon = (key: string) => {
    if (sortKey !== key)
      return <ArrowUpDown className="ml-1 h-3 w-3 text-accent" />;
    if (sortDirection === "asc")
      return <ChevronUp className="ml-1 h-3 w-3 text-accent" />;
    if (sortDirection === "desc")
      return <ChevronDown className="ml-1 h-3 w-3 text-accent" />;
    return <ArrowUpDown className="ml-1 h-3 w-3 text-accent" />;
  };

  const hasActions = !!rowActions;

  return (
    <div className="hidden lg:block overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-lg">
      <TableTopBar
        topBar={topBar}
        selectable={selectable}
        selectedCount={selectedCount}
        onClearSelection={onClearSelection}
        searchInputValue={searchInputValue}
        onSearchChange={onSearchChange}
        isFilterActive={isFilterActive}
        onClearFilters={onClearFilters}
      />

      {headerActions && showDoubleHeader && (
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)]"
          style={{
            backgroundColor: "var(--card-bg)",
            color: "var(--card-fg)",
          }}
        >
          <div className="flex items-center gap-2">
            {headerActions.leftActions}
          </div>
          <div className="flex items-center gap-2">
            {headerActions.rightActions}
          </div>
        </div>
      )}

      <div
        className={cn("grid gap-2 px-4 py-3 text-xs font-medium border-b")}
        style={{
          gridTemplateColumns,
          backgroundColor: "var(--table-header-bg)",
          color: "var(--table-header-fg)",
          borderBottomColor: "var(--table-header-border)",
        }}
      >
        {selectable && (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                paginatedData.length > 0 &&
                paginatedData.every((item) => isItemSelected(item))
              }
              onCheckedChange={onSelectAll}
              aria-label={TABLE_LABELS.selection.selectAll}
              className="h-3 w-3"
            />
          </div>
        )}
        {columns.map((column) => {
          const alignment = getColumnAlignment(column);
          const justifyClass = getJustifyClass(alignment);

          return (
            <button
              key={String(column.key)}
              className={cn(
                "flex items-center transition-colors hover:text-accent",
                justifyClass,
                alignment === "left" && "text-left",
                alignment === "center" && "text-center",
                alignment === "right" && "text-right",
                column.sortable !== false && "cursor-pointer",
                column.labelClassName
              )}
              onClick={() =>
                column.sortable !== false &&
                onSort(String(column.key), column.sortType)
              }
              disabled={column.sortable === false}
            >
              {column.label}
              {column.sortable !== false && getSortIcon(String(column.key))}
            </button>
          );
        })}
        {hasActions && <div></div>}
      </div>

      <div>
        {!hasOriginalData ? (
          emptyStateConfig ? (
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
          )
        ) : !hasFilteredData && hasActiveSearch ? (
          <div className="p-8 text-center">
            <div className="text-sm text-muted-foreground">
              {TABLE_LABELS.empty.noResults} "{searchValue}"
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {TABLE_LABELS.empty.tryDifferent}
            </div>
          </div>
        ) : groupBy ? (
          Object.entries(groupedData).map(([groupKey, groupRows]) => (
            <TableGroup
              key={groupKey}
              groupKey={groupKey}
              groupRows={groupRows}
              columns={columns}
              gridTemplateColumns={gridTemplateColumns}
              renderGroupHeader={renderGroupHeader}
              mode={mode}
              selectable={selectable}
              isItemSelected={isItemSelected}
              onSelectItem={onSelectItem}
              onRowClick={onRowClick}
              rowActions={rowActions}
              primaryRowAction={primaryRowAction}
              leadingRowAction={leadingRowAction}
              hideActions={hideActions}
              getItemId={getItemId}
              getRowClassName={getRowClassName}
            />
          ))
        ) : hasFilteredData ? (
          paginatedData.map((item, index) => {
            const isInactive = getIsInactive ? getIsInactive(item) : false;
            const prevItem = index > 0 ? paginatedData[index - 1] : null;
            const prevIsInactive =
              prevItem && getIsInactive ? getIsInactive(prevItem) : false;
            const showSeparator =
              getIsInactive &&
              showInactiveSeparator &&
              !prevIsInactive &&
              isInactive;

            return (
              <Fragment key={getItemId(item)}>
                {showSeparator && (
                  <InactiveSeparator
                    label={inactiveSeparatorLabel}
                    gridTemplateColumns={gridTemplateColumns}
                  />
                )}
                <TableRow
                  item={item}
                  index={index}
                  columns={columns}
                  gridTemplateColumns={gridTemplateColumns}
                  selectable={selectable}
                  isSelected={isItemSelected(item)}
                  onSelectChange={(checked) => onSelectItem(item, checked)}
                  onRowClick={onRowClick}
                  rowActions={rowActions?.(item)}
                  primaryRowAction={primaryRowAction?.(item)}
                  leadingRowAction={leadingRowAction?.(item)}
                  hideActions={hideActions}
                  isInactive={isInactive}
                  isLastItem={index === paginatedData.length - 1}
                  getRowClassName={getRowClassName}
                />
              </Fragment>
            );
          })
        ) : null}

        {renderFooterRow && hasFilteredData && (
          <div
            className={cn(
              "grid gap-2 px-4 py-3",
              "border-t-2 border-[var(--table-header-border)]",
              "text-sm font-semibold"
            )}
            style={{
              gridTemplateColumns,
              backgroundColor: "var(--table-footer-bg)",
              color: "var(--table-footer-fg)",
            }}
          >
            {selectable && <div></div>}
            {renderFooterRow()}
            {hasActions && <div></div>}
          </div>
        )}
      </div>

      {showPagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--card-border)]">
          <div className="text-xs text-muted-foreground">
            {TABLE_LABELS.pagination.showing}{" "}
            {(currentPage - 1) * 100 + 1} -{" "}
            {Math.min(currentPage * 100, data.length)}{" "}
            {TABLE_LABELS.pagination.of} {data.length}{" "}
            {TABLE_LABELS.pagination.items}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs ml-1">
                {TABLE_LABELS.pagination.previous}
              </span>
            </Button>
            <span className="text-xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="h-8 px-2"
            >
              <span className="text-xs mr-1">
                {TABLE_LABELS.pagination.next}
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
