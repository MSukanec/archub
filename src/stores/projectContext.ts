import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProjectContextState {
  selectedProjectId: string | null
  isGlobalView: boolean
  setSelectedProject: (projectId: string | null) => void
}

export const useProjectContext = create<ProjectContextState>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      isGlobalView: true,
      setSelectedProject: (projectId: string | null) => {
        console.log("🔧 ProjectContext: Setting project to", projectId);
        set({ 
          selectedProjectId: projectId,
          isGlobalView: projectId === null
        });
      },
    }),
    {
      name: 'project-context-storage',
      partialize: (state) => ({ 
        selectedProjectId: state.selectedProjectId,
        isGlobalView: state.isGlobalView 
      }),
    }
  )
)