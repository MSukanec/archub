import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type SortDirection = 'asc' | 'desc' | null

interface CustomTableProps<T = any> {
  columns: {
    key: keyof T | string
    label: string
    render?: (item: T) => React.ReactNode
    sortable?: boolean // Por defecto true, usar false para deshabilitarlo
    sortType?: 'string' | 'number' | 'date'
    width?: string // Nuevo: ancho personalizado (ej: "10%", "100px", etc.)
  }[]
  data: T[]
  emptyState?: React.ReactNode
  isLoading?: boolean
  className?: string
  // Nuevas props para selección múltiple
  selectable?: boolean
  selectedItems?: T[]
  onSelectionChange?: (selectedItems: T[]) => void
  getItemId?: (item: T) => string | number
  // Nueva prop para personalizar el estilo de las filas
  getRowClassName?: (item: T) => string
  // Nueva prop para click-to-edit en cards
  onCardClick?: (item: T) => void
  // Nueva prop para ordenamiento inicial
  defaultSort?: {
    key: string
    direction: 'asc' | 'desc'
  }
}

export function CustomTable<T = any>({ 
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
  defaultSort
}: CustomTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key || null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction || null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const itemsPerPage = 10
  const showPagination = data.length > itemsPerPage

  // Selection logic
  const isAllSelected = selectable && data.length > 0 && selectedItems.length === data.length
  const isIndeterminate = selectable && selectedItems.length > 0 && selectedItems.length < data.length
  
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(data)
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!onSelectionChange) return
    const itemId = getItemId(item)
    if (checked) {
      onSelectionChange([...selectedItems, item])
    } else {
      onSelectionChange(selectedItems.filter(selected => getItemId(selected) !== itemId))
    }
  }

  const isItemSelected = (item: T) => {
    const itemId = getItemId(item)
    return selectedItems.some(selected => getItemId(selected) === itemId)
  }

  const handleItemSelection = (item: T, checked: boolean) => {
    handleSelectItem(item, checked)
  }

  // Calculate grid template columns based on widths and selection
  const getGridTemplateColumns = () => {
    const selectableColumn = selectable ? ['32px'] : []
    const columnsWithWidths = columns.map(col => col.width || '1fr')
    return [...selectableColumn, ...columnsWithWidths].join(' ')
  }

  const handleSort = (columnKey: string, sortType: 'string' | 'number' | 'date' = 'string') => {
    if (sortKey === columnKey) {
      // Toggle direction or reset
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortKey(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortKey(columnKey)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    const column = columns.find(col => col.key === sortKey)
    if (!column) return data

    return [...data].sort((a, b) => {
      let aValue = a[sortKey as keyof T]
      let bValue = b[sortKey as keyof T]

      // Handle nested values for rendered columns
      if (sortKey === 'type') {
        aValue = (a as any)?.movement_data?.type?.name || ''
        bValue = (b as any)?.movement_data?.type?.name || ''
      } else if (sortKey === 'category') {
        aValue = (a as any)?.movement_data?.category?.name || ''
        bValue = (b as any)?.movement_data?.category?.name || ''
      } else if (sortKey === 'subcategory') {
        aValue = (a as any)?.movement_data?.subcategory?.name || ''
        bValue = (b as any)?.movement_data?.subcategory?.name || ''
      } else if (sortKey === 'creator') {
        aValue = (a as any)?.creator?.full_name || (a as any)?.creator?.email || ''
        bValue = (b as any)?.creator?.full_name || (b as any)?.creator?.email || ''
      } else if (sortKey === 'currency') {
        aValue = (a as any)?.movement_data?.currency?.name || (a as any)?.movement_data?.currency?.code || ''
        bValue = (b as any)?.movement_data?.currency?.name || (b as any)?.movement_data?.currency?.code || ''
      } else if (sortKey === 'wallet') {
        aValue = (a as any)?.movement_data?.wallet?.name || ''
        bValue = (b as any)?.movement_data?.wallet?.name || ''
      }

      // Convert values based on sort type
      switch (column.sortType || 'string') {
        case 'number':
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
          break
        case 'date':
          aValue = new Date(aValue as string).getTime()
          bValue = new Date(bValue as string).getTime()
          break
        default:
          aValue = String(aValue).toLowerCase()
          bValue = String(bValue).toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortKey, sortDirection, columns])

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = showPagination ? sortedData.slice(startIndex, endIndex) : sortedData

  // Reset page when data changes
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [sortedData.length, currentPage, totalPages])
  
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Desktop loading skeleton */}
        <div className="hidden lg:block">
          <div className="grid gap-4 p-4 bg-muted/50 rounded-lg" style={{ gridTemplateColumns: getGridTemplateColumns() }}>
            {columns.map((_, index) => (
              <div key={index} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid gap-4 p-4 border rounded-lg mt-3" style={{ gridTemplateColumns: getGridTemplateColumns() }}>
              {columns.map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-muted rounded animate-pulse" />
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
      <div className="hidden lg:block overflow-hidden rounded-t-lg border border-[var(--table-header-border)]">
        {/* Column Headers */}
        <div className="grid gap-4 px-4 py-3 bg-[var(--table-header-bg)] text-xs font-medium text-[var(--table-header-fg)] border-b border-[var(--table-header-border)]" style={{ gridTemplateColumns: getGridTemplateColumns() }}>
          {selectable && (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isAllSelected}
                {...(isIndeterminate ? { 'data-indeterminate': true } : {})}
                onCheckedChange={handleSelectAll}
                aria-label="Seleccionar todos"
                className="h-3 w-3"
              />
            </div>
          )}
          {columns.map((column) => (
            <div key={String(column.key)} className="flex items-center gap-1">
              <span>{column.label}</span>
              {column.sortable !== false && (
                <button
                  onClick={() => handleSort(String(column.key), column.sortType)}
                  className="flex items-center justify-center w-4 h-4 rounded hover:bg-black/10 transition-colors"
                  type="button"
                >
                  {sortKey === column.key ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Data Rows */}
        <div>
          {paginatedData.map((item, index) => (
            <div
              key={index}
              className={cn(
                "grid gap-4 px-4 py-3 bg-[var(--table-row-bg)] text-[var(--table-row-fg)] border-b border-[var(--table-row-border)] hover:bg-[var(--table-row-hover-bg)] transition-colors",
                selectable && isItemSelected(item) && "bg-[var(--accent-bg)] border-[var(--accent)]",
                index === paginatedData.length - 1 && "border-b-0",
                getRowClassName?.(item)
              )}
              style={{ gridTemplateColumns: getGridTemplateColumns() }}
            >
              {selectable && (
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isItemSelected(item)}
                    onCheckedChange={(checked) => handleSelectItem(item, checked as boolean)}
                    aria-label={`Seleccionar fila ${index + 1}`}
                    className="h-3 w-3"
                  />
                </div>
              )}
              {columns.map((column) => (
                <div key={String(column.key)} className="text-xs flex items-center justify-start">
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
      <div className="lg:hidden">
        {paginatedData.map((item, index) => (
          <div
            key={index}
            className={cn(
              "p-3 border rounded-lg mb-2 bg-background hover:bg-muted/40 transition-colors cursor-pointer",
              getRowClassName?.(item)
            )}
            onClick={() => onCardClick?.(item)}
          >
            {selectable && (
              <div className="flex items-center justify-between mb-2 pb-2 border-b">
                <span className="text-xs font-medium text-muted-foreground">Seleccionar</span>
                <Checkbox
                  checked={isItemSelected(item)}
                  onCheckedChange={(checked) => {
                    handleItemSelection(item, checked === true)
                  }}
                  aria-label="Seleccionar elemento"
                  className="h-4 w-4"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns.filter((_, idx) => idx < 6).map((column) => {
                const value = column.render 
                  ? column.render(item)
                  : String(item[column.key as keyof T] || '-')
                
                return (
                  <div key={String(column.key)} className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-muted-foreground truncate">
                      {column.label}
                    </span>
                    <div className="text-sm font-medium truncate">
                      {value}
                    </div>
                  </div>
                )
              })}
            </div>
            {columns.length > 6 && (
              <div className="mt-2 pt-2 border-t">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {columns.slice(6).map((column) => {
                    const value = column.render 
                      ? column.render(item)
                      : String(item[column.key as keyof T] || '-')
                    
                    return (
                      <div key={String(column.key)} className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {column.label}
                        </span>
                        <div className="text-sm font-medium truncate">
                          {value}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {showPagination && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and pages around current
              const isFirstOrLast = page === 1 || page === totalPages
              const isAroundCurrent = Math.abs(page - currentPage) <= 1
              const shouldShow = isFirstOrLast || isAroundCurrent

              if (!shouldShow) {
                // Show ellipsis if needed
                if (page === 2 && currentPage > 4) {
                  return <span key={page} className="px-2 text-sm text-muted-foreground">...</span>
                }
                if (page === totalPages - 1 && currentPage < totalPages - 3) {
                  return <span key={page} className="px-2 text-sm text-muted-foreground">...</span>
                }
                return null
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}