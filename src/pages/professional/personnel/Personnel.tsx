import { DashboardLayout as Layout } from "@/layouts"
import { useEffect, useState } from 'react'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal'
import { Users, Plus } from 'lucide-react'
import { InsuranceTab } from '@/features/personnel'
import { useInsuranceList } from '@/features/personnel'
import PersonnelListTab from './PersonnelListTab'
import PersonnelAttendanceTab from './PersonnelAttendanceTab'
import PersonnelPaymentsTab from './PersonnelPaymentsTab'

export default function Personnel() {
  const { openModal } = useGlobalModalStore()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState('active')

  const { data: insuranceData = [] } = useInsuranceList({
    project_id: selectedProjectId || undefined
  })

  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  const headerProps = {
    icon: Users,
    title: "Mano de Obra",
    description: "Gestiona el personal asignado a tus proyectos, registra asistencias y administra seguros de trabajo.",
    organizationId: currentOrganizationId || undefined,
    showMembers: true,
    tabs: [
      {
        id: 'active',
        label: 'Listado de Personal',
        isActive: activeTab === 'active'
      },
      {
        id: 'payments',
        label: 'Pagos',
        isActive: activeTab === 'payments'
      },
      {
        id: 'attendance',
        label: 'Asistencia',
        isActive: activeTab === 'attendance'
      },
      {
        id: 'insurance',
        label: 'Seguros',
        isActive: activeTab === 'insurance'
      }
    ],
    onTabChange: (tabId: string) => {
      setActiveTab(tabId)
    },
    actionButton: activeTab === 'attendance' ? {
      label: 'Registrar Asistencia',
      icon: Plus,
      onClick: () => openModal('attendance', {})
    } : activeTab === 'active' ? {
      label: 'Agregar Personal',
      icon: Plus,
      onClick: () => openModal('personnel')
    } : activeTab === 'insurance' ? {
      label: 'Nuevo Seguro',
      icon: Plus,
      onClick: () => openModal('insurance', { 
        mode: 'create', 
        projectId: selectedProjectId 
      })
    } : undefined
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6 max-w-full overflow-x-hidden">
        {activeTab === 'active' && (
          <PersonnelListTab
            openModal={openModal}
            insuranceData={insuranceData}
            selectedProjectId={selectedProjectId}
          />
        )}

        {activeTab === 'payments' && (
          <PersonnelPaymentsTab
            openModal={openModal}
            selectedProjectId={selectedProjectId}
            currentOrganizationId={currentOrganizationId}
          />
        )}

        {activeTab === 'attendance' && (
          <PersonnelAttendanceTab
            openModal={openModal}
            selectedProjectId={selectedProjectId}
            currentOrganizationId={currentOrganizationId}
          />
        )}

        {activeTab === 'insurance' && <InsuranceTab />}
      </div>
    </Layout>
  )
}
