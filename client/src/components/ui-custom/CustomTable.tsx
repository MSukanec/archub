import React from 'react'
import { cn } from '@/lib/utils'

interface CustomTableProps<T = any> {
  columns: {
    key: keyof T | string
    label: string
    render?: (item: T) => React.ReactNode
  }[]
  data: T[]
  emptyState?: React.ReactNode
  isLoading?: boolean
  className?: string
}

export function CustomTable<T = any>({ 
  columns, 
  data, 
  emptyState, 
  isLoading = false, 
  className 
}: CustomTableProps<T>) {
  
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Header skeleton */}
        <div className="grid gap-4 p-4 bg-muted/50 rounded-lg" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((_, index) => (
            <div key={index} className="h-4 bg-muted rounded animate-pulse" />
          ))}
        </div>
        
        {/* Row skeletons */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid gap-4 p-4 border rounded-lg" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
            {columns.map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return emptyState || (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay datos para mostrar</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Column Headers */}
      <div className="grid gap-4 p-4 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map((column) => (
          <div key={String(column.key)}>
            {column.label}
          </div>
        ))}
      </div>

      {/* Data Rows */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={index}
            className="grid gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
          >
            {columns.map((column) => (
              <div key={String(column.key)} className="text-xs">
                {column.render 
                  ? column.render(item)
                  : String(item[column.key as keyof T] || '-')
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}