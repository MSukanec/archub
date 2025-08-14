import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { addDays } from 'date-fns'
import { Calendar, Users } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import DatePicker from '@/components/ui-custom/DatePicker'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useContacts } from '@/hooks/use-contacts'

const attendanceSchema = z.object({
  attendance_date: z.date({
    required_error: 'La fecha es requerida'
  }),
  personnel_id: z.string().uuid('Selecciona personal'),
  attendance_type: z.string().min(1, 'Selecciona el tipo de horario'),
  hours_worked: z.number().min(0.5, 'Las horas deben ser al menos 0.5').max(24, 'Las horas no pueden ser más de 24'),
  description: z.string().optional()
})

type AttendanceForm = z.infer<typeof attendanceSchema>

interface AttendanceFormModalProps {
  modalData?: {
    attendance?: any
    mode?: 'create' | 'edit'
    isEditing?: boolean
    editingData?: {
      personnelId: string
      contactName: string
      attendanceDate: Date
      existingRecord?: any
    }
  }
  onClose: () => void
}

export function AttendanceFormModal({ modalData, onClose }: AttendanceFormModalProps) {
  const { toast } = useToast()
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const projectId = currentUser?.preferences?.last_project_id
  const queryClient = useQueryClient()

  // Get organization members and contacts - skip if no organizationId
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId || '')
  const { data: contacts = [] } = useContacts()

  // Convert members to users format for UserSelector (siguiendo patrón de MovementFormModal)
  const users = organizationMembers.map(member => ({
    id: member.user_id, // Usar member.user_id como en MovementFormModal
    full_name: member.full_name || member.email || 'Usuario',
    email: member.email || '',
    avatar_url: member.avatar_url || ''
  }))

  // Preseleccionar usuario actual (siguiendo patrón de MovementFormModal)
  const currentUserId = currentUser?.user?.id

  const isEditing = modalData?.isEditing || (modalData?.mode === 'edit' && modalData?.attendance)
  const attendance = modalData?.attendance || modalData?.editingData?.existingRecord

  const form = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      attendance_date: modalData?.editingData?.attendanceDate || (isEditing ? new Date(attendance?.created_at) : new Date()),
      personnel_id: modalData?.editingData?.personnelId || attendance?.personnel_id || '',
      attendance_type: attendance?.attendance_type || 'full', // Preseleccionar "Jornada Completa"
      hours_worked: attendance?.hours_worked || 8,
      description: attendance?.description || ''
    }
  })

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      // Find current organization member ID
      const currentMember = organizationMembers.find(m => m.user_id === currentUserId)
      if (!currentMember) throw new Error('No se encontró el miembro de la organización')
      
      const { error } = await supabase
        .from('attendees')
        .insert({
          site_log_id: null, // Como especificaste, esto es null
          personnel_id: data.personnel_id,
          attendance_type: data.attendance_type,
          hours_worked: data.hours_worked,
          description: data.description,
          created_by: currentMember.id, // Usar el ID del organization member
          project_id: projectId,
          created_at: data.attendance_date.toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-attendance'] })
      toast({
        title: 'Asistencia registrada',
        description: 'La asistencia se ha registrado correctamente'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error creating attendance:', error)
      toast({
        title: 'Error',
        description: 'No se pudo registrar la asistencia',
        variant: 'destructive'
      })
    }
  })

  const updateAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceForm) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('attendees')
        .update({
          personnel_id: data.personnel_id,
          attendance_type: data.attendance_type,
          hours_worked: data.hours_worked,
          description: data.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendance.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['construction-attendance'] })
      toast({
        title: 'Asistencia actualizada',
        description: 'La asistencia se ha actualizada correctamente'
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating attendance:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la asistencia',
        variant: 'destructive'
      })
    }
  })

  const handleSubmit = (data: AttendanceForm) => {
    if (isEditing) {
      updateAttendanceMutation.mutate(data)
    } else {
      createAttendanceMutation.mutate(data)
    }
  }

  const isLoading = createAttendanceMutation.isPending || updateAttendanceMutation.isPending

  const attendanceTypes = [
    { value: 'full', label: 'Jornada Completa' },
    { value: 'half', label: 'Media Jornada' }
  ]

  const viewPanel = (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Vista de solo lectura - Usa el botón editar para modificar
      </div>
    </div>
  )

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Fecha y Personal - Inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="attendance_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha"
                    disableFuture={true}
                    minDate={new Date("1900-01-01")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Personal</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar personal..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Horario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="attendance_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horario</FormLabel>
                <Select onValueChange={(value) => {
                  field.onChange(value)
                  // Auto-set hours based on attendance type
                  if (value === 'full') form.setValue('hours_worked', 8)
                  else if (value === 'half') form.setValue('hours_worked', 4)
                }} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar horario" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {attendanceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hours_worked"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas trabajadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales sobre la asistencia..."
                  className="resize-none"
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
      title={isEditing ? "Editar Asistencia" : "Registrar Asistencia"}
      icon={Users}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Guardar Cambios" : "Registrar Asistencia"}
      onRightClick={form.handleSubmit(handleSubmit)}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}