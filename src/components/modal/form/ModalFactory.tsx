import { useGlobalModalStore } from './useGlobalModalStore';
import { FormModalLayout } from './FormModalLayout';
import { Button } from '@/components/ui/button';
import { 
  MemberFormModal, 
  BoardFormModal, 
  CardFormModal, 
  ListFormModal, 
  OrganizationMovementConceptFormModal,
  PartnerModal 
} from '@/features/organization';
import {
  ProjectModal,
  GalleryFormModal,
  DocumentFolderFormModal,
  DocumentUploadFormModal,
  BudgetFormModal,
  BudgetTaskFormModal,
  ConstructionPhaseFormModal,
  ConstructionTaskScheduleModal,
  DependencyConnectionModal,
  IndirectModal,
  InsuranceFormModal,
  RenewInsuranceFormModal,
  TaskMultiModal,
  BudgetItemModal
} from '@/features/projects';
import { ContactFormModal, ContactModalView } from '@/features/contacts';
import ClientObligationModal from '../modals/general/clients/ClientObligationModal';
import { 
  MovementModal, 
  MovementModalView,
  MovementImportStepModal 
} from '@/features/finances';
import MovementConceptFormModal from '../modals/admin/MovementConceptFormModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';

import ClientPaymentsModal from '@/features/clients/modals/ClientPaymentsModal';
import { ClientCommitmentModal } from '@/features/clients/modals/ClientCommitmentModal';
import { ClientRoleModal } from '@/features/clients/modals/ClientRoleModal';
import { MaterialFormModal } from '../modals/admin/MaterialFormModal'
import { MaterialCategoryFormModal } from '../modals/admin/MaterialCategoryFormModal';
import { BrandFormModal } from '../modals/admin/BrandFormModal';
import { UnitPresentationFormModal } from '../modals/admin/UnitPresentationFormModal';
import { TaskCategoryFormModal } from '../modals/admin/TaskCategoryFormModal';
import { TaskDivisionFormModal } from '../modals/admin/TaskDivisionFormModal';
import { TaskParameterFormModal } from '../modals/admin/TaskParameterFormModal';

import { TaskParameterOptionFormModal } from '../modals/admin/TaskParameterOptionFormModal';

import { TaskModal } from '../modals/analysis/TaskModal';
import { UserFormModal } from '../modals/admin/UserFormModal';
import { OrganizationFormModal } from '../modals/admin/OrganizationFormModal';
import { ProfileOrganizationFormModal } from '../modals/profile/ProfileOrganizationFormModal';
import { ChangelogFormModal } from '../modals/admin/ChangelogFormModal';
import { SiteLogModal } from '@/features/sitelog/modals/SiteLogModal';
import { SiteLogModalView } from '@/features/sitelog/modals/SiteLogModalView';
import { SiteLogTypeModal } from '@/features/sitelog/modals/SiteLogTypeModal';
import { ProjectTypeModal } from '@/features/projects/project-types/modals/ProjectTypeModal';
import { ProjectModalityModal } from '@/features/projects/project-modalities/modals/ProjectModalityModal';
import {
  PersonnelAttendanceModal,
  PersonnelAddModal,
  PersonnelDataModal,
  PersonnelRatesModal,
} from '@/features/personnel';
import { ParameterVisibilityConfigModal } from '../modals/admin/ParameterVisibilityConfigModal';
import { AddParameterToCanvasModal } from '../modals/admin/AddParameterToCanvasModal';
import {
  SubcontractFormModal,
  SubcontractBidFormModal,
  SubcontractAwardModal,
  SubcontractTaskFormModal,
} from '@/features/subcontracts';
import { ProjectClientModal } from '@/features/clients/modals/ClientDataModal';
import { PDFExporterModal } from '../modals/PDFExporterModal';
import { ProviderProductModal } from '../modals/providers/ProviderProductModal';
import { ProductModal } from '../modals/analysis/ProductModal';
import { AdminProductModal } from '../modals/admin/AdminProductModal';
import { GeneralCostsModal } from '@/features/general-costs/modals/GeneralCostsModal';
import { GeneralCostsPaymentModal } from '@/features/general-costs/modals/GeneralCostsPaymentModal';
import { AdminLaborModal } from '../modals/admin/AdminLaborModal';
import { CostModal } from '../modals/admin/CostModal';
import { CourseModal, CourseModuleFormModal, LessonFormModal, CourseEnrollmentModal } from '@/features/learning';
import { CouponFormModal } from '../modals/admin/CouponFormModal';
import PaymentMethodModal from '../modals/PaymentMethodModal';
import { NotificationFormModal } from '../modals/admin/NotificationFormModal';
import BankTransferReceiptModal from '../modals/admin/BankTransferReceiptModal';
import { AnnouncementFormModal } from '../modals/admin/AnnouncementFormModal';
import { PaymentFormModal } from '../modals/admin/PaymentFormModal';
import { SupportConversationStartModal } from '../modals/admin/SupportConversationStartModal';
import { PlanFormModal } from '../modals/admin/PlanFormModal';
import { PlanPriceFormModal } from '../modals/admin/PlanPriceFormModal';

export function ModalFactory() {
  const { open, type, data, closeModal } = useGlobalModalStore();


  if (!open) return null;

  switch (type) {
    case 'member':
      return <MemberFormModal editingMember={data?.editingMember} onClose={closeModal} />;
    case 'partner':
      return <PartnerModal editingPartner={data?.editingPartner} onClose={closeModal} />;
    case 'gallery':
      return <GalleryFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'board':
      return <BoardFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'card':
      return <CardFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'list':
      return <ListFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'contact':
      // Si está en modo vista, mostrar ContactModalView
      if (data?.viewingContact) {
        return <ContactModalView modalData={data} onClose={closeModal} />;
      }
      // En cualquier otro caso (crear/editar), mostrar ContactFormModal
      return <ContactFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'project':
      return <ProjectModal modalData={data || undefined} onClose={closeModal} />;
    case 'project-client':
      return <ProjectClientModal modalData={data || undefined} onClose={closeModal} />;
    case 'document-upload':
      return <DocumentUploadFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'document-folder':
      return <DocumentFolderFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'movement':
      return <MovementModal modalData={data || undefined} onClose={closeModal} />;
    case 'movements-view':
      return <MovementModalView modalData={data || {}} onClose={closeModal} />;
    case 'movement-concept':
      return <MovementConceptFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'organization-movement-concept':
      return <OrganizationMovementConceptFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'movement-import':
      return <MovementImportStepModal modalData={data || undefined} onClose={closeModal} />;
    case 'budget':
      return <BudgetFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'construction-task':
      return <TaskMultiModal modalData={data as any || {}} onClose={closeModal} />;
    case 'budget-item':
      return <BudgetItemModal modalData={data as any || {}} onClose={closeModal} />;
    case 'construction-task-schedule':
      return <ConstructionTaskScheduleModal modalData={data as any || {}} onClose={closeModal} />;
    case 'construction-phase':
      return <ConstructionPhaseFormModal modalData={data as any || {}} onClose={closeModal} />;
    case 'organization':
      return <OrganizationFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'material-form':
      return <MaterialFormModal modalData={data || {}} onClose={closeModal} />;
    
    case 'material-category-form':
      return <MaterialCategoryFormModal modalData={data || {}} onClose={closeModal} />;
    
    case 'brand-form':
      return <BrandFormModal modalData={data || {}} onClose={closeModal} />;
    
    case 'product-form':
      return <AdminProductModal modalData={data || {}} onClose={closeModal} />;
    
    case 'unit-presentation-form':
      return <UnitPresentationFormModal modalData={data || {}} onClose={closeModal} />;
    
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
      return <ClientPaymentsModal modalData={data as any || {}} onClose={closeModal} />;
    case 'dependency-connection':
      return <DependencyConnectionModal modalData={data || {}} onClose={closeModal} />;
    case 'budget-task-bulk-add':
      return <BudgetTaskFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'task-category':
      return <TaskCategoryFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'task-division':
      return <TaskDivisionFormModal modalData={data || undefined} onClose={closeModal} />;

    case 'task-parameter':
      return <TaskParameterFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'task-parameter-option':
      return <TaskParameterOptionFormModal modalType="task-parameter-option" />;


    case 'task':
      return <TaskModal modalData={data || undefined} onClose={closeModal} />;
    case 'analysis-task':
      return <TaskModal modalData={data || undefined} onClose={closeModal} />;


    case 'admin-user':
      return <UserFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'admin-organization':
      return <OrganizationFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'profile-organization':
      return <ProfileOrganizationFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'changelog-entry':
      return <ChangelogFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'site-log':
      return <SiteLogModal data={data || {}} />;
    case 'site-log-view':
      return <SiteLogModalView modalData={data || {}} onClose={closeModal} />;
    case 'siteLogType':
      return <SiteLogTypeModal modalData={data || undefined} onClose={closeModal} />;
    case 'projectType':
      return <ProjectTypeModal modalData={data || undefined} onClose={closeModal} />;
    case 'projectModality':
      return <ProjectModalityModal modalData={data || undefined} onClose={closeModal} />;
    case 'attendance':
      return <PersonnelAttendanceModal modalData={data || undefined} onClose={closeModal} />;
    case 'personnel':
      return <PersonnelAddModal data={data || {}} />;
    case 'personnel-data':
      return <PersonnelDataModal modalData={data || undefined} onClose={closeModal} />;
    case 'personnelRates':
      return <PersonnelRatesModal modalData={data || undefined} onClose={closeModal} />;
    case 'parameter-visibility-config':
      return <ParameterVisibilityConfigModal />;
    case 'add-parameter-to-canvas':
      return <AddParameterToCanvasModal />;
    case 'subcontract':
      return <SubcontractFormModal modalData={data as any || {}} />;
    case 'subcontract-bid':
      return <SubcontractBidFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'subcontract-award':
      return <SubcontractAwardModal modalData={data as any || undefined} onClose={closeModal} />;
    case 'subcontract-task':
      return <SubcontractTaskFormModal modalData={data || undefined} onClose={closeModal} />;

    case 'insurance':
      return <InsuranceFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'renew-insurance':
      return <RenewInsuranceFormModal modalData={data as any || undefined} onClose={closeModal} />;
    case 'client-payment':
      return <ClientPaymentsModal modalData={data as any || undefined} onClose={closeModal} />;
    case 'client-commitment':
      return <ClientCommitmentModal modalData={data as any || undefined} onClose={closeModal} />;
    case 'clientRole':
      return <ClientRoleModal modalData={data || undefined} onClose={closeModal} />;
    case 'pdf-exporter':
      return <PDFExporterModal modalData={data || undefined} onClose={closeModal} />;
    case 'provider-product':
      return <ProviderProductModal modalData={data || undefined} onClose={closeModal} />;
    case 'custom-product':
      return <ProductModal modalData={data || {}} onClose={closeModal} />;
    case 'indirect':
      return <IndirectModal modalData={data || {}} onClose={closeModal} />;
    case 'general-costs':
      return <GeneralCostsModal modalData={data || {}} onClose={closeModal} />;
    case 'general-costs-payment':
      return <GeneralCostsPaymentModal modalData={data as any || {}} onClose={closeModal} />;
    case 'labor-type-form':
      return <AdminLaborModal modalData={data || {}} onClose={closeModal} />;
    case 'cost-modal':
      return <CostModal modalData={data || {}} onClose={closeModal} />;
    case 'course':
      return <CourseModal modalData={data || undefined} onClose={closeModal} />;
    case 'course-module':
      return <CourseModuleFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'lesson':
      return <LessonFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'course-enrollment':
      return <CourseEnrollmentModal modalData={data || undefined} onClose={closeModal} />;
    case 'coupon':
      return <CouponFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'payment-method':
      return <PaymentMethodModal 
        courseSlug={data?.courseSlug || ''} 
        currency={data?.currency || 'ARS'}
      />;
    case 'notification':
      return <NotificationFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'bank-transfer-receipt':
      return <BankTransferReceiptModal 
        receiptUrl={data?.receiptUrl || null}
        paymentId={data?.paymentId || ''}
      />;
    case 'announcement':
      return <AnnouncementFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'payment':
      return <PaymentFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'support-conversation-start':
      return <SupportConversationStartModal modalData={data || undefined} onClose={closeModal} />;
    case 'plan':
      return <PlanFormModal modalData={data || undefined} onClose={closeModal} />;
    case 'plan-price':
      return <PlanPriceFormModal modalData={data || undefined} onClose={closeModal} />;
    default:
      return null;
  }
}