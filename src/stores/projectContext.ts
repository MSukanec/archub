import { create } from 'zustand'

interface ProjectContextState {
  selectedProjectId: string | null
  isGlobalView: boolean
  setSelectedProject: (projectId: string | null) => void
}

export const useProjectContext = create<ProjectContextState>((set) => ({
  selectedProjectId: null,
  isGlobalView: true, // Start in global view by default
  setSelectedProject: (projectId: string | null) => set({ 
    selectedProjectId: projectId,
    isGlobalView: projectId === null
  }),
}))