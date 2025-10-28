import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card'
import { BookOpen, CheckCircle, Clock, FileText, Bookmark, Megaphone, Info } from 'lucide-react'
import { DiscordWidget } from '@/components/learning/DiscordWidget'
import { useLocation, useParams } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CourseDashboardTabProps {
  courseId?: string;
}

export default function CourseDashboardTab({ courseId }: CourseDashboardTabProps) {
  const [, navigate] = useLocation();
  const { id: courseSlug } = useParams<{ id: string }>();

  // Handler to navigate to a specific tab
  const navigateToTab = (tab: string) => {
    if (courseSlug) {
      navigate(`/learning/courses/${courseSlug}?tab=${encodeURIComponent(tab)}`);
    }
  };

  // Get course progress using the v_course_progress view
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
        .from('v_course_progress')
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

  // Get user's study time this month from v_user_study_time
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
        .from('v_user_study_time')
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
      {/* Instructor Announcement Card */}
      <Card className="border-accent/20 bg-accent/5">
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

      {/* Top Row - Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Subscription Days Card - No clickeable */}
        <StatCard>
          <StatCardTitle showArrow={false}>Tiempo Restante</StatCardTitle>
          <StatCardValue>{stats.subscriptionFormatted}</StatCardValue>
          <StatCardMeta>{stats.subscriptionMetaFormatted}</StatCardMeta>
        </StatCard>

        {/* Progress Card - Navega a Lecciones */}
        <StatCard onCardClick={() => navigateToTab('Lecciones')}>
          <StatCardTitle>Progreso Total</StatCardTitle>
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

      {/* Second Row - Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Notes Card - Navega a Apuntes */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => navigateToTab('Apuntes')}
        >
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Apuntes Creados
            </h3>
            {recentNotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay apuntes aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map((note: any) => (
                  <div 
                    key={note.id} 
                    className="p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-foreground truncate">
                      {note.course_lessons?.title || 'Sin título'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {note.body?.substring(0, 60)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Markers Card - Navega a Marcadores */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-border"
          onClick={() => navigateToTab('Marcadores')}
        >
          <CardContent className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Marcadores Creados
            </h3>
            {recentMarkers.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No hay marcadores aún</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentMarkers.map((marker: any) => (
                  <div 
                    key={marker.id} 
                    className="p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-xs font-medium text-foreground truncate">
                      {marker.course_lessons?.title || 'Sin título'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {marker.body?.substring(0, 60) || 'Sin descripción'}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discord Widget */}
        <div>
          <DiscordWidget />
        </div>
      </div>
    </div>
  )
}
