import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card'
import { Users, Calendar, Shield, TrendingUp } from 'lucide-react'
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface PersonnelDashboardProps {
  selectedProjectId: string | null
  currentOrganizationId: string | null
  personnelData: any[]
  insuranceData: any[]
  onTabChange: (tabId: string) => void
}

export default function PersonnelDashboard({
  selectedProjectId,
  currentOrganizationId,
  personnelData,
  insuranceData,
  onTabChange
}: PersonnelDashboardProps) {
  
  const { data: attendanceData = [] } = useQuery({
    queryKey: ['construction-attendance', selectedProjectId, currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !selectedProjectId || !currentOrganizationId) return []

      const { data, error } = await supabase
        .from('personnel_attendees')
        .select(`
          *,
          personnel:project_personnel(
            id,
            contact:contacts(
              id,
              organization_id
            )
          )
        `)
        .eq('project_id', selectedProjectId)

      if (error) return []

      const filtered = (data || []).filter(item => 
        item.personnel?.contact?.organization_id === currentOrganizationId
      )

      return filtered
    },
    enabled: !!supabase && !!selectedProjectId && !!currentOrganizationId
  })

  // Calcular métricas
  const metrics = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { locale: es })
    const weekEnd = endOfWeek(now, { locale: es })

    // 1. Total de personal activo
    const totalPersonnel = personnelData.length

    // 2. Asistencias de esta semana
    const weeklyAttendance = attendanceData.filter(record => {
      const recordDate = parseISO(record.created_at)
      return isWithinInterval(recordDate, { start: weekStart, end: weekEnd })
    }).length

    // 3. Personal con seguro activo
    const insuredCount = insuranceData.filter(insurance => {
      if (!insurance.expiration_date) return false
      const expirationDate = parseISO(insurance.expiration_date)
      return expirationDate >= now
    }).length

    // 4. Promedio de asistencia semanal (porcentaje)
    let attendanceRate = 0
    if (totalPersonnel > 0 && weeklyAttendance > 0) {
      // Asumiendo semana laboral de 5 días
      const maxPossibleAttendances = totalPersonnel * 5
      attendanceRate = Math.round((weeklyAttendance / maxPossibleAttendances) * 100)
    }

    return {
      totalPersonnel,
      weeklyAttendance,
      insuredCount,
      attendanceRate
    }
  }, [personnelData, attendanceData, insuranceData])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Personal Activo */}
      <StatCard 
        onCardClick={() => onTabChange('active')}
        data-testid="stat-card-personal-activo"
      >
        <StatCardTitle>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Personal Activo
          </div>
        </StatCardTitle>
        <StatCardValue>{metrics.totalPersonnel}</StatCardValue>
        <StatCardMeta>
          {metrics.totalPersonnel === 0 
            ? 'Sin personal asignado' 
            : metrics.totalPersonnel === 1
            ? '1 trabajador en el proyecto'
            : `${metrics.totalPersonnel} trabajadores en el proyecto`
          }
        </StatCardMeta>
      </StatCard>

      {/* 2. Asistencia Semanal */}
      <StatCard 
        onCardClick={() => onTabChange('attendance')}
        data-testid="stat-card-asistencia"
      >
        <StatCardTitle>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Asistencia Semanal
          </div>
        </StatCardTitle>
        <StatCardValue>{metrics.weeklyAttendance}</StatCardValue>
        <StatCardMeta>
          {metrics.weeklyAttendance === 0
            ? 'Sin registros esta semana'
            : metrics.weeklyAttendance === 1
            ? '1 registro esta semana'
            : `${metrics.weeklyAttendance} registros esta semana`
          }
        </StatCardMeta>
      </StatCard>

      {/* 3. Seguros Activos */}
      <StatCard 
        onCardClick={() => onTabChange('insurance')}
        data-testid="stat-card-seguros-activos"
      >
        <StatCardTitle>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Seguros Activos
          </div>
        </StatCardTitle>
        <StatCardValue>{metrics.insuredCount}</StatCardValue>
        <StatCardMeta>
          {metrics.insuredCount === 0
            ? 'Ningún trabajador asegurado'
            : metrics.totalPersonnel > 0
            ? `${Math.round((metrics.insuredCount / metrics.totalPersonnel) * 100)}% del personal`
            : `${metrics.insuredCount} asegurados`
          }
        </StatCardMeta>
      </StatCard>

      {/* 4. Tasa de Asistencia */}
      <StatCard 
        data-testid="stat-card-tasa-asistencia"
      >
        <StatCardTitle showArrow={false}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tasa de Asistencia
          </div>
        </StatCardTitle>
        <StatCardValue>
          {metrics.attendanceRate > 0 ? `${metrics.attendanceRate}%` : '-'}
        </StatCardValue>
        <StatCardMeta>
          {metrics.attendanceRate === 0
            ? 'Sin datos suficientes'
            : metrics.attendanceRate >= 80
            ? 'Excelente asistencia'
            : metrics.attendanceRate >= 60
            ? 'Buena asistencia'
            : 'Asistencia baja'
          }
        </StatCardMeta>
      </StatCard>
    </div>
  )
}
