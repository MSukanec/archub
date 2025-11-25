import { registerModal, ModalConfig } from './registry';

import { MemberFormModal, BoardFormModal, CardFormModal, ListFormModal, OrganizationMovementConceptFormModal, PartnerModal, OrganizationFormModal, ProfileOrganizationFormModal } from '@/features/organization';
import { ProjectForm } from '@/features/projects';
import { GalleryFormModal, DocumentFolderFormModal, DocumentUploadFormModal, BudgetFormModal, BudgetTaskFormModal, ConstructionPhaseFormModal, ConstructionTaskScheduleModal, DependencyConnectionModal, IndirectModal, InsuranceFormModal, RenewInsuranceFormModal, TaskMultiModal, BudgetItemModal, CostModal, TaskCategoryFormModal, TaskDivisionFormModal, TaskParameterFormModal, TaskParameterOptionFormModal, ParameterVisibilityConfigModal, AddParameterToCanvasModal, TaskModal } from '@/features/legacy';
import ContactForm from '@/features/contacts/forms/ContactForm';
import { ContactTypeForm } from '@/features/contacts/forms/ContactTypeForm';
import { ClientObligationModal, ClientPaymentsModal, ClientCommitmentModal, ClientRoleModal, ProjectClientModal } from '@/features/clients';
import { MovementModal, MovementModalView, MovementImportStepModal, MovementConceptFormModal, BankTransferReceiptModal, PaymentFormModal } from '@/features/finances';
import { default as DeleteConfirmationForm } from '@/components/forms/DeleteConfirmationForm';
import { MaterialFormModal, MaterialCategoryFormModal, BrandFormModal, UnitPresentationFormModal, AdminProductModal, ProductModal, ProviderProductModal } from '@/features/materials';
import { UserFormModal, ChangelogFormModal, NotificationFormModal, AnnouncementFormModal, SupportConversationStartModal, PlanFormModal, PlanPriceFormModal, DowngradeModal } from '@/features/users';
import SiteLogForm from '@/features/sitelog/forms/SiteLogForm';
import { SiteLogTypeForm } from '@/features/sitelog/forms/SiteLogTypeForm';
import { ProjectTypeForm } from '@/features/projects/forms/ProjectTypeForm';
import { ProjectModalityForm } from '@/features/projects/forms/ProjectModalityForm';
import { PersonnelAttendanceModal, PersonnelAddModal, PersonnelDataModal, PersonnelRatesModal, AdminLaborModal } from '@/features/personnel';
import { SubcontractFormModal, SubcontractBidFormModal, SubcontractAwardModal, SubcontractTaskFormModal } from '@/features/subcontracts';
import { PDFExporterModal } from '@/features/pdf';
import { GeneralCostForm } from '@/features/general-costs/forms/GeneralCostForm';
import GeneralCostPaymentForm from '@/features/general-costs/forms/GeneralCostPaymentForm';
import { CourseModal, CourseModuleFormModal, LessonFormModal, CourseEnrollmentModal, CouponFormModal, PaymentMethodModal } from '@/features/learning';

const organizationConfig: ModalConfig = { category: 'organization', size: 'md' };
const projectConfig: ModalConfig = { category: 'project', size: 'lg' };
const financeConfig: ModalConfig = { category: 'finance', size: 'lg' };
const learningConfig: ModalConfig = { category: 'learning', size: 'lg' };
const adminConfig: ModalConfig = { category: 'admin', size: 'md' };
const generalConfig: ModalConfig = { category: 'general', size: 'md' };

let initialized = false;

export function initializeModalRegistry(): void {
  if (initialized) return;
  initialized = true;

  registerModal('member', MemberFormModal as any, organizationConfig);
  registerModal('partner', PartnerModal as any, organizationConfig);
  registerModal('board', BoardFormModal as any, organizationConfig);
  registerModal('card', CardFormModal as any, organizationConfig);
  registerModal('list', ListFormModal as any, organizationConfig);
  registerModal('organization', OrganizationFormModal as any, { ...organizationConfig, size: 'lg' });
  registerModal('profile-organization', ProfileOrganizationFormModal as any, organizationConfig);
  registerModal('organization-movement-concept', OrganizationMovementConceptFormModal as any, organizationConfig);
  
  registerModal('project', ProjectForm as any, { 
    ...projectConfig, 
    size: 'lg',
    mapDataToProps: (data) => ({
      project: data?.editingProject || data?.project,
      mode: data?.mode || (data?.isEditing ? 'edit' : (data?.editingProject || data?.project ? 'edit' : 'create')),
    }),
  });
  registerModal('gallery', GalleryFormModal as any, projectConfig);
  registerModal('document-folder', DocumentFolderFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('document-upload', DocumentUploadFormModal as any, projectConfig);
  registerModal('budget', BudgetFormModal as any, projectConfig);
  registerModal('budget-task-bulk-add', BudgetTaskFormModal as any, projectConfig);
  registerModal('construction-phase', ConstructionPhaseFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('construction-task', TaskMultiModal as any, { ...projectConfig, size: 'xl' });
  registerModal('construction-task-schedule', ConstructionTaskScheduleModal as any, projectConfig);
  registerModal('dependency-connection', DependencyConnectionModal as any, { ...projectConfig, size: 'md' });
  registerModal('budget-item', BudgetItemModal as any, projectConfig);
  registerModal('task', TaskModal as any, projectConfig);
  registerModal('analysis-task', TaskModal as any, projectConfig);
  registerModal('task-category', TaskCategoryFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('task-division', TaskDivisionFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('task-parameter', TaskParameterFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('task-parameter-option', TaskParameterOptionFormModal as any, { 
    ...projectConfig, 
    size: 'sm',
    preventCloseOnEsc: true,
  });
  registerModal('parameter-visibility-config', ParameterVisibilityConfigModal as any, { 
    ...projectConfig, 
    size: 'sm',
    preventCloseOnEsc: true,
  });
  registerModal('add-parameter-to-canvas', AddParameterToCanvasModal as any, { 
    ...projectConfig, 
    size: 'sm',
    preventCloseOnEsc: true,
  });
  registerModal('insurance', InsuranceFormModal as any, projectConfig);
  registerModal('renew-insurance', RenewInsuranceFormModal as any, projectConfig);
  registerModal('indirect', IndirectModal as any, projectConfig);
  registerModal('cost-modal', CostModal as any, projectConfig);
  registerModal('projectType', ProjectTypeForm as any, { 
    ...projectConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      projectType: data?.projectType,
      mode: data?.isEditing || data?.projectType ? 'edit' : 'create',
    }),
  });
  registerModal('projectModality', ProjectModalityForm as any, { 
    ...projectConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      projectModality: data?.projectModality,
      mode: data?.isEditing || data?.projectModality ? 'edit' : 'create',
    }),
  });
  
  registerModal('contact', ContactForm as any, { 
    ...generalConfig, 
    size: 'lg',
    mapDataToProps: (data) => ({
      contactId: data?.contactId || data?.contact?.id,
      contact: data?.contact,
      mode: data?.mode || (data?.contactId || data?.contact?.id ? 'view' : 'create'),
    }),
  });
  registerModal('contactType', ContactTypeForm as any, { 
    ...generalConfig, 
    size: 'sm',
    mapDataToProps: (data) => ({
      contactType: data?.contactType,
      mode: data?.isEditing || data?.contactType ? 'edit' : 'create',
    }),
  });
  
  registerModal('project-client', ProjectClientModal as any, projectConfig);
  registerModal('client-obligation', ClientObligationModal as any, financeConfig);
  registerModal('client-payment', ClientPaymentsModal as any, financeConfig);
  registerModal('installment', ClientPaymentsModal as any, financeConfig);
  registerModal('client-commitment', ClientCommitmentModal as any, financeConfig);
  registerModal('clientRole', ClientRoleModal as any, generalConfig);
  
  registerModal('movement', MovementModal as any, financeConfig);
  registerModal('movements-view', MovementModalView as any, financeConfig);
  registerModal('movement-concept', MovementConceptFormModal as any, { ...financeConfig, size: 'md' });
  registerModal('movement-import', MovementImportStepModal as any, { ...financeConfig, size: 'xl' });
  registerModal('payment', PaymentFormModal as any, financeConfig);
  registerModal('bank-transfer-receipt', BankTransferReceiptModal as any, { ...financeConfig, size: 'md' });
  
  registerModal('general-costs', GeneralCostForm as any, { 
    ...financeConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      organizationId: data?.organizationId,
      generalCostId: data?.generalCostId,
      mode: data?.generalCostId ? 'edit' : (data?.mode || 'create')
    })
  });
  registerModal('general-costs-payment', GeneralCostPaymentForm as any, {
    ...financeConfig,
    mapDataToProps: (data) => ({
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
      mode: data?.paymentId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  
  registerModal('material-form', MaterialFormModal as any, projectConfig);
  registerModal('material-category-form', MaterialCategoryFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('brand-form', BrandFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('product-form', AdminProductModal as any, projectConfig);
  registerModal('unit-presentation-form', UnitPresentationFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('provider-product', ProviderProductModal as any, projectConfig);
  registerModal('custom-product', ProductModal as any, projectConfig);
  
  registerModal('attendance', PersonnelAttendanceModal as any, projectConfig);
  registerModal('personnel', PersonnelAddModal as any, projectConfig);
  registerModal('personnel-data', PersonnelDataModal as any, projectConfig);
  registerModal('personnelRates', PersonnelRatesModal as any, projectConfig);
  registerModal('labor-type-form', AdminLaborModal as any, adminConfig);
  
  registerModal('subcontract', SubcontractFormModal as any, { ...projectConfig, size: 'xl' });
  registerModal('subcontract-bid', SubcontractBidFormModal as any, projectConfig);
  registerModal('subcontract-award', SubcontractAwardModal as any, projectConfig);
  registerModal('subcontract-task', SubcontractTaskFormModal as any, projectConfig);
  
  registerModal('site-log', SiteLogForm as any, {
    ...projectConfig,
    size: 'xl',
    mapDataToProps: (data) => ({
      siteLogId: data?.id || data?.data?.id,
      mode: data?.mode || (data?.id || data?.data?.id ? (data?.isEditing ? 'edit' : 'view') : 'create'),
    })
  });
  registerModal('siteLogType', SiteLogTypeForm as any, {
    ...adminConfig,
    mapDataToProps: (data) => ({
      siteLogType: data?.siteLogType,
      siteLogTypeId: data?.siteLogTypeId,
      mode: data?.mode || (data?.siteLogType ? 'edit' : 'create'),
    })
  });
  
  registerModal('course', CourseModal as any, { ...learningConfig, size: 'xl' });
  registerModal('course-module', CourseModuleFormModal as any, learningConfig);
  registerModal('lesson', LessonFormModal as any, learningConfig);
  registerModal('course-enrollment', CourseEnrollmentModal as any, learningConfig);
  registerModal('coupon', CouponFormModal as any, learningConfig);
  registerModal('payment-method', PaymentMethodModal as any, { ...learningConfig, size: 'md' });
  
  registerModal('admin-user', UserFormModal as any, adminConfig);
  registerModal('admin-organization', OrganizationFormModal as any, { ...adminConfig, size: 'lg' });
  registerModal('changelog-entry', ChangelogFormModal as any, adminConfig);
  registerModal('notification', NotificationFormModal as any, adminConfig);
  registerModal('announcement', AnnouncementFormModal as any, adminConfig);
  registerModal('support-conversation-start', SupportConversationStartModal as any, adminConfig);
  registerModal('plan', PlanFormModal as any, adminConfig);
  registerModal('plan-price', PlanPriceFormModal as any, adminConfig);
  registerModal('downgrade', DowngradeModal as any, adminConfig);
  
  registerModal('pdf-exporter', PDFExporterModal as any, { ...generalConfig, size: 'full' });
  
  registerModal('delete-confirmation', DeleteConfirmationForm as any, { 
    ...generalConfig, 
    size: 'sm',
    preventCloseOnBackdrop: true,
  });
}
