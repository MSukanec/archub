import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RefreshCw, Shield, Upload, Calendar } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DatePicker from '@/components/ui-custom/fields/DatePickerField'

import { useRenewInsurance, useUploadCertificate } from '@/hooks/useInsurances'
import { Insurance } from '@/services/insurances'

const renewInsuranceSchema = z.object({
  new_coverage_end: z.date({
    required_error: 'La nueva fecha de vencimiento es requerida'
  }),
  new_policy_number: z.string().optional(),
  new_provider: z.string().optional(),
  reminder_days: z.array(z.number()).optional(),
  notes: z.string().optional()
})

type RenewInsuranceForm = z.infer<typeof renewInsuranceSchema>

interface RenewInsuranceFormModalProps {
  modalData?: {
    insurance: Insurance
  }
  onClose: () => void
}

const DEFAULT_REMINDER_DAYS = [30, 15, 7]

export function RenewInsuranceFormModal({ modalData, onClose }: RenewInsuranceFormModalProps) {
  const [reminderDays, setReminderDays] = useState<number[]>(modalData?.insurance?.reminder_days || DEFAULT_REMINDER_DAYS)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const renewInsurance = useRenewInsurance()
  const uploadCertificate = useUploadCertificate()

  if (!modalData?.insurance) {
    return null
  }

  const { insurance } = modalData

  const form = useForm<RenewInsuranceForm>({
    resolver: zodResolver(renewInsuranceSchema),
    defaultValues: {
      new_coverage_end: new Date(new Date(insurance.coverage_end).getTime() + 365 * 24 * 60 * 60 * 1000), // +1 año
      new_policy_number: insurance.policy_number || '',
      new_provider: insurance.provider || '',
      reminder_days: insurance.reminder_days || DEFAULT_REMINDER_DAYS,
      notes: ''
    }
  })

  const onSubmit = async (data: RenewInsuranceForm) => {
    try {
      let newCertificateAttachmentId: string | null = null

      // Upload new certificate if provided
      if (selectedFile) {
        newCertificateAttachmentId = await uploadCertificate.mutateAsync({
          contactId: insurance.contact_id,
          file: selectedFile
        })
      }

      const payload = {
        new_coverage_start: insurance.coverage_end, // El nuevo inicio es el final del anterior
        new_coverage_end: data.new_coverage_end.toISOString().split('T')[0],
        new_policy_number: data.new_policy_number || null,
        new_provider: data.new_provider || null,
        reminder_days: reminderDays,
        new_certificate_attachment_id: newCertificateAttachmentId,
        notes: data.notes || null
      }

      await renewInsurance.mutateAsync({
        insuranceId: insurance.id,
        payload
      })

      onClose()
    } catch (error) {
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

  const getInsuranceTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'ART': 'ART',
      'vida': 'Seguro de Vida',
      'accidentes': 'Seguro de Accidentes',
      'responsabilidad_civil': 'Responsabilidad Civil',
      'salud': 'Seguro de Salud',
      'otro': 'Otro'
    }
    return types[type] || type
  }

  const editPanel = (
    <Form {...form}>
      <div className="space-y-6">
        {/* Información actual del seguro */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Seguro Actual</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Tipo:</span>
              <p className="font-medium">{getInsuranceTypeLabel(insurance.insurance_type)}</p>
            </div>
            <div>
              <span className="text-gray-500">Vencimiento:</span>
              <p className="font-medium">{new Date(insurance.coverage_end).toLocaleDateString()}</p>
            </div>
            {insurance.policy_number && (
              <div>
                <span className="text-gray-500">Póliza:</span>
                <p className="font-medium">{insurance.policy_number}</p>
              </div>
            )}
            {insurance.provider && (
              <div>
                <span className="text-gray-500">Aseguradora:</span>
                <p className="font-medium">{insurance.provider}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nueva fecha de vencimiento */}
        <FormField
          control={form.control}
          name="new_coverage_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Fecha de Vencimiento *</FormLabel>
              <FormControl>
                <DatePickerField
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder="Seleccionar nueva fecha..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Información actualizada */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="new_policy_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nuevo Número de Póliza</FormLabel>
                <FormControl>
                  <Input placeholder="Dejar vacío si no cambió" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="new_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva Aseguradora</FormLabel>
                <FormControl>
                  <Input placeholder="Dejar vacío si no cambió" {...field} value={field.value || ''} />
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
              <FormLabel>Notas de la Renovación</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Comentarios sobre la renovación..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nuevo certificado */}
        <div>
          <FormLabel>Nuevo Certificado de Cobertura</FormLabel>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Arrastra el nuevo certificado aquí o haz clic para seleccionar
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
                Nuevo archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title="Renovar Seguro"
      icon={RefreshCw}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Renovar"
      onRightClick={form.handleSubmit(onSubmit)}
      rightDisabled={renewInsurance.isPending}
      rightLoading={renewInsurance.isPending}
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