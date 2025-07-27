import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';

interface TaskParameterGroupAssignmentModalProps {
  modalData?: {
    group: any;
    parameterLabel: string;
  };
  onClose: () => void;
}

export function TaskParameterGroupAssignmentModal({ modalData, onClose }: TaskParameterGroupAssignmentModalProps) {
  const { group, parameterLabel } = modalData || {};
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Show deprecation message when modal opens
    toast({
      title: 'Funcionalidad eliminada',
      description: 'La gestión por grupos de opciones fue simplificada.',
      variant: 'destructive',
    });
    
    // Auto close after showing message
    setTimeout(() => {
      onClose();
    }, 2000);
  }, [toast, onClose]);

  const headerContent = {
    icon: Settings,
    title: `Gestión de Opciones - ${parameterLabel || 'Parámetro'}`,
    description: `Funcionalidad eliminada: ${group?.name || 'Grupo'}`,
  };

  const footerContent = {
    cancelLabel: 'Cerrar',
    confirmLabel: 'Entendido',
    onConfirm: onClose,
    onCancel: onClose,
    isLoading,
  };

  return (
    <FormModalLayout onClose={onClose}>
      <FormModalHeader {...headerContent} />
      
      <div className="flex-1 p-6">
        <div className="text-center py-8">
          <div className="mb-4">
            <Badge variant="secondary" className="text-sm">
              Funcionalidad Eliminada
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            La gestión por grupos de opciones ha sido simplificada. 
            Las opciones ahora se manejan directamente desde los parámetros de tarea.
          </p>
        </div>
      </div>

      <FormModalFooter {...footerContent} />
    </FormModalLayout>
  );
}