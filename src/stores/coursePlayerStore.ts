import { create } from "zustand";

type TabName = "Visión General" | "Contenido" | "Lecciones" | "Apuntes" | "Marcadores";

type State = {
  activeTab: TabName;
  currentLessonId: string | null;
  pendingSeek: number | null;
  setActiveTab: (t: TabName) => void;
  goToLesson: (lessonId: string, seek?: number | null) => void;
  clearPendingSeek: () => void;
  reset: () => void;
};

const initialState = {
  activeTab: "Visión General" as TabName,
  currentLessonId: null,
  pendingSeek: null,
};

export const useCoursePlayerStore = create<State>((set) => ({
  ...initialState,
  setActiveTab: (t) => set({ activeTab: t }),
  goToLesson: (lessonId, seek = null) => {
    console.log('🎯 goToLesson llamado:', { lessonId, seek });
    set({
      activeTab: "Lecciones",
      currentLessonId: lessonId,
      pendingSeek: seek ?? null,
    });
  },
  clearPendingSeek: () => set({ pendingSeek: null }),
  reset: () => set(initialState),
}));
