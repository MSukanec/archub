import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useOrganizationCurrencies, useOrganizationDefaultCurrency } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { supabase } from '@/lib/supabase'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'

const movementSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida')
})

const conversionSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  // Movimiento de salida (egreso)
  from_amount: z.number().min(0.01, 'Monto origen debe ser mayor a 0'),
  from_currency_id: z.string().min(1, 'Moneda origen es requerida'),
  from_wallet_id: z.string().min(1, 'Billetera origen es requerida'),
  // Movimiento de entrada (ingreso)
  to_amount: z.number().min(0.01, 'Monto destino debe ser mayor a 0'),
  to_currency_id: z.string().min(1, 'Moneda destino es requerida'),
  to_wallet_id: z.string().min(1, 'Billetera destino es requerida')
}).refine((data) => data.from_currency_id !== data.to_currency_id, {
  message: "Las monedas de origen y destino deben ser diferentes",
  path: ["to_currency_id"]
})

type MovementForm = z.infer<typeof movementSchema>
type ConversionForm = z.infer<typeof conversionSchema>

interface Movement {
  id: string
  created_at: string
  movement_date: string
  created_by: string
  description?: string
  amount: number
  type_id: string
  category_id?: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  organization_id: string
  project_id?: string
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: members } = useOrganizationMembers(organizationId)
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isConversion, setIsConversion] = useState(false)
  
  const { data: types } = useMovementConcepts('types')
  const { data: categories } = useMovementConcepts('categories', selectedTypeId)
  const { data: subcategories } = useMovementConcepts('categories', selectedCategoryId)
  const { data: organizationCurrencies } = useOrganizationCurrencies(organizationId)
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId)
  const { data: wallets } = useOrganizationWallets(organizationId)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      movement_date: new Date(),
      amount: 0,
      description: '',
      created_by: '',
      type_id: '',
      category_id: '',
      subcategory_id: '',
      currency_id: '',
      wallet_id: ''
    }
  })

  const conversionForm = useForm<ConversionForm>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      movement_date: new Date(),
      description: '',
      created_by: '',
      from_amount: 0,
      from_currency_id: '',
      from_wallet_id: '',
      to_amount: 0,
      to_currency_id: '',
      to_wallet_id: ''
    }
  })

  // Effect to initialize form when modal opens or data becomes available
  useEffect(() => {
    if (!open) return
    
    if (editingMovement) {
      // Wait for all data to be loaded
      if (!members || !organizationCurrencies || !wallets || !types) return
      
      console.log('Initializing edit form with movement:', editingMovement)
      
      // Check if this is a conversion being edited
      const isEditingConversion = (editingMovement as any)._isConversion;
      const conversionData = (editingMovement as any)._conversionData;
      
      if (isEditingConversion && conversionData) {
        // Handle conversion editing
        console.log('Editing conversion with data:', conversionData);
        
        // Set conversion type to trigger isConversion state
        const conversionType = types?.find((type: any) => 
          type.name?.toLowerCase() === 'conversión' || type.name?.toLowerCase() === 'conversion'
        );
        if (conversionType) {
          setSelectedTypeId(conversionType.id);
        }
        
        // Initialize conversion form with data from both movements
        const egresoMovement = conversionData.movements.find((m: any) => 
          m.movement_data?.type?.name?.toLowerCase().includes('egreso')
        );
        const ingresoMovement = conversionData.movements.find((m: any) => 
          m.movement_data?.type?.name?.toLowerCase().includes('ingreso')
        );
        
        if (egresoMovement && ingresoMovement) {
          const currentMember = members?.find(m => m.user_id === currentUser?.user?.id);
          
          conversionForm.reset({
            movement_date: new Date(conversionData.movement_date),
            description: conversionData.description || '',
            created_by: currentMember?.id || '',
            from_amount: egresoMovement.amount,
            from_currency_id: egresoMovement.currency_id,
            from_wallet_id: egresoMovement.wallet_id,
            to_amount: ingresoMovement.amount,
            to_currency_id: ingresoMovement.currency_id,
            to_wallet_id: ingresoMovement.wallet_id
          });
        }
        
        return;
      }
      
      // Handle regular movement editing
      setSelectedTypeId(editingMovement.type_id)
      setSelectedCategoryId(editingMovement.category_id || '')
      
      // Map currency_id and wallet_id to organization-specific IDs
      const matchingCurrency = organizationCurrencies?.find((c: any) => 
        c.currency?.id === editingMovement.currency_id
      )
      const matchingWallet = wallets?.find(w => 
        w.wallets?.id === editingMovement.wallet_id || w.wallet_id === editingMovement.wallet_id
      )
      
      // Reset form with all values
      form.reset({
        movement_date: new Date(editingMovement.movement_date || editingMovement.created_at),
        created_by: editingMovement.created_by,
        description: editingMovement.description || '',
        amount: editingMovement.amount,
        type_id: editingMovement.type_id,
        category_id: editingMovement.category_id || '',
        subcategory_id: editingMovement.subcategory_id || '',
        currency_id: matchingCurrency?.currency?.id || editingMovement.currency_id,
        wallet_id: matchingWallet?.wallet_id || editingMovement.wallet_id
      })
      
      console.log('Form reset with values:', {
        type_id: editingMovement.type_id,
        category_id: editingMovement.category_id,
        subcategory_id: editingMovement.subcategory_id,
        created_by: editingMovement.created_by
      })
    } else {
      // New movement mode
      if (!members || !organizationCurrencies || !wallets) return
      
      setSelectedTypeId('')
      setSelectedCategoryId('')
      
      const currentMember = members?.find(m => m.user_id === currentUser?.user?.id)
      const defaultOrgCurrency = organizationCurrencies?.find((c: any) => c.is_default) || organizationCurrencies?.[0]
      const defaultWallet = wallets?.find(w => w.is_default) || wallets?.[0]

      // Initialize normal form
      form.reset({
        movement_date: new Date(),
        amount: 0,
        description: '',
        created_by: currentMember?.id || '',
        type_id: '',
        category_id: '',
        subcategory_id: '',
        currency_id: defaultOrgCurrency?.currency?.id || '',
        wallet_id: defaultWallet?.wallet_id || ''
      })

      // Initialize conversion form
      conversionForm.reset({
        movement_date: new Date(),
        description: '',
        created_by: currentMember?.id || '',
        from_amount: 0,
        from_currency_id: defaultOrgCurrency?.currency?.id || '',
        from_wallet_id: defaultWallet?.wallet_id || '',
        to_amount: 0,
        to_currency_id: '',
        to_wallet_id: defaultWallet?.wallet_id || ''
      })
    }
  }, [open, editingMovement, members, organizationCurrencies, wallets, types])

  // Effect to detect conversion type
  useEffect(() => {
    if (!types || !selectedTypeId) return
    
    const selectedType = types.find((type: any) => type.id === selectedTypeId)
    const isConversionType = selectedType?.name?.toLowerCase() === 'conversión' || selectedType?.name?.toLowerCase() === 'conversion'
    setIsConversion(isConversionType)
  }, [selectedTypeId, types])

  // Effect specifically for updating categories when the type selection triggers loading
  useEffect(() => {
    if (!editingMovement || !open) return
    if (!categories || !types) return
    
    // Only run if we have the editing movement's type selected
    if (selectedTypeId === editingMovement.type_id && editingMovement.category_id) {
      console.log('Setting category from editing movement:', editingMovement.category_id)
      form.setValue('category_id', editingMovement.category_id)
      setSelectedCategoryId(editingMovement.category_id)
    }
  }, [categories, selectedTypeId, editingMovement, open])

  // Effect for updating subcategories when category selection triggers loading
  useEffect(() => {
    if (!editingMovement || !open) return
    if (!subcategories || !categories) return
    
    // Only run if we have the editing movement's category selected
    if (selectedCategoryId === editingMovement.category_id && editingMovement.subcategory_id) {
      console.log('Setting subcategory from editing movement:', editingMovement.subcategory_id)
      form.setValue('subcategory_id', editingMovement.subcategory_id)
    }
  }, [subcategories, selectedCategoryId, editingMovement, open])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!supabase) throw new Error('Supabase no está disponible')
      if (!organizationId) throw new Error('No hay organización seleccionada')

      const movementData = {
        ...data,
        organization_id: organizationId,
        project_id: currentUser?.preferences?.last_project_id,
        movement_date: data.movement_date.toISOString().split('T')[0]
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
        description: `El movimiento ha sido ${editingMovement ? 'actualizado' : 'creado'} exitosamente.`,
      })
      onClose()
      // Don't reset immediately, let the modal close first
      setTimeout(() => {
        form.reset({
          movement_date: new Date(),
          amount: 0,
          description: '',
          created_by: '',
          type_id: '',
          category_id: '',
          subcategory_id: '',
          currency_id: '',
          wallet_id: ''
        })
      }, 100)
    },
    onError: (error) => {
      console.error('Error saving movement:', error)
      toast({
        title: 'Error',
        description: 'Hubo un error al guardar el movimiento. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      })
    },
  })

  const createConversionMutation = useMutation({
    mutationFn: async (data: ConversionForm) => {
      if (!supabase) throw new Error('Supabase no está disponible')
      if (!organizationId) throw new Error('No hay organización seleccionada')

      // Check if we're editing an existing conversion
      const isEditingConversion = (editingMovement as any)?._isConversion;
      const conversionData = (editingMovement as any)?._conversionData;

      if (isEditingConversion && conversionData) {
        // UPDATE existing conversion movements
        const egresoMovement = conversionData.movements.find((m: any) => 
          m.movement_data?.type?.name?.toLowerCase().includes('egreso')
        );
        const ingresoMovement = conversionData.movements.find((m: any) => 
          m.movement_data?.type?.name?.toLowerCase().includes('ingreso')
        );

        if (!egresoMovement || !ingresoMovement) {
          throw new Error('No se encontraron los movimientos de la conversión');
        }

        // Update egreso movement
        const { error: egresoError } = await supabase
          .from('movements')
          .update({
            movement_date: data.movement_date.toISOString().split('T')[0],
            description: data.description || 'Conversión - Salida',
            amount: data.from_amount,
            currency_id: data.from_currency_id,
            wallet_id: data.from_wallet_id,
            created_by: data.created_by
          })
          .eq('id', egresoMovement.id);

        if (egresoError) throw egresoError;

        // Update ingreso movement
        const { error: ingresoError } = await supabase
          .from('movements')
          .update({
            movement_date: data.movement_date.toISOString().split('T')[0],
            description: data.description || 'Conversión - Entrada',
            amount: data.to_amount,
            currency_id: data.to_currency_id,
            wallet_id: data.to_wallet_id,
            created_by: data.created_by
          })
          .eq('id', ingresoMovement.id);

        if (ingresoError) throw ingresoError;

        console.log('Conversion updated successfully');
        return [egresoMovement, ingresoMovement];
      } else {
        // CREATE new conversion
        const conversionType = types?.find((type: any) => 
          type.name?.toLowerCase() === 'conversión' || type.name?.toLowerCase() === 'conversion'
        )
        if (!conversionType) throw new Error('Tipo de conversión no encontrado')

        // Generar UUID para el grupo de conversión
        const conversionGroupId = crypto.randomUUID()

        // Movimiento de salida (egreso)
        const egressType = types?.find((type: any) => 
          type.name?.toLowerCase() === 'egresos' || type.name?.toLowerCase() === 'egreso'
        )
        
        const egressMovement = {
          movement_date: data.movement_date.toISOString().split('T')[0],
          created_by: data.created_by,
          description: data.description || 'Conversión - Salida',
          amount: data.from_amount,
          type_id: egressType?.id || conversionType.id,
          currency_id: data.from_currency_id,
          wallet_id: data.from_wallet_id,
          organization_id: organizationId,
          project_id: currentUser?.preferences?.last_project_id,
          conversion_group_id: conversionGroupId
        }

        // Movimiento de entrada (ingreso)
        const ingressType = types?.find((type: any) => 
          type.name?.toLowerCase() === 'ingresos' || type.name?.toLowerCase() === 'ingreso'
        )
        
        const ingressMovement = {
          movement_date: data.movement_date.toISOString().split('T')[0],
          created_by: data.created_by,
          description: data.description || 'Conversión - Entrada',
          amount: data.to_amount,
          type_id: ingressType?.id || conversionType.id,
          currency_id: data.to_currency_id,
          wallet_id: data.to_wallet_id,
          organization_id: organizationId,
          project_id: currentUser?.preferences?.last_project_id,
          conversion_group_id: conversionGroupId
        }

        // Insertar ambos movimientos
        const { data: movements, error } = await supabase
          .from('movements')
          .insert([egressMovement, ingressMovement])
          .select()

        if (error) throw error
        return movements
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      const isEditing = (editingMovement as any)?._isConversion;
      toast({
        title: isEditing ? 'Conversión actualizada' : 'Conversión creada',
        description: isEditing 
          ? 'La conversión ha sido actualizada exitosamente.' 
          : 'La conversión ha sido creada exitosamente con ambos movimientos.',
      })
      onClose()
      // Reset form
      setTimeout(() => {
        conversionForm.reset({
          movement_date: new Date(),
          description: '',
          created_by: '',
          from_amount: 0,
          from_currency_id: '',
          from_wallet_id: '',
          to_amount: 0,
          to_currency_id: '',
          to_wallet_id: ''
        })
      }, 100)
    },
    onError: (error) => {
      console.error('Error creating conversion:', error)
      toast({
        title: 'Error',
        description: 'Hubo un error al crear la conversión. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: MovementForm) => {
    console.log('Submitting movement data:', data);
    createMovementMutation.mutate(data)
  }

  const onSubmitConversion = (data: ConversionForm) => {
    console.log('Submitting conversion data:', data);
    createConversionMutation.mutate(data)
  }

  // Get filtered concepts
  const typeOptions = types || []
  const categoryOptions = categories || []
  const subcategoryOptions = subcategories || []

  const selectedCreator = members?.find(m => m.id === form.watch('created_by'))

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
          <CustomModalBody padding="md" columns={1}>
            {isConversion ? (
              <Form {...conversionForm}>
                <form 
                  key="conversion-form"
                  onSubmit={conversionForm.handleSubmit(onSubmitConversion)} 
                  className="space-y-4"
                >
                  <Accordion type="single" defaultValue="conversion-data" collapsible>
                    <AccordionItem value="conversion-data">
                      <AccordionTrigger>
                        Datos de Conversión
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-3">
                        {/* Fecha y Creador */}
                        <FormField
                          control={conversionForm.control}
                          name="movement_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de la Conversión</FormLabel>
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

                        <FormField
                          control={conversionForm.control}
                          name="created_by"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Creador</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar creador" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {members?.map((member: any) => {
                                    const user = member.user;
                                    const displayName = user?.full_name || user?.email || 'Usuario sin nombre';
                                    
                                    return (
                                      <SelectItem key={member.id} value={member.id}>
                                        {displayName}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={conversionForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción (opcional)</FormLabel>
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

                        {/* Divider */}
                        <div className="border-t pt-3 mt-3">
                          <h4 className="text-sm font-medium mb-3">Origen</h4>
                        </div>

                        <FormField
                          control={conversionForm.control}
                          name="from_currency_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Moneda</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar moneda origen" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {organizationCurrencies?.map((orgCurrency: any) => (
                                    <SelectItem key={orgCurrency.currency.id} value={orgCurrency.currency.id}>
                                      {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
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
                          name="from_wallet_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billetera</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera origen" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {wallets?.map((wallet: any) => (
                                    <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
                                      {wallet.wallets?.name || wallet.name || 'Sin nombre'}
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
                          name="from_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="pl-8"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Divider */}
                        <div className="border-t pt-3 mt-3">
                          <h4 className="text-sm font-medium mb-3">Destino</h4>
                        </div>

                        <FormField
                          control={conversionForm.control}
                          name="to_currency_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Moneda</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar moneda destino" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {organizationCurrencies?.map((orgCurrency: any) => (
                                    <SelectItem key={orgCurrency.currency.id} value={orgCurrency.currency.id}>
                                      {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
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
                          name="to_wallet_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billetera</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera destino" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {wallets?.map((wallet: any) => (
                                    <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
                                      {wallet.wallets?.name || wallet.name || 'Sin nombre'}
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
                          name="to_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cantidad</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="pl-8"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            ) : (
              <Form {...form}>
                <form 
                  key={editingMovement?.id || 'new'} 
                  onSubmit={form.handleSubmit(onSubmit)} 
                  className="space-y-4"
                >
                  <Accordion type="single" defaultValue="informacion-basica" collapsible>
                    <AccordionItem value="informacion-basica">
                      <AccordionTrigger>
                        Información Básica
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-3">
                      <FormField
                        control={form.control}
                        name="movement_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Fecha del Movimiento
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  // Parse as local date to avoid UTC timezone shifts
                                  const localDate = new Date(e.target.value + 'T00:00:00');
                                  field.onChange(localDate);
                                }}
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
                            <FormLabel>
                              Creador
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar creador" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {members?.map((member: any) => {
                                  const user = member.user;
                                  const displayName = user?.full_name || user?.email || 'Usuario sin nombre';
                                  
                                  return (
                                    <SelectItem key={member.id} value={member.id}>
                                      {displayName}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value)
                              setSelectedTypeId(value)
                              // Clear dependent fields when type changes
                              setSelectedCategoryId('')
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {typeOptions.map((type: any) => (
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
                            <Select onValueChange={(value) => {
                              field.onChange(value)
                              setSelectedCategoryId(value)
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categoryOptions.map((category: any) => (
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

                      <FormField
                        control={form.control}
                        name="subcategory_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoría</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar subcategoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subcategoryOptions.map((subcategory: any) => (
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
                                {wallets?.map((wallet: any) => (
                                  <SelectItem key={wallet.wallet_id} value={wallet.wallet_id}>
                                    {wallet.wallets?.name || wallet.name || 'Sin nombre'}
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
                                {organizationCurrencies?.map((orgCurrency: any) => (
                                  <SelectItem key={orgCurrency.currency.id} value={orgCurrency.currency.id}>
                                    {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
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
                            <FormLabel>
                              Cantidad
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="pl-8"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                    </AccordionContent>
                  </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            )}
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={isConversion ? conversionForm.handleSubmit(onSubmitConversion) : form.handleSubmit(onSubmit)}
            saveText={editingMovement ? 'Actualizar' : (isConversion ? 'Crear Conversión' : 'Crear')}
          />
        )
      }}
    </CustomModalLayout>
  )
}