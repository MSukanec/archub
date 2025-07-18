import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { Button } from '@/components/ui/button';
import { MemberFormModal } from '../modals/organizations/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/organizations/CardFormModal';
import { ListFormModal } from '../modals/organizations/ListFormModal';
import { ContactFormModal } from '../modals/organizations/ContactFormModal';
import { ProjectFormModal } from '../modals/organizations/ProjectFormModal';
import ProjectClientFormModal from '../modals/ProjectClientFormModal';
import { DocumentUploadFormModal } from '../modals/DocumentUploadFormModal';
import { DocumentFolderFormModal } from '../modals/DocumentFolderFormModal';
import MovementFormModal from '../modals/finances/MovementFormModal';
import MovementConceptFormModal from '../modals/MovementConceptFormModal';
import { OrganizationMovementConceptFormModal } from '../modals/organizations/OrganizationMovementConceptFormModal';
import MovementImportModal from '../modals/MovementImportModal';
import MovementImportStepModal from '../modals/finances/MovementImportStepModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { BudgetFormModal } from '../modals/BudgetFormModal';
import { OrganizationFormModal } from '../modals/organizations/OrganizationFormModal';
import { InstallmentFormModal } from '../modals/finances/InstallmentFormModal';

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
    case 'organization':
      return <OrganizationFormModal modalData={data} onClose={closeModal} />;
    case 'delete-confirmation':
      return <DeleteConfirmationModal 
        mode={data?.mode || 'simple'}
        title={data?.title || 'Eliminar elemento'}
        description={data?.description || '¿Estás seguro de que deseas eliminar este elemento?'}
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
    default:
      return null;
  }
}