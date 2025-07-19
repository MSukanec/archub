import { FormModalLayout } from "@/components/modal/form/FormModalLayout"
import { FormModalHeader } from "@/components/modal/form/FormModalHeader"
import { FormModalFooter } from "@/components/modal/form/FormModalFooter"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"

// Schema de validación para la tarea
const taskSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  status: z.string().min(1, "El estado es requerido"),
  priority: z.string().min(1, "La prioridad es requerida"),
  estimated_hours: z.string().optional(),
  assigned_to: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface ConstructionTaskFormModalProps {
  modalData?: {
    open?: boolean
    editingTask?: any
  }
  onClose: () => void
}

export function ConstructionTaskFormModal({ modalData, onClose }: ConstructionTaskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!modalData?.editingTask

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: modalData?.editingTask?.name || "",
      description: modalData?.editingTask?.description || "",
      status: modalData?.editingTask?.status || "pendiente",
      priority: modalData?.editingTask?.priority || "media",
      estimated_hours: modalData?.editingTask?.estimated_hours?.toString() || "",
      assigned_to: modalData?.editingTask?.assigned_to || "",
    }
  })

  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      // TODO: Implementar la lógica de guardado aquí
      console.log("Task data:", data)
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onClose()
    } catch (error) {
      console.error("Error saving task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewPanel = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground">Nombre de la Tarea</label>
        <p className="text-sm">{modalData?.editingTask?.name || "Sin nombre"}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground">Descripción</label>
        <p className="text-sm">{modalData?.editingTask?.description || "Sin descripción"}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Estado</label>
          <p className="text-sm">{modalData?.editingTask?.status || "Sin estado"}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Prioridad</label>
          <p className="text-sm">{modalData?.editingTask?.priority || "Sin prioridad"}</p>
        </div>
      </div>
    </div>
  )

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Tarea *</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Instalación de estructura metálica" {...field} />
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
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe los detalles de la tarea..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="pausada">Pausada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridad *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar prioridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas Estimadas</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ej: 8" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asignado a</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del responsable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Tarea" : "Nueva Tarea de Construcción"}
      icon={CheckSquare}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear Tarea"}
      onRightClick={form.handleSubmit(handleSubmit)}
      rightLoading={isSubmitting}
      rightDisabled={isSubmitting}
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