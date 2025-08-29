import { useState } from 'react'
import { BarChart3, TrendingDown } from 'lucide-react'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useMovements } from '@/hooks/use-movements'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function MovementsAnalysis() {
  const [searchValue, setSearchValue] = useState("")
  
  const { data: userData } = useCurrentUser()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  // Get movements data for the current project
  const { data: movements = [], isLoading } = useMovements(
    organizationId || '',
    projectId || ''
  )

  // Filter only expense movements
  const expenseMovements = movements.filter(movement => 
    movement.type_id === 'bdb66fac-ade1-46de-a13d-918edf1b94c7' // EGRESOS
  )

  return (
    <div className="space-y-4">
      {expenseMovements.length === 0 ? (
        <EmptyState
          icon={<TrendingDown className="h-8 w-8" />}
          title="No hay egresos registrados"
          description="Comienza registrando movimientos de egreso en la sección de Movimientos para ver el análisis de gastos por categoría."
        />
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Análisis de Movimientos</h3>
          <p className="text-sm text-muted-foreground">
            Se encontraron {expenseMovements.length} movimientos de egreso para analizar.
          </p>
          
          {/* Placeholder for future charts and analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseMovements.slice(0, 6).map((movement) => (
              <div key={movement.id} className="p-3 border rounded-lg">
                <div className="text-sm font-medium">{movement.description}</div>
                <div className="text-xs text-muted-foreground">
                  ${movement.amount?.toLocaleString()} - {movement.movement_data?.category?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}