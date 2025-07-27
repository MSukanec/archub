import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

import { Zap } from 'lucide-react'

interface ParametricTaskFormModalProps {
  modalData: {
    isEditing?: boolean
    task?: any
  }
  onClose: () => void
}

const parametricTaskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  parameter_config: z.object({}).passthrough(), // Configuración de parámetros
  is_public: z.boolean().default(true),
  is_system: z.boolean().default(false),
})

type ParametricTaskForm = z.infer<typeof parametricTaskSchema>

export function ParametricTaskFormModal({ modalData, onClose }: ParametricTaskFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { task } = modalData
  const isEditing = !task // Si no hay task, es creación (modo edición)

  const form = useForm<ParametricTaskForm>({
    resolver: zodResolver(parametricTaskSchema),
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      parameter_config: task?.parameter_config || {},
      is_public: task?.is_public ?? true,
      is_system: task?.is_system ?? false,
    },
  })

  const handleSubmit = async (data: ParametricTaskForm) => {
    setIsLoading(true)
    try {
      console.log('🔧 Creando tarea paramétrica:', data)
      
      // Aquí iría la lógica para crear la tarea paramétrica
      // Por ahora solo simulo el proceso
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Tarea paramétrica creada",
        description: "La tarea paramétrica se ha creado correctamente.",
      })
      
      onClose()
    } catch (error) {
      console.error('Error creando tarea paramétrica:', error)
      toast({
        title: "Error",
        description: "Hubo un error al crear la tarea paramétrica.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Nombre</Label>
        <p className="text-sm text-muted-foreground mt-1">{task?.name || 'Sin nombre'}</p>
      </div>
      <div>
        <Label className="text-sm font-medium">Descripción</Label>
        <p className="text-sm text-muted-foreground mt-1">{task?.description || 'Sin descripción'}</p>
      </div>
      <div>
        <Label className="text-sm font-medium">Configuración</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {Object.keys(task?.parameter_config || {}).length} parámetros configurados
        </p>
      </div>
    </div>
  )

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la tarea</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Instalación de {{tipo-de-elemento}}"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descripción detallada de la tarea paramétrica..."
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Pública</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Visible para todos los usuarios
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_system"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Sistema</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Tarea generada por el sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Configuración Paramétrica
              </Label>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Aquí se configurarán los parámetros dinámicos que definirán el comportamiento de la tarea.
              Por ejemplo: tipo de elemento, materiales, dimensiones, etc.
            </p>
          </div>
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Nueva Tarea Paramétrica" : "Ver Tarea Paramétrica"}
      icon={Zap}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Crear Tarea" : "Cerrar"}
      onRightClick={isEditing ? form.handleSubmit(handleSubmit) : onClose}
      rightLoading={isLoading}
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
      isEditing={isEditing}
    />
  )
}