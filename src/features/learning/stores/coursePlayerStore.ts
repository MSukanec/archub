import { create } from "zustand";
type TabName = "Visión General" | "Contenido" | "Reproductor" | "Apuntes" | "Marcadores";
type State = {
  activeTab: TabName;
  currentLessonId: string | null;
  pendingSeek: number | null;
  vimeoPlayer: any | null;
  setActiveTab: (t: TabName) => void;
  goToLesson: (lessonId: string, seek?: number | null) => void;
  clearPendingSeek: () => void;
  setVimeoPlayer: (player: any | null) => void;
  reset: () => void;
};
const initialState = {
  activeTab: "Visión General" as TabName,
  currentLessonId: null,
  pendingSeek: null,
  vimeoPlayer: null,
};
export const useCoursePlayerStore = create<State>((set) => ({
  ...initialState,
  setActiveTab: (t) => set({ activeTab: t }),
  goToLesson: (lessonId, seek = null) => {
    set({
      activeTab: "Reproductor",
      currentLessonId: lessonId,
      pendingSeek: seek ?? null,
    });
  },
  clearPendingSeek: () => set({ pendingSeek: null }),
  setVimeoPlayer: (player) => set({ vimeoPlayer: player }),
  reset: () => set(initialState),
}));
