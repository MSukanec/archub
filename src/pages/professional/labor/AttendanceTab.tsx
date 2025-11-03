import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import AttendanceGradebook from '@/components/charts/graphics/AttendanceGradebook'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { UserCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { useMemo } from 'react'

function useAttendanceData(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['construction-attendance', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []

      const { data: attendanceData, error } = await supabase
        .from('attendees')
        .select(`
          *,
          personnel:project_personnel(
            id,
            notes,
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

function transformAttendanceData(attendanceData: any[]) {
  if (!attendanceData || attendanceData.length === 0) return { workers: [], attendance: [] }

  const workersMap = new Map()
  attendanceData.forEach(attendance => {
    if (attendance.personnel?.contact) {
      const contact = attendance.personnel.contact
      const workerId = contact.id
      const workerName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      const contactTypeName = contact.contact_type_links?.[0]?.contact_type?.name || 'Sin tipo'
      const contactTypeId = contact.contact_type_links?.[0]?.contact_type?.id
      
      workersMap.set(workerId, {
        id: workerId,
        name: workerName || 'Sin nombre',
        contactType: contactTypeName,
        contactTypeId: contactTypeId
      })
    }
  })

  const workers = Array.from(workersMap.values())
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

interface AttendanceTabProps {
  openModal: any
  selectedProjectId: string | null
  currentOrganizationId: string | null
}

export default function AttendanceTab({ 
  openModal, 
  selectedProjectId,
  currentOrganizationId 
}: AttendanceTabProps) {
  const { data: attendanceData = [], isLoading } = useAttendanceData(
    selectedProjectId || undefined,
    currentOrganizationId || undefined
  )

  const { workers, attendance } = useMemo(() => {
    return transformAttendanceData(attendanceData)
  }, [attendanceData])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <EmptyState
        icon={<UserCheck className="h-12 w-12" />}
        title="Sin registros de asistencia"
        description="No hay registros de asistencia para este proyecto. El personal aparecerá aquí cuando se registren entradas de bitácora con asistencia."
        action={
          <Button onClick={() => openModal('attendance', {})}>
            Registrar Asistencia
          </Button>
        }
      />
    )
  }

  return (
    <AttendanceGradebook 
      workers={workers}
      attendance={attendance}
      onEditAttendance={handleEditAttendance}
    />
  )
}
