import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, FileText, Eye } from 'lucide-react'

interface CourseDataTabProps {
  courseId?: string;
}

export default function CourseDataTab({ courseId }: CourseDataTabProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  // Auto-save mutation for course data
  const saveCourseDataMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!courseId || !supabase) return;

      const { error } = await supabase
        .from('courses')
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) {
        console.error('Error saving course data:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
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
    </div>
  )
}
