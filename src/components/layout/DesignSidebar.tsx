import { ArrowLeft, Calendar } from "lucide-react";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { SidebarButton } from "./SidebarButton";
import { ProfileAvatarButton } from "./ProfileAvatarButton";
import { navigate } from "wouter/use-location";

export function DesignSidebar() {
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
          icon={Calendar}
          onClick={() => handleNavigate('/design/timeline')}
          isExpanded={isExpanded}
          title="Cronograma"
        />
      </div>

      {/* Footer */}
      <div className="p-2">
        <ProfileAvatarButton />
      </div>
    </div>
  );
}