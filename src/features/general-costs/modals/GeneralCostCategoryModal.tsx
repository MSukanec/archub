import { FolderOpen, Eye, Edit } from 'lucide-react';
import { ModalLayout, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
import { FormPanel, ViewPanel, useCategoryForm } from '../forms/GeneralCostCategoryForm';
import type { GeneralCostCategory } from '../types';

interface GeneralCostCategoryModalProps {
  modalData?: {
    category?: GeneralCostCategory;
  };
  onClose: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export default function GeneralCostCategoryModal({ modalData, onClose, mode = 'create' }: GeneralCostCategoryModalProps) {
  const { category } = modalData || {};

  const {
    form,
    onSubmit,
    currentMode,
    handleEditClick,
    handleDeleteClick,
    isSubmitting,
  } = useCategoryForm({
    category,
    mode,
    onSuccess: onClose,
  });

  const getHeader = () => {
    switch (currentMode) {
      case 'view':
        return {
          title: 'Ver Categoría',
          description: 'Información de la categoría',
        };
      case 'edit':
        return {
          title: 'Editar Categoría',
          description: 'Modifica los datos de la categoría',
        };
      case 'create':
      default:
        return {
          title: 'Nueva Categoría',
          description: 'Crea una nueva categoría para clasificar los gastos generales',
        };
    }
  };

  const header = getHeader();

  return (
    <ModalLayout onClose={onClose} size="sm">
      <ModalHeader
        title={header.title}
        description={header.description}
        icon={currentMode === 'view' ? Eye : currentMode === 'edit' ? Edit : FolderOpen}
      />

      <ModalBody>
        {currentMode === 'view' ? (
          category && (
            <ViewPanel
              category={category}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )
        ) : (
          <FormPanel form={form} />
        )}
      </ModalBody>

      {currentMode !== 'view' && (
        <ModalFooter
          leftLabel="Cancelar"
          onLeftClick={onClose}
          submitText={currentMode === 'edit' ? 'Guardar Cambios' : 'Crear Categoría'}
          onSubmit={form.handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
        />
      )}
      
      {currentMode === 'view' && (
        <ModalFooter
          leftLabel="Cerrar"
          onLeftClick={onClose}
        />
      )}
    </ModalLayout>
  );
}
