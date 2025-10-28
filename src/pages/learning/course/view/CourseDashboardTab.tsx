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

  // Get total notes count
  const { data: notesCount } = useQuery({
    queryKey: ['notes-count', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return 0;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 0;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return 0;

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return 0;

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return 0;

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return 0;

      const lessonIds = courseLessons.map(l => l.id);

      // Count all notes for these lessons
      const { count, error } = await supabase
        .from('course_lesson_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userRecord.id)
        .eq('note_type', 'summary')
        .in('lesson_id', lessonIds);

      if (error) {
        console.error('Error fetching notes count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: !!courseId && !!supabase
  });

  // Get total markers count
  const { data: markersCount } = useQuery({
    queryKey: ['markers-count', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return 0;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return 0;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.email) return 0;

      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();

      if (!userRecord) return 0;

      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);

      if (!courseModules || courseModules.length === 0) return 0;

      const moduleIds = courseModules.map(m => m.id);

      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);

      if (!courseLessons || courseLessons.length === 0) return 0;

      const lessonIds = courseLessons.map(l => l.id);

      // Count all markers for these lessons
      const { count, error } = await supabase
        .from('course_lesson_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userRecord.id)
        .eq('note_type', 'marker')
        .in('lesson_id', lessonIds);

      if (error) {
        console.error('Error fetching markers count:', error);
        return 0;
      }

      return count || 0;
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

  // Calculate stats
  const stats = useMemo(() => {
    const progressPct = courseProgress?.progress_pct || 0;
    const doneLessons = courseProgress?.done_lessons || 0;
    const totalLessons = courseProgress?.total_lessons || 0;
    const totalSeconds = studyTime?.total_seconds || 0;
    const courseTotalSeconds = courseDuration?.total_seconds || 0;
    
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

    return {
      progressPct: Number(progressPct).toFixed(1),
      doneLessons,
      totalLessons,
      studyTimeFormatted,
      courseDurationFormatted,
      notesCount: notesCount || 0,
      markersCount: markersCount || 0
    };
  }, [courseProgress, studyTime, courseDuration, notesCount, markersCount]);

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

        {/* Completed Lessons Card - Navega a Lecciones */}
        <StatCard onCardClick={() => navigateToTab('Lecciones')}>
          <StatCardTitle>Lecciones Completadas</StatCardTitle>
          <StatCardValue className="flex items-center gap-3">
            {stats.doneLessons}
            <CheckCircle className="h-8 w-8 text-green-500" />
          </StatCardValue>
          <StatCardMeta>de {stats.totalLessons} totales</StatCardMeta>
        </StatCard>

        {/* Notes Card - Navega a Apuntes */}
        <StatCard onCardClick={() => navigateToTab('Apuntes')}>
          <StatCardTitle>Apuntes Creados</StatCardTitle>
          <StatCardValue className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-500" />
            <span className="text-3xl">{stats.notesCount}</span>
          </StatCardValue>
          <StatCardMeta>resúmenes de lecciones</StatCardMeta>
        </StatCard>
      </div>

      {/* Second Row - Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Markers Card - Navega a Marcadores */}
        <StatCard onCardClick={() => navigateToTab('Marcadores')}>
          <StatCardTitle>Marcadores</StatCardTitle>
          <StatCardValue className="flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-orange-500" />
            <span className="text-3xl">{stats.markersCount}</span>
          </StatCardValue>
          <StatCardMeta>momentos guardados</StatCardMeta>
        </StatCard>

        {/* Pending Lessons Card - Navega a Lecciones */}
        <StatCard onCardClick={() => navigateToTab('Lecciones')}>
          <StatCardTitle>Lecciones Pendientes</StatCardTitle>
          <StatCardValue className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-amber-500" />
            <span className="text-3xl">{stats.totalLessons - stats.doneLessons}</span>
          </StatCardValue>
          <StatCardMeta>por completar</StatCardMeta>
        </StatCard>

        {/* Discord Widget - Spans 2 columns */}
        <div className="md:col-span-2">
          <DiscordWidget />
        </div>
      </div>
    </div>
  )
}
