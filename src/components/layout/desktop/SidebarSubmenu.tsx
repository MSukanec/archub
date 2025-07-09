import { useState } from "react";
import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useSidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/lib/utils";
import SidebarButton from "./SidebarButton";
import { CustomRestricted } from "@/components/ui-custom/misc/CustomRestricted";
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
  Handshake
} from "lucide-react";

export function SidebarSubmenu() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { isDocked, isHovered } = useSidebarStore();
  const { activeSidebarSection, setActiveSidebarSection, setSidebarContext, currentSidebarContext } = useNavigationStore();

  const [isSubmenuHovered, setIsSubmenuHovered] = useState(false);
  const isMainSidebarExpanded = isDocked || isHovered;
  const isSubmenuExpanded = isDocked || isSubmenuHovered;

  // Si no hay sección activa, no mostrar nada
  if (!activeSidebarSection) {
    return null;
  }

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
    'organizacion': [
      { icon: Home, label: 'Resumen de la Organización', href: '/organization/dashboard' },
      { icon: ArrowRight, label: 'Ir al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
    ],
    
    'datos-basicos': [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
      { type: 'divider' },
      { icon: Database, label: 'Datos Básicos', href: '/project/basic-data' },
    ],

    'diseno': [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: Database, label: 'Documentación', href: '/design/documentation' },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline' },
      { icon: Layout, label: 'Tablero', href: '/design/board', restricted: true },
      { icon: Calculator, label: 'Cómputo', href: '/design/compute', restricted: true },
      { icon: FileCode, label: 'Datos', href: '/design/data', restricted: true },
      { icon: History, label: 'Preferencias de Diseño', href: '/design/preferences', restricted: true },
    ],

    'obra': [
      { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: DollarSign, label: 'Presupuestos', href: '/construction/budgets' },
      { icon: Package, label: 'Materiales', href: '/construction/materials' },
      { icon: FileText, label: 'Bitácora', href: '/construction/logs' },
      { icon: Users, label: 'Personal', href: '/construction/personnel' },
      { icon: Images, label: 'Galería', href: '/construction/gallery' },
    ],

    'finanzas': [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finances/dashboard' },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: Activity, label: 'Movimientos', href: '/finances/movements' },
      { icon: CreditCard, label: 'Aportes', href: '/finances/installments' },
      { icon: FolderOpen, label: 'Preferencias de Finanzas', href: '/finances/preferences' },
    ],

    'comercializacion': [
      { icon: Home, label: 'Resumen de Comercialización', href: '/commercialization/dashboard', restricted: true },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: Handshake, label: 'Unidades', href: '/commercialization/units', restricted: true },
      { icon: Users, label: 'Clientes', href: '/commercialization/clients', restricted: true },
      { icon: DollarSign, label: 'Ventas', href: '/commercialization/sales', restricted: true },
      { icon: FolderOpen, label: 'Preferencias de Comercialización', href: '/commercialization/preferences', restricted: true },
    ],

    'post-venta': [
      { icon: Home, label: 'Resumen de Post-Venta', href: '/postsale/dashboard', restricted: true },
      { icon: ArrowLeft, label: 'Volver a Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
      { type: 'divider' },
      { icon: Contact, label: 'Servicios', href: '/postsale/services', restricted: true },
      { icon: Activity, label: 'Soporte', href: '/postsale/support', restricted: true },
      { icon: FolderOpen, label: 'Preferencias de Post-Venta', href: '/postsale/preferences', restricted: true },
    ],

    'administracion': [
      { icon: Home, label: 'Resumen de Administración', href: '/admin/dashboard' },
      { type: 'divider' },
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

  const currentSubmenu = submenuContent[activeSidebarSection as keyof typeof submenuContent] || [];

  // Mapeo simple de contextos a items del submenu (solo botones principales)
  const getSubmenuItemsForContext = () => {
    if (!currentSidebarContext) return [];
    
    const contextItems = submenuContent[currentSidebarContext as keyof typeof submenuContent] || [];
    
    // Filtrar solo items principales (no accordion items, no dividers)
    return contextItems.filter(item => 
      item.type !== 'divider' && 
      item.type !== 'accordion' && 
      !item.href?.includes('#')
    );
  };

  const currentSubmenuItems = getSubmenuItemsForContext();

  return (
    <div 
      className={cn(
        "fixed top-9 z-30 bg-[var(--menues-bg)] border-r border-[var(--menues-border)] transition-all duration-300",
        isMainSidebarExpanded ? "left-[240px]" : "left-[40px]",
        isSubmenuExpanded ? "w-[240px]" : "w-[40px]"
      )}
      style={{ height: 'calc(100vh - 36px)' }}
      onMouseEnter={() => setIsSubmenuHovered(true)}
      onMouseLeave={() => setIsSubmenuHovered(false)}
    >
      {/* Header del contexto actual */}
      <div className="h-16 flex items-center justify-center px-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            {currentSidebarContext === 'organization' && <Building2 className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'project' && <FolderOpen className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'design' && <Palette className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'construction' && <HardHat className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'finances' && <DollarSign className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'commercialization' && <Handshake className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'postsale' && <Contact className="w-4 h-4 text-accent-foreground" />}
            {currentSidebarContext === 'admin' && <Crown className="w-4 h-4 text-accent-foreground" />}
            {!currentSidebarContext && <Home className="w-4 h-4 text-accent-foreground" />}
          </div>
          {isSubmenuExpanded && (
            <span className="ml-3 font-semibold text-[var(--menues-fg)]">
              {currentSidebarContext === 'organization' && 'Organización'}
              {currentSidebarContext === 'project' && 'Proyecto'}
              {currentSidebarContext === 'design' && 'Diseño'}
              {currentSidebarContext === 'construction' && 'Obra'}
              {currentSidebarContext === 'finances' && 'Finanzas'}
              {currentSidebarContext === 'commercialization' && 'Comercial'}
              {currentSidebarContext === 'postsale' && 'Post-Venta'}
              {currentSidebarContext === 'admin' && 'Admin'}
              {!currentSidebarContext && 'General'}
            </span>
          )}
        </div>
      </div>

      {/* Navegación - sin divisores, headers ni botones de cerrar */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="space-y-[2px]">
          {currentSubmenuItems.map((item, index) => {
            // Skip dividers y accordions - solo botones simples
            if (item.type === 'divider' || item.type === 'accordion') {
              return null;
            }

            // Botón normal con posible restricción
            if (item.restricted && !isAdmin) {
              return (
                <CustomRestricted key={index} reason="coming_soon">
                  <SidebarButton
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    href="#"
                    isActive={false}
                    onClick={() => {}}
                    label={item.label}
                    isExpanded={isSubmenuExpanded}
                  />
                </CustomRestricted>
              );
            }

            return (
              <SidebarButton
                key={index}
                icon={<item.icon className="w-[18px] h-[18px]" />}
                href={item.href}
                isActive={location === item.href}
                onClick={item.onClick}
                label={item.label}
                isExpanded={isSubmenuExpanded}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}