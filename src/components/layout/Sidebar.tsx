import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

import { 
  Settings, 
  UserCircle,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Mail,
  Activity
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setHovered } = useSidebarStore();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  
  const isExpanded = isDocked || isHovered;

  // Different navigation items based on context
  const sidebarContexts = {
    organization: [
      { icon: Home, label: 'Resumen', href: '/organization/dashboard' },
      { icon: FolderOpen, label: 'Proyectos', href: '/proyectos' },
      { icon: Mail, label: 'Contactos', href: '/organization/contactos' },
      { icon: Activity, label: 'Actividad', href: '/organization/activity' },
      { icon: Users, label: 'Miembros', href: '/organization/members' },
      { icon: Settings, label: 'Preferencias', href: '/preferencias' },
    ],
    project: [
      { icon: Home, label: 'Dashboard', href: '/project/dashboard' },
      { icon: FolderOpen, label: 'Proyecto', href: '#', onClick: () => { setSidebarContext('design'); navigate('/design/dashboard'); } },
      { icon: Building, label: 'Obra', href: '#', onClick: () => { setSidebarContext('construction'); navigate('/construction/dashboard'); } },
      { icon: DollarSign, label: 'Finanzas', href: '#', onClick: () => { setSidebarContext('finance'); navigate('/finance/dashboard'); } },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => { setSidebarContext('commercialization'); navigate('/commercialization/dashboard'); } },
    ],
    design: [
      { icon: Home, label: 'Dashboard', href: '/design/dashboard' },
      { icon: FileText, label: 'Moodboard', href: '/design/moodboard' },
      { icon: FolderOpen, label: 'Documentación técnica', href: '/design/documentacion' },
    ],
    construction: [
      { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
      { icon: FileText, label: 'Bitácora', href: '/bitacora' },
    ],
    finance: [
      { icon: Home, label: 'Dashboard', href: '/finance/dashboard' },
      { icon: DollarSign, label: 'Movimientos', href: '/movimientos' },
      { icon: FileText, label: 'Gráficos avanzados', href: '/finance/graficos' },
      { icon: Users, label: 'Plan de pagos', href: '/finance/pagos' },
    ],
    commercialization: [
      { icon: Home, label: 'Dashboard', href: '/commercialization/dashboard' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
    ]
  };

  const navigationItems = sidebarContexts[currentSidebarContext] || sidebarContexts.organization;



  return (
    <aside 
      className={cn(
        "fixed top-9 left-0 h-[calc(100vh-36px)] border-r bg-[var(--menues-bg)] border-[var(--menues-border)] transition-all duration-300 z-40 flex flex-col",
        isExpanded ? "w-[240px]" : "w-[40px]"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navigation Items */}
      <div className="flex-1 p-1">
        <div className="flex flex-col gap-[2px]">
          {navigationItems.map((item, index) => (
            <SidebarButton
              key={`${item.label}-${index}`}
              icon={<item.icon className="w-[18px] h-[18px]" />}
              label={item.label}
              isActive={location === item.href}
              isExpanded={isExpanded}
              onClick={item.onClick || (() => navigate(item.href))}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section - Fixed Buttons */}
      <div className="border-t border-[var(--menues-border)] p-1">
        <div className="flex flex-col gap-[2px]">
          {/* Settings */}
          <SidebarButton
            icon={<Settings className="w-[18px] h-[18px]" />}
            label="Configuración"
            isActive={location === '/configuracion'}
            isExpanded={isExpanded}
            onClick={() => navigate('/configuracion')}
          />



          {/* Profile */}
          <SidebarButton
            icon={<UserCircle className="w-[18px] h-[18px]" />}
            label="Mi Perfil"
            isActive={location === '/perfil'}
            isExpanded={isExpanded}
            onClick={() => navigate('/perfil')}
            avatarUrl={userData?.user?.avatar_url}
          />
        </div>
      </div>
    </aside>
  );
}