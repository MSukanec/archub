import { ArrowLeft, BarChart3, Calculator, Package, FileText, Users } from "lucide-react";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { SidebarButton } from "./SidebarButton";
import { ProfileAvatarButton } from "./ProfileAvatarButton";
import { navigate } from "wouter/use-location";

export function ConstructionSidebar() {
  const { isExpanded, toggleSidebar, setSidebarContext } = useSidebarStore();

  const handleBack = () => {
    setSidebarContext('master');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-[--menues-bg] border-r border-[--menues-border] z-50 transition-all duration-300 ${isExpanded ? 'w-[200px]' : 'w-[48px]'}`}>
      {/* Header */}
      <div className="p-2">
        <SidebarButton 
          icon={ArrowLeft}
          onClick={handleBack}
          isExpanded={isExpanded}
          title="Volver"
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 space-y-1">
        <SidebarButton 
          icon={BarChart3}
          onClick={() => handleNavigate('/construction/dashboard')}
          isExpanded={isExpanded}
          title="Resumen de Obra"
        />
        <SidebarButton 
          icon={Calculator}
          onClick={() => handleNavigate('/construction/budgets')}
          isExpanded={isExpanded}
          title="Presupuestos"
        />
        <SidebarButton 
          icon={Package}
          onClick={() => handleNavigate('/construction/materials')}
          isExpanded={isExpanded}
          title="Materiales"
        />
        <SidebarButton 
          icon={FileText}
          onClick={() => handleNavigate('/construction/logs')}
          isExpanded={isExpanded}
          title="Bitácora"
        />
        <SidebarButton 
          icon={Users}
          onClick={() => handleNavigate('/construction/personnel')}
          isExpanded={isExpanded}
          title="Personal"
        />
      </div>

      {/* Footer */}
      <div className="p-2">
        <ProfileAvatarButton />
      </div>
    </div>
  );
}