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
import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import FormModalBody from "@/components/modal/form/FormModalBody"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Plus, X, Folder, FileText, Trash2, Download } from 'lucide-react'
import { uploadMovementFiles, getMovementFiles, deleteMovementFile } from '@/lib/storage/uploadMovementFiles'
import UserSelector from '@/components/ui-custom/UserSelector'
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity'

const movementSchema = z.object({
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
  exchange_rate?: number
  type_id: string
  category_id?: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  organization_id: string
  project_id?: string
}

interface MovementFormModalProps {
  modalData?: {
    editingMovement?: Movement | null
  }
  onClose: () => void
}

export default function MovementFormModal({ modalData, onClose }: MovementFormModalProps) {
  const editingMovement = modalData?.editingMovement
  const { data: currentUser } = useCurrentUser()
  const organizationId = currentUser?.organization?.id
  const { data: members } = useOrganizationMembers(organizationId)
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [isConversion, setIsConversion] = useState(false)
  const [files, setFiles] = useState<{file: File | null, name: string, id: string}[]>([])
  const [existingFiles, setExistingFiles] = useState<any[]>([])
  const [accordionValue, setAccordionValue] = useState<string>("informacion-basica")
  
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
      exchange_rate: undefined,
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

  // Initialize forms when modal opens or data becomes available
  useEffect(() => {
    
    if (editingMovement) {
      // Wait for all data to be loaded
      if (!members || !organizationCurrencies || !wallets || !types) return
      
      console.log('Initializing edit form with movement:', editingMovement)
      
      // Check if this is a conversion being edited
      const isEditingConversion = (editingMovement as any)._isConversion
      const conversionData = (editingMovement as any)._conversionData
      
      if (isEditingConversion && conversionData) {
        // Handle conversion editing
        console.log('Editing conversion with data:', conversionData)
        
        // Set conversion type to trigger isConversion state
        const conversionType = types?.find((type: any) => 
          type.name?.toLowerCase() === 'conversión' || type.name?.toLowerCase() === 'conversion'
        )
        if (conversionType) {
          setSelectedTypeId(conversionType.id)
        }
        
        // Initialize conversion form with data from both movements
        const egresoMovement = conversionData.movements.find((m: any) => 
          m.movement_data?.type?.name?.toLowerCase().includes('egreso')
        )
        const ingresoMovement = conversionData.movements.find((m: any) => 
          m.movement_data?.type?.name?.toLowerCase().includes('ingreso')
        )
        
        if (egresoMovement && ingresoMovement) {
          conversionForm.reset({
            movement_date: new Date(egresoMovement.movement_date),
            description: conversionData.description || egresoMovement.movement_data?.description || '',
            created_by: egresoMovement.movement_data?.created_by || '',
            from_amount: egresoMovement.movement_data?.amount || 0,
            from_currency_id: egresoMovement.currency_id || '',
            from_wallet_id: egresoMovement.wallet_id || '',
            to_amount: ingresoMovement.movement_data?.amount || 0,
            to_currency_id: ingresoMovement.currency_id || '',
            to_wallet_id: ingresoMovement.wallet_id || ''
          })
          setIsConversion(true)
          setAccordionValue("conversion-data")
        }
      } else {
        // Handle regular movement editing
        setSelectedTypeId(editingMovement.type_id)
        setSelectedCategoryId(editingMovement.category_id || '')
        
        // Map currency_id and wallet_id to organization-specific IDs
        const orgCurrency = organizationCurrencies?.find((oc: any) => 
          oc.currency_id === editingMovement.currency_id
        )
        const orgWallet = wallets?.find((w: any) => 
          w.id === editingMovement.wallet_id
        )
        
        form.reset({
          movement_date: new Date(editingMovement.movement_date),
          created_by: editingMovement.created_by,
          description: editingMovement.description || '',
          amount: editingMovement.amount,
          exchange_rate: editingMovement.exchange_rate,
          type_id: editingMovement.type_id,
          category_id: editingMovement.category_id || '',
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: orgCurrency?.id || '',
          wallet_id: orgWallet?.id || ''
        })
        
        setIsConversion(false)
        setAccordionValue("informacion-basica")
        
        // Load existing files for editing
        if (editingMovement.id) {
          loadMovementFiles(editingMovement.id)
        }
      }
    } else {
      // Reset forms for new movement
      form.reset({
        movement_date: new Date(),
        amount: 0,
        exchange_rate: undefined,
        description: '',
        created_by: currentUser?.user?.id || '',
        type_id: '',
        category_id: '',
        subcategory_id: '',
        currency_id: defaultCurrency?.id || '',
        wallet_id: ''
      })
      
      conversionForm.reset({
        movement_date: new Date(),
        description: '',
        created_by: currentUser?.user?.id || '',
        from_amount: 0,
        from_currency_id: '',
        from_wallet_id: '',
        to_amount: 0,
        to_currency_id: '',
        to_wallet_id: ''
      })
      
      setSelectedTypeId('')
      setSelectedCategoryId('')
      setIsConversion(false)
      setFiles([])
      setExistingFiles([])
      setAccordionValue("informacion-basica")
    }
  }, [editingMovement, members, organizationCurrencies, wallets, types, defaultCurrency, currentUser])

  // Effect specifically for updating categories when the type selection triggers loading
  useEffect(() => {
    if (!editingMovement) return
    if (!categories || !types) return
    
    // Only run if we have the editing movement's type selected
    if (selectedTypeId === editingMovement.type_id && editingMovement.category_id) {
      console.log('Setting category from editing movement:', editingMovement.category_id)
      form.setValue('category_id', editingMovement.category_id)
      setSelectedCategoryId(editingMovement.category_id)
    }
  }, [categories, selectedTypeId, editingMovement])

  // Effect for updating subcategories when category selection triggers loading
  useEffect(() => {
    if (!editingMovement) return
    if (!subcategories || !categories) return
    
    // Only run if we have the editing movement's category selected
    if (selectedCategoryId === editingMovement.category_id && editingMovement.subcategory_id) {
      console.log('Setting subcategory from editing movement:', editingMovement.subcategory_id)
      form.setValue('subcategory_id', editingMovement.subcategory_id)
    }
  }, [subcategories, selectedCategoryId, editingMovement])

  // Load existing files when editing
  const loadMovementFiles = async (movementId: string) => {
    const files = await getMovementFiles(movementId)
    setExistingFiles(files)
  }

  // Check if a type is conversion type
  useEffect(() => {
    if (!selectedTypeId || !types) return
    
    const selectedType = types.find((type: any) => type.id === selectedTypeId)
    const isConversionType = selectedType?.name?.toLowerCase() === 'conversión' || 
                           selectedType?.name?.toLowerCase() === 'conversion'
    
    setIsConversion(isConversionType)
    
    if (isConversionType) {
      setAccordionValue("conversion-data")
    } else {
      setAccordionValue("informacion-basica")
    }
  }, [selectedTypeId, types])

  // File handling functions
  const addFileField = () => {
    setFiles(prev => [...prev, { file: null, name: '', id: Date.now().toString() }])
  }

  const removeFileField = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const updateFileField = (id: string, file: File | null, name: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, file, name } : f))
  }

  const removeExistingFile = async (fileId: string) => {
    try {
      await deleteMovementFile(fileId)
      setExistingFiles(prev => prev.filter(f => f.id !== fileId))
      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó correctamente."
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo.",
        variant: "destructive"
      })
    }
  }

  // Submit mutations
  const createMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!organizationId) throw new Error('No organization found')
      
      const { data: movement, error } = await supabase
        .from('movements')
        .insert({
          ...data,
          amount: Number(data.amount),
          exchange_rate: data.exchange_rate ? Number(data.exchange_rate) : null,
          organization_id: organizationId,
          project_id: currentUser?.preferences?.last_project_id || null
        })
        .select()
        .single()
      
      if (error) throw error
      return movement
    },
    onSuccess: async (movement) => {
      // Upload files if any
      if (files.some(f => f.file)) {
        const validFiles = files.filter(f => f.file && f.name)
        if (validFiles.length > 0) {
          await uploadMovementFiles(movement.id, validFiles)
        }
      }
      
      // Log activity
      if (organizationId) {
        await logActivity(
          organizationId,
          currentUser?.user?.id || '',
          ACTIVITY_ACTIONS.CREATE_MOVEMENT,
          TARGET_TABLES.MOVEMENTS,
          movement.id,
          { description: movement.description, amount: movement.amount }
        )
      }
      
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: "Movimiento creado",
        description: "El movimiento se ha creado correctamente."
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error creating movement:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el movimiento.",
        variant: "destructive"
      })
    }
  })

  const updateMovementMutation = useMutation({
    mutationFn: async (data: MovementForm) => {
      if (!editingMovement) throw new Error('No movement to update')
      
      const { data: movement, error } = await supabase
        .from('movements')
        .update({
          ...data,
          amount: Number(data.amount),
          exchange_rate: data.exchange_rate ? Number(data.exchange_rate) : null
        })
        .eq('id', editingMovement.id)
        .select()
        .single()
      
      if (error) throw error
      return movement
    },
    onSuccess: async (movement) => {
      // Upload new files if any
      if (files.some(f => f.file)) {
        const validFiles = files.filter(f => f.file && f.name)
        if (validFiles.length > 0) {
          await uploadMovementFiles(movement.id, validFiles)
        }
      }
      
      // Log activity
      if (organizationId) {
        await logActivity(
          organizationId,
          currentUser?.user?.id || '',
          ACTIVITY_ACTIONS.UPDATE_MOVEMENT,
          TARGET_TABLES.MOVEMENTS,
          movement.id,
          { description: movement.description, amount: movement.amount }
        )
      }
      
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: "Movimiento actualizado",
        description: "El movimiento se ha actualizado correctamente."
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating movement:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el movimiento.",
        variant: "destructive"
      })
    }
  })

  const createConversionMutation = useMutation({
    mutationFn: async (data: ConversionForm) => {
      if (!organizationId) throw new Error('No organization found')
      
      // Get conversion type ID
      const conversionType = types?.find((type: any) => 
        type.name?.toLowerCase() === 'conversión' || type.name?.toLowerCase() === 'conversion'
      )
      
      if (!conversionType) throw new Error('Conversion type not found')
      
      // Get egreso and ingreso types
      const egresoType = types?.find((type: any) => 
        type.name?.toLowerCase() === 'egreso'
      )
      const ingresoType = types?.find((type: any) => 
        type.name?.toLowerCase() === 'ingreso'
      )
      
      if (!egresoType || !ingresoType) {
        throw new Error('Required movement types not found')
      }
      
      // Create conversion group
      const { data: conversionGroup, error: groupError } = await supabase
        .from('movement_conversion_groups')
        .insert({
          description: data.description || 'Conversión de moneda',
          organization_id: organizationId,
          project_id: currentUser?.preferences?.last_project_id || null
        })
        .select()
        .single()
      
      if (groupError) throw groupError
      
      // Create egreso movement (outgoing)
      const { data: egresoMovement, error: egresoError } = await supabase
        .from('movements')
        .insert({
          movement_date: data.movement_date,
          created_by: data.created_by,
          description: `Conversión: Salida de ${data.from_amount}`,
          amount: Number(data.from_amount),
          type_id: egresoType.id,
          currency_id: data.from_currency_id,
          wallet_id: data.from_wallet_id,
          organization_id: organizationId,
          project_id: currentUser?.preferences?.last_project_id || null,
          conversion_group_id: conversionGroup.id
        })
        .select()
        .single()
      
      if (egresoError) throw egresoError
      
      // Create ingreso movement (incoming)
      const { data: ingresoMovement, error: ingresoError } = await supabase
        .from('movements')
        .insert({
          movement_date: data.movement_date,
          created_by: data.created_by,
          description: `Conversión: Entrada de ${data.to_amount}`,
          amount: Number(data.to_amount),
          type_id: ingresoType.id,
          currency_id: data.to_currency_id,
          wallet_id: data.to_wallet_id,
          organization_id: organizationId,
          project_id: currentUser?.preferences?.last_project_id || null,
          conversion_group_id: conversionGroup.id
        })
        .select()
        .single()
      
      if (ingresoError) throw ingresoError
      
      return { conversionGroup, egresoMovement, ingresoMovement }
    },
    onSuccess: async (result) => {
      // Log activity
      if (organizationId) {
        await logActivity(
          organizationId,
          currentUser?.user?.id || '',
          ACTIVITY_ACTIONS.CREATE_MOVEMENT,
          TARGET_TABLES.MOVEMENTS,
          result.conversionGroup.id,
          { 
            description: 'Conversión de moneda',
            from_amount: result.egresoMovement.amount,
            to_amount: result.ingresoMovement.amount
          }
        )
      }
      
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: "Conversión creada",
        description: "La conversión de moneda se ha creado correctamente."
      })
      onClose()
    },
    onError: (error) => {
      console.error('Error creating conversion:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la conversión.",
        variant: "destructive"
      })
    }
  })

  const onSubmit = async (data: MovementForm) => {
    if (editingMovement) {
      updateMovementMutation.mutate(data)
    } else {
      createMovementMutation.mutate(data)
    }
  }

  const onSubmitConversion = async (data: ConversionForm) => {
    createConversionMutation.mutate(data)
  }

  const isLoading = createMovementMutation.isPending || 
                   updateMovementMutation.isPending || 
                   createConversionMutation.isPending

  return (
    <FormModalLayout>
      <FormModalHeader 
        title={editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        description="Gestiona los movimientos financieros del proyecto"
      />

      <FormModalBody>
        {isConversion ? (
          <Form {...conversionForm}>
            <form 
              key="conversion-form"
              onSubmit={conversionForm.handleSubmit(onSubmitConversion)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  conversionForm.handleSubmit(onSubmitConversion)()
                }
              }}
              className="space-y-4"
            >
              <Accordion type="single" value={accordionValue} onValueChange={setAccordionValue}>
                <AccordionItem value="conversion-data">
                  <AccordionTrigger>
                    Datos de Conversión
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3">
                    {/* Creador y Fecha */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={conversionForm.control}
                        name="created_by"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Creador</FormLabel>
                            <FormControl>
                              <UserSelector
                                organizationId={organizationId}
                                value={field.value}
                                onValueChange={field.onChange}
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
                            <FormLabel>Fecha del Movimiento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value + 'T00:00:00'))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tipo */}
                    <FormField
                      control={conversionForm.control}
                      name="created_by"
                      render={() => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {types?.map((type: any) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
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

                    {/* Movimiento de Salida */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Movimiento de Salida (Egreso)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={conversionForm.control}
                          name="from_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monto</FormLabel>
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

                        <FormField
                          control={conversionForm.control}
                          name="from_currency_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Moneda</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar moneda" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {organizationCurrencies?.map((orgCurrency: any) => (
                                      <SelectItem key={orgCurrency.id} value={orgCurrency.id}>
                                        {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
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
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {wallets?.map((wallet: any) => (
                                      <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Movimiento de Entrada */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Movimiento de Entrada (Ingreso)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={conversionForm.control}
                          name="to_amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monto</FormLabel>
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

                        <FormField
                          control={conversionForm.control}
                          name="to_currency_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Moneda</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar moneda" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {organizationCurrencies?.map((orgCurrency: any) => (
                                      <SelectItem key={orgCurrency.id} value={orgCurrency.id}>
                                        {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
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
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar billetera" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {wallets?.map((wallet: any) => (
                                      <SelectItem key={wallet.id} value={wallet.id}>
                                        {wallet.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>
        ) : (
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  form.handleSubmit(onSubmit)()
                }
              }}
              className="space-y-4"
            >
              <Accordion type="single" value={accordionValue} onValueChange={setAccordionValue}>
                <AccordionItem value="informacion-basica">
                  <AccordionTrigger>
                    Información Básica
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3">
                    {/* Creador y Fecha */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="created_by"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Creador</FormLabel>
                            <FormControl>
                              <UserSelector
                                organizationId={organizationId}
                                value={field.value}
                                onValueChange={field.onChange}
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
                            <FormLabel>Fecha del Movimiento</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ? field.value.toISOString().split('T')[0] : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value + 'T00:00:00'))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tipo */}
                    <FormField
                      control={form.control}
                      name="type_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value)
                                setSelectedTypeId(value)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {types?.map((type: any) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Categoría */}
                    {categories && categories.length > 0 && (
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={(value) => {
                                  field.onChange(value)
                                  setSelectedCategoryId(value)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Subcategoría */}
                    {subcategories && subcategories.length > 0 && (
                      <FormField
                        control={form.control}
                        name="subcategory_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subcategoría</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar subcategoría" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subcategories.map((subcategory: any) => (
                                    <SelectItem key={subcategory.id} value={subcategory.id}>
                                      {subcategory.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Monto y Cotización */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monto</FormLabel>
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
                                placeholder="1.0000"
                                value={field.value || ''}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Moneda y Billetera */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currency_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Moneda</FormLabel>
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizationCurrencies?.map((orgCurrency: any) => (
                                    <SelectItem key={orgCurrency.id} value={orgCurrency.id}>
                                      {orgCurrency.currency.name} ({orgCurrency.currency.symbol})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
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
                            <FormControl>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar billetera" />
                                </SelectTrigger>
                                <SelectContent>
                                  {wallets?.map((wallet: any) => (
                                    <SelectItem key={wallet.id} value={wallet.id}>
                                      {wallet.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Files Section */}
                <AccordionItem value="archivos">
                  <AccordionTrigger>
                    Archivos Adjuntos
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3">
                    {/* Existing Files */}
                    {existingFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Archivos existentes</h4>
                        {existingFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(file.file_url, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExistingFile(file.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* New Files */}
                    {files.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Nuevos archivos</h4>
                        {files.map((fileField) => (
                          <div key={fileField.id} className="flex items-center gap-2">
                            <Input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null
                                updateFileField(fileField.id, file, fileField.name)
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Nombre del archivo"
                              value={fileField.name}
                              onChange={(e) => updateFileField(fileField.id, fileField.file, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFileField(fileField.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addFileField}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar archivo
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>
        )}
      </FormModalBody>

      <FormModalFooter
        cancelText="Cancelar"
        submitText={editingMovement ? "Actualizar" : "Guardar"}
        onSubmit={isConversion ? conversionForm.handleSubmit(onSubmitConversion) : form.handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </FormModalLayout>
  )
}