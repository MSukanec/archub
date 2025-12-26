export { type ModalType, type ModalData, type ModalSize, type ModalCategory, type ModalConfig } from './registry';
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
