import { Building, FolderOpen, Users, Activity, Crown, Palette, Hammer, DollarSign, ShoppingCart, Home, User } from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import SidebarButton from "./SidebarButton";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export function MasterSidebar() {
  const { isExpanded, toggleSidebar, setSidebarContext } = useSidebarStore();
  const [, navigate] = useLocation();

  const handleNavigateToSidebar = (context: any) => {
    setSidebarContext(context);
    if (context === 'organization-dashboard') {
      navigate('/organization/dashboard');
    } else if (context === 'project-dashboard') {
      navigate('/project/dashboard');
    }
  };

  return (
    <div className={`fixed top-0 left-0 h-full bg-[--menues-bg] border-r border-[--menues-border] z-50 transition-all duration-300 ${isExpanded ? 'w-[200px]' : 'w-[48px]'}`}>
      {/* Header */}
      <div className="p-2">
        <SidebarButton 
          icon={<Building className="w-4 h-4" />}
          label="Archub"
          isActive={false}
          isExpanded={isExpanded}
          onClick={toggleSidebar}
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 px-2 space-y-1">
        {/* Resúmenes */}
        <SidebarButton 
          icon={<Home className="w-4 h-4" />}
          label="Resumen de Organización"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('organization-dashboard')}
        />
        <SidebarButton 
          icon={<FolderOpen className="w-4 h-4" />}
          label="Resumen de Proyecto"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('project-dashboard')}
        />
        
        <div className="my-2">
          <Separator className="bg-[--menues-border]" />
        </div>

        {/* Sidebars Secundarios */}
        <SidebarButton 
          icon={<Building className="w-4 h-4" />}
          label="Organización"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('organization')}
        />
        <SidebarButton 
          icon={<FolderOpen className="w-4 h-4" />}
          label="Proyecto"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('project')}
        />
        <SidebarButton 
          icon={<Palette className="w-4 h-4" />}
          label="Diseño"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('design')}
        />
        <SidebarButton 
          icon={<Hammer className="w-4 h-4" />}
          label="Obra"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('construction')}
        />
        <SidebarButton 
          icon={<DollarSign className="w-4 h-4" />}
          label="Finanzas"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('finance')}
        />
        <SidebarButton 
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Comercialización"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('marketing')}
        />
      </div>

      {/* Footer */}
      <div className="p-2 space-y-1">
        <SidebarButton 
          icon={<Crown className="w-4 h-4" />}
          label="Administración"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => handleNavigateToSidebar('admin')}
        />
        <SidebarButton 
          icon={<User className="w-4 h-4" />}
          label="Perfil"
          isActive={false}
          isExpanded={isExpanded}
          onClick={() => navigate('/perfil')}
        />
      </div>
    </div>
  );
}