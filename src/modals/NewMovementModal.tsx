import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { CalendarIcon, FileIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { useOrganizationMembers } from '@/hooks/use-organization-members'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'
import { useCurrencies } from '@/hooks/use-currencies'
import { useWallets } from '@/hooks/use-wallets'

const createMovementSchema = z.object({
  description: z.string().optional(),
  amount: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  type_id: z.string().optional(),
  category_id: z.string().optional(), 
  subcategory_id: z.string().optional(),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  wallet_id: z.string().min(1, 'La billetera es requerida'),
  created_by: z.string().min(1, 'El creador es requerido'),
  file_url: z.string().optional(),
  is_conversion: z.boolean().optional(),
  created_at: z.date()
})

type CreateMovementForm = z.infer<typeof createMovementSchema>

interface Movement {
  id: string
  description: string
  amount: number
  created_at: string
  created_by: string
  organization_id: string
  project_id: string
  type_id: string
  category_id: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  file_url?: string
  is_conversion: boolean
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { data: userData, isLoading: userLoading } = useCurrentUser()
  const queryClient = useQueryClient()
  
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers(organizationId)
  const { data: types = [], isLoading: typesLoading } = useMovementConcepts('parent')
  const { data: currencies = [], isLoading: currenciesLoading } = useCurrencies(organizationId)
  const { data: wallets = [], isLoading: walletsLoading } = useWallets(organizationId)

  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  // Check if all data is loaded
  const isDataLoading = userLoading || membersLoading || typesLoading || currenciesLoading || walletsLoading
  const hasRequiredData = userData && organizationId && projectId

  // Filter categories and subcategories based on selections
  const categories = types.find(type => type.id === selectedTypeId)?.children || []
  const subcategories = categories.find(category => category.id === selectedCategoryId)?.children || []

  // Get default values from organization preferences
  const defaultCurrency = currencies.find((c: any) => c.is_default)
  const defaultWallet = wallets.find((w: any) => w.is_default)
  const currentUser = members.find(member => member.user_id === userData?.user?.id)

  const form = useForm<CreateMovementForm>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      created_at: new Date(),
      created_by: '',
      description: '',
      amount: 0,
      type_id: '',
      category_id: '',
      subcategory_id: '',
      currency_id: '',
      wallet_id: '',
      file_url: '',
      is_conversion: false,
    }
  })

  // Initialize form when data is loaded
  useEffect(() => {
    if (!open || isDataLoading || !hasRequiredData) return

    if (editingMovement) {
      // Edit mode: populate with existing data
      const typeId = editingMovement.type_id || ''
      const categoryId = editingMovement.category_id || ''
      
      setSelectedTypeId(typeId)
      setSelectedCategoryId(categoryId)
      
      // Use setTimeout to ensure all data is ready
      setTimeout(() => {
        const formData = {
          created_at: new Date(editingMovement.created_at),
          created_by: editingMovement.created_by || '',
          description: editingMovement.description || '',
          amount: editingMovement.amount || 0,
          type_id: typeId,
          category_id: categoryId,
          subcategory_id: editingMovement.subcategory_id || '',
          currency_id: editingMovement.currency_id || '',
          wallet_id: editingMovement.wallet_id || '',
          file_url: editingMovement.file_url || '',
          is_conversion: editingMovement.is_conversion || false,
        }
        
        console.log('Setting form data for edit:', formData)
        
        form.reset(formData)
        
        // Force update specific fields that might not update correctly
        Object.keys(formData).forEach(key => {
          form.setValue(key as keyof CreateMovementForm, formData[key as keyof typeof formData])
        })
        
        console.log('Edit form initialized with all values set')
      }, 200)
    } else {
      // Create mode: use defaults
      setSelectedTypeId('')
      setSelectedCategoryId('')
      
      const defaultCurrencyId = defaultCurrency?.currency?.id || defaultCurrency?.currency_id || ''
      const defaultWalletId = defaultWallet?.wallet?.id || defaultWallet?.wallet_id || ''
      
      form.reset({
        created_at: new Date(),
        created_by: currentUser?.id || '',
        description: '',
        amount: 0,
        type_id: '',
        category_id: '',
        subcategory_id: '',
        currency_id: defaultCurrencyId,
        wallet_id: defaultWalletId,
        file_url: '',
        is_conversion: false,
      })
      
      console.log('Create form initialized with defaults')
    }
  }, [open, editingMovement, isDataLoading, hasRequiredData, defaultCurrency, defaultWallet, currentUser, form])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTypeId('')
      setSelectedCategoryId('')
      form.reset()
    }
  }, [open, form])

  const createMovementMutation = useMutation({
    mutationFn: async (formData: CreateMovementForm) => {
      if (!organizationId || !projectId) {
        throw new Error('Organization and project must be selected')
      }

      if (editingMovement) {
        // Update existing movement
        const { error } = await supabase
          .from('movements')
          .update({
            description: formData.description || null,
            amount: formData.amount,
            type_id: formData.type_id || null,
            category_id: formData.category_id || null,
            subcategory_id: formData.subcategory_id || null,
            currency_id: formData.currency_id,
            wallet_id: formData.wallet_id,
            is_conversion: formData.is_conversion || false,
          })
          .eq('id', editingMovement.id)

        if (error) {
          console.error('Error updating movement:', error)
          throw new Error('Failed to update movement')
        }

        console.log('Movement updated successfully')
      } else {
        // Create new movement
        const movementData = {
          description: formData.description || null,
          amount: formData.amount,
          type_id: formData.type_id || null,
          category_id: formData.category_id || null,
          subcategory_id: formData.subcategory_id || null,
          currency_id: formData.currency_id,
          wallet_id: formData.wallet_id,
          created_by: formData.created_by,
          file_url: formData.file_url || null,
          is_conversion: formData.is_conversion || false,
          created_at: formData.created_at.toISOString(),
          organization_id: organizationId,
          project_id: projectId
        }

        const { error, data } = await supabase
          .from('movements')
          .insert([movementData])
          .select()

        if (error) {
          console.error('Error creating movement:', error)
          throw new Error('Failed to create movement')
        }

        console.log('Movement created successfully:', data)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingMovement ? "Movimiento actualizado correctamente" : "Movimiento creado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements', organizationId, projectId] })
      onClose()
    },
    onError: (error: any) => {
      console.error('Error processing movement:', error)
      toast({
        title: "Error",
        description: editingMovement ? "No se pudo actualizar el movimiento" : "No se pudo crear el movimiento",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = async () => {
    console.log('Handle submit called')
    
    // Trigger form validation
    const isValid = await form.trigger()
    console.log('Form validation result:', isValid)
    console.log('Form errors:', form.formState.errors)
    console.log('Form values:', form.getValues())
    
    if (!isValid) {
      console.log('Form validation failed, not submitting')
      return
    }
    
    const data = form.getValues()
    console.log('Submitting movement data:', data)
    
    createMovementMutation.mutate(data)
  }

  const selectedMember = members.find(member => member.id === form.watch('created_by'))

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId)
    setSelectedCategoryId('')
    form.setValue('type_id', typeId)
    form.setValue('category_id', '')
    form.setValue('subcategory_id', '')
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    form.setValue('category_id', categoryId)
    form.setValue('subcategory_id', '')
  }

  const header = (
    <CustomModalHeader
      title={editingMovement ? 'Editar movimiento' : 'Crear movimiento'}
      description={editingMovement ? 'Actualiza la información del movimiento' : 'Crea un nuevo movimiento financiero'}
    />
  )

  const body = (
    <CustomModalBody padding="md">
      <Form {...form}>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 1. Fecha */}
            <FormField
              control={form.control}
              name="created_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Creador */}
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Creador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar creador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.user?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{member.user?.full_name || member.user?.email}</span>
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

          <div className="grid grid-cols-2 gap-4">
            {/* 3. Tipo */}
            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                  <Select onValueChange={handleTypeChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {types.map((type: any) => (
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

            {/* 4. Categoría */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Categoría</FormLabel>
                  <Select onValueChange={handleCategoryChange} value={field.value || ''} disabled={!selectedTypeId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 5. Subcategoría */}
            <FormField
              control={form.control}
              name="subcategory_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Subcategoría</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={!selectedCategoryId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar subcategoría" />
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

            {/* 6. Moneda */}
            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Moneda</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency: any) => (
                        <SelectItem key={currency.id} value={currency.currency?.id || currency.currency_id}>
                          {currency.currency?.name} ({currency.currency?.code}){currency.is_default ? " (Por defecto)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 7. Billetera */}
            <FormField
              control={form.control}
              name="wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Billetera</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar billetera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map((wallet: any) => (
                        <SelectItem key={wallet.id} value={wallet.wallet?.id || wallet.wallet_id}>
                          {wallet.wallet?.name}{wallet.is_default ? " (Por defecto)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 8. Cantidad */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Cantidad</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 9. Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe el movimiento..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 10. Archivo */}
          <FormField
            control={form.control}
            name="file_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Archivo</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://ejemplo.com/archivo.pdf"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 11. Es conversión */}
          <FormField
            control={form.control}
            name="is_conversion"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium">
                    Es una conversión de moneda
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </CustomModalBody>
  )

  // Show loading state while data is being fetched
  if (isDataLoading || !hasRequiredData) {
    return (
      <CustomModalLayout open={open} onClose={onClose}>
        {{
          header: (
            <CustomModalHeader
              title={editingMovement ? 'Editar movimiento' : 'Crear movimiento'}
              description="Cargando información..."
            />
          ),
          body: (
            <CustomModalBody padding="md">
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-muted-foreground">Cargando datos...</div>
              </div>
            </CustomModalBody>
          ),
          footer: (
            <CustomModalFooter
              onCancel={onClose}
              onSave={() => {}}
              saveText="Cargando..."
              saveLoading={true}
            />
          )
        }}
      </CustomModalLayout>
    )
  }

  const footer = (
    <CustomModalFooter
      onCancel={onClose}
      onSave={handleSubmit}
      saveText={editingMovement ? 'Actualizar' : 'Crear movimiento'}
      saveLoading={createMovementMutation.isPending}
    />
  )

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  )
}