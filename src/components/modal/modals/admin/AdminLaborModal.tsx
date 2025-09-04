import { useState, useEffect } from 'react'
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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUnits } from '@/hooks/use-units'
import { toast } from '@/hooks/use-toast'

import { Users } from 'lucide-react'

const laborTypeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit_id: z.string().optional(),
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
  const { data: units = [] } = useUnits()

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewLaborTypeData) => {
      const { error } = await supabase
        .from('labor_types')
        .insert(data)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-types'] })
      toast({
        title: "Tipo de mano de obra creado",
        description: "El tipo de mano de obra ha sido creado correctamente.",
      })
    },
    onError: (error) => {
      console.error('Error creating labor type:', error)
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
      queryClient.invalidateQueries({ queryKey: ['labor-types'] })
      toast({
        title: "Tipo de mano de obra actualizado",
        description: "El tipo de mano de obra ha sido actualizado correctamente.",
      })
    },
    onError: (error) => {
      console.error('Error updating labor type:', error)
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el tipo de mano de obra.",
        variant: "destructive",
      })
    }
  })

  // Force edit mode when modal opens
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
    },
  })

  // Load editing data
  useEffect(() => {
    if (editingLaborType) {
      form.reset({
        name: isDuplicating ? `${editingLaborType.name} (Copia)` : editingLaborType.name,
        description: editingLaborType.description || '',
        unit_id: editingLaborType.unit_id || '',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        unit_id: '',
      })
    }
  }, [editingLaborType, isDuplicating, form])

  const onSubmit = async (data: z.infer<typeof laborTypeSchema>) => {
    setIsLoading(true)
    
    try {
      if (isEditing && editingLaborType) {
        await updateMutation.mutateAsync({
          id: editingLaborType.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            unit_id: data.unit_id || undefined,
          }
        })
      } else {
        // Creating or duplicating
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description || undefined,
          unit_id: data.unit_id || undefined,
          organization_id: null, // Como especificaste
          is_system: true, // Como especificaste
        })
      }
      
      onClose()
      form.reset()
    } catch (error) {
      console.error('Error saving labor type:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Unit */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una unidad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}