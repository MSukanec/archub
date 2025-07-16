import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { Button } from '@/components/ui/button';
import { MemberFormModal } from '../modals/MemberFormModal';
import { GalleryFormModal } from '../modals/GalleryFormModal';
import { BoardFormModal } from '../modals/BoardFormModal';
import { CardFormModal } from '../modals/CardFormModal';
import { ListFormModal } from '../modals/ListFormModal';
import { ContactFormModal } from '../modals/ContactFormModal';
import { ProjectFormModal } from '../modals/ProjectFormModal';
import ProjectClientFormModal from '../modals/ProjectClientFormModal';
import { DocumentUploadFormModal } from '../modals/DocumentUploadFormModal';
import { DocumentFolderFormModal } from '../modals/DocumentFolderFormModal';
import MovementFormModal from '../modals/MovementFormModal';
import MovementConceptFormModal from '../modals/MovementConceptFormModal';
import MovementImportModal from '../modals/MovementImportModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

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
    case 'movement-import': {
      const modalResult = MovementImportModal({ modalData: data, onClose: closeModal });
      return (
        <FormModalLayout 
          headerContent={
            <div className="px-6 py-4 border-b border-[var(--card-border)]">
              <h2 className="text-lg font-semibold text-foreground">{modalResult.headerContent.title}</h2>
              <p className="text-sm text-muted-foreground">{modalResult.headerContent.description}</p>
            </div>
          }
          footerContent={
            <div className="px-6 py-4 border-t border-[var(--card-border)] bg-[var(--card-bg)] flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={modalResult.footerContent.onCancel}
              >
                {modalResult.footerContent.cancelText}
              </Button>
              {modalResult.footerContent.showSubmit && (
                <Button 
                  onClick={modalResult.footerContent.onSubmit}
                  disabled={modalResult.footerContent.disabled}
                  loading={modalResult.footerContent.loading}
                >
                  {modalResult.footerContent.submitText}
                </Button>
              )}
            </div>
          }
          onClose={closeModal}
          columns={1}
        >
          {modalResult.editPanel}
        </FormModalLayout>
      );
    }
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
    default:
      return null;
  }
}