import { Link, useLocation } from "wouter";
import { LucideHome, LucidePackage, LucideCheckSquare, LucideFileText, LucideSettings, LucidePlus, LucideZap, LucideLayoutGrid } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const sidebarItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LucideHome className="h-5 w-5" />,
    },
    {
      name: "Presupuestos",
      path: "/budgets",
      icon: <LucideFileText className="h-5 w-5" />,
    },
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

  if (isMobile) {
    return null;
  }

  return (
    <aside 
      className={`sidebar fixed top-0 left-0 z-10 h-screen bg-sidebar transition-all duration-200 ${expanded ? "w-60" : "w-16"}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-sidebar border-b border-sidebar-accent/10">
        <LucideZap className="h-8 w-8 text-primary" />
        {expanded && <span className="ml-2 text-lg font-semibold transition-opacity duration-150 text-white">{APP_NAME}</span>}
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <div 
                  className={`flex items-center rounded-md transition-colors py-2.5 ${location === '/settings' 
                    ? 'bg-sidebar-accent text-white' 
                    : 'text-slate-300 hover:bg-sidebar-accent/50 hover:text-white'}`}
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
              </Link>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right" className="mr-2">
                <p>Configuración</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </nav>

      {/* No Create Button */}
    </aside>
  );
}
