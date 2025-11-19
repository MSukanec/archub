import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateGeneralCost } from '@/features/general-costs/hooks/use-create-general-cost'
import { useUpdateGeneralCost } from '@/features/general-costs/hooks/use-update-general-cost'
import { useGeneralCost } from '@/features/general-costs/hooks/use-general-cost'
import { generalCostSchema, type GeneralCostFormData } from '../schemas'

interface GeneralCostsModalProps {
  modalData?: {
    organizationId?: string
    isEditing?: boolean
    generalCostId?: string
  }
  onClose: () => void
}

export function GeneralCostsModal({ modalData, onClose }: GeneralCostsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const queryClient = useQueryClient()

  const organizationId = modalData?.organizationId || userData?.organization?.id
  const isEditing = modalData?.isEditing || false

  // Fetch existing general cost data if editing
  const { data: existingGeneralCost, isLoading: isLoadingGeneralCost } = useGeneralCost(isEditing ? modalData?.generalCostId || null : null)

  const form = useForm<GeneralCostFormData>({
    resolver: zodResolver(generalCostSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  })

  // Reset form when existing data is loaded
  useEffect(() => {
    if (existingGeneralCost) {
      form.reset({
        name: existingGeneralCost.name || '',
        description: existingGeneralCost.description || ''
      })
    }
  }, [existingGeneralCost, form])

  const createGeneralCost = useCreateGeneralCost()
  const updateGeneralCost = useUpdateGeneralCost()

  const onSubmit = async (data: GeneralCostFormData) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && modalData?.generalCostId) {
        // Modo edición
        await updateGeneralCost.mutateAsync({
          generalCostId: modalData.generalCostId,
          generalCost: {
            name: data.name,
            description: data.description || undefined
          }
        })
      } else {
        // Modo creación - usar userData.organization.id directamente como en ClientPaymentModal
        const matchingMembership = userData?.memberships?.find(m => m.organization_id === userData?.organization?.id)
        const createdBy = matchingMembership?.id || null
        
        console.log('🔍 DEBUGGING created_by:', {
          'userData.organization.id': userData?.organization?.id,
          'matchingMembership (FULL OBJECT)': matchingMembership,
          'matchingMembership.id': matchingMembership?.id,
          'createdBy (final value)': createdBy,
          'all memberships': userData?.memberships
        })
        
        await createGeneralCost.mutateAsync({
          organization_id: organizationId,
          name: data.name,
          description: data.description || undefined,
          created_by: createdBy
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving general cost:', error)
      // Los hooks ya manejan el toast de error
    } finally {
      setIsSubmitting(false)
    }
  }

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Nombre */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Servicios administrativos, Gastos de oficina, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción detallada del gasto general..."
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
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title={isEditing ? 'Editar Gasto General' : 'Nuevo Gasto General'}
      description={isEditing ? 'Modifica los datos del gasto general' : 'Agrega un nuevo concepto de gasto general para tu organización'}
      icon={Receipt}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? 'Actualizar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      showLoadingSpinner={isSubmitting}
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
