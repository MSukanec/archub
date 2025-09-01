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
import { useQueryClient } from '@tanstack/react-query'
import { useCreateIndirectCost, useUpdateIndirectCost, useIndirectCost } from '@/hooks/use-indirect-costs'
import { useMovementConcepts } from '@/hooks/use-movement-concepts'

// Schema de validación
const indirectSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category_id: z.string().optional()
})

type IndirectForm = z.infer<typeof indirectSchema>

// UUID del concepto padre para Indirectos
const INDIRECT_PARENT_UUID = 'e854de08-da8f-4769-a2c5-b24b622f20b0'

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
  const { data: existingIndirect } = useIndirectCost(isEditing ? modalData?.indirectId || null : null)
  
  // Fetch movement concepts for categories (children of Indirectos concept)
  const { data: indirectCategories = [] } = useMovementConcepts('categories', INDIRECT_PARENT_UUID)


  const form = useForm<IndirectForm>({
    resolver: zodResolver(indirectSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: ''
    }
  })

  // Reset form when existing data is loaded
  useEffect(() => {
    if (existingIndirect) {
      form.setValue('name', existingIndirect.name || '')
      form.setValue('description', existingIndirect.description || '')
      form.setValue('category_id', (existingIndirect as any).category_id || '')
    }
  }, [existingIndirect, form])

  const createIndirectCost = useCreateIndirectCost()
  const updateIndirectCost = useUpdateIndirectCost()

  const onSubmit = async (data: IndirectForm) => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Faltan datos de organización',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && modalData?.indirectId) {
        // Modo edición
        await updateIndirectCost.mutateAsync({
          indirectCostId: modalData.indirectId,
          indirectCost: {
            name: data.name,
            description: data.description || undefined,
            category_id: data.category_id || undefined
          }
        })
      } else {
        // Modo creación
        await createIndirectCost.mutateAsync({
          indirectCost: {
            organization_id: organizationId,
            name: data.name,
            description: data.description || undefined,
            category_id: data.category_id || undefined
          }
        })
      }
      
      onClose()
    } catch (error) {
      console.error('Error saving indirect cost:', error)
      // Los hooks ya manejan el toast de error
    } finally {
      setIsSubmitting(false)
    }
  }

  const editPanel = (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Categoría */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {indirectCategories.map((category) => (
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
      submitDisabled={isSubmitting}
      showLoadingSpinner={isSubmitting}
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