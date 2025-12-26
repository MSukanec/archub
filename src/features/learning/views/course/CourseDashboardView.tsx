import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardContent } from '@/components/ActivityCard'
import { BookOpen, CheckCircle, Clock, FileText, Bookmark, Megaphone, Info, PlayCircle, Play, MessageCircle } from 'lucide-react'
import type { ThreadsResponse, ForumThreadWithAuthor } from '@/features/forum/services'
import { 
  useCourseProgress, 
  useCourseEnrollment, 
  useLastLessonInProgress, 
  useStudyTime, 
  useCourseDuration,
  useLessonDetails,
  useMonthlyStudyTime,
  useCourseRecentNotes,
  useCourseRecentMarkers,
  useCoursePlayerStore,
  useCourseOverview
} from '@/features/learning'
import { useLocation, useParams } from 'wouter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrentUser } from '@/hooks/use-current-user'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/EmptyState'

interface CourseDashboardTabProps {
  courseId?: string;
}

export default function CourseDashboardTab({ courseId }: CourseDashboardTabProps) {
  const [, navigate] = useLocation();
  const { id: courseSlug } = useParams<{ id: string }>();
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const setActiveTab = useCoursePlayerStore(s => s.setActiveTab);
  const { data: userData } = useCurrentUser();
  const { data: course } = useCourseOverview(courseSlug);

  // Handler to navigate to a specific tab
  const navigateToTab = (tab: string) => {
    if (courseSlug) {
      // Update store first to trigger tab change
      setActiveTab(tab as any);
      // Then update URL for deep linking
      navigate(`/learning/courses/${courseSlug}?tab=${encodeURIComponent(tab)}`);
    }
  };

  // 🚀 Use learning feature hooks
  const { data: lessonProgressArray = [] } = useCourseProgress(courseId);

  // Calculate aggregated course progress from lesson progress array
  const courseProgress = useMemo(() => {
    if (!lessonProgressArray || lessonProgressArray.length === 0) {
      return { progress_pct: 0, done_lessons: 0, total_lessons: 0 };
    }
    
    const totalLessons = lessonProgressArray.length;
    const doneLessons = lessonProgressArray.filter(p => p.is_completed).length;
    const progressPct = totalLessons > 0 ? (doneLessons / totalLessons) * 100 : 0;
    
    return {
      progress_pct: progressPct,
      done_lessons: doneLessons,
      total_lessons: totalLessons
    };
  }, [lessonProgressArray]);

  // 🚀 Get total study time usando el hook del feature
  const { data: studyTime } = useStudyTime(userData?.user?.id, courseId);

  // 🚀 Get recent notes and markers usando los hooks del feature
  const { data: recentNotes = [] } = useCourseRecentNotes(courseId);
  const { data: recentMarkers = [] } = useCourseRecentMarkers(courseId);

  // 🚀 Get total course duration usando el hook del feature
  const { data: courseDuration } = useCourseDuration(courseId);

  // 🚀 Get user's enrollment usando el hook del feature
  const { data: enrollment } = useCourseEnrollment(courseId, userData?.user?.id);

  // 🚀 Get last lesson in progress usando el hook del feature
  const { data: lastLessonProgress } = useLastLessonInProgress(courseId, userData?.user?.id);

  // 🚀 Fetch lesson details for the last lesson in progress usando el hook del feature
  const { data: lastLessonDetails } = useLessonDetails(lastLessonProgress?.lesson_id);

  // Combine lastLessonProgress with lastLessonDetails
  const lastLesson = useMemo(() => {
    if (!lastLessonProgress) return null;
    
    return {
      lesson_id: lastLessonProgress.lesson_id,
      lesson_title: lastLessonDetails?.title || 'Sin título',
      last_position_sec: lastLessonProgress.last_position_sec,
      duration_sec: lastLessonDetails?.duration_sec || 0,
      is_completed: false
    };
  }, [lastLessonProgress, lastLessonDetails]);

  // 🚀 Get user's monthly study time usando el hook del feature
  const { data: monthlyStudyTime } = useMonthlyStudyTime();

  // 🚀 Get recent forum threads for this course
  const { data: forumThreadsData } = useQuery<ThreadsResponse>({
    queryKey: ['/api/forum/courses', courseId, 'threads', { recent: true }],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/forum/courses/${courseId}/threads?page=1&limit=3`);
      if (!res.ok) throw new Error('Failed to fetch forum threads');
      return res.json();
    },
    enabled: !!courseId,
    staleTime: 60 * 1000,
  });
  const recentForumThreads = forumThreadsData?.threads || [];

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
      const startedAt = enrollment.started_at ? new Date(enrollment.started_at) : now;
      
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
      {/* Hero Section with Course Cover Background and KPIs */}
      <div 
        className="relative rounded-xl overflow-hidden min-h-[200px]"
        style={{
          backgroundImage: course?.cover_url ? `url(${course.cover_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background: either dark overlay on image or gradient fallback */}
        {course?.cover_url ? (
          <div className="absolute inset-0 bg-black/60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent/80 via-accent/60 to-accent/40" />
        )}
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Course Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {course?.title || 'Cargando...'}
          </h1>
          
          {/* Continue Button */}
          {lastLesson && (
            <Button
              onClick={() => goToLesson(lastLesson.lesson_id, lastLesson.last_position_sec)}
              className="mb-6"
              variant="default"
              data-testid="button-continue-hero"
            >
              <Play className="mr-2 h-4 w-4" />
              Continuar
            </Button>
          )}
          
          {/* KPIs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Subscription Days */}
            <div className="text-center">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">
                Tiempo Restante
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {stats.subscriptionFormatted}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {stats.subscriptionMetaFormatted}
              </p>
            </div>
            
            {/* Progress */}
            <div className="text-center">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">
                Progreso Total
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {stats.progressPct}%
              </p>
              <p className="text-xs text-white/60 mt-1">
                {stats.doneLessons} de {stats.totalLessons} lecciones
              </p>
            </div>
            
            {/* Study Time */}
            <div className="text-center">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">
                Tiempo de Estudio
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {stats.studyTimeFormatted}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {stats.courseDurationFormatted}
              </p>
            </div>
            
            {/* This Month */}
            <div className="text-center">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wide mb-1">
                Este Mes
              </p>
              <p className="text-2xl md:text-3xl font-bold text-white">
                {stats.monthTimeFormatted}
              </p>
              <p className="text-xs text-white/60 mt-1">
                dedicadas en total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forum, Notes and Markers Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forum Card - Navega a Foro */}
        <StatCard onCardClick={() => navigateToTab('Foro')}>
          <StatCardTitle>Últimos Posts del Foro</StatCardTitle>
          <StatCardContent className={recentForumThreads.length === 0 ? "mt-2" : "mt-4"}>
            {recentForumThreads.length === 0 ? (
              <EmptyState
                icon={<MessageCircle />}
                title="No hay posts aún"
                description="Sé el primero en publicar en el foro del curso"
                className="min-h-0 md:min-h-0"
              />
            ) : (
              <>
                <div className="space-y-2">
                  {recentForumThreads.map((thread: ForumThreadWithAuthor) => (
                    <div 
                      key={thread.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        navigateToTab('Foro');
                      }}
                      className="group/item flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-transparent hover:bg-accent/5 hover:border-accent/50 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
                        <MessageCircle className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground group-hover/item:text-accent transition-colors truncate">
                            {thread.title}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(thread.created_at), 'dd/MM/yy', { locale: es })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          por {thread.author?.full_name || 'Anónimo'}
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
                      navigateToTab('Foro');
                    }}
                    className="text-xs text-accent hover:underline"
                    data-testid="link-view-all-forum-threads"
                  >
                    Ver todos los posts
                  </button>
                </div>
              </>
            )}
          </StatCardContent>
        </StatCard>

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
