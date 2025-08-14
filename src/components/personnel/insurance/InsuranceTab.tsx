import React, { useState } from 'react'
import { Shield, Plus } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useInsuranceList } from '@/hooks/useInsurances'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { InsuranceKpis } from './InsuranceKpis'
import { InsuranceGrid } from './InsuranceGrid'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Button } from '@/components/ui/button'

export function InsuranceTab() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const projectId = userData?.preferences?.last_project_id
  
  const filters = {
    project_id: projectId,
    ...(statusFilter && { status: [statusFilter as 'vigente' | 'por_vencer' | 'vencido'] })
  }

  const { data: insurances = [], isLoading } = useInsuranceList(filters)

  const filteredInsurances = statusFilter 
    ? insurances.filter(insurance => insurance.status === statusFilter)
    : insurances

  const handleNewInsurance = () => {
    openModal('insurance', {
      mode: 'create',
      projectId
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Cargando seguros...</div>
      </div>
    )
  }

  if (insurances.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="h-12 w-12" />}
        title="Sin seguros registrados"
        description="No hay seguros registrados para este proyecto. Los seguros te ayudarán a gestionar la documentación y vencimientos de cobertura del personal."
        action={
          <Button onClick={handleNewInsurance}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Seguro
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <InsuranceKpis
        data={insurances}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Grid */}
      <InsuranceGrid
        data={filteredInsurances}
        isLoading={false}
      />
    </div>
  )
}