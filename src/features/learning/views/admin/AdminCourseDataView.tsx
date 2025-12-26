import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { FileText, DollarSign, Save } from 'lucide-react';
import { CourseHeroImageUpload } from '@/features/learning/components';
interface AdminCourseDataTabProps {
  courseId: string;
}
export default function AdminCourseDataTab({ courseId }: AdminCourseDataTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [price, setPrice] = useState('');
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
  // Load course data into form when available
  useEffect(() => {
    if (courseData) {
      setTitle(courseData.title || '');
      setSlug(courseData.slug || '');
      setShortDescription(courseData.short_description || '');
      setCoverUrl(courseData.cover_url || '');
      setPrice(courseData.price?.toString() || '0');
    }
  }, [courseData]);
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
  const { isSaving } = useAutoSave({
    data: {
      title,
      slug,
      short_description: shortDescription,
      price: parseFloat(price) || 0
    },
    saveFn: async (dataToSave) => {
      return new Promise<void>((resolve, reject) => {
        saveCourseDataMutation.mutate(dataToSave, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
    },
    delay: 1000,
    enabled: !!courseData
  });
  return (
    <div className="p-6 space-y-8" data-testid="admin-course-data-tab">
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Save className="h-4 w-4 animate-pulse" />
          <span>Guardando cambios...</span>
        </div>
      )}
      {/* Sección: Información Básica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Información Básica</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configura los datos fundamentales del curso como título, URL amigable, descripción y la imagen de portada que se mostrará en las listas y landing pages.
          </p>
        </div>
        {/* Right Column - Contenido */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título del Curso</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del curso"
              data-testid="input-course-title"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug (URL amigable)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="curso-ejemplo"
              data-testid="input-course-slug"
            />
          </div>
          <div>
            <Label htmlFor="short_description">Descripción Corta</Label>
            <Textarea
              id="short_description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Descripción breve del curso"
              rows={3}
              data-testid="textarea-course-description"
            />
          </div>
          <div>
            <Label>Imagen de Portada</Label>
            <CourseHeroImageUpload
              key={coverUrl || 'no-image'}
              courseId={courseId}
              currentImageUrl={coverUrl}
              onImageUpdate={(url) => setCoverUrl(url || '')}
            />
          </div>
        </div>
      </div>
      {/* Sección: Precio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Descripción */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-[var(--accent)]" />
            <h2 className="text-lg font-semibold">Precio</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Define el precio del curso en USD. El sistema lo convertirá automáticamente a otras monedas según los tipos de cambio configurados.
          </p>
        </div>
        {/* Right Column - Contenido */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Precio (USD)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="99.99"
              data-testid="input-course-price"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
