import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { UserCog, Trash2 } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import DatePickerField from '@/components/ui-custom/fields/DatePickerField'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'

const personnelDataSchema = z.object({
  start_date: z.date().nullable(),
  end_date: z.date().nullable(),
  status: z.enum(['active', 'absent', 'inactive']).nullable(),
  labor_type_id: z.string().nullable(),
  notes: z.string().optional()
}).refine((data) => {
  // Si ambas fechas existen, validar que end_date sea después de start_date
  if (data.start_date && data.end_date) {
    return data.end_date >= data.start_date
  }
  return true
}, {
  message: "La fecha de salida debe ser posterior a la fecha de inicio",
  path: ["end_date"]
})

type PersonnelDataForm = z.infer<typeof personnelDataSchema>

interface PersonnelDataModalProps {
  modalData?: {
    personnelRecord?: any
  }
  onClose: () => void
}

export function PersonnelDataModal({ modalData, onClose }: PersonnelDataModalProps) {
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()
  const queryClient = useQueryClient()
  const personnelRecordId = modalData?.personnelRecord?.id
  const projectId = currentUser?.preferences?.last_project_id

  // Query para obtener los datos FRESCOS del personnel desde la base de datos
  const { data: personnelRecord, isLoading: personnelLoading } = useQuery({
    queryKey: ['personnel-detail', personnelRecordId],
    queryFn: async () => {
      if (!supabase || !personnelRecordId) return null
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          notes,
          start_date,
          end_date,
          status,
          labor_type_id,
          project_id,
          contact:contacts(
            id,
            first_name,
            last_name,
            full_name
          )
        `)
        .eq('id', personnelRecordId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!supabase && !!personnelRecordId
  })

  // Query para obtener labor types
  const { data: laborTypes = [] } = useQuery({
    queryKey: ['labor-types'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('labor_types')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  const form = useForm<PersonnelDataForm>({
    resolver: zodResolver(personnelDataSchema),
    defaultValues: {
      start_date: null,
      end_date: null,
      status: 'active',
      labor_type_id: null,
      notes: ''
    }
  })

  // Actualizar el formulario cuando los datos frescos se carguen
  React.useEffect(() => {
    if (personnelRecord) {
      form.reset({
        start_date: personnelRecord.start_date ? new Date(personnelRecord.start_date) : null,
        end_date: personnelRecord.end_date ? new Date(personnelRecord.end_date) : null,
        status: personnelRecord.status || 'active',
        labor_type_id: personnelRecord.labor_type_id || null,
        notes: personnelRecord.notes || ''
      })
    }
  }, [personnelRecord, form])

  const updatePersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelDataForm) => {
      if (!supabase) throw new Error('Supabase no inicializado')
      if (!personnelRecord?.id) throw new Error('No se encontró el registro de personal')

      const updateData: any = {
        start_date: data.start_date ? data.start_date.toISOString().split('T')[0] : null,
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
        status: data.status,
        labor_type_id: data.labor_type_id,
        notes: data.notes || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('project_personnel')
        .update(updateData)
        .eq('id', personnelRecord.id)

      if (error) throw error
    },
    onSuccess: async () => {
      // Refetch con el mismo patrón de queryKey que usa PersonnelListTab
      // Usar el project_id del personnelRecord para asegurar que coincida
      const invalidateProjectId = personnelRecord?.project_id || projectId
      
      // ESPERAR a que los datos frescos se carguen antes de cerrar el modal
      await queryClient.refetchQueries({ queryKey: ['project-personnel', invalidateProjectId] })
      
      toast({
        title: 'Datos actualizados',
        description: 'La información del personal se ha actualizado correctamente'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating personnel:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la información del personal',
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = (data: PersonnelDataForm) => {
    updatePersonnelMutation.mutate(data)
  }

  const isLoading = updatePersonnelMutation.isPending || personnelLoading

  // Get contact display name
  const contactDisplayName = personnelRecord?.contact?.first_name || personnelRecord?.contact?.last_name
    ? `${personnelRecord.contact.first_name || ''} ${personnelRecord.contact.last_name || ''}`.trim()
    : personnelRecord?.contact?.full_name || 'Sin nombre'

  // Mostrar loading mientras se cargan los datos frescos
  if (personnelLoading) {
    return (
      <FormModalLayout
        columns={1}
        editPanel={
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Cargando datos del personal...</div>
          </div>
        }
        headerContent={
          <FormModalHeader
            title="Editar Datos de Personal"
            description="Modifica la información del personal asignado al proyecto"
            icon={UserCog}
          />
        }
        footerContent={null}
        onClose={onClose}
        isEditing={true}
      />
    )
  }

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Nombre del contacto (solo lectura) */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Personal</p>
          <p className="font-medium">{contactDisplayName}</p>
        </div>

        {/* Fechas - Inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de inicio</FormLabel>
                <FormControl>
                  <DatePickerField
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha de inicio"
                    disableFuture={false}
                    minDate={new Date("1900-01-01")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de salida</FormLabel>
                <FormControl>
                  <DatePickerField
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha de salida"
                    disableFuture={false}
                    minDate={new Date("1900-01-01")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado y Tipo de Mano de Obra - Inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado en obra</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="absent">Ausente</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="labor_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Mano de Obra</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {laborTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agrega notas sobre este personal en el proyecto..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader
      title="Editar Datos de Personal"
      description="Modifica la información del personal asignado al proyecto"
      icon={UserCog}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar Cambios"
      onRightClick={form.handleSubmit(handleSubmit)}
      submitDisabled={isLoading}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}
