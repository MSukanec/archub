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
import { ConversionFields } from './movement-forms/ConversionFields'
import { TransferFields } from './movement-forms/TransferFields'
import { AportesFields } from './movement-forms/AportesFields'
import { AportesPropiosFields } from './movement-forms/AportesPropiosFields'
import { RetirosPropiosFields } from './movement-forms/RetirosPropiosFields'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useOrganizationWallets } from '@/hooks/use-organization-wallets'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { useContacts } from '@/hooks/use-contacts'
import { useProjectClients } from '@/hooks/use-project-clients'
import { useProjects } from '@/hooks/use-projects'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'

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
  category_id: z.string().min(1, 'Categoría es requerida'),
  subcategory_id: z.string().optional(), // Agregar subcategoría para aportes
  // Campos para aportes
  contact_id: z.string().optional(), // Campo opcional - Cliente
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional()
})

const aportesPropriosFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().min(1, 'Categoría es requerida'),
  // Campos para aportes propios
  member_id: z.string().optional(), // Campo opcional - Socio
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional()
})

const retirosPropriosFormSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  category_id: z.string().min(1, 'Categoría es requerida'),
  // Campos para retiros propios
  member_id: z.string().optional(), // Campo opcional - Socio
  currency_id: z.string().min(1, 'Moneda es requerida'),
  wallet_id: z.string().min(1, 'Billetera es requerida'),
  amount: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  exchange_rate: z.number().optional()
})

type MovementForm = z.infer<typeof movementFormSchema>
type ConversionForm = z.infer<typeof conversionFormSchema>
type TransferForm = z.infer<typeof transferFormSchema>
type AportesForm = z.infer<typeof aportesFormSchema>
type AportesPropriosForm = z.infer<typeof aportesPropriosFormSchema>
type RetirosPropriosForm = z.infer<typeof retirosPropriosFormSchema>

interface MovementFormModalProps {
  modalData?: {
    editingMovement?: any
  }
  onClose: () => void
}

export default function MovementFormModal({ modalData, onClose }: MovementFormModalProps) {
  const editingMovement = modalData?.editingMovement
  const { currentPanel, setPanel } = useModalPanelStore()
  
  // Inicializar panel correcto según el modo
  React.useEffect(() => {
    setPanel('edit') // Siempre empezar en modo edición
  }, [setPanel])
  const { data: userData, isLoading: isUserDataLoading } = useCurrentUser()
  const { data: members, isLoading: isMembersLoading } = useOrganizationMembers(userData?.organization?.id)
  const { data: currencies, isLoading: isCurrenciesLoading } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets, isLoading: isWalletsLoading } = useOrganizationWallets(userData?.organization?.id)
  

  const { data: contacts, isLoading: isContactsLoading } = useContacts()
  const { data: projectClients, isLoading: isProjectClientsLoading } = useProjectClients(userData?.preferences?.last_project_id)
  const { data: organizationConcepts, isLoading: isOrganizationConceptsLoading } = useOrganizationMovementConcepts(userData?.organization?.id)
  const { data: projects, isLoading: isProjectsLoading } = useProjects(userData?.organization?.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Verificar si todos los datos críticos están cargados
  const isDataLoading = isUserDataLoading || isMembersLoading || isCurrenciesLoading || isWalletsLoading || isOrganizationConceptsLoading || !userData || !members || !currencies || !wallets || !organizationConcepts
  
  // Debug: Log loading state
  React.useEffect(() => {
    console.log('Modal loading state:', {
      isUserDataLoading,
      isMembersLoading,
      isCurrenciesLoading,
      isWalletsLoading,
      isOrganizationConceptsLoading,
      hasUserData: !!userData,
      hasMembers: !!members,
      hasCurrencies: !!currencies,
      hasWallets: !!wallets,
      hasOrganizationConcepts: !!organizationConcepts,
      isDataLoading
    })
  }, [isDataLoading, userData, members, currencies, wallets, organizationConcepts])

  // LOG: Categorías de aportes ya configuradas - NO modificar base de datos
  React.useEffect(() => {
    if (organizationConcepts && userData?.organization?.id) {
      console.log('Categorías de aportes configuradas correctamente')
    }
  }, [organizationConcepts, userData?.organization?.id])

  // Aplanar la estructura jerárquica para obtener solo los tipos (conceptos padre)
  const concepts = React.useMemo(() => {
    if (!organizationConcepts) return []
    return organizationConcepts.filter(concept => concept.parent_id === null)
  }, [organizationConcepts])

  const loadingReady = !!(members && currencies && wallets && concepts)

  // Estados para la lógica jerárquica
  const [selectedTypeId, setSelectedTypeId] = React.useState(editingMovement?.type_id || '')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(editingMovement?.category_id || '')
  
  // Estado centralizado para el tipo de movimiento
  const [movementType, setMovementType] = React.useState<'normal' | 'conversion' | 'transfer' | 'aportes' | 'aportes_propios' | 'retiros_propios'>('normal')
  


  // Variables derivadas para compatibilidad
  const isConversion = movementType === 'conversion'
  const isTransfer = movementType === 'transfer'
  const isAportes = movementType === 'aportes'
  const isAportesPropios = movementType === 'aportes_propios'
  const isRetirosPropios = movementType === 'retiros_propios'

  // Obtener categorías y subcategorías de la estructura jerárquica de organización
  const categories = React.useMemo(() => {
    if (!organizationConcepts || !selectedTypeId) return []
    
    // Aplanar la estructura para buscar el tipo seleccionado
    const flattenConcepts = (concepts: any[]): any[] => {
      return concepts.reduce((acc, concept) => {
        acc.push(concept)
        if (concept.children && concept.children.length > 0) {
          acc.push(...flattenConcepts(concept.children))
        }
        return acc
      }, [])
    }
    
    const allConcepts = flattenConcepts(organizationConcepts)
    const selectedType = allConcepts.find(concept => concept.id === selectedTypeId)
    
    return selectedType?.children || []
  }, [organizationConcepts, selectedTypeId])

  const subcategories = React.useMemo(() => {
    if (!selectedCategoryId || !categories) return []
    
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)
    return selectedCategory?.children || []
  }, [categories, selectedCategoryId])

  // Lógica dinámica para mostrar campos de categoría/subcategoría
  const shouldShowCategoryFields = React.useMemo(() => {
    // Solo mostrar si hay categorías disponibles para el tipo seleccionado
    return categories && categories.length > 0
  }, [categories])

  const shouldShowSubcategoryFields = React.useMemo(() => {
    // Solo mostrar si hay subcategorías disponibles para la categoría seleccionada
    return subcategories && subcategories.length > 0
  }, [subcategories])

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: userData?.user?.id || '',
      description: '',
      amount: 0,
      exchange_rate: undefined,
      project_id: userData?.preferences?.last_project_id || null,
      type_id: '',
      category_id: '',
      subcategory_id: '',
      currency_id: userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id || '',
      wallet_id: userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id || '',
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
      type_id: '',
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
      created_by: userData?.user?.id || '',
      description: '',
      type_id: '',
      category_id: '',
      contact_id: '',
      currency_id: userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id || '',
      wallet_id: userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id || '',
      amount: 0,
      exchange_rate: undefined
    }
  })

  const aportesPropriosForm = useForm<AportesPropriosForm>({
    resolver: zodResolver(aportesPropriosFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: userData?.user?.id || '',
      description: '',
      type_id: '',
      category_id: '',
      member_id: '',
      currency_id: userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id || '',
      wallet_id: userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id || '',
      amount: 0,
      exchange_rate: undefined
    }
  })

  const retirosPropriosForm = useForm<RetirosPropriosForm>({
    resolver: zodResolver(retirosPropriosFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: userData?.user?.id || '',
      description: '',
      type_id: '',
      category_id: '',
      member_id: '',
      currency_id: userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id || '',
      wallet_id: userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id || '',
      amount: 0,
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

  // Manejar cambio de tipo de manera controlada
  const handleTypeChange = React.useCallback((newTypeId: string) => {
    if (!newTypeId || !concepts) return
    
    console.log('Handling type change:', { newTypeId, selectedTypeId })
    

    
    // Actualizar estado
    setSelectedTypeId(newTypeId)
    
    // Detectar formulario
    const selectedConcept = concepts.find((concept: any) => concept.id === newTypeId)
    const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
    
    const isConversionType = viewMode === "conversion"
    const isTransferType = viewMode === "transfer"
    const isAportesType = viewMode === "aportes"
    
    console.log('Type detected:', { viewMode, isConversionType, isTransferType, isAportesType })
    
    // Cambiar formulario
    if (isConversionType) {
      setMovementType('conversion')
    } else if (isTransferType) {
      setMovementType('transfer')
    } else if (isAportesType) {
      setMovementType('aportes')
    } else {
      setMovementType('normal')
    }
    
    // Sincronizar type_id en TODOS los formularios siempre (tanto edición como creación)
    form.setValue('type_id', newTypeId)
    conversionForm.setValue('type_id', newTypeId)
    transferForm.setValue('type_id', newTypeId)
    aportesForm.setValue('type_id', newTypeId)
    aportesPropriosForm.setValue('type_id', newTypeId)
    retirosPropriosForm.setValue('type_id', newTypeId)
    
    // Reset de categorías solo en nuevo movimiento
    if (!editingMovement) {
      form.setValue('category_id', '')
      form.setValue('subcategory_id', '')
      setSelectedCategoryId('')
    }
    

  }, [selectedTypeId, concepts, editingMovement, form, conversionForm, transferForm, aportesForm, aportesPropriosForm, retirosPropriosForm])
  
  // Escuchar cambios en el tipo de TODOS los formularios
  const typeId = form.watch('type_id')
  const conversionTypeId = conversionForm.watch('type_id')
  const transferTypeId = transferForm.watch('type_id')
  const aportesTypeId = aportesForm.watch('type_id')
  const aportesPropriosTypeId = aportesPropriosForm.watch('type_id')
  const retirosPropriosTypeId = retirosPropriosForm.watch('type_id')

  // Solo escuchar cambios del formulario principal para simplificar
  React.useEffect(() => {
    if (typeId) {
      handleTypeChange(typeId)
    }
  }, [typeId])

  // Inicializar valores por defecto cuando los datos estén listos
  React.useEffect(() => {
    if (!members || !userData?.user?.id || !currencies || !wallets || editingMovement) return
    
    const currentMember = members.find(m => m.user_id === userData.user.id)
    const defaultCurrency = userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id
    const defaultWallet = userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id
    
    console.log('Initializing default values:', {
      currentMember: currentMember?.id,
      defaultCurrency,
      defaultWallet,
      walletsAvailable: wallets?.length,
      hasOrgPreferences: !!userData?.organization?.preferences
    })
    
    if (currentMember) {
      // Inicializar CREADOR en todos los formularios
      if (!form.watch('created_by')) form.setValue('created_by', currentMember.id)
      if (!conversionForm.watch('created_by')) conversionForm.setValue('created_by', currentMember.id)
      if (!transferForm.watch('created_by')) transferForm.setValue('created_by', currentMember.id)
      if (!aportesForm.watch('created_by')) aportesForm.setValue('created_by', currentMember.id)
      if (!aportesPropriosForm.watch('created_by')) aportesPropriosForm.setValue('created_by', currentMember.id)
      if (!retirosPropriosForm.watch('created_by')) retirosPropriosForm.setValue('created_by', currentMember.id)
    }
    
    // Inicializar PROYECTO (solo si no está editando)
    if (!editingMovement && userData?.preferences?.last_project_id !== undefined) {
      // Si hay proyecto activo, usar ese proyecto automáticamente
      if (userData.preferences.last_project_id) {
        form.setValue('project_id', userData.preferences.last_project_id)
      } else if (form.watch('project_id') === undefined) {
        // Solo en modo General permitir selección libre
        form.setValue('project_id', null)
      }
    }
    
    // Inicializar MONEDA y BILLETERA en TODOS los formularios
    if (defaultCurrency) {
      if (!form.watch('currency_id')) form.setValue('currency_id', defaultCurrency)
      if (!transferForm.watch('currency_id')) transferForm.setValue('currency_id', defaultCurrency)
      if (!aportesForm.watch('currency_id')) aportesForm.setValue('currency_id', defaultCurrency)
      if (!aportesPropriosForm.watch('currency_id')) aportesPropriosForm.setValue('currency_id', defaultCurrency)
      if (!retirosPropriosForm.watch('currency_id')) retirosPropriosForm.setValue('currency_id', defaultCurrency)
    }
    
    if (defaultWallet) {
      console.log('Setting wallet values:', {
        defaultWallet,
        currentFormWallet: form.watch('wallet_id'),
        currentTransferWallet: transferForm.watch('wallet_id_from'),
        currentAportesWallet: aportesForm.watch('wallet_id')
      })
      
      if (!form.watch('wallet_id')) {
        form.setValue('wallet_id', defaultWallet)
        console.log('Set form wallet_id to:', defaultWallet)
      }
      if (!transferForm.watch('wallet_id_from')) {
        transferForm.setValue('wallet_id_from', defaultWallet)
        console.log('Set transfer wallet_id_from to:', defaultWallet)
      }
      if (!aportesForm.watch('wallet_id')) {
        aportesForm.setValue('wallet_id', defaultWallet)
        console.log('Set aportes wallet_id to:', defaultWallet)
      }
      if (!aportesPropriosForm.watch('wallet_id')) {
        aportesPropriosForm.setValue('wallet_id', defaultWallet)
        console.log('Set aportes propios wallet_id to:', defaultWallet)
      }
      if (!retirosPropriosForm.watch('wallet_id')) {
        retirosPropriosForm.setValue('wallet_id', defaultWallet)
        console.log('Set retiros propios wallet_id to:', defaultWallet)
      }
    }
    
  }, [members, userData?.user?.id, currencies, wallets, userData?.organization_preferences, editingMovement])



  // Efecto para detectar los 3 tipos de aportes cuando se selecciona una categoría
  React.useEffect(() => {
    // Ejecutar tanto en creación como en edición, pero con diferente lógica
    
    const categoryId = form.watch('category_id') || aportesForm.watch('category_id') || aportesPropriosForm.watch('category_id') || retirosPropriosForm.watch('category_id')
    if (categoryId && categories) {
      const selectedCategory = categories.find((cat: any) => cat.id === categoryId)
      const viewMode = (selectedCategory?.view_mode ?? "normal").trim()
      

      
      // Detectar el tipo específico de aportes
      const isAportesCategory = viewMode === "aportes"
      const isAportesPropiosCategory = viewMode === "aportes_propios"
      const isRetirosPropiosCategory = viewMode === "retiros_propios"
      
      if (isAportesCategory || isAportesPropiosCategory || isRetirosPropiosCategory) {
        // Establecer el estado correcto
        if (isAportesCategory) {
          setMovementType('aportes')
        } else if (isAportesPropiosCategory) {
          setMovementType('aportes_propios')
        } else if (isRetirosPropiosCategory) {
          setMovementType('retiros_propios')
        }
        
        // Sincronizar valores tanto en modo nuevo como en edición
        const currentValues = {
          created_by: form.watch('created_by') || aportesForm.watch('created_by') || aportesPropriosForm.watch('created_by') || retirosPropriosForm.watch('created_by'),
          movement_date: form.watch('movement_date') || aportesForm.watch('movement_date') || aportesPropriosForm.watch('movement_date') || retirosPropriosForm.watch('movement_date'),
          amount: form.watch('amount') || aportesForm.watch('amount') || aportesPropriosForm.watch('amount') || retirosPropriosForm.watch('amount'),
          currency_id: form.watch('currency_id') || aportesForm.watch('currency_id') || aportesPropriosForm.watch('currency_id') || retirosPropriosForm.watch('currency_id'),
          wallet_id: form.watch('wallet_id') || aportesForm.watch('wallet_id') || aportesPropriosForm.watch('wallet_id') || retirosPropriosForm.watch('wallet_id'),
          description: form.watch('description') || aportesForm.watch('description') || aportesPropriosForm.watch('description') || retirosPropriosForm.watch('description'),
          exchange_rate: form.watch('exchange_rate') || aportesForm.watch('exchange_rate') || aportesPropriosForm.watch('exchange_rate') || retirosPropriosForm.watch('exchange_rate')
        }
        
        // En modo edición preservar campos, en modo nuevo usar defaults
        const preserveValues = !!editingMovement
        const currentMember = members?.find(m => m.user_id === userData?.user?.id)?.id
        
        // Obtener los valores por defecto desde organization.preferences o usar el primero disponible
        const defaultCurrency = userData?.organization?.preferences?.default_currency || currencies?.[0]?.currency?.id
        const defaultWallet = userData?.organization?.preferences?.default_wallet || wallets?.[0]?.id
        
        if (isAportesCategory) {
          // APORTES: Cliente + Cotización
          console.log('Setting aportes form with preserved values:', preserveValues ? currentValues : 'using defaults')
          
          aportesForm.setValue('type_id', form.watch('type_id'))
          aportesForm.setValue('category_id', categoryId)
          aportesForm.setValue('description', preserveValues ? currentValues.description : '')
          aportesForm.setValue('created_by', preserveValues ? currentValues.created_by : currentMember)
          aportesForm.setValue('currency_id', preserveValues ? currentValues.currency_id : defaultCurrency)
          aportesForm.setValue('wallet_id', preserveValues ? currentValues.wallet_id : defaultWallet)
          aportesForm.setValue('amount', preserveValues ? currentValues.amount : 0)
          if (currentValues.exchange_rate) aportesForm.setValue('exchange_rate', currentValues.exchange_rate)
          
          // CRITICAL: También sincronizar el formulario principal para que aparezcan los campos superiores
          form.setValue('category_id', categoryId)
        } else if (isAportesPropiosCategory) {
          // APORTES PROPIOS: Socio + Cotización
          console.log('Setting aportes propios form with preserved values:', preserveValues ? currentValues : 'using defaults')
          
          aportesPropriosForm.setValue('type_id', form.watch('type_id'))
          aportesPropriosForm.setValue('category_id', categoryId)
          aportesPropriosForm.setValue('description', preserveValues ? currentValues.description : '')
          aportesPropriosForm.setValue('created_by', preserveValues ? currentValues.created_by : currentMember)
          aportesPropriosForm.setValue('currency_id', preserveValues ? currentValues.currency_id : defaultCurrency)
          aportesPropriosForm.setValue('wallet_id', preserveValues ? currentValues.wallet_id : defaultWallet)
          aportesPropriosForm.setValue('amount', preserveValues ? currentValues.amount : 0)
          if (currentValues.exchange_rate) aportesPropriosForm.setValue('exchange_rate', currentValues.exchange_rate)
          aportesPropriosForm.setValue('member_id', currentMember || '') // Auto-inicializar con usuario actual
          
          // CRITICAL: También sincronizar el formulario principal para que aparezcan los campos superiores
          form.setValue('category_id', categoryId)
        } else if (isRetirosPropiosCategory) {
          // RETIROS PROPIOS: Socio + Cotización
          console.log('Setting retiros propios form with preserved values:', preserveValues ? currentValues : 'using defaults')
          
          retirosPropriosForm.setValue('type_id', form.watch('type_id'))
          retirosPropriosForm.setValue('category_id', categoryId)
          retirosPropriosForm.setValue('description', preserveValues ? currentValues.description : '')
          retirosPropriosForm.setValue('created_by', preserveValues ? currentValues.created_by : currentMember)
          retirosPropriosForm.setValue('currency_id', preserveValues ? currentValues.currency_id : defaultCurrency)
          retirosPropriosForm.setValue('wallet_id', preserveValues ? currentValues.wallet_id : defaultWallet)
          retirosPropriosForm.setValue('amount', preserveValues ? currentValues.amount : 0)
          if (currentValues.exchange_rate) retirosPropriosForm.setValue('exchange_rate', currentValues.exchange_rate)
          retirosPropriosForm.setValue('member_id', currentMember || '') // Auto-inicializar con usuario actual
          
          // CRITICAL: También sincronizar el formulario principal para que aparezcan los campos superiores
          form.setValue('category_id', categoryId)
        }
      } else {
        // Si no es una categoría de aportes, permitir regresar al formulario normal
        if (isAportes || isAportesPropios || isRetirosPropios) {
          setMovementType('normal')
        }
      }
    }
  }, [form.watch('category_id'), aportesForm.watch('category_id'), aportesPropriosForm.watch('category_id'), retirosPropriosForm.watch('category_id'), categories, members, userData, isAportes, isAportesPropios, isRetirosPropios, editingMovement, currencies, wallets])



  // Efecto para manejar la lógica jerárquica al seleccionar categoría
  const categoryId = form.watch('category_id')

  React.useEffect(() => {
    if (!editingMovement || categoryId !== selectedCategoryId) {
      form.setValue('subcategory_id', '')
    }
    setSelectedCategoryId(categoryId)
  }, [categoryId, selectedCategoryId])

  // Efecto solo para cargar movimientos en edición (sin valores por defecto)
  React.useEffect(() => {
    if (!editingMovement) return
    
    console.log('Loading editing movement - ONE TIME ONLY')
    
    if (editingMovement) {
      // Wait for all data to be loaded
      if (!members || !currencies || !wallets || !concepts || !categories) {
        console.log('Waiting for data to load...')
        return
      }
      
      // Set hierarchical states for editing - CRITICAL for field loading
      console.log('Setting hierarchical states:', {
        type_id: editingMovement.type_id,
        category_id: editingMovement.category_id
      })
      setSelectedTypeId(editingMovement.type_id || '')
      setSelectedCategoryId(editingMovement.category_id || '')
      
      // Detectar view_mode del concepto para cargar el formulario correcto
      const selectedConcept = concepts?.find((concept: any) => concept.id === editingMovement.type_id)
      const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
      
      // También verificar la categoría para detectar aportes
      const selectedCategory = categories?.find((category: any) => category.id === editingMovement.category_id)
      const categoryViewMode = (selectedCategory?.view_mode ?? "normal").trim()
      
      // Map currency_id and wallet_id to organization-specific IDs
      const matchingCurrency = currencies?.find((c: any) => 
        c.currency?.id === editingMovement.currency_id
      )
      const matchingWallet = wallets?.find(w => 
        w.id === editingMovement.wallet_id
      )
      
      console.log('Loading editing movement:', {
        editingMovement: editingMovement.id,
        viewMode,
        categoryViewMode,
        type_id: editingMovement.type_id,
        category_id: editingMovement.category_id,
        subcategory_id: editingMovement.subcategory_id,
        amount: editingMovement.amount,
        currency_id: editingMovement.currency_id,
        wallet_id: editingMovement.wallet_id,
        conversion_group_id: editingMovement.conversion_group_id,
        transfer_group_id: editingMovement.transfer_group_id
      })
      
      // Detectar el tipo de movimiento por los campos del movimiento
      const isConversionMovement = !!editingMovement.conversion_group_id
      const isTransferMovement = !!editingMovement.transfer_group_id
      
      // Detectar los 3 tipos de aportes basándose en los extra_fields de la categoría
      const extraFields = selectedCategory?.extra_fields || []
      console.log('Category detection details:', {
        categoryName: selectedCategory?.name,
        categoryViewMode,
        extraFields,
        selectedCategoryId: selectedCategory?.id,
        editingCategoryId: editingMovement.category_id
      })
      
      const isAportesMovement = categoryViewMode === "aportes" && extraFields.includes('cliente_id') // Aportes de Terceros
      const isAportesPropriosMovement = categoryViewMode === "aportes" && extraFields.includes('socio_id') && selectedCategory?.name === "Aportes Propios"
      const isRetirosPropriosMovement = categoryViewMode === "retiros_propios" || (extraFields.includes('socio_id') && selectedCategory?.name?.includes('Retiro'))
      
      // Establecer el tipo de formulario correcto
      if (isConversionMovement) {
        setMovementType('conversion')
      } else if (isTransferMovement) {
        setMovementType('transfer')
      } else if (isAportesMovement) {
        setMovementType('aportes')
      } else if (isAportesPropriosMovement) {
        setMovementType('aportes_propios')
      } else if (isRetirosPropriosMovement) {
        setMovementType('retiros_propios')
      } else {
        setMovementType('normal')
      }
      
      console.log('Edit mode - detected movement type:', { 
        categoryId: editingMovement.category_id,
        categoryName: selectedCategory?.name,
        viewMode, 
        categoryViewMode,
        extraFields,
        isConversionMovement, 
        isTransferMovement, 
        isAportesMovement,
        isAportesPropriosMovement,
        isRetirosPropriosMovement
      })
      
      console.log('Form states after setting:', {
        isConversion: isConversionMovement,
        isTransfer: isTransferMovement,
        isAportes: isAportesMovement,
        isAportesPropios: isAportesPropriosMovement,
        isRetirosPropios: isRetirosPropriosMovement
      })
      
      // Cargar datos en el formulario correcto según el tipo de movimiento
      if (isConversionMovement) {
        // Para conversiones, cargar el grupo completo
        console.log('Loading conversion group for editing:', editingMovement.conversion_group_id)
        
        // Buscar el concepto "Conversión" para asignar el type_id correcto
        const conversionConcept = concepts?.find((concept: any) => 
          concept.view_mode?.trim() === "conversion"
        )
        
        // Función para cargar los datos del grupo de conversión
        const loadConversionGroup = async () => {
          const { data: groupMovements, error: groupError } = await supabase
            .from('movements')
            .select('*')
            .eq('conversion_group_id', editingMovement.conversion_group_id)
            .order('amount', { ascending: false })
          
          if (groupError) {
            console.error('Error loading conversion group:', groupError)
            return
          }
          
          // Identificar movimientos de egreso e ingreso
          const egressMovement = groupMovements?.[0]
          const ingressMovement = groupMovements?.[1]
          
          console.log('Conversion group movements:', { egressMovement, ingressMovement })
          
          // Buscar las billeteras correspondientes en la relación organizacion_wallets
          const egressWallet = wallets?.find(w => w.id === egressMovement?.wallet_id)
          const ingressWallet = wallets?.find(w => w.id === ingressMovement?.wallet_id)
          
          // Cargar datos del grupo de conversión en el formulario
          const conversionData = {
            movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
            created_by: editingMovement.created_by || '',
            description: editingMovement.description || '',
            type_id: conversionConcept?.id || editingMovement.type_id || '',
            currency_id_from: egressMovement?.currency_id || '',
            wallet_id_from: egressWallet?.id || '',
            amount_from: egressMovement?.amount || 0,
            currency_id_to: ingressMovement?.currency_id || '',
            wallet_id_to: ingressWallet?.id || '',
            amount_to: ingressMovement?.amount || 0,
            exchange_rate: editingMovement.exchange_rate || undefined
          }
          
          console.log('Loading conversion form data:', conversionData)
          if (!loadingReady) return
          conversionForm.reset(conversionData)
        }
        
        loadConversionGroup()
        
        // CRITICAL: También cargar en el formulario normal para que los campos superiores aparezcan
        if (!loadingReady) return
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          project_id: editingMovement.project_id || null,
          type_id: conversionConcept?.id || editingMovement.type_id || '', // Usar el ID del concepto "Conversión"
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
        
        // Establecer selectedTypeId para conversiones también
        if (conversionConcept?.id) {
          setSelectedTypeId(conversionConcept.id)
        }
      } else if (isTransferMovement) {
        // Para transferencias, cargar el grupo completo
        
        // Buscar el concepto "Transferencia Interna" para asignar el type_id correcto
        const transferConcept = concepts?.find((concept: any) => 
          concept.view_mode?.trim() === "transfer"
        )
        
        // Función para cargar los datos del grupo de transferencia
        const loadTransferGroup = async () => {
          const { data: groupMovements, error: groupError } = await supabase
            .from('movements')
            .select('*')
            .eq('transfer_group_id', editingMovement.transfer_group_id)
            .order('amount', { ascending: false })
          
          if (groupError) {
            console.error('Error loading transfer group:', groupError)
            return
          }
          
          // Identificar movimientos de egreso e ingreso
          const egressMovement = groupMovements?.[0]
          const ingressMovement = groupMovements?.[1]
          

          
          // Buscar las billeteras correspondientes en la relación organizacion_wallets
          const egressWallet = wallets?.find(w => w.id === egressMovement?.wallet_id)
          const ingressWallet = wallets?.find(w => w.id === ingressMovement?.wallet_id)
          
          // Cargar datos del grupo de transferencia en el formulario
          const transferData = {
            movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
            created_by: editingMovement.created_by || '',
            description: editingMovement.description || '',
            type_id: transferConcept?.id || editingMovement.type_id || '',
            currency_id: egressMovement?.currency_id || '',
            wallet_id_from: egressWallet?.id || '',
            wallet_id_to: ingressWallet?.id || '',
            amount: egressMovement?.amount || 0
          }
          

          if (!loadingReady) return
          transferForm.reset(transferData)
        }
        
        loadTransferGroup()
        
        // CRITICAL: También cargar en el formulario normal para que los campos superiores aparezcan
        if (!loadingReady) return
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          project_id: editingMovement.project_id || null,
          type_id: transferConcept?.id || editingMovement.type_id || '', // Usar el ID del concepto "Transferencia Interna"
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
        
        // Establecer selectedTypeId para transferencias también
        if (transferConcept?.id) {
          setSelectedTypeId(transferConcept.id)
        }
      } else if (isAportesMovement) {
        // Para aportes de terceros, cargar datos en formulario de aportes
        if (!loadingReady) return
        aportesForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          contact_id: editingMovement.contact_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
        
        // CRITICAL: También cargar en el formulario principal para que los campos centralizados aparezcan
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          project_id: editingMovement.project_id || null,
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
        
        // Establecer selectedTypeId para aportes también
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
        
        // Establecer selectedCategoryId para que aparezca la subcategoría
        if (editingMovement.category_id) {
          setSelectedCategoryId(editingMovement.category_id)
        }
      } else if (isAportesPropriosMovement) {
        // Para aportes propios, cargar datos en formulario de aportes propios
        if (!loadingReady) return
        aportesPropriosForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          member_id: editingMovement.member_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
        
        // CRITICAL: También cargar en el formulario principal para que los campos centralizados aparezcan
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          project_id: editingMovement.project_id || null,
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
        
        // Establecer selectedTypeId para aportes propios también
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
        
        // Establecer selectedCategoryId para que aparezca la subcategoría
        if (editingMovement.category_id) {
          setSelectedCategoryId(editingMovement.category_id)
        }
      } else if (isRetirosPropriosMovement) {
        // Para retiros propios, cargar datos en formulario de retiros propios
        if (!loadingReady) return
        retirosPropriosForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          member_id: editingMovement.member_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
        
        // CRITICAL: También cargar en el formulario principal para que los campos centralizados aparezcan
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          project_id: editingMovement.project_id || null,
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
        
        // Establecer selectedTypeId para retiros propios también
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
        
        // Establecer selectedCategoryId para que aparezca la subcategoría
        if (editingMovement.category_id) {
          setSelectedCategoryId(editingMovement.category_id)
        }
      } else {
        // Formulario normal
        console.log('Loading form with categories:', {
          category_id: editingMovement.category_id,
          subcategory_id: editingMovement.subcategory_id,
          type_id: editingMovement.type_id
        })
        
        if (!loadingReady) return
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
          project_id: editingMovement.project_id || null,
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
        })
        
        // Establecer selectedTypeId y selectedCategoryId para que las opciones se carguen
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
        if (editingMovement.category_id) {
          setSelectedCategoryId(editingMovement.category_id)
        }
      }
    }
    setPanel('edit')
  }, [editingMovement?.id, form, setPanel])

  // Efecto para inicializar el campo created_by cuando members esté disponible
  React.useEffect(() => {
    if (!editingMovement && members && userData?.user?.id) {
      const currentMember = members.find(m => m.user_id === userData.user.id)
      
      if (currentMember?.id) {
        // Inicializar created_by en todos los formularios
        form.setValue('created_by', currentMember.id)
        conversionForm.setValue('created_by', currentMember.id)
        transferForm.setValue('created_by', currentMember.id)
        aportesForm.setValue('created_by', currentMember.id)
        aportesPropriosForm.setValue('created_by', currentMember.id)
        aportesPropriosForm.setValue('member_id', currentMember.id)
        retirosPropriosForm.setValue('created_by', currentMember.id)
        retirosPropriosForm.setValue('member_id', currentMember.id)
      }
    }
  }, [members, userData?.user?.id, editingMovement, form, conversionForm, transferForm, aportesForm, aportesPropriosForm, retirosPropriosForm])

  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }



      const movementData = {
        ...data,
        organization_id: userData.organization.id,
        project_id: data.project_id || null, // Usar project_id del formulario
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
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
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

      // Si estamos editando, actualizar los movimientos existentes
      if (editingMovement?.conversion_group_id) {
        // Buscar los movimientos del grupo
        const { data: groupMovements, error: groupError } = await supabase
          .from('movements')
          .select('*')
          .eq('conversion_group_id', editingMovement.conversion_group_id)
          .order('amount', { ascending: false })
        
        if (groupError) throw groupError
        
        const egressMovement = groupMovements[0]
        const ingressMovement = groupMovements[1]
        
        // Actualizar movimiento de egreso
        const { error: egressError } = await supabase
          .from('movements')
          .update({
            movement_date: data.movement_date.toISOString().split('T')[0],
            created_by: data.created_by,
            description: data.description || 'Conversión - Salida',
            amount: data.amount_from,
            currency_id: data.currency_id_from,
            wallet_id: data.wallet_id_from,
            exchange_rate: data.exchange_rate || null,
            project_id: form.watch('project_id') || null
          })
          .eq('id', egressMovement.id)
        
        if (egressError) throw egressError
        
        // Actualizar movimiento de ingreso
        const { error: ingressError } = await supabase
          .from('movements')
          .update({
            movement_date: data.movement_date.toISOString().split('T')[0],
            created_by: data.created_by,
            description: data.description || 'Conversión - Entrada',
            amount: data.amount_to,
            currency_id: data.currency_id_to,
            wallet_id: data.wallet_id_to,
            exchange_rate: data.exchange_rate || null,
            project_id: form.watch('project_id') || null
          })
          .eq('id', ingressMovement.id)
        
        if (ingressError) throw ingressError
        
        return 'updated'
      } else {
        // Crear nueva conversión
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
          project_id: form.watch('project_id') || null,
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      toast({
        title: editingMovement ? 'Conversión actualizada' : 'Conversión creada',
        description: editingMovement 
          ? 'La conversión ha sido actualizada correctamente'
          : 'La conversión ha sido creada correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingMovement ? 'actualizar' : 'crear'} la conversión: ${error.message}`,
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
        project_id: form.watch('project_id') || null, // Usar project_id del formulario
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
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
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

      // Mapear created_by de user_id a organization_member.id
      const createdByMember = members?.find(m => m.user_id === data.created_by)?.id || data.created_by

      const movementData = {
        organization_id: userData.organization.id,
        project_id: form.watch('project_id') || null, // Usar project_id del formulario
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: createdByMember,
        description: data.description || 'Aporte',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        type_id: data.type_id,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || null, // Agregar subcategoría
        contact_id: data.contact_id, // Este campo guardará cliente_id o socio_id
        exchange_rate: data.exchange_rate || null // Agregar cotización opcional
      }

      console.log('Movement data to be saved:', movementData)

      // Si estamos editando, actualizar el movimiento existente
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
        // Si estamos creando, insertar nuevo movimiento
        const { data: result, error } = await supabase
          .from('movements')
          .insert([movementData])
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      toast({
        title: editingMovement ? 'Aporte actualizado' : 'Aporte registrado',
        description: editingMovement 
          ? 'El aporte ha sido actualizado correctamente'
          : 'El aporte ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingMovement ? 'actualizar' : 'registrar'} el aporte: ${error.message}`,
      })
    }
  })

  const onSubmit = async (data: MovementForm) => {
    console.log('Saving wallet_id:', data.wallet_id)
    await createMovementMutation.mutateAsync(data)
  }

  const onSubmitConversion = async (data: ConversionForm) => {
    console.log('Saving conversion wallet_id_from:', data.wallet_id_from, 'wallet_id_to:', data.wallet_id_to)
    await createConversionMutation.mutateAsync(data)
  }

  const onSubmitTransfer = async (data: TransferForm) => {
    console.log('Saving transfer wallet_id_from:', data.wallet_id_from, 'wallet_id_to:', data.wallet_id_to)
    await createTransferMutation.mutateAsync(data)
  }

  const createAportesPropriosMutation = useMutation({
    mutationFn: async (data: AportesPropriosForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      const movementData = {
        organization_id: userData.organization.id,
        project_id: form.watch('project_id') || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Aporte Propio',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        type_id: data.type_id,
        category_id: data.category_id,
        member_id: data.member_id, // Campo específico para socio
        exchange_rate: data.exchange_rate || null
      }

      // Si estamos editando, actualizar el movimiento existente
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
        // Si estamos creando, insertar nuevo movimiento
        const { data: result, error } = await supabase
          .from('movements')
          .insert([movementData])
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      toast({
        title: editingMovement ? 'Aporte Propio actualizado' : 'Aporte Propio registrado',
        description: editingMovement 
          ? 'El aporte propio ha sido actualizado correctamente'
          : 'El aporte propio ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingMovement ? 'actualizar' : 'registrar'} el aporte propio: ${error.message}`,
      })
    }
  })

  const createRetirosPropriosMutation = useMutation({
    mutationFn: async (data: RetirosPropriosForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      const movementData = {
        organization_id: userData.organization.id,
        project_id: form.watch('project_id') || null,
        movement_date: data.movement_date.toISOString().split('T')[0],
        created_by: data.created_by,
        description: data.description || 'Retiro Propio',
        amount: data.amount,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        type_id: data.type_id,
        category_id: data.category_id,
        member_id: data.member_id, // Campo específico para socio
        exchange_rate: data.exchange_rate || null
      }

      // Si estamos editando, actualizar el movimiento existente
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
        // Si estamos creando, insertar nuevo movimiento
        const { data: result, error } = await supabase
          .from('movements')
          .insert([movementData])
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movement-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      toast({
        title: editingMovement ? 'Retiro Propio actualizado' : 'Retiro Propio registrado',
        description: editingMovement 
          ? 'El retiro propio ha sido actualizado correctamente'
          : 'El retiro propio ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${editingMovement ? 'actualizar' : 'registrar'} el retiro propio: ${error.message}`,
      })
    }
  })

  const onSubmitAportes = async (data: AportesForm) => {
    console.log('onSubmitAportes called with data:', data)
    console.log('Saving aportes data:', {
      wallet_id: data.wallet_id,
      contact_id: data.contact_id,
      category_id: data.category_id,
      type_id: data.type_id,
      amount: data.amount,
      currency_id: data.currency_id,
      created_by: data.created_by,
      movement_date: data.movement_date,
      description: data.description,
      exchange_rate: data.exchange_rate
    })
    
    try {
      await createAportesMutation.mutateAsync(data)
      console.log('Aportes mutation completed successfully')
    } catch (error) {
      console.error('Error in aportes mutation:', error)
      throw error
    }
  }

  const onSubmitAportesPropios = async (data: AportesPropriosForm) => {
    console.log('Saving aportes propios data:', {
      wallet_id: data.wallet_id,
      member_id: data.member_id,
      category_id: data.category_id,
      type_id: data.type_id,
      amount: data.amount,
      currency_id: data.currency_id
    })
    await createAportesPropriosMutation.mutateAsync(data)
  }

  const onSubmitRetirosPropios = async (data: RetirosPropriosForm) => {
    console.log('Saving retiros propios data:', {
      created_by: data.created_by,
      wallet_id: data.wallet_id,
      member_id: data.member_id,
      category_id: data.category_id,
      type_id: data.type_id,
      amount: data.amount,
      currency_id: data.currency_id
    })
    console.log('Full form data for retiros propios:', data)
    await createRetirosPropriosMutation.mutateAsync(data)
  }

  const handleClose = () => {
    setPanel('edit')
    onClose()
  }

  const handleConfirm = () => {
    // Detectar tipo de movimiento basándose en la categoría ACTUAL seleccionada
    const currentCategoryId = form.watch('category_id')
    const currentCategory = categories?.find((cat: any) => cat.id === currentCategoryId)
    const currentCategoryViewMode = (currentCategory?.view_mode ?? "normal").trim()
    const currentExtraFields = currentCategory?.extra_fields || []
    
    // Detectar tipo actual basándose en la categoría seleccionada
    const isCurrentAportes = currentCategoryViewMode === "aportes" && currentExtraFields.includes('cliente_id')
    const isCurrentAportesPropios = currentCategoryViewMode === "aportes" && currentExtraFields.includes('socio_id') && currentCategory?.name === "Aportes Propios"
    const isCurrentRetirosPropios = currentCategoryViewMode === "retiros_propios" || (currentExtraFields.includes('socio_id') && currentCategory?.name?.includes('Retiro'))
    
    console.log('handleConfirm - detecting current movement type:', {
      currentCategoryId,
      currentCategoryName: currentCategory?.name,
      currentCategoryViewMode,
      currentExtraFields,
      isCurrentAportes,
      isCurrentAportesPropios,
      isCurrentRetirosPropios,
      originalMovementType: movementType
    })
    
    // Usar el tipo detectado basándose en la categoría actual
    if (isCurrentAportes) {
      console.log('Submitting as aportes form')
      
      // CRITICAL: Sincronizar TODOS los campos centralizados del formulario principal antes de enviar
      const mainFormTypeId = form.watch('type_id')
      const mainFormCreatedBy = form.watch('created_by')
      const mainFormMovementDate = form.watch('movement_date')
      const mainFormSubcategoryId = form.watch('subcategory_id')
      
      if (mainFormTypeId) {
        console.log('Synchronizing type_id before submit:', mainFormTypeId)
        aportesForm.setValue('type_id', mainFormTypeId)
      }
      
      if (mainFormCreatedBy) {
        console.log('Synchronizing created_by before submit:', mainFormCreatedBy)
        aportesForm.setValue('created_by', mainFormCreatedBy)
      }
      
      if (mainFormMovementDate) {
        console.log('Synchronizing movement_date before submit:', mainFormMovementDate)
        aportesForm.setValue('movement_date', mainFormMovementDate)
      }
      
      if (mainFormSubcategoryId) {
        console.log('Synchronizing subcategory_id before submit:', mainFormSubcategoryId)
        aportesForm.setValue('subcategory_id', mainFormSubcategoryId)
      }
      
      console.log('AportesFields - Currency data structure:', {
        currencies: currencies?.[0], 
        formData: aportesForm.getValues(),
        formErrors: aportesForm.formState.errors,
        isValid: aportesForm.formState.isValid
      })
      aportesForm.handleSubmit(onSubmitAportes)()
    } else if (isCurrentAportesPropios) {
      console.log('Submitting as aportes propios form')
      
      // CRITICAL: Sincronizar TODOS los campos centralizados del formulario principal antes de enviar
      const mainFormTypeId = form.watch('type_id')
      const mainFormCreatedBy = form.watch('created_by')
      const mainFormMovementDate = form.watch('movement_date')
      const mainFormDescription = form.watch('description')
      
      if (mainFormTypeId) {
        console.log('Synchronizing type_id before submit:', mainFormTypeId)
        aportesPropriosForm.setValue('type_id', mainFormTypeId)
      }
      
      if (mainFormCreatedBy) {
        console.log('Synchronizing created_by before submit:', mainFormCreatedBy)
        aportesPropriosForm.setValue('created_by', mainFormCreatedBy)
      }
      
      if (mainFormMovementDate) {
        console.log('Synchronizing movement_date before submit:', mainFormMovementDate)
        aportesPropriosForm.setValue('movement_date', mainFormMovementDate)
      }
      
      if (mainFormDescription) {
        console.log('Synchronizing description before submit:', mainFormDescription)
        aportesPropriosForm.setValue('description', mainFormDescription)
      }
      
      aportesPropriosForm.handleSubmit(onSubmitAportesPropios)()
    } else if (isCurrentRetirosPropios) {
      console.log('Submitting as retiros propios form')
      
      // CRITICAL: Sincronizar TODOS los campos centralizados del formulario principal antes de enviar
      const mainFormTypeId = form.watch('type_id')
      const mainFormCreatedBy = form.watch('created_by')
      const mainFormMovementDate = form.watch('movement_date')
      const mainFormDescription = form.watch('description')
      
      if (mainFormTypeId) {
        console.log('Synchronizing type_id before submit:', mainFormTypeId)
        retirosPropriosForm.setValue('type_id', mainFormTypeId)
      }
      
      if (mainFormCreatedBy) {
        console.log('Synchronizing created_by before submit:', mainFormCreatedBy)
        retirosPropriosForm.setValue('created_by', mainFormCreatedBy)
      }
      
      if (mainFormMovementDate) {
        console.log('Synchronizing movement_date before submit:', mainFormMovementDate)
        retirosPropriosForm.setValue('movement_date', mainFormMovementDate)
      }
      
      if (mainFormDescription) {
        console.log('Synchronizing description before submit:', mainFormDescription)
        retirosPropriosForm.setValue('description', mainFormDescription)
      }
      
      retirosPropriosForm.handleSubmit(onSubmitRetirosPropios)()
    } else {
      // Usar el movementType original para casos como conversión/transferencia
      switch (movementType) {
        case 'conversion':
          console.log('Submitting as conversion form')
          conversionForm.handleSubmit(onSubmitConversion)()
          break
        case 'transfer':
          console.log('Submitting as transfer form')
          transferForm.handleSubmit(onSubmitTransfer)()
          break
        default:
          console.log('Submitting as normal form')
          form.handleSubmit(onSubmit)()
      }
    }
  }

  const isLoading = createMovementMutation.isPending || createConversionMutation.isPending || createTransferMutation.isPending || createAportesMutation.isPending

  // Encontrar datos para display
  const selectedCurrency = currencies?.find(c => c.currency?.id === form.watch('currency_id'))?.currency
  const selectedWallet = wallets?.find(w => w.id === form.watch('wallet_id'))?.wallets
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

  // Determinar qué tipo de formulario mostrar basado en el movimiento editado
  const isEditingConversion = editingMovement && !!editingMovement.conversion_group_id
  const isEditingTransfer = editingMovement && !!editingMovement.transfer_group_id
  const isEditingAportes = editingMovement && concepts?.find((c: any) => c.id === editingMovement.type_id)?.view_mode?.trim() === "aportes"
  const isEditingAportesPropios = editingMovement && concepts?.find((c: any) => c.id === editingMovement.type_id)?.view_mode?.trim() === "aportes_propios"
  const isEditingRetirosPropios = editingMovement && concepts?.find((c: any) => c.id === editingMovement.type_id)?.view_mode?.trim() === "retiros_propios"

  const editPanel = (
    <div className="space-y-4">
      {/* Campos centralizados: Creador y Fecha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Creador *
          </label>
          <UserSelector
            users={members || []}
            value={form.watch('created_by')}
            onChange={(value) => {
              // Actualizar todos los formularios
              form.setValue('created_by', value)
              conversionForm.setValue('created_by', value)
              transferForm.setValue('created_by', value)
              aportesForm.setValue('created_by', value)
              aportesPropriosForm.setValue('created_by', value)
              retirosPropriosForm.setValue('created_by', value)
            }}
            placeholder="Seleccionar creador"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Fecha *
          </label>
          <Input
            type="date"
            value={form.watch('movement_date') ? form.watch('movement_date').toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const localDate = new Date(e.target.value + 'T00:00:00');
              // Actualizar todos los formularios
              form.setValue('movement_date', localDate)
              conversionForm.setValue('movement_date', localDate)
              transferForm.setValue('movement_date', localDate)
              aportesForm.setValue('movement_date', localDate)
              aportesPropriosForm.setValue('movement_date', localDate)
              retirosPropriosForm.setValue('movement_date', localDate)
            }}
          />
        </div>
      </div>

      {/* Selector de proyecto - Solo mostrar en modo GENERAL (sin proyecto activo) */}
      {!userData?.preferences?.last_project_id && !editingMovement && (
        <div className="space-y-2">
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Proyecto
          </label>
          <Select 
            onValueChange={(value) => {
              const projectId = value === 'general' ? null : value
              form.setValue('project_id', projectId)
            }} 
            value={form.watch('project_id') || 'general'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proyecto..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span>General</span>
                </div>
              </SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: project.color || '#000000' }}
                    ></div>
                    <span>{project.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Selector de tipo de movimiento - CENTRALIZADO */}
      <div className="space-y-2">
        <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Tipo de movimiento *
        </label>
        <Select onValueChange={(value) => {
          setSelectedTypeId(value)
          handleTypeChange(value)
        }} value={form.watch('type_id')}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            {concepts?.map((concept) => (
              <SelectItem key={concept.id} value={concept.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{concept.name}</span>
                  {concept.is_system && (
                    <span className="text-xs border rounded px-1 ml-2 text-muted-foreground border-muted-foreground/30">
                      Sistema
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campos de Categoría y Subcategoría - Mostrar solo cuando hay categorías disponibles */}
      {shouldShowCategoryFields && (
        <div className="grid grid-cols-1 gap-4">
          {/* Categoría */}
          <div className="space-y-2">
            <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Categoría *
            </label>
            <Select 
              onValueChange={(value) => {
                // Actualizar todos los formularios
                form.setValue('category_id', value)
                aportesForm.setValue('category_id', value)
                aportesPropriosForm.setValue('category_id', value) 
                retirosPropriosForm.setValue('category_id', value)
                setSelectedCategoryId(value)
                
                // CRITICAL: Detectar tipo de aportes en modo edición también
                if (editingMovement && categories) {
                  const selectedCategory = categories.find((cat: any) => cat.id === value)
                  const viewMode = (selectedCategory?.view_mode ?? "normal").trim()
                  
                  console.log('Detecting category type in edit mode:', { value, categoryName: selectedCategory?.name, viewMode })
                  
                  // Detectar el tipo específico de aportes
                  const isAportesCategory = viewMode === "aportes"
                  
                  // CRITICAL: Sincronizar type_id del formulario principal al formulario de aportes
                  const currentTypeId = form.watch('type_id')
                  if (currentTypeId && isAportesCategory) {
                    console.log('Synchronizing type_id to aportes form in edit mode:', currentTypeId)
                    aportesForm.setValue('type_id', currentTypeId)
                  }
                  const isAportesPropiosCategory = viewMode === "aportes_propios"
                  const isRetirosPropiosCategory = viewMode === "retiros_propios"
                  
                  if (isAportesCategory) {
                    console.log('Switching to APORTES form in edit mode')
                    setMovementType('aportes')
                  } else if (isAportesPropiosCategory) {
                    console.log('Switching to APORTES PROPIOS form in edit mode')
                    setMovementType('aportes_propios')
                  } else if (isRetirosPropiosCategory) {
                    console.log('Switching to RETIROS PROPIOS form in edit mode')
                    setMovementType('retiros_propios')
                  } else {
                    console.log('Switching to NORMAL form in edit mode')
                    setMovementType('normal')
                  }
                }
              }} 
              value={form.watch('category_id')}
              disabled={!form.watch('type_id')}
            >
              <SelectTrigger>
                <SelectValue placeholder={!form.watch('type_id') ? "Seleccione primero un tipo" : "Seleccionar categoría..."} />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{category.name}</span>
                      {category.is_system && (
                        <span className="text-xs border rounded px-1 ml-2 text-muted-foreground border-muted-foreground/30">
                          Sistema
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoría - Mostrar solo cuando hay subcategorías disponibles */}
          {shouldShowSubcategoryFields && (
            <div className="space-y-2">
              <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Subcategoría
              </label>
              <Select 
                onValueChange={(value) => {
                  // Actualizar todos los formularios
                  form.setValue('subcategory_id', value)
                  aportesForm.setValue('subcategory_id', value)
                  aportesPropriosForm.setValue('subcategory_id', value)
                  retirosPropriosForm.setValue('subcategory_id', value)
                }} 
                value={form.watch('subcategory_id')}
                disabled={!selectedCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!selectedCategoryId ? "Seleccione primero una categoría" : "Seleccionar subcategoría..."} />
                </SelectTrigger>
                <SelectContent>
                  {subcategories?.map((subcategory: any) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{subcategory.name}</span>
                        {subcategory.is_system && (
                          <span className="text-xs border rounded px-1 ml-2 text-muted-foreground border-muted-foreground/30">
                            Sistema
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
      
      {(isConversion || isEditingConversion) ? (
        <Form {...conversionForm}>
          <ConversionFields 
            form={conversionForm} 
            currencies={currencies} 
            wallets={wallets} 
            members={members}
            concepts={concepts}
            movement={editingMovement}
          />
        </Form>
      ) : (isTransfer || isEditingTransfer) ? (
        <Form {...transferForm}>
          <TransferFields
            form={transferForm}
            currencies={currencies}
            wallets={wallets}
            members={members}
            concepts={concepts}
          />
        </Form>
      ) : (isAportes || isEditingAportes) ? (
        <Form {...aportesForm}>
          <form onSubmit={aportesForm.handleSubmit(onSubmitAportes)} className="space-y-4">
            <AportesFields
              form={aportesForm}
              currencies={currencies}
              wallets={wallets}
              members={members}
              concepts={concepts}
              projectClients={projectClients}
            />
          </form>
        </Form>
      ) : (isAportesPropios || isEditingAportesPropios) ? (
        // FORMULARIO DE APORTES PROPIOS
        <Form {...aportesPropriosForm}>
          <form onSubmit={aportesPropriosForm.handleSubmit(onSubmitAportesPropios)} className="space-y-4">
            <AportesPropiosFields
              form={aportesPropriosForm}
              currencies={currencies}
              wallets={wallets}
              members={members}
              concepts={concepts}
            />
          </form>
        </Form>
      ) : (isRetirosPropios || isEditingRetirosPropios) ? (
        // FORMULARIO DE RETIROS PROPIOS
        <Form {...retirosPropriosForm}>
          <form onSubmit={retirosPropriosForm.handleSubmit(onSubmitRetirosPropios)} className="space-y-4">
            <RetirosPropiosFields
              form={retirosPropriosForm}
              currencies={currencies}
              wallets={wallets}
              members={members}
              concepts={concepts}
            />
          </form>
        </Form>
      ) : (
        // FORMULARIO NORMAL
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-4">
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

            {/* Fila: Moneda | Billetera */}
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
                          <SelectItem key={wallet.id} value={wallet.id}>
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

            {/* Fila: Monto | Cotización */}
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
                      className="resize-none"
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
          isAportesPropios ? "Registrar Aporte Propio" :
          isRetirosPropios ? "Registrar Retiro Propio" :
          "Guardar"
        )
      }
      onRightClick={() => {
        if (currentPanel === 'view' && editingMovement) {
          setPanel('edit')
        } else {
          handleConfirm()
        }
      }}
      showLoadingSpinner={createMovementMutation.isPending || createConversionMutation.isPending || createTransferMutation.isPending || createAportesMutation.isPending || createAportesPropriosMutation.isPending || createRetirosPropriosMutation.isPending}
    />
  )

  // Si los datos aún están cargando, mostrar estado de carga
  if (isDataLoading) {
    const loadingViewPanel = (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Cargando datos del formulario...</p>
        </div>
      </div>
    )

    const loadingHeaderContent = (
      <FormModalHeader
        title="Nuevo Movimiento"
        icon={DollarSign}
      />
    )

    const loadingFooterContent = (
      <FormModalFooter
        leftLabel="Cancelar"
        onLeftClick={onClose}
        rightLabel="Cargando..."
        onRightClick={() => {}}
        showLoadingSpinner={true}
      />
    )

    return (
      <FormModalLayout
        columns={1}
        viewPanel={loadingViewPanel}
        editPanel={null}
        headerContent={loadingHeaderContent}
        footerContent={loadingFooterContent}
        onClose={onClose}
      />
    )
  }

  return (
    <FormModalLayout
      columns={1}
      viewPanel={currentPanel === 'view' ? viewPanel : null}
      editPanel={currentPanel === 'edit' ? editPanel : null}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  )
}