import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AttendanceGradebook from '@/components/charts/graphics/AttendanceGradebook'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { UserCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { useMemo, useState } from 'react'

// Hook para obtener todo el personal del proyecto
function useProjectPersonnel(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-personnel', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return []

      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          status,
          contact:contacts(
            id,
            first_name,
            last_name,
            full_name,
            contact_type_links(
              contact_type:contact_types(
                id,
                name
              )
            )
          ),
          labor_type:labor_types(
            id,
            name
          )
        `)
        .eq('project_id', projectId)

      if (error) {
        return []
      }

      return data || []
    },
    enabled: !!supabase && !!projectId
  })
}

function useAttendanceData(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['construction-attendance', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []

      const { data: attendanceData, error } = await supabase
        .from('personnel_attendees')
        .select(`
          *,
          personnel:project_personnel(
            id,
            notes,
            contact:contacts(
              id,
              first_name,
              last_name,
              organization_id
            )
          )
        `)
        .eq('project_id', projectId)

      if (error) {
        return []
      }

      const filteredData = (attendanceData || []).filter(item => 
        item.personnel?.contact?.organization_id === organizationId
      )

      return filteredData
    },
    enabled: !!supabase && !!projectId && !!organizationId
  })
}

function transformPersonnelAndAttendance(personnelData: any[], attendanceData: any[], filterStatus: 'all' | 'active') {
  // Primero, crear la lista de workers desde TODO el personal del proyecto
  const getDisplayName = (contact: any) => {
    if (!contact) return 'Sin nombre'
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    }
    return contact.full_name || 'Sin nombre'
  }

  // Filtrar con LA MISMA lógica que PersonnelListTab
  let filteredPersonnel = personnelData
  if (filterStatus === 'active') {
    filteredPersonnel = personnelData.filter(p => {
      // Tratar NULL como 'active' por defecto (para registros antiguos)
      const personStatus = p.status || 'active'
      return personStatus === 'active'
    })
  }

  const workers = filteredPersonnel.map(personnel => {
    const contact = personnel.contact
    const contactTypeName = contact?.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo'
    const contactTypeId = contact?.contact_type_links?.[0]?.contact_type?.id
    
    return {
      id: contact?.id || personnel.id,
      name: getDisplayName(contact),
      contactType: contactTypeName,
      contactTypeId: contactTypeId,
      status: personnel.status
    }
  })

  // Construir el array de attendance desde los registros
  const attendance: any[] = []
  attendanceData.forEach(attendanceRecord => {
    if (attendanceRecord.personnel?.contact) {
      const workerId = attendanceRecord.personnel.contact.id
      const logDate = new Date(attendanceRecord.created_at)
      const day = format(logDate, 'yyyy-MM-dd')
      
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

interface PersonnelAttendanceTabProps {
  openModal: any
  selectedProjectId: string | null
  currentOrganizationId: string | null
}

export default function PersonnelAttendanceTab({ 
  openModal, 
  selectedProjectId,
  currentOrganizationId 
}: PersonnelAttendanceTabProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active'>('active')

  const { data: personnelData = [], isLoading: isPersonnelLoading } = useProjectPersonnel(
    selectedProjectId || undefined
  )

  const { data: attendanceData = [], isLoading: isAttendanceLoading } = useAttendanceData(
    selectedProjectId || undefined,
    currentOrganizationId || undefined
  )

  const { workers, attendance } = useMemo(() => {
    return transformPersonnelAndAttendance(personnelData, attendanceData, filterStatus)
  }, [personnelData, attendanceData, filterStatus])

  const handleEditAttendance = (workerId: string, date: Date, existingAttendance?: any) => {
    const worker = workers.find(w => w.id === workerId)
    if (!worker) return

    openModal('attendance', {
      isEditing: true,
      editingData: {
        personnelId: workerId,
        contactName: worker.name,
        attendanceDate: date,
        existingRecord: existingAttendance
      }
    })
  }

  const isLoading = isPersonnelLoading || isAttendanceLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  // EmptyState grande: Solo si NO hay personal en el proyecto
  if (personnelData.length === 0) {
    return (
      <EmptyState
        icon={<UserCheck className="h-12 w-12" />}
        title="Sin personal"
        description="No hay personal asignado a este proyecto. Agrega personal desde la pestaña de Listado de Personal."
        action={
          <Button onClick={() => openModal('attendance', {})}>
            Registrar Asistencia
          </Button>
        }
      />
    )
  }

  // Siempre mostrar el componente si HAY personal en el proyecto
  // El empty state interno se muestra si workers.length === 0 (por el filtro)
  return (
    <AttendanceGradebook 
      workers={workers}
      attendance={attendance}
      onEditAttendance={handleEditAttendance}
      filterStatus={filterStatus}
      onFilterStatusChange={setFilterStatus}
    />
  )
}
