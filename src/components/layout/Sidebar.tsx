import { useState } from "react";
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
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import SidebarButton from "./SidebarButton";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setHovered } = useSidebarStore();
  const { currentSidebarContext, setSidebarContext } = useNavigationStore();
  
  // Estado para acordeones
  const [expandedAccordions, setExpandedAccordions] = useState<{ [key: string]: boolean }>({
    obra: false,
    finanzas: false
  });
  
  const isExpanded = isDocked || isHovered;
  
  const toggleAccordion = (key: string) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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
      { icon: Home, label: 'Resumen del Proyecto', href: '/project/dashboard' },
      { icon: FolderOpen, label: 'Diseño', href: '#', onClick: () => { setSidebarContext('design'); navigate('/design/dashboard'); } },
      { 
        icon: Building, 
        label: 'Obra', 
        href: '#', 
        isAccordion: true,
        expanded: expandedAccordions.obra,
        onToggle: () => toggleAccordion('obra'),
        children: [
          { icon: Home, label: 'Resumen de Obra', href: '/construction/dashboard' },
          { icon: FileText, label: 'Bitácora', href: '/bitacora' }
        ]
      },
      { 
        icon: DollarSign, 
        label: 'Finanzas', 
        href: '#', 
        isAccordion: true,
        expanded: expandedAccordions.finanzas,
        onToggle: () => toggleAccordion('finanzas'),
        children: [
          { icon: Home, label: 'Resumen de Finanzas', href: '/finance/dashboard' },
          { icon: DollarSign, label: 'Movimientos', href: '/movimientos' }
        ]
      },
      { icon: Users, label: 'Comercialización', href: '#', onClick: () => { setSidebarContext('commercialization'); navigate('/commercialization/dashboard'); } },
      { icon: ArrowLeft, label: 'Volver a Organización', href: '#', onClick: () => { setSidebarContext('organization'); navigate('/organization/dashboard'); } },
    ],
    design: [
      { icon: Home, label: 'Dashboard', href: '/design/dashboard' },
      { icon: FileText, label: 'Moodboard', href: '/design/moodboard' },
      { icon: FolderOpen, label: 'Documentación técnica', href: '/design/documentacion' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    construction: [
      { icon: Home, label: 'Resumen', href: '/construction/dashboard' },
      { icon: FileText, label: 'Bitácora', href: '/bitacora' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    finance: [
      { icon: Home, label: 'Resumen de Finanzas', href: '/finance/dashboard' },
      { icon: DollarSign, label: 'Movimientos', href: '/movimientos' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
    ],
    commercialization: [
      { icon: Home, label: 'Dashboard', href: '/commercialization/dashboard' },
      { icon: Building, label: 'Listado de unidades', href: '/commercialization/unidades' },
      { icon: Users, label: 'Clientes interesados', href: '/commercialization/clientes' },
      { icon: FileText, label: 'Estadísticas de venta', href: '/commercialization/estadisticas' },
      { icon: ArrowLeft, label: 'Volver al Proyecto', href: '#', onClick: () => { setSidebarContext('project'); navigate('/project/dashboard'); } },
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
          {navigationItems.map((item: any, index) => (
            <div key={`${item.label}-${index}`}>
              {/* Main Button */}
              <SidebarButton
                icon={<item.icon className="w-[18px] h-[18px]" />}
                label={item.label}
                isActive={location === item.href}
                isExpanded={isExpanded}
                onClick={item.isAccordion ? item.onToggle : (item.onClick || (() => navigate(item.href)))}
                rightIcon={item.isAccordion && isExpanded ? (
                  item.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                ) : undefined}
              />
              
              {/* Accordion Children */}
              {item.isAccordion && item.expanded && isExpanded && (
                <div className="ml-6 mt-1 flex flex-col gap-[2px]">
                  {item.children?.map((child: any, childIndex: number) => (
                    <SidebarButton
                      key={`${child.label}-${childIndex}`}
                      icon={<child.icon className="w-[18px] h-[18px]" />}
                      label={child.label}
                      isActive={location === child.href}
                      isExpanded={isExpanded}
                      onClick={() => navigate(child.href)}
                      isChild={true}
                    />
                  ))}
                </div>
              )}
            </div>
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