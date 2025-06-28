import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import CustomGradebook from '@/components/ui-custom/misc/CustomGradebook'
import { Users, Download, Calendar, CalendarDays } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'

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
  const [searchValue, setSearchValue] = useState("")
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)))
  const [hideWeekends, setHideWeekends] = useState(false)

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

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalWorkers = filteredWorkers.length
    const totalAttendanceRecords = filteredAttendance.length
    const fullDayAttendance = filteredAttendance.filter(a => a.status === 'full').length
    const halfDayAttendance = filteredAttendance.filter(a => a.status === 'half').length
    
    return {
      totalWorkers,
      totalAttendanceRecords,
      fullDayAttendance,
      halfDayAttendance,
      attendanceRate: totalAttendanceRecords > 0 ? Math.round((fullDayAttendance / totalAttendanceRecords) * 100) : 0
    }
  }, [filteredWorkers, filteredAttendance])

  const headerProps = {
    title: "Personal",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    onClearFilters: () => setSearchValue("")
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Personal</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros de Asistencia</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttendanceRecords}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jornadas Completas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fullDayAttendance}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Asistencia</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Gradebook Component */}
        {filteredWorkers.length > 0 ? (
          <CustomGradebook 
            workers={filteredWorkers}
            attendance={filteredAttendance}
            startDate={startDate}
            endDate={endDate}
            hideWeekends={hideWeekends}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onHideWeekendsChange={setHideWeekends}
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