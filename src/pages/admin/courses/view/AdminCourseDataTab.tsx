import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Eye } from 'lucide-react'
import CourseHeroImageUpload from '@/components/learning/CourseHeroImageUpload'

interface AdminCourseDataTabProps {
  courseId?: string;
}

export default function AdminCourseDataTab({ courseId }: AdminCourseDataTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Form states
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDescription, setShortDescription] = useState('')
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
      setCoverUrl(courseData.cover_url || '');
      setVisibility(courseData.visibility || 'public');
      setIsActive(courseData.is_active ?? true);
    }
  }, [courseData]);

  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No hay curso seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Image Section */}
      <CourseHeroImageUpload
        courseId={courseId}
        currentImageUrl={coverUrl}
        onImageUpdate={(url) => setCoverUrl(url || '')}
      />

      <hr className="border-t border-[var(--section-divider)] my-8" />

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
    </div>
  )
}
