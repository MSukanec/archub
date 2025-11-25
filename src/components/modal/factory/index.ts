export * from './types';
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
} from './registry';
export { initializeModalRegistry } from './registerModals';
