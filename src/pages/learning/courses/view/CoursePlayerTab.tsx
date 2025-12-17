import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Play, BookOpen, CheckCircle, ChevronLeft, ChevronRight, FileText, Bookmark, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCourseSidebarStore } from '@/stores/sidebarStore'
import { VimeoPlayer } from '@/components/ui-custom/media'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { LessonSummaryNote, LessonMarkers, FavoriteButton, useCourseStructure, useCourseProgress, useUpdateLessonProgress, useCoursePlayerStore } from '@/features/learning'
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
  const { setData, setCurrentLesson, currentLessonId: sidebarLessonId } = useCourseSidebarStore();
  const storeLessonId = useCoursePlayerStore(s => s.currentLessonId);
  const goToLesson = useCoursePlayerStore(s => s.goToLesson);
  const pendingSeek = useCoursePlayerStore(s => s.pendingSeek);
  const clearPendingSeek = useCoursePlayerStore(s => s.clearPendingSeek);
  const vimeoPlayer = useCoursePlayerStore(s => s.vimeoPlayer);
  const setVimeoPlayer = useCoursePlayerStore(s => s.setVimeoPlayer);
  const { toast } = useToast();
  const [targetSeekTime, setTargetSeekTime] = useState<number | undefined>(initialSeekTime);
  
  // Track if video is currently playing to prevent auto-rewind
  const isPlayingRef = useRef(false);
  const currentLessonIdRef = useRef<string | null>(null);
  
  // SINGLE SOURCE OF TRUTH: coursePlayerStore.currentLessonId has priority
  const activeLessonId = storeLessonId || sidebarLessonId || null;
  
  // Sync coursePlayerStore.currentLessonId with sidebar store (UNIDIRECTIONAL: store → sidebar)
  // Use ref to avoid re-triggering on sidebarLessonId changes
  const lastSyncedLessonIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (storeLessonId && storeLessonId !== lastSyncedLessonIdRef.current) {
      lastSyncedLessonIdRef.current = storeLessonId;
      setCurrentLesson(storeLessonId);
    }
  }, [storeLessonId, setCurrentLesson]);
  
  // Detectar cambio de lección y resetear flag de reproducción
  useEffect(() => {
    if (activeLessonId !== currentLessonIdRef.current) {
      currentLessonIdRef.current = activeLessonId;
      isPlayingRef.current = false; // Reset flag on lesson change
    }
  }, [activeLessonId]);
  
  // Get course structure (modules with lessons) using the learning feature hook
  const { data: courseStructure = [], isLoading: structureLoading } = useCourseStructure(courseId);
  
  // Extract modules and lessons from the structure for compatibility with existing code
  const modules = useMemo(() => {
    return courseStructure.map(({ lessons, ...module }) => module);
  }, [courseStructure]);
  
  const lessons = useMemo(() => {
    return courseStructure.flatMap(module => 
      (module.lessons || []).map((lesson: any) => ({
        ...lesson,
        module_id: module.id
      }))
    );
  }, [courseStructure]);
  
  const modulesLoading = structureLoading;
  const lessonsLoading = structureLoading;

  // Get progress for all lessons using the learning feature hook
  const { data: progressData = [] } = useCourseProgress(courseId);

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

  // Use the learning feature hook for updating lesson progress
  const updateProgressMutation = useUpdateLessonProgress(courseId);
  
  // Wrap the mutation to add custom success behavior (maintain playing flag)
  const saveProgressMutation = useMemo(() => ({
    mutate: (payload: { lessonId: string, sec: number, pct: number }) => {
      updateProgressMutation.mutate({
        lessonId: payload.lessonId,
        progress_pct: payload.pct,
        last_position_sec: payload.sec,
        completed_at: null
      }, {
        onSuccess: () => {
          // Set flag that video is playing to prevent rewind
          isPlayingRef.current = true;
        }
      });
    },
    isPending: updateProgressMutation.isPending
  }), [updateProgressMutation, courseId]);

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

  // Mark lesson as complete mutation (toggle) using the same update progress mutation
  const markCompleteMutation = useMemo(() => ({
    mutate: (params: { lessonId: string; isCompleted: boolean }) => {
      updateProgressMutation.mutate({
        lessonId: params.lessonId,
        completed_at: params.isCompleted ? new Date().toISOString() : null,
        progress_pct: params.isCompleted ? 100 : 0,
        last_position_sec: 0,
        is_completed: params.isCompleted
      }, {
        onSuccess: () => {
          // Show custom toast for manual completion toggle
          toast({
            title: params.isCompleted ? 'Lección completada' : 'Lección desmarcada',
            description: params.isCompleted ? 'Has marcado esta lección como completa' : 'Has desmarcado esta lección'
          });
        }
      });
    },
    isPending: updateProgressMutation.isPending
  }), [updateProgressMutation, toast]);

  // Sincronizar datos con el sidebar store (para otros tabs que lo leen)
  useEffect(() => {
    if (modules.length > 0 || lessons.length > 0) {
      setData(modules, lessons);
    }
    
    return () => {
      setCurrentLesson(undefined);
      setVimeoPlayer(null);
    };
  }, [modules, lessons, setData, setCurrentLesson, setVimeoPlayer]);

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
    <div className="space-y-6">
      {/* Video Player - 100% width */}
        {currentLesson?.vimeo_video_id ? (
          <>
            <VimeoPlayer 
              vimeoId={currentLesson.vimeo_video_id}
              initialPosition={initialPosition}
              onProgress={handleVideoProgress}
              onPlayerReady={setVimeoPlayer}
              onSeekApplied={() => {
                clearPendingSeek();
              }}
            />

            {/* Compact Lesson Info Card - 2 rows */}
            <div className="bg-card border rounded-lg p-4">
              {/* Row 1: Lesson name | Duration | Action buttons (right) */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{currentLesson.title}</h2>
                  {currentLesson.duration_sec && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDuration(currentLesson.duration_sec)}</span>
                    </div>
                  )}
                </div>
                
                {/* Action buttons inline on the right */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {courseId && (
                    <FavoriteButton 
                      lessonId={currentLesson.id}
                      courseId={courseId}
                      isFavorite={currentProgress?.is_favorite || false}
                      variant="icon"
                      size="sm"
                    />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkComplete}
                    disabled={markCompleteMutation.isPending}
                    data-testid="button-mark-complete-inline"
                    title={currentProgress?.is_completed ? 'Desmarcar como Completa' : 'Marcar como Completa'}
                    className={currentProgress?.is_completed ? "text-green-600 hover:text-green-700" : ""}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Row 2: Module name */}
              {currentModule && (
                <p className="text-sm text-muted-foreground">{currentModule.title}</p>
              )}
            </div>

            {/* Notes Section */}
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
  )
}
