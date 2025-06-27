import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isExpanded: boolean
  openAccordions: string[]
  context: 'general' | 'admin' | 'profile'
  setExpanded: (expanded: boolean) => void
  toggleAccordion: (accordionId: string) => void
  setContext: (context: 'general' | 'admin' | 'profile') => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isExpanded: false,
      openAccordions: ['organizacion'], // Organización abierto por defecto
      context: 'general',
      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
      toggleAccordion: (accordionId: string) => {
        const { openAccordions } = get()
        set({
          openAccordions: openAccordions.includes(accordionId)
            ? openAccordions.filter(id => id !== accordionId)
            : [...openAccordions, accordionId]
        })
      },
      setContext: (context: 'general' | 'admin' | 'profile') => set({ context }),
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