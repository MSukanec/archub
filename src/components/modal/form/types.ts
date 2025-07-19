export type ModalType = "member" | "movement" | "movement-concept" | "organization-movement-concept" | "movement-import" | "bitacora" | "contact" | "gallery" | "board" | "card" | "list" | "project" | "project-client" | "document-upload" | "document-folder" | "budget" | "construction-task" | "delete-confirmation" | "organization" | "installment";

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