import { useEffect } from 'react'
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
import { FileUploader } from '@/components/shared/FileUploader'
import { useCurrentUser } from '@/hooks/use-current-user'

const heroSectionSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  media_url: z.string().optional(),
  media_type: z.enum(['image', 'video']).default('image'),
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
    mode: 'create' | 'edit'
    section?: any
  }
  onClose: () => void
}

export default function HeroSectionForm({ modalData, onClose }: HeroSectionFormProps) {
  const { toast } = useToast()
  const createMutation = useCreateHeroSection()
  const updateMutation = useUpdateHeroSection()
  const { data: userData } = useCurrentUser()

  const mode = modalData?.mode || 'create'
  const section = modalData?.section

  const form = useForm<HeroSectionFormValues>({
    resolver: zodResolver(heroSectionSchema),
    defaultValues: {
      title: '',
      description: '',
      media_url: '',
      media_type: 'image',
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
        media_url: section.media_url || '',
        media_type: section.media_type || 'image',
        primary_button_text: section.primary_button_text || '',
        primary_button_action: section.primary_button_action || '',
        primary_button_action_type: section.primary_button_action_type || 'internal_route',
        secondary_button_text: section.secondary_button_text || '',
        secondary_button_action: section.secondary_button_action || '',
        secondary_button_action_type: section.secondary_button_action_type || 'url',
        is_active: section.is_active ?? true,
      })
    }
  }, [section, form])

  const onSubmit = async (values: HeroSectionFormValues) => {
    try {
      if (mode === 'edit' && section?.id) {
        await updateMutation.mutateAsync({ id: section.id, data: values })
        toast({ title: 'Sección actualizada', description: 'Los cambios se guardaron correctamente' })
      } else {
        await createMutation.mutateAsync({
          ...values,
          section_type: 'learning_dashboard',
        })
        toast({ title: 'Sección creada', description: 'La nueva sección del carrusel se creó correctamente' })
      }
      onClose()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar la sección',
        variant: 'destructive',
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <ModalLayout onClose={onClose} size="lg">
      <ModalHeader
        title={mode === 'edit' ? 'Editar Sección Hero' : 'Nueva Sección Hero'}
        description={mode === 'edit' ? 'Actualiza los detalles de la sección del carrusel' : 'Crea una nueva sección para el carrusel del dashboard'}
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
                name="media_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Media</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-media-type">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="image">Imagen</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
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

              <FormField
                control={form.control}
                name="media_url"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Imagen/Video de Fondo</FormLabel>
                    <FormControl>
                      <FileUploader
                        mode="single"
                        variant="hero"
                        accept={form.watch('media_type') === 'video' ? 'media' : 'images'}
                        heroImageUrl={field.value || null}
                        onHeroImageChange={(url) => field.onChange(url || '')}
                        filesToUpload={[]}
                        onFilesChange={(files) => {
                          if (files[0]?.file) {
                            const url = URL.createObjectURL(files[0].file);
                            field.onChange(url);
                          }
                        }}
                        compressionPreset="course-cover"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        submitText={isPending ? 'Guardando...' : mode === 'edit' ? 'Guardar Cambios' : 'Crear Sección'}
        onSubmit={form.handleSubmit(onSubmit)}
        isSubmitting={isPending}
      />
    </ModalLayout>
  )
}
