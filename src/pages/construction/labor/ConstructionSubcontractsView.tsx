import { useState } from 'react'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Package } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useSubcontracts } from '@/hooks/use-subcontracts'
import { SubcontractExpandableCard } from '../../../components/ui-custom/SubcontractExpandableCard'

export function ConstructionSubcontractsView() {
  const { data: userData } = useCurrentUser()
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!subcontracts || subcontracts.length === 0) {
    return (
      <EmptyState
        icon={<Package className="w-12 h-12 text-muted-foreground" />}
        title="No hay subcontratos"
        description="Aún no has creado ningún subcontrato. Haz clic en 'Nuevo Subcontrato' para comenzar."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {subcontracts.length} subcontrato{subcontracts.length !== 1 ? 's' : ''}
      </div>
      
      <div className="grid gap-4">
        {subcontracts.map((subcontract) => (
          <SubcontractExpandableCard 
            key={subcontract.id} 
            subcontract={subcontract}
            isExpanded={expandedCardId === subcontract.id}
            onToggle={() => {
              setExpandedCardId(expandedCardId === subcontract.id ? null : subcontract.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}