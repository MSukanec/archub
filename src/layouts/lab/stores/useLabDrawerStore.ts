import { create } from 'zustand';
type DrawerWidth = 'sm'| 'md'| 'lg'| 'xl';
interface DrawerState {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  content: React.ReactNode;
  width: DrawerWidth;
}
interface LabDrawerStore {
  drawer: DrawerState;
  openDrawer: (options: {
    title?: string;
    subtitle?: string;
    content: React.ReactNode;
    width?: DrawerWidth;
  }) => void;
  closeDrawer: () => void;
  setDrawerContent: (content: React.ReactNode) => void;
}
export const useLabDrawerStore = create<LabDrawerStore>((set) => ({
  drawer: {
    isOpen: false,
    title: undefined,
    subtitle: undefined,
    content: null,
    width: 'md',
  },
  openDrawer: ({ title, subtitle, content, width = 'md'}) => {
    set({
      drawer: {
        isOpen: true,
        title,
        subtitle,
        content,
        width,
      },
    });
  },
  closeDrawer: () => {
    set((state) => ({
      drawer: {
        ...state.drawer,
        isOpen: false,
      },
    }));
  },
  setDrawerContent: (content) => {
    set((state) => ({
      drawer: {
        ...state.drawer,
        content,
      },
    }));
  },
}));
