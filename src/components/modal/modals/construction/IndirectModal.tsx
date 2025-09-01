import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Schema de validación
const indirectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit_id: z.string().min(1, 'La unidad es requerida')
})

type IndirectForm = z.infer<typeof indirectSchema>

interface IndirectModalProps {
  modalData?: {
    projectId?: string
    organizationId?: string
    userId?: string
    isEditing?: boolean
    indirectId?: string
    indirect?: any
  }
  onClose: () => void
}

export function IndirectModal({ modalData, onClose }: IndirectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const queryClient = useQueryClient()

  const projectId = modalData?.projectId || userData?.preferences?.last_project_id
  const organizationId = modalData?.organizationId || userData?.organization?.id
  const isEditing = modalData?.isEditing || false

  // Fetch existing indirect cost data if editing
  const { data: existingIndirect } = useQuery({
    queryKey: ['indirect-cost', modalData?.indirectId],
    queryFn: async () => {
      if (!modalData?.indirectId || !supabase) return null
      
      const { data, error } = await supabase
        .from('indirect_costs')
        .select('*')
        .eq('id', modalData.indirectId)
        .single()

      if (error) throw error
      return data
    },
    enabled: isEditing && !!modalData?.indirectId
  })

  // Fetch available units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) return []
      
      const { data, error } = await supabase
        .from('units')
        .select('id, name, symbol')
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  const form = useForm<IndirectForm>({
    resolver: zodResolver(indirectSchema),
    defaultValues: {
      name: '',
      description: '',
      unit_id: ''
    }
  })

  // Reset form when existing data is loaded
  useEffect(() => {
    if (existingIndirect) {
      form.setValue('name', existingIndirect.name || '')
      form.setValue('description', existingIndirect.description || '')
      form.setValue('unit_id', existingIndirect.unit_id || '')
    }
  }, [existingIndirect, form])

  const onSubmit = async (data: IndirectForm) => {
    if (!organizationId || !projectId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización o proyecto',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && modalData?.indirectId) {
        // Modo edición
        const { error } = await supabase
          .from('indirect_costs')
          .update({
            name: data.name,
            description: data.description || null,
            unit_id: data.unit_id
          })
          .eq('id', modalData.indirectId)

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Costo indirecto actualizado correctamente'
        })
      } else {
        // Modo creación
        const { error } = await supabase
          .from('indirect_costs')
          .insert({
            organization_id: organizationId,
            project_id: projectId,
            name: data.name,
            description: data.description || null,
            unit_id: data.unit_id
          })

        if (error) throw error

        toast({
          title: 'Éxito',
          description: 'Costo indirecto creado correctamente'
        })
      }

      // Invalidar cache para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['indirect-costs'] })
      
      onClose()
    } catch (error) {
      console.error('Error saving indirect cost:', error)
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar el costo indirecto',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Nombre */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Gastos de oficina, Seguros, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción detallada del costo indirecto..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidad */}
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
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
    </div>
  )

  const headerContent = (
    <FormModalHeader
      title={isEditing ? 'Editar Costo Indirecto' : 'Nuevo Costo Indirecto'}
      icon={TrendingUp}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? 'Actualizar' : 'Crear'}
      onRightClick={form.handleSubmit(onSubmit)}
      isRightLoading={isSubmitting}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
    />
  )
}