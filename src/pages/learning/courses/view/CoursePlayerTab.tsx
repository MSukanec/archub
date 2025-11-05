import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Play, BookOpen, CheckCircle, ChevronLeft, ChevronRight, FileText, Bookmark, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCourseSidebarStore } from '@/stores/sidebarStore'
import { useCoursePlayerStore } from '@/stores/coursePlayerStore'
import VimeoPlayer from '@/components/video/VimeoPlayer'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { LessonSummaryNote } from '@/components/learning/LessonSummaryNote'
import { LessonMarkers } from '@/components/learning/LessonMarkers'
import { FavoriteButton } from '@/components/learning/FavoriteButton'
import Player from '@vimeo/player'

interface CoursePlayerTabProps {
  courseId?: string;
  onNavigationStateChange?: (state: {
    hasPrev: boolean;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onMarkComplete: () => void;
    isMarkingComplete: boolean;
    isCompleted: boolean;
  } | null) => void;
  initialLessonId?: string;
  initialSeekTime?: number;
}

export default function CoursePlayerTab({ courseId, onNavigationStateChange, initialLessonId, initialSeekTime }: CoursePlayerTabProps) {
  const { setVisible, setData, setCurrentLesson, currentLessonId: sidebarLessonId } = useCourseSidebarStore();
  const storeLessonId = useCoursePlayerStore(s => s.currentLessonId);
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const pendingSeek = useCoursePlayerStore(s => s.pendingSeek);
  const clearPendingSeek = useCoursePlayerStore(s => s.clearPendingSeek);
  const { toast } = useToast();
  const [vimeoPlayer, setVimeoPlayer] = useState<Player | null>(null);
  const [targetSeekTime, setTargetSeekTime] = useState<number | undefined>(initialSeekTime);
  
  // Track if video is currently playing to prevent auto-rewind
  const isPlayingRef = useRef(false);
  const currentLessonIdRef = useRef<string | null>(null);
  
  // SINGLE SOURCE OF TRUTH: coursePlayerStore.currentLessonId has priority
  const activeLessonId = storeLessonId || sidebarLessonId || null;
  
  // Sync coursePlayerStore.currentLessonId with sidebar store (UNIDIRECTIONAL: store → sidebar)
  useEffect(() => {
    if (storeLessonId && storeLessonId !== sidebarLessonId) {
      setCurrentLesson(storeLessonId);
    }
  }, [storeLessonId, setCurrentLesson, sidebarLessonId]);
  
  // Detectar cambio de lección y resetear flag de reproducción
  useEffect(() => {
    if (activeLessonId !== currentLessonIdRef.current) {
      currentLessonIdRef.current = activeLessonId;
      isPlayingRef.current = false; // Reset flag on lesson change
    }
  }, [activeLessonId]);
  
  // Get course modules and lessons
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['course-modules', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_index', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['course-lessons-full', courseId],
    queryFn: async () => {
      if (!courseId || !supabase || modules.length === 0) return [];
      
      const moduleIds = modules.map(m => m.id);
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('id, module_id, title, vimeo_video_id, duration_sec, free_preview, sort_index, is_active')
        .in('module_id', moduleIds)
        .order('sort_index', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase && modules.length > 0
  });

  // Fetch progress for all lessons in the course
  const { data: progressData } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      
      const res = await fetch(`/api/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        return [];
      }
      
      return res.json();
    },
    enabled: !!courseId
  });

  // Create a map of lesson progress for quick lookup
  const progressMap = useMemo(() => {
    return new Map((progressData || []).map((p: any) => [p.lesson_id, p]));
  }, [progressData]);

  // Create ordered flat list of lessons based on module and lesson sort_index
  const orderedLessons = useMemo(() => {
    if (modules.length === 0 || lessons.length === 0) return [];
    
    const ordered: any[] = [];
    modules.forEach(module => {
      const moduleLessons = lessons
        .filter(l => l.module_id === module.id)
        .sort((a, b) => a.sort_index - b.sort_index);
      ordered.push(...moduleLessons);
    });
    
    return ordered;
  }, [modules, lessons]);

  // Find current lesson index and navigation info
  const navigationInfo = useMemo(() => {
    if (!activeLessonId || orderedLessons.length === 0) {
      return { currentIndex: -1, hasPrev: false, hasNext: false, prevLesson: null, nextLesson: null };
    }
    
    const currentIndex = orderedLessons.findIndex(l => l.id === activeLessonId);
    
    return {
      currentIndex,
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < orderedLessons.length - 1,
      prevLesson: currentIndex > 0 ? orderedLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null,
    };
  }, [activeLessonId, orderedLessons]);

  // Save progress mutation (for auto-save while watching)
  const saveProgressMutation = useMutation({
    mutationFn: async ({ lessonId, sec, pct }: { lessonId: string, sec: number, pct: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          progress_pct: pct,
          last_position_sec: sec,
          completed_at: null
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save progress (${response.status})`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Set flag that video is playing to prevent rewind
      isPlayingRef.current = true;
      // Still invalidate to keep cache fresh for lesson switching
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'progress'] });
    }
  });

  // Throttle progress saves to avoid too many requests
  const lastSaveTime = useRef(0);
  const SAVE_THROTTLE_MS = 8000; // Save every 8 seconds max

  const handleVideoProgress = useCallback((sec: number, pct: number) => {
    if (!activeLessonId) return;
    
    const now = Date.now();
    if (now - lastSaveTime.current >= SAVE_THROTTLE_MS) {
      lastSaveTime.current = now;
      saveProgressMutation.mutate({ lessonId: activeLessonId, sec, pct });
    }
  }, [activeLessonId, saveProgressMutation]);

  // Mark lesson as complete mutation (toggle)
  const markCompleteMutation = useMutation({
    mutationFn: async ({ lessonId, isCompleted }: { lessonId: string; isCompleted: boolean }) => {
      // Get the Supabase session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          completed_at: isCompleted ? new Date().toISOString() : null,
          progress_pct: isCompleted ? 100 : 0,
          last_position_sec: 0,
          is_completed: isCompleted
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorData = errorText ? JSON.parse(errorText) : {};
        throw new Error(errorData.error || `Failed to update lesson completion status (${response.status})`);
      }
      
      return response.json();
    },
    onSuccess: async (_, variables) => {
      // Force refetch of progress data for course and dashboard
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ['/api/courses', courseId, 'progress'],
          exact: true 
        }),
        queryClient.refetchQueries({ 
          queryKey: ['/api/user/all-progress'],
          exact: true 
        })
      ]);
      
      toast({
        title: variables.isCompleted ? 'Lección completada' : 'Lección desmarcada',
        description: variables.isCompleted ? 'Has marcado esta lección como completa' : 'Has desmarcado esta lección'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la lección',
        variant: 'destructive'
      });
    }
  });

  // Crear strings estables de IDs para evitar re-renders innecesarios
  const moduleIdsString = useMemo(() => modules.map(m => m.id).join(','), [modules]);
  const lessonIdsString = useMemo(() => lessons.map(l => l.id).join(','), [lessons]);

  // Activar el sidebar cuando hay datos
  useEffect(() => {
    if (modules.length > 0 || lessons.length > 0) {
      setVisible(true);
      setData(modules, lessons);
    }

    // Desactivar el sidebar cuando el componente se desmonta
    return () => {
      setVisible(false);
      setData([], []);
      setCurrentLesson(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleIdsString, lessonIdsString]);

  // Seleccionar automáticamente la lección (inicial, última vista, o primera) cuando se cargan las lecciones
  // IMPORTANTE: Usa goToLesson del store para NO sobrescribir navegación desde marcadores
  useEffect(() => {
    if (orderedLessons.length > 0 && !activeLessonId) {
      let targetLesson = null;
      
      // 1. Si hay initialLessonId (deep link o marcador), usar esa
      if (initialLessonId) {
        targetLesson = orderedLessons.find(l => l.id === initialLessonId);
      }
      
      // 2. Si no, buscar la última lección vista (la más reciente en progressData)
      if (!targetLesson && progressData && progressData.length > 0) {
        // Ordenar por updated_at descendente y tomar la primera
        const sortedProgress = [...progressData]
          .filter(p => orderedLessons.some(l => l.id === p.lesson_id))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        
        if (sortedProgress.length > 0) {
          const lastViewedLessonId = sortedProgress[0].lesson_id;
          targetLesson = orderedLessons.find(l => l.id === lastViewedLessonId);
        }
      }
      
      // 3. Si no hay última lección vista, usar la primera del primer módulo
      if (!targetLesson) {
        targetLesson = orderedLessons[0];
      }
      
      if (targetLesson) {
        goToLesson(targetLesson.id, null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedLessons, activeLessonId, initialLessonId, progressData, goToLesson]);


  // Navigation handlers with useCallback - use goToLesson from store
  const handlePrevious = useCallback(() => {
    if (navigationInfo.prevLesson) {
      goToLesson(navigationInfo.prevLesson.id, null);
    }
  }, [navigationInfo.prevLesson, goToLesson]);

  const handleNext = useCallback(() => {
    if (navigationInfo.nextLesson) {
      goToLesson(navigationInfo.nextLesson.id, null);
    }
  }, [navigationInfo.nextLesson, goToLesson]);

  const handleMarkComplete = useCallback(() => {
    if (activeLessonId) {
      const progress = progressMap.get(activeLessonId);
      const isCurrentlyCompleted = progress?.is_completed || false;
      markCompleteMutation.mutate({ lessonId: activeLessonId, isCompleted: !isCurrentlyCompleted });
    }
  }, [activeLessonId, markCompleteMutation, progressMap]);

  // Actualizar targetSeekTime cuando cambia initialSeekTime (para navegación desde marcadores)
  useEffect(() => {
    if (initialSeekTime !== undefined) {
      setTargetSeekTime(initialSeekTime);
    }
  }, [initialSeekTime]);
  
  // Escuchar pendingSeek del store (para navegación desde marcadores usando el store)
  useEffect(() => {
    if (pendingSeek !== null && pendingSeek !== undefined) {
      setTargetSeekTime(pendingSeek);
      // NO limpiar aquí - esperar confirmación del player vía onSeekApplied
    }
  }, [pendingSeek]);
  
  // Limpiar targetSeekTime después de usarlo
  useEffect(() => {
    if (targetSeekTime !== undefined && activeLessonId === initialLessonId) {
      setTargetSeekTime(undefined);
    }
  }, [activeLessonId, initialLessonId, targetSeekTime]);

  // Update navigation state whenever it changes
  useEffect(() => {
    if (onNavigationStateChange) {
      if (activeLessonId && orderedLessons.length > 0) {
        const currentProgress = progressMap.get(activeLessonId);
        const isCompleted = currentProgress?.is_completed || false;
        
        onNavigationStateChange({
          hasPrev: navigationInfo.hasPrev,
          hasNext: navigationInfo.hasNext,
          onPrevious: handlePrevious,
          onNext: handleNext,
          onMarkComplete: handleMarkComplete,
          isMarkingComplete: markCompleteMutation.isPending,
          isCompleted
        });
      } else {
        onNavigationStateChange(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLessonId, navigationInfo.hasPrev, navigationInfo.hasNext, orderedLessons.length, markCompleteMutation.isPending]);

  // Group lessons by module
  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter(lesson => lesson.module_id === moduleId);
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Sin duración';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }


  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  if (modulesLoading || lessonsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Encontrar la lección actual
  const currentLesson = lessons.find(l => l.id === activeLessonId);
  
  // Encontrar el módulo al que pertenece la lección
  const currentModule = currentLesson ? modules.find(m => m.id === currentLesson.module_id) : null;
  
  // Obtener progreso de la lección actual
  const currentProgress = activeLessonId ? progressMap.get(activeLessonId) : null;
  
  // Determinar la posición inicial: si hay targetSeekTime (desde marcador), usar esa, si no, usar el progreso guardado
  // IMPORTANTE: Si el video ya está reproduciéndose, NO actualizar initialPosition para evitar rewind
  const initialPosition = targetSeekTime !== undefined 
    ? targetSeekTime 
    : (isPlayingRef.current ? 0 : (currentProgress?.last_position_sec || 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columnas 1 y 2: Contenido principal (Video, Info, Marcadores en mobile, Apuntes) */}
      <div className="lg:col-span-2 space-y-6">
        {currentLesson?.vimeo_video_id ? (
          <>
            {/* Video Player */}
            <VimeoPlayer 
              vimeoId={currentLesson.vimeo_video_id}
              initialPosition={initialPosition}
              onProgress={handleVideoProgress}
              onPlayerReady={setVimeoPlayer}
              onSeekApplied={() => {
                clearPendingSeek();
              }}
            />

            {/* Card con datos del video */}
            <div className="bg-card border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-1">{currentLesson.title}</h2>
              {currentModule && (
                <p className="text-sm text-muted-foreground mb-2">{currentModule.name}</p>
              )}
              {currentLesson.duration_sec && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(currentLesson.duration_sec)}</span>
                </div>
              )}
              
              {/* Línea divisoria */}
              <hr className="border-t border-border mb-2" />
              
              {/* Botones de Acción - Solo iconos */}
              <div className="flex items-center gap-1">
                {/* Botón Favorito */}
                {courseId && (
                  <FavoriteButton 
                    lessonId={currentLesson.id}
                    courseId={courseId}
                    isFavorite={currentProgress?.is_favorite || false}
                    variant="icon"
                    size="lg"
                  />
                )}
                
                {/* Botón Marcar como Completa */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMarkComplete}
                  disabled={markCompleteMutation.isPending}
                  data-testid="button-mark-complete-inline"
                  title={currentProgress?.is_completed ? 'Desmarcar como Completa' : 'Marcar como Completa'}
                  className={currentProgress?.is_completed ? "text-green-600 hover:text-green-700" : ""}
                >
                  <CheckCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Card de Marcadores - SOLO EN MOBILE (lg:hidden) */}
            {activeLessonId && (
              <div className="lg:hidden bg-card border rounded-lg p-4">
                <LessonMarkers lessonId={activeLessonId} vimeoPlayer={vimeoPlayer} />
              </div>
            )}

            {/* Card de Apuntes */}
            {activeLessonId && (
              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="font-semibold">Mis Apuntes</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Resumen general de la lección - se guarda automáticamente mientras escribes.
                </p>
                <LessonSummaryNote lessonId={activeLessonId} />
              </div>
            )}
          </>
        ) : (
          <div className="bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 aspect-video flex items-center justify-center">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                {activeLessonId ? 'Esta lección no tiene video disponible' : 'Selecciona una lección para comenzar'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Columna 3: Marcadores sidebar (sticky) - SOLO EN DESKTOP (hidden lg:block) */}
      {activeLessonId && currentLesson?.vimeo_video_id && (
        <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start">
          <div className="bg-card border rounded-lg p-4">
            <LessonMarkers lessonId={activeLessonId} vimeoPlayer={vimeoPlayer} />
          </div>
        </div>
      )}
    </div>
  )
}
