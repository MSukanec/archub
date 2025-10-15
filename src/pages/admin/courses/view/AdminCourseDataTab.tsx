import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Eye, Play, List } from 'lucide-react'
import { useCourseSidebarStore } from '@/stores/sidebarStore'

interface AdminCourseDataTabProps {
  courseId?: string;
}

export default function AdminCourseDataTab({ courseId }: AdminCourseDataTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { setCurrentLesson } = useCourseSidebarStore()

  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [longDescription, setLongDescription] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [isActive, setIsActive] = useState(true)

  // Get course data
  const { data: courseData } = useQuery({
    queryKey: ['/api/admin/courses', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return null;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: !!courseId && !!supabase
  });

  // Get course modules
  const { data: modules = [] } = useQuery({
    queryKey: ['/api/admin/modules', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const res = await fetch(`/api/admin/modules?course_id=${courseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch modules');
      return res.json();
    },
    enabled: !!courseId && !!supabase
  });

  // Get lessons
  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/admin/lessons', courseId],
    queryFn: async () => {
      if (!courseId || !supabase || modules.length === 0) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const allLessons: any[] = [];
      
      for (const module of modules) {
        const res = await fetch(`/api/admin/lessons?module_id=${module.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include'
        });

        if (res.ok) {
          const moduleLessons = await res.json();
          allLessons.push(...moduleLessons);
        }
      }

      return allLessons;
    },
    enabled: !!courseId && !!supabase && modules.length > 0
  });

  // Auto-save mutation for course data
  const saveCourseDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!courseId || !supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Failed to update course');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses', courseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      toast({
        title: "Cambios guardados",
        description: "Los datos del curso se han guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error in saveCourseDataMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios del curso",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook
  const { isSaving } = useDebouncedAutoSave({
    data: {
      title,
      slug,
      short_description: shortDescription,
      long_description: longDescription,
      cover_url: coverUrl,
      visibility,
      is_active: isActive
    },
    saveFn: (data) => saveCourseDataMutation.mutateAsync(data),
    delay: 1500
  });

  // Load data when course changes or data is fetched
  useEffect(() => {
    if (courseData) {
      setTitle(courseData.title || '');
      setSlug(courseData.slug || '');
      setShortDescription(courseData.short_description || '');
      setLongDescription(courseData.long_description || '');
      setCoverUrl(courseData.cover_url || '');
      setVisibility(courseData.visibility || 'public');
      setIsActive(courseData.is_active ?? true);
    }
  }, [courseData]);

  // Helper functions
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

  return (
    <div className="space-y-6">
      {/* Two Column Layout - Section descriptions left, content right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Información Básica */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Datos fundamentales del curso que se mostrarán a los estudiantes. Estos campos son la base para la visualización y búsqueda del curso.
            {isSaving && <span className="block text-[var(--accent)] mt-2">Guardando...</span>}
          </p>
        </div>

        {/* Right Column - Información Básica Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Título del Curso</Label>
              <Input 
                id="course-title"
                placeholder="Ej: Introducción a la Construcción Sostenible"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-slug">Slug (URL amigable)</Label>
              <Input 
                id="course-slug"
                placeholder="Ej: introduccion-construccion-sostenible"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-description">Descripción Corta</Label>
              <Textarea 
                id="short-description"
                placeholder="Breve descripción del curso (máximo 200 caracteres)..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-url">URL de la Imagen de Portada</Label>
              <Input 
                id="cover-url"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción Detallada */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Descripción Detallada</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Descripción completa del curso que incluye objetivos, contenido, requisitos previos y toda la información relevante para los estudiantes interesados.
          </p>
        </div>

        {/* Right Column - Descripción Detallada Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="long-description">Descripción Completa</Label>
              <Textarea 
                id="long-description"
                placeholder="Descripción detallada del curso, objetivos de aprendizaje, contenido, etc..."
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                rows={8}
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-t border-[var(--section-divider)] my-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Configuración */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Eye className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Configuración de Visibilidad</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Controla quién puede ver y acceder a este curso. Puedes hacer el curso público, privado o mantenerlo como borrador mientras trabajas en él.
          </p>
        </div>

        {/* Right Column - Configuración Content */}
        <div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibilidad</Label>
              <select 
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full h-10 px-3 text-sm border rounded-md"
              >
                <option value="public">Público - Visible para todos</option>
                <option value="private">Privado - Solo usuarios autorizados</option>
                <option value="draft">Borrador - No visible</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is-active">Estado del Curso</Label>
              <select 
                id="is-active"
                value={isActive ? 'active' : 'inactive'}
                onChange={(e) => setIsActive(e.target.value === 'active')}
                className="w-full h-10 px-3 text-sm border rounded-md"
              >
                <option value="active">Activo - Curso disponible</option>
                <option value="inactive">Inactivo - Curso pausado</option>
              </select>
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
              {modules.map((module: any, index: number) => {
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
    </div>
  )
}
