import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/lib/utils";
import SidebarButton from "./SidebarButton";
import { CustomRestricted } from "@/components/ui-custom/misc/CustomRestricted";
import Plan from "@/components/ui-custom/misc/Plan";
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
  UserCircle
} from "lucide-react";

export function SidebarSubmenu() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { isDocked: isMainDocked, isHovered: isMainHovered } = useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered, setDocked: setSecondaryDocked, setHovered: setSecondaryHovered } = useSecondarySidebarStore();
  const { activeSidebarSection, setActiveSidebarSection, setSidebarContext } = useNavigationStore();

  const isMainSidebarExpanded = false; // Always collapsed
  const isSecondarySidebarExpanded = isSecondaryDocked || isSecondaryHovered;

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
  
  const currentSection = activeSidebarSection || getDefaultSection();

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
      { icon: UserCircle, label: 'Mi Perfil', href: '/profile' },
    ],
    
    'organizacion': [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
    ],
    
    'proyecto': [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: NotebookPen, label: 'Datos Básicos', href: '/project/basic-data' },
    ],

    'diseno': [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: FileImage, label: 'Documentación', href: '/design/documentation' },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline', restricted: true },
      { icon: Layout, label: 'Tablero', href: '/design/board', restricted: true },
      { icon: Calculator, label: 'Cómputo', href: '/design/compute', restricted: true },
      { icon: FileCode, label: 'Datos', href: '/design/data', restricted: true },
      { icon: History, label: 'Preferencias de Diseño', href: '/design/preferences', restricted: true },
    ],

    'obra': [
      { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
      { icon: DollarSign, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Package, label: 'Materiales', href: '/construction/materials' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
      { icon: Users, label: 'Personal', href: '/construction/personnel' },
      { icon: Images, label: 'Galería', href: '/construction/gallery' },
    ],

    'finanzas': [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: Activity, label: 'Movimientos', href: '/finances/movements' },
      { icon: CreditCard, label: 'Aportes', href: '/finances/installments' },
      { icon: FolderOpen, label: 'Preferencias de Finanzas', href: '/finances/preferences' },
    ],

    'comercializacion': [
      { icon: Home, label: 'Resumen de Comercialización', href: '/commercialization/dashboard', restricted: true },
      { icon: Handshake, label: 'Unidades', href: '/commercialization/units', restricted: true },
      { icon: Users, label: 'Clientes', href: '/commercialization/clients', restricted: true },
      { icon: DollarSign, label: 'Ventas', href: '/commercialization/sales', restricted: true },
      { icon: FolderOpen, label: 'Preferencias de Comercialización', href: '/commercialization/preferences', restricted: true },
    ],

    'post-venta': [
      { icon: Home, label: 'Resumen de Post-Venta', href: '/postsale/dashboard', restricted: true },
      { icon: Contact, label: 'Servicios', href: '/postsale/services', restricted: true },
      { icon: Activity, label: 'Soporte', href: '/postsale/support', restricted: true },
      { icon: FolderOpen, label: 'Preferencias de Post-Venta', href: '/postsale/preferences', restricted: true },
    ],

    'administracion': [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { type: 'accordion', label: 'Comunidad', items: [
        { icon: History, label: 'Changelog', href: '/admin/changelogs' },
      ]},
      { type: 'accordion', label: 'Tareas', items: [
        { icon: Tag, label: 'Categorías de Tareas', href: '/admin/task-categories' },
        { icon: FileCode, label: 'Plantillas de Tareas', href: '/admin/task-templates' },
        { icon: Search, label: 'Parámetros de Tareas', href: '/admin/task-parameters' },
        { icon: CheckSquare, label: 'Tareas Generadas', href: '/admin/generated-tasks' },
      ]},
      { type: 'accordion', label: 'Materiales', items: [
        { icon: Package, label: 'Categorías de Materiales', href: '/admin/material-categories' },
        { icon: Package2, label: 'Materiales', href: '/admin/materials' },
      ]},
    ],
  };

  const currentSubmenu = submenuContent[currentSection as keyof typeof submenuContent] || [];

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
        "fixed top-0 h-screen bg-[var(--secondary-sidebar-bg)] z-30 flex flex-col transition-all duration-300 overflow-hidden rounded-r-2xl",
        "left-[40px]",
        isSecondarySidebarExpanded ? "w-64" : "w-[60px]"
      )}
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
          {currentSubmenu.length > 0 ? (
            currentSubmenu.map((item, index) => {
              if (item.type === 'accordion') {
                return (
                  <div key={index} className="mb-[1px]">
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
              if (item.restricted && !isAdmin) {
                return (
                  <div key={index} className="mb-[1px]">
                    <CustomRestricted reason="coming_soon">
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

        {/* Plan Section - Only visible for organization section when expanded */}
        {currentSection === 'organizacion' && isSecondarySidebarExpanded && (
          <div className="mt-auto p-1 pb-2">
            <Plan isExpanded={true} />
          </div>
        )}
      </div>
    </div>
  );
}