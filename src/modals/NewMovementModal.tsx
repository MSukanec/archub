import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'
import { supabase } from '@/lib/supabase'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Calendar, User, DollarSign } from 'lucide-react'

const movementSchema = z.object({
  created_at: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  is_conversion: z.boolean().default(false)
})

type MovementForm = z.infer<typeof movementSchema>

interface Movement {
  id: string
  created_at: string
  created_by: string
  description?: string
  amount: number
  type_id: string
  category_id?: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  is_conversion: boolean
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: members = [] } = useOrganizationMembers(organizationId)
  const { data: types = [] } = useMovementConcepts('parent')
  const { data: currencies = [] } = useCurrencies(organizationId)
  const { data: wallets = [] } = useWallets(organizationId)

  // Debug logging
  console.log('NewMovementModal Debug:', {
    organizationId,
    currencies: currencies.length > 0 ? currencies : 'No currencies loaded',
    wallets: wallets.length > 0 ? wallets : 'No wallets loaded',
    currenciesData: currencies,
    firstCurrency: currencies[0],
    firstCurrencyData: currencies[0]?.currencies
  })

  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  const { data: categories = [] } = useMovementConcepts('categories', selectedTypeId || undefined)
  const { data: subcategories = [] } = useMovementConcepts('categories', selectedCategoryId || undefined)

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      created_at: new Date(),
      amount: 0,
      description: '',
      is_conversion: false,
      created_by: '',
      type_id: '',
      category_id: '',
      subcategory_id: '',
      currency_id: '',
      wallet_id: ''
    }
  })

  // Initialize form when modal opens
  useEffect(() => {
    if (open && userData && members.length > 0) {
      // Set default creator
      const currentUserMembership = members.find(member => 
        member.users?.id === userData.user?.id
      )
      if (currentUserMembership) {
        form.setValue('created_by', currentUserMembership.id)
      }

      // Set defaults for new movement
      if (!editingMovement) {
        // Set default currency (the one marked as is_default)
        if (currencies.length > 0) {
          const defaultCurrency = currencies.find(c => c.is_default) || currencies[0]
          if (defaultCurrency) {
            form.setValue('currency_id', defaultCurrency.currency_id)
          }
        }
        
        // Set default wallet (the one marked as is_default)
        if (wallets.length > 0) {
          const defaultWallet = wallets.find(w => w.is_default) || wallets[0]
          form.setValue('wallet_id', defaultWallet.wallet_id)
        }
      } else {
        // Load editing data
        form.setValue('created_at', new Date(editingMovement.created_at))
        form.setValue('amount', editingMovement.amount)
        form.setValue('description', editingMovement.description || '')
        form.setValue('is_conversion', editingMovement.is_conversion || false)
        form.setValue('created_by', editingMovement.created_by)
        form.setValue('type_id', editingMovement.type_id || '')
        form.setValue('category_id', editingMovement.category_id || '')
        form.setValue('subcategory_id', editingMovement.subcategory_id || '')
        form.setValue('currency_id', editingMovement.currency_id)
        form.setValue('wallet_id', editingMovement.wallet_id)
      }
    }
  }, [open, userData, members, currencies, wallets, editingMovement, form])

  // Load editing movement data
  useEffect(() => {
    if (editingMovement && open) {
      form.setValue('created_at', new Date(editingMovement.created_at))
      form.setValue('created_by', editingMovement.created_by)
      form.setValue('description', editingMovement.description || '')
      form.setValue('amount', editingMovement.amount)
      form.setValue('type_id', editingMovement.type_id)
      form.setValue('category_id', editingMovement.category_id || '')
      form.setValue('subcategory_id', editingMovement.subcategory_id || '')
      form.setValue('currency_id', editingMovement.currency_id)
      form.setValue('wallet_id', editingMovement.wallet_id)
      form.setValue('is_conversion', editingMovement.is_conversion)

      setSelectedTypeId(editingMovement.type_id)
      setSelectedCategoryId(editingMovement.category_id || '')
    }
  }, [editingMovement, open, form])

  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value)
    form.setValue('type_id', value)
    form.setValue('category_id', '')
    form.setValue('subcategory_id', '')
    setSelectedCategoryId('')
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    form.setValue('category_id', value)
    form.setValue('subcategory_id', '')
  }

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!supabase) throw new Error('Supabase no disponible')
      
      const movementData = {
        organization_id: organizationId,
        project_id: projectId,
        created_at: data.created_at.toISOString(),
        created_by: data.created_by,
        description: data.description || null,
        amount: data.amount,
        type_id: data.type_id,
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        is_conversion: data.is_conversion
      }

      if (editingMovement) {
        const { error } = await supabase
          .from('financial_movements')
          .update(movementData)
          .eq('id', editingMovement.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('financial_movements')
          .insert([movementData])
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: editingMovement ? 'Movimiento actualizado' : 'Movimiento creado',
        description: 'La operación se completó exitosamente'
      })
      onClose()
      form.reset()
    },
    onError: (error) => {
      console.error('Error al guardar movimiento:', error)
      toast({
        title: 'Error',
        description: 'No se pudo guardar el movimiento',
        variant: 'destructive'
      })
    }
  })

  const onSubmit = (data: MovementForm) => {
    createMovementMutation.mutate(data)
  }

  const selectedCreator = members.find(m => m.id === form.watch('created_by'))

  if (!open) return null

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
            description="Gestiona los movimientos financieros del proyecto"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Primera fila: Fecha y Creador */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="created_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Fecha
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="created_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Creador
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar creador">
                                {selectedCreator && (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={selectedCreator.users?.avatar_url} />
                                      <AvatarFallback>
                                        {selectedCreator.users?.full_name?.charAt(0) || 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{selectedCreator.users?.full_name || selectedCreator.users?.email}</span>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.users?.avatar_url} />
                                    <AvatarFallback>
                                      {member.users?.full_name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{member.users?.full_name || member.users?.email}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Segunda fila: Tipo y Categoría */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={handleTypeChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
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
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={handleCategoryChange} value={field.value} disabled={!selectedTypeId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tercera fila: Subcategoría y Billetera */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subcategory_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar subcategoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
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
                    name="wallet_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billetera</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar billetera" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.wallet_id}>
                                {wallet.wallets?.name || wallet.name || 'Principal'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cuarta fila: Moneda y Cantidad */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moneda</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar moneda" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.currency_id}>
                                {currency.currencies?.name} ({currency.currencies?.code})
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
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Cantidad
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Quinta fila: Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción del movimiento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sexta fila: Conversión */}
                <FormField
                  control={form.control}
                  name="is_conversion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>¿Es una conversión?</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Marcar si este movimiento es una conversión de moneda
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={editingMovement ? 'Actualizar' : 'Crear'}
            disabled={createMovementMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  )
}