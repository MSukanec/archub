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
        {/* Desktop loading skeleton */}
        <div className="hidden md:block">
          <div className="grid gap-4 p-4 bg-muted/50 rounded-lg" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
            {columns.map((_, index) => (
              <div key={index} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-4 p-4 border rounded-lg mt-3" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
              {columns.map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile loading skeleton */}
        <div className="md:hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg mb-2">
              <div className="space-y-3">
                {columns.slice(0, 4).map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1">
                    <div className="h-3 bg-muted rounded animate-pulse w-20" />
                    <div className="h-4 bg-muted rounded animate-pulse w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
      {/* Desktop Table View */}
      <div className="hidden md:block">
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

      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.map((item, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg mb-2 bg-background hover:bg-muted/50 transition-colors"
          >
            <div className="space-y-3">
              {columns.map((column) => {
                const value = column.render 
                  ? column.render(item)
                  : String(item[column.key as keyof T] || '-')
                
                return (
                  <div key={String(column.key)} className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground mb-1">
                      {column.label}
                    </span>
                    <div className="text-sm">
                      {value}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}