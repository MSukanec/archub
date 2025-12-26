import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Layers } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
import { useCreateHeroSection, useUpdateHeroSection } from '../hooks/use-hero-sections'
import { useToast } from '@/hooks/use-toast'
import { FileUploader } from '@/components/shared/fields/FileUploader'
import { uploadFile } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
const heroSectionSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  primary_button_text: z.string().optional(),
  primary_button_action: z.string().optional(),
  primary_button_action_type: z.enum(['url', 'internal_route', 'external']).default('internal_route'),
  secondary_button_text: z.string().optional(),
  secondary_button_action: z.string().optional(),
  secondary_button_action_type: z.enum(['url', 'internal_route', 'external']).default('url'),
  is_active: z.boolean().default(true),
})
type HeroSectionFormValues = z.infer<typeof heroSectionSchema>
interface HeroSectionFormProps {
  modalData?: {
    mode: 'create'| 'edit'
    section?: any
  }
  onClose: () => void
}
export default function HeroSectionForm({ modalData, onClose }: HeroSectionFormProps) {
  const { toast } = useToast()
  const createMutation = useCreateHeroSection()
  const updateMutation = useUpdateHeroSection()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [imageWasRemoved, setImageWasRemoved] = useState(false)
  const mode = modalData?.mode || 'create'
  const section = modalData?.section
  const form = useForm<HeroSectionFormValues>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: {
      title: '',
      description: '',
      primary_button_text: '',
      primary_button_action: '',
      primary_button_action_type: 'internal_route',
      secondary_button_text: '',
      secondary_button_action: '',
      secondary_button_action_type: 'url',
      is_active: true,
    },
  })
  useEffect(() => {
    if (section) {
      form.reset({
        title: section.title || '',
        description: section.description || '',
        primary_button_text: section.primary_button_text || '',
        primary_button_action: section.primary_button_action || '',
        primary_button_action_type: section.primary_button_action_type || 'internal_route',
        secondary_button_text: section.secondary_button_text || '',
        secondary_button_action: section.secondary_button_action || '',
        secondary_button_action_type: section.secondary_button_action_type || 'url',
        is_active: section.is_active ?? true,
      })
      if (section.media_url) {
        setPreviewUrl(section.media_url)
      }
    }
  }, [section, form])
  const onSubmit = async (values: HeroSectionFormValues) => {
    try {
      setIsUploading(true)
      if (mode === 'edit'&& section?.id) {
        await updateMutation.mutateAsync({ id: section.id, data: values })
        
        if (imageWasRemoved && !pendingFile) {
          const { data: links } = await supabase
            .from('media_links')
            .select('media_file_id')
            .eq('hero_section_id', section.id)
          
          if (links && links.length > 0) {
            const fileIds = links.map(l => l.media_file_id)
            await supabase
              .from('media_files')
              .update({ is_deleted: true, updated_at: new Date().toISOString() })
              .in('id', fileIds)
          }
        }
        
        if (pendingFile) {
          await uploadFile(pendingFile, {
            entity: 'hero_section_media',
            link_to: { hero_section_id: section.id },
            is_cover: true,
          })
        }
        
        toast({ title: 'Sección actualizada', description: 'Los cambios se guardaron correctamente'})
      } else {
        console.log('[HeroSectionForm] Creating new section with values:', values)
        const newSection = await createMutation.mutateAsync({
          ...values,
          section_type: 'learning_dashboard',
        })
        console.log('[HeroSectionForm] New section created:', newSection)
        
        if (pendingFile && newSection?.id) {
          console.log('[HeroSectionForm] Uploading file for section:', newSection.id)
          await uploadFile(pendingFile, {
            entity: 'hero_section_media',
            link_to: { hero_section_id: newSection.id },
            is_cover: true,
          })
          console.log('[HeroSectionForm] File uploaded successfully')
        }
        
        toast({ title: 'Sección creada', description: 'La nueva sección del carrusel se creó correctamente'})
      }
      onClose()
    } catch (error: any) {
      console.error('[HeroSectionForm] Error:', error?.message, error?.stack, error)
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo guardar la sección',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }
  const handleFileChange = (files: Array<{ file: File; preview?: string }>) => {
    if (files[0]?.file) {
      setPendingFile(files[0].file)
      const objectUrl = URL.createObjectURL(files[0].file)
      setPreviewUrl(objectUrl)
      setImageWasRemoved(false)
    }
  }
  const handleRemoveImage = () => {
    setPendingFile(null)
    setPreviewUrl(null)
    setImageWasRemoved(true)
  }
  const isPending = createMutation.isPending || updateMutation.isPending || isUploading
  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={mode === 'edit'? 'Editar Sección Hero': 'Nueva Sección Hero'}
        description={mode === 'edit'? 'Actualiza los detalles de la sección del carrusel': 'Crea una nueva sección para el carrusel del dashboard'}
        icon={Layers}
      />
      <ModalBody>
        <Form {...form}>
          <form id="hero-section-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título del hero" {...field} data-testid="input-hero-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción breve que aparecerá debajo del título" 
                        {...field} 
                        data-testid="input-hero-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Activo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="col-span-full">
                <FormLabel>Imagen de Fondo</FormLabel>
                <div className="mt-2">
                  <FileUploader
                    mode="single"
                    variant="hero"
                    accept="images"
                    heroImageUrl={previewUrl}
                    onHeroImageChange={(url) => {
                      if (!url) handleRemoveImage()
                    }}
                    filesToUpload={[]}
                    onFilesChange={handleFileChange}
                    compressionPreset="course-cover"
                    isUploading={isUploading}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Botón Primario (Opcional)</h4>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <FormField
                  control={form.control}
                  name="primary_button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ver Curso" {...field} data-testid="input-primary-button-text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primary_button_action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acción/URL</FormLabel>
                      <FormControl>
                        <Input placeholder="/learning/courses/mi-curso" {...field} data-testid="input-primary-button-action" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primary_button_action_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-primary-action-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal_route">Ruta Interna</SelectItem>
                          <SelectItem value="external">Link Externo</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Botón Secundario (Opcional)</h4>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
                <FormField
                  control={form.control}
                  name="secondary_button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto</FormLabel>
                      <FormControl>
                        <Input placeholder="Contáctanos" {...field} data-testid="input-secondary-button-text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondary_button_action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Acción/URL</FormLabel>
                      <FormControl>
                        <Input placeholder="/contacto" {...field} data-testid="input-secondary-button-action" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondary_button_action_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-secondary-action-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal_route">Ruta Interna</SelectItem>
                          <SelectItem value="external">Link Externo</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </ModalBody>
      <ModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        submitText={isPending ? 'Guardando...': mode === 'edit'? 'Guardar Cambios': 'Crear Sección'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  )
}
