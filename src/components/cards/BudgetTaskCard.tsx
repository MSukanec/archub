import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import SwipeableCard from '@/components/layout/mobile/SwipeableCard'

interface BudgetTask {
  id: string
  budget_id: string
  task_id: string
  quantity: number
  start_date: string | null
  end_date: string | null
  organization_id: string
  task: {
    id: string
    code: string
    name: string
    template_id: string | null
    param_values: any
    is_public: boolean
    organization_id: string
    unit_id: string | null
  }
}

interface BudgetTaskCardProps {
  task: BudgetTask
  processedName: string
  unitName?: string
  onEdit?: (task: BudgetTask) => void
  onDelete?: (taskId: string) => void
}

export function BudgetTaskCard({ task, processedName, unitName, onEdit, onDelete }: BudgetTaskCardProps) {
  const handleEdit = () => {
    onEdit?.(task)
  }

  const handleDelete = () => {
    onDelete?.(task.id)
  }

  // Truncate name if too long for mobile
  const displayName = processedName?.length > 60 
    ? `${processedName.substring(0, 60)}...` 
    : (processedName || 'Sin nombre')

  return (
    <SwipeableCard
      onEdit={handleEdit}
      onDelete={handleDelete}
      editLabel="Editar"
      deleteLabel="Eliminar"
    >
      <Card className="border rounded-lg hover:shadow-sm transition-shadow">
        <div className="p-3 space-y-3">
          {/* Top Row: Code and Quantity */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs font-mono">
              {task.task.code}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Cant:</span>
              <span className="text-sm font-medium">{task.quantity}</span>
              {unitName && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm font-medium">{unitName}</span>
                </>
              )}
            </div>
          </div>

          {/* Middle Row: Task Name */}
          <div>
            <h3 
              className="text-sm font-medium leading-5 text-foreground"
              title={processedName}
            >
              {displayName}
            </h3>
          </div>

          {/* Bottom Row: Rubro and Cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rubro:</span>
              <span className="text-xs font-medium">{task.task.rubro_name || 'Sin rubro'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">$0</span>
              <span className="text-xs text-muted-foreground">0.0%</span>
            </div>
          </div>
        </div>
      </Card>
    </SwipeableCard>
  )
}