import { useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, BookOpen, Clock, Award, Flame, CheckCircle2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

import ProgressRing from '@/components/charts/courses/ProgressRing'
import MiniBar from '@/components/charts/courses/MiniBar'
import LineStreak from '@/components/charts/courses/LineStreak'

interface DashboardData {
  global: {
    done_lessons_total: number
    total_lessons_total: number
    progress_pct: number
  } | null
  study: {
    seconds_lifetime: number
    seconds_this_month: number
  }
  activeDays: string[]
  courses: Array<{
    course_id: string
    course_title: string
    course_slug: string
    progress_pct: number
    done_lessons: number
    total_lessons: number
  }>
  recentActivity: Array<{
    type: string
    when: string
    lesson_title: string
    module_title: string
    course_title: string
    course_slug: string
  }>
}

export default function LearningDashboard() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore()
  const { data: userData } = useCurrentUser()
  const [, navigate] = useLocation()

  useEffect(() => {
    setSidebarContext('learning')
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning')
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel])

  // Fetch optimized dashboard data
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/learning/dashboard'],
    queryFn: async () => {
      if (!supabase) return null
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const response = await fetch('/api/learning/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Failed to fetch dashboard data:', await response.text())
        return null
      }
      
      return response.json()
    },
    enabled: !!supabase && !!userData
  })

  const { global, study, activeDays = [], courses = [], recentActivity = [] } = dashboardData || {}

  // Calculate study hours
  const hoursData = useMemo(() => ([
    { name: 'Mes', value: Math.round((study?.seconds_this_month ?? 0) / 3600) },
    { name: 'Total', value: Math.round((study?.seconds_lifetime ?? 0) / 3600) }
  ]), [study])

  // Calculate streak series for chart
  const streakSeries = useMemo(() => {
    const set = new Set(activeDays)
    const last30: { day: string; active: number }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(today.getTime() - i * 86400000)
      const key = dt.toISOString().slice(0, 10)
      last30.push({ day: key, active: set.has(key) ? 1 : 0 })
    }
    return last30
  }, [activeDays])

  // Get top 3 courses in progress
  const coursesSorted = useMemo(() => {
    return [...courses]
      .filter(c => c.progress_pct >= 0 && c.progress_pct < 100)
      .sort((a, b) => b.progress_pct - a.progress_pct)
      .slice(0, 3)
  }, [courses])

  // Calculate current streak
  const currentStreak = useMemo(() => {
    const sorted = [...activeDays].sort((a, b) => b.localeCompare(a))
    let streak = 0
    
    for (let i = 0; i < sorted.length; i++) {
      const expectedDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (sorted[i] === expectedDate) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [activeDays])

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  if (!global || global.total_lessons_total === 0) {
    return (
      <Layout headerProps={headerProps} wide>
        <EmptyState
          icon={<GraduationCap />}
          title="Comienza tu Aprendizaje"
          description="Aún no estás inscrito en ningún curso. Explora los cursos disponibles y comienza a desarrollar tus habilidades profesionales."
          action={
            <Button 
              onClick={() => navigate('/learning/courses')}
              data-testid="button-browse-courses"
            >
              Explorar Cursos Disponibles
            </Button>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Main Dashboard Grid - 4 cards using StatCard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Progress Ring */}
          <StatCard className="flex flex-col">
            <div className="pb-3">
              <StatCardTitle>Progreso General</StatCardTitle>
              <StatCardMeta data-testid="text-lessons-completed">
                {global.done_lessons_total}/{global.total_lessons_total} lecciones
              </StatCardMeta>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <ProgressRing value={global.progress_pct} />
            </div>
          </StatCard>

          {/* Card 2: Study Hours */}
          <StatCard className="flex flex-col">
            <div className="pb-3">
              <StatCardTitle>Horas de Estudio</StatCardTitle>
              <StatCardMeta>Este mes y total</StatCardMeta>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <MiniBar data={hoursData} />
            </div>
          </StatCard>

          {/* Card 3: Activity Streak */}
          <StatCard className="flex flex-col">
            <div className="pb-3">
              <StatCardTitle>Racha de Actividad</StatCardTitle>
              <StatCardMeta>Últimos 30 días</StatCardMeta>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <LineStreak data={streakSeries} />
            </div>
          </StatCard>

          {/* Card 4: Active Courses & Current Streak */}
          <StatCard className="flex flex-col">
            <div className="pb-3">
              <StatCardTitle>Cursos Activos</StatCardTitle>
            </div>
            <div className="flex-1 space-y-6">
              <div>
                <StatCardValue data-testid="text-active-courses-count">
                  {courses.length}
                </StatCardValue>
                <StatCardMeta>Cursos en los que estás inscrito</StatCardMeta>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium">Racha Actual</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }} data-testid="text-current-streak">
                  {currentStreak}
                </div>
                <p className="text-xs text-muted-foreground" data-testid="text-streak-label">
                  {currentStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
                </p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Courses in Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              Cursos en Progreso
            </CardTitle>
            <CardDescription>
              Continúa tu aprendizaje donde lo dejaste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {coursesSorted.length > 0 ? (
              coursesSorted.map((course) => (
                <div key={course.course_id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0" data-testid={`course-progress-${course.course_id}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" data-testid="text-course-title">{course.course_title}</h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-course-lessons">
                        {course.done_lessons} de {course.total_lessons} lecciones completadas
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-medium min-w-[45px] text-right" data-testid="text-course-percentage">
                        {course.progress_pct}%
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/learning/courses/${course.course_slug}`)}
                        data-testid={`button-go-to-course-${course.course_id}`}
                      >
                        Ir al Curso
                      </Button>
                    </div>
                  </div>
                  <Progress value={course.progress_pct} className="h-2" data-testid="progress-bar-course" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No tienes cursos en progreso</p>
                <p className="text-xs mt-1">¡Comienza un curso para empezar tu aprendizaje!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas lecciones en las que trabajaste
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm pb-3 border-b last:border-0 last:pb-0" data-testid={`recent-activity-${index}`}>
                    <CheckCircle2 
                      className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                        item.type === 'completed' ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" data-testid="text-activity-lesson-title">{item.lesson_title}</div>
                      <div className="text-xs text-muted-foreground truncate" data-testid="text-activity-course-module">
                        {item.course_title} • {item.module_title}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid="text-activity-timestamp">
                        {item.when && format(new Date(item.when), "d 'de' MMMM, HH:mm", { locale: es })}
                      </div>
                    </div>
                    {item.type === 'completed' && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full flex-shrink-0" 
                        style={{ 
                          backgroundColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
                          color: 'var(--accent)'
                        }}
                        data-testid="badge-completed"
                      >
                        Completada
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No hay actividad reciente</p>
                <p className="text-xs mt-1">Comienza a estudiar para ver tu actividad aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
