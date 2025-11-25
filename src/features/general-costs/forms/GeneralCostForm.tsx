import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt } from 'lucide-react'

import { ModalLayout, ModalHeader, ModalFooter } from '@/components/modal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'
import { useOrganizationMembers } from '@/features/organization'
import { useCreateGeneralCost } from '@/features/general-costs/hooks/use-create-general-cost'
import { useUpdateGeneralCost } from '@/features/general-costs/hooks/use-update-general-cost'
import { useGeneralCost } from '@/features/general-costs/hooks/use-general-cost'
import { generalCostSchema, type GeneralCostFormData } from '../schemas'

interface GeneralCostFormProps {
  modalData?: {
    organizationId?: string
    generalCostId?: string
  }
  onClose: () => void
  mode?: 'create' | 'edit' | 'view'
}

export function GeneralCostForm({ modalData, onClose, mode = 'create' }: GeneralCostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const queryClient = useQueryClient()

  const isCreate = mode === 'create'
  const isEdit = mode === 'edit'
  const isView = mode === 'view'

  const organizationId = modalData?.organizationId || userData?.organization?.id

  // Fetch organization members to get current member ID
  const { data: members = [] } = useOrganizationMembers(organizationId || undefined)

  // Fetch existing general cost data if editing or viewing
  const { data: existingGeneralCost, isLoading: isLoadingGeneralCost } = useGeneralCost(
    (isEdit || isView) ? modalData?.generalCostId || null : null
  )

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
      if (isEdit && modalData?.generalCostId) {
        await updateGeneralCost.mutateAsync({
          generalCostId: modalData.generalCostId,
          generalCost: {
            name: data.name,
            description: data.description || undefined
          }
        })
      } else {
        const currentMember = members.find((m: any) => m.user_id === userData?.user?.id)
        if (!currentMember) {
          toast({
            title: 'Error',
            description: 'No se encontró el miembro de la organización para el usuario actual',
            variant: 'destructive'
          })
          return
        }
        
        await createGeneralCost.mutateAsync({
          organization_id: organizationId,
          name: data.name,
          description: data.description || undefined,
          created_by: currentMember.id
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving general cost:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // VIEW MODE - Render as edit panel
  const viewPanel = isView && existingGeneralCost ? (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
        <p className="font-medium">{existingGeneralCost.name}</p>
      </div>
      {existingGeneralCost.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Descripción</p>
          <p className="text-sm">{existingGeneralCost.description}</p>
        </div>
      )}
    </div>
  ) : null

  // CREATE / EDIT MODE
  const editPanel = (
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
                  data-testid="input-general-cost-name"
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
                  data-testid="textarea-general-cost-description"
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
    <ModalHeader 
      title={isView ? 'Detalle de Gasto General' : (isCreate ? 'Nuevo Gasto General' : 'Editar Gasto General')}
      description={isView 
        ? 'Información completa del concepto de gasto'
        : (isCreate 
          ? 'Agrega un nuevo concepto de gasto general para tu organización' 
          : 'Modifica los datos del gasto general')}
      icon={Receipt}
    />
  )

  const footerContent = isView ? null : (
    <ModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isCreate ? 'Crear' : 'Actualizar'}
      onRightClick={form.handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
      submitDisabled={isSubmitting}
    />
  )

  return (
    <ModalLayout 
      size="md"
      onClose={onClose}
      headerContent={headerContent}
      editPanel={viewPanel || editPanel}
      footerContent={footerContent}
      isEditing={!isView}
    />
  )
}
