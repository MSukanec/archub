import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { ModalData } from "@/components/modal/form/types";
import { Link, Trash2 } from "lucide-react";
import { useDeleteConstructionDependency } from "@/hooks/use-construction-dependencies";
import { toast } from "@/hooks/use-toast";

// Función para limpiar nombres de tareas eliminando códigos y variables
function cleanTaskName(name: string): string {
  if (!name) return 'Tarea sin nombre'
  
  // Eliminar códigos al inicio (ej: "RPE-000001: ")
  let cleanedName = name.replace(/^[A-Z]{2,4}-[0-9]{6}:\s*/, '')
  
  // Eliminar variables template (ej: "{{aditivos}}", "{{mortar_type}}")
  cleanedName = cleanedName.replace(/\{\{[^}]*\}\}\.?/g, '')
  
  // Eliminar puntos sobrantes al final
  cleanedName = cleanedName.replace(/\.\s*$/, '')
  
  // Limpiar espacios múltiples y trim
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim()
  
  return cleanedName || 'Tarea sin nombre'
}

interface DependencyConnectionModalProps {
  modalData: ModalData;
  onClose: () => void;
}

export function DependencyConnectionModal({ modalData, onClose }: DependencyConnectionModalProps) {
  const deleteDependency = useDeleteConstructionDependency();
  
  // Extraer datos de la dependencia del modalData
  const dependency = modalData?.dependency;
  const predecessorTask = dependency?.predecessor_task?.task;
  const successorTask = dependency?.successor_task?.task;
  
  if (!dependency || !predecessorTask || !successorTask) {
    return null;
  }

  const handleDeleteConnection = async () => {
    try {
      await deleteDependency.mutateAsync(dependency.id);
      toast({
        title: "Conexión eliminada",
        description: "La dependencia entre tareas ha sido eliminada correctamente",
      });
      onClose();
    } catch (error) {
      console.error('Error deleting dependency:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la conexión. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const viewPanel = (
        Esta conexión establece una dependencia entre las siguientes tareas:
      </div>
      
            Tarea Predecesora
          </div>
            {cleanTaskName(predecessorTask.display_name)}
          </div>
        </div>
        
          </div>
        </div>
        
            Tarea Sucesora
          </div>
            {cleanTaskName(successorTask.display_name)}
          </div>
        </div>
      </div>
      
      {dependency.lag_days > 0 && (
            Días de Retraso
          </div>
            {dependency.lag_days} día{dependency.lag_days !== 1 ? 's' : ''} adicional{dependency.lag_days !== 1 ? 'es' : ''} de espera
          </div>
        </div>
      )}
    </div>
  );

  const editPanel = viewPanel; // Mismo contenido para ambos paneles

  const headerContent = (
    <FormModalHeader 
      icon={Link}
    />
  );

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={onClose}
      submitText="Eliminar Conexión"
      onSubmit={handleDeleteConnection}
      submitVariant="destructive"
      submitDisabled={deleteDependency.isPending}
      showLoadingSpinner={deleteDependency.isPending}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}