import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedAutoSave } from '@/components/save/useDebouncedAutoSave';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, GraduationCap, FileText, BookOpen, Palette, Search } from 'lucide-react';
import { HeroSection, InstructorSection, ModulesSection, LessonsSection } from '@/features/learning';
import type { LandingSections, LandingSection, Course } from '@shared/schema';
import type { ModuleWithLessons } from '@/features/learning';

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

  // Landing sections fields
  const [landingSections, setLandingSections] = useState<LandingSections>({
    instructor: { title: 'SOBRE EL DOCENTE', subtitle: 'NUESTRO CURSO', description: '' },
    modules: { title: 'MÓDULOS Y LECCIONES', subtitle: 'CONTENIDO DEL CURSO', description: 'Contenido estructurado paso a paso para tu aprendizaje profesional' },
    features: undefined,
    faq: undefined,
  });

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

  // Get modules data for preview
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

  // Get lessons data for preview
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

  // Combine modules with lessons for preview
  const modulesWithLessons: ModuleWithLessons[] = useMemo(() => {
    return modules.map((module: any) => {
      const moduleLessons = lessons.filter((lesson: any) => lesson.module_id === module.id);
      const totalDuration = moduleLessons.reduce((sum: number, lesson: any) => {
        return sum + (lesson.duration_sec || 0);
      }, 0);
      
      return {
        ...module,
        lessons: moduleLessons,
        total_duration_min: Math.round(totalDuration / 60)
      };
    });
  }, [modules, lessons]);

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
      
      // Load landing sections
      if (courseData.landing_sections) {
        setLandingSections(courseData.landing_sections as LandingSections);
      }
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

  // Helper functions to update landingSections
  const updateInstructorSection = (field: keyof LandingSection, value: string) => {
    setLandingSections(prev => ({
      ...prev,
      instructor: { ...prev?.instructor, [field]: value }
    }));
  };

  const updateModulesSection = (field: keyof LandingSection, value: string) => {
    setLandingSections(prev => ({
      ...prev,
      modules: { ...prev?.modules, [field]: value }
    }));
  };

  // Helper function to format total duration
  const formatTotalDuration = (lessons: any[]) => {
    const totalMinutes = lessons.reduce((sum, lesson) => sum + (lesson.duration_sec || 0) / 60, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Helper function to calculate total hours
  const calculateTotalHours = (lessons: any[]) => {
    const totalMinutes = lessons.reduce((sum, lesson) => sum + (lesson.duration_sec || 0) / 60, 0);
    return Math.floor(totalMinutes / 60);
  };

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
      og_image_url: ogImageUrl || null,
      landing_sections: landingSections
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
    <div className="w-full space-y-8" data-testid="admin-course-marketing-tab">
      {/* Auto-save indicator */}
      {isSaving && (
        <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Guardando cambios automáticamente...
          </AlertDescription>
        </Alert>
      )}

      {/* SECCIÓN HERO - PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Left Column - Read-only fields */}
        <div className="bg-card border rounded-lg p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-accent flex-shrink-0" />
            <h3 className="text-lg font-semibold">Hero - Sección Principal</h3>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Estos campos se editan desde la pestaña "Datos del Curso"
            </p>
          </div>
          
          <div className="grid gap-4">
            {/* Title field - disabled */}
            <div className="space-y-2">
              <Label htmlFor="hero-title">Título del Curso</Label>
              <Input
                id="hero-title"
                value={courseData?.title || ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </div>
            
            {/* Short description field - disabled */}
            <div className="space-y-2">
              <Label htmlFor="hero-description">Descripción Corta</Label>
              <Textarea
                id="hero-description"
                value={courseData?.short_description || ''}
                disabled
                rows={3}
                className="opacity-60 cursor-not-allowed"
              />
            </div>
            
            {/* Cover URL field - disabled */}
            <div className="space-y-2">
              <Label htmlFor="hero-cover">Imagen de Portada (Cover)</Label>
              <Input
                id="hero-cover"
                value={courseData?.cover_url || ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </div>
            
            {/* Badge text field - disabled (from marketing section) */}
            <div className="space-y-2">
              <Label htmlFor="hero-badge">Texto del Badge</Label>
              <Input
                id="hero-badge"
                value={badgeText || ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </div>
            
            {/* Price field - disabled */}
            <div className="space-y-2">
              <Label htmlFor="hero-price">Precio</Label>
              <Input
                id="hero-price"
                value={courseData?.price ? `$${courseData.price}` : ''}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Right Column - HeroSection preview */}
        <div className="sticky top-24 bg-muted/20 border rounded-lg overflow-hidden lg:col-span-2">
          {courseData && (
            <HeroSection 
              course={{
                ...courseData,
                badge_text: badgeText || courseData.badge_text
              }}
              stats={{
                total_modules: modules?.length || 0,
                total_lessons: lessons?.length || 0,
                total_duration_hours: calculateTotalHours(lessons || []),
                total_duration_formatted: formatTotalDuration(lessons || [])
              }}
            />
          )}
        </div>
      </div>

      {/* SECCIÓN INSTRUCTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          {/* Instructor Data Card */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent flex-shrink-0" />
              <h3 className="text-lg font-semibold">Información del Instructor</h3>
            </div>
            <div>
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

          {/* Instructor Section Header Card */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent flex-shrink-0" />
              <h3 className="text-lg font-semibold">Encabezado de Sección - Instructor</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Personaliza el título y descripción de la sección del instructor
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor-section-title">Título de Sección</Label>
                <Input
                  id="instructor-section-title"
                  value={landingSections?.instructor?.title || ''}
                  onChange={(e) => updateInstructorSection('title', e.target.value)}
                  placeholder="Ej: SOBRE EL DOCENTE"
                  data-testid="input-instructor-section-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor-section-subtitle">Subtítulo de Sección</Label>
                <Input
                  id="instructor-section-subtitle"
                  value={landingSections?.instructor?.subtitle || ''}
                  onChange={(e) => updateInstructorSection('subtitle', e.target.value)}
                  placeholder="Ej: NUESTRO CURSO"
                  data-testid="input-instructor-section-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor-section-description">Descripción de Sección</Label>
                <Textarea
                  id="instructor-section-description"
                  value={landingSections?.instructor?.description || ''}
                  onChange={(e) => updateInstructorSection('description', e.target.value)}
                  placeholder="Descripción opcional de la sección..."
                  rows={2}
                  data-testid="textarea-instructor-section-description"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Preview */}
        <div className="sticky top-24 bg-muted/20 border rounded-lg overflow-hidden lg:col-span-2">
          {courseData && (
            <InstructorSection
              course={{
                ...courseData,
                instructor_name: instructorName,
                instructor_title: instructorTitle,
                instructor_bio: instructorBio,
                instructor_photo_url: instructorPhotoUrl
              } as Course}
              title={landingSections?.instructor?.title}
              subtitle={landingSections?.instructor?.subtitle}
              description={landingSections?.instructor?.description}
            />
          )}
        </div>
      </div>

      {/* SECCIÓN MÓDULOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {/* Modules Section Header Card */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent flex-shrink-0" />
              <h3 className="text-lg font-semibold">Encabezado de Sección - Módulos</h3>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Personaliza el título y descripción de la sección de módulos
              </p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="modules-section-title">Título de Sección</Label>
                <Input
                  id="modules-section-title"
                  value={landingSections?.modules?.title || ''}
                  onChange={(e) => updateModulesSection('title', e.target.value)}
                  placeholder="Ej: MÓDULOS Y LECCIONES"
                  data-testid="input-modules-section-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modules-section-subtitle">Subtítulo de Sección</Label>
                <Input
                  id="modules-section-subtitle"
                  value={landingSections?.modules?.subtitle || ''}
                  onChange={(e) => updateModulesSection('subtitle', e.target.value)}
                  placeholder="Ej: CONTENIDO DEL CURSO"
                  data-testid="input-modules-section-subtitle"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modules-section-description">Descripción de Sección</Label>
                <Textarea
                  id="modules-section-description"
                  value={landingSections?.modules?.description || ''}
                  onChange={(e) => updateModulesSection('description', e.target.value)}
                  placeholder="Ej: Contenido estructurado paso a paso para tu aprendizaje profesional"
                  rows={2}
                  data-testid="textarea-modules-section-description"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modules Preview */}
        <div className="sticky top-24 bg-muted/20 border rounded-lg overflow-hidden lg:col-span-2">
          <ModulesSection
            modules={modulesWithLessons}
            title={landingSections?.modules?.title}
            subtitle={landingSections?.modules?.subtitle}
            description={landingSections?.modules?.description}
          />
        </div>
      </div>

      {/* MARKETING Y SEO (no preview needed) */}
      <div className="space-y-6">
        {/* Marketing Section */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent flex-shrink-0" />
            <h3 className="text-lg font-semibold">Marketing y Presentación</h3>
          </div>
          <div>
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
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-accent flex-shrink-0" />
            <h3 className="text-lg font-semibold">SEO y Redes Sociales</h3>
          </div>
          <div>
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
    </div>
  );
}
