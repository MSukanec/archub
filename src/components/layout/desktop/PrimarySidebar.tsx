import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home,
  Building2, 
  FolderOpen,
  HardHat,
  Library,
  Shield
} from "lucide-react";
import { useNavigationStore } from "@/stores/navigationStore";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import SidebarButton from "./SidebarButton";

export function PrimarySidebar() {
  const [location, navigate] = useLocation();
  const { sidebarLevel, setSidebarLevel } = useNavigationStore();
  const isAdmin = useIsAdmin();

  const primarySections = [
    {
      id: 'main',
      label: 'Dashboard',
      icon: Home,
      href: '/organization',
      level: 'organization' as const,
      navigateTo: true
    },
    {
      id: 'organization',
      label: 'Organización', 
      icon: Building2,
      level: 'organization' as const,
      navigateTo: false
    },
    {
      id: 'project',
      label: 'Proyecto',
      icon: FolderOpen,
      level: 'project' as const,
      navigateTo: false
    },
    {
      id: 'construction',
      label: 'Construcción',
      icon: HardHat,
      level: 'construction' as const,
      navigateTo: false
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: Library,
      level: 'library' as const,
      navigateTo: false
    },
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      level: 'admin' as const,
      navigateTo: false
    }] : [])
  ];

  const handleSectionClick = (section: typeof primarySections[0]) => {
    setSidebarLevel(section.level);
    // Solo navegar si es el botón de Dashboard
    if (section.navigateTo && section.href) {
      navigate(section.href);
    }
  };

  const isActive = (level: string) => {
    return sidebarLevel === level;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-12 h-[calc(100vh-3rem)] z-50 bg-[var(--layout-bg)] border-r border-[var(--menues-border)] transition-all duration-300",
        "w-[40px] flex flex-col"
      )}
      style={{
        overflow: 'hidden'
      }}
    >
      {/* Navigation Items */}
      <div className="flex-1">
        <div className="flex flex-col h-full">
        {primarySections.map((section) => (
          <SidebarButton
            key={section.id}
            icon={<section.icon className="w-[18px] h-[18px]" />}
            label={section.label}
            isActive={isActive(section.level)}
            isExpanded={false}
            onClick={() => handleSectionClick(section)}
            variant="main"
          />
        ))}
        </div>
      </div>
    </aside>
  );
}