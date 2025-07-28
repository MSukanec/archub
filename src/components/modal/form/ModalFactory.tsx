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

import MovementImportStepModal from '../modals/finances/MovementImportStepModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { BudgetFormModal } from '../modals/construction/BudgetFormModal';
import { ConstructionTaskFormModal } from '../modals/construction/ConstructionTaskFormModal';
import { ConstructionTaskScheduleModal } from '../modals/construction/ConstructionTaskScheduleModal';
import { ConstructionPhaseFormModal } from '../modals/construction/ConstructionPhaseFormModal';

import { InstallmentFormModal } from '../modals/finances/InstallmentFormModal';
import { MaterialFormModal } from '../modals/admin/MaterialFormModal'
import { MaterialCategoryFormModal } from '../modals/admin/MaterialCategoryFormModal';
import { DependencyConnectionModal } from '../modals/construction/DependencyConnectionModal';
import { BudgetTaskFormModal } from '../modals/construction/BudgetTaskFormModal';
import { TaskCategoryFormModal } from '../modals/admin/TaskCategoryFormModal';
import { TaskParameterFormModal } from '../modals/admin/TaskParameterFormModal';

import { TaskParameterOptionFormModal } from '../modals/admin/TaskParameterOptionFormModal';

import { ParametricTaskFormModal } from '../modals/admin/TaskParametricFormModal';
import { UserFormModal } from '../modals/admin/UserFormModal';
import { OrganizationFormModal } from '../modals/admin/OrganizationFormModal';
import { ProfileOrganizationFormModal } from '../modals/profile/ProfileOrganizationFormModal';
import { ChangelogFormModal } from '../modals/admin/ChangelogFormModal';
import { SiteLogFormModal } from '../modals/construction/SiteLogFormModal';
import { AttendanceFormModal } from '../modals/construction/AttendanceFormModal';
import { ParameterVisibilityConfigModal } from '../modals/admin/ParameterVisibilityConfigModal';

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
    case 'construction-task-schedule':
      return <ConstructionTaskScheduleModal modalData={data} onClose={closeModal} />;
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
    case 'budget-task-bulk-add':
      return <BudgetTaskFormModal modalData={data} onClose={closeModal} />;
    case 'task-category':
      return <TaskCategoryFormModal modalData={data} onClose={closeModal} />;

    case 'task-parameter':
      return <TaskParameterFormModal modalData={data} onClose={closeModal} />;
    case 'task-parameter-option':
      return <TaskParameterOptionFormModal modalType="task-parameter-option" />;


    case 'parametric-task':
      return <ParametricTaskFormModal modalData={data} onClose={closeModal} />;


    case 'admin-user':
      return <UserFormModal modalData={data} onClose={closeModal} />;
    case 'admin-organization':
      return <OrganizationFormModal modalData={data} onClose={closeModal} />;
    case 'profile-organization':
      return <ProfileOrganizationFormModal modalData={data} onClose={closeModal} />;
    case 'changelog-entry':
      return <ChangelogFormModal modalData={data} onClose={closeModal} />;
    case 'site-log':
      return <SiteLogFormModal data={data} />;
    case 'attendance':
      return <AttendanceFormModal modalData={data} onClose={closeModal} />;
    case 'parameter-visibility-config':
      return <ParameterVisibilityConfigModal parameterId={data?.parameterId} onClose={closeModal} />;
    default:
      return null;
  }
}