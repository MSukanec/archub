import { Layout } from '@/components/layout/desktop/Layout'
import { useMemo, useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigationStore } from '@/stores/navigationStore'
import CustomGradebook from '@/components/ui-custom/CustomGradebook'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Users, Plus, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { PersonnelTable } from '@/components/ui-custom/PersonnelTable'

// Hook to fetch attendance data from new attendees table
function useAttendanceData(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['construction-attendance', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []



      // Query the new attendees table structure
      const { data: attendanceData, error } = await supabase
        .from('attendees')
        .select(`
          *,
          contact:contacts(
            id,
            first_name,
            last_name,
            organization_id,
            contact_type_links(
              contact_type:contact_types(
                id,
                name
              )
            )
          )
        `)
        .eq('project_id', projectId)

      if (error) {

        return []
      }

      // Filter to ensure contacts belong to the same organization
      const filteredData = (attendanceData || []).filter(item => 
        item.contact?.organization_id === organizationId
      )


      
      return filteredData
    },
    enabled: !!supabase && !!projectId && !!organizationId
  })
}



// Transform attendance data for gradebook display
function transformAttendanceData(attendanceData: any[]) {
  if (!attendanceData || attendanceData.length === 0) return { workers: [], attendance: [] }

  // Get unique workers (no filtering here, filtering will be done later)
  const workersMap = new Map()
  attendanceData.forEach(attendance => {
    if (attendance.contact) {
      const workerId = attendance.contact.id
      const workerName = `${attendance.contact.first_name || ''} ${attendance.contact.last_name || ''}`.trim()
      const contactTypeName = attendance.contact.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo'
      const contactTypeId = attendance.contact.contact_type_links?.[0]?.contact_type?.id
      
      workersMap.set(workerId, {
        id: workerId,
        name: workerName || 'Sin nombre',
        contactType: contactTypeName,
        contactTypeId: contactTypeId
      })
    }
  })

  const workers = Array.from(workersMap.values())

  // Create attendance records array for CustomGradebook
  const attendance: any[] = []

  attendanceData.forEach(attendanceRecord => {
    if (attendanceRecord.contact) {
      const workerId = attendanceRecord.contact.id
      const logDate = new Date(attendanceRecord.created_at)
      const day = format(logDate, 'yyyy-MM-dd') // Use full date format for matching
      
      // Map attendance_type to gradebook format
      let status: 'full' | 'half' = 'full'
      if (attendanceRecord.attendance_type === 'half') {
        status = 'half'
      }

      attendance.push({
        workerId,
        day,
        status
      })
    }
  })

  return { workers, attendance }
}

export default function ConstructionPersonnel() {
  const { openModal } = useGlobalModalStore()
  const { data: userData } = useCurrentUser()
  const { data: attendanceData = [], isLoading } = useAttendanceData(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  )

  // Fetch project personnel
  const { data: personnelData = [], isLoading: isPersonnelLoading } = useQuery({
    queryKey: ['project-personnel', userData?.preferences?.last_project_id],
    queryFn: async () => {
      if (!userData?.preferences?.last_project_id) return []
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          created_at,
          contact:contacts!inner(
            id,
            first_name,
            last_name,
            contact_type_links!inner(
              contact_type:contact_types!inner(name)
            )
          )
        `)
        .eq('project_id', userData.preferences.last_project_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userData?.preferences?.last_project_id
  })
  const { setSidebarContext } = useNavigationStore()
  const [activeTab, setActiveTab] = useState('active')

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  const { workers, attendance } = useMemo(() => {
    return transformAttendanceData(attendanceData)
  }, [attendanceData])

  // Handle editing attendance - opens modal with existing data
  const handleEditAttendance = (workerId: string, date: Date, existingAttendance?: any) => {
    // Find the worker details
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return;

    // Open the attendance modal with editing data
    openModal('attendance', {
      isEditing: true,
      editingData: {
        contactId: workerId,
        contactName: worker.name,
        attendanceDate: date,
        existingRecord: existingAttendance
      }
    });
  }

  const headerProps = {
    icon: Users,
    title: "Personal",
    breadcrumb: [
      { name: "Construcción", href: "/construction/dashboard" },
      { name: "Personal", href: "/construction/personnel" }
    ],
    tabs: [
      {
        id: 'active',
        label: 'Activos',
        isActive: activeTab === 'active'
      },
      {
        id: 'attendance',
        label: 'Asistencia',
        isActive: activeTab === 'attendance'
      }
    ],
    onTabChange: setActiveTab,
    actionButton: activeTab === 'attendance' ? {
      label: 'Registrar Asistencia',
      icon: Plus,
      onClick: () => openModal('attendance', {})
    } : activeTab === 'active' ? {
      label: 'Agregar Personal',
      icon: Plus,
      onClick: () => openModal('personnel', {})
    } : undefined
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {activeTab === 'active' && (
          <PersonnelTable 
            personnel={personnelData}
            isLoading={isPersonnelLoading}
            onEdit={(record) => {
              // TODO: Implementar edición de notas
              console.log('Edit personnel:', record);
            }}
            onDeactivate={(record) => {
              // TODO: Implementar eliminación
              console.log('Delete personnel:', record);
            }}
          />
        )}

        {activeTab === 'attendance' && (
          <>
            {workers.length > 0 ? (
              <CustomGradebook 
                workers={workers}
                attendance={attendance}
                onEditAttendance={handleEditAttendance}
              />
            ) : (
              <EmptyState
                icon={<UserCheck className="h-12 w-12" />}
                title="Sin registros de asistencia"
                description="No hay registros de asistencia para este proyecto. El personal aparecerá aquí cuando se registren entradas de bitácora con asistencia."
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}