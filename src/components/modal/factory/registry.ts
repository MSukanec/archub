import { ComponentType } from 'react';
import { ModalType, ModalData } from './types';

export interface BaseModalProps {
  modalData?: ModalData;
  onClose: () => void;
}

export interface ModalRegistryEntry<P extends BaseModalProps = BaseModalProps> {
  component: ComponentType<P>;
  displayName?: string;
  category?: 'admin' | 'project' | 'finance' | 'organization' | 'learning' | 'general';
}

export type ModalRegistryType = {
  [K in ModalType]?: ModalRegistryEntry;
};

const registry: ModalRegistryType = {};

export function registerModal<P extends BaseModalProps>(
  type: ModalType,
  component: ComponentType<P>,
  options?: Omit<ModalRegistryEntry<P>, 'component'>
): void {
  registry[type] = {
    component: component as ComponentType<BaseModalProps>,
    ...options,
  };
}

export function getModal(type: ModalType): ModalRegistryEntry | undefined {
  return registry[type];
}

export function hasModal(type: ModalType): boolean {
  return type in registry;
}

export function getRegisteredModals(): ModalType[] {
  return Object.keys(registry) as ModalType[];
}

export { registry as modalRegistry };
