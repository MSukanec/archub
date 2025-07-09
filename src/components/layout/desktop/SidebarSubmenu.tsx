import { useLocation } from "wouter";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useSidebarStore, useSecondarySidebarStore } from "@/stores/sidebarStore";
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
  const { isDocked: isMainDocked, isHovered: isMainHovered } = useSidebarStore();
  const { isDocked: isSecondaryDocked, isHovered: isSecondaryHovered, setDocked: setSecondaryDocked, setHovered: setSecondaryHovered } = useSecondarySidebarStore();
  const { activeSidebarSection, setActiveSidebarSection, setSidebarContext } = useNavigationStore();

  const isMainSidebarExpanded = isMainDocked || isMainHovered;
  const isSecondarySidebarExpanded = isSecondaryDocked || isSecondaryHovered;

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
      { icon: FolderOpen, label: 'Proyectos', href: '/organization/projects' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Contact, label: 'Contactos', href: '/organization/contacts' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
    ],
    
    'datos-basicos': [
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: Database, label: 'Datos Básicos', href: '/project/basic-data' },
    ],

    'diseno': [
      { icon: Home, label: 'Resumen de Diseño', href: '/design/dashboard' },
      { icon: Database, label: 'Documentación', href: '/design/documentation' },
      { icon: Calendar, label: 'Cronograma', href: '/design/timeline' },
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

  const currentSubmenu = submenuContent[activeSidebarSection as keyof typeof submenuContent] || [];

  // Always show the secondary sidebar
  return (
    <div 
      className={cn(
        "fixed top-9 h-[calc(100vh-36px)] bg-[var(--secondary-sidebar-bg)] border-r border-[var(--secondary-sidebar-border)] z-30 flex flex-col transition-all duration-300",
        isMainSidebarExpanded ? "left-[240px]" : "left-[40px]",
        isSecondarySidebarExpanded ? "w-64" : "w-10"
      )}
      onMouseEnter={() => setSecondaryHovered(true)}
      onMouseLeave={() => setSecondaryHovered(false)}
    >
      {/* Contenido del submenú - sin header */}
      <div className="flex-1 overflow-y-auto p-1">
        <div className="flex flex-col gap-[2px]">
          {currentSubmenu.length > 0 ? (
            currentSubmenu.map((item, index) => {
              if (item.type === 'accordion') {
                return (
                  <div key={index} className="mb-[2px]">
                    <div className="px-3 py-2 text-xs font-semibold text-[var(--secondary-sidebar-fg)] opacity-60 uppercase tracking-wide">
                      {item.label}
                    </div>
                    <div className="flex flex-col gap-[2px]">
                      {item.items?.map((subItem, subIndex) => (
                        <div key={subIndex} className="mb-[2px]">
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
                  <div key={index} className="mb-[2px]">
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
                <div key={index} className="mb-[2px]">
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
          ) : (
            <div className="p-4 text-center text-sm text-[var(--secondary-sidebar-fg)] opacity-60">
              Selecciona una sección para ver opciones
            </div>
          )}
        </div>
      </div>
    </div>
  );
}