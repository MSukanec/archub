import React from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useThemeStore } from "@/stores/themeStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import {
  UserCircle,
  Sun,
  Moon,
  PanelLeftOpen,
  PanelLeftClose,
  Home,
  DollarSign,
  Images,
  Calendar,
  Users,
  FolderOpen,
} from "lucide-react";
import SidebarButton from "./SidebarButton";

export function OrganizationSidebar() {
  const [location] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDark, toggleTheme } = useThemeStore();
  const { isDocked, setDocked } = useSidebarStore();

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleDockToggle = () => {
    setDocked(!isDocked);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full w-10 z-40 flex flex-col"
      style={{ backgroundColor: "var(--accent)" }}
    >
      {/* Organization Avatar at top */}
      <div className="p-1">
        <div className="w-8 h-8 flex items-center justify-center">
          {userData?.organization?.logo_url ? (
            <img 
              src={userData.organization.logo_url} 
              alt={userData.organization.name}
              className="w-[28px] h-[28px] rounded-full border-2"
              style={{ borderColor: 'rgb(235, 235, 235)' }}
            />
          ) : (
            <div 
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-xs font-medium border-2"
              style={{ 
                backgroundColor: 'var(--accent)',
                color: 'rgb(235, 235, 235)',
                borderColor: 'rgb(235, 235, 235)'
              }}
            >
              {userData?.organization?.name?.charAt(0)?.toUpperCase() || 'O'}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-1 pt-3">
          {/* Dashboard Button */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<Home className="w-[18px] h-[18px]" style={{ color: 'rgb(235, 235, 235)' }} />}
              label="Dashboard"
              href="/dashboard"
              isActive={location === '/dashboard'}
              isExpanded={false} // Siempre false para este sidebar
              variant="main"
              iconColor="rgb(235, 235, 235)"
            />
          </div>
          
          {/* Movements Button */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<DollarSign className="w-[18px] h-[18px]" style={{ color: 'rgb(235, 235, 235)' }} />}
              label="Movimientos"
              href="/organization/finances/movements"
              isActive={location === '/organization/finances/movements'}
              isExpanded={false}
              variant="main"
              iconColor="rgb(235, 235, 235)"
            />
          </div>
          
          {/* Media Button */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<Images className="w-[18px] h-[18px]" style={{ color: 'rgb(235, 235, 235)' }} />}
              label="Media"
              href="/general/media"
              isActive={location === '/general/media'}
              isExpanded={false}
              variant="main"
              iconColor="rgb(235, 235, 235)"
            />
          </div>
          
          {/* Calendar Button */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<Calendar className="w-[18px] h-[18px]" style={{ color: 'rgb(235, 235, 235)' }} />}
              label="Calendario"
              href="/general/calendar"
              isActive={location === '/general/calendar'}
              isExpanded={false}
              variant="main"
              iconColor="rgb(235, 235, 235)"
            />
          </div>
          
          {/* Contacts Button */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<Users className="w-[18px] h-[18px]" style={{ color: 'rgb(235, 235, 235)' }} />}
              label="Contactos"
              href="/organization/contacts"
              isActive={location === '/organization/contacts'}
              isExpanded={false}
              variant="main"
              iconColor="rgb(235, 235, 235)"
            />
          </div>
          
          {/* Projects Button */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<FolderOpen className="w-[18px] h-[18px]" style={{ color: 'rgb(235, 235, 235)' }} />}
              label="Proyectos"
              href="/construction/dashboard"
              isActive={location.startsWith('/design') || location.startsWith('/construction') || location.startsWith('/finances')}
              isExpanded={false}
              variant="main"
              iconColor="rgb(235, 235, 235)"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Divisor */}
          <div className="h-px bg-white/20 mb-2"></div>
          
          {/* Settings buttons */}
          <div className="flex flex-col gap-[2px] mb-[2px]">
            {/* Dock/Undock button */}
            <SidebarButton
              icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
              label={isDocked ? "Desanclar Sidebar" : "Anclar Sidebar"}
              isActive={false}
              isExpanded={false}
              onClick={handleDockToggle}
              variant="main"
              iconColor="white"
            />
            
            {/* Theme toggle button */}
            <SidebarButton
              icon={isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
              label={isDark ? "Modo Claro" : "Modo Oscuro"}
              isActive={false}
              isExpanded={false}
              onClick={handleThemeToggle}
              variant="main"
              iconColor="white"
            />
          </div>
          
          {/* Profile */}
          <div className="mb-[2px]">
            <SidebarButton
              icon={<UserCircle className="w-[18px] h-[18px]" />}
              label="Mi Perfil"
              href="/profile"
              isActive={location.startsWith('/profile')}
              isExpanded={false}
              avatarUrl={userData?.user?.avatar_url}
              userFullName={userData?.user?.full_name}
              variant="main"
              iconColor="white"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}