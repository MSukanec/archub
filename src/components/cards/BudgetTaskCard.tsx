import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import SwipeableCard from '@/components/layout/mobile/SwipeableCard'

interface BudgetTask {
  id: string
  project_id: string
  task_id: string
  name_rendered: string
  category_name: string
  quantity: number
  start_date: string | null
  end_date: string | null
  duration_in_days: number | null
  progress_percent: number
  phase_name: string | null
  created_at: string
  updated_at: string
  budget_id: string
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
          {/* Top Row: Code and Quantity */}
              {task.task_id?.substring(0, 8) || 'Sin código'}
            </Badge>
              {unitName && (
                <>
                </>
              )}
            </div>
          </div>

          {/* Middle Row: Task Name */}
          <div>
            <h3 
              title={processedName}
            >
              {displayName}
            </h3>
          </div>

          {/* Bottom Row: Rubro and Cost */}
            </div>
            </div>
          </div>
        </div>
      </Card>
    </SwipeableCard>
  )
}