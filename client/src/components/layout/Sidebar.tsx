import { Link, useLocation } from "wouter";
import { LucideHome, LucidePackage, LucideCheckSquare, LucideFileText, LucideSettings, LucidePlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  onCreateBudget: () => void;
}

export function Sidebar({ onCreateBudget }: SidebarProps) {
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const sidebarItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LucideHome className="h-5 w-5 mr-3" />,
    },
    {
      name: "Materiales Unitarios",
      path: "/materials",
      icon: <LucidePackage className="h-5 w-5 mr-3" />,
    },
    {
      name: "Tareas de Obra",
      path: "/tasks",
      icon: <LucideCheckSquare className="h-5 w-5 mr-3" />,
    },
    {
      name: "Presupuestos",
      path: "/budgets",
      icon: <LucideFileText className="h-5 w-5 mr-3" />,
    },
  ];

  if (isMobile) {
    return null;
  }

  return (
    <aside className="sidebar hidden md:flex flex-col w-60">
      {/* Logo */}
      <div className="flex items-center px-4 py-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm-2-6a1 1 0 011-1h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1a1 1 0 110-2h.586a1 1 0 00.707-.293l1.414-1.414a1 1 0 00.293-.707V8.414a1 1 0 00-.293-.707L15.414 6 14 7.414a1 1 0 01-.707.293H12a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <span className="ml-2 text-lg font-semibold">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <div className="px-3 py-2 text-xs font-medium text-gray-400 uppercase">Gestión</div>

        {sidebarItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
          >
            <a 
              className={`sidebar-item ${location === item.path ? 'active' : ''}`}
            >
              {item.icon}
              {item.name}
            </a>
          </Link>
        ))}

        <div className="px-3 py-2 mt-6 text-xs font-medium text-gray-400 uppercase">Ajustes</div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <a className={`sidebar-item ${location === '/settings' ? 'active' : ''}`}>
                  <LucideSettings className="h-5 w-5 mr-3" />
                  Configuración
                </a>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Configuración de la cuenta</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>

      {/* Create New Button */}
      <div className="p-4">
        <button 
          className="create-button"
          onClick={onCreateBudget}
        >
          <LucidePlus className="h-5 w-5 mr-2" />
          Crear Presupuesto
        </button>
      </div>
    </aside>
  );
}
