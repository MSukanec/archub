import { useEffect, useMemo } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { GraduationCap, BookOpen, CheckCircle2, Clock, TrendingUp, Award } from 'lucide-react';
import { useCourses } from '@/hooks/use-courses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function LearningDashboard() {
  const { setSidebarContext, setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();

  useEffect(() => {
    setSidebarContext('learning');
    setSidebarLevel('learning');
  }, [setSidebarContext, setSidebarLevel]);

  const { data: courses = [], isLoading: coursesLoading } = useCourses();

  // Get all progress for the current user
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

  // Get enrollments
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
    enabled: !!supabase
  });

  // Get lessons count per course
  const { data: courseLessons = [] } = useQuery({
    queryKey: ['all-course-lessons'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, module_id, course_modules!inner(course_id)')
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!supabase
  });

  // Calculate overall statistics
  const stats = useMemo(() => {
    const enrolledCourses = enrollments.length;
    const totalLessons = courseLessons.length;
    const completedLessons = allProgress.filter((p: any) => p.is_completed).length;
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Calculate courses with progress
    const coursesInProgress = courses.filter(course => {
      const lessons = courseLessons.filter((l: any) => 
        l.course_modules?.course_id === course.id
      );
      const completed = allProgress.filter((p: any) => 
        p.is_completed && lessons.some((l: any) => l.id === p.lesson_id)
      );
      return completed.length > 0 && completed.length < lessons.length;
    }).length;

    return {
      enrolledCourses,
      totalLessons,
      completedLessons,
      overallProgress,
      coursesInProgress
    };
  }, [enrollments, courseLessons, allProgress, courses]);

  // Get courses with progress details
  const coursesWithProgress = useMemo(() => {
    return courses.map(course => {
      const lessons = courseLessons.filter((l: any) => 
        l.course_modules?.course_id === course.id
      );
      const completed = allProgress.filter((p: any) => 
        p.is_completed && lessons.some((l: any) => l.id === p.lesson_id)
      );
      const percentage = lessons.length > 0 ? Math.round((completed.length / lessons.length) * 100) : 0;
      const enrollment = enrollments.find((e: any) => e.course_id === course.id);

      return {
        ...course,
        totalLessons: lessons.length,
        completedLessons: completed.length,
        percentage,
        isEnrolled: !!enrollment
      };
    }).filter(c => c.isEnrolled && c.percentage < 100).sort((a, b) => b.percentage - a.percentage);
  }, [courses, courseLessons, allProgress, enrollments]);

  // Get recently completed lessons
  const recentCompletions = useMemo(() => {
    return allProgress
      .filter((p: any) => p.is_completed && p.completed_at)
      .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
      .slice(0, 5);
  }, [allProgress]);

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  };

  if (coursesLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="p-8 text-center text-muted-foreground">
          Cargando dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Overall Progress Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Progreso General de Aprendizaje
            </CardTitle>
            <CardDescription>
              {stats.overallProgress}% de todas las lecciones completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">0%</span>
                <span className="font-bold text-lg">{stats.overallProgress}%</span>
                <span className="text-muted-foreground">100%</span>
              </div>
              <Progress value={stats.overallProgress} className="h-4" />
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">{stats.completedLessons}</div>
                  <div className="text-xs text-muted-foreground">Lecciones completadas</div>
                </div>
                <div className="text-center border-x">
                  <div className="text-3xl font-bold">{stats.totalLessons}</div>
                  <div className="text-xs text-muted-foreground">Total de lecciones</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">{stats.enrolledCourses}</div>
                  <div className="text-xs text-muted-foreground">Cursos inscritos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos Inscritos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enrolledCourses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de cursos disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos en Progreso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.coursesInProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Cursos iniciados pero no completados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lecciones Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedLessons}</div>
              <p className="text-xs text-muted-foreground mt-1">
                De {stats.totalLessons} lecciones totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Courses in Progress */}
        {coursesWithProgress.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Cursos en Progreso
              </CardTitle>
              <CardDescription>
                Continúa tu aprendizaje donde lo dejaste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {coursesWithProgress.slice(0, 3).map((course) => (
                <div key={course.id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {course.completedLessons} de {course.totalLessons} lecciones completadas
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/learning/courses/${course.id}`)}
                      data-testid={`button-continue-course-${course.id}`}
                    >
                      Continuar
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={course.percentage} className="h-2 flex-1" />
                    <span className="text-sm font-medium min-w-[45px] text-right">
                      {course.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentCompletions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Últimas lecciones completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCompletions.map((completion: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">Lección completada</div>
                      <div className="text-xs text-muted-foreground">
                        {completion.completed_at && format(new Date(completion.completed_at), "d 'de' MMMM, HH:mm", { locale: es })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {completion.progress_pct}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {stats.enrolledCourses === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comienza tu Aprendizaje</h3>
                <p className="text-muted-foreground mb-6">
                  Aún no estás inscrito en ningún curso. Explora los cursos disponibles y comienza a aprender.
                </p>
                <Button 
                  onClick={() => navigate('/learning/courses')}
                  data-testid="button-browse-courses"
                >
                  Explorar Cursos
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
