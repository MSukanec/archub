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
  Crown,
  Package,
  Layers,
  ListTodo,
  User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  adminOnly?: boolean;
  restricted?: "coming_soon" | string;
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
        { id: 'activity', label: 'Actividad', icon: Activity, href: '/organization/activity', restricted: 'coming_soon' },
        { id: 'preferences', label: 'Preferencias', icon: Settings, href: '/organization/preferences' },
      ];
    } else if (sidebarLevel === 'project' && selectedProjectId) {
      return [
        { id: 'dashboard', label: 'Resumen de Proyecto', icon: Home, href: '/project/dashboard' },
        { id: 'budgets', label: 'Cómputo y Presupuesto', icon: Calculator, href: '/budgets' },
        { id: 'personnel', label: 'Mano de Obra', icon: Users, href: '/construction/personnel', restricted: 'coming_soon' },
        { id: 'materials', label: 'Materiales', icon: Package, href: '/construction/materials', restricted: 'coming_soon' },
        { id: 'indirects', label: 'Indirectos', icon: Layers, href: '/construction/indirects', restricted: 'coming_soon' },
        { id: 'subcontracts', label: 'Subcontratos', icon: FileText, href: '/construction/subcontracts' },
        { id: 'logs', label: 'Bitácora', icon: History, href: '/construction/logs', restricted: 'coming_soon' },
      ];
    } else if (sidebarLevel === 'admin' && isAdmin) {
      return [
        { id: 'community', label: 'Comunidad', icon: Users, href: '/admin/community' },
        { id: 'costs', label: 'Costos', icon: DollarSign, href: '/admin/costs' },
        { id: 'tasks', label: 'Tareas', icon: ListTodo, href: '/admin/tasks' },
        { id: 'general', label: 'General', icon: Settings, href: '/admin/general' },
        { id: 'products', label: 'Productos', icon: Package, href: '/providers/products' },
      ];
    }
    
    return [];
  };

  const navigationItems = getNavigationItems();

  const handleDockToggle = () => {
    setDocked(!isDocked);
  };

  return (
    <div className="flex flex-row h-[calc(100vh-3rem)]">
      {/* SIDEBAR PRINCIPAL */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-10 overflow-visible relative h-[calc(100vh-3rem)]"
        style={{
          width: isDocked 
            ? '240px' 
            : (isHovered ? '240px' : '48px')
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <aside 
          className={cn(
            "grid h-[calc(100vh-3rem)] grid-rows-[1fr_auto]",
            isExpanded ? "w-60" : "w-12"
          )}
        >
          {/* SECCIÓN SUPERIOR: Navegación principal con scroll */}
          <div className="pt-3 px-0 overflow-y-auto">
            <div className="flex flex-col gap-[2px]">
              {navigationItems.map((item, index) => {
                if (item.adminOnly && !isAdmin) return null;
                
                const isActive = location === item.href;
                // Configuración de divisores con texto
                const getDividerInfo = () => {
                  if (sidebarLevel === 'organization') {
                    if (item.id === 'dashboard') return { show: true, text: 'Gestión' };
                    if (item.id === 'analysis') return { show: true, text: 'Finanzas' };
                    if (item.id === 'expenses') return { show: true, text: 'Organización' };
                  } else if (sidebarLevel === 'project') {
                    if (item.id === 'dashboard') return { show: true, text: 'Planificación' };
                    if (item.id === 'budgets') return { show: true, text: 'Recursos' };
                    if (item.id === 'subcontracts') return { show: true, text: 'Ejecución' };
                  }
                  return { show: false, text: '' };
                };

                const dividerInfo = getDividerInfo();
                
                // Botón con o sin restricción
                const button = (
                  <ButtonSidebar
                    icon={<item.icon className="w-[18px] h-[18px]" />}
                    label={item.label}
                    isActive={isActive}
                    isExpanded={isExpanded}
                    onClick={() => navigate(item.href)}
                    href={item.href}
                    variant="secondary"
                  />
                );
                
                return (
                  <div key={item.id}>
                    {item.restricted ? (
                      <PlanRestricted reason={item.restricted}>
                        {button}
                      </PlanRestricted>
                    ) : (
                      button
                    )}
                    {dividerInfo.show && (
                      <div className="mx-3 my-3 h-[12px] flex items-center">
                        {isExpanded ? (
                          // Divisor con texto cuando está expandido
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                            <span className="text-[10px] font-medium text-[var(--main-sidebar-fg)] opacity-60 px-1 leading-none">
                              {dividerInfo.text}
                            </span>
                            <div className="flex-1 h-[1px] bg-[var(--main-sidebar-fg)] opacity-20" />
                          </div>
                        ) : (
                          // Línea simple cuando está colapsado - misma altura
                          <div className="h-[1px] bg-[var(--main-sidebar-fg)] opacity-20 w-full" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIÓN INFERIOR: Controles y Avatar (siempre pegados al fondo) */}
          <div className="pt-3 pb-3 px-0 flex flex-col gap-[2px]">
            {/* Botón de Anclar */}
            <ButtonSidebar
              icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
              label={isDocked ? "Desanclar" : "Anclar"}
              isActive={false}
              isExpanded={isExpanded}
              onClick={handleDockToggle}
              variant="secondary"
            />
            
            {/* Botón de Administración - solo si es admin */}
            {isAdmin && (
              <ButtonSidebar
                icon={<Crown className="w-[18px] h-[18px]" />}
                label="Administración"
                isActive={sidebarLevel === 'admin'}
                isExpanded={isExpanded}
                onClick={() => {
                  const { setSidebarLevel } = useNavigationStore.getState();
                  if (sidebarLevel === 'admin') {
                    setSidebarLevel('organization');
                  } else {
                    setSidebarLevel('admin');
                  }
                }}
                variant="secondary"
              />
            )}

            {/* Avatar del Usuario */}
            <button
              className="h-10 w-full rounded-md cursor-pointer transition-colors hover:bg-[var(--main-sidebar-button-hover-bg)] grid"
              style={{
                gridTemplateColumns: isExpanded ? '44px 1fr' : '44px 0fr'
              }}
              onClick={() => navigate('/profile')}
            >
              {/* Primera columna: Avatar siempre en la misma posición */}
              <div className="flex items-center justify-center">
                <Avatar className="h-8 w-8 flex-shrink-0 ring-0 border-0">
                  <AvatarFallback className="bg-[var(--accent)] text-white text-sm font-semibold border-0">
                    {userData?.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              {/* Segunda columna: Texto que aparece/desaparece */}
              <div className="flex flex-col justify-center overflow-hidden min-w-0">
                {isExpanded && (
                  <>
                    <span className="text-sm font-medium text-[var(--main-sidebar-fg)] truncate text-left">
                      {userData?.user?.full_name || 'Usuario'}
                    </span>
                    <span className="text-xs text-[var(--main-sidebar-fg)] opacity-60 truncate text-left">
                      Ver perfil
                    </span>
                  </>
                )}
              </div>
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}