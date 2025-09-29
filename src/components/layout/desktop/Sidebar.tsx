import { useState } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { cn } from "@/lib/utils";
import { useProjectContext } from '@/stores/projectContext';
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import ButtonSidebar from "./ButtonSidebar";
import { 
  Settings, 
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  Activity,
  PanelLeftOpen,
  PanelLeftClose,
  Calculator,
  History,
  Crown
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
}

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { sidebarLevel } = useNavigationStore();
  const { isDocked, isHovered, setHovered, setDocked } = useSidebarStore();
  
  // Estados simples
  const isExpanded = isDocked || isHovered;

  // Navegación según el nivel del sidebar
  const getNavigationItems = (): SidebarItem[] => {
    if (sidebarLevel === 'organization') {
      return [
        { id: 'dashboard', label: 'Resumen de Organización', icon: Home, href: '/organization/dashboard' },
        { id: 'projects', label: 'Gestión de Proyectos', icon: Building, href: '/organization/projects' },
        { id: 'contacts', label: 'Contactos', icon: Users, href: '/contacts' },
        { id: 'analysis', label: 'Análisis de Costos', icon: FileText, href: '/analysis' },
        { id: 'finances', label: 'Movimientos', icon: DollarSign, href: '/movements' },
        { id: 'capital', label: 'Capital', icon: Calculator, href: '/finances/capital' },
        { id: 'expenses', label: 'Gastos Generales', icon: FolderOpen, href: '/finances/general-costs' },
        { id: 'activity', label: 'Actividad', icon: Activity, href: '/organization/activity' },
        { id: 'preferences', label: 'Preferencias', icon: Settings, href: '/organization/preferences' },
      ];
    } else if (sidebarLevel === 'project' && selectedProjectId) {
      return [
        { id: 'dashboard', label: 'Resumen de Proyecto', icon: Home, href: '/project/dashboard' },
        { id: 'budgets', label: 'Cómputo y Presupuesto', icon: Calculator, href: '/budgets' },
        { id: 'personnel', label: 'Mano de Obra', icon: Users, href: '/construction/personnel' },
        { id: 'materials', label: 'Materiales', icon: FolderOpen, href: '/construction/materials' },
        { id: 'indirects', label: 'Indirectos', icon: Building, href: '/construction/indirects' },
        { id: 'subcontracts', label: 'Subcontratos', icon: FileText, href: '/construction/subcontracts' },
        { id: 'logs', label: 'Bitácora', icon: History, href: '/construction/logs' },
      ];
    } else if (sidebarLevel === 'admin' && isAdmin) {
      return [
        { id: 'materials', label: 'Precios de Materiales', icon: FolderOpen, href: '/admin/materials' },
        { id: 'tasks', label: 'Administrar Tareas', icon: Building, href: '/admin/tasks' },
        { id: 'users', label: 'Gestión de Usuarios', icon: Users, href: '/admin/users' },
      ];
    }
    
    return [];
  };

  const navigationItems = getNavigationItems();

  const handleDockToggle = () => {
    setDocked(!isDocked);
  };

  return (
    <div className="flex flex-row">
      {/* SIDEBAR PRINCIPAL */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-10 flex flex-row overflow-visible relative"
        style={{
          height: '100%',
          width: isDocked 
            ? '240px' 
            : (isHovered ? '240px' : '48px')
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <aside 
          className={cn(
            "flex flex-col flex-1 h-full relative",
            isExpanded ? "w-60" : "w-12"
          )}
          style={{ height: '100%' }}
        >
          {/* SECCIÓN SUPERIOR: Navegación principal */}
          <div className="overflow-y-auto pt-3 px-0" style={{ paddingBottom: '80px' }}>
            <div className="flex flex-col gap-[2px]">
              {navigationItems.map((item, index) => {
                if (item.adminOnly && !isAdmin) return null;
                
                const isActive = location === item.href;
                const shouldShowDivider = (sidebarLevel === 'organization' && 
                  (item.id === 'dashboard' || item.id === 'analysis' || item.id === 'expenses')) ||
                  (sidebarLevel === 'project' && 
                  (item.id === 'dashboard' || item.id === 'indirects'));
                
                return (
                  <div key={item.id}>
                    <ButtonSidebar
                      icon={<item.icon className="w-[18px] h-[18px]" />}
                      label={item.label}
                      isActive={isActive}
                      isExpanded={isExpanded}
                      onClick={() => navigate(item.href)}
                      href={item.href}
                      variant="secondary"
                    />
                    {shouldShowDivider && (
                      <div className="h-[1px] bg-[var(--main-sidebar-fg)] mx-3 my-3 opacity-20" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTÓN DE ANCLAR - POSICIÓN ABSOLUTA AL FONDO */}
          <div 
            className="absolute bottom-0 left-0 right-0 border-t border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)]"
            style={{ padding: '12px 0' }}
          >
            <div className="px-3">
              <ButtonSidebar
                icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
                label={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
                isActive={false}
                isExpanded={isExpanded}
                onClick={handleDockToggle}
                variant="secondary"
              />
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}