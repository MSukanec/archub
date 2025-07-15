import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { DollarSign, ArrowRightLeft, ArrowLeftRight } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { useContacts } from '@/hooks/use-contacts'
import { useProjectClients } from '@/hooks/use-project-clients'
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

const transferFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  // Campos para transferencia interna
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id_from: z.string().min(1, 'Billetera origen es requerida'),
  wallet_id_to: z.string().min(1, 'Billetera destino es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0')
}).refine((data) => data.wallet_id_from !== data.wallet_id_to, {
  message: "Las billeteras de origen y destino deben ser diferentes",
  path: ["wallet_id_to"]
})

const aportesFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  // Campos para aportes
  contact_id: z.string().min(1, 'Selección es requerida'),
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0')
})

type MovementForm = z.infer<typeof movementFormSchema>
type ConversionForm = z.infer<typeof conversionFormSchema>
type TransferForm = z.infer<typeof transferFormSchema>
type AportesForm = z.infer<typeof aportesFormSchema>

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
  

  const { data: contacts } = useContacts()
  const { data: projectClients } = useProjectClients(userData?.preferences?.last_project_id)
  const { data: conceptsData } = useMovementConcepts('types')
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Eliminar el tipo creado incorrectamente y configurar las categorías existentes
  React.useEffect(() => {
    const configureAportesCategories = async () => {
      if (!conceptsData || !userData?.organization?.id) return
      
      // Eliminar el tipo incorrecto que creé
      const incorrectType = conceptsData.find(c => c.name === 'Aportes de Socios')
      if (incorrectType) {
        console.log('Eliminando tipo incorrecto...')
        await supabase
          .from('movement_concepts')
          .delete()
          .eq('id', incorrectType.id)
      }
      
      // Configurar las categorías existentes con view_mode aportes
      const { error: updateTerceros } = await supabase
        .from('movement_concepts')
        .update({ 
          view_mode: 'aportes',
          extra_fields: ['cliente_id']
        })
        .eq('name', 'Aportes de Terceros')
      
      const { error: updatePropios } = await supabase
        .from('movement_concepts')
        .update({ 
          view_mode: 'aportes',
          extra_fields: ['socio_id']
        })
        .eq('name', 'Aportes Propios')
      
      if (!updateTerceros && !updatePropios) {
        queryClient.invalidateQueries({ queryKey: ['movement-concepts'] })
        console.log('Categorías de aportes configuradas correctamente')
      }
    }
    
    configureAportesCategories()
  }, [conceptsData, userData?.organization?.id])

  // Mantener compatibilidad con la variable concepts
  const concepts = conceptsData

  // Estados para la lógica jerárquica
  const [selectedTypeId, setSelectedTypeId] = React.useState('')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('')
  
  // Estados para detectar tipo de formulario
  const [isConversion, setIsConversion] = React.useState(false)
  const [isTransfer, setIsTransfer] = React.useState(false)
  const [isAportes, setIsAportes] = React.useState(false)

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

  const transferForm = useForm<TransferForm>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      description: '',
      currency_id: '',
      wallet_id_from: '',
      wallet_id_to: '',
      amount: 0
    }
  })

  const aportesForm = useForm<AportesForm>({
    resolver: zodResolver(aportesFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: userData?.id || '',
      description: '',
      type_id: '',
      category_id: '',
      contact_id: '',
      currency_id: userData?.organization?.default_currency_id || '',
      wallet_id: userData?.organization?.default_wallet_id || '',
      amount: 0
    }
  })

  // Manejar envío con ENTER
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      form.handleSubmit(onSubmit)()
    }
  }

  // Efecto para manejar la lógica jerárquica al seleccionar tipo y detectar conversión/transfer/aportes
  React.useEffect(() => {
    const typeId = form.watch('type_id') || conversionForm.watch('type_id') || transferForm.watch('type_id') || aportesForm.watch('type_id')
    if (typeId && typeId !== selectedTypeId) {
      setSelectedTypeId(typeId)
      
      // Detectar tipo de formulario por view_mode (primero en tipos, luego en categorías)
      const selectedConcept = concepts?.find((concept: any) => concept.id === typeId)
      const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
      const isConversionType = viewMode === "conversion"
      const isTransferType = viewMode === "transfer"
      const isAportesType = viewMode === "aportes"
      
      console.log('Type changed:', { typeId, viewMode, isConversionType, isTransferType, isAportesType, selectedConcept })
      
      // Cambiar el formulario activo
      setIsConversion(isConversionType)
      setIsTransfer(isTransferType)
      setIsAportes(isAportesType)
      
      // Sincronizar type_id en todos los formularios
      form.setValue('type_id', typeId)
      conversionForm.setValue('type_id', typeId)
      transferForm.setValue('type_id', typeId)
      aportesForm.setValue('type_id', typeId)
      
      // Reset categoría y subcategoría cuando cambia el tipo
      if (typeId !== editingMovement?.type_id) {
        form.setValue('category_id', '')
        form.setValue('subcategory_id', '')
        setSelectedCategoryId('')
      }
    }
  }, [form.watch('type_id'), conversionForm.watch('type_id'), transferForm.watch('type_id'), aportesForm.watch('type_id'), concepts, selectedTypeId])

  // Efecto adicional para detectar aportes cuando se selecciona una categoría (desde cualquier formulario)
  React.useEffect(() => {
    const categoryId = form.watch('category_id') || aportesForm.watch('category_id')
    if (categoryId && categories) {
      const selectedCategory = categories.find((cat: any) => cat.id === categoryId)
      const viewMode = (selectedCategory?.view_mode ?? "normal").trim()
      const isAportesCategory = viewMode === "aportes"
      
      if (isAportesCategory) {
        console.log('Category with aportes detected:', { categoryId, selectedCategory })
        setIsAportes(true)
        setIsConversion(false)
        setIsTransfer(false)
        
        // Sincronizar category_id y type_id en el formulario de aportes
        aportesForm.setValue('type_id', form.watch('type_id'))
        aportesForm.setValue('category_id', categoryId)
        
        // Limpiar descripción para evitar UUID
        aportesForm.setValue('description', '')
        
        // Establecer valores por defecto (moneda y billetera)
        const currentMember = members?.find(m => m.user_id === userData?.id)?.id
        const defaultCurrency = userData?.organization?.default_currency_id
        const defaultWallet = userData?.organization?.default_wallet_id
        
        console.log('Setting defaults:', { currentMember, defaultCurrency, defaultWallet })
        
        if (currentMember) {
          aportesForm.setValue('created_by', currentMember)
        }
        if (defaultCurrency) {
          aportesForm.setValue('currency_id', defaultCurrency)
        }
        if (defaultWallet) {
          aportesForm.setValue('wallet_id', defaultWallet)
        }
      }
    }
  }, [form.watch('category_id'), aportesForm.watch('category_id'), categories, members, userData])



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
    console.log('Effect triggered for editingMovement:', {
      hasEditingMovement: !!editingMovement,
      hasMembers: !!members,
      hasCurrencies: !!currencies,
      hasWallets: !!wallets,
      hasConcepts: !!concepts
    })
    
    if (editingMovement) {
      // Wait for all data to be loaded
      if (!members || !currencies || !wallets || !concepts) {
        console.log('Waiting for data to load...')
        return
      }
      
      // Set hierarchical states for editing
      setSelectedTypeId(editingMovement.type_id || '')
      setSelectedCategoryId(editingMovement.category_id || '')
      
      // Detectar view_mode del concepto para cargar el formulario correcto
      const selectedConcept = concepts?.find((concept: any) => concept.id === editingMovement.type_id)
      const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
      
      // Map currency_id and wallet_id to organization-specific IDs
      const matchingCurrency = currencies?.find((c: any) => 
        c.currency?.id === editingMovement.currency_id
      )
      const matchingWallet = wallets?.find(w => 
        w.wallet_id === editingMovement.wallet_id
      )
      
      console.log('Loading editing movement:', {
        editingMovement: editingMovement.id,
        viewMode,
        type_id: editingMovement.type_id,
        category_id: editingMovement.category_id,
        subcategory_id: editingMovement.subcategory_id,
        amount: editingMovement.amount,
        currency_id: editingMovement.currency_id,
        wallet_id: editingMovement.wallet_id
      })
      
      // Establecer el tipo de formulario según el view_mode
      setIsConversion(viewMode === "conversion")
      setIsTransfer(viewMode === "transfer")
      setIsAportes(viewMode === "aportes")
      
      console.log('Edit mode - detected view_mode:', { viewMode, isConversion: viewMode === "conversion", isTransfer: viewMode === "transfer", isAportes: viewMode === "aportes" })
      
      // Cargar datos en el formulario correcto según el view_mode
      if (viewMode === "conversion") {
        // Para conversiones, necesitamos cargar datos desde el grupo de conversión
        // Por ahora, cargaremos datos básicos en el formulario de conversión
        conversionForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          currency_id_from: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id_from: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          amount_from: editingMovement.amount || 0,
          currency_id_to: '',
          wallet_id_to: '',
          amount_to: 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
      } else if (viewMode === "transfer") {
        // Para transferencias, cargar datos en formulario de transferencia
        transferForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id_from: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          wallet_id_to: '',
          amount: editingMovement.amount || 0
        })
      } else if (viewMode === "aportes") {
        // Para aportes, cargar datos en formulario de aportes
        aportesForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          contact_id: editingMovement.contact_id || '',
          currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0
        })
      } else {
        // Formulario normal
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
      }
      setPanel('edit')
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

      // Reset main form
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

      // Reset conversion form with same defaults
      conversionForm.reset({
        movement_date: new Date(),
        created_by: currentMember?.id || '',
        description: '',
        amount_from: 0,
        amount_to: 0,
        currency_id_from: defaultOrgCurrency?.currency?.id || '',
        currency_id_to: defaultOrgCurrency?.currency?.id || '',
        wallet_id_from: defaultWallet?.wallet_id || '',
        wallet_id_to: defaultWallet?.wallet_id || '',
        exchange_rate: undefined,
        type_id: '',
      })

      // Reset transfer form with same defaults
      transferForm.reset({
        movement_date: new Date(),
        created_by: currentMember?.id || '',
        description: '',
        amount: 0,
        currency_id: defaultOrgCurrency?.currency?.id || '',
        wallet_id_from: defaultWallet?.wallet_id || '',
        wallet_id_to: defaultWallet?.wallet_id || '',
        type_id: '',
      })

      // Reset aportes form with same defaults
      aportesForm.reset({
        movement_date: new Date(),
        created_by: currentMember?.id || '',
        description: '',
        contact_id: '',
        currency_id: defaultOrgCurrency?.currency?.id || '',
        wallet_id: defaultWallet?.wallet_id || '',
        amount: 0,
        type_id: '',
      })
      setPanel('edit')
    }
  }, [editingMovement, userData?.user?.id, form, setPanel, members, currencies, wallets, concepts])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      const movementData = {
        ...data,
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null, // Permitir null para movimientos de organización
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
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
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
        project_id: userData.preferences?.last_project_id || null, // Permitir null para conversiones de organización
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

  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Generar UUID para el grupo de transferencia
      const transferGroupId = crypto.randomUUID()

      // Buscar tipos de egreso e ingreso
      const egressType = concepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('egreso')
      )
      const ingressType = concepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('ingreso')
      )

      const baseMovementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null, // Permitir null para transferencias de organización
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        transfer_group_id: transferGroupId // Usar el campo específico para transferencias
      }

      // Crear movimiento de egreso (salida de billetera origen)
      const egressData = {
        ...baseMovementData,
        description: data.description || 'Transferencia Interna - Salida',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id_from,
        type_id: egressType?.id || concepts?.find(c => c.name?.toLowerCase() === 'transferencias internas')?.id
      }

      // Crear movimiento de ingreso (entrada a billetera destino)
      const ingressData = {
        ...baseMovementData,
        description: data.description || 'Transferencia Interna - Entrada',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id_to,
        type_id: ingressType?.id || concepts?.find(c => c.name?.toLowerCase() === 'transferencias internas')?.id
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
        title: 'Transferencia creada',
        description: 'La transferencia interna ha sido creada correctamente',
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

  const createAportesMutation = useMutation({
    mutationFn: async (data: AportesForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      const movementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null, // Permitir null para aportes de organización
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Aporte',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        type_id: data.type_id,
        contact_id: data.contact_id // Este campo guardará cliente_id o socio_id
      }

      const { data: result, error } = await supabase
        .from('movements')
        .insert([movementData])
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Aporte registrado',
        description: 'El aporte ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al registrar el aporte: ${error.message}`,
      })
    }
  })

  const onSubmit = async (data: MovementForm) => {
    await createMovementMutation.mutateAsync(data)
  }

  const onSubmitConversion = async (data: ConversionForm) => {
    await createConversionMutation.mutateAsync(data)
  }

  const onSubmitTransfer = async (data: TransferForm) => {
    await createTransferMutation.mutateAsync(data)
  }

  const onSubmitAportes = async (data: AportesForm) => {
    await createAportesMutation.mutateAsync(data)
  }

  const handleClose = () => {
    setPanel('edit')
    onClose()
  }

  const isLoading = createMovementMutation.isPending || createConversionMutation.isPending || createTransferMutation.isPending || createAportesMutation.isPending

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

            {/* Tipo - mantiene interactivo para cambiar */}
            <FormField
              control={conversionForm.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {concepts?.filter((concept: any) => !concept.parent_id).map((concept: any) => (
                        <SelectItem key={concept.id} value={concept.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{concept.name}</span>
                            {concept.is_system && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                                Sistema
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Separador y título de sección de conversión */}
            <div className="col-span-2">
              <Separator className="mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                  <ArrowRightLeft className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Información de la Conversión</h3>
                  <p className="text-xs text-muted-foreground">Detalles específicos del cambio de moneda</p>
                </div>
              </div>
            </div>

            {/* Sección ORIGEN */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <label className="text-sm font-medium leading-none">Datos de Origen (Egreso)</label>
              </div>
              
              {/* Moneda y Billetera en la misma fila */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                            <SelectItem key={wallet.id} value={wallet.wallet_id}>
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

              {/* Cantidad en fila separada */}
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

            {/* Sección DESTINO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                <label className="text-sm font-medium leading-none">Datos de Destino (Ingreso)</label>
              </div>
              
              {/* Moneda y Billetera en la misma fila */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                            <SelectItem key={wallet.id} value={wallet.wallet_id}>
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

              {/* Cantidad en fila separada */}
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
              {/* Cotización */}
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
            </div>
          </form>
        </Form>
      ) : isTransfer ? (
        // FORMULARIO DE TRANSFERENCIAS INTERNAS
        <Form {...transferForm}>
          <form onSubmit={transferForm.handleSubmit(onSubmitTransfer)} className="space-y-4">
            {/* Fila 1: Creador | Fecha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={transferForm.control}
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
                control={transferForm.control}
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

            {/* Tipo - mantiene interactivo para cambiar */}
            <FormField
              control={transferForm.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {concepts?.filter((concept: any) => !concept.parent_id).map((concept: any) => (
                        <SelectItem key={concept.id} value={concept.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{concept.name}</span>
                            {concept.is_system && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                                Sistema
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción (full width) */}
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

            {/* Separador y título de sección de transferencia */}
            <div className="col-span-2">
              <Separator className="mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                  <ArrowLeftRight className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Información de la Transferencia</h3>
                  <p className="text-xs text-muted-foreground">Datos específicos del movimiento entre billeteras</p>
                </div>
              </div>
            </div>

            {/* Moneda */}
            <FormField
              control={transferForm.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda *</FormLabel>
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

            {/* Billeteras Origen y Destino */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <FormField
                    control={transferForm.control}
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
                              <SelectItem key={wallet.id} value={wallet.wallet_id}>
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
                    control={transferForm.control}
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
                              <SelectItem key={wallet.id} value={wallet.wallet_id}>
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

            {/* Cantidad */}
            <FormField
              control={transferForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad *</FormLabel>
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
          </form>
        </Form>
      ) : isAportes ? (
        // FORMULARIO DE APORTES
        <Form {...aportesForm}>
          <form onSubmit={aportesForm.handleSubmit(onSubmitAportes)} className="space-y-4">
            {/* Fila 1: Creador | Fecha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={aportesForm.control}
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
                control={aportesForm.control}
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

            {/* Tipo - mantiene interactivo para cambiar */}
            <FormField
              control={aportesForm.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {concepts?.filter((concept: any) => !concept.parent_id).map((concept: any) => (
                        <SelectItem key={concept.id} value={concept.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{concept.name}</span>
                            {concept.is_system && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                                Sistema
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoría */}
            <FormField
              control={aportesForm.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{category.name}</span>
                            {category.is_system && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                                Sistema
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción (full width) */}
            <FormField
              control={aportesForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descripción del movimiento..."
                      {...field}
                      value={field.value || ''} // Asegurar que inicie vacío
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Separador y título de sección de aportes */}
            <div className="col-span-2">
              <Separator className="mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Información del Aporte</h3>
                  <p className="text-xs text-muted-foreground">Datos específicos del registro de aporte</p>
                </div>
              </div>
            </div>

            {/* Selector dinámico (Cliente o Socio) basado en la categoría seleccionada */}
            <FormField
              control={aportesForm.control}
              name="contact_id"
              render={({ field }) => {
                // Buscar la categoría seleccionada para obtener extra_fields
                const selectedCategory = categories?.find(c => c.id === form.watch('category_id'))
                const extraField = selectedCategory?.extra_fields?.[0]
                const isClienteSelector = extraField === 'cliente_id'
                
                return (
                  <FormItem>
                    <FormLabel>
                      {isClienteSelector ? 'Cliente *' : 'Socio *'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            isClienteSelector ? "Seleccionar cliente" : "Seleccionar socio"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isClienteSelector ? (
                          // Mostrar clientes del proyecto para "Aportes de Terceros"
                          projectClients?.map((projectClient) => (
                            <SelectItem key={projectClient.id} value={projectClient.contact.id}>
                              {projectClient.contact.full_name || `${projectClient.contact.first_name} ${projectClient.contact.last_name}`}
                              {projectClient.contact.company_name && ` (${projectClient.contact.company_name})`}
                            </SelectItem>
                          ))
                        ) : (
                          // Mostrar miembros para "Aportes Propios"
                          members?.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.first_name} {member.last_name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            {/* Fila: Moneda | Billetera */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={aportesForm.control}
                name="currency_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies?.map((currency) => (
                          <SelectItem key={currency.currency_id} value={currency.currency_id}>
                            {currency.currency?.name || 'Sin nombre'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={aportesForm.control}
                name="wallet_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billetera *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets?.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.wallet_id}>
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

            {/* Cantidad */}
            <FormField
              control={aportesForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad *</FormLabel>
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
                        <div className="flex items-center justify-between w-full">
                          <span>{concept.name}</span>
                          {concept.is_system && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                              Sistema
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center justify-between w-full">
                          <span>{category.name}</span>
                          {category.is_system && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                              Sistema
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center justify-between w-full">
                          <span>{subcategory.name}</span>
                          {subcategory.is_system && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium text-white bg-accent rounded">
                              Sistema
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* Separador y título de sección de movimiento financiero */}
          <div className="col-span-2">
            <Separator className="mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Información Financiera</h3>
                <p className="text-xs text-muted-foreground">Detalles específicos del movimiento financiero</p>
              </div>
            </div>
          </div>

          {/* Fila 6: Moneda | Billetera */}
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
                        <SelectItem key={wallet.id} value={wallet.wallet_id}>
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

          {/* Fila 7: Monto | Cotización */}
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
        </form>
      </Form>
      )}
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title={editingMovement ? "Editar Movimiento" : "Nuevo Movimiento"}
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
        editingMovement ? "Actualizar" : (
          isConversion ? "Crear Conversión" : 
          isTransfer ? "Crear Transferencia" : 
          isAportes ? "Registrar Aporte" :
          "Guardar"
        )
      }
      onRightClick={() => {
        if (currentPanel === 'view' && editingMovement) {
          setPanel('edit')
        } else {
          if (isConversion) {
            conversionForm.handleSubmit(onSubmitConversion)()
          } else if (isTransfer) {
            transferForm.handleSubmit(onSubmitTransfer)()
          } else if (isAportes) {
            aportesForm.handleSubmit(onSubmitAportes)()
          } else {
            form.handleSubmit(onSubmit)()
          }
        }
      }}
      rightLoading={createMovementMutation.isPending || createConversionMutation.isPending || createTransferMutation.isPending || createAportesMutation.isPending}
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