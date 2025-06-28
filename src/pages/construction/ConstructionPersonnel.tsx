import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import CustomGradebook from '@/components/ui-custom/misc/CustomGradebook'
import { Users, Download, Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Hook to fetch personnel attendance data
function usePersonnelAttendance(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['personnel-attendance', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []

      // Get all site log attendees for this project
      const { data: attendanceData, error } = await supabase
        .from('site_log_attendees')
        .select(`
          *,
          site_log:site_logs!site_log_id(
            id,
            log_date,
            project_id
          ),
          contact:contacts(
            id,
            first_name,
            last_name
          )
        `)
        .eq('site_log.project_id', projectId)

      if (error) {
        console.error('Error fetching attendance data:', error)
        return []
      }

      return attendanceData || []
    },
    enabled: !!supabase && !!projectId && !!organizationId
  })
}

// Transform attendance data for gradebook display
function transformAttendanceData(attendanceData: any[]) {
  if (!attendanceData || attendanceData.length === 0) return { workers: [], attendance: [] }

  // Get unique workers
  const workersMap = new Map()
  attendanceData.forEach(attendance => {
    if (attendance.contact) {
      const workerId = attendance.contact.id
      const workerName = `${attendance.contact.first_name || ''} ${attendance.contact.last_name || ''}`.trim()
      workersMap.set(workerId, {
        id: workerId,
        name: workerName || 'Sin nombre'
      })
    }
  })

  const workers = Array.from(workersMap.values())

  // Create attendance records array for CustomGradebook
  const attendance: any[] = []

  attendanceData.forEach(attendanceRecord => {
    if (attendanceRecord.contact && attendanceRecord.site_log) {
      const workerId = attendanceRecord.contact.id
      const logDate = new Date(attendanceRecord.site_log.log_date)
      const day = logDate.getDate().toString().padStart(2, '0')
      
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
  const [searchValue, setSearchValue] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const { data: userData } = useCurrentUser()
  const { data: attendanceData = [], isLoading } = usePersonnelAttendance(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  )

  const { workers, attendance } = useMemo(() => {
    return transformAttendanceData(attendanceData)
  }, [attendanceData])

  // Filter workers based on search
  const filteredWorkers = useMemo(() => {
    if (!searchValue.trim()) return workers
    return workers.filter(worker => 
      worker.name.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [workers, searchValue])

  // Filter attendance data for filtered workers
  const filteredAttendance = useMemo(() => {
    const filteredWorkerIds = new Set(filteredWorkers.map(w => w.id))
    return attendance.filter(record => filteredWorkerIds.has(record.workerId))
  }, [attendance, filteredWorkers])

  // Export functionality
  const handleExport = () => {
    // TODO: Implement export to Excel/CSV
    console.log('Exporting attendance data...')
  }

  const customFilters = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Mes</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Enero</SelectItem>
              <SelectItem value="1">Febrero</SelectItem>
              <SelectItem value="2">Marzo</SelectItem>
              <SelectItem value="3">Abril</SelectItem>
              <SelectItem value="4">Mayo</SelectItem>
              <SelectItem value="5">Junio</SelectItem>
              <SelectItem value="6">Julio</SelectItem>
              <SelectItem value="7">Agosto</SelectItem>
              <SelectItem value="8">Septiembre</SelectItem>
              <SelectItem value="9">Octubre</SelectItem>
              <SelectItem value="10">Noviembre</SelectItem>
              <SelectItem value="11">Diciembre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Año</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  const headerProps = {
    icon: Users,
    title: "Personal de Obra",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: () => {
      setSearchValue("")
      setSelectedMonth(new Date().getMonth().toString())
      setSelectedYear(new Date().getFullYear().toString())
    },
    actions: [
      <Button key="export" variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button>
    ]
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
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {filteredWorkers.length > 0 ? (
          <CustomGradebook 
            workers={filteredWorkers}
            attendance={attendance}
            onExportAttendance={handleExport}
          />
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin personal registrado</h3>
            <p className="text-muted-foreground mb-4">
              No hay registros de asistencia para este proyecto.
            </p>
            <p className="text-sm text-muted-foreground">
              El personal aparecerá aquí cuando se registren entradas de bitácora con asistencia.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}