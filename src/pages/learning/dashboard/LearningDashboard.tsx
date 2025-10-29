import { useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, Sparkles, ArrowRight, CheckCircle2, BookOpen, Clock } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { StatCard, StatCardTitle } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

import ProgressRing from '@/components/charts/courses/ProgressRing'
import MiniBar from '@/components/charts/courses/MiniBar'
import LineStreak from '@/components/charts/courses/LineStreak'

interface DashboardData {
  global: {
    done_lessons_total: number
    total_lessons_total: number
    progress_pct: number
  } | null
  courses: Array<{
    course_id: string
    course_title: string
    course_slug: string
    progress_pct: number
    done_lessons: number
    total_lessons: number
  }>
  study: {
    seconds_lifetime: number
    seconds_this_month: number
  }
  currentStreak: number
  activeDays: number
  recentCompletions: Array<{
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

  // Fetch pre-calculated dashboard data from the server (much faster!)
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ['/api/learning/dashboard'],
    queryFn: async () => {
      if (!supabase) return null as any;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null as any;

      const response = await fetch('/api/learning/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch dashboard data:', await response.text());
        return null as any;
      }
      
      return response.json();
    },
    enabled: !!supabase && !!userData,
    staleTime: 30000,
  });

  const { global, courses = [], study, currentStreak = 0, recentCompletions = [] } = dashboardData || {}
  
  const hasEnrollments = global && global.total_lessons_total > 0;

  const hoursData = useMemo(() => ([
    { name: 'Mes', value: Math.round((study?.seconds_this_month ?? 0) / 3600) },
    { name: 'Total', value: Math.round((study?.seconds_lifetime ?? 0) / 3600) }
  ]), [study])

  const coursesSorted = useMemo(() => {
    return [...courses]
      .filter(c => c.progress_pct >= 0 && c.progress_pct < 100)
      .sort((a, b) => b.progress_pct - a.progress_pct)
      .slice(0, 3)
  }, [courses])

  const streakSeries = useMemo(() => {
    const last30: { day: string; active: number }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(today.getTime() - i * 86400000)
      const key = dt.toISOString().slice(0, 10)
      last30.push({ day: key, active: i < currentStreak ? 1 : 0 })
    }
    return last30
  }, [currentStreak])

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-64 col-span-3" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            ¡Bienvenido a Capacitaciones, {userData?.user?.email?.split('@')[0] || 'Usuario'}! 👋
          </h2>
          <p className="text-muted-foreground">
            Desarrolla tus habilidades profesionales con nuestros cursos especializados en construcción y diseño arquitectónico.
          </p>
        </div>

        {/* Continue Where You Left Off Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Continue Learning Cards - Takes 3 columns */}
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Continúa donde lo dejaste
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Retoma tu aprendizaje desde tu última lección
                  </p>
                </div>
                
                {hasEnrollments && coursesSorted.length > 0 ? (
                  <div className="space-y-4">
                    {coursesSorted.map((course) => (
                      <div 
                        key={course.course_id}
                        className="flex items-center gap-4 p-4 rounded-lg border hover:border-accent/50 transition-all cursor-pointer"
                        onClick={() => navigate(`/learning/courses/${course.course_slug}`)}
                        data-testid={`continue-course-${course.course_id}`}
                      >
                        {/* Course Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img 
                            src="/ArchiCADCourse.jpg" 
                            alt={course.course_title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Course Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate mb-1" data-testid="text-continue-course-title">
                            {course.course_title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {course.done_lessons} de {course.total_lessons} lecciones completadas
                          </p>
                          <Progress value={course.progress_pct} className="h-2" />
                        </div>
                        
                        {/* Progress & Button */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
                            {course.progress_pct}%
                          </span>
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/learning/courses/${course.course_slug}`);
                          }}>
                            Continuar
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Card - Takes 1 column */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Tu Progreso</h3>
                {hasEnrollments ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Cursos Activos
                      </p>
                      <div className="text-4xl font-bold" style={{ color: 'var(--accent)' }}>
                        {courses.length}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Racha Actual
                      </p>
                      <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                        {currentStreak}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {currentStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                        Progreso Global
                      </p>
                      <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>
                        {global?.progress_pct || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {global?.done_lessons_total || 0} de {global?.total_lessons_total || 0} lecciones
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-3">📚</div>
                    <p className="text-sm text-muted-foreground">
                      Inscríbete en un curso para ver tus estadísticas aquí
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rest of the dashboard - only show if enrolled */}
        {hasEnrollments && (
          <>
            {/* Hero Section */}
            <div 
              className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden group"
              data-testid="hero-archicad-course"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(/ArchiCADCourse.jpg)`
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
              
              <div className="relative h-full flex flex-col justify-end p-6 md:p-10">
                <div className="mb-4">
                  <span 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-medium backdrop-blur-sm border transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: 'rgba(var(--accent-rgb), 0.15)',
                      borderColor: 'rgba(var(--accent-rgb), 0.3)',
                      color: 'var(--accent)'
                    }}
                    data-testid="badge-latest-course"
                  >
                    <Sparkles className="w-4 h-4" />
                    Último Curso Disponible
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4 tracking-tight" data-testid="text-hero-title">
                  Master ArchiCAD Online
                </h1>
                
                <p className="text-base md:text-lg text-white/90 max-w-2xl mb-6">
                  Domina las herramientas más avanzadas de diseño arquitectónico y modelado BIM
                </p>
                
                <div>
                  <Button
                    size="lg"
                    onClick={() => navigate('/learning/courses/master-archicad')}
                    className="group/btn"
                    data-testid="button-go-to-archicad"
                  >
                    <span>Ver Curso</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Dashboard Grid - 4 equal cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard>
                <StatCardTitle>Progreso General</StatCardTitle>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-lessons-completed">
                  {global?.done_lessons_total}/{global?.total_lessons_total} lecciones
                </p>
                <div className="flex items-center justify-center mt-4">
                  <ProgressRing value={global?.progress_pct || 0} />
                </div>
              </StatCard>

              <StatCard>
                <StatCardTitle>Horas de Estudio</StatCardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Este mes y total
                </p>
                <div className="flex items-center justify-center mt-4">
                  <MiniBar data={hoursData} />
                </div>
              </StatCard>

              <StatCard>
                <StatCardTitle>Racha de Actividad</StatCardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Últimos 30 días
                </p>
                <div className="flex items-center justify-center mt-4">
                  <LineStreak data={streakSeries} />
                </div>
              </StatCard>

              <StatCard>
                <StatCardTitle>Cursos Activos</StatCardTitle>
                <div className="mt-4 space-y-6">
                  <div>
                    <div className="text-4xl font-bold" style={{ color: 'var(--accent)' }} data-testid="text-active-courses-count">
                      {courses.length}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cursos en los que estás inscrito
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide mb-2">
                      Racha Actual
                    </p>
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

            {/* Recent Activity */}
            <StatCard>
              <StatCardTitle className="mb-4">Actividad Reciente</StatCardTitle>
              <p className="text-sm text-muted-foreground mb-4">
                Últimas lecciones en las que trabajaste
              </p>
              {recentCompletions.length > 0 ? (
                <div className="space-y-3">
                  {recentCompletions.map((item: any, index: number) => (
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
            </StatCard>
          </>
        )}
      </div>
    </Layout>
  )
}
