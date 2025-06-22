import { create } from 'zustand';

interface SidebarStore {
  activeSidebarMenu: string | null;
  isSidebarMenuOpen: boolean;
  setActiveSidebarMenu: (menu: string | null) => void;
  setSidebarMenuOpen: (open: boolean) => void;
  toggleSidebarMenu: (menu: string) => void;
  closeSidebarMenu: () => void;
}

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  activeSidebarMenu: null,
  isSidebarMenuOpen: false,
  
  setActiveSidebarMenu: (menu) => set({ activeSidebarMenu: menu }),
  
  setSidebarMenuOpen: (open) => set({ isSidebarMenuOpen: open }),
  
  toggleSidebarMenu: (menu) => {
    const { activeSidebarMenu, isSidebarMenuOpen } = get();
    
    if (activeSidebarMenu === menu && isSidebarMenuOpen) {
      // Close if same menu is already open
      set({ activeSidebarMenu: null, isSidebarMenuOpen: false });
    } else {
      // Open new menu
      set({ activeSidebarMenu: menu, isSidebarMenuOpen: true });
    }
  },
  
  closeSidebarMenu: () => set({ activeSidebarMenu: null, isSidebarMenuOpen: false }),
}));