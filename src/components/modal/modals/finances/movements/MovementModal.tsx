import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'

import DatePicker from '@/components/ui-custom/DatePicker'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { DefaultMovementFields } from './fields/DefaultFields'
import { ConversionFields } from './fields/ConversionFields'
import { TransferFields } from './fields/TransferFields'
import { CustomButton } from '@/components/ui-custom/CustomButton'
import { Users, FileText, ShoppingCart, Package, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PersonnelForm } from './forms/PersonnelForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

// Schema básico para el modal simple
const basicMovementSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  type_id: z.string().min(1, 'Tipo de movimiento es requerido'),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  description: z.string().optional(), // Descripción opcional
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional()
})

// Schema para conversión (como en el modal original)
const conversionSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
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

// Schema para transferencia interna
const transferSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id_from: z.string().min(1, 'Billetera origen es requerida'),
  wallet_id_to: z.string().min(1, 'Billetera destino es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0')
}).refine((data) => data.wallet_id_from !== data.wallet_id_to, {
  message: "Las billeteras de origen y destino deben ser diferentes",
  path: ["wallet_id_to"]
})

type BasicMovementForm = z.infer<typeof basicMovementSchema>
type ConversionForm = z.infer<typeof conversionSchema>
type TransferForm = z.infer<typeof transferSchema>

interface MovementModalProps {
  modalData?: any
  onClose: () => void
}

export function MovementModal({ modalData, onClose }: MovementModalProps) {
  // Hooks
  const { data: userData } = useCurrentUser()
  const { data: currencies } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets } = useWallets(userData?.organization?.id)
  const { data: movementConcepts } = useOrganizationMovementConcepts(userData?.organization?.id)
  const { data: members } = useOrganizationMembers(userData?.organization?.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // States for hierarchical selection like the original modal
  const [selectedTypeId, setSelectedTypeId] = React.useState('')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = React.useState('')
  
  // State para detectar tipo de movimiento
  const [movementType, setMovementType] = React.useState<'normal' | 'conversion' | 'transfer'>('normal')
  const [showPersonnelForm, setShowPersonnelForm] = React.useState(false)

  // Extract default values like the original modal
  const defaultCurrency = userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id
  const defaultWallet = userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id
  
  // Find current member like the original modal
  const currentMember = React.useMemo(() => {
    return members?.find(m => m.user_id === userData?.user?.id)
  }, [members, userData?.user?.id])

  // Calculate categories and subcategories like the original modal
  const categories = React.useMemo(() => {
    if (!movementConcepts || !selectedTypeId) return []
    
    // Flatten the structure to find the selected type
    const flattenConcepts = (concepts: any[]): any[] => {
      return concepts.reduce((acc, concept) => {
        acc.push(concept)
        if (concept.children && concept.children.length > 0) {
          acc.push(...flattenConcepts(concept.children))
        }
        return acc
      }, [])
    }
    
    const allConcepts = flattenConcepts(movementConcepts)
    const selectedType = allConcepts.find(concept => concept.id === selectedTypeId)
    
    return selectedType?.children || []
  }, [movementConcepts, selectedTypeId])

  const subcategories = React.useMemo(() => {
    if (!selectedCategoryId || !categories) return []
    
    const selectedCategory = categories.find((cat: any) => cat.id === selectedCategoryId)
    return selectedCategory?.children || []
  }, [categories, selectedCategoryId])

  // Form setup with proper fallbacks like the original modal
  const form = useForm<BasicMovementForm>({
    resolver: zodResolver(basicMovementSchema),
    defaultValues: {
      movement_date: new Date(), // HOY por defecto
      created_by: currentMember?.id || '',
      type_id: '',
      category_id: '',
      subcategory_id: '',
      description: '',
      currency_id: defaultCurrency || '',
      wallet_id: defaultWallet || '',
      amount: 0
    }
  })

  // Conversion form (como en el modal original)
  const conversionForm = useForm<ConversionForm>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: currentMember?.id || '',
      description: '',
      type_id: '',
      currency_id_from: defaultCurrency || '',
      wallet_id_from: defaultWallet || '',
      amount_from: 0,
      currency_id_to: '',
      wallet_id_to: '',
      amount_to: 0,
      exchange_rate: undefined
    }
  })

  // Transfer form
  const transferForm = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: currentMember?.id || '',
      description: '',
      type_id: '',
      currency_id: defaultCurrency || '',
      wallet_id_from: defaultWallet || '',
      wallet_id_to: '',
      amount: 0
    }
  })

  // Set default values when data loads (like the original modal)
  React.useEffect(() => {
    if (defaultCurrency && !form.watch('currency_id')) {
      form.setValue('currency_id', defaultCurrency)
    }
    if (defaultWallet && !form.watch('wallet_id')) {
      form.setValue('wallet_id', defaultWallet)
    }
    if (currentMember?.id && !form.watch('created_by')) {
      form.setValue('created_by', currentMember.id)
    }
    
    // También actualizar conversion form
    if (currentMember?.id && !conversionForm.watch('created_by')) {
      conversionForm.setValue('created_by', currentMember.id)
    }
    if (defaultCurrency && !conversionForm.watch('currency_id_from')) {
      conversionForm.setValue('currency_id_from', defaultCurrency)
    }
    if (defaultWallet && !conversionForm.watch('wallet_id_from')) {
      conversionForm.setValue('wallet_id_from', defaultWallet)
    }

    // También actualizar transfer form
    if (currentMember?.id && !transferForm.watch('created_by')) {
      transferForm.setValue('created_by', currentMember.id)
    }
    if (defaultCurrency && !transferForm.watch('currency_id')) {
      transferForm.setValue('currency_id', defaultCurrency)
    }
    if (defaultWallet && !transferForm.watch('wallet_id_from')) {
      transferForm.setValue('wallet_id_from', defaultWallet)
    }
  }, [defaultCurrency, defaultWallet, currentMember, form, conversionForm, transferForm])

  // Handle type change para detectar conversión (como en el modal original)
  const handleTypeChange = React.useCallback((newTypeId: string) => {
    if (!newTypeId || !movementConcepts) return
    
    setSelectedTypeId(newTypeId)
    
    // Detectar tipo de movimiento por view_mode 
    const selectedConcept = movementConcepts.find((concept: any) => concept.id === newTypeId)
    const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
    
    if (viewMode === "conversion") {
      setMovementType('conversion')
    } else if (viewMode === "transfer") {
      setMovementType('transfer')
    } else {
      setMovementType('normal')
    }
    
    // Sincronizar type_id en todos los formularios
    form.setValue('type_id', newTypeId)
    conversionForm.setValue('type_id', newTypeId)
    transferForm.setValue('type_id', newTypeId)
    
    // Reset categorías
    setSelectedCategoryId('')
    setSelectedSubcategoryId('')
    form.setValue('category_id', '')
    form.setValue('subcategory_id', '')
  }, [movementConcepts, form, conversionForm, transferForm])

  // Mutation para crear el movimiento normal
  const createMovementMutation = useMutation({
    mutationFn: async (data: BasicMovementForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Preparar datos del movimiento según la estructura de la tabla
      const movementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description,
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id, // Este debe ser el organization_wallet.id 
        type_id: data.type_id,
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        exchange_rate: data.exchange_rate || null,
        is_conversion: false,
        is_favorite: false
      }

      const { data: result, error } = await supabase
        .from('movements')
        .insert(movementData)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      toast({
        title: 'Movimiento creado',
        description: 'El movimiento ha sido creado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al crear el movimiento: ${error.message}`,
      })
    }
  })

  // Mutation para crear conversión (como en el modal original)
  const createConversionMutation = useMutation({
    mutationFn: async (data: ConversionForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Crear nueva conversión con grupo UUID
      const conversionGroupId = crypto.randomUUID()

      // Buscar tipos de egreso e ingreso
      const egressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('egreso')
      )
      const ingressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('ingreso')
      )

      // Crear movimiento de egreso
      const egressMovementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Conversión - Salida',
        amount: data.amount_from,
        currency_id: data.currency_id_from,
        wallet_id: data.wallet_id_from,
        type_id: egressType?.id || data.type_id,
        conversion_group_id: conversionGroupId,
        exchange_rate: data.exchange_rate || null,
        is_conversion: true,
        is_favorite: false
      }

      // Crear movimiento de ingreso
      const ingressMovementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Conversión - Entrada',
        amount: data.amount_to,
        currency_id: data.currency_id_to,
        wallet_id: data.wallet_id_to,
        type_id: ingressType?.id || data.type_id,
        conversion_group_id: conversionGroupId,
        exchange_rate: data.exchange_rate || null,
        is_conversion: true,
        is_favorite: false
      }

      // Insertar ambos movimientos
      const { data: results, error } = await supabase
        .from('movements')
        .insert([egressMovementData, ingressMovementData])
        .select()

      if (error) throw error
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
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

  // Mutation para crear transferencia interna
  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Crear nueva transferencia con grupo UUID
      const transferGroupId = crypto.randomUUID()

      // Buscar tipos de egreso e ingreso
      const egressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('egreso')
      )
      const ingressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('ingreso')
      )

      // Crear movimiento de egreso (salida)
      const egressMovementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Transferencia - Salida',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id_from,
        type_id: egressType?.id || data.type_id,
        conversion_group_id: transferGroupId,
        is_conversion: false,
        is_favorite: false
      }

      // Crear movimiento de ingreso (entrada)
      const ingressMovementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Transferencia - Entrada',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id_to,
        type_id: ingressType?.id || data.type_id,
        conversion_group_id: transferGroupId,
        is_conversion: false,
        is_favorite: false
      }

      // Insertar ambos movimientos
      const { data: results, error } = await supabase
        .from('movements')
        .insert([egressMovementData, ingressMovementData])
        .select()

      if (error) throw error
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      toast({
        title: 'Transferencia creada',
        description: 'La transferencia ha sido creada correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al crear la transferencia: ${error.message}`,
      })
    }
  })

  // Función de envío que ejecuta la mutación apropiada
  const onSubmit = (values: BasicMovementForm) => {
    createMovementMutation.mutate(values)
  }

  const onSubmitConversion = (values: ConversionForm) => {
    createConversionMutation.mutate(values)
  }

  const onSubmitTransfer = (values: TransferForm) => {
    createTransferMutation.mutate(values)
  }

  // Función para determinar qué botón mostrar según el subcategory_id
  const getActionButton = (subcategoryId: string) => {
    const buttonConfig = {
      '7ef27d3f-ef17-49c3-a392-55282b3576ff': { 
        text: 'Gestionar Personal', 
        icon: Users,
        onClick: () => setShowPersonnelForm(true) 
      }
    }

    const config = buttonConfig[subcategoryId as keyof typeof buttonConfig]
    
    if (!config) return null

    return (
      <div className="mt-4">
        <CustomButton
          icon={config.icon}
          title={config.text}
          onClick={config.onClick}
        />
      </div>
    )
  }

  // Renderizar panel para conversiones
  const conversionPanel = (
    <Form {...conversionForm}>
      <form onSubmit={conversionForm.handleSubmit(onSubmitConversion)} className="space-y-4">
        {/* 1. FECHA */}
        <FormField
          control={conversionForm.control}
          name="movement_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar fecha..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. TIPO DE MOVIMIENTO */}
        <FormField
          control={conversionForm.control}
          name="type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimiento *</FormLabel>
              <Select 
                value={selectedTypeId} 
                onValueChange={(value) => {
                  handleTypeChange(value)
                  field.onChange(value)
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {movementConcepts?.map((concept) => (
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

        {/* 3. DESCRIPCIÓN (TEXTAREA) */}
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

        {/* 3.5. BOTÓN DE GESTIÓN (si aplica) */}
        {getActionButton(selectedCategoryId)}

        {/* 4. CAMPOS ESPECÍFICOS DE CONVERSIÓN */}
        <ConversionFields
          form={conversionForm}
          currencies={currencies || []}
          wallets={wallets || []}
          members={members || []}
          concepts={movementConcepts || []}
          movement={undefined}
        />
      </form>
    </Form>
  )

  // Renderizar panel para transferencias internas
  const transferPanel = (
    <Form {...transferForm}>
      <form onSubmit={transferForm.handleSubmit(onSubmitTransfer)} className="space-y-4">
        {/* 1. FECHA */}
        <FormField
          control={transferForm.control}
          name="movement_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar fecha..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. TIPO DE MOVIMIENTO */}
        <FormField
          control={transferForm.control}
          name="type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimiento *</FormLabel>
              <Select 
                value={selectedTypeId} 
                onValueChange={(value) => {
                  handleTypeChange(value)
                  field.onChange(value)
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {movementConcepts?.map((concept) => (
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

        {/* 3. DESCRIPCIÓN (TEXTAREA) */}
        <FormField
          control={transferForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción de la transferencia..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 3.5. BOTÓN DE GESTIÓN (si aplica) */}
        {getActionButton(selectedCategoryId)}

        {/* 4. CAMPOS ESPECÍFICOS DE TRANSFERENCIA */}
        <TransferFields
          form={transferForm}
          currencies={currencies || []}
          wallets={wallets || []}
          members={members || []}
          concepts={movementConcepts || []}
        />
      </form>
    </Form>
  )

  // Renderizar panel para movimientos normales
  const normalPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* 1. FECHA */}
        <FormField
          control={form.control}
          name="movement_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar fecha..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* GRUPO DE SELECCIÓN CON ESPACIADO REDUCIDO */}
        <div className="space-y-0.5">
          {/* 2. TIPO DE MOVIMIENTO */}
          <FormField
            control={form.control}
            name="type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimiento *</FormLabel>
                <Select 
                  value={selectedTypeId} 
                  onValueChange={(value) => {
                    handleTypeChange(value)
                    field.onChange(value)
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {movementConcepts?.map((concept) => (
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

          {/* CATEGORÍAS (solo para movimientos normales) */}
          {selectedTypeId && categories.length > 0 && (
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <Select 
                    value={selectedCategoryId} 
                    onValueChange={(value) => {
                      setSelectedCategoryId(value)
                      setSelectedSubcategoryId('')
                      field.onChange(value)
                      form.setValue('subcategory_id', '')
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
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
          )}

          {/* SUBCATEGORÍAS */}
          {selectedCategoryId && subcategories.length > 0 && (
            <FormField
              control={form.control}
              name="subcategory_id"
              render={({ field }) => (
                <FormItem>
                  <Select 
                    value={selectedSubcategoryId} 
                    onValueChange={(value) => {
                      setSelectedSubcategoryId(value)
                      field.onChange(value)
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subcategoría..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories.map((subcategory: any) => (
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
          )}
        </div>

        {/* 3. DESCRIPCIÓN (TEXTAREA) */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
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

        {/* 3.5. BOTÓN DE GESTIÓN (si aplica) */}
        {getActionButton(selectedSubcategoryId)}

        {/* 4. CAMPOS ESPECÍFICOS DE MOVIMIENTO NORMAL */}
        <DefaultMovementFields
          form={form}
          currencies={currencies || []}
          wallets={wallets || []}
        />
      </form>
    </Form>
  )

  // Panel condicional
  const editPanel = movementType === 'conversion' 
    ? conversionPanel 
    : movementType === 'transfer' 
      ? transferPanel 
      : normalPanel

  // Panel de vista (por ahora igual al de edición)
  const viewPanel = editPanel

  // Panel para PersonnelForm
  const personnelPanel = (
    <PersonnelForm onClose={() => setShowPersonnelForm(false)} />
  )

  // Seleccionar panel a mostrar
  const currentPanel = showPersonnelForm ? personnelPanel : editPanel

  // Header del modal
  const headerContent = (
    <FormModalHeader 
      title={showPersonnelForm ? "Gestión de Personal" : "Nuevo Movimiento"}
      icon={showPersonnelForm ? Users : DollarSign}
    />
  )

  // Footer del modal
  const footerContent = showPersonnelForm ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => setShowPersonnelForm(false)}
      rightLabel="Cerrar"
      onRightClick={onClose}
    />
  ) : (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar"
      onRightClick={movementType === 'conversion' 
        ? conversionForm.handleSubmit(onSubmitConversion)
        : movementType === 'transfer'
          ? transferForm.handleSubmit(onSubmitTransfer)
          : form.handleSubmit(onSubmit)}
      showLoadingSpinner={movementType === 'conversion' 
        ? createConversionMutation.isPending 
        : movementType === 'transfer'
          ? createTransferMutation.isPending
          : createMovementMutation.isPending}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={currentPanel}
      editPanel={currentPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}