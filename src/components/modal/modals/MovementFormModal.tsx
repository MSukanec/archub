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
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
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
  category_id: z.string().min(1, 'Categoría es requerida'),
  // Campos para aportes
  contact_id: z.string().min(1, 'Cliente es requerido'),
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
  member_id: z.string().min(1, 'Socio es requerido'),
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
  member_id: z.string().min(1, 'Socio es requerido'),
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
  const { data: userData } = useCurrentUser()
  const { data: members } = useOrganizationMembers(userData?.organization?.id)
  const { data: currencies } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets } = useOrganizationWallets(userData?.organization?.id)
  

  const { data: contacts } = useContacts()
  const { data: projectClients } = useProjectClients(userData?.preferences?.last_project_id)
  const { data: organizationConcepts } = useOrganizationMovementConcepts(userData?.organization?.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

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

  // Estados para la lógica jerárquica
  const [selectedTypeId, setSelectedTypeId] = React.useState(editingMovement?.type_id || '')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(editingMovement?.category_id || '')
  
  // Estados para detectar tipo de formulario
  const [isConversion, setIsConversion] = React.useState(false)
  const [isTransfer, setIsTransfer] = React.useState(false)
  const [isAportes, setIsAportes] = React.useState(false)
  const [isAportesPropios, setIsAportesPropios] = React.useState(false)
  const [isRetirosPropios, setIsRetirosPropios] = React.useState(false)

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
      type_id: '',
      currency_id: userData?.organization?.default_currency_id || '',
      wallet_id_from: userData?.organization?.default_wallet_id || '',
      wallet_id_to: '',
      amount: 0
    }
  })

  const aportesForm = useForm<AportesForm>({
    resolver: zodResolver(aportesFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      description: '',
      type_id: '',
      category_id: '',
      contact_id: '',
      currency_id: userData?.organization_preferences?.default_currency || '',
      wallet_id: userData?.organization_preferences?.default_wallet || '',
      amount: 0,
      exchange_rate: undefined
    }
  })

  const aportesPropriosForm = useForm<AportesPropriosForm>({
    resolver: zodResolver(aportesPropriosFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      description: '',
      type_id: '',
      category_id: '',
      member_id: '',
      currency_id: userData?.organization_preferences?.default_currency || '',
      wallet_id: userData?.organization_preferences?.default_wallet || '',
      amount: 0,
      exchange_rate: undefined
    }
  })

  const retirosPropriosForm = useForm<RetirosPropriosForm>({
    resolver: zodResolver(retirosPropriosFormSchema),
    defaultValues: {
      movement_date: new Date(),
      created_by: '',
      description: '',
      type_id: '',
      category_id: '',
      member_id: '',
      currency_id: userData?.organization_preferences?.default_currency || '',
      wallet_id: userData?.organization_preferences?.default_wallet || '',
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
    if (!newTypeId || newTypeId === selectedTypeId || !concepts) return
    
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
    setIsConversion(isConversionType)
    setIsTransfer(isTransferType)
    setIsAportes(isAportesType)
    
    // Reset solo en nuevo movimiento
    if (!editingMovement) {
      form.setValue('category_id', '')
      form.setValue('subcategory_id', '')
      setSelectedCategoryId('')
      
      // Sincronizar formularios
      conversionForm.setValue('type_id', newTypeId)
      transferForm.setValue('type_id', newTypeId)
      aportesForm.setValue('type_id', newTypeId)
    }
  }, [selectedTypeId, concepts, editingMovement, form, conversionForm, transferForm, aportesForm])
  
  // Escuchar cambios en el tipo
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'type_id' && value.type_id) {
        handleTypeChange(value.type_id)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, handleTypeChange])

  // Efecto para detectar los 3 tipos de aportes cuando se selecciona una categoría
  React.useEffect(() => {
    // NO ejecutar este efecto cuando estamos editando un movimiento
    if (editingMovement) return
    
    const categoryId = form.watch('category_id') || aportesForm.watch('category_id') || aportesPropriosForm.watch('category_id') || retirosPropriosForm.watch('category_id')
    if (categoryId && categories) {
      const selectedCategory = categories.find((cat: any) => cat.id === categoryId)
      const viewMode = (selectedCategory?.view_mode ?? "normal").trim()
      
      console.log('Category with aportes detected:', { categoryId, selectedCategory })
      
      // Detectar el tipo específico de aportes
      const isAportesCategory = viewMode === "aportes"
      const isAportesPropiosCategory = viewMode === "aportes_propios"
      const isRetirosPropiosCategory = viewMode === "retiros_propios"
      
      if (isAportesCategory || isAportesPropiosCategory || isRetirosPropiosCategory) {
        // Reset todos los estados
        setIsAportes(false)
        setIsAportesPropios(false)
        setIsRetirosPropios(false)
        setIsConversion(false)
        setIsTransfer(false)
        
        // Establecer el estado correcto
        if (isAportesCategory) {
          setIsAportes(true)
        } else if (isAportesPropiosCategory) {
          setIsAportesPropios(true)
        } else if (isRetirosPropiosCategory) {
          setIsRetirosPropios(true)
        }
        
        // Solo sincronizar valores en modo nuevo movimiento
        if (!editingMovement) {
          const currentMember = members?.find(m => m.user_id === userData?.user?.id)?.id
          
          // Obtener los valores por defecto desde organization_preferences o usar el primero disponible
          const defaultCurrency = userData?.organization_preferences?.default_currency || currencies?.[0]?.currency_id
          const defaultWallet = userData?.organization_preferences?.default_wallet || wallets?.[0]?.id
          

          
          if (isAportesCategory) {
            // APORTES: Cliente + Cotización
            aportesForm.setValue('type_id', form.watch('type_id'))
            aportesForm.setValue('category_id', categoryId)
            aportesForm.setValue('description', '')
            if (currentMember) aportesForm.setValue('created_by', currentMember)
            if (defaultCurrency) aportesForm.setValue('currency_id', defaultCurrency)
            if (defaultWallet) aportesForm.setValue('wallet_id', defaultWallet)
            aportesForm.setValue('contact_id', '') // Limpiar cliente
          } else if (isAportesPropiosCategory) {
            // APORTES PROPIOS: Socio + Cotización
            aportesPropriosForm.setValue('type_id', form.watch('type_id'))
            aportesPropriosForm.setValue('category_id', categoryId)
            aportesPropriosForm.setValue('description', '')
            if (currentMember) aportesPropriosForm.setValue('created_by', currentMember)
            if (defaultCurrency) aportesPropriosForm.setValue('currency_id', defaultCurrency)
            if (defaultWallet) aportesPropriosForm.setValue('wallet_id', defaultWallet)
            aportesPropriosForm.setValue('member_id', '') // Limpiar socio
          } else if (isRetirosPropiosCategory) {
            // RETIROS PROPIOS: Socio + Cotización
            retirosPropriosForm.setValue('type_id', form.watch('type_id'))
            retirosPropriosForm.setValue('category_id', categoryId)
            retirosPropriosForm.setValue('description', '')
            if (currentMember) retirosPropriosForm.setValue('created_by', currentMember)
            if (defaultCurrency) retirosPropriosForm.setValue('currency_id', defaultCurrency)
            if (defaultWallet) retirosPropriosForm.setValue('wallet_id', defaultWallet)
            retirosPropriosForm.setValue('member_id', '') // Limpiar socio
            retirosPropriosForm.setValue('amount', 0) // Establecer cantidad inicial

          }
        }
      } else {
        // Si no es una categoría de aportes, permitir regresar al formulario normal
        if (isAportes || isAportesPropios || isRetirosPropios) {
          setIsAportes(false)
          setIsAportesPropios(false)
          setIsRetirosPropios(false)
        }
      }
    }
  }, [form.watch('category_id'), aportesForm.watch('category_id'), aportesPropriosForm.watch('category_id'), retirosPropriosForm.watch('category_id'), categories, members, userData, isAportes, isAportesPropios, isRetirosPropios, editingMovement])



  // Efecto para manejar la lógica jerárquica al seleccionar categoría
  React.useEffect(() => {
    const categoryId = form.watch('category_id')
    if (categoryId !== selectedCategoryId) {
      setSelectedCategoryId(categoryId)
      // Reset subcategoría cuando cambia la categoría (solo en modo nuevo movimiento)
      if (!editingMovement && categoryId !== selectedCategoryId) {
        form.setValue('subcategory_id', '')
      }
    }
  }, [form.watch('category_id')])

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
        w.wallet_id === editingMovement.wallet_id
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
      const isAportesMovement = categoryViewMode === "aportes" && extraFields.includes('cliente_id') // Aportes de Terceros
      const isAportesPropriosMovement = categoryViewMode === "aportes" && extraFields.includes('socio_id') && selectedCategory?.name === "Aportes Propios"
      const isRetirosPropriosMovement = categoryViewMode === "retiros_propios" || (extraFields.includes('socio_id') && selectedCategory?.name?.includes('Retiro'))
      
      // Reset todos los estados primero
      setIsConversion(false)
      setIsTransfer(false)
      setIsAportes(false)
      setIsAportesPropios(false)
      setIsRetirosPropios(false)
      
      // Establecer el tipo de formulario correcto
      if (isConversionMovement) {
        setIsConversion(true)
      } else if (isTransferMovement) {
        setIsTransfer(true)
      } else if (isAportesMovement) {
        setIsAportes(true)
      } else if (isAportesPropriosMovement) {
        setIsAportesPropios(true)
      } else if (isRetirosPropriosMovement) {
        setIsRetirosPropios(true)
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
          const egressWallet = wallets?.find(w => w.wallet_id === egressMovement?.wallet_id)
          const ingressWallet = wallets?.find(w => w.wallet_id === ingressMovement?.wallet_id)
          
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
          conversionForm.reset(conversionData)
        }
        
        loadConversionGroup()
        
        // CRITICAL: También cargar en el formulario normal para que los campos superiores aparezcan
        form.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined,
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
        // Buscar el concepto "Transferencia Interna" para asignar el type_id correcto
        const transferConcept = concepts?.find((concept: any) => 
          concept.view_mode?.trim() === "transfer"
        )
        
        // Para transferencias, cargar datos en formulario de transferencia
        transferForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: transferConcept?.id || editingMovement.type_id || '', // Usar el ID del concepto "Transferencia Interna"
          currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id_from: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          wallet_id_to: '',
          amount: editingMovement.amount || 0
        })
        
        // Establecer selectedTypeId para transferencias también
        if (transferConcept?.id) {
          setSelectedTypeId(transferConcept.id)
        }
      } else if (isAportesMovement) {
        // Para aportes de terceros, cargar datos en formulario de aportes
        aportesForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          contact_id: editingMovement.contact_id || '',
          currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
        
        // Establecer selectedTypeId para aportes también
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
      } else if (isAportesPropriosMovement) {
        // Para aportes propios, cargar datos en formulario de aportes propios
        aportesPropriosForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          member_id: editingMovement.member_id || '',
          currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
        
        // Establecer selectedTypeId para aportes propios también
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
      } else if (isRetirosPropriosMovement) {
        // Para retiros propios, cargar datos en formulario de retiros propios
        retirosPropriosForm.reset({
          movement_date: editingMovement.movement_date ? new Date(editingMovement.movement_date) : new Date(),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          type_id: editingMovement.type_id || '',
          category_id: editingMovement.category_id || '',
          member_id: editingMovement.member_id || '',
          currency_id: matchingCurrency?.currency_id || editingMovement.currency_id || '',
          wallet_id: matchingWallet?.wallet_id || editingMovement.wallet_id || '',
          amount: editingMovement.amount || 0,
          exchange_rate: editingMovement.exchange_rate || undefined
        })
        
        // Establecer selectedTypeId para retiros propios también
        if (editingMovement.type_id) {
          setSelectedTypeId(editingMovement.type_id)
        }
      } else {
        // Formulario normal
        console.log('Loading form with categories:', {
          category_id: editingMovement.category_id,
          subcategory_id: editingMovement.subcategory_id,
          type_id: editingMovement.type_id
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
  }, [editingMovement, userData?.user?.id, form, setPanel, members, currencies, wallets, concepts, categories])

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
            exchange_rate: data.exchange_rate || null
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
            exchange_rate: data.exchange_rate || null
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
          project_id: userData.preferences?.last_project_id || null,
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
        category_id: data.category_id,
        contact_id: data.contact_id, // Este campo guardará cliente_id o socio_id
        exchange_rate: data.exchange_rate || null // Agregar cotización opcional
      }

      console.log('Movement data to be inserted:', movementData)

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
        project_id: userData.preferences?.last_project_id || null,
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
        title: 'Aporte Propio registrado',
        description: 'El aporte propio ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al registrar el aporte propio: ${error.message}`,
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
        project_id: userData.preferences?.last_project_id || null,
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
        title: 'Retiro Propio registrado',
        description: 'El retiro propio ha sido registrado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al registrar el retiro propio: ${error.message}`,
      })
    }
  })

  const onSubmitAportes = async (data: AportesForm) => {
    console.log('Saving aportes data:', {
      wallet_id: data.wallet_id,
      contact_id: data.contact_id,
      category_id: data.category_id,
      type_id: data.type_id,
      amount: data.amount,
      currency_id: data.currency_id
    })
    await createAportesMutation.mutateAsync(data)
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
      wallet_id: data.wallet_id,
      member_id: data.member_id,
      category_id: data.category_id,
      type_id: data.type_id,
      amount: data.amount,
      currency_id: data.currency_id
    })
    await createRetirosPropriosMutation.mutateAsync(data)
  }

  const handleClose = () => {
    setPanel('edit')
    onClose()
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
      {(isConversion || isEditingConversion) ? (
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
      ) : (isTransfer || isEditingTransfer) ? (
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
      ) : (isAportes || isEditingAportes) ? (
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del movimiento..."
                      rows={3}
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
                  <h3 className="text-sm font-medium text-foreground">Información del Aporte de Terceros</h3>
                  <p className="text-xs text-muted-foreground">Datos específicos del aporte de cliente</p>
                </div>
              </div>
            </div>

            {/* Selector dinámico (Cliente o Socio) basado en la categoría seleccionada */}
            <FormField
              control={aportesForm.control}
              name="contact_id"
              render={({ field }) => {
                // Buscar la categoría seleccionada para obtener el nombre
                const selectedCategory = categories?.find(c => c.id === selectedCategoryId)
                const categoryName = selectedCategory?.name || ''
                
                // Detectar si es "Aportes de Terceros" para mostrar Cliente
                const isClienteSelector = categoryName === 'Aportes de Terceros'
                
                // Preparar datos para UserSelector
                const usersData = isClienteSelector ? (
                  // Para clientes: usar project_clients que son los clientes activos del proyecto
                  projectClients?.map((projectClient) => ({
                    id: projectClient.contact.id,
                    first_name: projectClient.contact.first_name,
                    last_name: projectClient.contact.last_name,
                    full_name: projectClient.contact.full_name,
                    company_name: projectClient.contact.company_name,
                    avatar_url: projectClient.contact.avatar_url
                  })) || []
                ) : (
                  // Para socios: usar miembros directamente
                  members || []
                )
                
                return (
                  <FormItem>
                    <FormLabel>
                      {isClienteSelector ? 'Cliente *' : 'Socio *'}
                    </FormLabel>
                    <FormControl>
                      <UserSelector
                        users={usersData}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={isClienteSelector ? "Seleccionar cliente" : "Seleccionar socio"}
                        showCompany={isClienteSelector} // Mostrar empresa solo para clientes
                      />
                    </FormControl>
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

            {/* Fila: Cantidad | Cotización */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

              <FormField
                control={aportesForm.control}
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
      ) : (isAportesPropios || isEditingAportesPropios) ? (
        // FORMULARIO DE APORTES PROPIOS
        <Form {...aportesPropriosForm}>
          <form onSubmit={aportesPropriosForm.handleSubmit(onSubmitAportesPropios)} className="space-y-4">
            {/* Fila 1: Creador | Fecha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={aportesPropriosForm.control}
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
                control={aportesPropriosForm.control}
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
              control={aportesPropriosForm.control}
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
                      {concepts?.filter((concept: any) => !concept.parent_id).map((concept) => (
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
              control={aportesPropriosForm.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría..." />
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

            {/* Fila 4: Descripción (full width) */}
            <FormField
              control={aportesPropriosForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del movimiento..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Separador y título de sección de aportes propios */}
            <div className="col-span-2">
              <Separator className="mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Información del Aporte Propio</h3>
                  <p className="text-xs text-muted-foreground">Datos específicos del aporte de socio</p>
                </div>
              </div>
            </div>

            {/* Socio */}
            <FormField
              control={aportesPropriosForm.control}
              name="member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Socio *</FormLabel>
                  <FormControl>
                    <UserSelector
                      users={members || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar socio"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fila: Moneda | Billetera */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={aportesPropriosForm.control}
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
                control={aportesPropriosForm.control}
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

            {/* Fila: Cantidad | Cotización */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={aportesPropriosForm.control}
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

              <FormField
                control={aportesPropriosForm.control}
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
      ) : (isRetirosPropios || isEditingRetirosPropios) ? (
        // FORMULARIO DE RETIROS PROPIOS
        <Form {...retirosPropriosForm}>
          <form onSubmit={retirosPropriosForm.handleSubmit(onSubmitRetirosPropios)} className="space-y-4">
            {/* Fila 1: Creador | Fecha */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={retirosPropriosForm.control}
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
                control={retirosPropriosForm.control}
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
              control={retirosPropriosForm.control}
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
                      {concepts?.filter((concept: any) => !concept.parent_id).map((concept) => (
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
              control={retirosPropriosForm.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría..." />
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

            {/* Fila 4: Descripción (full width) */}
            <FormField
              control={retirosPropriosForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción del movimiento..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Separador y título de sección de retiros propios */}
            <div className="col-span-2">
              <Separator className="mb-4" />
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                  <DollarSign className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">Información del Retiro Propio</h3>
                  <p className="text-xs text-muted-foreground">Datos específicos del retiro de socio</p>
                </div>
              </div>
            </div>

            {/* Socio */}
            <FormField
              control={retirosPropriosForm.control}
              name="member_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Socio *</FormLabel>
                  <FormControl>
                    <UserSelector
                      users={members || []}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar socio"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fila: Moneda | Billetera */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={retirosPropriosForm.control}
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
                control={retirosPropriosForm.control}
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

            {/* Fila: Cantidad | Cotización */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FormField
                control={retirosPropriosForm.control}
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

              <FormField
                control={retirosPropriosForm.control}
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
                    {concepts?.filter((concept: any) => !concept.parent_id).map((concept) => (
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
          isAportesPropios ? "Registrar Aporte Propio" :
          isRetirosPropios ? "Registrar Retiro Propio" :
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
          } else if (isAportesPropios) {
            aportesPropriosForm.handleSubmit(onSubmitAportesPropios)()
          } else if (isRetirosPropios) {
            retirosPropriosForm.handleSubmit(onSubmitRetirosPropios)()
          } else {
            form.handleSubmit(onSubmit)()
          }
        }
      }}
      showLoadingSpinner={createMovementMutation.isPending || createConversionMutation.isPending || createTransferMutation.isPending || createAportesMutation.isPending || createAportesPropriosMutation.isPending || createRetirosPropriosMutation.isPending}
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