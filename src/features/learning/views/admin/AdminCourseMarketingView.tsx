import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, GraduationCap, FileText, Palette, Search, HelpCircle, Plus, Pencil, Trash2, Upload, Users, X, Loader2 } from 'lucide-react';
import { CourseFaqFormModal } from '@/features/learning/modals/admin/CourseFaqFormModal';
import { uploadFile } from '@/lib/storage';
import type { LandingSections, LandingSection, CourseFaq } from '@shared/schema';
interface ClientGalleryImage {
  id: string;
  file_url: string;
  file_name: string;
  media_file_id: string;
}
interface AdminCourseMarketingTabProps {
  courseId: string;
}
export default function AdminCourseMarketingTab({ courseId }: AdminCourseMarketingTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHydrated, setIsHydrated] = useState(false);
  const [instructorName, setInstructorName] = useState('');
  const [instructorTitle, setInstructorTitle] = useState('');
  const [instructorBio, setInstructorBio] = useState('');
  const [instructorPhotoUrl, setInstructorPhotoUrl] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [previewVideoId, setPreviewVideoId] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [landingSections, setLandingSections] = useState<LandingSections>({
    instructor: { title: 'SOBRE EL DOCENTE', subtitle: 'NUESTRO CURSO', description: ''},
    modules: { title: 'MÓDULOS Y LECCIONES', subtitle: 'CONTENIDO DEL CURSO', description: 'Contenido estructurado paso a paso para tu aprendizaje profesional'},
    faq: { title: 'PREGUNTAS FRECUENTES', subtitle: 'DUDAS COMUNES', description: 'Resolvemos tus dudas sobre el curso'},
  });
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<CourseFaq | null>(null);
  
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
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
  const { data: faqs = [] } = useQuery<CourseFaq[]>({
    queryKey: ['course-faqs', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      const { data, error } = await supabase
        .from('course_faqs')
        .select('*')
        .eq('course_id', courseId)
        .order('sort_index', { ascending: true });
      if (error) {
        console.error('Error fetching FAQs:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!courseId && !!supabase
  });
  const { data: clientGalleryImages = [] } = useQuery<ClientGalleryImage[]>({
    queryKey: ['course-client-gallery', courseId],
    queryFn: async () => {
      if (!courseId || !supabase) return [];
      const { data, error } = await supabase
        .from('media_links')
        .select(`
          id,
          media_file_id,
          media_files!inner (
            id,
            file_url,
            file_name,
            is_deleted
          )
        `)
        .eq('course_id', courseId)
        .eq('category', 'client_gallery')
        .eq('media_files.is_deleted', false)
        .order('created_at', { ascending: true });
      if (error) {
        console.error('Error fetching client gallery:', error);
        return [];
      }
      return (data || []).map((item: any) => ({
        id: item.id,
        media_file_id: item.media_file_id,
        file_url: item.media_files.file_url,
        file_name: item.media_files.file_name
      }));
    },
    enabled: !!courseId && !!supabase
  });
  useEffect(() => {
    if (courseData) {
      setInstructorName(courseData.instructor_name || '');
      setInstructorTitle(courseData.instructor_title || '');
      setInstructorBio(courseData.instructor_bio || '');
      setInstructorPhotoUrl(courseData.instructor_photo_url || '');
      setBadgeText(courseData.badge_text || '');
      setPreviewVideoId(courseData.preview_video_id || '');
      setSeoKeywords(Array.isArray(courseData.seo_keywords) ? courseData.seo_keywords.join(', ') : '');
      setOgImageUrl(courseData.og_image_url || '');
      
      if (courseData.landing_sections) {
        const sections = courseData.landing_sections as LandingSections | undefined;
        setLandingSections({
          instructor: sections?.instructor || { title: 'SOBRE EL DOCENTE', subtitle: 'NUESTRO CURSO', description: ''},
          modules: sections?.modules || { title: 'MÓDULOS Y LECCIONES', subtitle: 'CONTENIDO DEL CURSO', description: 'Contenido estructurado paso a paso para tu aprendizaje profesional'},
          faq: sections?.faq || { title: 'PREGUNTAS FRECUENTES', subtitle: 'DUDAS COMUNES', description: 'Resolvemos tus dudas sobre el curso'}
        });
      }
      
      setIsHydrated(true);
    }
  }, [courseData]);
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
  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      const { deleteCourseFaq } = await import('@/features/learning');
      return deleteCourseFaq(faqId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-faqs', courseId] });
      queryClient.invalidateQueries({ queryKey: ['course-landing'] });
      toast({
        title: "FAQ eliminada",
        description: "La pregunta frecuente se eliminó correctamente"
      });
    },
    onError: (error: any) => {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la FAQ",
        variant: "destructive"
      });
    }
  });
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
  const updateFaqSection = (field: keyof LandingSection, value: string) => {
    setLandingSections(prev => ({
      ...prev,
      faq: { ...prev?.faq, [field]: value }
    }));
  };
  const handleOpenFaqModal = (faq?: CourseFaq) => {
    setSelectedFaq(faq || null);
    setIsFaqModalOpen(true);
  };
  const handleCloseFaqModal = () => {
    setSelectedFaq(null);
    setIsFaqModalOpen(false);
  };
  const handleDeleteFaq = async (faqId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta FAQ?')) {
      await deleteFaqMutation.mutateAsync(faqId);
    }
  };
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingGallery(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} no es una imagen válida`);
        }
        
        return uploadFile(file, {
          entity: 'course_client_gallery',
          course_id: courseId,
          link_to: {
            course_id: courseId
          },
          category: 'client_gallery',
          description: file.name
        });
      });
      await Promise.all(uploadPromises);
      
      queryClient.invalidateQueries({ queryKey: ['course-client-gallery', courseId] });
      toast({
        title: "Imágenes subidas",
        description: `Se subieron ${files.length} imagen(es) a la galería de clientes`
      });
    } catch (error: any) {
      console.error('Error uploading gallery images:', error);
      toast({
        title: "Error al subir",
        description: error.message || "No se pudieron subir las imágenes",
        variant: "destructive"
      });
    } finally {
      setIsUploadingGallery(false);
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };
  const handleDeleteGalleryImage = async (mediaFileId: string) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('media_files')
        .update({ is_deleted: true })
        .eq('id', mediaFileId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['course-client-gallery', courseId] });
      toast({
        title: "Imagen eliminada",
        description: "La imagen se eliminó de la galería"
      });
    } catch (error: any) {
      console.error('Error deleting gallery image:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la imagen",
        variant: "destructive"
      });
    }
  };
  const { isSaving } = useAutoSave({
    data: {
      instructor_name: instructorName || null,
      instructor_title: instructorTitle || null,
      instructor_bio: instructorBio || null,
      instructor_photo_url: instructorPhotoUrl || null,
      badge_text: badgeText || null,
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
    enabled: !!courseData && isHydrated
  });
  return (
    <div className="w-full space-y-6" data-testid="admin-course-marketing-tab">
      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 animate-pulse" />
          <span>Guardando cambios...</span>
        </div>
      )}
      {/* INSTRUCTOR */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-accent flex-shrink-0" />
          <h3 className="text-lg font-semibold">Información del Instructor</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="instructor-bio">Biografía del Instructor</Label>
            <Textarea
              id="instructor-bio"
              value={instructorBio}
              onChange={(e) => setInstructorBio(e.target.value)}
              placeholder="Descripción breve del instructor, su experiencia y credenciales..."
              rows={3}
              data-testid="textarea-instructor-bio"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
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
      {/* DESCRIPCIONES DE SECCIONES */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent flex-shrink-0" />
          <h3 className="text-lg font-semibold">Descripciones de Secciones</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Personaliza las descripciones de cada sección de la landing
        </p>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructor-section-description">Descripción - Sección Instructor</Label>
            <Textarea
              id="instructor-section-description"
              value={landingSections?.instructor?.description || ''}
              onChange={(e) => updateInstructorSection('description', e.target.value)}
              placeholder="Descripción opcional de la sección del instructor..."
              rows={2}
              data-testid="textarea-instructor-section-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modules-section-description">Descripción - Sección Módulos</Label>
            <Textarea
              id="modules-section-description"
              value={landingSections?.modules?.description || ''}
              onChange={(e) => updateModulesSection('description', e.target.value)}
              placeholder="Ej: Contenido estructurado paso a paso para tu aprendizaje profesional"
              rows={2}
              data-testid="textarea-modules-section-description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-section-description">Descripción - Sección FAQs</Label>
            <Textarea
              id="faq-section-description"
              value={landingSections?.faq?.description || ''}
              onChange={(e) => updateFaqSection('description', e.target.value)}
              placeholder="Ej: Resolvemos tus dudas sobre el curso"
              rows={2}
              data-testid="textarea-faq-section-description"
            />
          </div>
        </div>
      </div>
      {/* MARKETING */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-accent flex-shrink-0" />
          <h3 className="text-lg font-semibold">Marketing y Presentación</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
              Badge en la esquina superior de la portada
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
              Solo el ID numérico del video de Vimeo
            </p>
          </div>
        </div>
      </div>
      {/* SEO */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-accent flex-shrink-0" />
          <h3 className="text-lg font-semibold">SEO y Redes Sociales</h3>
        </div>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo-keywords">Palabras Clave SEO</Label>
            <Textarea
              id="seo-keywords"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="archicad, curso archicad, bim, modelado 3d, arquitectura"
              rows={2}
              data-testid="textarea-seo-keywords"
            />
            <p className="text-xs text-muted-foreground">
              Separa cada palabra clave con una coma
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-image">Imagen Open Graph</Label>
            <Input
              id="og-image"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/og-image-curso.jpg"
              data-testid="input-og-image"
            />
            <p className="text-xs text-muted-foreground">
              Imagen al compartir en redes sociales (1200x630px recomendado)
            </p>
          </div>
        </div>
      </div>
      {/* GALERÍA DE CLIENTES */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent flex-shrink-0" />
            <h3 className="text-lg font-semibold">Galería de Clientes</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
              id="gallery-upload"
              data-testid="input-gallery-upload"
            />
            <Button
              onClick={() => galleryInputRef.current?.click()}
              size="sm"
              disabled={isUploadingGallery}
              data-testid="button-upload-gallery"
            >
              {isUploadingGallery ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1" />
              )}
              {isUploadingGallery ? 'Subiendo...': 'Subir Imágenes'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Imágenes de clientes que se mostrarán en un carrusel en la landing del curso
        </p>
        {clientGalleryImages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay imágenes en la galería. Haz clic en "Subir Imágenes" para agregar.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {clientGalleryImages.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border"
                data-testid={`gallery-image-${image.id}`}
              >
                <img
                  src={image.file_url}
                  alt={image.file_name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteGalleryImage(image.media_file_id)}
                  data-testid={`button-delete-gallery-${image.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* FAQs */}
      <div className="bg-card border rounded-lg p-6 space-y-4 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-accent flex-shrink-0" />
            <h3 className="text-lg font-semibold">Preguntas Frecuentes</h3>
          </div>
          <Button
            onClick={() => handleOpenFaqModal()}
            size="sm"
            data-testid="button-add-faq"
          >
            <Plus className="w-4 h-4 mr-1" />
            Agregar FAQ
          </Button>
        </div>
        <div className="space-y-2 overflow-hidden">
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay FAQs creadas. Haz clic en "Agregar FAQ" para crear una.
            </p>
          ) : (
            <div className="space-y-2">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="flex items-start justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`faq-item-${faq.id}`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-sm line-clamp-1">{faq.question}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenFaqModal(faq)}
                      data-testid={`button-edit-faq-${faq.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteFaq(faq.id)}
                      data-testid={`button-delete-faq-${faq.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Help */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Los cambios se guardan automáticamente. Estos datos se utilizan para generar la página de landing pública del curso.
        </AlertDescription>
      </Alert>
      {/* FAQ Modal */}
      <CourseFaqFormModal
        isOpen={isFaqModalOpen}
        onClose={handleCloseFaqModal}
        courseId={courseId}
        faq={selectedFaq}
      />
    </div>
  );
}
