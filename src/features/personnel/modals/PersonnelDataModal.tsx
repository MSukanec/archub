import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { UserCog, Trash2 } from 'lucide-react'
import { parseLocalDate, formatDateForDB } from '@/lib/date-utils'

import { FormModalLayout } from '@/components/modal'
import { FormModalHeader } from '@/components/modal'
import { FormModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/features/users/hooks'
import { usePersonnelDetail, useLaborTypes, useUpdatePersonnel } from '@/features/personnel/hooks'

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
  const organizationId = currentUser?.organization?.id

  // Use feature hooks instead of direct Supabase queries
  const { data: personnelRecord, isLoading: personnelLoading } = usePersonnelDetail(personnelRecordId)
  const { data: laborTypes = [] } = useLaborTypes()
  const updatePersonnel = useUpdatePersonnel()

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
        start_date: personnelRecord.start_date ? parseLocalDate(personnelRecord.start_date) : null,
        end_date: personnelRecord.end_date ? parseLocalDate(personnelRecord.end_date) : null,
        status: personnelRecord.status || 'active',
        labor_type_id: personnelRecord.labor_type_id || null,
        notes: personnelRecord.notes || ''
      })
    }
  }, [personnelRecord, form])

  const handleSubmit = async (data: PersonnelDataForm) => {
    if (!personnelRecord?.id || !organizationId) return

    try {
      await updatePersonnel.mutateAsync({
        personnelId: personnelRecord.id,
        data: {
          organization_id: organizationId,
          start_date: data.start_date ? formatDateForDB(data.start_date) : null,
          end_date: data.end_date ? formatDateForDB(data.end_date) : null,
          status: data.status,
          labor_type_id: data.labor_type_id,
          notes: data.notes || '',
        },
      })
      
      const invalidateProjectId = personnelRecord?.project_id || projectId
      await queryClient.refetchQueries({ queryKey: ['personnel', invalidateProjectId] })
      
      onClose()
    } catch (error) {
      console.error('Error updating personnel:', error)
    }
  }

  const isLoading = updatePersonnel.isPending || personnelLoading

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
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Seleccionar fecha de inicio"
                          value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                          className="pr-10 cursor-pointer"
                          readOnly
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative">
                        <Input
                          placeholder="Seleccionar fecha de salida"
                          value={field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : ''}
                          className="pr-10 cursor-pointer"
                          readOnly
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
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
