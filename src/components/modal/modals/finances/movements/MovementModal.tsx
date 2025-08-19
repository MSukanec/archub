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
import { PersonnelForm, PersonnelFormHandle, PersonnelItem } from './forms/PersonnelForm'
import { SubcontractsForm, SubcontractsFormHandle, SubcontractItem } from './forms/SubcontractsForm'
import { ClientsForm, ClientsFormHandle, ClientItem } from './forms/ClientsForm'
import { PartnerWithdrawalsForm, PartnerWithdrawalsFormHandle, PartnerWithdrawalItem } from './forms/PartnerWithdrawalsForm'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useMovementSubcontracts, useCreateMovementSubcontracts, useUpdateMovementSubcontracts } from '@/hooks/use-movement-subcontracts'
import { useMovementProjectClients, useCreateMovementProjectClients, useUpdateMovementProjectClients } from '@/hooks/use-movement-project-clients'

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
  editingMovement?: any // Movement data when editing
  isEditing?: boolean
}

export function MovementModal({ modalData, onClose, editingMovement: propEditingMovement, isEditing: propIsEditing }: MovementModalProps) {
  // Extract editing data from modalData or props
  const editingMovement = propEditingMovement || modalData?.editingMovement
  const isEditing = propIsEditing || !!editingMovement

  // Debug logs
  React.useEffect(() => {
    if (editingMovement) {
      console.log('📝 MovementModal: Editing movement data:', editingMovement)
      console.log('📝 MovementModal: isEditing:', isEditing)
    }
  }, [editingMovement, isEditing])
  // Hooks
  const { data: userData } = useCurrentUser()
  const { data: currencies } = useOrganizationCurrencies(userData?.organization?.id)
  const { data: wallets } = useWallets(userData?.organization?.id)
  const { data: movementConcepts } = useOrganizationMovementConcepts(userData?.organization?.id)
  const { data: members } = useOrganizationMembers(userData?.organization?.id)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mutaciones para subcontratos
  const createMovementSubcontractsMutation = useCreateMovementSubcontracts()
  const updateMovementSubcontractsMutation = useUpdateMovementSubcontracts()

  // Query para cargar subcontratos existentes en modo edición
  const { data: existingSubcontracts } = useMovementSubcontracts(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  // Mutaciones para clientes de proyecto
  const createMovementProjectClientsMutation = useCreateMovementProjectClients()
  const updateMovementProjectClientsMutation = useUpdateMovementProjectClients()

  // Query para cargar clientes existentes en modo edición
  const { data: existingProjectClients } = useMovementProjectClients(
    isEditing && editingMovement?.id ? editingMovement.id : undefined
  )

  // States for hierarchical selection like the original modal
  const [selectedTypeId, setSelectedTypeId] = React.useState('')
  const [selectedCategoryId, setSelectedCategoryId] = React.useState('')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = React.useState('')
  
  // State para detectar tipo de movimiento
  const [movementType, setMovementType] = React.useState<'normal' | 'conversion' | 'transfer'>('normal')
  const [showPersonnelForm, setShowPersonnelForm] = React.useState(false)
  const [selectedPersonnel, setSelectedPersonnel] = React.useState<Array<{personnel_id: string, contact_name: string, amount: number}>>([])
  const [showSubcontractsForm, setShowSubcontractsForm] = React.useState(false)
  const [selectedSubcontracts, setSelectedSubcontracts] = React.useState<Array<{subcontract_id: string, contact_name: string, amount: number}>>([])
  const [showClientsForm, setShowClientsForm] = React.useState(false)
  const [selectedClients, setSelectedClients] = React.useState<Array<{project_client_id: string, client_name: string, amount: number}>>([])
  const [showPartnerWithdrawalsForm, setShowPartnerWithdrawalsForm] = React.useState(false)
  const [selectedPartnerWithdrawals, setSelectedPartnerWithdrawals] = React.useState<Array<{partner_id: string, partner_name: string, amount: number}>>([])

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
      movement_date: editingMovement?.movement_date ? new Date(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentMember?.id || '',
      type_id: editingMovement?.type_id || '',
      category_id: editingMovement?.category_id || '',
      subcategory_id: editingMovement?.subcategory_id || '',
      description: editingMovement?.description || '',
      currency_id: editingMovement?.currency_id || defaultCurrency || '',
      wallet_id: editingMovement?.wallet_id || defaultWallet || '',
      amount: editingMovement?.amount || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined
    }
  })

  // Conversion form (como en el modal original)
  const conversionForm = useForm<ConversionForm>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      movement_date: editingMovement?.movement_date ? new Date(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentMember?.id || '',
      description: editingMovement?.description || '',
      type_id: editingMovement?.type_id || '',
      currency_id_from: editingMovement?.currency_id_from || defaultCurrency || '',
      wallet_id_from: editingMovement?.wallet_id_from || defaultWallet || '',
      amount_from: editingMovement?.amount_from || 0,
      currency_id_to: editingMovement?.currency_id_to || '',
      wallet_id_to: editingMovement?.wallet_id_to || '',
      amount_to: editingMovement?.amount_to || 0,
      exchange_rate: editingMovement?.exchange_rate || undefined
    }
  })

  // Transfer form
  const transferForm = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      movement_date: editingMovement?.movement_date ? new Date(editingMovement.movement_date) : new Date(),
      created_by: editingMovement?.created_by || currentMember?.id || '',
      description: editingMovement?.description || '',
      type_id: editingMovement?.type_id || '',
      currency_id: editingMovement?.currency_id || defaultCurrency || '',
      wallet_id_from: editingMovement?.wallet_id_from || defaultWallet || '',
      wallet_id_to: editingMovement?.wallet_id_to || '',
      amount: editingMovement?.amount || 0
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

  // Effect para cargar datos existentes cuando se está editando
  React.useEffect(() => {
    if (isEditing && editingMovement) {
      // Cargar selecciones jerárquicas
      setSelectedTypeId(editingMovement.type_id || '')
      setSelectedCategoryId(editingMovement.category_id || '')
      setSelectedSubcategoryId(editingMovement.subcategory_id || '')

      // Determinar tipo de movimiento
      if (editingMovement.is_conversion || editingMovement.conversion_group_id) {
        setMovementType('conversion')
      } else if (editingMovement.transfer_group_id) {
        setMovementType('transfer')
      } else {
        setMovementType('normal')
      }

      // Cargar personal asignado si existe
      if (editingMovement.id) {
        loadMovementPersonnel(editingMovement.id)
        loadMovementSubcontracts(editingMovement.id)
        loadMovementProjectClients(editingMovement.id)
      }
    }
  }, [isEditing, editingMovement])

  // Función para cargar personal asignado del movimiento
  const loadMovementPersonnel = async (movementId: string) => {
    try {
      const { data: personnelAssignments, error } = await supabase
        .from('movement_personnel')
        .select(`
          personnel_id,
          amount,
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
            contact_name: contactName,
            amount: assignment.amount
          }
        })

        setSelectedPersonnel(formattedPersonnel)
      }
    } catch (error) {
      console.error('Error loading movement personnel:', error)
    }
  }

  // Función para cargar subcontratos asignados del movimiento
  const loadMovementSubcontracts = async (movementId: string) => {
    try {
      const { data: subcontractAssignments, error } = await supabase
        .from('movement_subcontracts')
        .select(`
          subcontract_id,
          amount,
          subcontracts:subcontract_id (
            id,
            title,
            contact_id,
            contact:contact_id (
              first_name,
              last_name,
              full_name,
              company_name
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) throw error

      if (subcontractAssignments && subcontractAssignments.length > 0) {
        const formattedSubcontracts = subcontractAssignments.map((assignment: any) => {
          // Usar el título del subcontrato en lugar del nombre del contacto
          const subcontractTitle = assignment.subcontracts?.title || 'Subcontrato sin título'

          return {
            subcontract_id: assignment.subcontract_id,
            contact_name: subcontractTitle, // Usamos title para consistencia con SubcontractsForm
            amount: assignment.amount
          }
        })

        setSelectedSubcontracts(formattedSubcontracts)
      }
    } catch (error) {
      console.error('Error loading movement subcontracts:', error)
    }
  }

  // Función para cargar clientes del proyecto asignados al movimiento
  const loadMovementProjectClients = async (movementId: string) => {
    try {
      const { data: clientAssignments, error } = await supabase
        .from('movement_clients')
        .select(`
          project_client_id,
          amount,
          project_clients:project_client_id (
            id,
            client_id,
            contact:client_id (
              first_name,
              last_name,
              company_name,
              full_name
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) throw error

      if (clientAssignments && clientAssignments.length > 0) {
        const formattedClients = clientAssignments.map((assignment: any) => {
          const contact = assignment.project_clients?.contact
          let clientName = 'Cliente sin nombre'
          
          if (contact) {
            if (contact.company_name) {
              clientName = contact.company_name
            } else if (contact.full_name) {
              clientName = contact.full_name
            } else {
              clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Cliente sin nombre'
            }
          }

          return {
            project_client_id: assignment.project_client_id,
            client_name: clientName,
            amount: assignment.amount
          }
        })

        setSelectedClients(formattedClients)
      }
    } catch (error) {
      console.error('Error loading movement project clients:', error)
    }
  }

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

  // Mutation para crear/editar el movimiento normal
  const createMovementMutation = useMutation({
    mutationFn: async (data: BasicMovementForm) => {
      if (!userData?.organization?.id) {
        throw new Error('Organization ID not found')
      }

      // Preparar datos del movimiento según la estructura de la tabla
      const movementData = {
        organization_id: userData.organization.id,
        project_id: userData.preferences?.last_project_id || null,
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
        const personnelData = selectedPersonnel.map(person => ({
          movement_id: result.id,
          personnel_id: person.personnel_id,
          amount: person.amount
        }))

        const { error: personnelError } = await supabase
          .from('movement_personnel')
          .insert(personnelData)

        if (personnelError) throw personnelError
      }

      // Si hay subcontratos seleccionados, guardar las asignaciones en movement_subcontracts
      if (selectedSubcontracts && selectedSubcontracts.length > 0) {
        const subcontractsData = selectedSubcontracts.map(subcontract => ({
          movement_id: result.id,
          subcontract_id: subcontract.subcontract_id,
          amount: subcontract.amount
        }))

        const { error: subcontractsError } = await supabase
          .from('movement_subcontracts')
          .insert(subcontractsData)

        if (subcontractsError) throw subcontractsError
      }

      // Si hay clientes de proyecto seleccionados, guardar las asignaciones en movement_project_clients
      if (selectedClients && selectedClients.length > 0) {
        const projectClientsData = selectedClients.map(client => ({
          movement_id: result.id,
          project_client_id: client.project_client_id,
          amount: client.amount
        }))

        const { error: projectClientsError } = await supabase
          .from('movement_clients')
          .insert(projectClientsData)

        if (projectClientsError) throw projectClientsError
      }

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
        project_id: userData.preferences?.last_project_id || null,
        movement_date: data.movement_date.getFullYear() + '-' + 
          String(data.movement_date.getMonth() + 1).padStart(2, '0') + '-' + 
          String(data.movement_date.getDate()).padStart(2, '0'),
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

      // Si hay personal seleccionado, guardar las asignaciones en movement_personnel para el movimiento de egreso
      if (selectedPersonnel && selectedPersonnel.length > 0 && results) {
        const egressPersonnelData = selectedPersonnel.map(person => ({
          movement_id: results[0].id, // Movimiento de egreso
          personnel_id: person.personnel_id,
          amount: person.amount
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
        project_id: userData.preferences?.last_project_id || null,
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
          personnel_id: person.personnel_id,
          amount: person.amount
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

  // Effect para manejar ENTER key para submit
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Solo procesar ENTER si no estamos en subformularios
      if (
        event.key === 'Enter' && 
        event.ctrlKey === false && 
        event.altKey === false && 
        !showPersonnelForm && 
        !showSubcontractsForm && 
        !showClientsForm && 
        !showPartnerWithdrawalsForm
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
    showPersonnelForm, 
    showSubcontractsForm, 
    showClientsForm, 
    showPartnerWithdrawalsForm,
    movementType,
    form,
    conversionForm,
    transferForm,
    onSubmit,
    onSubmitConversion,
    onSubmitTransfer
  ])

  // Función para determinar qué botón mostrar según el subcategory_id
  const getActionButton = (subcategoryId: string) => {
    const buttonConfig = {
      '7ef27d3f-ef17-49c3-a392-55282b3576ff': { 
        text: 'Gestionar Personal', 
        icon: Users,
        onClick: () => setShowPersonnelForm(true) 
      },
      'f40a8fda-69e6-4e81-bc8a-464359cd8498': {
        text: 'Gestionar Subcontratos',
        icon: FileText,
        onClick: () => setShowSubcontractsForm(true)
      },
      'f3b96eda-15d5-4c96-ade7-6f53685115d3': {
        text: 'Gestionar Clientes',
        icon: Users,
        onClick: () => setShowClientsForm(true)
      },
      'c04a82f8-6fd8-439d-81f7-325c63905a1b': {
        text: 'Gestionar Retiros de Socios',
        icon: Users,
        onClick: () => setShowPartnerWithdrawalsForm(true)
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

        {/* PERSONAL SELECCIONADO (si hay) */}
        {selectedPersonnel.length > 0 && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-md">
            <h4 className="text-sm font-medium text-foreground">Personal Seleccionado:</h4>
            {selectedPersonnel.map((person, index) => (
              <div key={index} className="grid grid-cols-[1fr,120px] gap-3 text-xs">
                <div className="truncate">{person.contact_name}</div>
                <div className="text-right font-medium">${person.amount.toFixed(2)}</div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr,120px] gap-3 text-xs border-t border-border pt-2">
              <div className="font-medium">Total:</div>
              <div className="text-right font-bold">
                ${selectedPersonnel.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* SUBCONTRATOS SELECCIONADOS (si hay) */}
        {selectedSubcontracts.length > 0 && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-md">
            <h4 className="text-sm font-medium text-foreground">Subcontratos Seleccionados:</h4>
            {selectedSubcontracts.map((subcontract, index) => (
              <div key={index} className="grid grid-cols-[1fr,120px] gap-3 text-xs">
                <div className="truncate">{subcontract.contact_name}</div>
                <div className="text-right font-medium">${subcontract.amount.toFixed(2)}</div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr,120px] gap-3 text-xs border-t border-border pt-2">
              <div className="font-medium">Total:</div>
              <div className="text-right font-bold">
                ${selectedSubcontracts.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* CLIENTES DE PROYECTO SELECCIONADOS (si hay) */}
        {selectedClients.length > 0 && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-md">
            <h4 className="text-sm font-medium text-foreground">Clientes Seleccionados:</h4>
            {selectedClients.map((client, index) => (
              <div key={index} className="grid grid-cols-[1fr,120px] gap-3 text-xs">
                <div className="truncate">{client.client_name}</div>
                <div className="text-right font-medium">${client.amount.toFixed(2)}</div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr,120px] gap-3 text-xs border-t border-border pt-2">
              <div className="font-medium">Total:</div>
              <div className="text-right font-bold">
                ${selectedClients.reduce((sum, c) => sum + c.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* RETIROS DE SOCIOS SELECCIONADOS (si hay) */}
        {selectedPartnerWithdrawals.length > 0 && (
          <div className="space-y-2 p-3 bg-muted/20 rounded-md">
            <h4 className="text-sm font-medium text-foreground">Retiros de Socios Seleccionados:</h4>
            {selectedPartnerWithdrawals.map((partnerWithdrawal, index) => (
              <div key={index} className="grid grid-cols-[1fr,120px] gap-3 text-xs">
                <div className="truncate">{partnerWithdrawal.partner_name}</div>
                <div className="text-right font-medium">${partnerWithdrawal.amount.toFixed(2)}</div>
              </div>
            ))}
            <div className="grid grid-cols-[1fr,120px] gap-3 text-xs border-t border-border pt-2">
              <div className="font-medium">Total:</div>
              <div className="text-right font-bold">
                ${selectedPartnerWithdrawals.reduce((sum, pw) => sum + pw.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}

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
  const personnelFormRef = React.useRef<PersonnelFormHandle>(null)
  const subcontractsFormRef = React.useRef<SubcontractsFormHandle>(null)
  const clientsFormRef = React.useRef<ClientsFormHandle>(null)
  const partnerWithdrawalsFormRef = React.useRef<PartnerWithdrawalsFormHandle>(null)
  
  const personnelPanel = (
    <PersonnelForm 
      ref={personnelFormRef}
      onClose={() => setShowPersonnelForm(false)} 
      onConfirm={(personnelList) => {
        setSelectedPersonnel(personnelList)
        setShowPersonnelForm(false)
      }}
      initialPersonnel={selectedPersonnel}
    />
  )

  const subcontractsPanel = (
    <SubcontractsForm 
      ref={subcontractsFormRef}
      onClose={() => setShowSubcontractsForm(false)} 
      onConfirm={(subcontractsList) => {
        setSelectedSubcontracts(subcontractsList)
        setShowSubcontractsForm(false)
      }}
      initialSubcontracts={selectedSubcontracts}
    />
  )

  const clientsPanel = (
    <ClientsForm 
      ref={clientsFormRef}
      onClose={() => setShowClientsForm(false)} 
      onConfirm={(clientsList) => {
        setSelectedClients(clientsList)
        setShowClientsForm(false)
      }}
      initialClients={selectedClients}
    />
  )

  const partnerWithdrawalsPanel = (
    <PartnerWithdrawalsForm 
      ref={partnerWithdrawalsFormRef}
      onClose={() => setShowPartnerWithdrawalsForm(false)} 
      onConfirm={(partnerWithdrawalsList) => {
        setSelectedPartnerWithdrawals(partnerWithdrawalsList)
        setShowPartnerWithdrawalsForm(false)
      }}
      initialPartnerWithdrawals={selectedPartnerWithdrawals}
    />
  )

  // Seleccionar panel a mostrar
  const currentPanel = showPersonnelForm 
    ? personnelPanel 
    : showSubcontractsForm 
      ? subcontractsPanel 
      : showClientsForm
        ? clientsPanel
        : showPartnerWithdrawalsForm
          ? partnerWithdrawalsPanel
          : editPanel

  // Header del modal
  const headerContent = (
    <FormModalHeader 
      title={showPersonnelForm 
        ? "Gestión de Personal" 
        : showSubcontractsForm 
          ? "Gestión de Subcontratos"
          : showClientsForm
            ? "Gestión de Clientes"
            : showPartnerWithdrawalsForm
              ? "Gestión de Retiros de Socios"
              : (isEditing ? "Editar Movimiento" : "Nuevo Movimiento")}
      description={showPersonnelForm 
        ? "Asigna personal y montos para este movimiento financiero" 
        : showSubcontractsForm
          ? "Asigna subcontratos y montos para este movimiento financiero"
          : showClientsForm
            ? "Asigna clientes de proyecto y montos para este movimiento financiero"
            : showPartnerWithdrawalsForm
              ? "Asigna socios y montos para retiros en este movimiento financiero"
              : (isEditing ? "Modifica los datos del movimiento financiero existente" : "Registra un nuevo movimiento financiero en el sistema")}
      icon={showPersonnelForm 
        ? Users 
        : showSubcontractsForm
          ? FileText
          : showClientsForm
            ? Users
            : showPartnerWithdrawalsForm
              ? Users
              : DollarSign}
    />
  )

  // Footer del modal
  const footerContent = showPersonnelForm ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => setShowPersonnelForm(false)}
      rightLabel="Confirmar Personal"
      onRightClick={() => {
        personnelFormRef.current?.confirmPersonnel()
      }}
    />
  ) : showSubcontractsForm ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => setShowSubcontractsForm(false)}
      rightLabel="Confirmar Subcontratos"
      onRightClick={() => {
        subcontractsFormRef.current?.confirmSubcontracts()
      }}
    />
  ) : showClientsForm ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => setShowClientsForm(false)}
      rightLabel="Confirmar Clientes"
      onRightClick={() => {
        clientsFormRef.current?.confirmClients()
      }}
    />
  ) : showPartnerWithdrawalsForm ? (
    <FormModalFooter
      leftLabel="Volver"
      onLeftClick={() => setShowPartnerWithdrawalsForm(false)}
      rightLabel="Confirmar Retiros"
      onRightClick={() => {
        partnerWithdrawalsFormRef.current?.confirmPartnerWithdrawals()
      }}
    />
  ) : (
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