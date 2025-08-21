import { useState } from 'react'
import DataRowCard from '../DataRowCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover'

interface TaskRowProps {
  task: any
  onEdit?: (task: any) => void
  onDelete?: (taskId: string) => void
}

export function TaskRow({ task, onEdit, onDelete }: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calcular costo unitario y subtotal
  const quantity = task.quantity || 0
  // Por ahora usar 0 para el costo unitario - necesitará integrarse con TaskMaterialsSubtotal
  const unitCost = 0 
  const subtotal = quantity * unitCost

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <DataRowCard
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      className="mb-2"
    >
      {/* Fila principal */}
      <div className="grid grid-cols-12 gap-4 items-center py-3 px-4">
        {/* Nombre de la tarea - 4 columnas */}
        <div className="col-span-4">
          <div className="font-medium text-sm">
            {task.custom_name || task.task?.name || 'Sin nombre'}
          </div>
          {task.phase_name && (
            <div className="text-xs text-muted-foreground">
              {task.phase_name}
            </div>
          )}
        </div>

        {/* Rubro - 2 columnas */}
        <div className="col-span-2">
          <Badge variant="outline" className="text-xs">
            {task.category_name || 'Sin rubro'}
          </Badge>
        </div>

        {/* Unidad - 1 columna */}
        <div className="col-span-1 text-center">
          <span className="text-xs font-medium">
            {task.task?.unit_symbol || 'UD'}
          </span>
        </div>

        {/* Cantidad - 1 columna */}
        <div className="col-span-1 text-center">
          <span className="text-sm font-medium">
            {quantity.toFixed(2)}
          </span>
        </div>

        {/* C.U. - 2 columnas */}
        <div className="col-span-2 text-center">
          <span className="text-sm font-medium">
            {formatCurrency(unitCost)}
          </span>
        </div>

        {/* Acciones - 2 columnas */}
        <div className="col-span-2 flex gap-1 justify-end">
          <TaskMaterialDetailPopover task={task} showCost={false} />
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(task)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sección expandida - Solo C.U. y SUBT. */}
      {isExpanded && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="grid grid-cols-4 gap-4">
            {/* C.U. */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                C.U.
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(unitCost)}
              </div>
            </div>

            {/* Espacios vacíos */}
            <div></div>
            <div></div>

            {/* SUBT. */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground font-medium mb-1">
                SUBT.
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(subtotal)}
              </div>
            </div>
          </div>
        </div>
      )}
    </DataRowCard>
  )
}