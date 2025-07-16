import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useNavigationStore } from '@/stores/navigationStore'
import { useEffect } from 'react'
import CustomGradebook from '@/components/ui-custom/CustomGradebook'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { Users, Download, Calendar, CalendarDays, FileText, Clock, BarChart3, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { useLocation } from 'wouter'
import { Link } from 'wouter'

// Hook to fetch attendance data
function useAttendanceData(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['personnel-attendance', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return []

      console.log('Fetching attendance data for project:', projectId, 'in organization:', organizationId)

      // Now that site_logs has organization_id, filter by both project and organization
      const { data: attendanceData, error } = await supabase
        .from('site_log_attendees')
        .select(`
          *,
          site_log:site_logs!site_log_id(
            id,
            log_date,
            project_id,
            organization_id
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
        .eq('site_log.project_id', projectId)
        .eq('site_log.organization_id', organizationId)

      if (error) {
        console.error('Error fetching attendance data:', error)
        return []
      }

      // Additional filter to ensure contacts belong to the same organization
      const filteredData = (attendanceData || []).filter(item => 
        item.contact?.organization_id === organizationId &&
        item.site_log?.project_id === projectId &&
        item.site_log?.organization_id === organizationId
      )

      console.log('Filtered attendance data:', filteredData.length, 'records')
      
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

export default function ConstructionAttendance() {
  const [searchValue, setSearchValue] = useState("")
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 30)))
  const [hideWeekends, setHideWeekends] = useState(false)
  const [selectedContactType, setSelectedContactType] = useState<string>("")

  const [location, navigate] = useLocation()
  const { data: userData } = useCurrentUser()
  const { data: attendanceData = [], isLoading } = useAttendanceData(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  )
  const { data: contactTypes = [] } = useContactTypes()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])

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
    
    // Calculate unique active days
    const uniqueDates = new Set()
    attendanceData.forEach(item => {
      if (item.site_log?.log_date) {
        uniqueDates.add(item.site_log.log_date)
      }
    })
    const activeDays = uniqueDates.size
    
    return {
      totalWorkers,
      totalAttendanceRecords,
      fullDayAttendance,
      halfDayAttendance,
      activeDays,
      attendanceRate: totalAttendanceRecords > 0 ? Math.round((fullDayAttendance / totalAttendanceRecords) * 100) : 0
    }
  }, [filteredWorkers, filteredAttendance, attendanceData])

  // Generate statistics cards dynamically
  const statisticsCards = useMemo(() => [
    {
      title: "Total Asistencia",
      value: stats.totalWorkers,
      icon: Users,
      description: "Asistencia registrada"
    },
    {
      title: "Días Activos",
      value: stats.activeDays,
      icon: CalendarDays,
      description: "Días con asistencia"
    },
    {
      title: "Jornadas Completas",
      value: stats.fullDayAttendance,
      icon: Calendar,
      description: `De ${stats.totalAttendanceRecords} registros`
    },
    {
      title: "Tasa Completa",
      value: `${stats.attendanceRate}%`,
      icon: Users,
      description: "Jornadas completas vs total"
    }
  ], [stats])

  const headerProps = {
    title: "Asistencia",
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
          <Label className="text-xs font-medium mb-1">Tipo de Trabajador</Label>
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
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Control de Asistencia de Personal"
          icon={<Users className="w-6 h-6" />}
          features={[
            {
              icon: <Calendar className="w-5 h-5" />,
              title: "Registro Visual de Asistencia",
              description: "Visualiza la asistencia del personal en formato de calendario con datos extraídos automáticamente de las entradas de bitácora del proyecto."
            },
            {
              icon: <Filter className="w-5 h-5" />,
              title: "Filtros por Tipo de Trabajador",
              description: "Filtra la vista por tipos de personal (obreros, supervisores, técnicos) para análisis específicos por categoría profesional."
            },
            {
              icon: <BarChart3 className="w-5 h-5" />,
              title: "Estadísticas de Productividad",
              description: "Revisa métricas de jornadas completas vs medias jornadas, días activos y tasas de asistencia para optimizar la gestión del equipo."
            },
            {
              icon: <Clock className="w-5 h-5" />,
              title: "Control de Períodos Flexibles",
              description: "Configura rangos de fechas personalizados y oculta fines de semana para adaptar la vista a tu calendario de trabajo específico."
            }
          ]}
        />

        {/* Dynamic Statistics Cards - Only show when there's data */}
        {filteredWorkers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statisticsCards.map((card, index) => {
              const IconComponent = card.icon
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

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
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Sin personal registrado"
            description="No hay registros de asistencia para este proyecto. El personal aparecerá aquí cuando se registren entradas de bitácora con asistencia."
            action={
              <Link href="/construction/logs">
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  Ir a Bitácora
                </Button>
              </Link>
            }
          />
        )}
      </div>
    </Layout>
  )
}