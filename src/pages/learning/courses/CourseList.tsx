import { Layout } from '@/components/layout/desktop/Layout'
import { useState, useEffect, useMemo } from 'react'
import { useCourses } from '@/hooks/use-courses'
import { BookOpen, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useNavigationStore } from '@/stores/navigationStore'
import { Tabs } from '@/components/ui-custom/Tabs'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import PayButton from '@/components/learning/PayButton'
import { Button } from '@/components/ui/button'

type CourseTabFilter = 'enrolled' | 'completed' | 'all';

export default function CourseList() {
  const [activeTab, setActiveTab] = useState<CourseTabFilter>('all')
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore()
  
  const { data: courses = [], isLoading: coursesLoading } = useCourses()
  const [, navigate] = useLocation()

  useEffect(() => {
    setSidebarContext('learning')
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning')
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel])

  const { data: allProgress = [] } = useQuery<any[]>({
    queryKey: ['/api/user/all-progress'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch('/api/user/all-progress', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!supabase
  });

  const { data: enrollments = [] } = useQuery<any[]>({
    queryKey: ['/api/user/enrollments'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch('/api/user/enrollments', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!supabase,
    staleTime: 0
  });

  const { data: courseLessons = [] } = useQuery({
    queryKey: ['all-course-lessons'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, module_id, duration_sec, course_modules!inner(course_id)')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  const courseProgress = useMemo(() => {
    const progressMap = new Map<string, { completed: number; total: number; percentage: number; lastActivity?: Date; totalDurationSec: number }>();
    
    courses.forEach(course => {
      const lessons = courseLessons.filter((l: any) => 
        l.course_modules?.course_id === course.id
      );
      
      const totalLessons = lessons.length;
      
      const totalDurationSec = lessons.reduce((sum: number, lesson: any) => {
        return sum + (lesson.duration_sec || 0);
      }, 0);
      
      const completedLessons = allProgress.filter((p: any) => 
        p.is_completed && lessons.some((l: any) => l.id === p.lesson_id)
      );
      
      const courseLessonIds = lessons.map((l: any) => l.id);
      const courseProgressRecords = allProgress.filter((p: any) => 
        courseLessonIds.includes(p.lesson_id)
      );
      
      const lastActivity = courseProgressRecords.length > 0
        ? new Date(Math.max(...courseProgressRecords.map((p: any) => new Date(p.last_watched_at || p.updated_at).getTime())))
        : undefined;
      
      const completedCount = completedLessons.length;
      const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      
      progressMap.set(course.id, {
        completed: completedCount,
        total: totalLessons,
        percentage,
        lastActivity,
        totalDurationSec
      });
    });
    
    return progressMap;
  }, [courses, courseLessons, allProgress]);

  const filteredCourses = useMemo(() => {
    const activeCourses = courses.filter(c => c.is_active && c.visibility !== 'draft');
    
    if (activeTab === 'enrolled') {
      return activeCourses.filter(course => {
        const enrollment = enrollments.find((e: any) => e.course_id === course.id && e.status === 'active');
        const progress = courseProgress.get(course.id);
        return enrollment && progress && progress.percentage < 100;
      });
    } else if (activeTab === 'completed') {
      return activeCourses.filter(course => {
        const enrollment = enrollments.find((e: any) => e.course_id === course.id && e.status === 'active');
        const progress = courseProgress.get(course.id);
        return enrollment && progress && progress.percentage === 100;
      });
    }
    
    return activeCourses;
  }, [courses, activeTab, enrollments, courseProgress]);

  const enrolledCount = useMemo(() => {
    return courses.filter(course => {
      const enrollment = enrollments.find((e: any) => e.course_id === course.id && e.status === 'active');
      const progress = courseProgress.get(course.id);
      return enrollment && progress && progress.percentage < 100;
    }).length;
  }, [courses, enrollments, courseProgress]);

  const completedCount = useMemo(() => {
    return courses.filter(course => {
      const enrollment = enrollments.find((e: any) => e.course_id === course.id && e.status === 'active');
      const progress = courseProgress.get(course.id);
      return enrollment && progress && progress.percentage === 100;
    }).length;
  }, [courses, enrollments, courseProgress]);

  const handleViewCourse = (courseSlug: string) => {
    navigate(`/learning/courses/${courseSlug}`);
  };

  const headerProps = {
    title: "Cursos",
    icon: BookOpen,
    tabs: [],
    onTabChange: () => {},
    actions: []
  };

  if (coursesLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="p-8 text-center text-muted-foreground">
          Cargando cursos...
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        <Tabs
          tabs={[
            { value: 'all', label: 'Todos' },
            { value: 'enrolled', label: `Inscripto${enrolledCount > 0 ? ` (${enrolledCount})` : ''}` },
            { value: 'completed', label: `Finalizados${completedCount > 0 ? ` (${completedCount})` : ''}` }
          ]}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CourseTabFilter)}
        />

        {filteredCourses.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="No hay cursos disponibles"
            description={
              activeTab === 'enrolled' 
                ? "No estás inscripto en ningún curso actualmente" 
                : activeTab === 'completed'
                ? "Aún no has completado ningún curso"
                : "Actualmente no hay cursos activos para mostrar"
            }
            action={
              activeTab !== 'all' ? (
                <Button
                  variant="default"
                  onClick={() => setActiveTab('all')}
                  data-testid="button-view-all-courses"
                >
                  Ver todos los cursos
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourses.map(course => {
              const progress = courseProgress.get(course.id) || { completed: 0, total: 0, percentage: 0, totalDurationSec: 0 };
              const enrollment = enrollments.find((e: any) => e.course_id === course.id && e.status === 'active');
              const hasEnrollment = !!enrollment;
              
              const hours = Math.floor(progress.totalDurationSec / 3600);
              const minutes = Math.floor((progress.totalDurationSec % 3600) / 60);
              const durationText = hours > 0 
                ? `${hours}h ${minutes}m` 
                : `${minutes}m`;

              return (
                <Card 
                  key={course.id} 
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
                  data-testid={`course-card-${course.id}`}
                >
                  <div 
                    className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center cursor-pointer relative overflow-hidden"
                    onClick={() => hasEnrollment && handleViewCourse(course.slug)}
                  >
                    {course.cover_url ? (
                      <img 
                        src={course.cover_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-16 w-16 text-primary/20" />
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 
                      className="font-semibold text-base mb-3 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => hasEnrollment && handleViewCourse(course.slug)}
                      data-testid={`course-title-${course.id}`}
                    >
                      {course.title}
                    </h3>

                    <div className="space-y-1 mb-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{progress.total} {progress.total === 1 ? 'lección' : 'lecciones'}</span>
                      </div>
                      {progress.totalDurationSec > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{durationText} de contenido</span>
                        </div>
                      )}
                    </div>

                    {hasEnrollment && (
                      <div className="space-y-2 mb-4 mt-auto">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-semibold">{progress.percentage}%</span>
                        </div>
                        <Progress value={progress.percentage} className="h-2" />
                      </div>
                    )}

                    {hasEnrollment && progress.lastActivity && (
                      <div className="text-xs text-muted-foreground mb-3">
                        Última actividad: {format(progress.lastActivity, "dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                      </div>
                    )}

                    <div className={hasEnrollment ? '' : 'mt-auto'}>
                      {hasEnrollment ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleViewCourse(course.slug)}
                          className="w-full"
                          data-testid={`button-view-course-${course.id}`}
                        >
                          Ver curso
                        </Button>
                      ) : (
                        <PayButton
                          courseSlug={course.slug}
                          currency="ARS"
                          variant="default"
                          size="sm"
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
