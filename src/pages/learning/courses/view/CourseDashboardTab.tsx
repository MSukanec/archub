import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/ui/stat-card'
import { BookOpen, CheckCircle, Clock, FileText, Bookmark, Megaphone, Info, PlayCircle } from 'lucide-react'
import { DiscordWidget } from '@/components/learning/DiscordWidget'
import { useLocation, useParams } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCoursePlayerStore } from '@/stores/coursePlayerStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ProgressChart } from '@/components/charts/courses/ProgressChart'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'

interface CourseDashboardTabProps {
  courseId?: string;
}

type Period = 'Semana' | 'Mes' | 'Trimestre' | 'Año';

export default function CourseDashboardTab({ courseId }: CourseDashboardTabProps) {
  const [, navigate] = useLocation();
  const { id: courseSlug } = useParams<{ id: string }>();
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const setActiveTab = useCoursePlayerStore(s => s.setActiveTab);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('Mes');

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
      queryClient.invalidateQueries({ queryKey: ['recent-notes', courseId] });
      queryClient.invalidateQueries({ queryKey: ['recent-markers', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-duration', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-enrollment', courseId] });
      queryClient.invalidateQueries({ queryKey: ['progress-history', courseId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-study-time'] });
    }
  }, [courseId]);

  // Get course progress using the course_progress_view
  const { data: courseProgress } = useQuery({
    queryKey: ['course-progress', courseId],
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
        .from('course_progress_view')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', userRecord.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching course progress:', error);
        return null;
      }

      return data;
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
        console.error('Error fetching study time:', error);
        return { total_seconds: 0 };
      }

      const totalSeconds = progressData?.reduce((sum, p) => sum + (p.last_position_sec || 0), 0) || 0;
      
      return { total_seconds: totalSeconds };
    },
    enabled: !!courseId && !!supabase
  });

  // Get latest 3 notes
  const { data: recentNotes = [] } = useQuery({
    queryKey: ['recent-notes', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return [];

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return [];

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return [];

      const lessonIds = courseLessons.map(l => l.id);

      // Get latest 3 notes with lesson info
      const { data, error } = await supabase
        .from('course_lesson_notes')
        .select(`
          id,
          body,
          lesson_id,
          created_at,
          course_lessons (
            title
          )
        `)
        .eq('user_id', userRecord.id)
        .eq('note_type', 'summary')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recent notes:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  // Get latest 3 markers
  const { data: recentMarkers = [] } = useQuery({
    queryKey: ['recent-markers', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return [];

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return [];

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return [];

      const lessonIds = courseLessons.map(l => l.id);

      // Get latest 3 markers with lesson info
      const { data, error } = await supabase
        .from('course_lesson_notes')
        .select(`
          id,
          body,
          lesson_id,
          time_sec,
          created_at,
          course_lessons (
            title
          )
        `)
        .eq('user_id', userRecord.id)
        .eq('note_type', 'marker')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching recent markers:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!courseId && !!supabase
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
        console.error('Error fetching course duration:', error);
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
        console.error('Error fetching enrollment:', error);
        return null;
      }

      return data;
    },
    enabled: !!courseId && !!supabase
  });

  // Get lesson progress history for chart
  const { data: progressHistory = [] } = useQuery({
    queryKey: ['progress-history', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return [];

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return [];

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return [];

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return [];

      const lessonIds = courseLessons.map(l => l.id);

      // Get all progress records for these lessons
      const { data, error } = await supabase
        .from('course_lesson_progress')
        .select('updated_at, last_position_sec, is_completed')
        .eq('user_id', userRecord.id)
        .in('lesson_id', lessonIds)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching progress history:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  // Get user's study time this month from user_study_time_view
  const { data: monthlyStudyTime } = useQuery({
    queryKey: ['monthly-study-time'],
    queryFn: async () => {
      if (!supabase) return { seconds_this_month: 0 };
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { seconds_this_month: 0 };

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return { seconds_this_month: 0 };

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return { seconds_this_month: 0 };

      const { data, error } = await supabase
        .from('user_study_time_view')
        .select('seconds_this_month')
        .eq('user_id', userRecord.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching monthly study time:', error);
        return { seconds_this_month: 0 };
      }

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
      subscriptionFormatted = 'ILIMITADO';
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
      {/* Announcements and Discord Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Instructor Announcement Card - 3 columns */}
        <Card className="border-accent/20 bg-accent/5 lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Megaphone className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Anuncios del Instructor</h3>
                <p className="text-sm text-muted-foreground">
                  No hay anuncios en este momento
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discord Widget - 1 column */}
        <div className="lg:col-span-1">
          <DiscordWidget />
        </div>
      </div>

      {/* Progress Chart */}
      <div className="relative group">
        {/* Header */}
        <div className="flex flex-row items-start justify-between mb-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wide">
              Progreso
            </p>
          </div>
          
          {/* Period selector buttons */}
          <div className="flex items-center gap-2">
            {(['Semana', 'Mes', 'Trimestre', 'Año'] as Period[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[hsl(var(--accent-hsl))] text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`button-period-${period.toLowerCase()}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        {/* Gráfico */}
        <ProgressChart progressData={progressHistory} selectedPeriod={selectedPeriod} />
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
          <StatCardContent>
            {recentNotes.length === 0 ? (
              <div className="py-4">
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
                        navigateToTab('Lecciones');
                      }}
                      data-testid="button-go-to-lessons-notes"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ir a Lecciones
                    </Button>
                  }
                  className="min-h-0 md:min-h-0"
                />
              </div>
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
          <StatCardContent>
            {recentMarkers.length === 0 ? (
              <div className="py-4">
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
                        navigateToTab('Lecciones');
                      }}
                      data-testid="button-go-to-lessons-markers"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ir a Lecciones
                    </Button>
                  }
                  className="min-h-0 md:min-h-0"
                />
              </div>
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
                            {marker.course_lessons?.title || 'Sin título'}
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
