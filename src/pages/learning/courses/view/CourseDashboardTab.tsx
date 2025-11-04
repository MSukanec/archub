import { useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/ui/stat-card'
import { BookOpen, CheckCircle, Clock, FileText, Bookmark, Megaphone, Info, PlayCircle, Play } from 'lucide-react'
import { DiscordWidget } from '@/components/learning/DiscordWidget'
import { useLocation, useParams } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCoursePlayerStore } from '@/stores/coursePlayerStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'

interface CourseDashboardTabProps {
  courseId?: string;
}

export default function CourseDashboardTab({ courseId }: CourseDashboardTabProps) {
  const [, navigate] = useLocation();
  const { id: courseSlug } = useParams<{ id: string }>();
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const setActiveTab = useCoursePlayerStore(s => s.setActiveTab);

  // Handler to navigate to a specific tab
  const navigateToTab = (tab: string) => {
    if (courseSlug) {
      // Update store first to trigger tab change
      setActiveTab(tab as any);
      // Then update URL for deep linking
      navigate(`/learning/courses/${courseSlug}?tab=${encodeURIComponent(tab)}`);
    }
  };

  // Invalidate queries when dashboard mounts to ensure fresh data
  useEffect(() => {
    if (courseId) {
      queryClient.invalidateQueries({ queryKey: ['course-progress', courseId] });
      queryClient.invalidateQueries({ queryKey: ['study-time', courseId] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/recent-notes`] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/recent-markers`] });
      queryClient.invalidateQueries({ queryKey: ['course-duration', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', courseId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-study-time'] });
    }
  }, [courseId]);

  // Get course progress using backend endpoint (avoids RLS issues with views)
  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(`/api/user/course-progress?course_id=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      // Backend returns array, we need single object
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!courseId && !!supabase
  });

  // Get total study time
  const { data: studyTime } = useQuery({
    queryKey: ['study-time', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return { total_seconds: 0 };
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { total_seconds: 0 };

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return { total_seconds: 0 };

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return { total_seconds: 0 };

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return { total_seconds: 0 };

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return { total_seconds: 0 };

      const lessonIds = courseLessons.map(l => l.id);

      // Get sum of last_position_sec for all lessons in this course
      const { data: progressData, error } = await supabase
        .from('course_lesson_progress')
        .select('last_position_sec')
        .eq('user_id', userRecord.id)
        .in('lesson_id', lessonIds);

      if (error) {
        return { total_seconds: 0 };
      }

      const totalSeconds = progressData?.reduce((sum, p) => sum + (p.last_position_sec || 0), 0) || 0;
      
      return { total_seconds: totalSeconds };
    },
    enabled: !!courseId && !!supabase
  });

  // Get latest 3 notes (OPTIMIZED with backend endpoint)
  const { data: recentNotes = [] } = useQuery({
    queryKey: [`/api/courses/${courseId}/recent-notes`],
    enabled: !!courseId
  });

  // Get latest 3 markers (OPTIMIZED with backend endpoint)
  const { data: recentMarkers = [] } = useQuery({
    queryKey: [`/api/courses/${courseId}/recent-markers`],
    enabled: !!courseId
  });

  // Get total course duration (sum of all lesson durations)
  const { data: courseDuration } = useQuery({
    queryKey: ['course-duration', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return { total_seconds: 0 };
      
      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return { total_seconds: 0 };

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules with their durations
      const { data: courseLessons, error } = await supabase
        .from('course_lessons')
        .select('duration_sec')
        .in('module_id', moduleIds);

      if (error) {
        return { total_seconds: 0 };
      }

      if (!courseLessons || courseLessons.length === 0) return { total_seconds: 0 };

      const totalSeconds = courseLessons.reduce((sum, lesson) => sum + (lesson.duration_sec || 0), 0);
      
      return { total_seconds: totalSeconds };
    },
    enabled: !!courseId && !!supabase
  });

  // Get user's enrollment for this course
  const { data: enrollment } = useQuery({
    queryKey: ['course-enrollment', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return null;

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return null;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('started_at, expires_at, status')
        .eq('course_id', courseId)
        .eq('user_id', userRecord.id)
        .maybeSingle();

      if (error) {
        return null;
      }

      return data;
    },
    enabled: !!courseId && !!supabase
  });

  // Get last lesson in progress (for "Continue watching" card)
  const { data: lastLesson } = useQuery({
    queryKey: ['last-lesson-progress', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return null;

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return null;

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return null;

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return null;

      const lessonIds = courseLessons.map(l => l.id);

      // Get the most recent lesson in progress (not completed) or the most recently updated
      const { data: progressData, error } = await supabase
        .from('course_lesson_progress')
        .select(`
          lesson_id,
          last_position_sec,
          is_completed,
          updated_at,
          course_lessons (
            id,
            title,
            duration_sec
          )
        `)
        .eq('user_id', userRecord.id)
        .in('lesson_id', lessonIds)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        return null;
      }

      if (!progressData || progressData.length === 0) return null;

      // Find first lesson that's not completed
      const inProgressLesson = progressData.find(p => !p.is_completed);
      
      // If no lesson in progress, return the most recently updated one
      const selectedLesson = inProgressLesson || progressData[0];

      const lessonData = Array.isArray(selectedLesson.course_lessons) 
        ? selectedLesson.course_lessons[0] 
        : selectedLesson.course_lessons;

      return {
        lesson_id: selectedLesson.lesson_id,
        lesson_title: lessonData?.title || 'Sin título',
        last_position_sec: selectedLesson.last_position_sec || 0,
        duration_sec: lessonData?.duration_sec || 0,
        is_completed: selectedLesson.is_completed
      };
    },
    enabled: !!courseId && !!supabase,
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000 // Auto refresh every 15s
  });

  // Get user's study time using backend endpoint (avoids RLS issues with views)
  const { data: monthlyStudyTime } = useQuery({
    queryKey: ['monthly-study-time'],
    queryFn: async () => {
      if (!supabase) return { seconds_this_month: 0 };
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { seconds_this_month: 0 };

      const response = await fetch('/api/user/study-time', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        return { seconds_this_month: 0 };
      }

      const data = await response.json();
      return { seconds_this_month: data?.seconds_this_month || 0 };
    },
    enabled: !!supabase
  });

  // Calculate stats
  const stats = useMemo(() => {
    const progressPct = courseProgress?.progress_pct || 0;
    const doneLessons = courseProgress?.done_lessons || 0;
    const totalLessons = courseProgress?.total_lessons || 0;
    const totalSeconds = studyTime?.total_seconds || 0;
    const courseTotalSeconds = courseDuration?.total_seconds || 0;
    const monthSeconds = monthlyStudyTime?.seconds_this_month || 0;
    
    // Format study time (user's time spent)
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    let studyTimeFormatted = '';
    if (hours > 0) {
      studyTimeFormatted = `${hours} HS ${minutes} MIN`;
    } else if (minutes > 0) {
      studyTimeFormatted = `${minutes} MIN`;
    } else {
      studyTimeFormatted = `0 MIN`;
    }

    // Format course total duration
    const courseHours = Math.floor(courseTotalSeconds / 3600);
    const courseMinutes = Math.floor((courseTotalSeconds % 3600) / 60);
    
    let courseDurationFormatted = '';
    if (courseHours > 0) {
      courseDurationFormatted = `${courseHours} hs ${courseMinutes} min de contenido`;
    } else if (courseMinutes > 0) {
      courseDurationFormatted = `${courseMinutes} min de contenido`;
    } else {
      courseDurationFormatted = `sin contenido`;
    }

    // Format this month study time
    const monthHours = Math.floor(monthSeconds / 3600);
    const monthMinutes = Math.floor((monthSeconds % 3600) / 60);
    
    let monthTimeFormatted = '';
    if (monthHours > 0) {
      monthTimeFormatted = `${monthHours} HS`;
    } else if (monthMinutes > 0) {
      monthTimeFormatted = `${monthMinutes} MIN`;
    } else {
      monthTimeFormatted = `0 HS`;
    }

    // Calculate subscription days remaining
    let daysRemaining = 0;
    let totalDays = 0;
    let isUnlimited = false;
    
    if (enrollment?.expires_at) {
      const now = new Date();
      const expiresAt = new Date(enrollment.expires_at);
      const startedAt = new Date(enrollment.started_at);
      
      // Calculate days remaining
      const msRemaining = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      
      // Calculate total days (started to expires)
      const msTotal = expiresAt.getTime() - startedAt.getTime();
      totalDays = Math.ceil(msTotal / (1000 * 60 * 60 * 24));
    } else {
      // No expiration date = unlimited access
      isUnlimited = true;
    }

    let subscriptionFormatted = '';
    if (daysRemaining > 0) {
      subscriptionFormatted = `${daysRemaining} ${daysRemaining === 1 ? 'DÍA' : 'DÍAS'}`;
    } else if (isUnlimited) {
      subscriptionFormatted = '-';
    } else {
      subscriptionFormatted = 'EXPIRADO';
    }

    let subscriptionMetaFormatted = '';
    if (isUnlimited) {
      subscriptionMetaFormatted = 'acceso sin límite de tiempo';
    } else if (totalDays > 0) {
      subscriptionMetaFormatted = `de ${totalDays} días totales`;
    } else {
      subscriptionMetaFormatted = 'suscripción vencida';
    }

    return {
      progressPct: Number(progressPct).toFixed(1),
      doneLessons,
      totalLessons,
      studyTimeFormatted,
      courseDurationFormatted,
      monthTimeFormatted,
      subscriptionFormatted,
      subscriptionMetaFormatted
    };
  }, [courseProgress, studyTime, courseDuration, enrollment, monthlyStudyTime]);

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Continue Watching and Discord Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Continue Watching Card - 3 columns */}
        {lastLesson && (
          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-lg transition-all duration-200 lg:col-span-3">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Continuar viendo
                  </p>
                  <h3 className="font-semibold text-base mb-1 text-foreground">
                    {lastLesson.lesson_title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {Math.floor(lastLesson.last_position_sec / 60)}:{String(Math.floor(lastLesson.last_position_sec % 60)).padStart(2, '0')} / {Math.floor(lastLesson.duration_sec / 60)}:{String(Math.floor(lastLesson.duration_sec % 60)).padStart(2, '0')}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-muted/30 rounded-full h-1.5">
                    <div 
                      className="bg-accent h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${lastLesson.duration_sec > 0 ? (lastLesson.last_position_sec / lastLesson.duration_sec) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => goToLesson(lastLesson.lesson_id, lastLesson.last_position_sec)}
                  className="flex-shrink-0"
                  data-testid="button-continue-watching"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discord Widget - 1 column */}
        <div className="lg:col-span-1">
          <DiscordWidget />
        </div>
      </div>

      {/* Top Row - Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscription Days Card - No clickeable */}
        <StatCard>
          <StatCardTitle showArrow={false}>Tiempo Restante</StatCardTitle>
          <StatCardValue>{stats.subscriptionFormatted}</StatCardValue>
          <StatCardMeta>{stats.subscriptionMetaFormatted}</StatCardMeta>
        </StatCard>

        {/* Progress Card - No clickeable */}
        <StatCard>
          <StatCardTitle showArrow={false}>Progreso Total</StatCardTitle>
          <StatCardValue>{stats.progressPct}%</StatCardValue>
          <StatCardMeta>
            {stats.doneLessons} de {stats.totalLessons} lecciones
          </StatCardMeta>
        </StatCard>

        {/* Study Time Card - No clickeable */}
        <StatCard>
          <StatCardTitle showArrow={false}>Tiempo de Estudio</StatCardTitle>
          <StatCardValue>{stats.studyTimeFormatted}</StatCardValue>
          <StatCardMeta>{stats.courseDurationFormatted}</StatCardMeta>
        </StatCard>

        {/* This Month Study Time Card - No clickeable */}
        <StatCard>
          <StatCardTitle showArrow={false}>Este Mes</StatCardTitle>
          <StatCardValue>{stats.monthTimeFormatted}</StatCardValue>
          <StatCardMeta>dedicadas en total</StatCardMeta>
        </StatCard>
      </div>

      {/* Second Row - Notes and Markers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Notes Card - Navega a Apuntes */}
        <StatCard onCardClick={() => navigateToTab('Apuntes')}>
          <StatCardTitle>Apuntes Creados</StatCardTitle>
          <StatCardContent className={recentNotes.length === 0 ? "mt-2" : "mt-4"}>
            {recentNotes.length === 0 ? (
              <EmptyState
                  icon={<FileText />}
                  title="No hay apuntes aún"
                  description="Comienza a tomar apuntes durante tus lecciones"
                  action={
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToTab('Reproductor');
                      }}
                      data-testid="button-go-to-lessons-notes"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ir a Reproductor
                    </Button>
                  }
                  className="min-h-0 md:min-h-0"
                />
            ) : (
              <>
                <div className="space-y-2">
                  {recentNotes.map((note: any) => (
                    <div 
                      key={note.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (note.lesson_id) {
                          goToLesson(note.lesson_id, null);
                        }
                      }}
                      className="group/item flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-transparent hover:bg-accent/5 hover:border-accent/50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
                        <FileText className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground group-hover/item:text-accent transition-colors truncate">
                            {note.course_lessons?.title || 'Sin título'}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(note.created_at), 'dd/MM/yy', { locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {note.body?.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigateToTab('Apuntes');
                    }}
                    className="text-xs text-accent hover:underline"
                    data-testid="link-view-all-notes"
                  >
                    Ver todos los apuntes
                  </button>
                </div>
              </>
            )}
          </StatCardContent>
        </StatCard>

        {/* Markers Card - Navega a Marcadores */}
        <StatCard onCardClick={() => navigateToTab('Marcadores')}>
          <StatCardTitle>Marcadores Creados</StatCardTitle>
          <StatCardContent className={recentMarkers.length === 0 ? "mt-2" : "mt-4"}>
            {recentMarkers.length === 0 ? (
              <EmptyState
                  icon={<Bookmark />}
                  title="No hay marcadores aún"
                  description="Crea marcadores en momentos clave de tus lecciones"
                  action={
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToTab('Reproductor');
                      }}
                      data-testid="button-go-to-lessons-markers"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ir a Reproductor
                    </Button>
                  }
                  className="min-h-0 md:min-h-0"
                />
            ) : (
              <>
                <div className="space-y-2">
                  {recentMarkers.map((marker: any) => (
                    <div 
                      key={marker.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (marker.lesson_id) {
                          goToLesson(marker.lesson_id, marker.time_sec || null);
                        }
                      }}
                      className="group/item flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-transparent hover:bg-accent/5 hover:border-accent/50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
                        <Bookmark className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground group-hover/item:text-accent transition-colors truncate">
                            {marker.lesson_info?.title || 'Sin título'}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(marker.created_at), 'dd/MM/yy', { locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {marker.body?.substring(0, 60) || 'Sin descripción'}...
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigateToTab('Marcadores');
                    }}
                    className="text-xs text-accent hover:underline"
                    data-testid="link-view-all-markers"
                  >
                    Ver todos los marcadores
                  </button>
                </div>
              </>
            )}
          </StatCardContent>
        </StatCard>
      </div>
    </div>
  )
}
