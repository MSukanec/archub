import React, { useState, useEffect, useRef } from 'react'
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
    defaultContactId?: string
  }
  onClose: () => void
}

const DEFAULT_REMINDER_DAYS = [30, 15, 7]

export function InsuranceFormModal({ modalData, onClose }: InsuranceFormModalProps) {
  const { data: currentUser } = useCurrentUser()
  const [reminderDays, setReminderDays] = useState<number[]>(DEFAULT_REMINDER_DAYS)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const isEdit = modalData?.mode === 'edit' && modalData?.insurance
  const projectId = currentUser?.preferences?.last_project_id

  // Get project personnel
  const { data: projectPersonnel = [] } = useQuery({
    queryKey: ['/api/project-personnel', projectId],
    enabled: !!projectId
  })

  const createInsurance = useCreateInsurance()
  const updateInsurance = useUpdateInsurance()
  const uploadCertificate = useUploadCertificate()

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
      if (selectedFile) {
        certificateAttachmentId = await uploadCertificate.mutateAsync({
          contactId: data.contact_id,
          file: selectedFile
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

  const handleReminderToggle = (days: number) => {
    if (reminderDays.includes(days)) {
      setReminderDays(reminderDays.filter(d => d !== days))
    } else {
      setReminderDays([...reminderDays, days].sort((a, b) => b - a))
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const editPanel = (
    <Form {...form}>
      <div className="space-y-6">
        {/* Selección de persona */}
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Persona *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar persona..." />
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
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ART">ART</SelectItem>
                    <SelectItem value="vida">Seguro de Vida</SelectItem>
                    <SelectItem value="accidentes">Seguro de Accidentes</SelectItem>
                    <SelectItem value="responsabilidad_civil">Responsabilidad Civil</SelectItem>
                    <SelectItem value="salud">Seguro de Salud</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Información de la póliza */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="policy_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Póliza</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: POL-123456" {...field} value={field.value || ''} />
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
                  <Input placeholder="Ej: La Caja ART" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fechas de cobertura */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="coverage_start"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio *</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="Seleccionar fecha..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coverage_end"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento *</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="Seleccionar fecha..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Recordatorios */}
        <div>
          <FormLabel>Recordatorios de Vencimiento</FormLabel>
          <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {[7, 15, 30, 60, 90].map((days) => (
                <Badge
                  key={days}
                  variant={reminderDays.includes(days) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleReminderToggle(days)}
                >
                  {days} días antes
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales sobre el seguro..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Subir certificado */}
        <div>
          <FormLabel>Certificado de Cobertura</FormLabel>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arrastra el certificado aquí o haz clic para seleccionar
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Seleccionar archivo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
            />
            {selectedFile && (
              <p className="text-sm text-green-600 mt-2">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEdit ? 'Editar Seguro' : 'Nuevo Seguro'}
      icon={Shield}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEdit ? 'Actualizar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      rightDisabled={createInsurance.isPending || updateInsurance.isPending}
      rightLoading={createInsurance.isPending || updateInsurance.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
    />
  )
}