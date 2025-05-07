import { useState } from "react";
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
  LucideLayoutGrid,
  LucidePieChart,
  LucideRuler
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME, THEME_COLORS } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";

// Enum para los diferentes tipos de sidebar
export const SidebarTypes = {
  MainSidebar: "main_sidebar",
  ProjectSidebar: "project_sidebar",
  SettingsSidebar: "settings_sidebar"
} as const;

export type SidebarType = typeof SidebarTypes[keyof typeof SidebarTypes];

interface SidebarProps {
  type?: SidebarType;
  onTypeChange?: (type: SidebarType) => void;
  selectedOrganization?: string | null;
  selectedProject?: string | null;
}

export function Sidebar({ 
  type = SidebarTypes.MainSidebar, 
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
      name: "Dashboard",
      path: "/",
      icon: <LucidePieChart className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Organización",
      path: "/organization",
      icon: <LucideBuilding className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Proyectos",
      path: "/projects",
      icon: <LucideFolderClosed className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Equipo",
      path: "/team",
      icon: <LucideUsers className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
  ];
  
  // Items para el project_sidebar
  const projectSidebarItems = [
    {
      name: "Resumen",
      path: `/projects/${selectedProject}`,
      icon: <LucideLayoutGrid className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Crear Presupuesto",
      path: `/projects/${selectedProject}/budgets/new`,
      icon: <LucidePlus className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Lista de Materiales",
      path: `/projects/${selectedProject}/materials`,
      icon: <LucideListTodo className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Movimientos",
      path: `/projects/${selectedProject}/transactions`,
      icon: <LucideFileText className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
  ];
  
  // Items para el settings_sidebar
  const settingsSidebarItems = [
    {
      name: "Materiales Unitarios",
      path: "/materials",
      icon: <LucidePackage className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Tareas",
      path: "/tasks",
      icon: <LucideCheckSquare className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Categorías",
      path: "/categories",
      icon: <LucideDatabase className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
    {
      name: "Unidades",
      path: "/units",
      icon: <LucideRuler className="h-5 w-5 md:h-[20px] md:w-[20px]" />,
    },
  ];
  
  // Seleccionar los items correctos según el tipo de sidebar
  let sidebarItems = mainSidebarItems;
  if (type === SidebarTypes.ProjectSidebar) {
    sidebarItems = projectSidebarItems;
  } else if (type === SidebarTypes.SettingsSidebar) {
    sidebarItems = settingsSidebarItems;
  }

  if (isMobile) {
    return null;
  }

  return (
    <aside 
      className={`sidebar h-full transition-all duration-200 border-r ${expanded ? "w-60" : "w-[45px]"}`}
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
                    <div className="flex items-center">
                      <div className={`flex items-center ${expanded ? 'justify-start' : 'justify-center'} w-[45px]`}>
                        <div className={location === item.path ? "text-primary" : "text-[#707070]"}>
                          {item.icon}
                        </div>
                      </div>
                      {expanded && (
                        <span className="text-sm font-medium ml-2 text-[#707070]">
                          {item.name}
                        </span>
                      )}
                    </div>
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
          {type === SidebarTypes.MainSidebar && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="sidebar-item cursor-pointer"
                  onClick={() => onTypeChange && onTypeChange(SidebarTypes.SettingsSidebar)}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center ${expanded ? 'justify-start' : 'justify-center'} w-[45px]`}>
                      <LucideSettings className="h-5 w-5 md:h-[20px] md:w-[20px] text-[#707070]" />
                    </div>
                    {expanded && (
                      <span className="text-sm font-medium ml-2 text-[#707070]">
                        Configuración
                      </span>
                    )}
                  </div>
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
          {(type === SidebarTypes.ProjectSidebar || type === SidebarTypes.SettingsSidebar) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="sidebar-item cursor-pointer"
                  onClick={() => {
                    // Volver al sidebar anterior
                    if (onTypeChange) {
                      if (type === SidebarTypes.ProjectSidebar) {
                        onTypeChange(SidebarTypes.MainSidebar);
                      } else {
                        onTypeChange(SidebarTypes.MainSidebar);
                      }
                    }
                  }}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center ${expanded ? 'justify-start' : 'justify-center'} w-[45px]`}>
                      <LucideChevronLeft className="h-5 w-5 md:h-[20px] md:w-[20px] text-[#707070]" />
                    </div>
                    {expanded && (
                      <span className="text-sm font-medium ml-2 text-[#707070]">
                        Volver
                      </span>
                    )}
                  </div>
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
