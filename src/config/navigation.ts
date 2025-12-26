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
  HandHeart,
  Award,
  Mail,
  FlaskConical,
  Palette
} from "lucide-react";
import { LuContact } from "react-icons/lu";
import { LuHandshake } from "react-icons/lu";
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
export interface NavigationSpacer {
  type: 'spacer';
  id: string;
}
export interface NavigationSectionHeader {
  type: 'section-header';
  id: string;
  label: string;
}
export type NavigationEntry = NavigationItem | NavigationSection | NavigationSpacer | NavigationSectionHeader;
export interface ContextButton {
  id: 'organization'| 'project'| 'founders'| 'community'| 'learning'| 'admin';
  label: string;
  icon: React.ComponentType<any>;
  testId: string;
  href?: string;
  restricted?: "coming_soon" | string;
  adminOnly?: boolean;
  requiresProject?: boolean;
}
export const CONTEXT_BUTTONS: ContextButton[] = [
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
    requiresProject: true,
  },
  {
    id: 'founders',
    label: 'Fundadores',
    icon: Award,
    testId: 'button-sidebar-founders',
    href: '/founders',
    adminOnly: true,
  },
  {
    id: 'community',
    label: 'Comunidad',
    icon: Globe,
    testId: 'button-sidebar-community',
    href: '/community/dashboard',
    adminOnly: true,
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
];
export const ORGANIZATION_NAVIGATION: NavigationEntry[] = [
  { type: 'section-header', id: 'section-gestion', label: 'Gestión'},
  { id: 'dashboard', label: 'Visión General', icon: Home, href: '/organization/dashboard', testId: 'nav-org-dashboard'},
  { id: 'basic-data', label: 'Datos Básicos', icon: Building, href: '/organization/basic-data', testId: 'nav-org-basic-data'},
  { id: 'projects', label: 'Gestión de Proyectos', icon: Folder, href: '/organization/projects', testId: 'nav-org-projects'},
  { id: 'contacts', label: 'Contactos', icon: LuContact, href: '/contacts', testId: 'nav-org-contacts'},
  { id: 'settings', label: 'Ajustes', icon: Settings, href: '/organization/settings', testId: 'nav-org-settings'},
  { type: 'section-header', id: 'section-finanzas', label: 'Finanzas'},
  { id: 'finances-unified', label: 'Finanzas', icon: DollarSign, href: '/finances', restricted: 'lab_user', testId: 'nav-org-finances-unified'},
  { id: 'capital', label: 'Capital', icon: HandHeart, href: '/organization/capital', testId: 'nav-org-capital'},
  { id: 'expenses', label: 'Gastos Generales', icon: CreditCard, href: '/general-costs', testId: 'nav-org-expenses'},
  { id: 'analysis', label: 'Análisis de Costos', icon: BarChart3, href: '/analysis', restricted: 'lab_user', testId: 'nav-org-analysis'},
];
export const PROJECT_NAVIGATION: NavigationEntry[] = [
  { type: 'section-header', id: 'section-gestion', label: 'Gestión'},
  { id: 'dashboard', label: 'Visión General', icon: Home, href: '/project/dashboard', testId: 'nav-project-dashboard'},
  { id: 'basic-data', label: 'Datos Básicos', icon: FileText, href: '/project', testId: 'nav-project-basic-data'},
  { id: 'media', label: 'Archivos y Media', icon: FolderOpen, href: '/media', testId: 'nav-project-media'},
  { id: 'finances', label: 'Finanzas', icon: DollarSign, href: '/project/finances', restricted: 'lab_user', testId: 'nav-project-finances'},
  { type: 'section-header', id: 'section-diseno', label: 'Diseño'},
  { id: 'moodboard', label: 'Moodboard', icon: Palette, href: '/project/moodboard', testId: 'nav-project-moodboard'},
  { type: 'section-header', id: 'section-construccion', label: 'Construcción'},
  { id: 'personnel', label: 'Mano de Obra', icon: Users, href: '/construction/personnel', restricted: 'coming_soon', testId: 'nav-project-personnel'},
  { id: 'materials', label: 'Materiales', icon: Package, href: '/construction/materials', testId: 'nav-project-materials'},
  { id: 'subcontracts', label: 'Subcontratos', icon: FileText, href: '/construction/subcontracts', restricted: 'coming_soon', testId: 'nav-project-subcontracts'},
  { id: 'indirects', label: 'Indirectos', icon: Layers, href: '/construction/indirects', restricted: 'coming_soon', testId: 'nav-project-indirects'},
  { id: 'logs', label: 'Bitácora de Obra', icon: BookOpen, href: '/construction/logs', testId: 'nav-project-logs'},
  { type: 'section-header', id: 'section-comercializacion', label: 'Comercialización y Venta'},
  { id: 'clients', label: 'Clientes', icon: LuHandshake, href: '/clients', testId: 'nav-project-clients'},
];
export const ADMIN_NAVIGATION: NavigationEntry[] = [
  { type: 'section-header', id: 'section-operaciones', label: 'Operaciones'},
  { id: 'ops', label: 'Ops Center', icon: Activity, href: '/admin/ops', testId: 'nav-admin-ops'},
  { id: 'dashboard', label: 'Analytics', icon: BarChart3, href: '/admin/dashboard', testId: 'nav-admin-dashboard'},
  { type: 'section-header', id: 'section-gestion', label: 'Gestión'},
  { id: 'administration', label: 'Administración', icon: Settings, href: '/admin/administration', testId: 'nav-admin-administration'},
  { id: 'support', label: 'Soporte', icon: Headphones, href: '/admin/support', testId: 'nav-admin-support'},
  { id: 'subscriptions', label: 'Suscripciones', icon: CreditCard, href: '/admin/subscriptions', testId: 'nav-admin-subscriptions'},
  { id: 'payments', label: 'Pagos', icon: Wallet, href: '/admin/payments', testId: 'nav-admin-payments'},
  { type: 'section-header', id: 'section-contenido', label: 'Contenido'},
  { id: 'courses', label: 'Cursos', icon: BookOpen, href: '/admin/courses', testId: 'nav-admin-courses'},
  { id: 'email-templates', label: 'Plantillas de Email', icon: Mail, href: '/admin/email-templates', testId: 'nav-admin-email-templates'},
  { id: 'layout', label: 'Layout', icon: Layers, href: '/admin/layout', testId: 'nav-admin-layout'},
  { type: 'section-header', id: 'section-construccion', label: 'Construcción'},
  { id: 'general', label: 'General', icon: Settings, href: '/admin/general', testId: 'nav-admin-general'},
  { id: 'tasks', label: 'Tareas', icon: ListTodo, href: '/admin/tasks', testId: 'nav-admin-tasks'},
  { id: 'costs', label: 'Costos', icon: DollarSign, href: '/admin/costs', testId: 'nav-admin-costs'},
  { id: 'products', label: 'Productos', icon: Package, href: '/providers/products', testId: 'nav-admin-products'},
  { type: 'section-header', id: 'section-lab', label: 'Lab'},
  { id: 'lab-clients', label: 'Lab - Clientes', icon: FlaskConical, href: '/lab/financial-lattice', testId: 'nav-admin-lab-clients'},
  { id: 'lab-contacts', label: 'Lab - Contactos', icon: FlaskConical, href: '/lab/contacts', testId: 'nav-admin-lab-contacts'},
];
export const COMMUNITY_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Visión General', icon: Home, href: '/community/dashboard', testId: 'nav-community-dashboard'},
  { id: 'map', label: 'Mapa', icon: MapPin, href: '/community/map', testId: 'nav-community-map'},
];
export const LEARNING_NAVIGATION: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/learning/dashboard', testId: 'nav-learning-dashboard'},
  { id: 'courses', label: 'Cursos', icon: GraduationCap, href: '/learning/courses', testId: 'nav-learning-courses'},
];
export const MARKETING_NAVIGATION: NavigationItem[] = [
  { id: 'cursos', label: 'Cursos', icon: BookOpen, href: '/cursos', testId: 'nav-marketing-cursos'},
  { id: 'fundadores', label: 'Fundadores', icon: Award, href: '/founders', testId: 'nav-marketing-fundadores'},
  { id: 'precios', label: 'Precios', icon: CreditCard, href: '/precios', testId: 'nav-marketing-precios'},
  { id: 'contacto', label: 'Contacto', icon: Mail, href: '/contact', testId: 'nav-marketing-contacto'},
];
export type SidebarLevel = 'general'| 'organization'| 'project'| 'construction'| 'finances'| 'library'| 'provider'| 'admin'| 'community'| 'learning'| 'founders'| 'marketing';
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
    case 'marketing':
      return MARKETING_NAVIGATION;
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
    if (item.id === 'dashboard') return { show: true, text: 'Gestión'};
    if (item.id === 'analysis') return { show: true, text: 'Finanzas'};
  } else if (sidebarLevel === 'project') {
    if (item.id === 'dashboard') return { show: true, text: 'Planificación'};
    if (item.id === 'budgets') return { show: true, text: 'Recursos'};
    if (item.id === 'subcontracts') return { show: true, text: 'Ejecución'};
    if (item.id === 'clients') return { show: true, text: 'Comercialización'};
  } else if (sidebarLevel === 'learning') {
    if (item.id === 'dashboard') return { show: true, text: 'Capacitaciones'};
  } else if (sidebarLevel === 'admin') {
    if (item.id === 'dashboard') return { show: true, text: 'Administración'};
    if (item.id === 'general') return { show: true, text: 'Construcción'};
  }
  return { show: false, text: ''};
}
export function getContextTitle(sidebarLevel: SidebarLevel): string {
  switch (sidebarLevel) {
    case 'organization': return 'Organización';
    case 'project': return 'Proyecto';
    case 'community': return 'Comunidad';
    case 'learning': return 'Capacitaciones';
    case 'admin': return 'Administración';
    case 'general': return 'Menú';
    case 'marketing': return 'Menú';
    default: return 'Menú';
  }
}
