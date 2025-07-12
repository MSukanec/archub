import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/lib/utils";
import SidebarButton from "./SidebarButton";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { useProjectContext } from "@/context/projectContext";

import { 
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  Activity,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Tag,
  ChevronDown,
  ChevronRight,
  Search,
  Crown,
  Package,
  Package2,
  Shield,
  Star,
  Zap,
  CheckSquare,
  Calculator,
  FileCode,
  History,
  Contact,
  Images,
  Database,
  Layout,
  CreditCard,
  Handshake,
  NotebookPen,
  FileImage,
  HardHat,
  Brush,
  UserCircle,
  HandCoins,
  Settings
} from "lucide-react";

export function SidebarSubmenu() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { isDocked: isMainDocked, isHovered: isMainHovered } = useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered, setDocked: setSecondaryDocked, setHovered: setSecondaryHovered } = useSecondarySidebarStore();
  const { activeSidebarSection, setActiveSidebarSection, setSidebarContext } = useNavigationStore();
  const { isGlobalView } = useProjectContext();

  const isMainSidebarExpanded = false; // Always collapsed
  const isSecondarySidebarExpanded = isSecondaryDocked || isSecondaryHovered || isMainHovered;

  // Definir sección por defecto basada en la ruta actual
  const getDefaultSection = () => {
    if (location.startsWith('/profile')) return 'perfil';
    if (location.startsWith('/organization')) return 'organizacion';
    if (location.startsWith('/project')) return 'proyecto';
    if (location.startsWith('/design')) return 'diseno';
    if (location.startsWith('/construction')) return 'obra';
    if (location.startsWith('/finances')) return 'finanzas';
    if (location.startsWith('/commercialization')) return 'comercializacion';
    if (location.startsWith('/postsale')) return 'post-venta';
    if (location.startsWith('/admin')) return 'administracion';
    return 'organizacion'; // default fallback
  };
  
  const currentSection = getDefaultSection();

  // Función para navegación con transición hacia adelante
  const navigateForward = (newContext: string, href: string) => {
    setSidebarContext(newContext as any);
    navigate(href);
  };

  // Función para navegación con transición hacia atrás
  const navigateBackward = (newContext: string, href: string) => {
    setSidebarContext(newContext as any);
    navigate(href);
  };

  // Contenido de submenús para cada sección principal
  const submenuContent = {
    'perfil': [
      { icon: UserCircle, label: 'Datos Básicos', href: '/profile' },
    ],
    
    'organizacion': [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Settings, label: 'Preferencias', href: '/finances/preferences' },
    ],
    
    'proyecto': [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard', requiresProject: true },
      { icon: NotebookPen, label: 'Datos Básicos', href: '/project/basic-data', requiresProject: true },
      { icon: Users, label: 'Clientes', href: '/project/clients', requiresProject: true },
    ],

    'diseno': [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard', requiresProject: true },
      { icon: FileImage, label: 'Documentación', href: '/design/documentation', requiresProject: true },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline', restricted: 'coming_soon', requiresProject: true },
      { icon: Layout, label: 'Tablero', href: '/design/board', restricted: 'coming_soon', requiresProject: true },
      { icon: Calculator, label: 'Cómputo', href: '/design/compute', restricted: 'coming_soon', requiresProject: true },
      { icon: FileCode, label: 'Datos', href: '/design/data', restricted: 'coming_soon', requiresProject: true },
      { icon: History, label: 'Preferencias de Diseño', href: '/design/preferences', restricted: 'coming_soon', requiresProject: true },
    ],

    'obra': [
      { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard', requiresProject: true },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets', requiresProject: true },
      { icon: Package, label: 'Materiales', href: '/construction/materials', requiresProject: true },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs', requiresProject: true },
      { icon: Users, label: 'Asistencia', href: '/construction/personnel', requiresProject: true },
      { icon: Images, label: 'Galería', href: '/construction/gallery', requiresProject: true },
    ],

    'finanzas': [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard', requiresProject: true },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements', requiresProject: true },
      { icon: HandCoins, label: 'Compromisos de Pago', href: '/finances/installments', requiresProject: true },
    ],

    'comercializacion': [
      { icon: Home, label: 'Resumen de Comercialización', href: '/commercialization/dashboard', restricted: true, requiresProject: true },
      { icon: Handshake, label: 'Unidades', href: '/commercialization/units', restricted: true, requiresProject: true },
      { icon: Users, label: 'Clientes', href: '/commercialization/clients', restricted: true, requiresProject: true },
      { icon: DollarSign, label: 'Ventas', href: '/commercialization/sales', restricted: true, requiresProject: true },
      { icon: FolderOpen, label: 'Preferencias de Comercialización', href: '/commercialization/preferences', restricted: true, requiresProject: true },
    ],

    'post-venta': [
      { icon: Home, label: 'Resumen de Post-Venta', href: '/postsale/dashboard', restricted: true },
      { icon: Contact, label: 'Servicios', href: '/postsale/services', restricted: true },
      { icon: Activity, label: 'Soporte', href: '/postsale/support', restricted: true },
      { icon: FolderOpen, label: 'Preferencias de Post-Venta', href: '/postsale/preferences', restricted: true },
    ],

    'administracion': [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { type: 'accordion', label: 'COMUNIDAD', items: [
        { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
        { icon: Users, label: 'Usuarios', href: '/admin/users' },
        { icon: History, label: 'Changelog', href: '/admin/changelogs' },
      ]},
      { type: 'accordion', label: 'TAREAS', items: [
        { icon: CheckSquare, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
        { icon: Search, label: 'Parámetros de Tareas', href: '/admin/task-parameters' },
        { icon: Tag, label: 'Categorías de Tareas', href: '/admin/categories' },
      ]},
      { type: 'accordion', label: 'MATERIALES', items: [
        { icon: Package, label: 'Categorías de Materiales', href: '/admin/material-categories' },
        { icon: Package2, label: 'Materiales', href: '/admin/materials' },
      ]},
    ],
  };

  const currentSubmenu = submenuContent[currentSection as keyof typeof submenuContent] || [];

  // Filter menu items based on project requirement
  const filteredSubmenu = currentSubmenu.filter(item => {
    // Always show separators and items without requiresProject
    if (item.type === 'separator' || !item.requiresProject) {
      return true;
    }
    // Hide items that require a project when in global view
    return !isGlobalView;
  });

  // Get section title and icon
  const getSectionInfo = () => {
    const sectionInfo = {
      'perfil': { title: 'Mi Perfil', icon: UserCircle },
      'organizacion': { title: 'Organización', icon: Building },
      'proyecto': { title: 'Proyecto', icon: FolderOpen },
      'diseno': { title: 'Diseño', icon: Brush },
      'obra': { title: 'Obra', icon: HardHat },
      'finanzas': { title: 'Finanzas', icon: DollarSign },
      'comercializacion': { title: 'Comercialización', icon: Handshake },
      'post-venta': { title: 'Post-Venta', icon: CreditCard },
      'administracion': { title: 'Administración', icon: Crown }
    };
    return sectionInfo[currentSection as keyof typeof sectionInfo] || { title: 'Organización', icon: Building };
  };

  // Always show the secondary sidebar
  return (
    <div 
      className={cn(
        "fixed top-0 h-screen bg-[var(--secondary-sidebar-bg)] border-r border-[var(--secondary-sidebar-border)] z-[2] flex flex-col transition-all duration-300",
        "left-[40px]",
        isSecondarySidebarExpanded ? "w-64" : "w-[40px]"
      )}
      style={{
        borderTopRightRadius: '12px',
        borderBottomRightRadius: '12px',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setSecondaryHovered(true)}
      onMouseLeave={() => setSecondaryHovered(false)}
    >
      {/* Section Title Header */}
      <div className="h-9 flex items-center px-3 bg-[var(--secondary-sidebar-bg)]">
        {isSecondarySidebarExpanded && (
          <div className="flex items-center gap-2">
            {(() => {
              const IconComponent = getSectionInfo().icon;
              return <IconComponent className="w-[18px] h-[18px] text-[var(--secondary-sidebar-fg)]" />;
            })()}
            <span className="text-sm font-normal text-[var(--secondary-sidebar-fg)]">
              {getSectionInfo().title}
            </span>
          </div>
        )}
      </div>

      {/* Contenido del submenú */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-1 pt-3">
        <div className="flex flex-col gap-[1px]">
          {filteredSubmenu.length > 0 ? (
            filteredSubmenu.map((item, index) => {
              if (item.type === 'accordion') {
                return (
                  <div key={index} className="mb-[1px]">
                    {/* Título del acordeón */}
                    {isSecondarySidebarExpanded && (
                      <div className="h-8 flex items-center px-3 mb-[1px]">
                        <span className="text-xs font-semibold text-[var(--secondary-sidebar-fg)] opacity-60 uppercase tracking-wider">
                          {item.label}
                        </span>
                      </div>
                    )}
                    {/* Items del acordeón */}
                    <div className="flex flex-col gap-[1px]">
                      {item.items?.map((subItem, subIndex) => (
                        <div key={subIndex} className="mb-[1px]">
                          <SidebarButton
                            icon={<subItem.icon className="w-[18px] h-[18px]" />}
                            href={subItem.href}
                            isActive={location === subItem.href}
                            onClick={subItem.onClick}
                            label={subItem.label}
                            isExpanded={isSecondarySidebarExpanded}
                            variant="secondary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Botón normal con posible restricción
              if (item.restricted) {
                return (
                  <div key={index} className="mb-[1px]">
                    <CustomRestricted reason={typeof item.restricted === 'string' ? item.restricted : 'coming_soon'}>
                      <SidebarButton
                        icon={<item.icon className="w-[18px] h-[18px]" />}
                        href="#"
                        isActive={false}
                        onClick={() => {}}
                        label={item.label}
                        isExpanded={isSecondarySidebarExpanded}
                        variant="secondary"
                      />
                    </CustomRestricted>
                  </div>
                );
              }

              return (
                <div key={index} className="mb-[1px]">
                  <SidebarButton
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    href={item.href}
                    isActive={location === item.href}
                    onClick={item.onClick}
                    label={item.label}
                    isExpanded={isSecondarySidebarExpanded}
                    variant="secondary"
                  />
                </div>
              );
            })
          ) : null}
        </div>


      </div>
    </div>
  );
}