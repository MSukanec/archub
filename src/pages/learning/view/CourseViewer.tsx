import { useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Play, BookOpen, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCourseSidebarStore } from '@/stores/sidebarStore'
import VimeoPlayer from '@/components/video/VimeoPlayer'
import { apiRequest, queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'

interface CourseViewerProps {
  courseId?: string;
  onNavigationStateChange?: (state: {
    hasPrev: boolean;
    hasNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onMarkComplete: () => void;
    isMarkingComplete: boolean;
  } | null) => void;
}

export default function CourseViewer({ courseId, onNavigationStateChange }: CourseViewerProps) {
  const { setVisible, setData, setCurrentLesson, currentLessonId } = useCourseSidebarStore();
  const { toast } = useToast();
  
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
        console.error('Error fetching course modules:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (!courseId || !supabase || modules.length === 0) return [];
      
      const moduleIds = modules.map(m => m.id);
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_index', { ascending: true });
        
      if (error) {
        console.error('Error fetching lessons:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase && modules.length > 0
  });

  // Fetch progress for all lessons in the course
  const { data: progressData } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
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
    if (!currentLessonId || orderedLessons.length === 0) {
      return { currentIndex: -1, hasPrev: false, hasNext: false, prevLesson: null, nextLesson: null };
    }
    
    const currentIndex = orderedLessons.findIndex(l => l.id === currentLessonId);
    
    return {
      currentIndex,
      hasPrev: currentIndex > 0,
      hasNext: currentIndex < orderedLessons.length - 1,
      prevLesson: currentIndex > 0 ? orderedLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < orderedLessons.length - 1 ? orderedLessons[currentIndex + 1] : null,
    };
  }, [currentLessonId, orderedLessons]);

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
        console.error('❌ Auto-save failed:', response.status, errorText);
        throw new Error(`Failed to save progress (${response.status})`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'progress'] });
    }
  });

  // Throttle progress saves to avoid too many requests
  const lastSaveTime = useRef(0);
  const SAVE_THROTTLE_MS = 8000; // Save every 8 seconds max

  const handleVideoProgress = useCallback((sec: number, pct: number) => {
    if (!currentLessonId) return;
    
    const now = Date.now();
    if (now - lastSaveTime.current >= SAVE_THROTTLE_MS) {
      lastSaveTime.current = now;
      saveProgressMutation.mutate({ lessonId: currentLessonId, sec, pct });
    }
  }, [currentLessonId, saveProgressMutation.mutate]);

  // Mark lesson as complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
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
          completed_at: new Date().toISOString(),
          progress_pct: 100,
          last_position_sec: 0,
          is_completed: true
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Mark complete failed:', response.status, errorText);
        const errorData = errorText ? JSON.parse(errorText) : {};
        throw new Error(errorData.error || `Failed to mark lesson as complete (${response.status})`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses', courseId, 'progress'] });
      toast({
        title: 'Lección completada',
        description: 'Has marcado esta lección como completa'
      });
    },
    onError: (error) => {
      console.error('Error marking lesson as complete:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la lección como completa',
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

  // Seleccionar automáticamente la primera lección cuando se cargan las lecciones
  useEffect(() => {
    if (lessons.length > 0 && !currentLessonId) {
      const firstLesson = lessons[0];
      setCurrentLesson(firstLesson.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonIdsString, currentLessonId]);

  // Log de confirmación cuando cambia la lección activa (Paso 3 del prompt)
  useEffect(() => {
    if (!currentLessonId) return;
    const currentLesson = lessons.find(l => l.id === currentLessonId);
    if (currentLesson) {
      console.log('📚 Lección activa ->', currentLesson.title, 
                  'Vimeo ID ->', currentLesson.vimeo_video_id || 'sin video');
    }
  }, [currentLessonId, lessons]);

  // Navigation handlers with useCallback
  const handlePrevious = useCallback(() => {
    if (navigationInfo.prevLesson) {
      setCurrentLesson(navigationInfo.prevLesson.id);
    }
  }, [navigationInfo.prevLesson, setCurrentLesson]);

  const handleNext = useCallback(() => {
    if (navigationInfo.nextLesson) {
      setCurrentLesson(navigationInfo.nextLesson.id);
    }
  }, [navigationInfo.nextLesson, setCurrentLesson]);

  const handleMarkComplete = useCallback(() => {
    if (currentLessonId) {
      markCompleteMutation.mutate(currentLessonId);
    }
  }, [currentLessonId, markCompleteMutation.mutate]);

  // Update navigation state whenever it changes
  useEffect(() => {
    if (onNavigationStateChange) {
      if (currentLessonId && orderedLessons.length > 0) {
        onNavigationStateChange({
          hasPrev: navigationInfo.hasPrev,
          hasNext: navigationInfo.hasNext,
          onPrevious: handlePrevious,
          onNext: handleNext,
          onMarkComplete: handleMarkComplete,
          isMarkingComplete: markCompleteMutation.isPending
        });
      } else {
        onNavigationStateChange(null);
      }
    }
  }, [currentLessonId, navigationInfo.hasPrev, navigationInfo.hasNext, orderedLessons.length, markCompleteMutation.isPending, onNavigationStateChange, handlePrevious, handleNext, handleMarkComplete]);

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
  const currentLesson = lessons.find(l => l.id === currentLessonId);
  
  // Obtener progreso de la lección actual
  const currentProgress = currentLessonId ? progressMap.get(currentLessonId) : null;
  const initialPosition = currentProgress?.last_position_sec || 0;

  return (
    <div className="space-y-6">

      {/* Vimeo Video Player */}
      {currentLesson?.vimeo_video_id ? (
        <div>
          <VimeoPlayer 
            vimeoId={currentLesson.vimeo_video_id}
            initialPosition={initialPosition}
            onProgress={handleVideoProgress}
          />
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{currentLesson.title}</h2>
            {currentLesson.duration_sec && (
              <p className="text-sm text-muted-foreground mt-1">
                Duración: {formatDuration(currentLesson.duration_sec)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 aspect-video flex items-center justify-center">
          <div className="text-center">
            <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              {currentLessonId ? 'Esta lección no tiene video disponible' : 'Selecciona una lección para comenzar'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
