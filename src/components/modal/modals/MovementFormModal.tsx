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
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida')
})

const conversionFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  // Campos de origen (egreso)
  currency_id_from: z.string().min(1, 'Moneda origen es requerida'),
  wallet_id_from: z.string().min(1, 'Billetera origen es requerida'),
  amount_from: z.number().min(0.01, 'Cantidad origen debe ser mayor a 0'),
  // Campos de destino (ingreso)
  currency_id_to: z.string().min(1, 'Moneda destino es requerida'),
  wallet_id_to: z.string().min(1, 'Billetera destino es requerida'),
  amount_to: z.number().min(0.01, 'Cantidad destino debe ser mayor a 0'),
  // Campo informativo
  exchange_rate: z.number().optional()
}).refine((data) => data.currency_id_from !== data.currency_id_to, {
  message: "Las monedas de origen y destino deben ser diferentes",
  path: ["currency_id_to"]
})

type MovementForm = z.infer<typeof movementFormSchema>
type ConversionForm = z.infer<typeof conversionFormSchema>

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
  const { data: concepts } = useMovementConcepts('types')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Estados para la lógica jerárquica
  const [selectedTypeId, setSelectedTypeId] = React.useState('')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('')
  
  // Estado para detectar conversión
  const [isConversion, setIsConversion] = React.useState(false)

  // Hooks jerárquicos para categorías y subcategorías
  const { data: categories } = useMovementConcepts('categories', selectedTypeId)
  const { data: subcategories } = useMovementConcepts('categories', selectedCategoryId)

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      description: '',
      amount: 0,
      exchange_rate: undefined,
      type_id: '',
      category_id: '',
      subcategory_id: '',
      currency_id: '',
      wallet_id: '',
    }
  })

  const conversionForm = useForm<ConversionForm>({
    resolver: zodResolver(conversionFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      description: '',
      currency_id_from: '',
      wallet_id_from: '',
      amount_from: 0,
      currency_id_to: '',
      wallet_id_to: '',
      amount_to: 0,
      exchange_rate: undefined
    }
  })

  // Manejar envío con ENTER
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }

  // Efecto para manejar la lógica jerárquica al seleccionar tipo y detectar conversión
  React.useEffect(() => {
    const typeId = form.watch('type_id')
    if (typeId !== selectedTypeId) {
      setSelectedTypeId(typeId)
      
      // Detectar si es conversión por view_mode
      const selectedConcept = concepts?.find((concept: any) => concept.id === typeId)
      const isConversionType = selectedConcept?.view_mode === 'conversion'
      
      console.log('Conversion detection:', {
        typeId,
        selectedConcept,
        view_mode: selectedConcept?.view_mode,
        isConversionType,
        allConcepts: concepts
      })
      
      // Si cambió a conversión, preservar creador y fecha
      if (isConversionType && !isConversion) {
        const currentCreator = form.getValues('created_by')
        const currentDate = form.getValues('movement_date')
        conversionForm.setValue('created_by', currentCreator)
        if (currentDate) {
          conversionForm.setValue('movement_date', currentDate)
        }
      }
      // Si cambió desde conversión, preservar creador y fecha
      else if (!isConversionType && isConversion) {
        const currentCreator = conversionForm.getValues('created_by')
        const currentDate = conversionForm.getValues('movement_date')
        form.setValue('created_by', currentCreator)
        if (currentDate) {
          form.setValue('movement_date', currentDate)
        }
      }
      
      setIsConversion(isConversionType)
      
      // Reset categoría y subcategoría cuando cambia el tipo
      if (typeId !== editingMovement?.type_id) {
        form.setValue('category_id', '')
        form.setValue('subcategory_id', '')
        setSelectedCategoryId('')
      }
    }
  }, [form.watch('type_id'), concepts, isConversion])

  // Efecto para manejar la lógica jerárquica al seleccionar categoría
  React.useEffect(() => {
    const categoryId = form.watch('category_id')
    if (categoryId !== selectedCategoryId) {
      setSelectedCategoryId(categoryId)
      // Reset subcategoría cuando cambia la categoría
      if (categoryId !== editingMovement?.category_id) {
        form.setValue('subcategory_id', '')
      }
    }
  }, [form.watch('category_id')])

  React.useEffect(() => {
    if (editingMovement) {
      // Wait for all data to be loaded
      if (!members || !currencies || !wallets || !concepts) return
      
      // Set hierarchical states for editing
      setSelectedTypeId(editingMovement.type_id || '')
      setSelectedCategoryId(editingMovement.category_id || '')
      
      // Map currency_id and wallet_id to organization-specific IDs
      const matchingCurrency = currencies?.find((c: any) => 
        c.currency?.id === editingMovement.currency_id
      )
      const matchingWallet = wallets?.find(w => 
        w.wallets?.id === editingMovement.wallet_id || w.wallet_id === editingMovement.wallet_id
      )
      
      console.log('Loading editing movement:', {
        editingMovement,
        matchingCurrency: matchingCurrency?.currency_id,
        matchingWallet: matchingWallet?.wallet_id,
        created_by: editingMovement.created_by
      })
      
      form.reset({
        movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
        created_by: editingMovement.created_by || '',
        description: editingMovement.description || '',
        amount: editingMovement.amount || 0,
        exchange_rate: editingMovement.exchange_rate || undefined,
        type_id: editingMovement.type_id || '',
        category_id: editingMovement.category_id || '',
        subcategory_id: editingMovement.subcategory_id || '',
        currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
        wallet_id: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
      })
      setPanel('view')
    } else {
      // New movement mode - wait for all data to be loaded
      if (!members || !currencies || !wallets) return
      
      const currentMember = members?.find(m => m.user_id === userData?.user?.id)
      const defaultOrgCurrency = currencies?.find((c: any) => c.is_default) || currencies?.[0]
      const defaultWallet = wallets?.find(w => w.is_default) || wallets?.[0]

      console.log('Setting defaults:', {
        currentMember: currentMember?.id,
        defaultCurrency: defaultOrgCurrency?.currency?.id,
        defaultWallet: defaultWallet?.wallet_id
      })

      form.reset({
        movement_date: new Date(),
        created_by: currentMember?.id || '',
        description: '',
        amount: 0,
        exchange_rate: undefined,
        type_id: '',
        category_id: '',
        subcategory_id: '',
        currency_id: defaultOrgCurrency?.currency?.id || '',
        wallet_id: defaultWallet?.wallet_id || '',
      })
      setPanel('edit')
    }
  }, [editingMovement, userData?.user?.id, form, setPanel, members, currencies, wallets, concepts])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!userData?.organization?.id || !userData?.preferences?.last_project_id) {
        throw new Error('Organization ID or Project ID not found')
      }

      const movementData = {
        ...data,
        organization_id: userData.organization.id,
        project_id: userData.preferences.last_project_id,
        movement_date: data.movement_date.toISOString().split('T')[0],
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        exchange_rate: data.exchange_rate || null,
        description: data.description || null,
      }

      if (editingMovement) {
        const { data: result, error } = await supabase
          .from('movements')
          .update(movementData)
          .eq('id', editingMovement.id)
          .select()
          .single()

        if (error) throw error
        return result
      } else {
        const { data: result, error } = await supabase
          .from('movements')
          .insert(movementData)
          .select()
          .single()

        if (error) throw error
        return result
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

  const createConversionMutation = useMutation({
    mutationFn: async (data: ConversionForm) => {
      if (!userData?.organization?.id || !userData?.preferences?.last_project_id) {
        throw new Error('Organization ID or Project ID not found')
      }

      // Generar UUID para el grupo de conversión
      const conversionGroupId = crypto.randomUUID()

      // Buscar tipos de egreso e ingreso
      const egressType = concepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('egreso')
      )
      const ingressType = concepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('ingreso')
      )

      const baseMovementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences.last_project_id,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        conversion_group_id: conversionGroupId
      }

      // Crear movimiento de egreso (origen)
      const egressData = {
        ...baseMovementData,
        description: data.description || 'Conversión - Salida',
        amount: data.amount_from,
        currency_id: data.currency_id_from,
        wallet_id: data.wallet_id_from,
        type_id: egressType?.id || concepts?.find(c => c.name?.toLowerCase() === 'conversión')?.id,
        exchange_rate: data.exchange_rate || null
      }

      // Crear movimiento de ingreso (destino)
      const ingressData = {
        ...baseMovementData,
        description: data.description || 'Conversión - Entrada',
        amount: data.amount_to,
        currency_id: data.currency_id_to,
        wallet_id: data.wallet_id_to,
        type_id: ingressType?.id || concepts?.find(c => c.name?.toLowerCase() === 'conversión')?.id,
        exchange_rate: data.exchange_rate || null
      }

      // Insertar ambos movimientos
      const { data: results, error } = await supabase
        .from('movements')
        .insert([egressData, ingressData])
        .select()

      if (error) throw error
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Conversión creada',
        description: 'La conversión ha sido creada correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al crear la conversión: ${error.message}`,
      })
    }
  })

  const onSubmit = async (data: MovementForm) => {
    await createMovementMutation.mutateAsync(data)
  }

  const onSubmitConversion = async (data: ConversionForm) => {
    await createConversionMutation.mutateAsync(data)
  }

  const handleClose = () => {
    setPanel('edit')
    onClose()
  }

  const isLoading = createMovementMutation.isPending

  // Encontrar datos para display
  const selectedCurrency = currencies?.find(c => c.currency?.id === form.watch('currency_id'))?.currency
  const selectedWallet = wallets?.find(w => w.wallet_id === form.watch('wallet_id'))?.wallets
  const selectedCreator = members?.find(m => m.id === form.watch('created_by'))
  const selectedConcept = concepts?.find(c => c.id === form.watch('type_id'))

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
      {isConversion ? (
        // FORMULARIO DE CONVERSIÓN
        <Form {...conversionForm}>
          <form onSubmit={conversionForm.handleSubmit(onSubmitConversion)} className="space-y-4">
            {/* Fila 1: Creador | Fecha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={conversionForm.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creador *</FormLabel>
                    <FormControl>
                      <UserSelector
                        users={members || []}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Seleccionar creador"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={conversionForm.control}
                name="movement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const localDate = new Date(e.target.value + 'T00:00:00');
                          field.onChange(localDate);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descripción (full width) */}
            <FormField
              control={conversionForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción de la conversión..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sección ORIGEN */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">💰 Datos de Origen (Egreso)</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <FormField
                  control={conversionForm.control}
                  name="currency_id_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda Origen *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies?.map((orgCurrency) => (
                            <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id || ''}>
                              {orgCurrency.currency?.name || 'Sin nombre'} ({orgCurrency.currency?.symbol || '$'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={conversionForm.control}
                  name="wallet_id_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billetera Origen *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets?.map((wallet) => (
                            <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
                              {wallet.wallets?.name || 'Sin nombre'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={conversionForm.control}
                  name="amount_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad Origen *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sección DESTINO */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">💰 Datos de Destino (Ingreso)</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <FormField
                  control={conversionForm.control}
                  name="currency_id_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda Destino *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies?.map((orgCurrency) => (
                            <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id || ''}>
                              {orgCurrency.currency?.name || 'Sin nombre'} ({orgCurrency.currency?.symbol || '$'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={conversionForm.control}
                  name="wallet_id_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billetera Destino *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets?.map((wallet) => (
                            <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
                              {wallet.wallets?.name || 'Sin nombre'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={conversionForm.control}
                  name="amount_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad Destino *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Exchange Rate (opcional) */}
            <FormField
              control={conversionForm.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotización (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="Ej: 1.25"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      ) : (
        // FORMULARIO NORMAL
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
          {/* Desktop: Grid Layout, Mobile: Single Column */}
          
          {/* Fila 1: Creador | Fecha */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creador *</FormLabel>
                  <FormControl>
                    <UserSelector
                      users={members || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar creador"
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
                    <Input
                      type="date"
                      value={field.value ? field.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const localDate = new Date(e.target.value + 'T00:00:00');
                        field.onChange(localDate);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fila 2: Tipo (full width) */}
          <FormField
            control={form.control}
            name="type_id"
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

          {/* Fila 3: Categoría (full width) */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value)
                    setSelectedCategoryId(value)
                  }} 
                  value={field.value}
                  disabled={!selectedTypeId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedTypeId ? "Seleccione primero un tipo" : "Seleccionar categoría..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories?.map((category: any) => (
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

          {/* Fila 4: Subcategoría (full width) */}
          <FormField
            control={form.control}
            name="subcategory_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcategoría</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  disabled={!selectedCategoryId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedCategoryId ? "Seleccione primero una categoría" : "Seleccionar subcategoría..."} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subcategories?.map((subcategory: any) => (
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

          {/* Fila 5: Moneda | Billetera */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      {currencies?.map((orgCurrency) => (
                        <SelectItem key={orgCurrency.currency?.id} value={orgCurrency.currency?.id || ''}>
                          {orgCurrency.currency?.name || 'Sin nombre'} ({orgCurrency.currency?.symbol || '$'})
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
                          {wallet.wallets?.name || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fila 6: Monto | Cotización */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-10"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotización (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001"
                      min="0"
                      placeholder="Ej: 1.0000"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fila 5: Descripción (full width) */}
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
      )}
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
        editingMovement ? "Actualizar" : (isConversion ? "Crear Conversión" : "Guardar")
      }
      onRightClick={() => {
        if (currentPanel === 'view' && editingMovement) {
          setPanel('edit')
        } else {
          if (isConversion) {
            conversionForm.handleSubmit(onSubmitConversion)()
          } else {
            form.handleSubmit(onSubmit)()
          }
        }
      }}
      rightLoading={isLoading || createConversionMutation.isPending}
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