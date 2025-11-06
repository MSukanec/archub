export type ModalType = "member" | "partner" | "movement" | "movement-concept" | "organization-movement-concept" | "movement-import" | "bitacora" | "contact" | "gallery" | "board" | "card" | "list" | "project" | "project-client" | "document-upload" | "document-folder" | "budget" | "budget-item" | "construction-task" | "construction-single-task" | "construction-task-schedule" | "delete-confirmation" | "organization" | "installment" | "material-form" | "material-category-form" | "brand-form" | "product-form" | "unit-presentation-form" | "dependency-connection" | "phase" | "construction-phase" | "budget-task-bulk-add" | "task-category" | "task-division" | "task-parameter" | "task-parameter-option" | "task" | "analysis-task" | "admin-user" | "admin-organization" | "changelog-entry" | "site-log" | "attendance" | "personnel" | "personnel-data" | "personnelRates" | "profile-organization" | "parameter-visibility-config" | "add-parameter-to-canvas" | "subcontract" | "subcontract-bid" | "subcontract-award" | "subcontract-task" | "insurance" | "renew-insurance" | "client-payment-plans" | "client-installment" | "pdf-exporter" | "provider-product" | "custom-product" | "indirect" | "labor-type-form" | "cost-modal" | "course" | "course-module" | "lesson" | "course-enrollment" | "coupon" | "payment-method" | "notification" | "bank-transfer-receipt" | "movements-view" | "site-log-view" | "general-costs" | "announcement" | "payment" | "support-conversation-start";

export interface ModalData {
  [key: string]: any;
}

// Nuevos tipos para soporte de modales con pasos múltiples
export interface StepModalConfig {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  stepDescription?: string;
}

export interface StepFooterAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  loading?: boolean;
}

export interface StepModalFooterConfig {
  cancelAction?: StepFooterAction;
  previousAction?: StepFooterAction;
  nextAction?: StepFooterAction;
  submitAction?: StepFooterAction;
  customActions?: StepFooterAction[];
}