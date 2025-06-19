import { create } from 'zustand'

interface NavigationItem {
  id: string
  name: string
  icon: string
  href: string
}

interface NavigationState {
  currentPage: string
  sidebarOpen: boolean
  userMenuOpen: boolean
  navigationItems: NavigationItem[]
  setCurrentPage: (page: string) => void
  setSidebarOpen: (open: boolean) => void
  setUserMenuOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleUserMenu: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  userMenuOpen: false,
  navigationItems: [
    { id: 'dashboard', name: 'Panel Principal', icon: 'home', href: '/' },
    { id: 'organizations', name: 'Organizaciones', icon: 'building', href: '/organizaciones' },
    { id: 'projects', name: 'Proyectos', icon: 'folder', href: '/projects' },
    { id: 'tasks', name: 'Tareas', icon: 'check-square', href: '/tasks' },
    { id: 'team', name: 'Equipo', icon: 'users', href: '/team' },
    { id: 'billing', name: 'Facturación', icon: 'credit-card', href: '/billing' },
    { id: 'reports', name: 'Reportes', icon: 'bar-chart-3', href: '/reports' },
  ],

  setCurrentPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setUserMenuOpen: (open) => set({ userMenuOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleUserMenu: () => set((state) => ({ userMenuOpen: !state.userMenuOpen })),
}))
