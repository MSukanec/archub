import React, { useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // Get categories based on selected type
  const { data: categories = [] } = useMovementConcepts('categories', selectedTypeId || undefined)
  const { data: subcategories = [] } = useMovementConcepts('categories', selectedCategoryId || undefined)

  // Check if all data is loaded
  const isDataLoading = userLoading || membersLoading || typesLoading || currenciesLoading || walletsLoading

  const form = useForm<CreateMovementForm>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      created_at: new Date(),
      amount: 0,
      description: '',
      file_url: '',
      is_conversion: false,
      created_by: userData?.memberships?.[0]?.id || ''
    }
  })

  // Initialize form with current user and defaults
  useEffect(() => {
    if (!editingMovement && open && userData && members.length > 0 && currencies.length > 0 && wallets.length > 0) {
      console.log('Setting form defaults for new movement...')
      
      // Set creator to current user's membership
      const currentUserMembership = members.find(member => 
        member.users?.id === userData.user?.id
      );
      
      if (currentUserMembership) {
        form.setValue('created_by', currentUserMembership.id)
        console.log('Creator set to current user:', currentUserMembership.id, currentUserMembership.users?.full_name)
      }
      
      // Set default currency (first available or default)
      const defaultCurrency = currencies.find(c => (c as any).is_default) || currencies[0]
      if (defaultCurrency) {
        form.setValue('currency_id', defaultCurrency.currency_id)
        console.log('Currency set to:', defaultCurrency.currency_id)
      }
      
      // Set default wallet (first available or default)
      const defaultWallet = wallets.find(w => (w as any).is_default) || wallets[0]
      if (defaultWallet) {
        form.setValue('wallet_id', defaultWallet.wallet_id)
        console.log('Wallet set to:', defaultWallet.wallet_id)
      }
    }
  }, [userData, members, currencies, wallets, editingMovement, form, open])

  // Initialize form for editing
  useEffect(() => {
    if (editingMovement && open) {
      form.setValue('created_at', new Date(editingMovement.created_at))
      form.setValue('created_by', editingMovement.created_by)
      form.setValue('description', editingMovement.description || '')
      form.setValue('amount', editingMovement.amount)
      form.setValue('type_id', editingMovement.type_id || '')
      form.setValue('category_id', editingMovement.category_id || '')
      form.setValue('subcategory_id', editingMovement.subcategory_id || '')
      form.setValue('currency_id', editingMovement.currency_id)
      form.setValue('wallet_id', editingMovement.wallet_id)
      form.setValue('file_url', editingMovement.file_url || '')
      form.setValue('is_conversion', editingMovement.is_conversion || false)
      
      setSelectedTypeId(editingMovement.type_id || '')
      setSelectedCategoryId(editingMovement.category_id || '')
    }
  }, [editingMovement, open, form])

  // Handle type selection change
  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value)
    form.setValue('type_id', value)
    // Reset category and subcategory when type changes
    form.setValue('category_id', '')
    form.setValue('subcategory_id', '')
    setSelectedCategoryId('')
  }

  // Handle category selection change
  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value)
    form.setValue('category_id', value)
    // Reset subcategory when category changes
    form.setValue('subcategory_id', '')
  }

  const createMovementMutation = useMutation({
    mutationFn: async (data: CreateMovementForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const movementData = {
        description: data.description || null,
        amount: data.amount,
        created_at: data.created_at.toISOString(),
        created_by: data.created_by,
        organization_id: organizationId,
        project_id: projectId,
        type_id: data.type_id || null,
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        file_url: data.file_url || null,
        is_conversion: data.is_conversion || false
      }
      
      console.log('Movement data to insert:', movementData)

      const { error } = await supabase
        .from('movements')
        .insert([movementData])

      if (error) {
        throw new Error(`Error al crear movimiento: ${error.message}`)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento creado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      onClose()
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const updateMovementMutation = useMutation({
    mutationFn: async (data: CreateMovementForm) => {
      if (!supabase || !editingMovement) {
        throw new Error('Supabase client not initialized or no movement to edit')
      }

      const movementData = {
        description: data.description || null,
        amount: data.amount,
        created_at: data.created_at.toISOString(),
        created_by: data.created_by,
        type_id: data.type_id || null,
        category_id: data.category_id || null,
        subcategory_id: data.subcategory_id || null,
        currency_id: data.currency_id,
        wallet_id: data.wallet_id,
        file_url: data.file_url || null,
        is_conversion: data.is_conversion || false
      }

      const { error } = await supabase
        .from('movements')
        .update(movementData)
        .eq('id', editingMovement.id)

      if (error) {
        throw new Error(`Error al actualizar movimiento: ${error.message}`)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Movimiento actualizado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      onClose()
      form.reset()
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const onSubmit = (data: CreateMovementForm) => {
    if (editingMovement) {
      updateMovementMutation.mutate(data)
    } else {
      createMovementMutation.mutate(data)
    }
  }

  const isPending = createMovementMutation.isPending || updateMovementMutation.isPending

  if (!open) return null

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingMovement ? "Editar movimiento" : "Crear movimiento"}
            description="Crea un nuevo movimiento financiero"
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <Form {...form}>
              <form 
                onSubmit={form.handleSubmit(onSubmit)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    form.handleSubmit(onSubmit)()
                  }
                }}
                className="space-y-6"
              >
                {/* Primera fila: Fecha y Creador */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="created_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
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
                              locale={es}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={(member as any).users?.avatar_url} />
                                    <AvatarFallback className="text-xs">
                                      {((member as any).users?.full_name || (member as any).users?.email || 'U')[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{(member as any).users?.full_name || (member as any).users?.email}</span>
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

                {/* Segunda fila: Tipo y Categoría */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={handleTypeChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {types.map((type) => (
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
                        <Select onValueChange={handleCategoryChange} value={field.value} disabled={!selectedTypeId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
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

                {/* Tercera fila: Subcategoría y Moneda */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subcategory_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subcategoría</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar subcategoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subcategories.map((subcategory) => (
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
                            {currencies.map((currency) => (
                              <SelectItem key={currency.id} value={currency.currency_id}>
                                {(currency as any).currencies?.name} ({(currency as any).currencies?.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Cuarta fila: Billetera y Cantidad */}
                <div className="grid grid-cols-2 gap-4">
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
                            {wallets.map((wallet) => (
                              <SelectItem key={wallet.id} value={wallet.wallet_id}>
                                {(wallet as any).wallets?.name || 'Billetera'}
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
                        <FormLabel>Cantidad</FormLabel>
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
                </div>

                {/* Quinta fila: Descripción */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el movimiento..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sexta fila: Archivo */}
                <FormField
                  control={form.control}
                  name="file_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archivo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://ejemplo.com/archivo.pdf"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Checkbox: Es una conversión de moneda */}
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
                        <FormLabel>Es una conversión de moneda</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            cancelText="Cancelar"
            saveText={editingMovement ? "Actualizar movimiento" : "Crear movimiento"}
            onCancel={onClose}
            onSave={form.handleSubmit(onSubmit)}
            saveLoading={isPending}
          />
        )
      }}
    </CustomModalLayout>
  )
}