import { Link, useLocation } from "wouter";
import { 
  LucideHome, 
  LucidePackage, 
  LucideCheckSquare, 
  LucideFileText, 
  LucideSettings, 
  LucideBuilding, 
  LucideUsers, 
  LucideDatabase, 
  LucideFolderClosed, 
  LucideChevronLeft, 
  LucideListTodo 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

// Enum para los diferentes tipos de sidebar
export enum SidebarType {
  Organization = "organization",
  Project = "project",
  Configuration = "configuration"
}

interface SidebarProps {
  type?: SidebarType;
  onTypeChange?: (type: SidebarType) => void;
  selectedOrganization?: string | null;
  selectedProject?: string | null;
}

export function Sidebar({ 
  type = SidebarType.Organization, 
  onTypeChange,
  selectedOrganization = null,
  selectedProject = null
}: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  // Items del sidebar para la organización
  const organizationItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LucideHome className="h-5 w-5" />,
    },
    {
      name: "Proyectos",
      path: "/projects",
      icon: <LucideFolderClosed className="h-5 w-5" />,
    },
    {
      name: "Equipo",
      path: "/team",
      icon: <LucideUsers className="h-5 w-5" />,
    },
  ];
  
  // Items del sidebar para el proyecto
  const projectItems = [
    {
      name: "Presupuestos",
      path: `/projects/${selectedProject}/budgets`,
      icon: <LucideFileText className="h-5 w-5" />,
    },
    {
      name: "Listado de Materiales",
      path: `/projects/${selectedProject}/materials-list`,
      icon: <LucideListTodo className="h-5 w-5" />,
    },
  ];
  
  // Items del sidebar para la configuración
  const configItems = [
    {
      name: "Tareas",
      path: "/tasks",
      icon: <LucideCheckSquare className="h-5 w-5" />,
    },
    {
      name: "Materiales Unitarios",
      path: "/materials",
      icon: <LucidePackage className="h-5 w-5" />,
    },
  ];
  
  // Seleccionar los items correctos según el tipo de sidebar
  let sidebarItems = organizationItems;
  if (type === SidebarType.Project) {
    sidebarItems = projectItems;
  } else if (type === SidebarType.Configuration) {
    sidebarItems = configItems;
  }

  if (isMobile) {
    return null;
  }

  return (
    <aside 
      className={`sidebar fixed top-0 left-0 z-10 h-screen bg-sidebar transition-all duration-200 ${expanded ? "w-60" : "w-16"}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Empty top space to align with header */}
      <div className="flex items-center justify-center h-16 bg-sidebar border-b border-sidebar-accent/10">
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1.5">
        <TooltipProvider>
          {sidebarItems.map((item) => (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Link href={item.path}>
                  <div 
                    className={`flex items-center rounded-md transition-colors py-2.5 ${location === item.path 
                      ? 'bg-sidebar-accent text-white' 
                      : 'text-slate-300 hover:bg-sidebar-accent/50 hover:text-white'}`}
                  >
                    <div className={`flex items-center justify-center min-w-[3.5rem] ${expanded ? 'justify-start pl-3' : ''}`}>
                      {item.icon}
                    </div>
                    {expanded && (
                      <span className="text-sm font-medium transition-opacity duration-150">
                        {item.name}
                      </span>
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right" className="mr-2">
                  <p>{item.name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}

          <div className="pt-4"></div>

          {/* Botón de Configuración o Volver según el tipo */}
          <Tooltip>
            <TooltipTrigger asChild>
              {type !== SidebarType.Configuration ? (
                <div 
                  className="flex items-center rounded-md transition-colors py-2.5 text-slate-300 hover:bg-sidebar-accent/50 hover:text-white cursor-pointer"
                  onClick={() => onTypeChange && onTypeChange(SidebarType.Configuration)}
                >
                  <div className={`flex items-center justify-center min-w-[3.5rem] ${expanded ? 'justify-start pl-3' : ''}`}>
                    <LucideSettings className="h-5 w-5" />
                  </div>
                  {expanded && (
                    <span className="text-sm font-medium transition-opacity duration-150">
                      Configuración
                    </span>
                  )}
                </div>
              ) : (
                <div 
                  className="flex items-center rounded-md transition-colors py-2.5 text-slate-300 hover:bg-sidebar-accent/50 hover:text-white cursor-pointer"
                  onClick={() => {
                    // Volver al sidebar anterior
                    if (onTypeChange) {
                      if (selectedProject) {
                        onTypeChange(SidebarType.Project);
                      } else {
                        onTypeChange(SidebarType.Organization);
                      }
                    }
                  }}
                >
                  <div className={`flex items-center justify-center min-w-[3.5rem] ${expanded ? 'justify-start pl-3' : ''}`}>
                    <LucideChevronLeft className="h-5 w-5" />
                  </div>
                  {expanded && (
                    <span className="text-sm font-medium transition-opacity duration-150">
                      Volver
                    </span>
                  )}
                </div>
              )}
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" className="mr-2">
                <p>{type !== SidebarType.Configuration ? 'Configuración' : 'Volver'}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </nav>

      {/* No Create Button */}
    </aside>
  );
}
