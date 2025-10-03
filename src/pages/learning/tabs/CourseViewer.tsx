import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Play, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCourseSidebarStore } from '@/stores/sidebarStore'
import VimeoPlayer from '@/components/video/VimeoPlayer'

interface CourseViewerProps {
  courseId?: string;
}

export default function CourseViewer({ courseId }: CourseViewerProps) {
  const { setVisible, setData, setCurrentLesson, currentLessonId } = useCourseSidebarStore();
  
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
        .from('lessons')
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

  return (
    <div className="space-y-6 p-6">
      {/* Vimeo Video Player */}
      {currentLesson?.vimeo_video_id ? (
        <div>
          <VimeoPlayer 
            vimeoId={currentLesson.vimeo_video_id}
            onProgress={(sec, pct) => {
              // Aquí podrías guardar el progreso si lo necesitas
              console.log(`Progress: ${sec}s (${pct}%)`);
            }}
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
