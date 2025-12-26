import { cn } from "@/lib/utils";
import { Column } from "./types";
import { getGridTemplateColumns } from "./utils";
interface TableLoadingSkeletonProps<T> {
  columns: Column<T>[];
  selectable: boolean;
  hasActions: boolean;
  className?: string;
}
export function TableLoadingSkeleton<T>({
  columns,
  selectable,
  hasActions,
  className,
}: TableLoadingSkeletonProps<T>) {
  const gridTemplateColumns = getGridTemplateColumns(columns, selectable, hasActions);
  return (
    <div className={cn("space-y-3", className)}>
      <div className="hidden lg:block">
        <div
          className="grid gap-2 p-4 bg-muted/50 rounded-lg"
          style={{ gridTemplateColumns }}
        >
          {columns.map((_, index) => (
            <div key={index} className="h-4 bg-muted rounded animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="grid gap-2 p-4 border rounded-lg"
            style={{ gridTemplateColumns }}
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
