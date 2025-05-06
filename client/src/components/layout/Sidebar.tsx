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
  LucideListTodo,
  LucidePlus,
  LucideLayoutGrid
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

// Enum para los diferentes tipos de sidebar
export enum SidebarType {
  MainSidebar = "main_sidebar",
  ProjectSidebar = "project_sidebar",
  SettingsSidebar = "settings_sidebar"
}

interface SidebarProps {
  type?: SidebarType;
  onTypeChange?: (type: SidebarType) => void;
  selectedOrganization?: string | null;
  selectedProject?: string | null;
}

export function Sidebar({ 
  type = SidebarType.MainSidebar, 
  onTypeChange,
  selectedOrganization = null,
  selectedProject = null
}: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  // Items para el main_sidebar
  const mainSidebarItems = [
    {
      name: "Organización",
      path: "/organization",
      icon: <LucideBuilding className="h-5 w-5" />,
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
  
  // Items para el project_sidebar
  const projectSidebarItems = [
    {
      name: "Crear Presupuesto",
      path: `/projects/${selectedProject}/budgets/new`,
      icon: <LucidePlus className="h-5 w-5" />,
    },
    {
      name: "Lista de Materiales",
      path: `/projects/${selectedProject}/materials-list`,
      icon: <LucideListTodo className="h-5 w-5" />,
    },
  ];
  
  // Items para el settings_sidebar
  const settingsSidebarItems = [
    {
      name: "Materiales Unitarios",
      path: "/materials",
      icon: <LucidePackage className="h-5 w-5" />,
    },
    {
      name: "Tareas",
      path: "/tasks",
      icon: <LucideCheckSquare className="h-5 w-5" />,
    },
  ];
  
  // Seleccionar los items correctos según el tipo de sidebar
  let sidebarItems = mainSidebarItems;
  if (type === SidebarType.ProjectSidebar) {
    sidebarItems = projectSidebarItems;
  } else if (type === SidebarType.SettingsSidebar) {
    sidebarItems = settingsSidebarItems;
  }

  if (isMobile) {
    return null;
  }

  return (
    <aside 
      className={`sidebar h-full transition-all duration-200 ${expanded ? "w-60" : "w-16"}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <TooltipProvider>
          {sidebarItems.map((item) => (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Link href={item.path}>
                  <div 
                    className={`sidebar-item ${location === item.path ? 'active' : ''}`}
                  >
                    <div className={`flex items-center justify-center min-w-[2rem] ${expanded ? 'mr-3' : ''}`}>
                      {item.icon}
                    </div>
                    {expanded && (
                      <span className="text-sm font-medium">
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

          {/* Solo mostramos el botón de configuración en el MainSidebar */}
          {type === SidebarType.MainSidebar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="sidebar-item cursor-pointer"
                  onClick={() => onTypeChange && onTypeChange(SidebarType.SettingsSidebar)}
                >
                  <div className={`flex items-center justify-center min-w-[2rem] ${expanded ? 'mr-3' : ''}`}>
                    <LucideSettings className="h-5 w-5" />
                  </div>
                  {expanded && (
                    <span className="text-sm font-medium">
                      Configuración
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right" className="mr-2">
                  <p>Configuración</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Solo mostramos el botón de volver en ProjectSidebar y SettingsSidebar */}
          {(type === SidebarType.ProjectSidebar || type === SidebarType.SettingsSidebar) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="sidebar-item cursor-pointer"
                  onClick={() => {
                    // Volver al sidebar anterior
                    if (onTypeChange) {
                      if (type === SidebarType.ProjectSidebar) {
                        onTypeChange(SidebarType.MainSidebar);
                      } else {
                        onTypeChange(SidebarType.MainSidebar);
                      }
                    }
                  }}
                >
                  <div className={`flex items-center justify-center min-w-[2rem] ${expanded ? 'mr-3' : ''}`}>
                    <LucideChevronLeft className="h-5 w-5" />
                  </div>
                  {expanded && (
                    <span className="text-sm font-medium">
                      Volver
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right" className="mr-2">
                  <p>Volver</p>
                </TooltipContent>
              )}
            </Tooltip>
          )}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
