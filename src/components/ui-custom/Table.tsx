import React from 'react';
import { cn } from '@/lib/utils';

interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
}

export function Table({
  columns,
  data,
  className,
  loading = false,
  emptyMessage = "No hay datos para mostrar",
  onRowClick,
}: TableProps) {
  if (loading) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <div className="bg-muted/50 px-4 py-3 font-medium">
            <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || 'auto').join(' ') }}>
              {columns.map((column) => (
                <div key={column.key} className={cn("truncate", {
                  'text-left': column.align === 'left' || !column.align,
                  'text-center': column.align === 'center',
                  'text-right': column.align === 'right',
                })}>
                  {column.header}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="mb-4 grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || 'auto').join(' ') }}>
                {columns.map((column) => (
                  <div key={column.key} className="h-4 bg-muted animate-pulse rounded"></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full">
        <div className="rounded-md border">
          <div className="bg-muted/50 px-4 py-3 font-medium">
            <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || 'auto').join(' ') }}>
              {columns.map((column) => (
                <div key={column.key} className={cn("truncate", {
                  'text-left': column.align === 'left' || !column.align,
                  'text-center': column.align === 'center',
                  'text-right': column.align === 'right',
                })}>
                  {column.header}
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-md border">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 font-medium">
          <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || 'auto').join(' ') }}>
            {columns.map((column) => (
              <div key={column.key} className={cn("truncate", {
                'text-left': column.align === 'left' || !column.align,
                'text-center': column.align === 'center',
                'text-right': column.align === 'right',
              })}>
                {column.header}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div>
          {data.map((row, index) => (
            <div
              key={row.id || index}
              className={cn(
                "px-4 py-3 border-b last:border-b-0 transition-colors",
                onRowClick && "cursor-pointer hover:bg-muted/50"
              )}
              onClick={() => onRowClick?.(row)}
            >
              <div className="grid gap-4" style={{ gridTemplateColumns: columns.map(col => col.width || 'auto').join(' ') }}>
                {columns.map((column) => (
                  <div key={column.key} className={cn("truncate", {
                    'text-left': column.align === 'left' || !column.align,
                    'text-center': column.align === 'center',
                    'text-right': column.align === 'right',
                  })}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}