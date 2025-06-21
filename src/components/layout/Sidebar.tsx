import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { SidebarButton } from "@/components/ui/sidebar-button";
import {
  Home,
  Building,
  Folder,
  Users,
  DollarSign,
  FileText,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  TRANSITION_DURATION,
} from "@/lib/constants/ui";



export function Sidebar() {
  const [location] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({
    organizacion: false,
    proyectos: false,
    obra: false,
    finanzas: false,
    configuracion: false,
  });
  const { data } = useCurrentUser();

  const toggleGroup = (groupKey: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => {
      // Cerrar todos los grupos primero
      const allClosed = {
        organizacion: false,
        proyectos: false,
        obra: false,
        finanzas: false,
      };
      
      // Si el grupo actual está cerrado, abrirlo. Si está abierto, cerrarlo.
      return {
        ...allClosed,
        [groupKey]: !prev[groupKey],
      };
    });
  };

  const isGroupActive = (routes: string[]) => {
    return routes.some(route => location === route);
  };

  return (
    <div
      className="hidden lg:flex lg:flex-shrink-0"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <aside
        className="flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] transition-all"
        style={{
          width: isExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_WIDTH,
          transitionDuration: `${TRANSITION_DURATION}ms`,
        }}
      >


        {/* Navegación */}
        <nav className="flex flex-col flex-1">
          {/* Dashboard */}
          <Link href="/dashboard">
            <SidebarButton
              icon={Home}
              isExpanded={isExpanded}
              isActive={location === "/dashboard" || location === "/"}
            >
              Dashboard
            </SidebarButton>
          </Link>

          {/* Grupo Organización */}
          <div>
            <div
              onClick={() => toggleGroup('organizacion')}
              className="cursor-pointer"
            >
              <SidebarButton
                icon={Users}
                isExpanded={isExpanded}
                isActive={isGroupActive(['/organizaciones', '/contactos'])}
              >
                Organización
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.organizacion && (
              <div className="transition-all duration-200">
                <Link href="/organizaciones">
                  <SidebarButton
                    isExpanded={isExpanded}
                    isActive={location === '/organizaciones'}
                    className="text-sm"
                  >
                    Gestión de Organizaciones
                  </SidebarButton>
                </Link>
                <Link href="/contactos">
                  <SidebarButton
                    isExpanded={isExpanded}
                    isActive={location === '/contactos'}
                    className="text-sm"
                  >
                    Contactos
                  </SidebarButton>
                </Link>
              </div>
            )}
          </div>

          {/* Grupo Proyectos */}
          <div>
            <div
              onClick={() => toggleGroup('proyectos')}
              className="cursor-pointer"
            >
              <SidebarButton
                icon={Folder}
                isExpanded={isExpanded}
                isActive={isGroupActive(['/proyectos'])}
              >
                Proyectos
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.proyectos && (
              <div className="transition-all duration-200">
                <Link href="/proyectos">
                  <SidebarButton
                    isExpanded={isExpanded}
                    isActive={location === '/proyectos'}
                    className="text-sm"
                  >
                    Gestión de Proyectos
                  </SidebarButton>
                </Link>
              </div>
            )}
          </div>

          {/* Grupo Obra */}
          <div>
            <div
              onClick={() => toggleGroup('obra')}
              className="cursor-pointer"
            >
              <SidebarButton
                icon={FileText}
                isExpanded={isExpanded}
                isActive={isGroupActive(['/bitacora'])}
              >
                Obra
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.obra && (
              <div className="transition-all duration-200">
                <Link href="/bitacora">
                  <SidebarButton
                    isExpanded={isExpanded}
                    isActive={location === '/bitacora'}
                    className="text-sm"
                  >
                    Bitácora
                  </SidebarButton>
                </Link>
              </div>
            )}
          </div>

          {/* Grupo Finanzas */}
          <div>
            <div
              onClick={() => toggleGroup('finanzas')}
              className="cursor-pointer"
            >
              <SidebarButton
                icon={DollarSign}
                isExpanded={isExpanded}
                isActive={isGroupActive(['/movimientos'])}
              >
                Finanzas
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.finanzas && (
              <div className="transition-all duration-200">
                <Link href="/movimientos">
                  <SidebarButton
                    isExpanded={isExpanded}
                    isActive={location === '/movimientos'}
                    className="text-sm"
                  >
                    Movimientos
                  </SidebarButton>
                </Link>
              </div>
            )}
          </div>

          {/* Grupo Configuración */}
          <div>
            <div
              onClick={() => toggleGroup('configuracion')}
              className="cursor-pointer"
            >
              <SidebarButton
                icon={Settings}
                isExpanded={isExpanded}
                isActive={isGroupActive(['/admin/organizaciones'])}
              >
                Configuración
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.configuracion && (
              <div className="transition-all duration-200">
                <Link href="/admin/organizaciones">
                  <SidebarButton
                    isExpanded={isExpanded}
                    isActive={location === '/admin/organizaciones'}
                    className="text-sm"
                  >
                    Organizaciones
                  </SidebarButton>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Bloque inferior (perfil) */}
        <div className="flex flex-col">
          <Link href="/perfil">
            <SidebarButton
              isExpanded={isExpanded}
              icon={User}
            >
              Ver perfil
            </SidebarButton>
          </Link>
        </div>
      </aside>
    </div>
  );
}
