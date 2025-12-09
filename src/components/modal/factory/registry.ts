import { ComponentType } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalCategory = 'admin' | 'project' | 'finance' | 'organization' | 'learning' | 'general' | 'founders' | 'forum';

export interface ModalConfig {
  size?: ModalSize;
  category?: ModalCategory;
  drawerOnMobile?: boolean;
  preventCloseOnBackdrop?: boolean;
  preventCloseOnEsc?: boolean;
  mapDataToProps?: (data: Record<string, any> | null) => Record<string, any>;
}

export interface ModalRegistryEntry {
  component: ComponentType<any>;
  config: ModalConfig;
}

const registry: Record<string, ModalRegistryEntry> = {};

export function registerModal(
  type: string,
  component: ComponentType<any>,
  config: ModalConfig = {}
): void {
  registry[type] = {
    component,
    config: {
      size: 'md',
      drawerOnMobile: true,
      preventCloseOnBackdrop: false,
      preventCloseOnEsc: false,
      ...config,
    },
  };
}

export function getModal(type: string): ModalRegistryEntry | undefined {
  return registry[type];
}

export function hasModal(type: string): boolean {
  return type in registry;
}

export function getRegisteredModals(): string[] {
  return Object.keys(registry);
}

export function getModalsByCategory(category: ModalCategory): string[] {
  return Object.entries(registry)
    .filter(([_, entry]) => entry.config.category === category)
    .map(([type]) => type);
}

export { registry as modalRegistry };

export type ModalType = string;
export type ModalData = Record<string, any>;
