import { registerModal, ModalConfig } from './registry';

import { InviteMemberModal, OrganizationModal, MemberActionConfirmationModal } from '@/features/organization';
import { CapitalParticipantModal, PartnerContributionModal, PartnerWithdrawalModal, CapitalTransactionModal } from '@/features/capital';
import { ProjectModal } from '@/features/projects';
import { GalleryFormModal, DocumentFolderFormModal, DocumentUploadFormModal, BudgetFormModal, BudgetTaskFormModal, ConstructionPhaseFormModal, ConstructionTaskScheduleModal, DependencyConnectionModal, IndirectModal, InsuranceFormModal, RenewInsuranceFormModal, TaskMultiModal, BudgetItemModal, CostModal, TaskCategoryFormModal, TaskDivisionFormModal, TaskParameterFormModal, TaskParameterOptionFormModal, ParameterVisibilityConfigModal, AddParameterToCanvasModal, TaskModal, BoardFormModal, CardFormModal, ListFormModal, OrganizationMovementConceptFormModal, ProfileOrganizationFormModal, MemberFormModal } from '@/features/legacy';
import { ContactForm } from '@/features/contacts/forms/ContactForm';
import { ContactTypeForm } from '@/features/contacts/forms/ContactTypeForm';
import { ClientForm } from '@/features/clients/forms/ClientForm';
import { ClientPaymentModal } from '@/features/clients/modals/ClientPaymentModal';
import ClientRoleForm from '@/features/clients/forms/ClientRoleForm';
import { ClientCommitmentForm } from '@/features/clients/forms/ClientCommitmentForm';
import { ClientScheduleItemForm } from '@/features/clients/forms/ClientScheduleItemForm';
import { MovementModal, MovementModalView, MovementImportStepModal, MovementConceptFormModal, BankTransferReceiptModal, PaymentFormModal } from '@/features/finances';
import { default as DeleteConfirmationForm } from '@/components/forms/DeleteConfirmationForm';
import { default as PaymentFeedbackModal } from '@/components/forms/PaymentFeedbackModal';
import { UniversalImportForm } from '@/features/imports';
import { MaterialFormModal, MaterialCategoryFormModal, BrandFormModal, UnitPresentationFormModal, AdminProductModal, ProductModal, ProviderProductModal, MaterialPaymentModal, PurchaseOrderForm, MaterialPurchaseForm } from '@/features/materials';
import { UserFormModal, ChangelogFormModal, NotificationFormModal, AnnouncementFormModal, SupportConversationStartModal, PlanFormModal, PlanPriceFormModal, DowngradeModal, UpgradeModal, ResetTestDataModal } from '@/features/users';
import SiteLogForm from '@/features/sitelog/forms/SiteLogForm';
import { SiteLogTypeForm } from '@/features/sitelog/forms/SiteLogTypeForm';
import { ProjectTypeModal } from '@/features/projects/modals/ProjectTypeModal';
import { ProjectModalityModal } from '@/features/projects/modals/ProjectModalityModal';
import { PersonnelAttendanceModal, PersonnelAddModal, PersonnelDataModal, PersonnelRatesModal, AdminLaborModal, PersonnelPaymentModal } from '@/features/personnel';
import { SubcontractFormModal, SubcontractBidFormModal, SubcontractAwardModal, SubcontractTaskFormModal } from '@/features/subcontracts';
import { PDFExporterModal } from '@/features/pdf';
import GeneralCostForm from '@/features/general-costs/forms/GeneralCostForm';
import GeneralCostView from '@/features/general-costs/forms/GeneralCostView';
import GeneralCostPaymentForm from '@/features/general-costs/forms/GeneralCostPaymentForm';
import GeneralCostPaymentView from '@/features/general-costs/forms/GeneralCostPaymentView';
import GeneralCostCategoryForm from '@/features/general-costs/forms/GeneralCostCategoryForm';
import { CourseModal, CourseModuleFormModal, LessonFormModal, CourseEnrollmentModal, CouponFormModal, PaymentMethodModal, TestimonialForm } from '@/features/learning';
import { HeroSectionForm } from '@/features/layout';
import ForumThreadForm from '@/features/forum/forms/ForumThreadForm';
import ForumPostForm from '@/features/forum/forms/ForumPostForm';
import ForumCategoryForm from '@/features/forum/forms/ForumCategoryForm';
import CourseForumCategoryForm from '@/features/forum/forms/CourseForumCategoryForm';
import { NewMovementModal } from '@/features/finances/modals/NewMovementModal';
import { DataHealthDetailsModal } from '@/core/data-health/components/DataHealthDetailsModal';
import { NewMoodboardItemModal } from '@/features/moodboard';

const organizationConfig: ModalConfig = { category: 'organization', size: 'md' };
const foundersConfig: ModalConfig = { category: 'founders', size: 'md' };
const forumConfig: ModalConfig = { category: 'forum', size: 'md' };
const projectConfig: ModalConfig = { category: 'project', size: 'lg' };
const financeConfig: ModalConfig = { category: 'finance', size: 'lg' };
const learningConfig: ModalConfig = { category: 'learning', size: 'lg' };
const adminConfig: ModalConfig = { category: 'admin', size: 'md' };
const generalConfig: ModalConfig = { category: 'general', size: 'md' };

let initialized = false;

export function initializeModalRegistry(): void {
  if (initialized) return;
  initialized = true;

  registerModal('member', InviteMemberModal as any, {
    ...organizationConfig,
    mapDataToProps: (data) => ({
      modalData: {
        organizationId: data?.organizationId,
        editingMember: data?.editingMember,
        defaultEmail: data?.defaultEmail,
        mode: data?.editingMember ? 'edit' : 'create',
      },
    }),
  });
  // Capital module modals
  registerModal('capital-participant', CapitalParticipantModal as any, {
    ...organizationConfig,
    mapDataToProps: (data) => {
      if (!data?.organizationId) {
        console.warn('[registerModal:capital-participant] organizationId is missing');
      }
      return {
        modalData: {
          organizationId: data?.organizationId,
          participantId: data?.participantId || data?.partnerId,
          mode: (data?.participantId || data?.partnerId) ? 'edit' : 'create',
        },
      };
    },
  });
  registerModal('capital-contribution', PartnerContributionModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => {
      const contributionId = data?.contributionId || data?.paymentId;
      return {
        modalData: {
          projectId: data?.projectId,
          organizationId: data?.organizationId,
          contributionId,
        },
        mode: contributionId ? (data?.mode || 'edit') : (data?.mode || 'create')
      };
    }
  });
  registerModal('capital-withdrawal', PartnerWithdrawalModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => {
      const withdrawalId = data?.withdrawalId || data?.paymentId;
      return {
        modalData: {
          projectId: data?.projectId,
          organizationId: data?.organizationId,
          withdrawalId,
        },
        mode: withdrawalId ? (data?.mode || 'edit') : (data?.mode || 'create')
      };
    }
  });
  // Legacy aliases for backward compatibility
  registerModal('partner', CapitalParticipantModal as any, {
    ...organizationConfig,
    mapDataToProps: (data) => ({
      modalData: {
        organizationId: data?.organizationId,
        participantId: data?.partnerId,
        mode: data?.partnerId ? 'edit' : 'create',
      },
    }),
  });
  registerModal('partner-contribution', PartnerContributionModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => {
      const contributionId = data?.contributionId || data?.paymentId;
      return {
        modalData: {
          projectId: data?.projectId,
          organizationId: data?.organizationId,
          contributionId,
        },
        mode: contributionId ? (data?.mode || 'edit') : (data?.mode || 'create')
      };
    }
  });
  registerModal('partner-withdrawal', PartnerWithdrawalModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => {
      const withdrawalId = data?.withdrawalId || data?.paymentId;
      return {
        modalData: {
          projectId: data?.projectId,
          organizationId: data?.organizationId,
          withdrawalId,
        },
        mode: withdrawalId ? (data?.mode || 'edit') : (data?.mode || 'create')
      };
    }
  });
  registerModal('capital-transaction', CapitalTransactionModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => ({
      modalData: {
        projectId: data?.projectId,
        organizationId: data?.organizationId,
      },
    })
  });
  registerModal('board', BoardFormModal as any, organizationConfig);
  registerModal('card', CardFormModal as any, organizationConfig);
  registerModal('list', ListFormModal as any, organizationConfig);
  registerModal('organization', OrganizationModal as any, { ...organizationConfig, size: 'lg' });
  registerModal('profile-organization', ProfileOrganizationFormModal as any, organizationConfig);
  registerModal('organization-movement-concept', OrganizationMovementConceptFormModal as any, organizationConfig);
  
  registerModal('project', ProjectModal as any, { 
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
  registerModal('projectType', ProjectTypeModal as any, { 
    ...projectConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      projectType: data?.projectType,
      mode: data?.isEditing || data?.projectType ? 'edit' : 'create',
    }),
  });
  registerModal('projectModality', ProjectModalityModal as any, { 
    ...projectConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      projectModality: data?.projectModality,
      mode: data?.isEditing || data?.projectModality ? 'edit' : 'create',
    }),
  });
  
  registerModal('contact', ContactForm as any, { 
    ...generalConfig, 
    size: 'xl',
    mapDataToProps: (data) => {
      const mapped = {
        modalData: {
          contactId: data?.contactId || data?.contact?.id,
          contact: data?.contact,
        },
        mode: data?.mode || 'create',
      };
      return mapped;
    },
  });
  registerModal('contactType', ContactTypeForm as any, { 
    ...generalConfig, 
    size: 'sm',
    mapDataToProps: (data) => ({
      contactType: data?.contactType,
      mode: data?.isEditing || data?.contactType ? 'edit' : 'create',
    }),
  });
  
  registerModal('project-client', ClientForm as any, { 
    ...projectConfig, 
    size: 'xl',
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      clientId: data?.clientId,
      mode: data?.clientId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('client-payment', ClientPaymentModal as any, { 
    ...financeConfig,
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
      mode: data?.paymentId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('installment', ClientPaymentModal as any, { 
    ...financeConfig,
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
      mode: data?.paymentId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('client-commitment', ClientCommitmentForm as any, { 
    ...financeConfig,
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      commitmentId: data?.commitmentId,
      mode: data?.commitmentId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('clientRole', ClientRoleForm as any, { 
    ...generalConfig, 
    size: 'sm',
    mapDataToProps: (data) => ({
      clientRole: data?.clientRole,
      mode: data?.clientRole ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('client-schedule-item', ClientScheduleItemForm as any, {
    ...financeConfig,
    size: 'md',
    mapDataToProps: (data) => ({
      scheduleId: data?.scheduleId,
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      commitmentId: data?.commitmentId,
      mode: data?.scheduleId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  
  registerModal('movement', MovementModal as any, financeConfig);
  registerModal('movements-view', MovementModalView as any, financeConfig);
  registerModal('movement-concept', MovementConceptFormModal as any, { ...financeConfig, size: 'md' });
  registerModal('movement-import', MovementImportStepModal as any, { ...financeConfig, size: 'xl' });
  registerModal('payment', PaymentFormModal as any, financeConfig);
  registerModal('bank-transfer-receipt', BankTransferReceiptModal as any, { 
    ...financeConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      btpId: data?.btpId,
      paymentId: data?.paymentId,
      hasReceipt: data?.hasReceipt ?? true,
    })
  });
  
  registerModal('universal-import', UniversalImportForm as any, {
    ...generalConfig,
    size: 'xl',
    mapDataToProps: (data) => ({
      config: data?.config,
    }),
  });
  
  registerModal('general-costs', GeneralCostForm as any, { 
    ...financeConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      organizationId: data?.organizationId,
      generalCostId: data?.generalCostId,
      mode: data?.generalCostId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('general-costs-view', GeneralCostView as any, {
    ...financeConfig,
    size: 'md',
    mapDataToProps: (data) => ({
      generalCostId: data?.generalCostId,
    })
  });
  
  registerModal('general-costs-payment', GeneralCostPaymentForm as any, {
    ...financeConfig,
    mapDataToProps: (data) => ({
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
      mode: data?.paymentId ? 'edit' : 'create'
    })
  });
  registerModal('general-costs-payment-view', GeneralCostPaymentView as any, {
    ...financeConfig,
    mapDataToProps: (data) => ({
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
    })
  });
  registerModal('generalCostCategory', GeneralCostCategoryForm as any, { 
    ...generalConfig, 
    size: 'md',
    mapDataToProps: (data) => ({
      modalData: { category: data?.category },
      mode: data?.category ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  
  registerModal('material-form', MaterialFormModal as any, projectConfig);
  registerModal('material-category-form', MaterialCategoryFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('brand-form', BrandFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('product-form', AdminProductModal as any, projectConfig);
  registerModal('unit-presentation-form', UnitPresentationFormModal as any, { ...projectConfig, size: 'md' });
  registerModal('provider-product', ProviderProductModal as any, projectConfig);
  registerModal('custom-product', ProductModal as any, projectConfig);
  registerModal('material-payment', MaterialPaymentModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
      mode: data?.paymentId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('purchase-order', PurchaseOrderForm as any, {
    ...projectConfig,
    size: 'lg',
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      orderId: data?.orderId,
      mode: data?.orderId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  registerModal('material-purchase', MaterialPurchaseForm as any, {
    ...projectConfig,
    size: 'lg',
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      purchaseId: data?.purchaseId,
      mode: data?.purchaseId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
  
  registerModal('attendance', PersonnelAttendanceModal as any, projectConfig);
  registerModal('personnel', PersonnelAddModal as any, projectConfig);
  registerModal('personnel-data', PersonnelDataModal as any, projectConfig);
  registerModal('personnelRates', PersonnelRatesModal as any, projectConfig);
  registerModal('personnel-payment', PersonnelPaymentModal as any, {
    ...financeConfig,
    mapDataToProps: (data) => ({
      projectId: data?.projectId,
      organizationId: data?.organizationId,
      paymentId: data?.paymentId,
      mode: data?.paymentId ? (data?.mode || 'edit') : (data?.mode || 'create')
    })
  });
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
  registerModal('testimonial', TestimonialForm as any, {
    ...learningConfig,
    size: 'md',
    mapDataToProps: (data) => ({
      modalData: {
        courseId: data?.courseId,
        testimonial: data?.testimonial,
      },
      mode: data?.testimonial ? 'edit' : 'create',
    }),
  });
  
  registerModal('admin-user', UserFormModal as any, adminConfig);
  registerModal('admin-organization', OrganizationModal as any, { ...adminConfig, size: 'lg' });
  registerModal('changelog-entry', ChangelogFormModal as any, adminConfig);
  registerModal('notification', NotificationFormModal as any, adminConfig);
  registerModal('announcement', AnnouncementFormModal as any, adminConfig);
  registerModal('support-conversation-start', SupportConversationStartModal as any, adminConfig);
  registerModal('plan', PlanFormModal as any, adminConfig);
  registerModal('plan-price', PlanPriceFormModal as any, adminConfig);
  registerModal('downgrade', DowngradeModal as any, adminConfig);
  registerModal('upgrade', UpgradeModal as any, adminConfig);
  registerModal('reset-test-data', ResetTestDataModal as any, { ...adminConfig, size: 'md' });
  
  registerModal('pdf-exporter', PDFExporterModal as any, { ...generalConfig, size: 'full' });
  
  registerModal('delete-confirmation', DeleteConfirmationForm as any, { 
    ...generalConfig, 
    size: 'sm',
    preventCloseOnBackdrop: true,
  });
  
  registerModal('member-action-confirmation', MemberActionConfirmationModal as any, { 
    ...organizationConfig, 
    size: 'md',
    preventCloseOnBackdrop: true,
  });
  
  registerModal('payment-feedback', PaymentFeedbackModal as any, {
    ...generalConfig,
    size: 'sm',
    mapDataToProps: (data) => ({
      modalData: {
        type: data?.type || 'success',
        title: data?.title,
        description: data?.description,
        planName: data?.planName,
        isFounder: data?.isFounder,
      }
    }),
  });
  
  registerModal('hero-section-form', HeroSectionForm as any, {
    ...adminConfig,
    size: 'lg',
    mapDataToProps: (data) => ({
      modalData: {
        mode: data?.mode || 'create',
        section: data?.section,
      }
    }),
  });

  registerModal('forum-thread', ForumThreadForm as any, {
    ...forumConfig,
    mapDataToProps: (data) => ({
      modalData: {
        categoryId: data?.categoryId,
        categorySlug: data?.categorySlug,
        thread: data?.thread,
      },
      mode: data?.thread ? (data?.mode || 'edit') : (data?.mode || 'create'),
    }),
  });

  registerModal('forum-post', ForumPostForm as any, {
    ...forumConfig,
    mapDataToProps: (data) => ({
      modalData: {
        threadId: data?.threadId,
        parentId: data?.parentId,
        post: data?.post,
      },
      mode: data?.post ? (data?.mode || 'edit') : (data?.mode || 'create'),
    }),
  });

  registerModal('forum-category', ForumCategoryForm as any, {
    ...forumConfig,
    mapDataToProps: (data) => ({
      modalData: {
        category: data?.category,
        mode: data?.category ? (data?.mode || 'edit') : (data?.mode || 'create'),
      },
    }),
  });

  registerModal('course-forum-category', CourseForumCategoryForm as any, {
    ...forumConfig,
    mapDataToProps: (data) => ({
      modalData: {
        courseId: data?.courseId,
        category: data?.category,
        mode: data?.category ? (data?.mode || 'edit') : (data?.mode || 'create'),
      },
    }),
  });

  registerModal('unified-payment', NewMovementModal as any, {
    ...financeConfig,
    size: 'lg',
    mapDataToProps: (data) => ({
      modalData: {
        ...data,
        projectId: data?.projectId,
        organizationId: data?.organizationId,
      },
    }),
  });

  registerModal('data-health-details', DataHealthDetailsModal as any, {
    ...generalConfig,
    size: 'lg',
    mapDataToProps: (data) => ({
      modalData: {
        issue: data?.issue,
      },
    }),
  });

  registerModal('new-moodboard-item', NewMoodboardItemModal as any, {
    ...projectConfig,
    size: 'lg',
    mapDataToProps: (data) => ({
      modalData: {
        projectId: data?.projectId,
        organizationId: data?.organizationId,
      },
    }),
  });
}
