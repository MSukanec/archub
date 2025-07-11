import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TableRowActions } from '@/components/ui-custom/misc/TableRowActions'

interface TableRowAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "primary" | "muted"
}

type SortDirection = 'asc' | 'desc' | null

interface BudgetTableProps<T = any> {
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
  // Nueva prop para renderizado de cards en mobile
  renderCard?: (item: T) => React.ReactNode
  // Nueva prop para acciones flotantes
  getRowActions?: (item: T) => TableRowAction[]
}

export function BudgetTable<T = any>({ 
  columns,
  data,
  emptyState,
  isLoading = false,
  className,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId = (item) => (item as any).id,
  getRowClassName,
  onCardClick,
  defaultSort,
  renderCard,
  getRowActions
}: BudgetTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSort?.key || null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSort?.direction || null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const itemsPerPage = 50

  // Función para obtener el valor de ordenamiento
  const getSortValue = (item: T, key: string, sortType?: string) => {
    const value = (item as any)[key]
    
    if (value === null || value === undefined) return ''
    
    switch (sortType) {
      case 'number':
        return Number(value) || 0
      case 'date':
        return new Date(value).getTime()
      default:
        return String(value).toLowerCase()
    }
  }

  // Datos ordenados
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    const column = columns.find(col => col.key === sortKey)
    const sortType = column?.sortType || 'string'

    return [...data].sort((a, b) => {
      const aValue = getSortValue(a, sortKey, sortType)
      const bValue = getSortValue(b, sortKey, sortType)
      
      if (aValue === bValue) return 0
      
      const result = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? result : -result
    })
  }, [data, sortKey, sortDirection, columns])

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (key: string, sortType?: string) => {
    if (sortKey === key) {
      setSortDirection(prev => {
        if (prev === 'asc') return 'desc'
        if (prev === 'desc') return null
        return 'asc'
      })
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return
    
    if (selectedItems.length === sortedData.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(sortedData)
    }
  }

  const handleSelectItem = (item: T) => {
    if (!onSelectionChange) return
    
    const itemId = getItemId(item)
    const isSelected = selectedItems.some(selected => getItemId(selected) === itemId)
    
    if (isSelected) {
      onSelectionChange(selectedItems.filter(selected => getItemId(selected) !== itemId))
    } else {
      onSelectionChange([...selectedItems, item])
    }
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
          <div className="p-8 text-center text-muted-foreground">
            Cargando...
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="w-full">
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm">
          {emptyState || (
            <div className="p-8 text-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Vista Desktop */}
      <div className="hidden md:block">
        <div className="border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  {selectable && (
                    <th className="w-8 p-2 text-left">
                      <Checkbox
                        checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                  )}
                  {columns.map((column) => (
                    <th 
                      key={String(column.key)} 
                      className="p-2 text-left text-xs font-medium"
                      style={column.width ? { width: column.width } : undefined}
                    >
                      {column.sortable !== false ? (
                        <button
                          onClick={() => handleSort(String(column.key), column.sortType)}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {column.label}
                          {sortKey === column.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  {getRowActions && (
                    <th className="w-12 p-2 text-left text-xs font-medium">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => {
                  const itemId = getItemId(item)
                  const isSelected = selectedItems.some(selected => getItemId(selected) === itemId)
                  const rowActions = getRowActions?.(item)
                  
                  return (
                    <tr 
                      key={`${itemId}-${index}`}
                      className={cn(
                        "border-b hover:bg-muted/20 transition-colors relative",
                        getRowClassName?.(item),
                        isSelected && "bg-muted/30"
                      )}
                      onMouseEnter={() => setHoveredRow(String(itemId))}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {selectable && (
                        <td className="p-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleSelectItem(item)}
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td 
                          key={String(column.key)} 
                          className="p-2 text-sm"
                          style={column.width ? { width: column.width } : undefined}
                        >
                          {column.render ? column.render(item) : String((item as any)[column.key] || '')}
                        </td>
                      ))}
                      {rowActions && (
                        <td className="p-2 relative">
                          {hoveredRow === String(itemId) && (
                            <TableRowActions
                              actions={rowActions}
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedData.length)} de {sortedData.length} registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vista Mobile */}
      <div className="md:hidden space-y-3">
        {renderCard ? (
          paginatedData.map((item, index) => (
            <div 
              key={`${getItemId(item)}-${index}`}
              onClick={() => onCardClick?.(item)}
              className={onCardClick ? "cursor-pointer" : undefined}
            >
              {renderCard(item)}
            </div>
          ))
        ) : (
          paginatedData.map((item, index) => (
            <div 
              key={`${getItemId(item)}-${index}`}
              className="rounded-lg border bg-card p-4"
              onClick={() => onCardClick?.(item)}
            >
              {columns.slice(0, 3).map((column) => (
                <div key={String(column.key)} className="flex justify-between items-center mb-2 last:mb-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.label}
                  </span>
                  <span className="text-sm">
                    {column.render ? column.render(item) : String((item as any)[column.key] || '')}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
        
        {/* Paginación Mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}