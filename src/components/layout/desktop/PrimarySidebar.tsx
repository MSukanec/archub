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
      level: 'organization' as const
    },
    {
      id: 'organization',
      label: 'Organización', 
      icon: Building2,
      href: '/organization',
      level: 'organization' as const
    },
    {
      id: 'project',
      label: 'Proyecto',
      icon: FolderOpen,
      href: '/general',
      level: 'project' as const
    },
    {
      id: 'construction',
      label: 'Construcción',
      icon: HardHat,
      href: '/construction',
      level: 'construction' as const
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: Library,
      href: '/library/tasks',
      level: 'library' as const
    },
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      href: '/admin',
      level: 'admin' as const
    }] : [])
  ];

  const handleSectionClick = (section: typeof primarySections[0]) => {
    setSidebarLevel(section.level);
    navigate(section.href);
  };

  const isActive = (level: string) => {
    return sidebarLevel === level;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-12 h-[calc(100vh-3rem)] z-50 bg-[var(--layout-bg)] border-r border-[var(--menues-border)]",
        "w-16 flex flex-col items-center py-4"
      )}
    >
      <div className="flex flex-col gap-2 w-full px-2">
        {primarySections.map((section) => (
          <SidebarButton
            key={section.id}
            icon={<section.icon className="w-5 h-5" />}
            label={section.label}
            isActive={isActive(section.level)}
            isExpanded={false}
            onClick={() => handleSectionClick(section)}
            variant="main"
          />
        ))}
      </div>
    </aside>
  );
}