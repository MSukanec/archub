import { useEffect, useMemo, useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'
import { GraduationCap, BookOpen, CheckCircle2, Clock, TrendingUp, Award, Flame } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import ProgressRing from '@/components/charts/courses/ProgressRing'
import MiniBar from '@/components/charts/courses/MiniBar'
import LineStreak from '@/components/charts/courses/LineStreak'
import {
  fetchGlobalProgress,
  fetchStudyTime,
  fetchActiveDays,
  fetchCourseProgress,
  fetchRecentActivity,
  type GlobalProgress,
  type StudyTime,
  type ActiveDay,
  type CourseProgressRow,
  type RecentActivityItem
} from '@/lib/supabase/training'

export default function LearningDashboard() {
  const { setSidebarContext, setSidebarLevel, sidebarLevel } = useNavigationStore()
  const { data: userData } = useCurrentUser()
  const [, navigate] = useLocation()

  const [global, setGlobal] = useState<GlobalProgress | null>(null)
  const [study, setStudy] = useState<StudyTime | null>(null)
  const [days, setDays] = useState<ActiveDay[]>([])
  const [courses, setCourses] = useState<CourseProgressRow[]>([])
  const [recent, setRecent] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSidebarContext('learning')
    if (sidebarLevel !== 'general') {
      setSidebarLevel('learning')
    }
  }, [setSidebarContext, setSidebarLevel, sidebarLevel])

  useEffect(() => {
    if (!userData?.user?.id) return

    const userId = userData.user.id

    ;(async () => {
      setLoading(true)
      try {
        const [g, s, d, cp, ra] = await Promise.all([
          fetchGlobalProgress(userId),
          fetchStudyTime(userId),
          fetchActiveDays(userId, 60),
          fetchCourseProgress(userId),
          fetchRecentActivity(userId, 8),
        ])
        setGlobal(g)
        setStudy(s)
        setDays(d)
        setCourses(cp)
        setRecent(ra)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [userData])

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
      .filter(c => c.progress_pct > 0 && c.progress_pct < 100)
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

  if (loading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <div className="space-y-4">
                      <Skeleton className="h-28 w-full" />
                      <Skeleton className="h-28 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
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
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 66% - Main Progress Card */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  Progreso General de Aprendizaje
                </CardTitle>
                <CardDescription data-testid="text-lessons-completed">
                  {global.done_lessons_total}/{global.total_lessons_total} lecciones completadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progress Ring */}
                  <div className="flex items-center justify-center">
                    <ProgressRing value={global.progress_pct} />
                  </div>

                  {/* Charts Column */}
                  <div className="space-y-6">
                    {/* Study Time Chart */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Horas de Estudio
                        </span>
                      </div>
                      <MiniBar data={hoursData} />
                    </div>

                    {/* Streak Chart */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Racha (30 días)
                        </span>
                      </div>
                      <LineStreak data={streakSeries} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 33% - Stats Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  Cursos Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold" style={{ color: 'var(--accent)' }} data-testid="text-active-courses-count">
                  {courses.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cursos en los que estás inscrito
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flame className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  Racha Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold" style={{ color: 'var(--accent)' }} data-testid="text-current-streak">
                  {currentStreak}
                </div>
                <p className="text-xs text-muted-foreground mt-1" data-testid="text-streak-label">
                  {currentStreak === 1 ? 'día consecutivo' : 'días consecutivos'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Courses in Progress */}
        {coursesSorted.length > 0 && (
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
              {coursesSorted.map((course) => (
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
                    </div>
                  </div>
                  <Progress value={course.progress_pct} className="h-2" data-testid="progress-bar-course" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recent.length > 0 && (
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
              <div className="space-y-3">
                {recent.map((item, index) => (
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
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
