import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { DollarSign } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import UserSelector from '@/components/ui-custom/UserSelector'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'

const movementFormSchema = z.object({
  creator_id: z.string().min(1, 'El creador es requerido'),
  movement_date: z.string().min(1, 'La fecha es requerida'),
  type: z.string().min(1, 'El tipo es requerido'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  wallet_id: z.string().min(1, 'La billetera es requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  description: z.string().optional(),
})

type MovementForm = z.infer<typeof movementFormSchema>

interface MovementFormModalProps {
  editingMovement?: any
  onClose: () => void
}

export default function MovementFormModal({ editingMovement, onClose }: MovementFormModalProps) {
  const { currentPanel, setPanel } = useModalPanelStore()
  const { data: userData } = useCurrentUser()
  const { data: members } = useOrganizationMembers(userData?.organization?.id)
  const { data: currencies } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets } = useOrganizationWallets(userData?.organization?.id)
  const { data: concepts } = useMovementConcepts()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      creator_id: editingMovement?.creator_id || userData?.user?.id || '',
      movement_date: editingMovement?.movement_date || new Date().toISOString().split('T')[0],
      type: editingMovement?.type || '',
      currency_id: editingMovement?.currency_id || '',
      wallet_id: editingMovement?.wallet_id || '',
      amount: editingMovement?.amount || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined,
      description: editingMovement?.description || '',
    }
  })

  React.useEffect(() => {
    if (editingMovement) {
      form.reset({
        creator_id: editingMovement.creator_id || userData?.user?.id || '',
        movement_date: editingMovement.movement_date || new Date().toISOString().split('T')[0],
        type: editingMovement.type || '',
        currency_id: editingMovement.currency_id || '',
        wallet_id: editingMovement.wallet_id || '',
        amount: editingMovement.amount || 0,
        exchange_rate: editingMovement.exchange_rate || undefined,
        description: editingMovement.description || '',
      })
      setPanel('view')
    } else {
      form.reset({
        creator_id: userData?.user?.id || '',
        movement_date: new Date().toISOString().split('T')[0],
        type: '',
        currency_id: '',
        wallet_id: '',
        amount: 0,
        exchange_rate: undefined,
        description: '',
      })
      setPanel('edit')
    }
  }, [editingMovement, userData?.user?.id, form, setPanel])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!userData?.organization?.id || !userData?.preferences?.last_project_id) {
        throw new Error('Organization ID or Project ID not found')
      }

      if (editingMovement) {
        const { data: updatedMovement, error } = await supabase
          .from('financial_movements')
          .update({
            creator_id: data.creator_id,
            movement_date: data.movement_date,
            type: data.type,
            currency_id: data.currency_id,
            wallet_id: data.wallet_id,
            amount: data.amount,
            exchange_rate: data.exchange_rate || null,
            description: data.description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMovement.id)
          .select()
          .single()

        if (error) throw error
        return updatedMovement
      } else {
        const { data: newMovement, error } = await supabase
          .from('financial_movements')
          .insert({
            organization_id: userData.organization.id,
            project_id: userData.preferences.last_project_id,
            creator_id: data.creator_id,
            movement_date: data.movement_date,
            type: data.type,
            currency_id: data.currency_id,
            wallet_id: data.wallet_id,
            amount: data.amount,
            exchange_rate: data.exchange_rate || null,
            description: data.description || null,
          })
          .select()
          .single()

        if (error) throw error
        return newMovement
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: editingMovement ? 'Movimiento actualizado' : 'Movimiento creado',
        description: editingMovement 
          ? 'El movimiento ha sido actualizado correctamente' 
          : 'El movimiento ha sido creado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingMovement ? 'actualizar' : 'crear'} el movimiento: ${error.message}`,
      })
    }
  })

  const onSubmit = async (data: MovementForm) => {
    await createMovementMutation.mutateAsync(data)
  }

  const handleClose = () => {
    setPanel('edit')
    onClose()
  }

  const isLoading = createMovementMutation.isPending

  // Encontrar datos para display
  const selectedCurrency = currencies?.find(c => c.currency_id === form.watch('currency_id'))?.currencies
  const selectedWallet = wallets?.find(w => w.wallet_id === form.watch('wallet_id'))?.wallets
  const selectedCreator = members?.find(m => m.id === form.watch('creator_id'))
  const selectedConcept = concepts?.find(c => c.id === form.watch('type'))

  const viewPanel = editingMovement ? (
    <>
      <div>
        <h4 className="font-medium">Creador</h4>
        <p className="text-muted-foreground mt-1">
          {selectedCreator ? `${selectedCreator.first_name} ${selectedCreator.last_name || ''}`.trim() : 'Sin creador'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Fecha</h4>
        <p className="text-muted-foreground mt-1">
          {editingMovement.movement_date ? 
            format(new Date(editingMovement.movement_date), 'PPP', { locale: es }) : 
            'Sin fecha'
          }
        </p>
      </div>

      <div>
        <h4 className="font-medium">Tipo</h4>
        <p className="text-muted-foreground mt-1">
          {selectedConcept?.name || 'Sin tipo'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Moneda</h4>
        <p className="text-muted-foreground mt-1">
          {selectedCurrency?.name || 'Sin moneda'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Billetera</h4>
        <p className="text-muted-foreground mt-1">
          {selectedWallet?.name || 'Sin billetera'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Monto</h4>
        <p className="text-muted-foreground mt-1">
          {editingMovement.amount ? 
            `${selectedCurrency?.symbol || '$'} ${editingMovement.amount.toLocaleString()}` : 
            'Sin monto'
          }
        </p>
      </div>

      {editingMovement.exchange_rate && (
        <div>
          <h4 className="font-medium">Cotización</h4>
          <p className="text-muted-foreground mt-1">{editingMovement.exchange_rate}</p>
        </div>
      )}

      {editingMovement.description && (
        <div>
          <h4 className="font-medium">Descripción</h4>
          <p className="text-muted-foreground mt-1">{editingMovement.description}</p>
        </div>
      )}
    </>
  ) : null

  const editPanel = (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Creador */}
          <FormField
            control={form.control}
            name="creator_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creador *</FormLabel>
                <FormControl>
                  <UserSelector
                    organizationId={userData?.organization?.id}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar creador..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha */}
          <FormField
            control={form.control}
            name="movement_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {concepts?.map((concept) => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Moneda */}
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies?.map((currency) => (
                      <SelectItem key={currency.currency_id} value={currency.currency_id}>
                        {currency.currencies.name} ({currency.currencies.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Billetera */}
          <FormField
            control={form.control}
            name="wallet_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Billetera *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar billetera..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {wallets?.map((wallet) => (
                      <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
                        {wallet.wallets.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Monto */}
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
                    placeholder="0.00"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cotización */}
          <FormField
            control={form.control}
            name="exchange_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cotización (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="1.0000"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
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
                <FormLabel>Descripción (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción del movimiento..."
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
      title={editingMovement ? "Movimiento Financiero" : "Nuevo Movimiento"}
      icon={DollarSign}
      leftActions={
        currentPanel === 'edit' && editingMovement ? (
          <button
            type="button"
            onClick={() => setPanel('view')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Volver
          </button>
        ) : undefined
      }
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={
        currentPanel === 'view' && editingMovement ? "Editar" :
        editingMovement ? "Actualizar" : "Guardar"
      }
      onRightClick={() => {
        if (currentPanel === 'view' && editingMovement) {
          setPanel('edit')
        } else {
          form.handleSubmit(onSubmit)()
        }
      }}
      rightLoading={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  )
}