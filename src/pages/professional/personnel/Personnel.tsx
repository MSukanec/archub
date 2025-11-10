import { Layout } from '@/components/layout/desktop/Layout'
import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigationStore } from '@/stores/navigationStore'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Users, Plus } from 'lucide-react'
import { InsuranceTab } from '@/components/personnel/insurance/InsuranceTab'
import { useInsuranceList } from '@/hooks/useInsurances'
import PersonnelListTab from './PersonnelListTab'
import PersonnelAttendanceTab from './PersonnelAttendanceTab'
import PersonnelDashboard from './PersonnelDashboard'
import PersonnelPaymentsTab from './PersonnelPaymentsTab'

export default function Personnel() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleDeletePersonnel = async (personnelId: string) => {
    try {
      const { error } = await supabase
        .from('project_personnel')
        .delete()
        .eq('id', personnelId)

      if (error) {
        return
      }

      queryClient.invalidateQueries({ queryKey: ['project-personnel', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['attendance-data'] })
    } catch (error) {
    }
  }

  const { data: personnelData = [] } = useQuery({
    queryKey: ['project-personnel', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return []
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          created_at,
          contact:contacts(
            id,
            first_name,
            last_name
          )
        `)
        .eq('project_id', selectedProjectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!selectedProjectId
  })

  const { data: insuranceData = [] } = useInsuranceList({
    project_id: selectedProjectId || undefined
  })

  const hasPersonnel = personnelData.length > 0

  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  useEffect(() => {
    if (!hasPersonnel && (activeTab === 'attendance' || activeTab === 'insurance' || activeTab === 'payments')) {
      setActiveTab('dashboard')
    }
  }, [hasPersonnel, activeTab])

  const headerProps = {
    icon: Users,
    title: "Mano de Obra",
    description: "Gestiona el personal asignado a tus proyectos, registra asistencias y administra seguros de trabajo.",
    organizationId: currentOrganizationId,
    showMembers: true,
    tabs: [
      {
        id: 'dashboard',
        label: 'Visión General',
        isActive: activeTab === 'dashboard'
      },
      {
        id: 'active',
        label: 'Listado de Personal',
        isActive: activeTab === 'active'
      },
      {
        id: 'payments',
        label: 'Pagos',
        isActive: activeTab === 'payments',
        disabled: !hasPersonnel
      },
      {
        id: 'attendance',
        label: 'Asistencia',
        isActive: activeTab === 'attendance',
        disabled: !hasPersonnel
      },
      {
        id: 'insurance',
        label: 'Seguros',
        isActive: activeTab === 'insurance',
        disabled: !hasPersonnel
      }
    ],
    onTabChange: (tabId: string) => {
      if (tabId === 'attendance' || tabId === 'insurance' || tabId === 'payments') {
        if (!hasPersonnel) {
          return
        }
      }
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
        {activeTab === 'dashboard' && (
          <PersonnelDashboard
            selectedProjectId={selectedProjectId}
            currentOrganizationId={currentOrganizationId}
            personnelData={personnelData}
            insuranceData={insuranceData}
            onTabChange={setActiveTab}
          />
        )}

        {activeTab === 'active' && (
          <PersonnelListTab
            openModal={openModal}
            handleDeletePersonnel={handleDeletePersonnel}
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
