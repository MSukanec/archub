import { Fragment, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TableRow } from "./TableRow";
import { Column, RowAction, PrimaryRowAction, LeadingRowAction, TableMode } from "./types";

interface TableGroupProps<T> {
  groupKey: string;
  groupRows: T[];
  columns: Column<T>[];
  gridTemplateColumns: string;
  renderGroupHeader?: (groupKey: string, groupRows: T[]) => ReactNode;
  mode?: TableMode;
  selectable: boolean;
  isItemSelected: (item: T) => boolean;
  onSelectItem: (item: T, checked: boolean) => void;
  onRowClick?: (item: T) => void;
  rowActions?: (item: T) => RowAction[];
  primaryRowAction?: (item: T) => PrimaryRowAction | null;
  leadingRowAction?: (item: T) => LeadingRowAction | null;
  hideActions?: boolean;
  getItemId: (item: T) => string | number;
  getRowClassName?: (item: T) => string;
}

export function TableGroup<T>({
  groupKey,
  groupRows,
  columns,
  gridTemplateColumns,
  renderGroupHeader,
  mode = "default",
  selectable,
  isItemSelected,
  onSelectItem,
  onRowClick,
  rowActions,
  primaryRowAction,
  leadingRowAction,
  hideActions = false,
  getItemId,
  getRowClassName,
}: TableGroupProps<T>) {
  return (
    <Fragment>
      {renderGroupHeader && (
        <div
          className={cn(
            "grid gap-2 px-4 py-3",
            mode === "budget" && "border-b border-[var(--table-row-border)]",
            mode === "construction" && "border-b border-[var(--table-row-border)]",
            mode === "default" && "border-b border-[var(--table-header-border)]",
            "text-xs font-medium [&>*]:text-xs [&>*]:font-medium [&>*]:!text-white"
          )}
          style={{
            gridTemplateColumns,
            backgroundColor: "var(--table-group-header-bg)",
            color: "white",
          }}
        >
          {renderGroupHeader(groupKey, groupRows)}
        </div>
      )}

      {groupRows.map((item, index) => (
        <TableRow
          key={getItemId(item)}
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
          isLastItem={index === groupRows.length - 1}
          getRowClassName={getRowClassName}
        />
      ))}
    </Fragment>
  );
}
