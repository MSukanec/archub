import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Receipt } from 'lucide-react'

import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal'
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

// Subcomponente: Formulario para create/edit
function FormPanel({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<GeneralCostFormData>>
  onSubmit: (data: GeneralCostFormData) => void
}) {
  return (
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
}

// Subcomponente: Vista lectura
function ViewPanel({ generalCost }: { generalCost: any }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-1">Nombre</p>
        <p className="font-medium">{generalCost.name}</p>
      </div>
      {generalCost.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Descripción</p>
          <p className="text-sm">{generalCost.description}</p>
        </div>
      )}
    </div>
  )
}

export function GeneralCostForm({ modalData, onClose, mode = 'create' }: GeneralCostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const queryClient = useQueryClient()

  const organizationId = modalData?.organizationId || userData?.organization?.id

  // Fetch organization members to get current member ID
  const { data: members = [] } = useOrganizationMembers(organizationId || undefined)

  // Fetch existing general cost data if editing or viewing
  const { data: existingGeneralCost, isLoading: isLoadingGeneralCost } = useGeneralCost(
    (mode === 'edit' || mode === 'view') ? modalData?.generalCostId || null : null
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
      if (mode === 'edit' && modalData?.generalCostId) {
        await updateGeneralCost.mutateAsync({
          generalCostId: modalData.generalCostId,
          generalCost: {
            name: data.name,
            description: data.description || undefined
          }
        })
      } else if (mode === 'create') {
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

  // Determine title and description based on mode
  const getHeader = () => {
    switch (mode) {
      case 'view':
        return {
          title: 'Detalle de Gasto General',
          description: 'Información completa del concepto de gasto'
        }
      case 'edit':
        return {
          title: 'Editar Gasto General',
          description: 'Modifica los datos del gasto general'
        }
      case 'create':
      default:
        return {
          title: 'Nuevo Gasto General',
          description: 'Agrega un nuevo concepto de gasto general para tu organización'
        }
    }
  }

  const header = getHeader()

  return (
    <ModalLayout onClose={onClose} size="md">
      <ModalHeader 
        title={header.title}
        description={header.description}
        icon={Receipt}
      />
      
      <ModalBody>
        {mode === 'view' && existingGeneralCost ? (
          <ViewPanel generalCost={existingGeneralCost} />
        ) : (
          <FormPanel form={form} onSubmit={onSubmit} />
        )}
      </ModalBody>

      {mode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          rightLabel={mode === 'create' ? 'Crear' : 'Actualizar'}
          onRightClick={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          submitDisabled={isSubmitting}
        />
      )}
    </ModalLayout>
  )
}
