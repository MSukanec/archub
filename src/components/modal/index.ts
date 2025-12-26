// ============================================================
// SEENCEL MODAL SYSTEM - v2.0 (Enterprise SaaS Level)
// ============================================================
// A professional, scalable, and reusable modal system
// inspired by Linear, Vercel, Notion, and Airtable.
// ============================================================
// Foundation Components (UI primitives)
export { 
  ModalLayout, 
  type ModalSize 
} from './foundation/ModalLayout';
export { ModalHeader } from './foundation/ModalHeader';
export { ModalFooter } from './foundation/ModalFooter';
export { default as ModalBody } from './foundation/ModalBody';
export { ModalStepHeader } from './foundation/ModalStepHeader';
export { ModalStepFooter } from './foundation/ModalStepFooter';
export { ModalSectionButton } from './foundation/ModalSectionButton';
export { 
  DrawerBase,
  type DrawerBaseProps,
  type DrawerSnapPoint 
} from './foundation/DrawerBase';
// Legacy aliases (deprecated - for backwards compatibility only)
export { ModalLayout as FormModalLayout } from './foundation/ModalLayout';
export { ModalHeader as FormModalHeader } from './foundation/ModalHeader';
export { ModalFooter as FormModalFooter } from './foundation/ModalFooter';
export { default as FormModalBody } from './foundation/ModalBody';
export { ModalStepHeader as FormModalStepHeader } from './foundation/ModalStepHeader';
export { ModalStepFooter as FormModalStepFooter } from './foundation/ModalStepFooter';
export { ModalSectionButton as FormSubsectionButton } from './foundation/ModalSectionButton';
// State Management (Zustand stores)
export { 
  useGlobalModalStore,
  useCurrentModal,
  useIsModalOpen,
  useModalStack,
  useModalStackSize,
  useCanCloseModal,
  type ModalStackItem
} from './state/globalModalStore';
/**
 * @deprecated Use local useState in modals instead. See panelStore.ts for migration guide.
 */
export { useModalPanelStore } from './state/panelStore';
// Provider & Container (New in v2.0)
export { ModalProvider } from './ModalProvider';
export { ModalContainer } from './ModalContainer';
// Registry (Modal registration and lookup)
export { 
  registerModal, 
  getModal, 
  hasModal, 
  getRegisteredModals,
  getModalsByCategory,
  modalRegistry,
  type ModalConfig,
  type ModalRegistryEntry,
  type ModalCategory,
  type ModalType,
  type ModalData
} from './factory/registry';
export { initializeModalRegistry } from './factory/registerModals';
// Types
export type { 
  StepModalConfig,
  StepFooterAction,
  StepModalFooterConfig
} from './factory/types';
// Utilities (Error handling, readiness, etc.)
export * from './utils/modal-readiness';
export { 
  ModalErrorBoundary, 
  useModalErrorHandler, 
  withModalErrorBoundary, 
  FormModalErrorBoundary, 
  DataModalErrorBoundary 
} from './utils/ModalErrorBoundary';
