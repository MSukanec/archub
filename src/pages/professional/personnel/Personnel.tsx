import { DashboardLayout as Layout } from "@/layouts"
import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
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
  const { data: userData } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const queryClient = useQueryClient()
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState('active')

  const handleDeletePersonnel = async (personnelId: string) => {
    try {
      const { error } = await supabase
        .from('project_personnel')
        .update({ 
          is_deleted: true, 
          deleted_at: new Date().toISOString() 
        })
        .eq('id', personnelId)

      if (error) {
        console.error('Error deleting personnel:', error)
        return
      }

      queryClient.invalidateQueries({ queryKey: ['project-personnel', selectedProjectId] })
      queryClient.invalidateQueries({ queryKey: ['attendance-data'] })
    } catch (error) {
      console.error('Error deleting personnel:', error)
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
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!selectedProjectId
  })

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
