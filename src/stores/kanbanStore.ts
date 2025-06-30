import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface KanbanState {
  currentBoardId: string | null
  setCurrentBoardId: (boardId: string | null) => void
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      currentBoardId: null,
      setCurrentBoardId: (boardId) => set({ currentBoardId: boardId }),
    }),
    {
      name: 'kanban-storage',
    }
  )
)