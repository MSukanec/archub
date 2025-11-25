import { registerModal } from './registry';

import { MemberFormModal, BoardFormModal, CardFormModal, ListFormModal, OrganizationMovementConceptFormModal, PartnerModal, OrganizationFormModal, ProfileOrganizationFormModal } from '@/features/organization';
import { ProjectModal, GalleryFormModal, DocumentFolderFormModal, DocumentUploadFormModal, BudgetFormModal, BudgetTaskFormModal, ConstructionPhaseFormModal, ConstructionTaskScheduleModal, DependencyConnectionModal, IndirectModal, InsuranceFormModal, RenewInsuranceFormModal, TaskMultiModal, BudgetItemModal, CostModal, TaskCategoryFormModal, TaskDivisionFormModal, TaskParameterFormModal, TaskParameterOptionFormModal, ParameterVisibilityConfigModal, AddParameterToCanvasModal, TaskModal } from '@/features/projects';
import { ContactFormModal, ContactModalView } from '@/features/contacts';
import { ClientObligationModal, ClientPaymentsModal, ClientCommitmentModal, ClientRoleModal, ProjectClientModal } from '@/features/clients';
import { MovementModal, MovementModalView, MovementImportStepModal, MovementConceptFormModal, BankTransferReceiptModal, PaymentFormModal } from '@/features/finances';
import { default as DeleteConfirmationModal } from '@/components/ui-custom/general/DeleteConfirmationModal';
import { MaterialFormModal, MaterialCategoryFormModal, BrandFormModal, UnitPresentationFormModal, AdminProductModal, ProductModal, ProviderProductModal } from '@/features/materials';
import { UserFormModal, ChangelogFormModal, NotificationFormModal, AnnouncementFormModal, SupportConversationStartModal, PlanFormModal, PlanPriceFormModal, DowngradeModal } from '@/features/users';
import { SiteLogModal } from '@/features/sitelog/modals/SiteLogModal';
import { SiteLogModalView } from '@/features/sitelog/modals/SiteLogModalView';
import { SiteLogTypeModal } from '@/features/sitelog/modals/SiteLogTypeModal';
import { ProjectTypeModal } from '@/features/projects/project-types/modals/ProjectTypeModal';
import { ProjectModalityModal } from '@/features/projects/project-modalities/modals/ProjectModalityModal';
import { PersonnelAttendanceModal, PersonnelAddModal, PersonnelDataModal, PersonnelRatesModal, AdminLaborModal } from '@/features/personnel';
import { SubcontractFormModal, SubcontractBidFormModal, SubcontractAwardModal, SubcontractTaskFormModal } from '@/features/subcontracts';
import { PDFExporterModal } from '@/features/pdf';
import { GeneralCostsModal } from '@/features/general-costs/modals/GeneralCostsModal';
import { GeneralCostsPaymentModal } from '@/features/general-costs/modals/GeneralCostsPaymentModal';
import { GeneralCostsPaymentViewModal } from '@/features/general-costs/modals/GeneralCostsPaymentViewModal';
import { CourseModal, CourseModuleFormModal, LessonFormModal, CourseEnrollmentModal, CouponFormModal, PaymentMethodModal } from '@/features/learning';

export function initializeModalRegistry(): void {
  registerModal('member', MemberFormModal as any, { category: 'organization' });
  registerModal('partner', PartnerModal as any, { category: 'organization' });
  registerModal('board', BoardFormModal as any, { category: 'organization' });
  registerModal('card', CardFormModal as any, { category: 'organization' });
  registerModal('list', ListFormModal as any, { category: 'organization' });
  registerModal('organization', OrganizationFormModal as any, { category: 'organization' });
  registerModal('profile-organization', ProfileOrganizationFormModal as any, { category: 'organization' });
  registerModal('organization-movement-concept', OrganizationMovementConceptFormModal as any, { category: 'organization' });
  
  registerModal('project', ProjectModal as any, { category: 'project' });
  registerModal('gallery', GalleryFormModal as any, { category: 'project' });
  registerModal('document-folder', DocumentFolderFormModal as any, { category: 'project' });
  registerModal('document-upload', DocumentUploadFormModal as any, { category: 'project' });
  registerModal('budget', BudgetFormModal as any, { category: 'project' });
  registerModal('budget-task-bulk-add', BudgetTaskFormModal as any, { category: 'project' });
  registerModal('construction-phase', ConstructionPhaseFormModal as any, { category: 'project' });
  registerModal('construction-task', TaskMultiModal as any, { category: 'project' });
  registerModal('construction-task-schedule', ConstructionTaskScheduleModal as any, { category: 'project' });
  registerModal('dependency-connection', DependencyConnectionModal as any, { category: 'project' });
  registerModal('budget-item', BudgetItemModal as any, { category: 'project' });
  registerModal('task', TaskModal as any, { category: 'project' });
  registerModal('analysis-task', TaskModal as any, { category: 'project' });
  registerModal('task-category', TaskCategoryFormModal as any, { category: 'project' });
  registerModal('task-division', TaskDivisionFormModal as any, { category: 'project' });
  registerModal('task-parameter', TaskParameterFormModal as any, { category: 'project' });
  registerModal('task-parameter-option', TaskParameterOptionFormModal as any, { category: 'project' });
  registerModal('parameter-visibility-config', ParameterVisibilityConfigModal as any, { category: 'project' });
  registerModal('add-parameter-to-canvas', AddParameterToCanvasModal as any, { category: 'project' });
  registerModal('insurance', InsuranceFormModal as any, { category: 'project' });
  registerModal('renew-insurance', RenewInsuranceFormModal as any, { category: 'project' });
  registerModal('indirect', IndirectModal as any, { category: 'project' });
  registerModal('cost-modal', CostModal as any, { category: 'project' });
  registerModal('projectType', ProjectTypeModal as any, { category: 'project' });
  registerModal('projectModality', ProjectModalityModal as any, { category: 'project' });
  
  registerModal('contact', ContactFormModal as any, { category: 'general' });
  
  registerModal('project-client', ProjectClientModal as any, { category: 'project' });
  registerModal('client-payment', ClientPaymentsModal as any, { category: 'finance' });
  registerModal('installment', ClientPaymentsModal as any, { category: 'finance' });
  registerModal('client-commitment', ClientCommitmentModal as any, { category: 'finance' });
  registerModal('clientRole', ClientRoleModal as any, { category: 'general' });
  
  registerModal('movement', MovementModal as any, { category: 'finance' });
  registerModal('movements-view', MovementModalView as any, { category: 'finance' });
  registerModal('movement-concept', MovementConceptFormModal as any, { category: 'finance' });
  registerModal('movement-import', MovementImportStepModal as any, { category: 'finance' });
  registerModal('payment', PaymentFormModal as any, { category: 'finance' });
  registerModal('bank-transfer-receipt', BankTransferReceiptModal as any, { category: 'finance' });
  
  registerModal('general-costs', GeneralCostsModal as any, { category: 'finance' });
  registerModal('general-costs-payment', GeneralCostsPaymentModal as any, { category: 'finance' });
  registerModal('general-costs-payment-view', GeneralCostsPaymentViewModal as any, { category: 'finance' });
  
  registerModal('material-form', MaterialFormModal as any, { category: 'project' });
  registerModal('material-category-form', MaterialCategoryFormModal as any, { category: 'project' });
  registerModal('brand-form', BrandFormModal as any, { category: 'project' });
  registerModal('product-form', AdminProductModal as any, { category: 'project' });
  registerModal('unit-presentation-form', UnitPresentationFormModal as any, { category: 'project' });
  registerModal('provider-product', ProviderProductModal as any, { category: 'project' });
  registerModal('custom-product', ProductModal as any, { category: 'project' });
  
  registerModal('attendance', PersonnelAttendanceModal as any, { category: 'project' });
  registerModal('personnel', PersonnelAddModal as any, { category: 'project' });
  registerModal('personnel-data', PersonnelDataModal as any, { category: 'project' });
  registerModal('personnelRates', PersonnelRatesModal as any, { category: 'project' });
  registerModal('labor-type-form', AdminLaborModal as any, { category: 'admin' });
  
  registerModal('subcontract', SubcontractFormModal as any, { category: 'project' });
  registerModal('subcontract-bid', SubcontractBidFormModal as any, { category: 'project' });
  registerModal('subcontract-award', SubcontractAwardModal as any, { category: 'project' });
  registerModal('subcontract-task', SubcontractTaskFormModal as any, { category: 'project' });
  
  registerModal('site-log', SiteLogModal as any, { category: 'project' });
  registerModal('site-log-view', SiteLogModalView as any, { category: 'project' });
  registerModal('siteLogType', SiteLogTypeModal as any, { category: 'admin' });
  
  registerModal('course', CourseModal as any, { category: 'learning' });
  registerModal('course-module', CourseModuleFormModal as any, { category: 'learning' });
  registerModal('lesson', LessonFormModal as any, { category: 'learning' });
  registerModal('course-enrollment', CourseEnrollmentModal as any, { category: 'learning' });
  registerModal('coupon', CouponFormModal as any, { category: 'learning' });
  registerModal('payment-method', PaymentMethodModal as any, { category: 'learning' });
  
  registerModal('admin-user', UserFormModal as any, { category: 'admin' });
  registerModal('admin-organization', OrganizationFormModal as any, { category: 'admin' });
  registerModal('changelog-entry', ChangelogFormModal as any, { category: 'admin' });
  registerModal('notification', NotificationFormModal as any, { category: 'admin' });
  registerModal('announcement', AnnouncementFormModal as any, { category: 'admin' });
  registerModal('support-conversation-start', SupportConversationStartModal as any, { category: 'admin' });
  registerModal('plan', PlanFormModal as any, { category: 'admin' });
  registerModal('plan-price', PlanPriceFormModal as any, { category: 'admin' });
  
  registerModal('pdf-exporter', PDFExporterModal as any, { category: 'general' });
  
  registerModal('delete-confirmation', DeleteConfirmationModal as any, { category: 'general' });
}
