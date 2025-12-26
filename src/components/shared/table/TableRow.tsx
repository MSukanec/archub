import { Fragment, ReactNode, ComponentType, useState } from "react";
import { ArrowRight, MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Column, RowAction, PrimaryRowAction, LeadingRowAction } from "./types";
import { getColumnAlignment, getJustifyClass } from "./utils";

function RowActionsPopover({ rowActions }: { rowActions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  
  const defaultActions = rowActions.filter((a) => a.variant !== "destructive");
  const destructiveActions = rowActions.filter((a) => a.variant === "destructive");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="bottom" 
        align="end"
        className="w-48 p-2 z-[70]"
        sideOffset={4}
      >
        <div className="flex flex-col gap-1">
          {defaultActions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
          {destructiveActions.length > 0 && (
            <div className="h-px bg-border my-1" />
          )}
          {destructiveActions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                setOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent/10 transition-colors text-left text-foreground hover:text-red-600 dark:hover:text-red-500"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TableRowProps<T> {
  item: T;
  index: number;
  columns: Column<T>[];
  gridTemplateColumns: string;
  selectable: boolean;
  isSelected: boolean;
  onSelectChange: (checked: boolean) => void;
  onRowClick?: (item: T) => void;
  rowActions?: RowAction[];
  primaryRowAction?: PrimaryRowAction | null;
  leadingRowAction?: LeadingRowAction | null;
  hideActions?: boolean;
  isInactive?: boolean;
  isLastItem: boolean;
  getRowClassName?: (item: T) => string;
}

export function TableRow<T>({
  item,
  index,
  columns,
  gridTemplateColumns,
  selectable,
  isSelected,
  onSelectChange,
  onRowClick,
  rowActions,
  primaryRowAction,
  leadingRowAction,
  hideActions = false,
  isInactive = false,
  isLastItem,
  getRowClassName,
}: TableRowProps<T>) {
  const hasActions = !!(rowActions || primaryRowAction || leadingRowAction);

  return (
    <div
      className={cn(
        "group relative grid gap-2 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] text-sm hover:bg-[var(--table-row-hover-bg)] transition-colors",
        !isLastItem ? "border-b border-[var(--table-row-border)]" : "",
        isInactive && "opacity-50",
        onRowClick && "cursor-pointer",
        getRowClassName?.(item)
      )}
      style={{ gridTemplateColumns }}
      onClick={() => onRowClick?.(item)}
    >
      {selectable && (
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange(checked as boolean)}
            aria-label={`Seleccionar fila ${index + 1}`}
            className="h-3 w-3"
          />
        </div>
      )}

      {columns.map((column) => {
        const alignment = getColumnAlignment(column);
        const justifyClass = getJustifyClass(alignment);

        return (
          <div
            key={String(column.key)}
            className={cn(
              "text-sm flex items-center",
              justifyClass,
              column.cellClassName
            )}
          >
            {column.render
              ? column.render(item)
              : String(item[column.key as keyof T] || "-")}
          </div>
        );
      })}

      {hasActions && (
        <div className="flex items-center justify-end gap-2">
          {leadingRowAction && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                leadingRowAction.onClick();
              }}
              title={leadingRowAction.label}
            >
              <leadingRowAction.icon className="h-4 w-4" />
            </Button>
          )}

          {primaryRowAction && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                primaryRowAction.onClick();
              }}
              title={primaryRowAction.label}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {rowActions && !hideActions && (
            <RowActionsPopover rowActions={rowActions} />
          )}
        </div>
      )}
    </div>
  );
}

interface InactiveSeparatorProps {
  label: string;
  gridTemplateColumns: string;
}

export function InactiveSeparator({
  label,
  gridTemplateColumns,
}: InactiveSeparatorProps) {
  return (
    <div
      className="grid gap-2 px-4 py-2 bg-[var(--table-header-bg)] border-t border-b border-[var(--table-row-border)]"
      style={{ gridTemplateColumns }}
    >
      <div className="col-span-full text-xs font-medium text-muted-foreground flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span>{label}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
