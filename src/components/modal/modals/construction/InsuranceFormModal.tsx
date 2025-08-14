import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Shield, Upload } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui-custom/DatePicker'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useCreateInsurance, useUpdateInsurance, useUploadCertificate } from '@/hooks/useInsurances'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Insurance } from '@/services/insurances'

const insuranceSchema = z.object({
  contact_id: z.string().uuid('Selecciona una persona'),
  insurance_type: z.enum(['ART', 'vida', 'accidentes', 'responsabilidad_civil', 'salud', 'otro'], {
    required_error: 'Selecciona el tipo de seguro'
  }),
  policy_number: z.string().optional(),
  provider: z.string().optional(),
  coverage_start: z.date({
    required_error: 'La fecha de inicio es requerida'
  }),
  coverage_end: z.date({
    required_error: 'La fecha de fin es requerida'
  }),
  reminder_days: z.array(z.number()).optional(),
  notes: z.string().optional()
}).refine(data => data.coverage_end >= data.coverage_start, {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["coverage_end"]
})

type InsuranceForm = z.infer<typeof insuranceSchema>

interface InsuranceFormModalProps {
  modalData?: {
    insurance?: Insurance
    mode?: 'create' | 'edit'
    projectId?: string
    defaultContactId?: string
  }
  onClose: () => void
}

const INSURANCE_TYPE_OPTIONS = [
  { value: 'ART', label: 'ART (Aseguradora de Riesgos del Trabajo)' },
  { value: 'vida', label: 'Seguro de Vida' },
  { value: 'accidentes', label: 'Seguro de Accidentes' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'salud', label: 'Seguro de Salud' },
  { value: 'otro', label: 'Otro' }
]

const DEFAULT_REMINDER_DAYS = [30, 15, 7]

export function InsuranceFormModal({ modalData, onClose }: InsuranceFormModalProps) {
  const { data: currentUser } = useCurrentUser()
  const createInsurance = useCreateInsurance()
  const updateInsurance = useUpdateInsurance()
  const uploadCertificate = useUploadCertificate()
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [reminderDays, setReminderDays] = useState<number[]>(DEFAULT_REMINDER_DAYS)

  const isEdit = modalData?.mode === 'edit' && modalData?.insurance
  const projectId = modalData?.projectId || currentUser?.preferences?.last_project_id

  // Get project personnel for contact selection
  const { data: projectPersonnel = [], isLoading: personnelLoading } = useQuery({
    queryKey: ['project-personnel', projectId],
    queryFn: async () => {
      if (!projectId) return []
      
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          id,
          contact_id,
          contact:contacts(
            id,
            first_name,
            last_name
          )
        `)
        .eq('project_id', projectId)

      if (error) throw error
      return data
    },
    enabled: !!projectId
  })

  const form = useForm<InsuranceForm>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      contact_id: modalData?.defaultContactId || modalData?.insurance?.contact_id || '',
      insurance_type: modalData?.insurance?.insurance_type || 'ART',
      policy_number: modalData?.insurance?.policy_number || '',
      provider: modalData?.insurance?.provider || '',
      coverage_start: modalData?.insurance ? new Date(modalData.insurance.coverage_start) : new Date(),
      coverage_end: modalData?.insurance ? new Date(modalData.insurance.coverage_end) : new Date(),
      reminder_days: modalData?.insurance?.reminder_days || DEFAULT_REMINDER_DAYS,
      notes: modalData?.insurance?.notes || ''
    }
  })

  useEffect(() => {
    if (modalData?.insurance?.reminder_days) {
      setReminderDays(modalData.insurance.reminder_days)
    }
  }, [modalData?.insurance?.reminder_days])

  const onSubmit = async (data: InsuranceForm) => {
    try {
      let certificateAttachmentId: string | null = modalData?.insurance?.certificate_attachment_id || null

      // Upload certificate if a new file was selected
      if (certificateFile) {
        certificateAttachmentId = await uploadCertificate.mutateAsync({
          contactId: data.contact_id,
          file: certificateFile
        })
      }

      const payload = {
        organization_id: currentUser?.organization?.id!,
        project_id: projectId,
        contact_id: data.contact_id,
        insurance_type: data.insurance_type,
        policy_number: data.policy_number || null,
        provider: data.provider || null,
        coverage_start: data.coverage_start.toISOString().split('T')[0],
        coverage_end: data.coverage_end.toISOString().split('T')[0],
        reminder_days: reminderDays,
        certificate_attachment_id: certificateAttachmentId,
        notes: data.notes || null
      }

      if (isEdit) {
        await updateInsurance.mutateAsync({
          id: modalData.insurance.id,
          payload
        })
      } else {
        await createInsurance.mutateAsync(payload)
      }

      onClose()
    } catch (error) {
      console.error('Error saving insurance:', error)
    }
  }

  const addReminderDay = (days: number) => {
    if (!reminderDays.includes(days)) {
      setReminderDays([...reminderDays, days].sort((a, b) => b - a))
    }
  }

  const removeReminderDay = (days: number) => {
    setReminderDays(reminderDays.filter(d => d !== days))
  }

  return (
    <FormModalLayout>
      <FormModalHeader
        icon={Shield}
        title={isEdit ? 'Editar Seguro' : 'Nuevo Seguro'}
        onClose={onClose}
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Persona *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una persona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projectPersonnel.map((personnel) => (
                          <SelectItem key={personnel.contact_id} value={personnel.contact_id}>
                            {personnel.contact.first_name} {personnel.contact.last_name}
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
                name="insurance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Seguro *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INSURANCE_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Póliza</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: POL-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aseguradora</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: La Segunda ART" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverage_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio *</FormLabel>
                    <DatePicker
                      date={field.value}
                      onSelect={field.onChange}
                      placeholder="Selecciona fecha de inicio"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverage_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Fin *</FormLabel>
                    <DatePicker
                      date={field.value}
                      onSelect={field.onChange}
                      placeholder="Selecciona fecha de fin"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Recordatorios (días antes del vencimiento)</FormLabel>
              <div className="flex flex-wrap gap-2">
                {reminderDays.map((days) => (
                  <Badge 
                    key={days}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeReminderDay(days)}
                  >
                    {days} días ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addReminderDay(30)}
                >
                  30 días
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addReminderDay(15)}
                >
                  15 días
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addReminderDay(7)}
                >
                  7 días
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel>Certificado</FormLabel>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <Input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setCertificateFile(file)
                    }}
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    PDF o imagen (máx. 10MB)
                  </p>
                </div>
              </div>
              {certificateFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {certificateFile.name}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observaciones adicionales..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      <FormModalFooter
        onCancel={onClose}
        onSubmit={form.handleSubmit(onSubmit)}
        submitText={isEdit ? 'Actualizar' : 'Crear Seguro'}
        isSubmitting={createInsurance.isPending || updateInsurance.isPending}
      />
    </FormModalLayout>
  )
}