import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LucideHome, 
  LucidePackage, 
  LucideCheckSquare, 
  LucideFileText, 
  LucideSettings, 
  LucideBuilding, 
  LucideUsers, 
  LucideFolderClosed, 
  LucideListTodo,
  LucideLayoutGrid,
  LucidePieChart,
  LucideRuler,
  LucideSearch
} from "lucide-react";
import { SidebarTypes, SidebarType } from "@/components/layout/Sidebar";

interface MobileNavbarProps {
  type?: SidebarType;
  selectedProject?: string | null;
  selectedOrganization?: string | null;
}

export function MobileNavbar({
  type = SidebarTypes.MainSidebar,
  selectedProject = null,
  selectedOrganization = null
}: MobileNavbarProps) {
  const [location] = useLocation();
  
  // Definimos interfaz para los elementos de navegación
  interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
  }

  // Seleccionar los items correctos según el tipo de sidebar
  let navItems: NavItem[] = [];
  
  // Items para el main_sidebar
  if (type === SidebarTypes.MainSidebar) {
    navItems = [
      {
        name: "Inicio",
        path: "/",
        icon: <LucidePieChart className="h-5 w-5" />,
      },
      {
        name: "Proyectos",
        path: "/projects",
        icon: <LucideFolderClosed className="h-5 w-5" />,
      },
      {
        name: "Organización",
        path: "/organization",
        icon: <LucideBuilding className="h-5 w-5" />,
      },
      {
        name: "Equipo",
        path: "/team",
        icon: <LucideUsers className="h-5 w-5" />,
      },
      {
        name: "Ajustes",
        path: "/organization/settings",
        icon: <LucideSettings className="h-5 w-5" />,
      },
    ];
  } 
  // Items para el project_sidebar
  else if (type === SidebarTypes.ProjectSidebar) {
    navItems = [
      {
        name: "Resumen",
        path: `/projects/${selectedProject}`,
        icon: <LucideLayoutGrid className="h-5 w-5" />,
      },
      {
        name: "Materiales",
        path: `/projects/${selectedProject}/materials`,
        icon: <LucideListTodo className="h-5 w-5" />,
      },
      {
        name: "Presupuestos",
        path: `/projects/${selectedProject}/budgets`,
        icon: <LucideFileText className="h-5 w-5" />,
      },
      {
        name: "Movimientos",
        path: `/projects/${selectedProject}/transactions`,
        icon: <LucideFileText className="h-5 w-5" />,
      },
      {
        name: "Búsqueda",
        path: `/projects/${selectedProject}/search`,
        icon: <LucideSearch className="h-5 w-5" />,
      },
    ];
  }
  // Items para el settings_sidebar
  else if (type === SidebarTypes.SettingsSidebar) {
    navItems = [
      {
        name: "Materiales",
        path: "/materials",
        icon: <LucidePackage className="h-5 w-5" />,
      },
      {
        name: "Tareas",
        path: "/tasks",
        icon: <LucideCheckSquare className="h-5 w-5" />,
      },
      {
        name: "Categorías",
        path: "/categories",
        icon: <LucideListTodo className="h-5 w-5" />,
      },
      {
        name: "Unidades",
        path: "/units",
        icon: <LucideRuler className="h-5 w-5" />,
      },
      {
        name: "Ajustes",
        path: "/organization/settings",
        icon: <LucideSettings className="h-5 w-5" />,
      },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 flex justify-around items-center h-14 pb-safe">
      {navItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <div className="flex flex-col items-center py-1 px-2">
            <div className={`${location === item.path ? "text-primary" : "text-muted-foreground"}`}>
              {item.icon}
            </div>
            <span className={`text-xs mt-1 ${location === item.path ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {item.name}
            </span>
          </div>
        </Link>
      ))}
    </nav>
  );
}