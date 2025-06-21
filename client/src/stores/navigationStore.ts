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
    { id: 'organizations', name: 'Gestión de Organizaciones', icon: 'building', href: '/organizaciones' },
    { id: 'projects', name: 'Gestión de Proyectos', icon: 'folder', href: '/proyectos' },
    { id: 'movements', name: 'Gestión de Movimientos', icon: 'dollar-sign', href: '/movimientos' },
    { id: 'contacts', name: 'Contactos', icon: 'users', href: '/contactos' },
    { id: 'bitacora', name: 'Bitácora de Obra', icon: 'file-text', href: '/bitacora' },
  ],

  setCurrentPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setUserMenuOpen: (open) => set({ userMenuOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleUserMenu: () => set((state) => ({ userMenuOpen: !state.userMenuOpen })),
}))
