import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, ArrowRight, BookOpen } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { StatCard, StatCardTitle, StatCardContent } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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

  // Use optimized endpoint for better performance
  const useOptimizedEndpoint = true; // Toggle this to compare performance
  const endpoint = useOptimizedEndpoint ? '/api/learning/dashboard-fast' : '/api/learning/dashboard';
  
  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: [endpoint],
    queryFn: async () => {
      if (!supabase) return null as any;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null as any;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        return null as any;
      }
      
      return response.json();
    },
    enabled: !!supabase && !!userData,
    staleTime: 30000, // Cache for 30 seconds to reduce load
    gcTime: 600000, // Keep in cache for 10 minutes for instant navigation
    refetchOnMount: 'always' // Always refetch when component mounts
  });

  const { global, courses = [], currentStreak = 0 } = dashboardData || {}
  
  // User has enrollments if they have courses (even if not started yet)
  const hasEnrollments = courses && courses.length > 0;

  const coursesSorted = courses
    .filter(c => c.progress_pct >= 0 && c.progress_pct < 100)
    .sort((a, b) => b.progress_pct - a.progress_pct)
    .slice(0, 3);

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
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
            ¡Bienvenido a Capacitaciones, {userData?.user?.email?.split('@')[0] || 'Usuario'}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Desarrolla tus habilidades profesionales con nuestros cursos especializados en construcción y diseño arquitectónico.
          </p>
        </div>

        {/* Hero Section - Always visible */}
        <div 
          className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden group cursor-pointer"
          onClick={() => navigate('/learning/courses')}
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
              <Badge 
                style={{ 
                  backgroundColor: 'var(--accent)', 
                  color: 'white',
                  borderColor: 'var(--accent)'
                }}
                className="text-[10px] md:text-xs font-medium uppercase"
                data-testid="badge-recommended"
              >
                Recomendado
              </Badge>
            </div>
            
            <h1 
              className="text-4xl md:text-6xl font-bold mb-3 md:mb-4 tracking-tight !text-white" 
              data-testid="text-hero-title"
            >
              Master ArchiCAD Online
            </h1>
            
            <p className="text-sm md:text-base max-w-2xl mb-6" style={{ color: '#9ca3af' }}>
              Domina las herramientas más avanzadas de diseño arquitectónico y modelado BIM
            </p>
            
            <div>
              <Button
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/learning/courses');
                }}
                className="group/btn"
                data-testid="button-go-to-archicad"
              >
                <span>Ver Curso</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Continue Where You Left Off Section */}
        <StatCard>
          <StatCardContent>
            <StatCardTitle className="mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Continúa donde lo dejaste
            </StatCardTitle>
            <p className="text-sm text-muted-foreground mb-4">
              Retoma tu aprendizaje desde tu última lección
            </p>
            
            {hasEnrollments && coursesSorted.length > 0 ? (
              <div className="space-y-4">
                {coursesSorted.map((course) => (
                  <div 
                    key={course.course_id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border hover:border-accent/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/learning/courses/${course.course_slug}`)}
                    data-testid={`continue-course-${course.course_id}`}
                  >
                    {/* Imagen - arriba en mobile, izquierda en desktop */}
                    <div className="w-full md:w-24 h-40 md:h-24 rounded-lg overflow-hidden md:flex-shrink-0 bg-muted">
                      <img 
                        src="/ArchiCADCourse.jpg" 
                        alt={course.course_title}
                        className="w-full h-full object-cover"
                      />
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
          </StatCardContent>
        </StatCard>
      </div>
    </Layout>
  )
}
