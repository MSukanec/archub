import {
  Settings,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Activity,
  Calculator,
  Package,
  Layers,
  ListTodo,
  User,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Wallet,
  CreditCard,
  Headphones,
  BarChart3,
  Folder,
  TrendingUp,
  MapPin,
  Crown,
  Bell,
  Globe,
  HandHeart
} from "lucide-react";

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
  restricted?: "coming_soon" | string;
  testId?: string;
}

export interface NavigationSection {
  type: 'section';
  title: string;
  items: NavigationItem[];
}

export type NavigationEntry = NavigationItem | NavigationSection;

export interface ContextButton {
  id: 'general' | 'community' | 'organization' | 'project' | 'learning' | 'admin' | 'user' | 'settings';
  label: string;
  icon: React.ComponentType<any>;
  testId: string;
  href?: string;
  restricted?: "coming_soon" | string;
  adminOnly?: boolean;
}

export const CONTEXT_BUTTONS: ContextButton[] = [
  {
    id: 'general',
    label: 'Inicio',
    icon: Home,
    testId: 'button-sidebar-home',
    href: '/home',
  },
  {
    id: 'community',
    label: 'Comunidad',
    icon: Globe,
    testId: 'button-sidebar-community',
    href: '/community/dashboard',
    restricted: 'coming_soon',
  },
  {
    id: 'organization',
    label: 'Organización',
    icon: Building,
    testId: 'button-sidebar-organization',
    href: '/organization/dashboard',
  },
  {
    id: 'project',
    label: 'Proyecto',
    icon: FolderOpen,
    testId: 'button-sidebar-project',
    href: '/project/dashboard',
  },
  {
    id: 'learning',
    label: 'Capacitaciones',
    icon: GraduationCap,
    testId: 'button-sidebar-learning',
    href: '/learning/dashboard',
  },
  {
    id: 'admin',
    label: 'Administración',
    icon: Crown,
    testId: 'button-sidebar-admin',
    href: '/admin/dashboard',
    adminOnly: true,
  },
  {
    id: 'user',
    label: 'Usuario',
    icon: User,
    testId: 'button-sidebar-user',
    href: '/profile',
  },
  {
    id: 'settings',
    label: 'Ajustes',
    icon: Settings,
    testId: 'button-sidebar-settings',
    href: '/settings/user-basic-data',
  },
];

export const ORGANIZATION_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Visión General', icon: Home, href: '/organization/dashboard', testId: 'nav-org-dashboard' },
  { id: 'basic-data', label: 'Datos Básicos', icon: Building, href: '/organization/basic-data', testId: 'nav-org-basic-data' },
  { id: 'projects', label: 'Gestión de Proyectos', icon: Folder, href: '/organization/projects', testId: 'nav-org-projects' },
  { id: 'members', label: 'Miembros', icon: Users, href: '/organization/members', testId: 'nav-org-members' },
  { id: 'partners', label: 'Socios', icon: HandHeart, href: '/organization/partners', testId: 'nav-org-partners' },
  { id: 'billing', label: 'Facturación', icon: CreditCard, href: '/organization/billing', testId: 'nav-org-billing' },
  { id: 'contacts', label: 'Contactos', icon: Users, href: '/contacts', testId: 'nav-org-contacts' },
  { id: 'expenses', label: 'Gastos Generales', icon: CreditCard, href: '/general-costs', testId: 'nav-org-expenses' },
  { id: 'analysis', label: 'Análisis de Costos', icon: BarChart3, href: '/analysis', testId: 'nav-org-analysis' },
  { id: 'finances', label: 'Movimientos', icon: DollarSign, href: '/movements', restricted: 'coming_soon', testId: 'nav-org-finances' },
  { id: 'capital', label: 'Capital', icon: TrendingUp, href: '/finances/capital', restricted: 'coming_soon', testId: 'nav-org-capital' },
];

export const PROJECT_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Visión General', icon: Home, href: '/project/dashboard', testId: 'nav-project-dashboard' },
  { id: 'basic-data', label: 'Datos Básicos', icon: FileText, href: '/project', testId: 'nav-project-basic-data' },
  { id: 'budgets', label: 'Cómputo y Presupuesto', icon: Calculator, href: '/budgets', testId: 'nav-project-budgets' },
  { id: 'personnel', label: 'Mano de Obra', icon: Users, href: '/construction/personnel', restricted: 'coming_soon', testId: 'nav-project-personnel' },
  { id: 'materials', label: 'Materiales', icon: Package, href: '/construction/materials', restricted: 'coming_soon', testId: 'nav-project-materials' },
  { id: 'indirects', label: 'Indirectos', icon: Layers, href: '/construction/indirects', restricted: 'coming_soon', testId: 'nav-project-indirects' },
  { id: 'subcontracts', label: 'Subcontratos', icon: FileText, href: '/construction/subcontracts', restricted: 'coming_soon', testId: 'nav-project-subcontracts' },
  { id: 'logs', label: 'Bitácora de Obra', icon: FileText, href: '/construction/logs', restricted: 'coming_soon', testId: 'nav-project-logs' },
  { id: 'media', label: 'Archivos y Media', icon: FolderOpen, href: '/media', restricted: 'coming_soon', testId: 'nav-project-media' },
  { id: 'clients', label: 'Clientes', icon: Users, href: '/clients', restricted: 'coming_soon', testId: 'nav-project-clients' },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Analytics', icon: BarChart3, href: '/admin/dashboard', testId: 'nav-admin-dashboard' },
  { id: 'administration', label: 'Administración', icon: Settings, href: '/admin/administration', testId: 'nav-admin-administration' },
  { id: 'support', label: 'Soporte', icon: Headphones, href: '/admin/support', testId: 'nav-admin-support' },
  { id: 'subscriptions', label: 'Suscripciones', icon: CreditCard, href: '/admin/subscriptions', testId: 'nav-admin-subscriptions' },
  { id: 'payments', label: 'Pagos', icon: Wallet, href: '/admin/payments', testId: 'nav-admin-payments' },
  { id: 'courses', label: 'Cursos', icon: BookOpen, href: '/admin/courses', testId: 'nav-admin-courses' },
  { id: 'layout', label: 'Layout', icon: Layers, href: '/admin/layout', testId: 'nav-admin-layout' },
  { id: 'general', label: 'General', icon: Settings, href: '/admin/general', testId: 'nav-admin-general' },
  { id: 'tasks', label: 'Tareas', icon: ListTodo, href: '/admin/tasks', testId: 'nav-admin-tasks' },
  { id: 'costs', label: 'Costos', icon: DollarSign, href: '/admin/costs', testId: 'nav-admin-costs' },
  { id: 'products', label: 'Productos', icon: Package, href: '/providers/products', testId: 'nav-admin-products' },
];

export const COMMUNITY_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Visión General', icon: Home, href: '/community/dashboard', testId: 'nav-community-dashboard' },
  { id: 'map', label: 'Mapa', icon: MapPin, href: '/community/map', testId: 'nav-community-map' },
];

export const LEARNING_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/learning/dashboard', testId: 'nav-learning-dashboard' },
  { id: 'courses', label: 'Cursos', icon: GraduationCap, href: '/learning/courses', testId: 'nav-learning-courses' },
  { id: 'community', label: 'Comunidad Discord', icon: MessageCircle, href: 'https://discord.com/channels/868615664070443008', testId: 'nav-learning-discord' },
];

export const USER_NAVIGATION: NavigationItem[] = [
  { id: 'profile', label: 'Mi Perfil', icon: User, href: '/profile', testId: 'nav-user-profile' },
  { id: 'landing', label: 'Página de Inicio', icon: Home, href: '/', testId: 'nav-user-landing' },
];

export function getSettingsNavigation(organizationName: string, userFullName: string): NavigationSection[] {
  return [
    {
      type: 'section' as const,
      title: userFullName,
      items: [
        { id: 'user-basic-data', label: 'Datos Básicos', icon: User, href: '/settings/user-basic-data', testId: 'nav-settings-user-basic-data' },
        { id: 'user-preferences', label: 'Preferencias', icon: Settings, href: '/settings/user-preferences', testId: 'nav-settings-user-preferences' },
        { id: 'user-organizations', label: 'Organizaciones', icon: Building, href: '/settings/user-organizations', testId: 'nav-settings-user-organizations' },
        { id: 'notifications', label: 'Notificaciones', icon: Bell, href: '/settings/notifications', testId: 'nav-settings-notifications' },
      ]
    }
  ];
}

export type SidebarLevel = 'general' | 'organization' | 'project' | 'construction' | 'finances' | 'library' | 'provider' | 'admin' | 'community' | 'learning' | 'user' | 'settings';

export interface GetNavigationItemsParams {
  sidebarLevel: SidebarLevel;
  selectedProjectId?: string | null;
  isAdmin?: boolean;
  organizationName?: string;
  userFullName?: string;
}

export function getNavigationItems(params: GetNavigationItemsParams): NavigationEntry[] {
  const {
    sidebarLevel,
    selectedProjectId,
    isAdmin = false,
    organizationName = 'Organización',
    userFullName = 'Usuario',
  } = params;

  switch (sidebarLevel) {
    case 'general':
      return [];
    case 'organization':
      return ORGANIZATION_NAVIGATION;
    case 'project':
      return selectedProjectId ? PROJECT_NAVIGATION : [];
    case 'admin':
      return isAdmin ? ADMIN_NAVIGATION : [];
    case 'community':
      return COMMUNITY_NAVIGATION;
    case 'learning':
      return LEARNING_NAVIGATION;
    case 'user':
      return USER_NAVIGATION;
    case 'settings':
      return getSettingsNavigation(organizationName, userFullName);
    default:
      return [];
  }
}

export interface SectionDivider {
  show: boolean;
  text: string;
}

export function getDividerInfo(
  sidebarLevel: SidebarLevel,
  item: NavigationItem,
  index: number
): SectionDivider {
  if (sidebarLevel === 'organization') {
    if (item.id === 'dashboard') return { show: true, text: 'Gestión' };
    if (item.id === 'analysis') return { show: true, text: 'Finanzas' };
  } else if (sidebarLevel === 'project') {
    if (item.id === 'dashboard') return { show: true, text: 'Planificación' };
    if (item.id === 'budgets') return { show: true, text: 'Recursos' };
    if (item.id === 'subcontracts') return { show: true, text: 'Ejecución' };
    if (item.id === 'clients') return { show: true, text: 'Comercialización' };
  } else if (sidebarLevel === 'learning') {
    if (item.id === 'dashboard') return { show: true, text: 'Capacitaciones' };
  } else if (sidebarLevel === 'admin') {
    if (item.id === 'dashboard') return { show: true, text: 'Administración' };
    if (item.id === 'general') return { show: true, text: 'Construcción' };
  }
  return { show: false, text: '' };
}

export function getContextTitle(sidebarLevel: SidebarLevel): string {
  switch (sidebarLevel) {
    case 'organization': return 'Organización';
    case 'project': return 'Proyecto';
    case 'community': return 'Comunidad';
    case 'learning': return 'Capacitaciones';
    case 'admin': return 'Administración';
    case 'user': return 'Usuario';
    case 'settings': return 'Ajustes';
    case 'general': return 'Menú';
    default: return 'Menú';
  }
}
