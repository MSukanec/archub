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
  const { activeSidebarSection, setActiveSidebarSection, setSidebarContext } = useNavigationStore();

  const isMainSidebarExpanded = isDocked || isHovered;

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

  if (!activeSidebarSection) return null;

  return (
    <div 
      className={cn(
        "fixed top-9 h-[calc(100vh-36px)] w-64 bg-[var(--menues-bg)] border-r border-[var(--menues-border)] z-30 flex flex-col transition-all duration-300",
        isMainSidebarExpanded ? "left-[240px]" : "left-[40px]"
      )}
    >
      {/* Header con título de la sección */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--menues-border)]">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--menues-fg)] opacity-60">
          {activeSidebarSection === 'organizacion' && 'Organización'}
          {activeSidebarSection === 'datos-basicos' && 'Datos Básicos'}
          {activeSidebarSection === 'diseno' && 'Diseño'}
          {activeSidebarSection === 'obra' && 'Obra'}
          {activeSidebarSection === 'finanzas' && 'Finanzas'}
          {activeSidebarSection === 'comercializacion' && 'Comercialización'}
          {activeSidebarSection === 'post-venta' && 'Post-Venta'}
          {activeSidebarSection === 'administracion' && 'Administración'}
        </h3>
        <button
          onClick={() => setActiveSidebarSection(null)}
          className="p-1.5 rounded-md hover:bg-[var(--menues-hover-bg)] transition-colors text-[var(--menues-fg)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Contenido del submenú */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {currentSubmenu.map((item, index) => {
            if (item.type === 'divider') {
              return <hr key={index} className="my-2 border-border" />;
            }

            if (item.type === 'accordion') {
              return (
                <div key={index} className="mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--menues-fg)] opacity-60 uppercase tracking-wide">
                    {item.label}
                  </div>
                  <div className="space-y-1">
                    {item.items?.map((subItem, subIndex) => (
                      <SidebarButton
                        key={subIndex}
                        icon={<subItem.icon className="w-[18px] h-[18px]" />}
                        href={subItem.href}
                        isActive={location === subItem.href}
                        onClick={subItem.onClick}
                        label={subItem.label}
                        isExpanded={true}
                      />
                    ))}
                  </div>
                </div>
              );
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
                    isExpanded={true}
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
                isExpanded={true}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}