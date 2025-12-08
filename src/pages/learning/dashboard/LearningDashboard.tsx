import { useEffect } from 'react'
import { DashboardLayout as Layout } from "@/layouts"
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, ArrowRight, BookOpen } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { CoursesCatalogContent } from '@/features/shared-content/courses'
import { StatCard } from '@/components/ui-custom/KPICard'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useLocation } from 'wouter'
import { useLearningDashboardFast } from '@/features/learning'
import CarouselHero from '@/components/shared/CarouselHero'
import { useHeroSections } from '@/features/layout'

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

  const { data: dashboardData, isLoading } = useLearningDashboardFast();
  
  // Get hero sections from database for carousel
  const { data: heroSections = [] } = useHeroSections('learning_dashboard');

  const { global, courses = [], featured_course, currentStreak = 0 } = dashboardData || {}
  
  const hasEnrollments = courses && courses.length > 0;
  const heroCurso = featured_course || (courses.length > 0 ? courses[0] : null);

  const coursesSorted = courses
    .filter((c: any) => c.progress_pct >= 0 && c.progress_pct < 100)
    .sort((a: any, b: any) => b.progress_pct - a.progress_pct)
    .slice(0, 3);

  // Convert hero sections to carousel format
  const carouselSections = heroSections.map((section: any) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    media_url: section.media_url,
    media_type: section.media_type,
    primary_button_text: section.primary_button_text,
    primary_button_action: section.primary_button_action,
    primary_button_action_type: section.primary_button_action_type,
    secondary_button_text: section.secondary_button_text,
    secondary_button_action: section.secondary_button_action,
    secondary_button_action_type: section.secondary_button_action_type,
    badge_text: undefined,
  }));

  // Default hero course for users with no enrollments
  const defaultHeroCourse = {
    course_title: 'Explora nuestros Cursos',
    short_description: 'Desarrolla tus habilidades profesionales con nuestros cursos especializados',
    cover_url: null,
    course_slug: null,
    done_lessons: undefined,
    total_lessons: 0,
    progress_pct: 0,
  };

  const currentHero = heroCurso || (!hasEnrollments && defaultHeroCourse);
  
  // Use CarouselHero if there are sections configured, otherwise use legacy hero
  const heroSection = carouselSections.length > 0 ? (
    <CarouselHero
      sections={carouselSections}
      height="h-[200px] sm:h-[250px] md:h-96"
      autoplay={true}
      autoplayInterval={6000}
      onButtonClick={(buttonType, action, actionType) => {
        if (actionType === 'internal_route') {
          navigate(action);
        } else {
          window.open(action, '_blank');
        }
      }}
    />
  ) : currentHero && (
    <div 
      className="relative h-[200px] sm:h-[250px] md:h-96 overflow-hidden w-full"
      data-testid="hero-featured-course"
    >
      {currentHero.cover_url ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat motion-reduce:bg-scroll"
            style={{
              backgroundImage: `url(${currentHero.cover_url})`,
              backgroundPosition: 'center center'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black/100 dark:from-black/30 dark:via-black/70 dark:to-black/100" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5 dark:from-accent/20 dark:to-accent/10" />
      )}

      <div className="relative h-full flex flex-col justify-end px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-12">
        <div className="max-w-3xl">
          <div className="mb-3 sm:mb-6">
            <Badge 
              style={{ 
                backgroundColor: 'var(--accent)', 
                color: 'white',
                borderColor: 'var(--accent)'
              }}
              className="text-[9px] sm:text-[10px] md:text-xs font-medium uppercase px-3 sm:px-4 py-1.5 sm:py-2"
              data-testid="badge-featured"
            >
              {heroCurso ? 'Destacado' : 'Explora'}
            </Badge>
          </div>
          
          <h1 
            className="text-lg sm:text-2xl md:text-5xl font-bold mb-2 sm:mb-4 md:mb-6 tracking-tight !text-white line-clamp-2" 
            data-testid="text-hero-title"
          >
            {currentHero.course_title}
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base max-w-2xl mb-4 sm:mb-8 text-[rgb(220,220,220)] line-clamp-1 sm:line-clamp-2">
            {currentHero.done_lessons !== undefined 
              ? `${currentHero.done_lessons} de ${currentHero.total_lessons} lecciones completadas • ${currentHero.progress_pct}% completado`
              : currentHero.short_description || 'Descubre este curso y desarrolla nuevas habilidades'}
          </p>
          
          <div className="flex gap-3">
            {currentHero.course_slug ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/learning/courses/${currentHero.course_slug}`);
                }}
                className="group/btn text-xs sm:text-sm md:text-base"
                data-testid="button-continue-course"
              >
                <span>{currentHero.done_lessons !== undefined ? 'Continuar' : 'Ver'}</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/learning/courses')}
                className="group/btn text-xs sm:text-sm md:text-base"
                data-testid="button-explore-courses-hero"
              >
                <span>Explorar Cursos</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-6 px-4 sm:px-6 md:px-12 py-6 md:py-12">
      <CoursesCatalogContent mode="dashboard" showTabs={true} />
      
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
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      <h4 className="font-semibold truncate" data-testid="text-continue-course-title">
                        {course.course_title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {course.done_lessons} de {course.total_lessons} lecciones completadas
                      </p>
                      
                      <div className="flex items-center gap-3">
                        <Progress value={course.progress_pct} className="h-2 flex-1" />
                        <span className="text-xl md:text-2xl font-bold flex-shrink-0" style={{ color: 'var(--accent)' }}>
                          {course.progress_pct}%
                        </span>
                      </div>
                      
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
  );

  if (isLoading) {
    return (
      <Layout hideHeader wide>
        <div className="h-full overflow-auto">
          <Skeleton className="h-[200px] sm:h-[250px] md:h-96 w-full" />
          <div className="space-y-6 px-4 sm:px-6 md:px-12 py-6 md:py-12">
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
      <div className="h-full overflow-auto">
        {heroSection}
        {mainContent}
      </div>
    </Layout>
  )
}
