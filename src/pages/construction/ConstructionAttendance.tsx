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
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { Users, Download, Calendar, CalendarDays, FileText, Clock, BarChart3, Filter, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

// Transform attendance data for gradebook display
function transformAttendanceData(attendanceData: any[]) {
  if (!attendanceData || attendanceData.length === 0) return { workers: [], attendance: [] }

  // Get unique workers (no filtering here, filtering will be done later)
  const workersMap = new Map()
  attendanceData.forEach(attendance => {
    if (attendance.contact) {
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
  const [selectedContactType, setSelectedContactType] = useState<string>("")
  const [triggerTodayCenter, setTriggerTodayCenter] = useState(false)

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
    return transformAttendanceData(attendanceData) // Remove contact type filter from here
  }, [attendanceData])

  // Filter workers based on search AND contact type
  const filteredWorkers = useMemo(() => {
    let filtered = workers
    
    // Filter by contact type
    if (selectedContactType) {
      filtered = filtered.filter(worker => worker.contactTypeId === selectedContactType)
    }
    
    // Filter by search
    if (searchValue.trim()) {
      filtered = filtered.filter(worker => 
        worker.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    }
    
    return filtered
  }, [workers, searchValue, selectedContactType])

  // Filter attendance data for filtered workers
  const filteredAttendance = useMemo(() => {
    const filteredWorkerIds = new Set(filteredWorkers.map(w => w.id))
    return attendance.filter(record => filteredWorkerIds.has(record.workerId))
  }, [attendance, filteredWorkers])

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("")
    setSelectedContactType("")
  }

  // Navigate to today - centers view on today in gradebook
  const handleTodayClick = () => {
    // Toggle the trigger to force re-center on today
    setTriggerTodayCenter(prev => !prev)
  }



  // Custom filters for ActionBar - Only contact type filter
  const customFilters = (
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
  )

  const headerProps = {
    title: "Asistencia"
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

        {/* ActionBar - Always visible */}
        <ActionBarDesktop
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
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showGrouping={false}
          customFilters={customFilters}
          onClearFilters={handleClearFilters}
          onTodayClick={handleTodayClick}
        />

        {/* Gradebook Component - Show always if there's original data, even if filtered workers is empty */}
        {workers.length > 0 ? (
          <CustomGradebook 
            workers={filteredWorkers}
            attendance={filteredAttendance}
            triggerTodayCenter={triggerTodayCenter}
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
    </Layout>
  )
}