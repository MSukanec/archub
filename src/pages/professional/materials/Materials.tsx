import { useEffect } from 'react'
import { DashboardLayout as Layout } from "@/layouts"
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { DollarSign } from 'lucide-react'
import MaterialPaymentsTab from './MaterialPaymentsTab'

export default function Materials() {
  const { data: userData, isLoading } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { setSidebarContext } = useNavigationStore()

  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  const headerProps = {
    icon: DollarSign,
    title: "Pagos de Materiales",
    organizationId: currentOrganizationId,
    showMembers: true
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <MaterialPaymentsTab projectId={selectedProjectId || undefined} />
    </Layout>
  )
}
