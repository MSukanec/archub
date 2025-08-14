import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RotateCcw, Upload } from 'lucide-react'
import { addDays } from 'date-fns'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import DatePicker from '@/components/ui-custom/DatePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { useRenewInsurance, useUploadCertificate } from '@/hooks/useInsurances'
import { Insurance } from '@/services/insurances'

const renewInsuranceSchema = z.object({
  coverage_start: z.date({
    required_error: 'La fecha de inicio es requerida'
  }),
  coverage_end: z.date({
    required_error: 'La fecha de fin es requerida'
  }),
  policy_number: z.string().optional(),
  provider: z.string().optional(),
  notes: z.string().optional()
}).refine(data => data.coverage_end >= data.coverage_start, {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["coverage_end"]
})

type RenewInsuranceForm = z.infer<typeof renewInsuranceSchema>

interface RenewInsuranceFormModalProps {
  modalData?: {
    previous: Insurance
  }
  onClose: () => void
}

const INSURANCE_TYPE_LABELS = {
  'ART': 'ART (Aseguradora de Riesgos del Trabajo)',
  'vida': 'Seguro de Vida',
  'accidentes': 'Seguro de Accidentes', 
  'responsabilidad_civil': 'Responsabilidad Civil',
  'salud': 'Seguro de Salud',
  'otro': 'Otro'
} as const

export function RenewInsuranceFormModal({ modalData, onClose }: RenewInsuranceFormModalProps) {
  const renewInsurance = useRenewInsurance()
  const uploadCertificate = useUploadCertificate()
  
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  
  const previous = modalData?.previous
  if (!previous) {
    return null
  }

  // Calculate default new start date (day after previous end)
  const defaultStartDate = addDays(new Date(previous.coverage_end), 1)

  const form = useForm<RenewInsuranceForm>({
    resolver: zodResolver(renewInsuranceSchema),
    defaultValues: {
      coverage_start: defaultStartDate,
      coverage_end: addDays(defaultStartDate, 365), // Default 1 year
      policy_number: previous.policy_number || '',
      provider: previous.provider || '',
      notes: ''
    }
  })

  const onSubmit = async (data: RenewInsuranceForm) => {
    try {
      let certificateAttachmentId: string | null = null

      // Upload certificate if a new file was selected
      if (certificateFile) {
        certificateAttachmentId = await uploadCertificate.mutateAsync({
          contactId: previous.contact_id,
          file: certificateFile
        })
      }

      await renewInsurance.mutateAsync({
        prevId: previous.id,
        payload: {
          coverage_start: data.coverage_start.toISOString().split('T')[0],
          coverage_end: data.coverage_end.toISOString().split('T')[0],
          policy_number: data.policy_number || undefined,
          provider: data.provider || undefined,
          certificate_attachment_id: certificateAttachmentId,
          notes: data.notes || undefined
        }
      })

      onClose()
    } catch (error) {
      console.error('Error renewing insurance:', error)
    }
  }

  return (
    <FormModalLayout>
      <FormModalHeader
        icon={RotateCcw}
        title="Renovar Seguro"
        onClose={onClose}
      />
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Previous Insurance Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seguro Anterior
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Tipo:</p>
                <p className="text-muted-foreground">
                  {INSURANCE_TYPE_LABELS[previous.insurance_type]}
                </p>
              </div>
              <div>
                <p className="font-medium">Póliza:</p>
                <p className="text-muted-foreground">
                  {previous.policy_number || 'Sin número'}
                </p>
              </div>
              <div>
                <p className="font-medium">Aseguradora:</p>
                <p className="text-muted-foreground">
                  {previous.provider || 'No especificada'}
                </p>
              </div>
              <div>
                <p className="font-medium">Vigencia anterior:</p>
                <p className="text-muted-foreground">
                  {new Date(previous.coverage_start).toLocaleDateString()} - {new Date(previous.coverage_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Insurance Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coverage_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva Fecha de Inicio *</FormLabel>
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
                    <FormLabel>Nueva Fecha de Fin *</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="policy_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuevo Número de Póliza (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dejar vacío para mantener el anterior" {...field} />
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
                    <FormLabel>Nueva Aseguradora (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Dejar vacío para mantener la anterior" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <FormLabel>Nuevo Certificado (opcional)</FormLabel>
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
                  <FormLabel>Notas de Renovación</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observaciones sobre la renovación..."
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
        submitText="Renovar Seguro"
        isSubmitting={renewInsurance.isPending}
      />
    </FormModalLayout>
  )
}