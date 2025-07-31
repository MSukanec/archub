import React, { useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { NestedSelector } from '@/components/ui-custom/NestedSelector'
import UserSelector from '@/components/ui-custom/UserSelector'
import DatePicker from '@/components/ui-custom/DatePicker'

import { SubcontratosSubform } from './movement-subforms/SubcontratosSubform'
import { AportesSubform } from './movement-subforms/AportesSubform'
import { MaterialesSubform } from './movement-subforms/MaterialesSubform'
import { ConversionSubform } from './movement-subforms/ConversionSubform'
import { TransferSubform } from './movement-subforms/TransferSubform'

import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { useContacts } from '@/hooks/use-contacts'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useConstructionTasks } from '@/hooks/use-construction-tasks'
import { useSubcontracts } from '@/hooks/use-subcontracts'
import { useMovementFormState } from '@/hooks/use-movement-form-state'

const movementFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  project_id: z.string().nullable(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida')
})

interface MovementFormModalProps {
  movement?: any
  onClose: () => void
  onSave?: () => void
  projectId?: string
}

export function MovementFormModal({
  movement: editingMovement,
  onClose,
  onSave,
  projectId
}: MovementFormModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  
  // Datos necesarios
  const { data: members } = useOrganizationMembers()
  const { data: currencies } = useOrganizationCurrencies()
  const { data: wallets } = useOrganizationWallets()
  const { data: organizationConcepts, isLoading: conceptsLoading } = useOrganizationMovementConcepts()
  const { data: contacts } = useContacts()
  const { data: projectClients } = useProjectClients(projectId || '')
  const { data: constructionTasks } = useConstructionTasks(projectId || '')
  const { data: subcontracts } = useSubcontracts()

  // Estado del formulario usando reducer
  const { state, handleSelectionChange } = useMovementFormState(organizationConcepts || [])

  // Formulario principal
  const form = useForm({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movement_date: editingMovement?.movement_date ? new Date(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentUser?.id || '',
      description: editingMovement?.description || '',
      amount: editingMovement?.amount || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined,
      project_id: editingMovement?.project_id || projectId || null,
      type_id: editingMovement?.type_id || '',
      category_id: editingMovement?.category_id || '',
      subcategory_id: editingMovement?.subcategory_id || '',
      currency_id: editingMovement?.currency_id || '',
      wallet_id: editingMovement?.wallet_id || ''
    }
  })

  // Valor actual de la selección jerárquica
  const currentSelection = useMemo(() => {
    const values = []
    const typeId = form.watch('type_id')
    const categoryId = form.watch('category_id')
    const subcategoryId = form.watch('subcategory_id')
    
    if (typeId) values.push(typeId)
    if (categoryId) values.push(categoryId)
    if (subcategoryId) values.push(subcategoryId)
    
    return values
  }, [form.watch('type_id'), form.watch('category_id'), form.watch('subcategory_id')])

  // Manejar cambios en la selección jerárquica
  const handleNestedSelectorChange = (values: string[]) => {
    const typeId = values[0] || ''
    const categoryId = values[1] || ''
    const subcategoryId = values[2] || ''

    // Actualizar formulario
    form.setValue('type_id', typeId)
    form.setValue('category_id', categoryId)  
    form.setValue('subcategory_id', subcategoryId)

    // Actualizar estado global
    handleSelectionChange(typeId, categoryId, subcategoryId)
  }

  // Mutación para guardar
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingMovement) {
        const { data: result, error } = await supabase
          .from('organization_movements')
          .update(data)
          .eq('id', editingMovement.id)
          .select()
          .single()
        
        if (error) throw error
        return result
      } else {
        const { data: result, error } = await supabase
          .from('organization_movements')
          .insert(data)
          .select()
          .single()
        
        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/movements'] })
      toast({
        title: editingMovement ? 'Movimiento actualizado' : 'Movimiento creado',
        description: 'Los cambios se han guardado correctamente.'
      })
      onSave?.()
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar el movimiento.',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = (data: any) => {
    const finalData = {
      ...data,
      organization_id: currentUser?.organization_id,
      movement_date: format(data.movement_date, 'yyyy-MM-dd'),
    }
    
    saveMutation.mutate(finalData)
  }

  // Renderizar subformulario según el tipo
  const renderSubform = () => {
    const commonProps = {
      form,
      currencies: currencies || [],
      wallets: wallets || [],
      members: members || [],
      concepts: organizationConcepts || [],
      movement: editingMovement
    }

    switch (state.movementType) {
      case 'conversion':
        return <ConversionSubform {...commonProps} />
      
      case 'transfer':
        return <TransferSubform {...commonProps} />
      
      case 'aportes':
        return <AportesSubform {...commonProps} projectClients={projectClients || []} />
      
      case 'materiales':
        return <MaterialesSubform {...commonProps} constructionTasks={constructionTasks || []} />
      
      case 'subcontratos':
        return (
          <SubcontratosSubform 
            {...commonProps} 
            projectClients={projectClients || []}
            constructionTasks={constructionTasks || []}
            subcontracts={subcontracts || []}
          />
        )
      
      default:
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción del movimiento..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )
    }
  }

  return (
    <FormModalLayout>
      <FormModalHeader 
        title={editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        onClose={onClose}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Encabezado común */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creador *</FormLabel>
                  <FormControl>
                    <UserSelector
                      members={members || []}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Seleccionar creador..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="movement_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
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

          {/* Selector en cascada */}
          <div className="space-y-2">
            <FormLabel>Selector en Cascada *</FormLabel>
            {conceptsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <NestedSelector
                data={organizationConcepts || []}
                value={currentSelection}
                onValueChange={handleNestedSelectorChange}
                placeholder="Tipo > Categoría > Subcategoría..."
                isLoading={conceptsLoading}
              />
            )}
          </div>

          {/* Subformulario dinámico */}
          {renderSubform()}

          <FormModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            isLoading={saveMutation.isPending}
            saveText={editingMovement ? 'Actualizar' : 'Guardar'}
          />
        </form>
      </Form>
    </FormModalLayout>
  )
}