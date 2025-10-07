import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, FileText, Play, List, TrendingUp } from 'lucide-react'
import { useCourseSidebarStore } from '@/stores/sidebarStore'

interface CourseDataTabProps {
  courseId?: string;
}

export default function CourseDataTab({ courseId }: CourseDataTabProps) {
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

  // Calculate course statistics
  const courseStats = useMemo(() => {
    const totalLessons = lessons.length;
    const completedLessons = courseProgress.filter((p: any) => p.is_completed).length;
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    return {
      totalLessons,
      completedLessons,
      overallProgress
    };
  }, [lessons, courseProgress]);

  // Helper functions
  const getLessonsForModule = (moduleId: string) => {
    return lessons.filter(lesson => lesson.module_id === moduleId);
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
      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--accent)' }} />
            Progreso del Curso
          </CardTitle>
          <CardDescription>
            {courseStats.overallProgress}% del curso completado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">0%</span>
              <span className="font-bold text-lg">{courseStats.overallProgress}%</span>
              <span className="text-muted-foreground">100%</span>
            </div>
            <Progress value={courseStats.overallProgress} className="h-4 bg-gray-200" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{courseStats.completedLessons}</div>
                <div className="text-xs text-muted-foreground">Lecciones completadas</div>
              </div>
              <div className="text-center border-l">
                <div className="text-3xl font-bold">{courseStats.totalLessons}</div>
                <div className="text-xs text-muted-foreground">Total de lecciones</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout - Section descriptions left, content right */}
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

      <hr className="border-t border-[var(--section-divider)] my-8" />

      {/* Course Content Section */}
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
                        moduleLessons.map((lesson, lessonIndex) => (
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
                                <p className="text-sm font-medium">
                                  {lessonIndex + 1}. {lesson.title} · {formatDuration(lesson.duration_sec)}
                                  {lesson.free_preview && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Vista previa gratis
                                    </Badge>
                                  )}
                                </p>
                              </div>
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
    </div>
  )
}
