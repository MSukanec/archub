import { useEffect, useMemo, useCallback, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Play, CheckCircle, FileText, Bookmark, Clock, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCourseSidebarStore } from '@/stores/sidebarStore'
import { VimeoPlayer } from '@/components/shared/viewers'
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
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  
  // Track if video is currently playing to prevent auto-rewind
  const isPlayingRef = useRef(false);
  const currentLessonIdRef = useRef<string | null>(null);
  
  // SINGLE SOURCE OF TRUTH: coursePlayerStore.currentLessonId has priority
  const activeLessonId = storeLessonId || sidebarLessonId || null;
  
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
    
    // Update current time for marker button
    setCurrentVideoTime(sec);
    
    const now = Date.now();
    if (now - lastSaveTime.current >= SAVE_THROTTLE_MS) {
      lastSaveTime.current = now;
      saveProgressMutation.mutate({ lessonId: activeLessonId, sec, pct });
    }
  }, [activeLessonId, saveProgressMutation]);
  // Create marker mutation
  const createMarkerMutation = useMutation({
    mutationFn: async (time_sec: number) => {
      if (!activeLessonId) throw new Error('No active lesson');
      return apiRequest('POST', `/api/lessons/${activeLessonId}/markers`, {
        body: '',
        time_sec
      });
    },
    onSuccess: () => {
      if (activeLessonId) {
        queryClient.invalidateQueries({ queryKey: [`/api/lessons/${activeLessonId}/markers`] });
      }
      toast({
        title: 'Marcador agregado',
        description: `Marcador creado en ${formatTimeForMarker(currentVideoTime)}`
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el marcador',
        variant: 'destructive'
      });
    }
  });
  const formatTimeForMarker = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const handleAddMarkerFromVideo = async () => {
    if (!vimeoPlayer) return;
    
    try {
      const time = await vimeoPlayer.getCurrentTime();
      const roundedTime = Math.floor(time);
      createMarkerMutation.mutate(roundedTime);
    } catch (error) {
      console.error('Error getting video time:', error);
    }
  };
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
            title: params.isCompleted ? 'Lección completada': 'Lección desmarcada',
            description: params.isCompleted ? 'Has marcado esta lección como completa': 'Has desmarcado esta lección'
          });
        }
      });
    },
    isPending: updateProgressMutation.isPending
  }), [updateProgressMutation, toast]);
  // Sincronizar datos con el sidebar store (para otros tabs que lo leen)
  // Use JSON.stringify comparison to prevent unnecessary updates
  const modulesJson = JSON.stringify(modules.map(m => m.id));
  const lessonsJson = JSON.stringify(lessons.map(l => l.id));
  
  useEffect(() => {
    if (modules.length > 0 || lessons.length > 0) {
      setData(modules, lessons);
    }
  }, [modulesJson, lessonsJson]);
  
  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      setCurrentLesson(undefined);
      setVimeoPlayer(null);
    };
  }, []);
  // Seleccionar automáticamente la lección (inicial, última vista, o primera) cuando se cargan las lecciones
  // IMPORTANTE: Solo se ejecuta una vez cuando las lecciones se cargan y no hay lección activa
  const hasAutoSelectedRef = useRef(false);
  
  useEffect(() => {
    // Solo ejecutar una vez cuando hay lecciones y no hay activeLessonId
    if (hasAutoSelectedRef.current || orderedLessons.length === 0 || activeLessonId) {
      return;
    }
    
    hasAutoSelectedRef.current = true;
    
    let targetLesson = null;
    
    // 1. Si hay initialLessonId (deep link o marcador), usar esa
    if (initialLessonId) {
      targetLesson = orderedLessons.find(l => l.id === initialLessonId);
    }
    
    // 2. Si no, buscar la última lección vista (la más reciente en progressData)
    if (!targetLesson && progressData && progressData.length > 0) {
      const sortedProgress = [...progressData]
        .filter(p => orderedLessons.some(l => l.id === p.lesson_id))
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      if (sortedProgress.length > 0) {
        targetLesson = orderedLessons.find(l => l.id === sortedProgress[0].lesson_id);
      }
    }
    
    // 3. Si no hay última lección vista, usar la primera del primer módulo
    if (!targetLesson) {
      targetLesson = orderedLessons[0];
    }
    
    if (targetLesson) {
      goToLesson(targetLesson.id, null);
    }
  }, [orderedLessons.length, activeLessonId, initialLessonId]);
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
        {currentLesson?.vimeo_video_id ? (
          <>
            {/* Lesson Info Card - ABOVE the video */}
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">{currentLesson.title}</h2>
                  {currentModule && (
                    <Badge variant="secondary" className="text-xs font-normal whitespace-nowrap">
                      {currentModule.title}
                    </Badge>
                  )}
                  {currentLesson.duration_sec && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDuration(currentLesson.duration_sec)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
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
                    className={currentProgress?.is_completed ? "text-positive hover:text-positive gap-2" : "gap-2"}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{currentProgress?.is_completed ? 'Completada': 'Marcar completa'}</span>
                  </Button>
                </div>
              </div>
            </div>
            {/* Video Player with Marker Overlay */}
            <div className="relative group">
              <VimeoPlayer 
                vimeoId={currentLesson.vimeo_video_id}
                initialPosition={initialPosition}
                onProgress={handleVideoProgress}
                onPlayerReady={setVimeoPlayer}
                onSeekApplied={() => {
                  clearPendingSeek();
                }}
              />
              {/* Marker button overlay - appears on hover */}
              <Button
                onClick={handleAddMarkerFromVideo}
                size="sm"
                variant="secondary"
                className="absolute top-4 left-4 gap-2 bg-black/70 text-white backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/80"
                disabled={!vimeoPlayer || createMarkerMutation.isPending}
                data-testid="button-add-marker-overlay"
              >
                <Bookmark className="h-4 w-4" />
                <span>Marcar {formatTimeForMarker(currentVideoTime)}</span>
              </Button>
            </div>
            {/* Notes and Markers Section */}
            {activeLessonId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-5 w-5 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold">Mis Apuntes</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Resumen general de la lección - se guarda automáticamente mientras escribes.
                  </p>
                  <LessonSummaryNote lessonId={activeLessonId} />
                </div>
                <div className="bg-card border rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Bookmark className="h-5 w-5 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold">Mis Marcadores</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Marca momentos importantes del video para volver a ellos fácilmente.
                  </p>
                  <LessonMarkers 
                    lessonId={activeLessonId} 
                    vimeoPlayer={vimeoPlayer}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 aspect-video flex items-center justify-center">
            <div className="text-center">
              <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                {activeLessonId ? 'Esta lección no tiene video disponible': 'Selecciona una lección para comenzar'}
              </p>
            </div>
          </div>
        )}
    </div>
  )
}
