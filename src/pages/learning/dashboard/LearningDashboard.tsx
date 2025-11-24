import { useEffect } from 'react'
import { DashboardLayout as Layout } from "@/layouts"
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, ArrowRight, BookOpen } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { StatCard, StatCardContent } from '@/components/ui-custom/KPICard'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useLocation } from 'wouter'
import { useLearningDashboardFast } from '@/features/learning'

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

  // Usar hook del feature para obtener dashboard optimizado
  const { data: dashboardData, isLoading } = useLearningDashboardFast();

  const { global, courses = [], featured_course, currentStreak = 0 } = dashboardData || {}
  
  // User has enrollments if they have courses (even if not started yet)
  const hasEnrollments = courses && courses.length > 0;
  
  // Use featured course (latest added) for hero, or fallback to first enrolled course
  const heroCurso = featured_course || (courses.length > 0 ? courses[0] : null);

  const coursesSorted = courses
    .filter((c: any) => c.progress_pct >= 0 && c.progress_pct < 100)
    .sort((a: any, b: any) => b.progress_pct - a.progress_pct)
    .slice(0, 3);

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  }

  if (isLoading) {
    return (
      <Layout hideHeader wide>
        <div className="flex flex-col h-full">
          <Skeleton className="h-[300px] md:h-1/2 w-full" />
          <div className="space-y-6 p-6 md:p-12 flex-1">
            <Skeleton className="h-24 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-64 col-span-3" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout hideHeader wide>
      <div className="flex flex-col h-full">
        {/* Hero Section - Full-width, fixed height, no padding */}
        {heroCurso && (
          <div 
            className="relative h-[300px] md:h-1/2 overflow-hidden group cursor-pointer w-full flex-shrink-0"
            onClick={() => navigate(`/learning/courses/${heroCurso.course_slug}`)}
            data-testid="hero-featured-course"
          >
            {/* Background Image */}
            {heroCurso.cover_url ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center md:bg-fixed bg-no-repeat transition-transform duration-700 group-hover:scale-105 motion-reduce:bg-scroll"
                  style={{
                    backgroundImage: `url(${heroCurso.cover_url})`
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/100 dark:from-black/30 dark:via-black/70 dark:to-black/100" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end px-6 md:px-12 py-6 md:py-12">
              <div className="max-w-3xl">
                {/* Badge */}
                <div className="mb-6">
                  <Badge 
                    style={{ 
                      backgroundColor: 'var(--accent)', 
                      color: 'white',
                      borderColor: 'var(--accent)'
                    }}
                    className="text-[10px] md:text-xs font-medium uppercase px-4 py-2"
                    data-testid="badge-featured"
                  >
                    Destacado
                  </Badge>
                </div>
                
                {/* Title */}
                <h1 
                  className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight !text-white" 
                  data-testid="text-hero-title"
                >
                  {heroCurso.course_title}
                </h1>
                
                {/* Progress/Description */}
                <p className="text-sm md:text-base max-w-2xl mb-8 text-[rgb(220,220,220)]">
                  {heroCurso.done_lessons !== undefined 
                    ? `${heroCurso.done_lessons} de ${heroCurso.total_lessons} lecciones completadas • ${heroCurso.progress_pct}% completado`
                    : heroCurso.short_description || 'Descubre este curso y desarrolla nuevas habilidades'}
                </p>
                
                {/* CTA Button */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/learning/courses/${heroCurso.course_slug}`);
                    }}
                    className="group/btn"
                    data-testid="button-continue-course"
                  >
                    <span>{heroCurso.done_lessons !== undefined ? 'Continuar Curso' : 'Ver Curso'}</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Section with padding */}
        <div className="flex-1 p-6 md:p-12 space-y-6 overflow-y-auto">
          {/* Continue Where You Left Off Section */}
          <StatCard className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <h3 className="text-sm font-semibold">Continúa donde lo dejaste</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Retoma tu aprendizaje desde tu última lección
            </p>
            
            {hasEnrollments && coursesSorted.length > 0 ? (
              <div className="space-y-4">
                {coursesSorted.map((course: any) => (
                  <div 
                    key={course.course_id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border hover:border-accent/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/learning/courses/${course.course_slug}`)}
                    data-testid={`continue-course-${course.course_id}`}
                  >
                    {/* Imagen - arriba en mobile, izquierda en desktop */}
                    <div className="w-full md:w-24 h-40 md:h-24 rounded-lg overflow-hidden md:flex-shrink-0 bg-muted">
                      {course.cover_url ? (
                        <img 
                          src={course.cover_url} 
                          alt={course.course_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <BookOpen className="h-12 w-12 text-primary/20" />
                        </div>
                      )}
                    </div>
                    
                    {/* Contenido - stack vertical en mobile y desktop */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <h4 className="font-semibold truncate" data-testid="text-continue-course-title">
                        {course.course_title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {course.done_lessons} de {course.total_lessons} lecciones completadas
                      </p>
                      
                      {/* Barra y porcentaje juntos */}
                      <div className="flex items-center gap-3">
                        <Progress value={course.progress_pct} className="h-2 flex-1" />
                        <span className="text-xl md:text-2xl font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>
                          {course.progress_pct}%
                        </span>
                      </div>
                      
                      {/* Botón - full width en mobile, auto en desktop */}
                      <Button 
                        className="w-full md:w-auto"
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/learning/courses/${course.course_slug}`);
                        }}
                      >
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
          </StatCard>
        </div>
      </div>
    </Layout>
  )
}
