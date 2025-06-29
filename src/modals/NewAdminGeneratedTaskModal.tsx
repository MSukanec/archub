import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Button } from '@/components/ui/button'

interface GeneratedTask {
  id: string
  code: string
  template_id: string
  param_values: any
  description: string
  created_by: string
  is_public: boolean
  created_at: string
}

interface NewAdminGeneratedTaskModalProps {
  open: boolean
  onClose: () => void
  generatedTask?: GeneratedTask | null
}

export function NewAdminGeneratedTaskModal({ 
  open, 
  onClose, 
  generatedTask 
}: NewAdminGeneratedTaskModalProps) {
  const isEditing = !!generatedTask

  const handleSubmit = async () => {
    // Placeholder for future implementation
    console.log('Submit generated task modal')
    onClose()
  }

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{
        header: (
          <CustomModalHeader
            title={isEditing ? "Editar Tarea Generada" : "Nueva Tarea Generada"}
            description={isEditing 
              ? "Modifica los datos de la tarea generada existente" 
              : "Crea una nueva tarea generada de manera paramétrica"
            }
            onClose={onClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                El formulario de tareas generadas estará disponible próximamente.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta funcionalidad permitirá crear tareas de obra de manera paramétrica.
              </p>
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={onClose}
            onSave={handleSubmit}
            saveText={isEditing ? "Actualizar Tarea Generada" : "Crear Tarea Generada"}
            saveDisabled={true}
          />
        )
      }}
    </CustomModalLayout>
  )
}