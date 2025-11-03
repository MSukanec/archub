import React from "react";
import { Home } from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { ProjectSelectorButton } from "./ProjectSelectorButton";
import { OrganizationSelectorButton } from "./OrganizationSelectorButton";

interface MainHeaderProps {
  icon?: React.ComponentType<any>;
  title?: string;
}

export function MainHeader({ icon, title }: MainHeaderProps) {
  const { sidebarLevel } = useNavigationStore();
  
  // Use the icon and title from props, with fallbacks
  const PageIcon = icon || Home;
  const currentPageName = title || 'Página';
  
  // Determinar qué selector mostrar según el contexto
  let selectorComponent: React.ReactNode = null;
  if (sidebarLevel === 'project') {
    selectorComponent = <ProjectSelectorButton />;
  } else if (sidebarLevel === 'organization') {
    selectorComponent = <OrganizationSelectorButton />;
  }

  return (
    <div 
      className="w-full h-12 border-b flex items-center justify-between z-50 px-16"
      style={{ 
        backgroundColor: "var(--main-sidebar-bg)",
        borderBottomColor: "var(--main-sidebar-border)"
      }}
    >
      <div className="w-full flex items-center justify-between">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3">
          <PageIcon className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-semibold text-white">
            {currentPageName}
          </h1>
        </div>

        {/* Right side: Selector */}
        <div className="flex items-center">
          {selectorComponent}
        </div>
      </div>
    </div>
  );
}