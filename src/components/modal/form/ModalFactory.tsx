import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { Button } from '@/components/ui/button';
import { MemberFormModal } from '../modals/organizations/MemberFormModal';
import { GalleryFormModal } from '../modals/project/GalleryFormModal';
import { BoardFormModal } from '../modals/organizations/BoardFormModal';
import { CardFormModal } from '../modals/organizations/CardFormModal';
import { ListFormModal } from '../modals/organizations/ListFormModal';
import { ContactFormModal } from '../modals/organizations/ContactFormModal';
import { ProjectFormModal } from '../modals/organizations/ProjectFormModal';
import ProjectClientFormModal from '../modals/project/ProjectClientFormModal';
import { DocumentUploadFormModal } from '../modals/project/DocumentUploadFormModal';
import { DocumentFolderFormModal } from '../modals/project/DocumentFolderFormModal';
import MovementFormModal from '../modals/finances/MovementFormModal';
import MovementConceptFormModal from '../modals/admin/MovementConceptFormModal';
import { OrganizationMovementConceptFormModal } from '../modals/organizations/OrganizationMovementConceptFormModal';
import MovementImportModal from '../modals/MovementImportModal';
import MovementImportStepModal from '../modals/finances/MovementImportStepModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { BudgetFormModal } from '../modals/construction/BudgetFormModal';
import { ConstructionTaskFormModal } from '../modals/construction/ConstructionTaskFormModal';
import { ConstructionPhaseFormModal } from '../modals/construction/ConstructionPhaseFormModal';
import { OrganizationFormModal } from '../modals/organizations/OrganizationFormModal';
import { InstallmentFormModal } from '../modals/finances/InstallmentFormModal';
import { MaterialFormModal } from '../modals/admin/MaterialFormModal'
import { MaterialCategoryFormModal } from '../modals/admin/MaterialCategoryFormModal';
import { DependencyConnectionModal } from '../modals/construction/DependencyConnectionModal';
import { BudgetTaskBulkAddModal } from '../modals/construction/BudgetTaskBulkAddModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();

  if (!open) return null;

  switch (type) {
    case 'member':
      return <MemberFormModal editingMember={data?.editingMember} onClose={closeModal} />;
    case 'gallery':
      return <GalleryFormModal modalData={data} onClose={closeModal} />;
    case 'board':
      return <BoardFormModal modalData={data} onClose={closeModal} />;
    case 'card':
      return <CardFormModal modalData={data} onClose={closeModal} />;
    case 'list':
      return <ListFormModal modalData={data} onClose={closeModal} />;
    case 'contact':
      return <ContactFormModal modalData={data} onClose={closeModal} />;
    case 'project':
      return <ProjectFormModal modalData={data} onClose={closeModal} />;
    case 'project-client':
      return <ProjectClientFormModal onClose={closeModal} />;
    case 'document-upload':
      return <DocumentUploadFormModal modalData={data} onClose={closeModal} />;
    case 'document-folder':
      return <DocumentFolderFormModal modalData={data} onClose={closeModal} />;
    case 'movement':
      return <MovementFormModal modalData={data} onClose={closeModal} />;
    case 'movement-concept':
      return <MovementConceptFormModal modalData={data} onClose={closeModal} />;
    case 'organization-movement-concept':
      return <OrganizationMovementConceptFormModal modalData={data} onClose={closeModal} />;
    case 'movement-import':
      return <MovementImportStepModal modalData={data} onClose={closeModal} />;
    case 'budget':
      return <BudgetFormModal modalData={data} onClose={closeModal} />;
    case 'construction-task':
      return <ConstructionTaskFormModal modalData={data} onClose={closeModal} />;
    case 'construction-phase':
      return <ConstructionPhaseFormModal modalData={data} onClose={closeModal} />;
    case 'organization':
      return <OrganizationFormModal modalData={data} onClose={closeModal} />;
    case 'material-form':
      return <MaterialFormModal modalData={data} onClose={closeModal} />;
    
    case 'material-category-form':
      return <MaterialCategoryFormModal modalData={data} onClose={closeModal} />;
    
    case 'delete-confirmation':
      return <DeleteConfirmationModal 
        mode={data?.mode || 'dangerous'}
        title={data?.title || 'Eliminar elemento'}
        description={data?.message || data?.description || '¿Estás seguro de que deseas eliminar este elemento?'}
        itemName={data?.itemName}
        destructiveActionText={data?.destructiveActionText}
        onConfirm={data?.onConfirm}
        onDelete={data?.onDelete}
        onReplace={data?.onReplace}
        replacementOptions={data?.replacementOptions || []}
        currentCategoryId={data?.currentCategoryId}
        isLoading={data?.isLoading || false}
      />;
    case 'installment':
      return <InstallmentFormModal modalData={data} onClose={closeModal} />;
    case 'dependency-connection':
      return <DependencyConnectionModal modalData={data} onClose={closeModal} />;
    case 'budget-task-bulk-add': {
      const modalProps = BudgetTaskBulkAddModal({ modalData: data, onClose: closeModal });
      return (
        <FormModalLayout
          columns={1}
          viewPanel={modalProps.viewPanel}
          editPanel={modalProps.editPanel}
          headerContent={modalProps.headerContent}
          footerContent={modalProps.footerContent}
          onClose={closeModal}
        />
      );
    }
    default:
      return null;
  }
}