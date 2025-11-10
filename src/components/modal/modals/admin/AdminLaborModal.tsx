import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CurrencyAmountField } from '@/components/ui-custom/fields/CurrencyAmountField'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUnits } from '@/hooks/use-units'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useCurrentUser } from '@/hooks/use-current-user'
import { toast } from '@/hooks/use-toast'

import { Users } from 'lucide-react'

const laborTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit_id: z.string().optional(),
  unit_price: z.number().optional(),
  currency_id: z.string().optional(),
})

interface LaborType {
  id: string
  name: string
  description: string | null
  unit_id: string | null
  is_system: boolean
  created_at: string
  updated_at: string | null
}

interface NewLaborTypeData {
  name: string
  description?: string
  unit_id?: string
  organization_id?: string | null
  is_system?: boolean
}

interface LaborPriceData {
  labor_id: string
  organization_id: string
  currency_id: string
  unit_price: number
  valid_from: string
  valid_to: string | null
}

interface AdminLaborModalProps {
  modalData: {
    editingLaborType?: LaborType | null
    isDuplicating?: boolean
  }
  onClose: () => void
}

export function AdminLaborModal({ modalData, onClose }: AdminLaborModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingLaborType, isDuplicating } = modalData
  const isEditing = !!editingLaborType && !isDuplicating
  
  // Hooks
  const queryClient = useQueryClient()
  const { setPanel } = useModalPanelStore()
  const { data: units = [], isSuccess: unitsLoaded } = useUnits()
  const { data: userData, isSuccess: userLoaded } = useCurrentUser()
  const { data: organizationCurrencies = [], isSuccess: currenciesLoaded } = useOrganizationCurrencies(userData?.organization?.id)
  
  // Check if user is admin to allow editing system labor types (use useMemo to ensure proper timing)
  const isAdmin = React.useMemo(() => {
    return userData?.role?.name === 'Administrador' || userData?.role?.name === 'Admin'
  }, [userData?.role?.name])
  
  const isSystemLabor = React.useMemo(() => {
    return (editingLaborType?.is_system || false) && !isAdmin
  }, [editingLaborType?.is_system, isAdmin])
  
  // Map currencies for CurrencyAmountField
  const currencyOptions = organizationCurrencies.map(oc => ({
    id: oc.currency.id,
    name: oc.currency.name,
    symbol: oc.currency.symbol
  }))

  // Get existing labor price
  const { data: existingLaborPrice, isSuccess: laborPriceLoaded } = useQuery({
    queryKey: ['labor-price', editingLaborType?.id, userData?.organization?.id],
    queryFn: async () => {
      if (!editingLaborType?.id || !userData?.organization?.id) return null
      
      const { data, error } = await supabase
        .from('labor_prices')
        .select('*')
        .eq('labor_id', editingLaborType.id)
        .eq('organization_id', userData.organization.id)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
      return data
    },
    enabled: !!editingLaborType?.id && !!userData?.organization?.id
  })

  // Create labor price mutation
  const createLaborPriceMutation = useMutation({
    mutationFn: async (data: LaborPriceData) => {
      const { error } = await supabase
        .from('labor_prices')
        .insert(data)
      
      if (error) throw error
    }
  })

  // Update labor price mutation
  const updateLaborPriceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LaborPriceData> }) => {
      const { error } = await supabase
        .from('labor_prices')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    }
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewLaborTypeData) => {
      const { data: insertedData, error } = await supabase
        .from('labor_types')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return insertedData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-view'] })
      toast({
        title: "Tipo de mano de obra creado",
        description: "El tipo de mano de obra ha sido creado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al crear",
        description: "No se pudo crear el tipo de mano de obra.",
        variant: "destructive",
      })
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewLaborTypeData> }) => {
      const { error } = await supabase
        .from('labor_types')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-view'] })
      toast({
        title: "Tipo de mano de obra actualizado",
        description: "El tipo de mano de obra ha sido actualizado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el tipo de mano de obra.",
        variant: "destructive",
      })
    }
  })

  // Check if required data is ready for rendering
  const isDataReady = userLoaded && unitsLoaded && (!userData?.organization?.id || currenciesLoaded)
  
  // Force edit mode when modal opens (backup to isEditing prop)
  useEffect(() => {
    setPanel('edit')
  }, [setPanel])

  // Form setup
  const form = useForm<z.infer<typeof laborTypeSchema>>({
    resolver: zodResolver(laborTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      unit_id: '',
      unit_price: undefined,
      currency_id: currencyOptions.length > 0 ? currencyOptions[0].id : '',
    },
  })

  // Set default currency when currencies are loaded
  React.useEffect(() => {
    if (currencyOptions.length > 0 && !form.getValues('currency_id')) {
      form.setValue('currency_id', currencyOptions[0].id)
    }
  }, [currencyOptions, form])

  // Load editing data
  useEffect(() => {
    if (editingLaborType) {
      form.reset({
        name: isDuplicating ? `${editingLaborType.name} (Copia)` : editingLaborType.name,
        description: editingLaborType.description || '',
        unit_id: editingLaborType.unit_id || '',
        unit_price: existingLaborPrice?.unit_price || undefined,
        currency_id: existingLaborPrice?.currency_id || '',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        unit_id: '',
        unit_price: undefined,
        currency_id: '',
      })
    }
  }, [editingLaborType, isDuplicating, form, existingLaborPrice])

  const onSubmit = async (data: z.infer<typeof laborTypeSchema>) => {
    setIsLoading(true)
    
    try {
      let laborTypeId: string
      
      if (isEditing && editingLaborType) {
        // Update labor type (admins can edit system types, others cannot)
        if (!isSystemLabor) {
          await updateMutation.mutateAsync({
            id: editingLaborType.id,
            data: {
              name: data.name,
              description: data.description || undefined,
              unit_id: data.unit_id || undefined,
            }
          })
        }
        laborTypeId = editingLaborType.id
      } else {
        // Create new labor type
        const newLaborType = await createMutation.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          unit_id: data.unit_id || undefined,
          organization_id: null,
          is_system: true,
        })
        laborTypeId = newLaborType.id
      }
      
      // Handle labor price if provided
      if (data.unit_price && data.currency_id && data.currency_id !== '' && userData?.organization?.id) {
        const priceData: LaborPriceData = {
          labor_id: laborTypeId,
          organization_id: userData.organization.id,
          currency_id: data.currency_id,
          unit_price: data.unit_price,
          valid_from: new Date().toISOString().split('T')[0],
          valid_to: null
        }
        
        if (existingLaborPrice) {
          // Update existing price
          await updateLaborPriceMutation.mutateAsync({
            id: existingLaborPrice.id,
            data: priceData
          })
        } else {
          // Create new price
          await createLaborPriceMutation.mutateAsync(priceData)
        }
        
        // Invalidate labor view queries after price changes
        queryClient.invalidateQueries({ queryKey: ['labor-view'] })
        queryClient.invalidateQueries({ queryKey: ['labor-price'] })
      }
      
      onClose()
      form.reset()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="space-y-4"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            form.handleSubmit(onSubmit)()
          }
        }}
      >
        {/* Labor Type Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Tipo de Mano de Obra *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Albañil, Electricista, Plomero..."
                  disabled={isSystemLabor}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción del tipo de mano de obra..."
                  className="min-h-[80px]"
                  disabled={isSystemLabor}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Unit and Cost - Desktop inline layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isSystemLabor}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.description || unit.symbol})
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
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo</FormLabel>
                <FormControl>
                  <CurrencyAmountField
                    value={field.value || 0}
                    currency={form.watch('currency_id') || ''}
                    currencies={currencyOptions}
                    onValueChange={field.onChange}
                    onCurrencyChange={(currency) => {
                      form.setValue('currency_id', currency)
                    }}
                    placeholder={currenciesLoaded ? "Ingresa el costo por unidad" : "Cargando monedas..."}
                    disabled={!currenciesLoaded && !!userData?.organization?.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )

  const getTitle = () => {
    if (isDuplicating) return "Duplicar Tipo de Mano de Obra"
    if (isEditing) return "Editar Tipo de Mano de Obra"
    return "Nuevo Tipo de Mano de Obra"
  }

  const getButtonLabel = () => {
    if (isDuplicating) return "Duplicar"
    if (isEditing) return "Actualizar"
    return "Crear"
  }

  const headerContent = (
    <FormModalHeader 
      title={getTitle()}
      icon={Users}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={getButtonLabel()}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={isDataReady ? editPanel : null}
      stepContent={!isDataReady ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Cargando datos del formulario...</div>
        </div>
      ) : undefined}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}