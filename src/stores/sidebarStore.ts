import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  isDocked: boolean
  isHovered: boolean
  setDocked: (docked: boolean) => void
  setHovered: (hovered: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isDocked: false,
      isHovered: false,
      setDocked: (docked: boolean) => set({ isDocked: docked }),
      setHovered: (hovered: boolean) => set({ isHovered: hovered }),
    }),
    {
      name: 'sidebar-store',
      partialize: (state) => ({ isDocked: state.isDocked }),
    }
  )
)

// Secondary Sidebar Store
interface SecondarySidebarState {
  isDocked: boolean
  isHovered: boolean
  setDocked: (docked: boolean) => void
  setHovered: (hovered: boolean) => void
}

export const useSecondarySidebarStore = create<SecondarySidebarState>()(
  persist(
    (set) => ({
      isDocked: false,
      isHovered: false,
      setDocked: (docked: boolean) => set({ isDocked: docked }),
      setHovered: (hovered: boolean) => set({ isHovered: hovered }),
    }),
    {
      name: 'secondary-sidebar-store',
      partialize: (state) => ({ isDocked: state.isDocked }),
    }
  )
)

// Course Sidebar Store
interface CourseSidebarState {
  isVisible: boolean
  modules: any[]
  lessons: any[]
  currentLessonId?: string
  onLessonClick?: (lessonId: string) => void
  setVisible: (visible: boolean) => void
  setData: (modules: any[], lessons: any[]) => void
  setCurrentLesson: (lessonId?: string) => void
  setOnLessonClick: (callback?: (lessonId: string) => void) => void
}

export const useCourseSidebarStore = create<CourseSidebarState>()((set) => ({
  isVisible: false,
  modules: [],
  lessons: [],
  currentLessonId: undefined,
  onLessonClick: undefined,
  setVisible: (visible: boolean) => set({ isVisible: visible }),
  setData: (modules: any[], lessons: any[]) => set({ modules, lessons }),
  setCurrentLesson: (lessonId?: string) => set({ currentLessonId: lessonId }),
  setOnLessonClick: (callback?: (lessonId: string) => void) => set({ onLessonClick: callback }),
}))