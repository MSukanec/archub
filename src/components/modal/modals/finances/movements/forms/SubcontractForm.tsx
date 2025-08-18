import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ComboBox as ComboBoxWrite } from '@/components/ui-custom/ComboBoxWrite'
import { useToast } from '@/hooks/use-toast'
import { useSubcontracts } from '@/hooks/use-subcontracts'
import { useCreateMovementSubcontract, useDeleteMovementSubcontractsByMovement } from '@/hooks/use-movement-subcontracts'

const subcontratosFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  subcontrato: z.string().optional()
})

type SubcontratosForm = z.infer<typeof subcontratosFormSchema>

interface SubcontractFormProps {
  userData: any
  editingMovement: any
  selectedSubcontractId: string | null
  setSelectedSubcontractId: (id: string | null) => void
  onClose: () => void
  formData: any // Data from main form to create movement
  isLoading?: boolean
}

export function SubcontractForm({
  userData,
  editingMovement,
  selectedSubcontractId,
  setSelectedSubcontractId,
  onClose,
  formData,
  isLoading = false
}: SubcontractFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Hooks
  const { data: subcontracts, isLoading: isSubcontractsLoading } = useSubcontracts(userData?.organization?.id)
  const createMovementSubcontractMutation = useCreateMovementSubcontract()
  const deleteMovementSubcontractsByMovementMutation = useDeleteMovementSubcontractsByMovement()

  // Form setup
  const subcontratosForm = useForm<SubcontratosForm>({
    resolver: zodResolver(subcontratosFormSchema),
    defaultValues: {
      movement_date: formData?.movement_date || new Date(),
      created_by: formData?.created_by || userData?.user?.id || '',
      description: formData?.description || '',
      type_id: formData?.type_id || '',
      category_id: formData?.category_id || '',
      subcategory_id: formData?.subcategory_id || '',
      subcontrato: '',  
      currency_id: formData?.currency_id || userData?.organization?.preferences?.default_currency || '',
      wallet_id: formData?.wallet_id || userData?.organization?.preferences?.default_wallet || '',
      amount: formData?.amount || 0,
      exchange_rate: formData?.exchange_rate || undefined
    }
  })

  // Prepare subcontract options
  const subcontractOptions = React.useMemo(() => {
    if (!subcontracts?.data) return []
    
    return subcontracts.data.map((subcontract: any) => ({
      value: subcontract.id,
      label: subcontract.name || 'Sin nombre',
      description: subcontract.description || ''
    }))
  }, [subcontracts?.data])

  // Create mutation for subcontract movements
  const createSubcontratosMutation = useMutation({
    mutationFn: async (data: SubcontratosForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      const movementData = {
        organization_id: userData.organization.id,
        project_id: formData?.project_id || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Pago de Subcontrato',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        type_id: data.type_id,
        category_id: data.category_id,
        exchange_rate: data.exchange_rate || null,
      }

      // If editing, update existing movement
      if (editingMovement?.id) {
        const { data: result, error } = await supabase
          .from('movements')
          .update(movementData)
          .eq('id', editingMovement.id)
          .select()
          .single()

        if (error) throw error
        return result
      } else {
        // If creating, insert new movement
        const { data: result, error } = await supabase
          .from('movements')
          .insert([movementData])
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: async (createdMovement) => {
      // Create relationship with subcontract after creating/updating movement
      console.log('Subcontract ID before saving:', selectedSubcontractId)
      if (selectedSubcontractId) {
        try {
          console.log('Creating subcontract relation with:', {
            movement_id: createdMovement.id,
            subcontract_id: selectedSubcontractId,
            amount: createdMovement.amount
          })
          
          // Delete existing relationships if editing
          if (editingMovement?.id) {
            await deleteMovementSubcontractsByMovementMutation.mutateAsync(editingMovement.id)
          }
          
          // Create new relationship
          const result = await createMovementSubcontractMutation.mutateAsync({
            movement_id: createdMovement.id,
            subcontract_id: selectedSubcontractId,
            amount: createdMovement.amount
          })
          
          console.log('Subcontract relation created successfully:', result)
        } catch (error) {
          console.error('Error creating movement subcontract:', error)
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Movimiento creado pero hubo un error al vincular el subcontrato',
          })
        }
      } else {
        console.log('No subcontract ID selected')
      }

      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['movement-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      
      toast({
        title: editingMovement ? 'Pago de Subcontrato actualizado' : 'Pago de Subcontrato registrado',
        description: editingMovement 
          ? 'El pago del subcontrato ha sido actualizado correctamente'
          : 'El pago del subcontrato ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingMovement ? 'actualizar' : 'registrar'} el pago del subcontrato: ${error.message}`,
      })
    }
  })

  const onSubmitSubcontratos = async (data: SubcontratosForm) => {
    await createSubcontratosMutation.mutateAsync(data)
  }

  const handleConfirmSelection = () => {
    const formValues = subcontratosForm.getValues()
    onSubmitSubcontratos(formValues)
  }

  if (isLoading || isSubcontractsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Campo de Subcontrato */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            Subcontrato
          </label>
          <ComboBoxWrite
            value={selectedSubcontractId || ""}
            onValueChange={setSelectedSubcontractId}
            options={subcontractOptions}
            placeholder="Seleccionar subcontrato..."
            searchPlaceholder="Buscar subcontrato..."
            emptyMessage="No se encontraron subcontratos."
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          Configura el subcontrato relacionado con este pago
        </p>
      </div>
    </div>
  )
}