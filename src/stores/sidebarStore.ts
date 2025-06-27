import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isExpanded: boolean
  openAccordions: string[]
  context: 'organization' | 'project' | 'admin'
  setExpanded: (expanded: boolean) => void
  toggleAccordion: (accordionId: string) => void
  setContext: (context: 'organization' | 'project' | 'admin') => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isExpanded: false,
      openAccordions: [],
      context: 'organization',
      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
      toggleAccordion: (accordionId: string) => {
        const { openAccordions } = get()
        set({
          openAccordions: openAccordions.includes(accordionId)
            ? openAccordions.filter(id => id !== accordionId)
            : [...openAccordions, accordionId]
        })
      },
      setContext: (context: 'organization' | 'project' | 'admin') => set({ context }),
    }),
    {
      name: 'sidebar-store',
      partialize: (state) => ({ 
        isExpanded: state.isExpanded, 
        openAccordions: state.openAccordions,
        context: state.context 
      }),
    }
  )
)