import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Play, List, CheckCircle2 } from 'lucide-react'
import { useCourseSidebarStore } from '@/stores/sidebarStore'

interface CourseContentTabProps {
  courseId?: string;
}

export default function CourseContentTab({ courseId }: CourseContentTabProps) {
  const { setCurrentLesson } = useCourseSidebarStore()

  // Get course data
  const { data: courseData } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
        
      if (error) {
        console.error('Error fetching course:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!courseId && !!supabase
  });

  // Get course modules
  const { data: modules = [] } = useQuery({
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

  // Get lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: async () => {
      if (!courseId || !supabase || modules.length === 0) return [];
      
      const moduleIds = modules.map(m => m.id);
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_index', { ascending: true});
        
      if (error) {
        console.error('Error fetching lessons:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!courseId && !!supabase && modules.length > 0
  });

  // Get all progress for the current course
  const { data: courseProgress = [] } = useQuery<any[]>({
    queryKey: ['/api/courses', courseId, 'progress'],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await fetch(`/api/courses/${courseId}/progress`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!courseId && !!supabase,
    staleTime: 0,
    refetchOnMount: 'always'
  });

  // Helper functions
  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter(lesson => lesson.module_id === moduleId);
  }

  const isLessonCompleted = (lessonId: string) => {
    return courseProgress.some((p: any) => p.lesson_id === lessonId && p.is_completed);
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Sin duración';
    const totalMins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    // For module totals (large durations), show hours and minutes
    if (totalMins >= 60) {
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return `${hours} hs ${mins} min`;
    }
    
    // For individual lessons, show MM:SS format
    return `${totalMins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información Básica Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Información Básica */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fundamentales del curso.
          </p>
        </div>

        {/* Right Column - Información Básica Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título del Curso</label>
              <div className="text-sm text-foreground px-3 py-2 bg-muted/30 rounded-md">
                {courseData?.title || '-'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción Corta</label>
              <div className="text-sm text-foreground px-3 py-2 bg-muted/30 rounded-md min-h-[60px]">
                {courseData?.short_description || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Contenido del Curso Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Content Description */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <List className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Contenido del Curso</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Estructura completa del curso organizada en módulos y lecciones. Los módulos agrupan contenido relacionado, mientras que cada lección representa una unidad específica de aprendizaje.
          </p>
        </div>

        {/* Right Column - Content List */}
        <div>
          {modules.length === 0 ? (
            <div className="text-center py-8 bg-muted/10 rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No hay módulos disponibles en este curso</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module, index) => {
                const moduleLessons = getLessonsForModule(module.id);
                const totalModuleDuration = moduleLessons.reduce((acc, lesson) => acc + (lesson.duration_sec || 0), 0);
                
                return (
                  <div key={module.id} className="border rounded-lg overflow-hidden">
                    {/* Module Header */}
                    <div className="bg-muted/30 px-4 py-3 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          Módulo {index + 1}: {module.title}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(totalModuleDuration)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline">
                          {moduleLessons.length} {moduleLessons.length === 1 ? 'lección' : 'lecciones'}
                        </Badge>
                      </div>
                      {module.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {module.description}
                        </p>
                      )}
                    </div>

                    {/* Module Lessons */}
                    <div className="divide-y">
                      {moduleLessons.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                          No hay lecciones en este módulo
                        </div>
                      ) : (
                        moduleLessons.map((lesson, lessonIndex) => {
                          const completed = isLessonCompleted(lesson.id);
                          
                          return (
                            <div 
                              key={lesson.id}
                              className="px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                              onClick={() => setCurrentLesson(lesson.id)}
                              data-testid={`lesson-card-${lesson.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                                  <Play className="h-4 w-4 text-[var(--accent)]" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">
                                      {lessonIndex + 1}. {lesson.title} · {formatDuration(lesson.duration_sec)}
                                    </p>
                                    {completed && (
                                      <CheckCircle2 
                                        className="h-4 w-4 flex-shrink-0" 
                                        style={{ color: 'var(--accent)' }}
                                        data-testid={`completed-badge-${lesson.id}`}
                                      />
                                    )}
                                  </div>
                                  {lesson.free_preview && (
                                    <Badge variant="outline" className="mt-1 text-xs">
                                      Vista previa gratis
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
