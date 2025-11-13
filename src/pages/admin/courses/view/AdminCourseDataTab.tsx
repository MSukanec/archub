import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedAutoSave } from '@/components/save/useDebouncedAutoSave';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Save } from 'lucide-react';

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
  const { isSaving } = useDebouncedAutoSave({
    data: {
      title,
      slug,
      short_description: shortDescription,
      cover_url: coverUrl,
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
    <div className="space-y-6 max-w-3xl" data-testid="admin-course-data-tab">
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Save className="h-4 w-4 animate-pulse" />
          <span>Guardando cambios...</span>
        </div>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Nota:</strong> El sistema de precios ahora usa USD como moneda base. 
          Los precios en ARS se convierten automáticamente usando la tabla exchange_rates.
        </AlertDescription>
      </Alert>

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
          <Label htmlFor="cover_url">URL de la Imagen de Portada</Label>
          <Input
            id="cover_url"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://..."
            data-testid="input-course-cover"
          />
        </div>

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
          <p className="text-xs text-muted-foreground mt-1">
            Este precio será convertido automáticamente a ARS usando el tipo de cambio configurado.
          </p>
        </div>
      </div>
    </div>
  );
}
