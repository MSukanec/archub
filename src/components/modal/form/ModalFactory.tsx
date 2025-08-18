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
import ProjectClientFormModal from '../modals/finances/ProjectClientFormModal';
import { DocumentUploadFormModal } from '../modals/project/DocumentUploadFormModal';
import { DocumentFolderFormModal } from '../modals/project/DocumentFolderFormModal';
import { MovementModal } from '../modals/finances/movements/MovementModal';
import MovementConceptFormModal from '../modals/admin/MovementConceptFormModal';
import { OrganizationMovementConceptFormModal } from '../modals/organizations/OrganizationMovementConceptFormModal';

import MovementImportStepModal from '../modals/finances/movements/MovementImportStepModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { BudgetFormModal } from '../modals/construction/BudgetFormModal';
import { ConstructionTaskFormModal } from '../modals/construction/ConstructionTaskFormModal';
import { ConstructionSingleTaskModal } from '../modals/construction/ConstructionSingleTaskModal';
import { ConstructionTaskScheduleModal } from '../modals/construction/ConstructionTaskScheduleModal';
import { ConstructionPhaseFormModal } from '../modals/construction/ConstructionPhaseFormModal';

import { InstallmentFormModal } from '../modals/finances/InstallmentFormModal';
import { MaterialFormModal } from '../modals/admin/MaterialFormModal'
import { MaterialCategoryFormModal } from '../modals/admin/MaterialCategoryFormModal';
import { BrandFormModal } from '../modals/admin/BrandFormModal';
import { ProductFormModal } from '../modals/admin/ProductFormModal';
import { UnitPresentationFormModal } from '../modals/admin/UnitPresentationFormModal';
import { DependencyConnectionModal } from '../modals/construction/DependencyConnectionModal';
import { BudgetTaskFormModal } from '../modals/construction/BudgetTaskFormModal';
import { TaskCategoryFormModal } from '../modals/admin/TaskCategoryFormModal';
import { TaskParameterFormModal } from '../modals/admin/TaskParameterFormModal';

import { TaskParameterOptionFormModal } from '../modals/admin/TaskParameterOptionFormModal';
import { TaskTemplateFormModal } from '../modals/admin/TaskTemplateFormModal';

import { ParametricTaskFormModal } from '../modals/admin/TaskParametricFormModal';
import { UserFormModal } from '../modals/admin/UserFormModal';
import { OrganizationFormModal } from '../modals/admin/OrganizationFormModal';
import { ProfileOrganizationFormModal } from '../modals/profile/ProfileOrganizationFormModal';
import { ChangelogFormModal } from '../modals/admin/ChangelogFormModal';
import { SiteLogFormModal } from '../modals/construction/SiteLogFormModal';
import { AttendanceFormModal } from '../modals/construction/AttendanceFormModal';
import { PersonnelFormModal } from '../modals/construction/PersonnelFormModal';
import { ParameterVisibilityConfigModal } from '../modals/admin/ParameterVisibilityConfigModal';
import { AddParameterToCanvasModal } from '../modals/admin/AddParameterToCanvasModal';
import { SubcontractFormModal } from '../modals/construction/SubcontractFormModal';
import { SubcontractBidFormModal } from '../modals/construction/SubcontractBidFormModal';
import { SubcontractAwardModal } from '../modals/construction/SubcontractAwardModal';
import { SubcontractTaskFormModal } from '../modals/construction/SubcontractTaskFormModal';
import { InsuranceFormModal } from '../modals/construction/InsuranceFormModal';
import { RenewInsuranceFormModal } from '../modals/construction/RenewInsuranceFormModal';

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
      return <MovementModal modalData={data} onClose={closeModal} />;
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
    case 'construction-single-task':
      return <ConstructionSingleTaskModal modalData={data} onClose={closeModal} />;
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
    
    case 'brand-form':
      return <BrandFormModal modalData={data} onClose={closeModal} />;
    
    case 'product-form':
      return <ProductFormModal modalData={data} onClose={closeModal} />;
    
    case 'unit-presentation-form':
      return <UnitPresentationFormModal modalData={data} onClose={closeModal} />;
    
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
    case 'task-template':
      return <TaskTemplateFormModal modalData={data} onClose={closeModal} />;


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
    case 'personnel':
      return <PersonnelFormModal data={data} />;
    case 'parameter-visibility-config':
      return <ParameterVisibilityConfigModal />;
    case 'add-parameter-to-canvas':
      return <AddParameterToCanvasModal />;
    case 'subcontract':
      return <SubcontractFormModal modalData={data} onClose={closeModal} />;
    case 'subcontract-bid':
      return <SubcontractBidFormModal modalData={data} onClose={closeModal} />;
    case 'subcontract-award':
      return <SubcontractAwardModal modalData={data} onClose={closeModal} />;
    case 'subcontract-task':
      return <SubcontractTaskFormModal modalData={data} onClose={closeModal} />;

    case 'insurance':
      return <InsuranceFormModal modalData={data} onClose={closeModal} />;
    case 'renew-insurance':
      return <RenewInsuranceFormModal modalData={data} onClose={closeModal} />;
    default:
      return null;
  }
}