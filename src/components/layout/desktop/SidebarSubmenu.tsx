import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/lib/utils";
import SidebarButton from "./SidebarButton";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";
import { useProjectContext } from "@/stores/projectContext";
import Plan from "@/components/ui-custom/Plan";

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

  NotebookPen,
  FileImage,
  BarChart3,
  HardHat,
  Brush,
  UserCircle,
  HandCoins,
  Settings,
  Ruler,
  Receipt,
  TrendingUp
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
    if (location.startsWith('/construction')) return 'construccion';
    if (location.startsWith('/finances')) return 'finanzas';

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
      { icon: UserCircle, label: 'Datos Básicos', href: '/profile/data' },
      { icon: Settings, label: 'Preferencias', href: '/profile/settings' },
      { icon: FolderOpen, label: 'Gestión de Proyectos', href: '/profile/projects' },
      { icon: Building, label: 'Gestión de Organizaciones', href: '/profile/organizations' },
    ],
    
    'organizacion': [
      { icon: Home, label: 'Resumen de Organización', href: '/organization/dashboard' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: CheckSquare, label: 'Tablero', href: '/organization/board' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity', restricted: 'coming_soon' },
      { icon: Database, label: 'Datos Básicos', href: '/organization/basic-data' },
      { icon: Settings, label: 'Preferencias', href: '/organization/preferences' },
      { type: 'plan', label: 'Plan', icon: Crown },
    ],
    
    'proyecto': [
      { icon: Users, label: 'Clientes', href: '/project/clients', requiresProject: true },
    ],

    'diseno': [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard', requiresProject: true },
    ],

    'construccion': [
      { icon: Home, label: 'Resumen de Construcción', href: '/construction/dashboard', requiresProject: true },
      { icon: CheckSquare, label: 'Tareas', href: '/construction/tasks', requiresProject: true },
      { icon: Users, label: 'Mano de Obra', href: '/construction/labor', requiresProject: true },
      { icon: Calendar, label: 'Cronograma', href: '/construction/schedule', requiresProject: true },
      { icon: Package, label: 'Subcontratos', href: '/construction/subcontracts', requiresProject: true },
      { icon: Calculator, label: 'Presupuestos', href: '/construction/budgets', requiresProject: true },
      { icon: Package2, label: 'Materiales', href: '/construction/materials', requiresProject: true },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs', requiresProject: true },
      { icon: Users, label: 'Asistencia', href: '/construction/personnel', requiresProject: true },
      { icon: BarChart3, label: 'Análisis de Costos', href: '/construction/cost-analysis', requiresProject: true },
    ],

    'finanzas': [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard', requiresProject: true },
      { icon: DollarSign, label: 'Movimientos', href: '/finances/movements', requiresProject: true },
      { icon: BarChart3, label: 'Análisis de Obra', href: '/finances/analysis', generalModeRestricted: true },
      { icon: HandCoins, label: 'Aportes de Terceros', href: '/finances/installments', generalModeRestricted: true },
      { icon: TrendingUp, label: 'Movimientos de Capital', href: '/finances/capital-movements', generalModeRestricted: true },
      { icon: Package, label: 'Subcontratos', href: '/finances/subcontracts', requiresProject: true },
    ],



    'administracion': [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { type: 'accordion', label: 'COMUNIDAD', items: [
        { icon: Building, label: 'Organizaciones', href: '/admin/organizations' },
        { icon: Users, label: 'Usuarios', href: '/admin/users' },
        { icon: History, label: 'Changelog', href: '/admin/changelogs' },
      ]},
      { type: 'accordion', label: 'TAREAS', items: [
        { icon: CheckSquare, label: 'Tareas', href: '/admin/generated-tasks' },
        { icon: Search, label: 'Parámetros de Tareas', href: '/admin/task-parameters' },
        { icon: FileCode, label: 'Plantillas', href: '/admin/task-templates' },
        { icon: Tag, label: 'Categorías de Tareas', href: '/admin/categories' },
      ]},
      { type: 'accordion', label: 'FINANZAS', items: [
        { icon: DollarSign, label: 'Conceptos de Movimientos', href: '/admin/movement-concepts' },
      ]},
      { type: 'accordion', label: 'MATERIALES', items: [
        { icon: Package, label: 'Productos', href: '/admin/products' },
        { icon: Package2, label: 'Materiales', href: '/admin/materials' },
        { icon: Tag, label: 'Marcas', href: '/admin/brands' },
        { icon: Ruler, label: 'Unidades', href: '/admin/unit-presentations' },
        { icon: Package, label: 'Categorías de Materiales', href: '/admin/material-categories' },
        { icon: Receipt, label: 'Precios de Materiales', href: '/admin/material-prices' },
      ]},
    ],
  };

  const currentSubmenu = submenuContent[currentSection as keyof typeof submenuContent] || [];

  // Filter menu items based on project requirement
  // POR AHORA: En "TODOS LOS PROYECTOS" no quiero que desaparezca NINGÚN botón del sidebar
  const filteredSubmenu = currentSubmenu.filter(item => {
    // Mostrar TODOS los elementos - no filtrar nada por ahora
    return true;
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

      'administracion': { title: 'Administración', icon: Crown }
    };
    return sectionInfo[currentSection as keyof typeof sectionInfo] || { title: 'Organización', icon: Building };
  };

  // Always show the secondary sidebar
  return (
    <div 
      className={cn(
        "fixed top-0 h-screen bg-[var(--secondary-sidebar-bg)] border-r border-[var(--secondary-sidebar-border)] z-40 flex flex-col transition-all duration-300",
        "left-[40px]",
        isSecondarySidebarExpanded ? "w-64" : "w-[40px]"
      )}
      style={{
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

              // Plan component
              if (item.type === 'plan') {
                return (
                  <div key={index} className="mb-[1px]">
                    <div className="p-1">
                      <Plan isExpanded={isSecondarySidebarExpanded} />
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

              // Botón con restricción de modo general
              if (item.generalModeRestricted) {
                return (
                  <div key={index} className="mb-[1px]">
                    <CustomRestricted reason="general_mode" functionName={item.label}>
                      <SidebarButton
                        icon={<item.icon className="w-[18px] h-[18px]" />}
                        href={item.href}
                        isActive={location === item.href}
                        onClick={item.onClick}
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