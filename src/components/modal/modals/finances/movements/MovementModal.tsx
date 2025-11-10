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

import DatePicker from '@/components/ui-custom/fields/DatePickerField'
import { CascadingSelect } from '@/components/ui-custom/fields/CascadingSelectField'
import ProjectSelectorField from '@/components/ui-custom/fields/ProjectSelectorField'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useProjectsLite } from '@/hooks/use-projects-lite'
import { useLocation } from 'wouter'
import { DefaultMovementFields } from './fields/DefaultFields'
import { ConversionFields } from './fields/ConversionFields'
import { TransferFields } from './fields/TransferFields'
import { Users, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CommitmentItem } from './fields/ClientsFields'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useMovementSubcontracts, useCreateMovementSubcontracts, useUpdateMovementSubcontracts } from '@/hooks/use-movement-subcontracts'
import { useMovementProjectClients, useCreateMovementProjectClients, useUpdateMovementProjectClients } from '@/hooks/use-movement-project-clients'
import { useMovementPartners, useCreateMovementPartners, useUpdateMovementPartners } from '@/hooks/use-movement-partners'
import { useMovementGeneralCosts, useCreateMovementGeneralCosts, useUpdateMovementGeneralCosts } from '@/hooks/use-movement-general-costs'
import { useMovementPersonnel } from '@/hooks/use-movement-personnel'

// Schema de movimiento básico - proyecto siempre requerido
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
  exchange_rate: z.number().optional(),
  project_id: z.string().nullable().refine((val) => val !== '', { message: 'Proyecto es requerido' })
})

// Schema para conversión - proyecto siempre requerido
const conversionSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  project_id: z.string().nullable().refine((val) => val !== '', { message: 'Proyecto es requerido' }),
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

// Schema para transferencia interna - proyecto siempre requerido
const transferSchema = z.object({
  movement_date: z.date(),
  created_by: z.string().min(1, 'Creador es requerido'),
  description: z.string().optional(),
  type_id: z.string().min(1, 'Tipo es requerido'),
  project_id: z.string().nullable().refine((val) => val !== '', { message: 'Proyecto es requerido' }),
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

// Function to transform organization concepts to CascadingSelect format
const transformConceptsToOptions = (concepts: any[]): any[] => {
  return concepts.map(concept => ({
    value: concept.id,
    label: concept.name,
    children: concept.children ? concept.children.map((child: any) => ({
      value: child.id,
      label: child.name,
      children: child.children ? child.children.map((grandchild: any) => ({
        value: grandchild.id,
        label: grandchild.name
      })) : undefined
    })) : undefined
  }))
}

interface MovementModalProps {
  modalData?: any
  onClose: () => void
  editingMovement?: any // Movement data when editing
  isEditing?: boolean
}

export function MovementModal({ modalData, onClose, editingMovement: propEditingMovement, isEditing: propIsEditing }: MovementModalProps) {
  // Extract editing and viewing data from modalData or props
  const editingMovement = propEditingMovement || modalData?.editingMovement
  const viewingMovement = modalData?.viewingMovement
  const movementData = editingMovement || viewingMovement
  const isEditing = propIsEditing || !!editingMovement

  // Hooks - Always get fresh data for modal to ensure latest organization preferences
  const { data: userData } = useCurrentUser(true) // Force fresh data
  const { data: currencies = [] } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets = [] } = useWallets(userData?.organization?.id)
  const { data: movementConcepts = [] } = useOrganizationMovementConcepts(userData?.organization?.id)
  const { data: members = [] } = useOrganizationMembers(userData?.organization?.id)
  const { data: projects = [] } = useProjectsLite(userData?.organization?.id)
  const [location] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Get exchange rate visibility configuration from organization preferences
  const showExchangeRate = userData?.organization_preferences?.use_currency_exchange || false
  
  // Filter movement concepts based on available currencies and wallets
  const filteredMovementConcepts = React.useMemo(() => {
    if (!movementConcepts || !currencies || !wallets) return []
    
    const hasManycurrencies = currencies.length > 1
    const hasManyWallets = wallets.length > 1
    
    const filtered = movementConcepts.filter(concept => {
      const viewMode = concept.view_mode?.trim()
      
      // Only show "Conversión" if there are multiple currencies
      if (viewMode?.includes('conversion')) {
        return hasManycurrencies
      }
      
      // Only show "Transferencia Interna" if there are multiple wallets  
      if (viewMode?.includes('transfer')) {
        return hasManyWallets
      }
      
      // Show all other concepts normally
      return true
    })
    
    return filtered
  }, [movementConcepts, currencies, wallets])
  
  
  // Selector de proyecto siempre visible
  const showProjectSelector = true

  // Mutaciones para subcontratos
  const createMovementSubcontractsMutation = useCreateMovementSubcontracts()
  const updateMovementSubcontractsMutation = useUpdateMovementSubcontracts()

  // Mutaciones para clientes de proyecto
  const createMovementProjectClientsMutation = useCreateMovementProjectClients()
  const updateMovementProjectClientsMutation = useUpdateMovementProjectClients()

  // Mutaciones para partners unificadas
  const createMovementPartnersMutation = useCreateMovementPartners()
  const updateMovementPartnersMutation = useUpdateMovementPartners()

  // Mutaciones para gastos generales
  const createMovementGeneralCostsMutation = useCreateMovementGeneralCosts()
  const updateMovementGeneralCostsMutation = useUpdateMovementGeneralCosts()

  // Lazy-loaded queries for associations - only enabled when needed
  const { data: existingSubcontracts, refetch: refetchSubcontracts } = useMovementSubcontracts(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  const { data: existingProjectClients, refetch: refetchProjectClients } = useMovementProjectClients(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  const { data: existingPartners, refetch: refetchPartners } = useMovementPartners(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  const { data: existingGeneralCosts, refetch: refetchGeneralCosts } = useMovementGeneralCosts(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  const { data: existingPersonnel, refetch: refetchPersonnel } = useMovementPersonnel(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  // States for hierarchical selection are now defined above with synchronous initialization
  
  // Infer movementType synchronously from editing data or default to 'normal'
  const inferMovementType = React.useMemo(() => {
    if (editingMovement?.view_mode) {
      const viewMode = editingMovement.view_mode.trim()
      if (viewMode.includes('conversion')) return 'conversion'
      if (viewMode.includes('transfer')) return 'transfer'
    }
    // Fallback: try to infer from type_id if movementConcepts is available
    if (editingMovement?.type_id && movementConcepts.length > 0) {
      const selectedConcept = movementConcepts.find((concept: any) => concept.id === editingMovement.type_id)
      const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
      if (viewMode === "conversion") return 'conversion'
      if (viewMode === "transfer") return 'transfer'
    }
    return 'normal'
  }, [editingMovement?.view_mode, editingMovement?.type_id, movementConcepts])
  
  const [movementType, setMovementType] = React.useState<'normal' | 'conversion' | 'transfer'>(inferMovementType)
  const [selectedPersonnel, setSelectedPersonnel] = React.useState<Array<{personnel_id: string, contact_name: string}>>([])
  const [selectedSubcontracts, setSelectedSubcontracts] = React.useState<Array<{subcontract_id: string, contact_name: string}>>([])
  const [selectedIndirects, setSelectedIndirects] = React.useState<Array<{indirect_id: string, indirect_name: string}>>([])
  const [selectedGeneralCosts, setSelectedGeneralCosts] = React.useState<Array<{general_cost_id: string}>>([])
  const [selectedClients, setSelectedClients] = React.useState<CommitmentItem[]>([])
  const [selectedPartnerWithdrawals, setSelectedPartnerWithdrawals] = React.useState<Array<{partner_id: string, partner_name: string}>>([])
  const [selectedPartnerContributions, setSelectedPartnerContributions] = React.useState<Array<{partner_id: string, partner_name: string}>>([])
  
  // Simplified flag for initial data loading
  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState(false)

  // Synchronous initialization of hierarchical selection states
  const [selectedTypeId, setSelectedTypeId] = React.useState(editingMovement?.type_id || '')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(() => {
    // Migration logic: if category_id is null but subcategory_id exists, use subcategory_id as category_id
    if (editingMovement?.category_id) {
      return editingMovement.category_id
    } else if (editingMovement?.subcategory_id) {
      return editingMovement.subcategory_id
    }
    return ''
  })
  const [selectedSubcategoryId, setSelectedSubcategoryId] = React.useState('') // Clear subcategory since they no longer exist
  
  // Process association data when loaded
  React.useEffect(() => {
    if (isEditing && existingPartners && existingPartners.length > 0) {
      const transformedPartners = existingPartners.map((partner: any) => {
        let partnerName = 'Socio sin nombre'
        if (partner.partners?.contacts) {
          const { contacts } = partner.partners
          if (contacts.company_name) {
            partnerName = contacts.company_name
          } else {
            const fullName = `${contacts.first_name || ''} ${contacts.last_name || ''}`.trim()
            if (fullName) {
              partnerName = fullName
            } else if (contacts.email) {
              partnerName = contacts.email
            }
          }
        }
        return { partner_id: partner.partner_id, partner_name: partnerName }
      })
      
      // Determine if contributions or withdrawals based on subcategory_id
      if (editingMovement?.subcategory_id === 'a0429ca8-f4b9-4b91-84a2-b6603452f7fb') {
        setSelectedPartnerContributions(transformedPartners)
      } else if (editingMovement?.subcategory_id === 'c04a82f8-6fd8-439d-81f7-325c63905a1b') {
        setSelectedPartnerWithdrawals(transformedPartners)
      }
    }
  }, [existingPartners, editingMovement?.subcategory_id])

  // Process subcontracts when loaded
  React.useEffect(() => {
    if (existingSubcontracts && existingSubcontracts.length > 0) {
      const transformedSubcontracts = existingSubcontracts.map((subcontract: any) => {
        let contactName = 'Sin nombre'
        if (subcontract.subcontracts?.contact) {
          const contact = subcontract.subcontracts.contact
          const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
          if (fullName) contactName = fullName
        }
        return { subcontract_id: subcontract.subcontract_id, contact_name: contactName }
      })
      setSelectedSubcontracts(transformedSubcontracts)
    }
  }, [existingSubcontracts])

  // Process indirects synchronously from movementData
  React.useEffect(() => {
    if (editingMovement?.indirect_id && editingMovement?.indirect) {
      setSelectedIndirects([{
        indirect_id: editingMovement.indirect_id,
        indirect_name: editingMovement.indirect
      }])
    }
  }, [editingMovement?.indirect_id, editingMovement?.indirect])

  // Process general costs when loaded
  React.useEffect(() => {
    if (existingGeneralCosts && existingGeneralCosts.length > 0) {
      const transformedGeneralCosts = existingGeneralCosts.map((generalCost: any) => ({
        general_cost_id: generalCost.general_cost_id
      }))
      setSelectedGeneralCosts(transformedGeneralCosts)
    }
  }, [existingGeneralCosts])

  // Process personnel when loaded
  React.useEffect(() => {
    if (existingPersonnel && existingPersonnel.length > 0) {
      const transformedPersonnel = existingPersonnel.map((personnel: any) => {
        let contactName = 'Sin nombre'
        if (personnel.project_personnel?.contact) {
          const contact = personnel.project_personnel.contact
          const fullName = contact.full_name || 
            `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
          if (fullName) contactName = fullName
        }
        return { personnel_id: personnel.personnel_id, contact_name: contactName }
      })
      setSelectedPersonnel(transformedPersonnel)
    }
  }, [existingPersonnel])

  // Process project clients when loaded
  React.useEffect(() => {
    if (existingProjectClients && existingProjectClients.length > 0) {
      const transformedClients = existingProjectClients.map((client: any) => {
        let clientName = 'Sin nombre'
        if (client.project_clients?.contact) {
          const contact = client.project_clients.contact
          const fullName = contact.full_name || 
            `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
          if (fullName) clientName = fullName
        }

        const installmentNumber = client.project_installments?.number
        const installmentDisplay = installmentNumber ? 
          `Cuota ${installmentNumber.toString().padStart(2, '0')}` : 
          'Sin cuota'

        return {
          project_client_id: client.project_client_id,
          unit: client.project_clients?.unit || 'N/A',
          client_name: clientName,
          project_installment_id: client.project_installment_id,
          installment_display: installmentDisplay
        }
      })
      setSelectedClients(transformedClients)
    }
  }, [existingProjectClients])

  // Extract default values with fallbacks to prevent blocking
  const defaultCurrency = userData?.organization?.preferences?.default_currency || currencies[0]?.currency?.id || ''
  const defaultWallet = userData?.organization?.preferences?.default_wallet || wallets[0]?.id || ''
  
  // Find current member with fallback
  const currentMember = React.useMemo(() => {
    return members.find(m => m.user_id === userData?.user?.id) || null
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

  // Helper function para manejar fechas correctamente evitando problemas de timezone
  const parseMovementDate = (dateString: string | undefined): Date => {
    if (!dateString) return new Date()
    
    // Si la fecha viene como YYYY-MM-DD, crear Date con componentes locales
    const dateParts = dateString.split('-')
    if (dateParts.length === 3) {
      const year = parseInt(dateParts[0])
      const month = parseInt(dateParts[1]) - 1 // Months are 0-indexed
      const day = parseInt(dateParts[2])
      return new Date(year, month, day)
    }
    
    // Fallback para otras formas de fecha
    return new Date(dateString)
  }

  // Synchronous form initialization - no waiting for async data
  const form = useForm<BasicMovementForm>({
    resolver: zodResolver(basicMovementSchema),
    defaultValues: {
      movement_date: editingMovement ? parseMovementDate(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentMember?.id || '',
      type_id: editingMovement?.type_id || '',
      category_id: editingMovement?.category_id || '',
      subcategory_id: editingMovement?.subcategory_id || '',
      description: editingMovement?.description || '',
      currency_id: editingMovement?.currency_id || defaultCurrency,
      wallet_id: editingMovement?.wallet_id || defaultWallet,
      amount: editingMovement?.amount || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined,
      project_id: editingMovement?.project_id || (userData?.preferences?.last_project_id || null)
    }
  })

  // Update form defaults when better data becomes available (non-blocking)
  React.useEffect(() => {
    // Skip if we're editing (editing movement already has all values)
    if (isEditing && editingMovement?.created_by) {
      setHasLoadedInitialData(true)
      return
    }
    
    // Wait for essential data to be available
    if (!userData?.user?.id || !currentMember?.id || currencies.length === 0 || wallets.length === 0) return
    
    const updatedDefaults = {
      created_by: currentMember.id,
      currency_id: defaultCurrency || currencies[0]?.currency?.id,
      wallet_id: defaultWallet || wallets[0]?.id
    }
    
    // Only update if values are empty/need updating
    const currentValues = form.getValues()
    const needsUpdate = (
      !currentValues.created_by ||
      !currentValues.currency_id ||
      !currentValues.wallet_id
    )
    
    if (needsUpdate) {
      // Reset with updated values
      const resetOptions = { keepDirtyValues: false, keepTouched: false, keepIsValidating: false }
      form.reset({ ...currentValues, ...updatedDefaults }, resetOptions)
      setHasLoadedInitialData(true)
    }
  }, [userData?.user?.id, currentMember?.id, currencies.length, wallets.length, defaultCurrency, defaultWallet, isEditing, editingMovement?.created_by, form])

  // Synchronous conversion form initialization
  const conversionForm = useForm<ConversionForm>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      movement_date: editingMovement ? parseMovementDate(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentMember?.id || '',
      description: editingMovement?.description || '',
      type_id: editingMovement?.type_id || '',
      project_id: editingMovement?.project_id || (userData?.preferences?.last_project_id || null),
      currency_id_from: editingMovement?.currency_id_from || defaultCurrency,
      wallet_id_from: editingMovement?.wallet_id_from || defaultWallet,
      amount_from: editingMovement?.amount_from || 0,
      currency_id_to: editingMovement?.currency_id_to || '',
      wallet_id_to: editingMovement?.wallet_id_to || '',
      amount_to: editingMovement?.amount_to || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined
    }
  })

  // Update conversion form defaults when data becomes available
  React.useEffect(() => {
    if (isEditing && editingMovement?.created_by) return
    if (!currentMember?.id || currencies.length === 0 || wallets.length === 0) return
    
    const currentValues = conversionForm.getValues()
    if (!currentValues.created_by || !currentValues.currency_id_from || !currentValues.wallet_id_from) {
      const updatedDefaults = {
        created_by: currentMember.id,
        currency_id_from: defaultCurrency || currencies[0]?.currency?.id,
        wallet_id_from: defaultWallet || wallets[0]?.id
      }
      conversionForm.reset({ ...currentValues, ...updatedDefaults }, { keepDirtyValues: false })
    }
  }, [currentMember?.id, currencies.length, wallets.length, defaultCurrency, defaultWallet, isEditing, editingMovement?.created_by, conversionForm])

  // Synchronous transfer form initialization
  const transferForm = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      movement_date: editingMovement ? parseMovementDate(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentMember?.id || '',
      description: editingMovement?.description || '',
      type_id: editingMovement?.type_id || '',
      project_id: editingMovement?.project_id || (userData?.preferences?.last_project_id || null),
      currency_id: editingMovement?.currency_id || defaultCurrency,
      wallet_id_from: editingMovement?.wallet_id_from || defaultWallet,
      wallet_id_to: editingMovement?.wallet_id_to || '',
      amount: editingMovement?.amount || 0
    }
  })

  // Update transfer form defaults when data becomes available
  React.useEffect(() => {
    if (isEditing && editingMovement?.created_by) return
    if (!currentMember?.id || currencies.length === 0 || wallets.length === 0) return
    
    const currentValues = transferForm.getValues()
    if (!currentValues.created_by || !currentValues.currency_id || !currentValues.wallet_id_from) {
      const updatedDefaults = {
        created_by: currentMember.id,
        currency_id: defaultCurrency || currencies[0]?.currency?.id,
        wallet_id_from: defaultWallet || wallets[0]?.id
      }
      transferForm.reset({ ...currentValues, ...updatedDefaults }, { keepDirtyValues: false })
    }
  }, [currentMember?.id, currencies.length, wallets.length, defaultCurrency, defaultWallet, isEditing, editingMovement?.created_by, transferForm])

  // Handle type change para detectar conversión (como en el modal original) - MOVED AFTER FORMS
  const handleTypeChange = React.useCallback((newTypeId: string) => {
    if (!newTypeId || !movementConcepts) return
    
    // EARLY RETURN: Idempotent check - no action needed if values are already correct
    if (newTypeId === selectedTypeId) {
      const selectedConcept = movementConcepts.find((concept: any) => concept.id === newTypeId)
      const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
      const expectedMovementType = viewMode.includes("conversion") ? 'conversion' : 
                                  viewMode.includes("transfer") ? 'transfer' : 'normal'
      
      if (expectedMovementType === movementType) {
        // Already in correct state - no action needed
        return
      }
    }
    
    // Detectar tipo de movimiento por view_mode 
    const selectedConcept = movementConcepts.find((concept: any) => concept.id === newTypeId)
    const viewMode = (selectedConcept?.view_mode ?? "normal").trim()
    
    // Update selectedTypeId only if different
    if (newTypeId !== selectedTypeId) {
      setSelectedTypeId(newTypeId)
    }
    
    // Obtener valores actuales de campos comunes del formulario activo
    const getCurrentCommonValues = () => {
      if (movementType === 'conversion') {
        return {
          movement_date: conversionForm.getValues('movement_date'),
          description: conversionForm.getValues('description'),
          created_by: conversionForm.getValues('created_by')
        }
      } else if (movementType === 'transfer') {
        return {
          movement_date: transferForm.getValues('movement_date'),
          description: transferForm.getValues('description'),
          created_by: transferForm.getValues('created_by')
        }
      } else {
        return {
          movement_date: form.getValues('movement_date'),
          description: form.getValues('description'),
          created_by: form.getValues('created_by')
        }
      }
    }
    
    const commonValues = getCurrentCommonValues()
    const formOptions = {}
    
    // Sincronizar campos comunes en todos los formularios ANTES de cambiar el tipo
    form.setValue('type_id', newTypeId, formOptions)
    form.setValue('movement_date', commonValues.movement_date, formOptions)
    form.setValue('description', commonValues.description, formOptions)
    form.setValue('created_by', commonValues.created_by, formOptions)
    
    conversionForm.setValue('type_id', newTypeId, formOptions)
    conversionForm.setValue('movement_date', commonValues.movement_date, formOptions)
    conversionForm.setValue('description', commonValues.description, formOptions)
    conversionForm.setValue('created_by', commonValues.created_by, formOptions)
    conversionForm.setValue('project_id', form.getValues('project_id'), formOptions)
    
    transferForm.setValue('type_id', newTypeId, formOptions)
    transferForm.setValue('movement_date', commonValues.movement_date, formOptions)
    transferForm.setValue('description', commonValues.description, formOptions)
    transferForm.setValue('created_by', commonValues.created_by, formOptions)
    
    // Cambiar tipo de movimiento DESPUÉS de sincronizar - con comparación más robusta
    const newMovementType = viewMode.includes("conversion") ? 'conversion' : 
                           viewMode.includes("transfer") ? 'transfer' : 'normal'
    
    if (newMovementType !== movementType) {
      setMovementType(newMovementType)
    }
    
    // Reset categorías solo si necesario
    const currentCategoryId = selectedCategoryId
    const currentSubcategoryId = selectedSubcategoryId
    
    if (currentCategoryId !== '' || currentSubcategoryId !== '') {
      setSelectedCategoryId('')
      setSelectedSubcategoryId('')
      form.setValue('category_id', '', formOptions)
      form.setValue('subcategory_id', '', formOptions)
    }
  }, [movementConcepts, form, conversionForm, transferForm, movementType, selectedTypeId, selectedCategoryId, selectedSubcategoryId])

  // Effect adicional para sincronización cuando cambia movementType (solo durante carga inicial)
  React.useEffect(() => {
    if (!movementType || hasLoadedInitialData) return
    
    // Forzar actualización de valores en el formulario activo
    const commonValues = {
      movement_date: form.getValues('movement_date'),
      description: form.getValues('description'),
      created_by: form.getValues('created_by'),
      type_id: form.getValues('type_id')
    }
    
    const formOptions = {}
    
    if (movementType === 'conversion') {
      conversionForm.setValue('movement_date', commonValues.movement_date, formOptions)
      conversionForm.setValue('description', commonValues.description, formOptions)
      conversionForm.setValue('created_by', commonValues.created_by, formOptions)
      conversionForm.setValue('type_id', selectedTypeId || commonValues.type_id, formOptions)
      conversionForm.setValue('project_id', form.getValues('project_id'), formOptions)

    } else if (movementType === 'transfer') {
      transferForm.setValue('movement_date', commonValues.movement_date, formOptions)
      transferForm.setValue('description', commonValues.description, formOptions)
      transferForm.setValue('created_by', commonValues.created_by, formOptions)
      transferForm.setValue('type_id', commonValues.type_id, formOptions)

    }
    
    // Mark as complete after first successful synchronization
    setHasLoadedInitialData(true)
  }, [movementType, form, conversionForm, transferForm, hasLoadedInitialData, selectedTypeId])

  // Función para cargar datos específicos de conversión
  const loadConversionData = async (movement: any) => {

    
    try {
      // Obtener TODOS los movimientos del grupo de conversión y ordenar por amount descendente
      const { data: allGroupMovements, error } = await supabase
        .from('movements')
        .select('*')
        .eq('conversion_group_id', movement.conversion_group_id)
        .order('amount', { ascending: false })

      if (error || !allGroupMovements || allGroupMovements.length !== 2) {
        console.error('Error al buscar grupo de conversión:', error)
        return
      }



      // Buscar tipos de egreso e ingreso en los conceptos de movimiento
      const egressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('egreso')
      )
      const ingressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('ingreso')
      )

      // Identificar movimientos por TIPO, no por amount
      const originMovement = allGroupMovements.find(m => m.type_id === egressType?.id)
      const destinationMovement = allGroupMovements.find(m => m.type_id === ingressType?.id)
      
      if (!originMovement || !destinationMovement) {
        console.error('No se pudieron identificar movimientos de origen y destino por tipo')
        return
      }
      


      // Llenar formulario de conversión
      conversionForm.setValue('movement_date', new Date(movement.movement_date))
      conversionForm.setValue('description', movement.description)
      conversionForm.setValue('created_by', movement.created_by)
      conversionForm.setValue('type_id', selectedTypeId)
      conversionForm.setValue('project_id', movement.project_id)
      
      // Datos de origen (usando los nombres correctos del formulario)
      conversionForm.setValue('currency_id_from', originMovement.currency_id)
      conversionForm.setValue('wallet_id_from', originMovement.wallet_id)
      conversionForm.setValue('amount_from', originMovement.amount) // Ya no necesito Math.abs
      
      // Datos de destino (usando los nombres correctos del formulario)
      conversionForm.setValue('currency_id_to', destinationMovement.currency_id)
      conversionForm.setValue('wallet_id_to', destinationMovement.wallet_id)
      conversionForm.setValue('amount_to', destinationMovement.amount) // Ya no necesito Math.abs
      

      
      // Cotización
      if (movement.exchange_rate) {
        conversionForm.setValue('exchange_rate', movement.exchange_rate)
      }


      
    } catch (error) {
      console.error('Error al cargar datos de conversión:', error)
    }
  }

  // Función para cargar datos específicos de transferencia
  const loadTransferData = async (movement: any) => {

    
    try {
      // Buscar el movimiento complementario de la transferencia
      const { data: transferMovements, error } = await supabase
        .from('movements')
        .select('*')
        .eq('transfer_group_id', movement.transfer_group_id)
        .neq('id', movement.id)
        .single()

      if (error) {
        console.error('Error al buscar movimiento complementario:', error)
        return
      }



      // Determinar si el movimiento actual es origen o destino
      const isOrigin = movement.amount < 0 // Los egresos son negativos (origen)
      const originMovement = isOrigin ? movement : transferMovements
      const destinationMovement = isOrigin ? transferMovements : movement

      // Llenar formulario de transferencia
      transferForm.setValue('movement_date', new Date(movement.movement_date))
      transferForm.setValue('description', movement.description)
      transferForm.setValue('created_by', movement.created_by)
      transferForm.setValue('type_id', selectedTypeId)
      
      // Datos de origen y destino para transferencia
      transferForm.setValue('currency_id', originMovement.currency_id)
      transferForm.setValue('wallet_id_from', originMovement.wallet_id)
      transferForm.setValue('wallet_id_to', destinationMovement.wallet_id)
      transferForm.setValue('amount', Math.abs(originMovement.amount))


      
    } catch (error) {
      console.error('Error al cargar datos de transferencia:', error)
    }
  }

  // ALL EFFECTS THAT DEPEND ON handleTypeChange ARE MOVED TO AFTER ITS DEFINITION

  // Effect para sincronizar estados cuando se está editando (una sola vez)
  React.useEffect(() => {
    if (!isEditing || !editingMovement || !movementConcepts || hasLoadedInitialData) return

    // Llenar formulario principal con los datos básicos del movimiento
    form.setValue('movement_date', parseMovementDate(editingMovement.movement_date))
    form.setValue('description', editingMovement.description || '')
    form.setValue('created_by', editingMovement.created_by)
    form.setValue('type_id', editingMovement.type_id)
    form.setValue('category_id', editingMovement.category_id || '')
    form.setValue('subcategory_id', editingMovement.subcategory_id || '')
    form.setValue('currency_id', editingMovement.currency_id)
    form.setValue('wallet_id', editingMovement.wallet_id)
    form.setValue('amount', editingMovement.amount)

    // DETECTAR TIPO DE MOVIMIENTO CORRECTO AL EDITAR
    if (editingMovement.is_conversion || editingMovement.conversion_group_id) {
      // Es una conversión - buscar el tipo "Conversión"
      const conversionConcept = movementConcepts.find((concept: any) => 
        concept.view_mode?.trim() === "conversion"
      )
      if (conversionConcept) {
        setSelectedTypeId(conversionConcept.id)
        handleTypeChange(conversionConcept.id)
        
        // Cargar datos específicos de conversión después de cambiar el tipo
        setTimeout(() => {
          loadConversionData(editingMovement)
        }, 100)
      }
    } else if (editingMovement.transfer_group_id) {
      // Es una transferencia - buscar el tipo "Transferencia"
      const transferConcept = movementConcepts.find((concept: any) => 
        concept.view_mode?.trim() === "transfer"
      )
      if (transferConcept) {
        setSelectedTypeId(transferConcept.id)
        handleTypeChange(transferConcept.id)
        
        // Cargar datos específicos de transferencia después de cambiar el tipo
        setTimeout(() => {
          loadTransferData(editingMovement)
        }, 100)
      }
    } else {
      // Movimiento normal - usar type_id original
      setSelectedTypeId(editingMovement.type_id)
      handleTypeChange(editingMovement.type_id)
    }
    
    // Sincronizar category_id después de un breve delay para asegurar que las categorías se carguen
    if (editingMovement.category_id) {
      setTimeout(() => {
        setSelectedCategoryId(editingMovement.category_id)
        form.setValue('category_id', editingMovement.category_id)
      }, 100)
    }
    
    // Sincronizar subcategory_id después de un breve delay para asegurar que las subcategorías se carguen
    if (editingMovement.subcategory_id) {
      setTimeout(() => {
        setSelectedSubcategoryId(editingMovement.subcategory_id)
        form.setValue('subcategory_id', editingMovement.subcategory_id)
      }, 200)
    }

    // Cargar asignaciones existentes
    if (editingMovement.id) {
      loadMovementPersonnel(editingMovement.id)
      loadMovementSubcontracts(editingMovement.id)
      loadMovementProjectClients(editingMovement.id)
      loadMovementIndirects(editingMovement.id)
    }

    // Finalizar carga inicial
    setHasLoadedInitialData(true)

  }, [isEditing, editingMovement, movementConcepts, handleTypeChange, form, loadConversionData, loadTransferData, hasLoadedInitialData])

  // Función para cargar personal asignado del movimiento
  const loadMovementPersonnel = React.useCallback(async (movementId: string) => {
    try {
      const { data: personnelAssignments, error } = await supabase
        .from('movement_personnel')
        .select(`
          personnel_id,
          personnel:personnel_id (
            id,
            contact:contact_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) throw error

      if (personnelAssignments && personnelAssignments.length > 0) {
        const formattedPersonnel = personnelAssignments.map((assignment: any) => {
          const contact = assignment.personnel?.contact
          const contactName = contact 
            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin nombre'
            : 'Sin nombre'

          return {
            personnel_id: assignment.personnel_id,
            contact_name: contactName
          }
        })

        setSelectedPersonnel(formattedPersonnel)
      }
    } catch (error) {
      console.error('Error loading personnel assignments:', error)
    }
  }, [])

  // Función para cargar subcontratos asignados del movimiento
  const loadMovementSubcontracts = React.useCallback(async (movementId: string) => {
    try {
      const { data: subcontractAssignments, error } = await supabase
        .from('movement_subcontracts')
        .select(`
          subcontract_id,
          subcontracts:subcontract_id (
            id,
            contact:contact_id (
              first_name,
              last_name
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) throw error

      if (subcontractAssignments && subcontractAssignments.length > 0) {
        const formattedSubcontracts = subcontractAssignments.map((assignment: any) => {
          const contact = assignment.subcontracts?.contact
          const contactName = contact 
            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Sin nombre'
            : 'Sin nombre'

          return {
            subcontract_id: assignment.subcontract_id,
            contact_name: contactName
          }
        })

        setSelectedSubcontracts(formattedSubcontracts)
      }
    } catch (error) {
      console.error('Error loading subcontract assignments:', error)
    }
  }, [])

  // Función para cargar clientes del proyecto asignados al movimiento
  const loadMovementProjectClients = React.useCallback(async (movementId: string) => {
    try {
      const { data: clientAssignments, error } = await supabase
        .from('movement_clients')
        .select(`
          project_client_id,
          project_installment_id,
          project_clients:project_client_id (
            id,
            unit,
            contact:client_id (
              id,
              first_name,
              last_name,
              full_name
            )
          ),
          project_installments:project_installment_id (
            id,
            number
          )
        `)
        .eq('movement_id', movementId)

      if (error) throw error

      if (clientAssignments && clientAssignments.length > 0) {
        const formattedClients = clientAssignments.map((assignment: any) => {
          const projectClient = assignment.project_clients
          const contact = projectClient?.contact
          const clientName = contact?.full_name || 
            `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 'Sin nombre'

          const installmentNumber = assignment.project_installments?.number
          const installmentDisplay = installmentNumber ? 
            `Cuota ${installmentNumber.toString().padStart(2, '0')}` : 
            'Sin cuota'

          return {
            project_client_id: assignment.project_client_id,
            unit: projectClient?.unit || 'N/A',
            client_name: clientName,
            project_installment_id: assignment.project_installment_id,
            installment_display: installmentDisplay
          }
        })



        setSelectedClients(formattedClients)
      }
    } catch (error) {
      console.error('Error loading project client assignments:', error)
    }
  }, [])

  // Función para cargar costos indirectos asignados al movimiento
  const loadMovementIndirects = React.useCallback(async (movementId: string) => {
    try {
      const { data: indirectAssignments, error } = await supabase
        .from('movement_indirects')
        .select(`
          indirect_id,
          indirect_costs:indirect_id (
            id,
            name
          )
        `)
        .eq('movement_id', movementId)

      if (error) throw error

      if (indirectAssignments && indirectAssignments.length > 0) {
        const formattedIndirects = indirectAssignments.map((assignment: any) => {
          const indirectName = assignment.indirect_costs?.name || 'Sin nombre'

          return {
            indirect_id: assignment.indirect_id,
            indirect_name: indirectName
          }
        })

        setSelectedIndirects(formattedIndirects)
      }
    } catch (error) {
      console.error('Error loading indirect cost assignments:', error)
    }
  }, [])

  // Mutation para crear/editar el movimiento normal
  const createMovementMutation = useMutation({
    mutationFn: async (data: BasicMovementForm) => {


      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Preparar datos del movimiento según la estructura de la tabla
      const movementData = {
        organization_id: userData.organization.id,
        project_id: data.project_id || null,
        movement_date: data.movement_date.getFullYear() + '-' + 
          String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(data.movement_date.getDate()).padStart(2, '0'),
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

      let result;

      if (isEditing && editingMovement?.id) {
        // Actualizar movimiento existente
        const { data: updateResult, error } = await supabase
          .from('movements')
          .update(movementData)
          .eq('id', editingMovement.id)
          .select()
          .single()

        if (error) throw error
        result = updateResult

        // Actualizar personal asignado - eliminar existente y crear nuevo
        const { error: deletePersonnelError } = await supabase
          .from('movement_personnel')
          .delete()
          .eq('movement_id', editingMovement.id)

        if (deletePersonnelError) throw deletePersonnelError

        // Actualizar subcontratos asignados - eliminar existentes y crear nuevos
        const { error: deleteSubcontractsError } = await supabase
          .from('movement_subcontracts')
          .delete()
          .eq('movement_id', editingMovement.id)

        if (deleteSubcontractsError) throw deleteSubcontractsError

        // Actualizar clientes de proyecto asignados - eliminar existentes y crear nuevos
        const { error: deleteProjectClientsError } = await supabase
          .from('movement_clients')
          .delete()
          .eq('movement_id', editingMovement.id)

        if (deleteProjectClientsError) throw deleteProjectClientsError

        // Actualizar costos indirectos asignados - eliminar existentes y crear nuevos
        const { error: deleteIndirectsError } = await supabase
          .from('movement_indirects')
          .delete()
          .eq('movement_id', editingMovement.id)

        if (deleteIndirectsError) throw deleteIndirectsError

        // Actualizar gastos generales asignados - eliminar existentes y crear nuevos
        const { error: deleteGeneralCostsError } = await supabase
          .from('movement_general_costs')
          .delete()
          .eq('movement_id', editingMovement.id)

        if (deleteGeneralCostsError) throw deleteGeneralCostsError

        // Actualizar partners (retiros y aportes) - usar hook unificado
        const allPartners = [
          ...(selectedPartnerWithdrawals || []),
          ...(selectedPartnerContributions || [])
        ]
        
        if (allPartners.length > 0) {
          await updateMovementPartnersMutation.mutateAsync({
            movementId: editingMovement.id,
            partners: allPartners
          })
        } else {
          // Si no hay partners, eliminar los existentes
          const { error: deletePartnersError } = await supabase
            .from('movement_partners')
            .delete()
            .eq('movement_id', editingMovement.id)

          if (deletePartnersError) throw deletePartnersError
        }
      } else {
        // Crear nuevo movimiento
        const { data: insertResult, error } = await supabase
          .from('movements')
          .insert(movementData)
          .select()
          .single()

        if (error) throw error
        result = insertResult
      }

      // Si hay personal seleccionado, guardar las asignaciones en movement_personnel
      if (selectedPersonnel && selectedPersonnel.length > 0) {
        // Primero eliminar registros existentes si es edición
        if (isEditing && editingMovement?.id) {
          const { error: deleteError } = await supabase
            .from('movement_personnel')
            .delete()
            .eq('movement_id', editingMovement.id)

          if (deleteError) throw deleteError
        }
        
        const personnelData = selectedPersonnel.map(person => ({
          movement_id: result.id,
          personnel_id: person.personnel_id
        }))

        const { error: personnelError } = await supabase
          .from('movement_personnel')
          .insert(personnelData)

        if (personnelError) throw personnelError
      }

      // Si hay subcontratos seleccionados, usar hook unificado
      if (selectedSubcontracts && selectedSubcontracts.length > 0) {
        if (isEditing) {
          // Modo edición: usar updateMovementSubcontractsMutation
          await updateMovementSubcontractsMutation.mutateAsync({
            movementId: result.id,
            subcontracts: selectedSubcontracts
          })
        } else {
          // Modo creación: usar createMovementSubcontractsMutation
          await createMovementSubcontractsMutation.mutateAsync({
            movementId: result.id,
            subcontracts: selectedSubcontracts
          })
        }
      }

      // Si hay partners seleccionados (retiros y aportes), usar hook unificado
      const allPartners = [
        ...(selectedPartnerWithdrawals || []),
        ...(selectedPartnerContributions || [])
      ]
      
      if (allPartners.length > 0) {
        if (isEditing) {
          // Modo edición: usar updateMovementPartnersMutation
          await updateMovementPartnersMutation.mutateAsync({
            movementId: result.id,
            partners: allPartners
          })
        } else {
          // Modo creación: usar createMovementPartnersMutation
          await createMovementPartnersMutation.mutateAsync({
            movementId: result.id,
            partners: allPartners
          })
        }
      }

      // Si hay clientes de proyecto seleccionados, guardar las asignaciones en movement_clients
      if (selectedClients && selectedClients.length > 0) {
        // Primero eliminar registros existentes si es edición
        if (editingMovement?.id) {
          const { error: deleteError } = await supabase
            .from('movement_clients')
            .delete()
            .eq('movement_id', editingMovement.id)

          if (deleteError) throw deleteError
        }
        
        const projectClientsData = selectedClients.map(client => ({
          movement_id: result.id,
          project_client_id: client.project_client_id,
          project_installment_id: client.project_installment_id || null
        }))

        const { error: projectClientsError } = await supabase
          .from('movement_clients')
          .insert(projectClientsData)

        if (projectClientsError) throw projectClientsError
      }

      // Si hay costos indirectos seleccionados, guardar las asignaciones en movement_indirects
      if (selectedIndirects && selectedIndirects.length > 0) {
        // Primero eliminar registros existentes si es edición
        if (editingMovement?.id) {
          const { error: deleteError } = await supabase
            .from('movement_indirects')
            .delete()
            .eq('movement_id', editingMovement.id)

          if (deleteError) throw deleteError
        }
        
        const indirectsData = selectedIndirects.map(indirect => ({
          movement_id: result.id,
          indirect_id: indirect.indirect_id
        }))

        const { error: indirectsError } = await supabase
          .from('movement_indirects')
          .insert(indirectsData)

        if (indirectsError) throw indirectsError
      }

      // Si hay gastos generales seleccionados, guardar las asignaciones en movement_general_costs
      if (selectedGeneralCosts && selectedGeneralCosts.length > 0) {
        // Primero eliminar registros existentes si es edición
        if (editingMovement?.id) {
          const { error: deleteError } = await supabase
            .from('movement_general_costs')
            .delete()
            .eq('movement_id', editingMovement.id)

          if (deleteError) throw deleteError
        }
        
        const generalCostsData = selectedGeneralCosts.map(generalCost => ({
          movement_id: result.id,
          general_cost_id: generalCost.general_cost_id
        }))

        const { error: generalCostsError } = await supabase
          .from('movement_general_costs')
          .insert(generalCostsData)

        if (generalCostsError) throw generalCostsError
      }

      return result
    },
    onSuccess: async (result) => {
      // Si estamos creando un nuevo movimiento (no editando), marcar checklist
      if (!isEditing) {
        try {
          const { error: checklistError } = await supabase.rpc('tick_home_checklist', {
            p_key: 'create_movement',
            p_value: true
          });
          
          if (checklistError) {
            console.error('Error updating home checklist:', checklistError);
          }
        } catch (error) {
          console.error('Error calling tick_home_checklist:', error);
        }
      }

      // Invalidar todas las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movements-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      
      // IMPORTANTE: Invalidar la nueva vista de pagos que usa InstallmentHeatmapChart
      queryClient.invalidateQueries({ queryKey: ['movement-payments-view'] })
      
      // Invalidar análisis de clientes
      queryClient.invalidateQueries({ queryKey: ['client-analysis'] })
      queryClient.invalidateQueries({ queryKey: ['client-payment-details'] })
      queryClient.invalidateQueries({ queryKey: ['client-obligations'] })
      
      // Invalidar específicamente los clientes del movimiento
      if (result?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['movement-project-clients', result.id] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['movement-partners', result.id] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['all-movement-partners'] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['movement-general-costs', result.id] 
        })
      }
      
      // Invalidar current-user para refrescar el checklist
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      
      // Esperar un momento para que se actualicen los datos
      await new Promise(resolve => setTimeout(resolve, 300))
      
      toast({
        title: isEditing ? 'Movimiento actualizado' : 'Movimiento creado',
        description: isEditing ? 'El movimiento ha sido actualizado correctamente' : 'El movimiento ha sido creado correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${isEditing ? 'actualizar' : 'crear'} el movimiento: ${error.message}`,
      })
    }
  })

  // Mutation para crear conversión (como en el modal original)
  const createConversionMutation = useMutation({
    mutationFn: async (data: ConversionForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Si estamos editando, usar el conversion_group_id existente
      const conversionGroupId = isEditing && editingMovement?.conversion_group_id 
        ? editingMovement.conversion_group_id 
        : crypto.randomUUID()
      


      // Buscar tipos de egreso e ingreso
      const egressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('egreso')
      )
      const ingressType = movementConcepts?.find((concept: any) => 
        concept.name?.toLowerCase().includes('ingreso')
      )

      if (isEditing && editingMovement?.conversion_group_id) {

        
        // Buscar ambos movimientos de la conversión
        const { data: conversionMovements, error: fetchError } = await supabase
          .from('movements')
          .select('*')
          .eq('conversion_group_id', editingMovement.conversion_group_id)
          .order('created_at')

        if (fetchError) throw fetchError

        if (!conversionMovements || conversionMovements.length !== 2) {
          throw new Error('Error: no se encontraron ambos movimientos de la conversión')
        }

        // Buscar tipos de egreso e ingreso
        const egressType = movementConcepts?.find((concept: any) => 
          concept.name?.toLowerCase().includes('egreso')
        )
        const ingressType = movementConcepts?.find((concept: any) => 
          concept.name?.toLowerCase().includes('ingreso')
        )

        // Identificar cuál es origen y destino POR TIPO
        const originMovement = conversionMovements.find(m => m.type_id === egressType?.id)
        const destMovement = conversionMovements.find(m => m.type_id === ingressType?.id)

        if (!originMovement || !destMovement) {
          throw new Error('Error: no se pudieron identificar los movimientos de origen y destino por tipo')
        }



        // Actualizar movimiento de origen (egreso)
        const { error: updateOriginError } = await supabase
          .from('movements')
          .update({
            movement_date: data.movement_date.getFullYear() + '-' + 
              String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
              String(data.movement_date.getDate()).padStart(2, '0'),
            description: data.description || 'Conversión - Salida',
            amount: data.amount_from,
            currency_id: data.currency_id_from,
            wallet_id: data.wallet_id_from,
            exchange_rate: data.exchange_rate || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', originMovement.id)

        if (updateOriginError) throw updateOriginError

        // Actualizar movimiento de destino (ingreso)
        const { error: updateDestError } = await supabase
          .from('movements')
          .update({
            movement_date: data.movement_date.getFullYear() + '-' + 
              String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
              String(data.movement_date.getDate()).padStart(2, '0'),
            description: data.description ? data.description.replace('Salida', 'Entrada') : 'Conversión - Entrada',
            amount: data.amount_to,
            currency_id: data.currency_id_to,
            wallet_id: data.wallet_id_to,
            exchange_rate: data.exchange_rate || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', destMovement.id)

        if (updateDestError) throw updateDestError


        return { id: editingMovement.id, updated: true }

      } else {

        
        // Crear movimiento de egreso
        const egressMovementData = {
          organization_id: userData.organization.id,
          project_id: data.project_id || null,
          movement_date: data.movement_date.getFullYear() + '-' + 
            String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(data.movement_date.getDate()).padStart(2, '0'),
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
          project_id: data.project_id || null,
          movement_date: data.movement_date.getFullYear() + '-' + 
            String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(data.movement_date.getDate()).padStart(2, '0'),
          created_by: data.created_by,
          description: data.description ? data.description.replace('Salida', 'Entrada') : 'Conversión - Entrada',
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

        // Si hay personal seleccionado, guardar las asignaciones en movement_personnel para el movimiento de egreso
        if (selectedPersonnel && selectedPersonnel.length > 0 && results) {
          const egressPersonnelData = selectedPersonnel.map(person => ({
            movement_id: results[0].id, // Movimiento de egreso
            personnel_id: person.personnel_id
          }))

          const { error: personnelError } = await supabase
            .from('movement_personnel')
            .insert(egressPersonnelData)

          if (personnelError) throw personnelError
        }


        return results
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movements-view'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-currency-balances'] })
      queryClient.invalidateQueries({ queryKey: ['wallet-balances'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      toast({
        title: isEditing ? 'Conversión actualizada' : 'Conversión creada',
        description: isEditing ? 'La conversión ha sido actualizada correctamente' : 'La conversión ha sido creada correctamente',
      })
      onClose()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Error al ${isEditing ? 'actualizar' : 'crear'} la conversión: ${error.message}`,
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
        project_id: data.project_id || null,
        movement_date: data.movement_date.getFullYear() + '-' + 
          String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(data.movement_date.getDate()).padStart(2, '0'),
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
        project_id: data.project_id || null,
        movement_date: data.movement_date.getFullYear() + '-' + 
          String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(data.movement_date.getDate()).padStart(2, '0'),
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

      // Si hay personal seleccionado, guardar las asignaciones en movement_personnel para el movimiento de egreso
      if (selectedPersonnel && selectedPersonnel.length > 0 && results) {
        const egressPersonnelData = selectedPersonnel.map(person => ({
          movement_id: results[0].id, // Movimiento de egreso
          personnel_id: person.personnel_id
        }))

        const { error: personnelError } = await supabase
          .from('movement_personnel')
          .insert(egressPersonnelData)

        if (personnelError) throw personnelError
      }

      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['movements-view'] })
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

  // Effect para manejar ENTER key para submit
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo procesar ENTER
      if (
        event.key === 'Enter' && 
        event.ctrlKey === false && 
        event.altKey === false
      ) {
        // Evitar el comportamiento por defecto
        event.preventDefault()
        event.stopPropagation()

        // Hacer submit según el tipo de movimiento
        if (movementType === 'conversion') {
          conversionForm.handleSubmit(onSubmitConversion)()
        } else if (movementType === 'transfer') {
          transferForm.handleSubmit(onSubmitTransfer)()
        } else {
          form.handleSubmit(onSubmit)()
        }
      }
    }

    // Agregar event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    movementType,
    form,
    conversionForm,
    transferForm,
    onSubmit,
    onSubmitConversion,
    onSubmitTransfer
  ])


  // Renderizar panel para conversiones
  const conversionPanel = (
    <Form {...conversionForm} key={`conversion-${movementType}`}>
      <form onSubmit={conversionForm.handleSubmit(onSubmitConversion)} className="space-y-4">
        {/* CAMPOS COMUNES PARA CONVERSIONES */}
        {/* Selector de proyecto - siempre visible */}
        <FormField
          control={conversionForm.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proyecto *</FormLabel>
              <FormControl>
                <ProjectSelectorField
                  projects={projects || []}
                  organization={userData?.organization || undefined}
                  value={field.value || null}
                  onChange={field.onChange}
                  placeholder="Seleccionar proyecto..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha */}
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

        {/* Tipo de Movimiento */}
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
                  {filteredMovementConcepts?.map((concept) => (
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

        {/* Descripción */}
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

        {/* CAMPOS ESPECÍFICOS DE CONVERSIÓN */}
        <ConversionFields
          form={conversionForm}
          currencies={currencies || []}
          wallets={wallets || []}
          showExchangeRate={showExchangeRate}
          members={members || []}
          concepts={movementConcepts || []}
          movement={undefined}
        />
      </form>
    </Form>
  )

  // Renderizar panel para transferencias internas
  const transferPanel = (
    <Form {...transferForm} key={`transfer-${movementType}`}>
      <form onSubmit={transferForm.handleSubmit(onSubmitTransfer)} className="space-y-4">
        {/* SELECTOR DE PROYECTO - Siempre visible */}
        <FormField
          control={transferForm.control}
          name="project_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proyecto *</FormLabel>
              <FormControl>
                <ProjectSelectorField
                  projects={projects || []}
                  organization={userData?.organization || undefined}
                  value={field.value || null}
                  onChange={field.onChange}
                  placeholder="Seleccionar proyecto..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  {filteredMovementConcepts?.map((concept) => (
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
    <Form {...form} key={`normal-${movementType}`}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* LAYOUT: FECHA 1/3 Y TIPO DE MOVIMIENTO 2/3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* 2. TIPO DE MOVIMIENTO - USAR EL DE commonFields */}
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">El selector de tipo se renderiza en commonFields</p>
          </div>
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


        {/* 4. CAMPOS ESPECÍFICOS DE MOVIMIENTO NORMAL */}
        <DefaultMovementFields
          form={form}
          currencies={currencies || []}
          wallets={wallets || []}
          selectedCategoryId={selectedCategoryId}
          selectedPersonnel={selectedPersonnel}
          selectedSubcontracts={selectedSubcontracts}
          selectedClients={selectedClients}
          selectedIndirects={selectedIndirects}
          selectedPartnerWithdrawals={selectedPartnerWithdrawals as any}
          selectedPartnerContributions={selectedPartnerContributions}
          onPersonnelChange={setSelectedPersonnel}
          onSubcontractsChange={setSelectedSubcontracts}
          onClientsChange={setSelectedClients}
          onIndirectsChange={setSelectedIndirects}
          onPartnerWithdrawalsChange={setSelectedPartnerWithdrawals}
          onPartnerContributionsChange={setSelectedPartnerContributions}
          showExchangeRate={showExchangeRate}
        />
      </form>
    </Form>
  )

  // Campos comunes (siempre los mismos)
  const commonFields = (
    <div className="space-y-4">
      {/* SELECTOR DE PROYECTO - Siempre visible */}
      <FormField
        control={form.control}
        name="project_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Proyecto *</FormLabel>
            <FormControl>
              <ProjectSelectorField
                projects={projects || []}
                organization={userData?.organization || undefined}
                value={field.value || null}
                onChange={field.onChange}
                placeholder="Seleccionar proyecto..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* LAYOUT: FECHA 1/3 Y TIPO DE MOVIMIENTO 2/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* 2. TIPO DE MOVIMIENTO CON CASCADINGSELECT - OCUPA 2 COLUMNAS */}
        <FormItem className="md:col-span-2">
          <FormLabel>Tipo de Movimiento *</FormLabel>
          <FormControl>
            <CascadingSelect
              options={transformConceptsToOptions(filteredMovementConcepts || [])}
              value={React.useMemo(() => [selectedTypeId, selectedCategoryId, selectedSubcategoryId].filter(Boolean), [selectedTypeId, selectedCategoryId, selectedSubcategoryId])}
              onValueChange={(values) => {
                const typeId = values[0] || ''
                const categoryId = values[1] || ''
                const subcategoryId = values[2] || ''
                
                // IDEMPOTENT CHECK: Early return if values haven't changed
                const hasChanges = (
                  typeId !== selectedTypeId ||
                  categoryId !== selectedCategoryId ||
                  subcategoryId !== selectedSubcategoryId
                )
                
                if (!hasChanges) {
                  // No changes needed - prevent redundant processing
                  return
                }
                
                // Update hierarchical selection states  
                setSelectedTypeId(typeId)
                setSelectedCategoryId(categoryId)
                setSelectedSubcategoryId(subcategoryId)
                
                const formOptions = {}
                
                // Update form values with proper options to prevent validation triggers
                if (movementType === 'conversion') {
                  conversionForm.setValue('type_id', typeId, formOptions)
                  // Conversion forms don't have category_id/subcategory_id
                } else if (movementType === 'transfer') {
                  transferForm.setValue('type_id', typeId, formOptions)
                  // Transfer forms don't have category_id/subcategory_id
                } else {
                  form.setValue('type_id', typeId, formOptions)
                  form.setValue('category_id', categoryId, formOptions)
                  form.setValue('subcategory_id', subcategoryId, formOptions)
                }
                
                // Delegate movement type detection to handleTypeChange to avoid duplication
                if (typeId) {
                  handleTypeChange(typeId)
                }
              }}
              placeholder="Seleccionar tipo de movimiento..."
            />
          </FormControl>
          <FormMessage />
        </FormItem>
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
                placeholder={
                  movementType === 'conversion' 
                    ? "Descripción de la conversión..." 
                    : movementType === 'transfer'
                      ? "Descripción de la transferencia..."
                      : "Descripción del movimiento..."
                }
                {...field}
                onChange={(e) => {
                  field.onChange(e)
                  // Sincronizar con otros formularios
                  if (movementType === 'conversion') {
                    conversionForm.setValue('description', e.target.value)
                  } else if (movementType === 'transfer') {
                    transferForm.setValue('description', e.target.value)
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

    </div>
  )

  // Panel unificado con campos comunes arriba y específicos abajo
  const editPanel = (
    <Form {...form} key={`unified-${movementType}`}>
      <form onSubmit={(e) => {
        e.preventDefault()
        if (movementType === 'conversion') {
          conversionForm.handleSubmit(onSubmitConversion)()
        } else if (movementType === 'transfer') {
          transferForm.handleSubmit(onSubmitTransfer)()
        } else {
          form.handleSubmit(onSubmit)()
        }
      }} className="space-y-4">
        
        {/* CAMPOS COMUNES (siempre iguales) */}
        {commonFields}

        {/* CAMPOS ESPECÍFICOS según tipo */}
        {movementType === 'conversion' && (
          <ConversionFields
            form={conversionForm}
            currencies={currencies}
            wallets={wallets}
            members={members}
            concepts={movementConcepts}
            movement={undefined}
            showExchangeRate={showExchangeRate}
          />
        )}

        {movementType === 'transfer' && (
          <TransferFields
            form={transferForm}
            currencies={currencies}
            wallets={wallets}
            members={members}
            concepts={movementConcepts}
          />
        )}

        {movementType === 'normal' && (
          <DefaultMovementFields
            form={form}
            currencies={currencies}
            wallets={wallets}
            selectedCategoryId={selectedCategoryId}
            selectedPersonnel={selectedPersonnel}
            selectedSubcontracts={selectedSubcontracts}
            selectedClients={selectedClients}
            selectedIndirects={selectedIndirects}
            selectedGeneralCosts={selectedGeneralCosts}
            selectedPartnerWithdrawals={selectedPartnerWithdrawals as any}
            selectedPartnerContributions={selectedPartnerContributions}
            onPersonnelChange={setSelectedPersonnel}
            onSubcontractsChange={setSelectedSubcontracts}
            onClientsChange={setSelectedClients}
            onIndirectsChange={setSelectedIndirects}
            onGeneralCostsChange={setSelectedGeneralCosts}
            onPartnerWithdrawalsChange={setSelectedPartnerWithdrawals}
            onPartnerContributionsChange={setSelectedPartnerContributions}
            showExchangeRate={showExchangeRate}
          />
        )}
      </form>
    </Form>
  )

  // Panel de vista (por ahora igual al de edición)
  const viewPanel = editPanel


  // Panel a mostrar siempre es editPanel
  const currentPanel = editPanel

  // Header del modal
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Movimiento" : "Nuevo Movimiento"}
      description={isEditing ? "Modifica los datos del movimiento financiero existente" : "Registra un nuevo movimiento financiero en el sistema"}
      icon={DollarSign}
    />
  )

  // Footer del modal
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Guardar"}
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