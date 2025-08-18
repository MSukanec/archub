import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DollarSign } from 'lucide-react'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMovementConcepts } from '@/hooks/use-organization-movement-concepts'

// Schema de validación para el formulario
const movementFormSchema = z.object({
  movement_date: z.date(),
  type_id: z.string().min(1, 'Tipo de movimiento es requerido'),
  description: z.string().optional()
})

type MovementForm = z.infer<typeof movementFormSchema>

interface MovementModalProps {
  modalData?: {
    editingMovement?: any
  }
  onClose: () => void
}

export default function MovementModal({ modalData, onClose }: MovementModalProps) {
  const editingMovement = modalData?.editingMovement
  
  // Hooks para datos
  const { data: userData } = useCurrentUser()
  const { data: organizationConcepts, isLoading: isConceptsLoading } = useOrganizationMovementConcepts(userData?.organization?.id)

  // Configuración del formulario
  const form = useForm<MovementForm>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      movement_date: editingMovement?.movement_date ? new Date(editingMovement.movement_date) : new Date(),
      type_id: editingMovement?.type_id || '',
      description: editingMovement?.description || ''
    }
  })

  // Preparar opciones de tipos de movimiento
  const movementTypeOptions = React.useMemo(() => {
    if (!organizationConcepts) return []
    
    return organizationConcepts
      .filter((concept: any) => !concept.parent_id) // Solo conceptos principales (tipos)
      .map((concept: any) => ({
        label: concept.name,
        value: concept.id
      }))
  }, [organizationConcepts])

  // Función para manejar el envío del formulario
  const onSubmit = (data: MovementForm) => {
    console.log('Datos del formulario:', data)
    // Aquí irá la lógica para guardar el movimiento
    onClose()
  }

  // Función para manejar el cierre del modal
  const handleClose = () => {
    form.reset()
    onClose()
  }

  // Contenido del header
  const headerContent = (
    <FormModalHeader
      title={editingMovement ? "Editar Movimiento" : "Nuevo Movimiento"}
      icon={DollarSign}
    />
  )

  // Contenido del footer
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={editingMovement ? "Actualizar" : "Guardar"}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={false}
    />
  )

  // Formatear fecha para el input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {headerContent}
      
      <div className="px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo de Fecha */}
            <FormField
              control={form.control}
              name="movement_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value ? formatDateForInput(field.value) : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Tipo de Movimiento */}
            <FormField
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimiento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {movementTypeOptions.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Descripción */}
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
          </form>
        </Form>
      </div>

      {footerContent}
    </div>
  )
}