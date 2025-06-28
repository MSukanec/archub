import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import CustomGradebook from '@/components/ui-custom/misc/CustomGradebook'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
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

      console.log('Fetching personnel attendance for project:', projectId, 'in organization:', organizationId)

      // Get site logs for this specific project only
      const { data: siteLogs, error: siteLogsError } = await supabase
        .from('site_logs')
        .select('id')
        .eq('project_id', projectId)

      if (siteLogsError) {
        console.error('Error fetching site logs:', siteLogsError)
        return []
      }

      if (!siteLogs || siteLogs.length === 0) {
        console.log('No site logs found for project')
        return []
      }

      const siteLogIds = siteLogs.map(log => log.id)

      // Now get attendees only for those site logs
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
            last_name,
            contact_type_id,
            organization_id,
            contact_type:contact_types(
              id,
              name
            )
          )
        `)
        .in('site_log_id', siteLogIds)

      if (error) {
        console.error('Error fetching attendance data:', error)
        return []
      }

      // Filter to ensure contacts belong to the same organization
      const filteredData = (attendanceData || []).filter(item => 
        item.contact?.organization_id === organizationId
      )

      console.log('Filtered personnel attendance data:', filteredData.length, 'records')
      
      return filteredData
    },
    enabled: !!supabase && !!projectId && !!organizationId
  })
}

// Hook to fetch contact types for filtering
function useContactTypes() {
  return useQuery({
    queryKey: ['contact-types'],
    queryFn: async () => {
      if (!supabase) return []

      const { data: contactTypes, error } = await supabase
        .from('contact_types')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching contact types:', error)
        return []
      }

      return contactTypes || []
    },
    enabled: !!supabase
  })
}

// Transform attendance data for gradebook display with contact type filtering
function transformAttendanceData(attendanceData: any[], selectedContactTypeId?: string) {
  if (!attendanceData || attendanceData.length === 0) return { workers: [], attendance: [] }

  // Get unique workers with contact type filtering
  const workersMap = new Map()
  attendanceData.forEach(attendance => {
    if (attendance.contact) {
      // Filter by contact type if selected
      if (selectedContactTypeId && attendance.contact.contact_type_id !== selectedContactTypeId) {
        return
      }

      const workerId = attendance.contact.id
      const workerName = `${attendance.contact.first_name || ''} ${attendance.contact.last_name || ''}`.trim()
      const contactTypeName = attendance.contact.contact_type?.name || 'Sin tipo'
      
      workersMap.set(workerId, {
        id: workerId,
        name: workerName || 'Sin nombre',
        contactType: contactTypeName,
        contactTypeId: attendance.contact.contact_type_id
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
  const [selectedContactType, setSelectedContactType] = useState<string>("")

  const { data: userData } = useCurrentUser()
  const { data: attendanceData = [], isLoading } = usePersonnelAttendance(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  )
  const { data: contactTypes = [] } = useContactTypes()

  const { workers, attendance } = useMemo(() => {
    return transformAttendanceData(attendanceData, selectedContactType || undefined)
  }, [attendanceData, selectedContactType])

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
    onClearFilters: () => {
      setSearchValue("")
      setSelectedContactType("")
    },
    customFilters: (
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium mb-1">Tipo de Personal</Label>
          <Select value={selectedContactType} onValueChange={setSelectedContactType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los tipos</SelectItem>
              {contactTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="hide-weekends"
            checked={hideWeekends}
            onCheckedChange={setHideWeekends}
          />
          <Label htmlFor="hide-weekends" className="text-xs">
            Ocultar fines de semana
          </Label>
        </div>
      </div>
    )
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
          <CustomEmptyState
            icon={Users}
            title="Sin personal registrado"
            description="No hay registros de asistencia para este proyecto."
            action={{
              label: "Ir a Bitácora",
              href: "/construction/logs"
            }}
          />
        )}
      </div>
    </Layout>
  )
}