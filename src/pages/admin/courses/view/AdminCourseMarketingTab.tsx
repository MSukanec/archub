import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedAutoSave } from '@/components/save/useDebouncedAutoSave';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface AdminCourseMarketingTabProps {
  courseId: string;
}

export default function AdminCourseMarketingTab({ courseId }: AdminCourseMarketingTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Instructor fields
  const [instructorName, setInstructorName] = useState('');
  const [instructorTitle, setInstructorTitle] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  const [instructorPhotoUrl, setInstructorPhotoUrl] = useState('');

  // Marketing fields
  const [badgeText, setBadgeText] = useState('');
  const [highlights, setHighlights] = useState('');
  const [previewVideoId, setPreviewVideoId] = useState('');

  // SEO fields
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');

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
      setInstructorName(courseData.instructor_name || '');
      setInstructorTitle(courseData.instructor_title || '');
      setInstructorBio(courseData.instructor_bio || '');
      setInstructorPhotoUrl(courseData.instructor_photo_url || '');
      setBadgeText(courseData.badge_text || '');
      setHighlights(Array.isArray(courseData.highlights) ? courseData.highlights.join(', ') : '');
      setPreviewVideoId(courseData.preview_video_id || '');
      setSeoKeywords(Array.isArray(courseData.seo_keywords) ? courseData.seo_keywords.join(', ') : '');
      setOgImageUrl(courseData.og_image_url || '');
    }
  }, [courseData]);

  // Auto-save mutation
  const saveMarketingDataMutation = useMutation({
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
        description: "Los datos de marketing se han guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error in saveMarketingDataMutation:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios de marketing",
        variant: "destructive"
      });
    }
  });

  // Auto-save hook
  const { isSaving } = useDebouncedAutoSave({
    data: {
      instructor_name: instructorName || null,
      instructor_title: instructorTitle || null,
      instructor_bio: instructorBio || null,
      instructor_photo_url: instructorPhotoUrl || null,
      badge_text: badgeText || null,
      highlights: highlights 
        ? highlights.split(',').map(h => h.trim()).filter(Boolean)
        : null,
      preview_video_id: previewVideoId || null,
      seo_keywords: seoKeywords
        ? seoKeywords.split(',').map(k => k.trim()).filter(Boolean)
        : null,
      og_image_url: ogImageUrl || null
    },
    saveFn: async (dataToSave) => {
      return new Promise<void>((resolve, reject) => {
        saveMarketingDataMutation.mutate(dataToSave, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      });
    },
    delay: 1000,
    enabled: !!courseData
  });

  return (
    <div className="space-y-6 max-w-3xl" data-testid="admin-course-marketing-tab">
      {/* Auto-save indicator */}
      {isSaving && (
        <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Guardando cambios automáticamente...
          </AlertDescription>
        </Alert>
      )}

      {/* Instructor Section */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">🎓 Información del Instructor</h3>
          <p className="text-sm text-muted-foreground">
            Datos del instructor que se mostrarán en la página de landing del curso
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructor-name">Nombre del Instructor</Label>
            <Input
              id="instructor-name"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              data-testid="input-instructor-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor-title">Título/Cargo</Label>
            <Input
              id="instructor-title"
              value={instructorTitle}
              onChange={(e) => setInstructorTitle(e.target.value)}
              placeholder="Ej: Arquitecto Senior, Especialista en BIM"
              data-testid="input-instructor-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor-bio">Biografía del Instructor</Label>
            <Textarea
              id="instructor-bio"
              value={instructorBio}
              onChange={(e) => setInstructorBio(e.target.value)}
              placeholder="Descripción breve del instructor, su experiencia y credenciales..."
              rows={4}
              data-testid="textarea-instructor-bio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor-photo">URL de Foto del Instructor</Label>
            <Input
              id="instructor-photo"
              value={instructorPhotoUrl}
              onChange={(e) => setInstructorPhotoUrl(e.target.value)}
              placeholder="https://ejemplo.com/foto-instructor.jpg"
              data-testid="input-instructor-photo"
            />
          </div>
        </div>
      </div>

      {/* Marketing Section */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">🎨 Marketing y Presentación</h3>
          <p className="text-sm text-muted-foreground">
            Elementos visuales y de marketing para la página de landing
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="badge-text">Texto del Badge</Label>
            <Input
              id="badge-text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              placeholder="Ej: BESTSELLER, NUEVO, DESTACADO"
              data-testid="input-badge-text"
            />
            <p className="text-xs text-muted-foreground">
              Badge que aparece en la esquina superior de la portada del curso
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="highlights">Puntos Destacados (Highlights)</Label>
            <Textarea
              id="highlights"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="Aprende desde cero, Certificación incluida, Acceso de por vida"
              rows={3}
              data-testid="textarea-highlights"
            />
            <p className="text-xs text-muted-foreground">
              Separa cada punto con una coma (,). Estos se mostrarán como viñetas en la landing.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview-video">ID de Video Preview (Vimeo)</Label>
            <Input
              id="preview-video"
              value={previewVideoId}
              onChange={(e) => setPreviewVideoId(e.target.value)}
              placeholder="123456789"
              data-testid="input-preview-video"
            />
            <p className="text-xs text-muted-foreground">
              Solo el ID numérico del video de Vimeo (ejemplo: de https://vimeo.com/123456789 usar 123456789)
            </p>
          </div>
        </div>
      </div>

      {/* SEO Section */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">🔍 SEO y Redes Sociales</h3>
          <p className="text-sm text-muted-foreground">
            Optimización para motores de búsqueda y vista previa en redes sociales
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo-keywords">Palabras Clave SEO (Keywords)</Label>
            <Textarea
              id="seo-keywords"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="archicad, curso archicad, bim, modelado 3d, arquitectura"
              rows={2}
              data-testid="textarea-seo-keywords"
            />
            <p className="text-xs text-muted-foreground">
              Separa cada palabra clave con una coma (,). Estas keywords ayudan al posicionamiento en Google.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="og-image">Imagen Open Graph (OG Image)</Label>
            <Input
              id="og-image"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/og-image-curso.jpg"
              data-testid="input-og-image"
            />
            <p className="text-xs text-muted-foreground">
              Imagen que se muestra al compartir el curso en Facebook, Twitter, LinkedIn, etc. (Recomendado: 1200x630px)
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los cambios se guardan automáticamente. Estos datos se utilizan para generar la página de landing pública del curso en <code className="text-xs bg-muted px-1 py-0.5 rounded">/cursos/{'{'}slug{'}'}</code>
        </AlertDescription>
      </Alert>
    </div>
  );
}
