// New names (preferred)
export { ModalLayout } from './foundation/ModalLayout';
export { ModalHeader } from './foundation/ModalHeader';
export { ModalFooter } from './foundation/ModalFooter';
export { default as ModalBody } from './foundation/ModalBody';
export { ModalStepHeader } from './foundation/ModalStepHeader';
export { ModalStepFooter } from './foundation/ModalStepFooter';
export { ModalSectionButton } from './foundation/ModalSectionButton';

// Legacy aliases (deprecated, for backwards compatibility)
export { ModalLayout as FormModalLayout } from './foundation/ModalLayout';
export { ModalHeader as FormModalHeader } from './foundation/ModalHeader';
export { ModalFooter as FormModalFooter } from './foundation/ModalFooter';
export { default as FormModalBody } from './foundation/ModalBody';
export { ModalStepHeader as FormModalStepHeader } from './foundation/ModalStepHeader';
export { ModalStepFooter as FormModalStepFooter } from './foundation/ModalStepFooter';
export { ModalSectionButton as FormSubsectionButton } from './foundation/ModalSectionButton';

// State
export { useGlobalModalStore } from './state/globalModalStore';
export { useModalPanelStore } from './state/panelStore';

// Factory
export { ModalFactory } from './factory/ModalFactory';
export * from './factory/types';

// Utils
export * from './utils/modal-readiness';
export { ModalErrorBoundary, useModalErrorHandler, withModalErrorBoundary, FormModalErrorBoundary, DataModalErrorBoundary } from './utils/ModalErrorBoundary';
