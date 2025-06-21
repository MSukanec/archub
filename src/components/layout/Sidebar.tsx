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
  });
  const { data } = useCurrentUser();

  const toggleGroup = (groupKey: keyof typeof expandedGroups) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
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
        {/* Logo */}
        <Link href="/">
          <SidebarButton
            icon={Building}
            isExpanded={isExpanded}
            isActive={location === "/"}
          >
            Archub
          </SidebarButton>
        </Link>

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
                Organización {isExpanded && (expandedGroups.organizacion ? '▼' : '▶')}
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.organizacion && (
              <div className="transition-all duration-200">
                <Link href="/organizaciones">
                  <div className="pl-4">
                    <SidebarButton
                      isExpanded={isExpanded}
                      isActive={location === '/organizaciones'}
                      className="text-sm"
                    >
                      Gestión de Organizaciones
                    </SidebarButton>
                  </div>
                </Link>
                <Link href="/contactos">
                  <div className="pl-4">
                    <SidebarButton
                      isExpanded={isExpanded}
                      isActive={location === '/contactos'}
                      className="text-sm"
                    >
                      Contactos
                    </SidebarButton>
                  </div>
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
                Proyectos {isExpanded && (expandedGroups.proyectos ? '▼' : '▶')}
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.proyectos && (
              <div className="transition-all duration-200">
                <Link href="/proyectos">
                  <div className="pl-4">
                    <SidebarButton
                      isExpanded={isExpanded}
                      isActive={location === '/proyectos'}
                      className="text-sm"
                    >
                      Gestión de Proyectos
                    </SidebarButton>
                  </div>
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
                Obra {isExpanded && (expandedGroups.obra ? '▼' : '▶')}
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.obra && (
              <div className="transition-all duration-200">
                <Link href="/bitacora">
                  <div className="pl-4">
                    <SidebarButton
                      isExpanded={isExpanded}
                      isActive={location === '/bitacora'}
                      className="text-sm"
                    >
                      Bitácora
                    </SidebarButton>
                  </div>
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
                Finanzas {isExpanded && (expandedGroups.finanzas ? '▼' : '▶')}
              </SidebarButton>
            </div>
            {isExpanded && expandedGroups.finanzas && (
              <div className="transition-all duration-200">
                <Link href="/movimientos">
                  <div className="pl-4">
                    <SidebarButton
                      isExpanded={isExpanded}
                      isActive={location === '/movimientos'}
                      className="text-sm"
                    >
                      Movimientos
                    </SidebarButton>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Bloque inferior (settings, perfil) */}
        <div className="flex flex-col">
          <Link href="/settings">
            <SidebarButton
              icon={Settings}
              isExpanded={isExpanded}
              isActive={location === "/settings"}
            >
              Configuración
            </SidebarButton>
          </Link>
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
