import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useCreateChangelogEntry } from '@/hooks/use-changelog'
import { useCurrentUser } from '@/hooks/use-current-user'

const changelogEntrySchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['Novedad', 'Mejora', 'Arreglo de Errores'], {
    required_error: 'El tipo es requerido'
  }),
  date: z.string().min(1, 'La fecha es requerida'),
  is_public: z.boolean().default(true),
})

type ChangelogEntryFormData = z.infer<typeof changelogEntrySchema>

interface NewChangelogEntryModalProps {
  onClose: () => void
  editingEntry?: any
}

export function NewChangelogEntryModal({ onClose, editingEntry }: NewChangelogEntryModalProps) {
  const { data: userData } = useCurrentUser()
  const createMutation = useCreateChangelogEntry()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChangelogEntryFormData>({
    resolver: zodResolver(changelogEntrySchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'Novedad',
      date: new Date().toLocaleDateString('en-CA'), // Today's date in local timezone (YYYY-MM-DD format)
      is_public: true,
    }
  })

  const watchedType = watch('type')
  const watchedIsPublic = watch('is_public')

  // Load existing data if editing
  useEffect(() => {
    if (editingEntry) {
      reset({
        title: editingEntry.title || '',
        description: editingEntry.description || '',
        type: editingEntry.type || 'Novedad',
        date: editingEntry.date ? new Date(editingEntry.date).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'),
        is_public: editingEntry.is_public ?? true,
      })
    }
  }, [editingEntry, reset])

  const onSubmit = async (data: ChangelogEntryFormData) => {
    if (!userData?.user?.id) {
      console.error('No user ID available')
      return
    }

    try {
      await createMutation.mutateAsync({
        ...data,
        created_by: userData.user.id,
      })
      onClose()
    } catch (error) {
      console.error('Error creating changelog entry:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <CustomModalLayout
      open={true}
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader
            title={editingEntry ? "Editar Entrada" : "Nueva Entrada del Changelog"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody>
            <form id="changelog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Title - Full width */}
                <div className="col-span-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Título de la entrada..."
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                  )}
                </div>

                {/* Type - Half width */}
                <div className="col-span-1">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select 
                    value={watchedType} 
                    onValueChange={(value) => setValue('type', value as any)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Novedad">🔹 Novedad</SelectItem>
                      <SelectItem value="Mejora">🔧 Mejora</SelectItem>
                      <SelectItem value="Arreglo de Errores">🐛 Arreglo de Errores</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
                  )}
                </div>

                {/* Date - Half width */}
                <div className="col-span-1">
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive mt-1">{errors.date.message}</p>
                  )}
                </div>

                {/* Description - Full width */}
                <div className="col-span-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe el cambio o novedad..."
                    rows={4}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Public Switch - Full width */}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_public"
                      checked={watchedIsPublic}
                      onCheckedChange={(checked) => setValue('is_public', checked)}
                    />
                    <Label htmlFor="is_public" className="text-sm font-normal">
                      Hacer pública esta entrada
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Las entradas públicas aparecerán en el changelog de la comunidad
                  </p>
                </div>

              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            submitText={editingEntry ? "Actualizar" : "Crear Entrada"}
            saveLoading={isSubmitting}
            form="changelog-form"
          />
        )
      }}
    />
  )
}