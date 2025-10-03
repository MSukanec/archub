import { useEffect } from 'react'
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

  // Activar el sidebar cuando el componente se monta - DEBE IR ANTES DE LOS RETURNS
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
  }, [modules, lessons]);

  // Seleccionar automáticamente la primera lección cuando se cargan las lecciones
  useEffect(() => {
    if (lessons.length > 0 && !currentLessonId) {
      const firstLesson = lessons[0];
      setCurrentLesson(firstLesson.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons.length, currentLessonId]);

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

          {/* Course Content */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contenido del Curso</h2>
            
            {modules.length === 0 ? (
              <div className="text-center py-8 bg-muted/10 rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">No hay módulos disponibles en este curso</p>
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module, index) => {
                  const moduleLessons = getLessonsForModule(module.id);
                  
                  return (
                    <div key={module.id} className="border rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div className="bg-muted/30 px-4 py-3 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              Módulo {index + 1}: {module.title}
                            </h3>
                            {module.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {module.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {moduleLessons.length} {moduleLessons.length === 1 ? 'lección' : 'lecciones'}
                          </Badge>
                        </div>
                      </div>

                      {/* Module Lessons */}
                      <div className="divide-y">
                        {moduleLessons.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No hay lecciones en este módulo
                          </div>
                        ) : (
                          moduleLessons.map((lesson, lessonIndex) => (
                            <div 
                              key={lesson.id}
                              className="px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                              onClick={() => setCurrentLesson(lesson.id)}
                              data-testid={`lesson-card-${lesson.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                                    <Play className="h-4 w-4 text-[var(--accent)]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {lessonIndex + 1}. {lesson.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDuration(lesson.duration_sec)}
                                      {lesson.free_preview && (
                                        <Badge variant="outline" className="ml-2 text-xs">
                                          Vista previa gratis
                                        </Badge>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {lesson.vimeo_video_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    ID: {lesson.vimeo_video_id}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
    </div>
  )
}
