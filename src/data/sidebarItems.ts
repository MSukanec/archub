import {
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Settings,
  LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  icon: LucideIcon
  label: string
  href: string
  section?: string
}

export const sidebarItems: SidebarItem[] = [
  {
    icon: Home,
    label: 'Dashboard',
    href: '/dashboard',
    section: 'main'
  },
  {
    icon: Users,
    label: 'Contactos',
    href: '/contactos',
    section: 'main'
  },
  {
    icon: Building,
    label: 'Gestión de Organizaciones',
    href: '/organizaciones',
    section: 'main'
  },
  {
    icon: FolderOpen,
    label: 'Gestión de Proyectos',
    href: '/proyectos',
    section: 'main'
  },
  {
    icon: FileText,
    label: 'Bitácora de Obra',
    href: '/bitacora',
    section: 'main'
  },
  {
    icon: DollarSign,
    label: 'Movimientos',
    href: '/movimientos',
    section: 'main'
  },
];