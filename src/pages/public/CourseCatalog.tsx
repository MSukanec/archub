import { useState, useMemo } from 'react';
import { MarketingLayout } from '@/layouts';
import { useAllCourses, UnifiedCourseGrid, useLearningCourses } from '@/features/learning';
import { useCurrentUser } from '@/hooks/use-current-user';
import { BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';

type TabFilter = 'all' | 'enrolled' | 'completed';

export default function CourseCatalog() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  
  // Get public courses (always available)
  const { data: publicCourses, isLoading: publicLoading, error } = useAllCourses();
  
  // Get current user (may be null if not authenticated)
  const { data: userData } = useCurrentUser();
  const isAuthenticated = !!userData?.user;
  
  // Get user's enrollments and progress (only if authenticated)
  // Note: Hook will return empty data if user is not authenticated
  const { data: learningData, isLoading: learningLoading } = useLearningCourses();

  const isLoading = publicLoading || learningLoading;

  // Build enrollment and progress maps
  const { enrollmentMap, progressMap } = useMemo(() => {
    const enrollMap = new Map<string, boolean>();
    const progMap = new Map<string, { completed: number; total: number; percentage: number }>();
    
    if (learningData) {
      // Map enrollments
      learningData.enrollments?.forEach((e: any) => {
        if (e.status === 'active') {
          enrollMap.set(e.course_id, true);
        }
      });
      
      // Map progress
      learningData.progress?.forEach((p: any) => {
        progMap.set(p.course_id, {
          completed: p.done_lessons || 0,
          total: p.total_lessons || 0,
          percentage: Math.round(p.progress_pct || 0),
        });
      });
    }
    
    return { enrollmentMap: enrollMap, progressMap: progMap };
  }, [learningData]);

  // Merge public courses with enrollment data
  const coursesData = useMemo(() => {
    if (!publicCourses) return [];
    
    return publicCourses.map(course => {
      const isEnrolled = enrollmentMap.get(course.id) || false;
      const progress = progressMap.get(course.id);
      
      return {
        ...course,
        isEnrolled,
        progress,
        onViewCourse: () => navigate(`/learning/courses/${course.slug}`),
      };
    });
  }, [publicCourses, enrollmentMap, progressMap, navigate]);

  // Filter courses based on active tab
  const filteredCourses = useMemo(() => {
    if (activeTab === 'all') {
      return coursesData;
    } else if (activeTab === 'enrolled') {
      return coursesData.filter(c => c.isEnrolled && (c.progress?.percentage || 0) < 100);
    } else if (activeTab === 'completed') {
      return coursesData.filter(c => c.isEnrolled && c.progress?.percentage === 100);
    }
    return coursesData;
  }, [coursesData, activeTab]);

  // Calculate counts for tabs
  const enrolledCount = useMemo(() => 
    coursesData.filter(c => c.isEnrolled && (c.progress?.percentage || 0) < 100).length,
    [coursesData]
  );
  
  const completedCount = useMemo(() => 
    coursesData.filter(c => c.isEnrolled && c.progress?.percentage === 100).length,
    [coursesData]
  );

  if (error) {
    return (
      <MarketingLayout
        headerNavigation={[
          { label: "Cursos", href: "/cursos" },
          { label: "Características", href: "/#features" },
          { label: "Capacidades", href: "/#capabilities" }
        ]}
        seo={{
          title: "Cursos Online | Seencel",
          description: "Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores.",
          keywords: "cursos online, capacitación profesional, cursos archicad",
        }}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Error al cargar cursos</h1>
            <p className="text-muted-foreground">
              Hubo un problema al cargar los cursos. Por favor, intenta de nuevo más tarde.
            </p>
          </div>
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout
      headerNavigation={[
        { label: "Cursos", href: "/cursos" },
        { label: "Características", href: "/#features" },
        { label: "Capacidades", href: "/#capabilities" }
      ]}
      seo={{
        title: "Cursos Online | Seencel",
        description: "Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores.",
        keywords: "cursos online, capacitación profesional, cursos archicad",
      }}
    >
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-background to-muted/20 py-16 sm:py-20 -mx-6 px-6 mb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Cursos Disponibles
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
              Explora nuestro catálogo de cursos profesionales. Aprende a tu ritmo con los mejores instructores
              y desarrolla las habilidades que necesitas para destacar en tu carrera.
            </p>

            <div className="flex flex-wrap justify-center gap-6 pt-4 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-medium">Acceso ilimitado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid with Tabs */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <UnifiedCourseGrid 
          courses={filteredCourses}
          isLoading={isLoading}
          showTabs={isAuthenticated} 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as TabFilter)}
          enrolledCount={enrolledCount}
          completedCount={completedCount}
        />
      </section>

      {/* Additional Info Section */}
      {!isLoading && coursesData && coursesData.length > 0 && (
        <section className="relative bg-gradient-to-br from-muted/20 to-background py-12 -mx-6 px-6 mt-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h2 className="text-2xl font-bold">¿Listo para comenzar?</h2>
              <p className="text-muted-foreground">
                Selecciona un curso y comienza tu viaje de aprendizaje hoy mismo.
                Todos nuestros cursos están diseñados para que aprendas a tu propio ritmo.
              </p>
            </div>
          </div>
        </section>
      )}
    </MarketingLayout>
  );
}
