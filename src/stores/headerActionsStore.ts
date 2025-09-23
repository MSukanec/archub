import React from 'react';
import { create } from 'zustand';

interface ActionButton {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  onClick?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
}

interface HeaderActionsState {
  organizationActions: ActionButton[];
  projectActions: ActionButton[];
  setOrganizationActions: (actions: ActionButton[]) => void;
  setProjectActions: (actions: ActionButton[]) => void;
  clearActions: () => void;
}

export const useHeaderActionsStore = create<HeaderActionsState>((set) => ({
  organizationActions: [],
  projectActions: [],
  setOrganizationActions: (actions) => set({ organizationActions: actions }),
  setProjectActions: (actions) => set({ projectActions: actions }),
  clearActions: () => set({ organizationActions: [], projectActions: [] })
}));