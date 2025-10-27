import { useEffect, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, BookOpen, Clock, TrendingUp, Award, Flame, CheckCircle2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  // Fetch all dashboard data from the server
  const { data: dashboardData, isLoading } = useQuery<any>({
    queryKey: ['/api/learning/dashboard'],
    queryFn: async () => {
      if (!supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch('/api/learning/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch dashboard data:', await response.text());
        return null;
      }
      
      const data = await response.json();
      console.log('📊 Dashboard data received:', data);
      return data;
    },
    enabled: !!supabase && !!userData
  });

  // Calculate derived data
  const { enrollments = [], progress = [], courseLessons = [], recentCompletions = [] } = dashboardData || {}

  // Calculate global progress from enrollments and progress
  const global = useMemo(() => {
    if (!enrollments.length) return null;
    
    const courseIds = enrollments.map((e: any) => e.course_id);
    const relevantLessons = courseLessons.filter((l: any) => 
      courseIds.includes(l.course_modules?.course_id)
    );
    const total_lessons_total = relevantLessons.length;
    const done_lessons_total = progress.filter((p: any) => 
      p.is_completed && relevantLessons.some((l: any) => l.id === p.lesson_id)
    ).length;
    const progress_pct = total_lessons_total > 0 
      ? Math.round((done_lessons_total / total_lessons_total) * 100) 
      : 0;
    
    return { done_lessons_total, total_lessons_total, progress_pct };
  }, [enrollments, courseLessons, progress]);

  // Calculate course progress
  const courses = useMemo(() => {
    return enrollments.map((enrollment: any) => {
      const courseId = enrollment.course_id;
      const lessons = courseLessons.filter((l: any) => 
        l.course_modules?.course_id === courseId
      );
      const total_lessons = lessons.length;
      const done_lessons = progress.filter((p: any) => 
        p.is_completed && lessons.some((l: any) => l.id === p.lesson_id)
      ).length;
      const progress_pct = total_lessons > 0 
        ? Math.round((done_lessons / total_lessons) * 100) 
        : 0;
      
      return {
        course_id: courseId,
        course_title: enrollment.courses?.title || 'Sin título',
        course_slug: enrollment.course_slug || '',
        progress_pct,
        done_lessons,
        total_lessons
      };
    });
  }, [enrollments, courseLessons, progress]);

  // Calculate study time from progress data
  const study = useMemo(() => {
    if (!progress.length) return { seconds_lifetime: 0, seconds_this_month: 0 };
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let seconds_lifetime = 0;
    let seconds_this_month = 0;
    
    progress.forEach((p: any) => {
      const lastPos = p.last_position_sec || 0;
      seconds_lifetime += lastPos;
      
      const updateDate = new Date(p.updated_at);
      if (updateDate >= startOfMonth) {
        seconds_this_month += lastPos;
      }
    });
    
    return { seconds_lifetime, seconds_this_month };
  }, [progress]);

  // Calculate active days from progress data
  const days = useMemo(() => {
    const cutoffDate = new Date(Date.now() - 60 * 86400000);
    const daysSet = new Set<string>();
    
    progress.forEach((p: any) => {
      const updateDate = new Date(p.updated_at);
      if (updateDate >= cutoffDate) {
        const day = updateDate.toISOString().slice(0, 10);
        daysSet.add(day);
      }
    });
    
    return Array.from(daysSet).map(day => ({ day }));
  }, [progress]);

  const recent = recentCompletions || [];

  const hoursData = useMemo(() => ([
    { name: 'Mes', value: Math.round((study?.seconds_this_month ?? 0) / 3600) },
    { name: 'Total', value: Math.round((study?.seconds_lifetime ?? 0) / 3600) }
  ]), [study])

  const streakSeries = useMemo(() => {
    const set = new Set(days.map(d => d.day))
    const last30: { day: string; active: number }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(today.getTime() - i * 86400000)
      const key = dt.toISOString().slice(0, 10)
      last30.push({ day: key, active: set.has(key) ? 1 : 0 })
    }
    return last30
  }, [days])

  const coursesSorted = useMemo(() => {
    return [...courses]
      .filter(c => c.progress_pct >= 0 && c.progress_pct < 100)
      .sort((a, b) => b.progress_pct - a.progress_pct)
      .slice(0, 3)
  }, [courses])

  const currentStreak = useMemo(() => {
    const sorted = [...days].sort((a, b) => b.day.localeCompare(a.day))
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)
    
    for (let i = 0; i < sorted.length; i++) {
      const expectedDate = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      if (sorted[i]?.day === expectedDate) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [days])

  const headerProps = {
    title: "Dashboard de Capacitaciones",
    icon: GraduationCap,
  }

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
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
        {/* Main Dashboard Grid - 4 equal cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Card 1: Progress Ring */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Progreso General
              </CardTitle>
              <CardDescription data-testid="text-lessons-completed">
                {global.done_lessons_total}/{global.total_lessons_total} lecciones
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <ProgressRing value={global.progress_pct} />
            </CardContent>
          </Card>

          {/* Card 2: Study Hours */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Horas de Estudio
              </CardTitle>
              <CardDescription>
                Este mes y total
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <MiniBar data={hoursData} />
            </CardContent>
          </Card>

          {/* Card 3: Activity Streak */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Racha de Actividad
              </CardTitle>
              <CardDescription>
                Últimos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              <LineStreak data={streakSeries} />
            </CardContent>
          </Card>

          {/* Card 4: Active Courses & Current Streak */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                Cursos Activos
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div>
                <div className="text-4xl font-bold" style={{ color: 'var(--accent)' }} data-testid="text-active-courses-count">
                  {courses.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cursos en los que estás inscrito
                </p>
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
            </CardContent>
          </Card>
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
            {recent.length > 0 ? (
              <div className="space-y-3">
                {recent.map((item: any, index: number) => (
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
