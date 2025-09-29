import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import ButtonSidebar from "./ButtonSidebar";
import { useSidebarStore } from "@/stores/sidebarStore";
import { 
  PanelLeftClose, 
  PanelLeftOpen,
  Home,
  Folder,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  Palette,
  FileText,
  Activity,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  isActive?: boolean;
  type?: 'button' | 'section' | 'divider';
  children?: SidebarItem[];
}

export function MainSidebar() {
  const { isDocked, setDocked } = useSidebarStore();
  const [isHovered, setHovered] = useState(false);
  const [location] = useLocation();
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null);

  const isExpanded = isDocked || isHovered;

  const toggleAccordion = (label: string) => {
    setExpandedAccordion(expandedAccordion === label ? null : label);
  };

  const handleDockToggle = () => {
    setDocked(!isDocked);
  };

  // Sidebar items - simplificado para testing
  const sidebarItems: SidebarItem[] = [
    { icon: Home, label: "Dashboard", href: "/organization/dashboard", type: 'button' },
    { icon: Folder, label: "Proyectos", href: "/project/dashboard", type: 'button' },
    { icon: Users, label: "Contactos", href: "/resources/contacts", type: 'button' },
    { icon: BarChart3, label: "Finanzas", href: "/finances/movements", type: 'button' },
    { icon: TrendingUp, label: "Reportes", href: "/reports", type: 'button' },
    { icon: FileText, label: "Documentos", href: "/resources/documentation", type: 'button' },
    { icon: Activity, label: "Actividad", href: "/organization/activity", type: 'button' },
    { icon: Settings, label: "Configuración", href: "/settings", type: 'button' },
  ];

  return (
    <div className="flex flex-row">
      {/* SIDEBAR PRINCIPAL */}
      <div 
        className="bg-[var(--main-sidebar-bg)] text-[var(--main-sidebar-fg)] border-r border-[var(--main-sidebar-border)] transition-all duration-150 z-10 flex flex-col h-full overflow-visible"
        style={{
          width: isDocked 
            ? '240px'
            : (isHovered ? '240px' : '48px')
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* DIV SUPERIOR - Navigation Items */}
        <div className="flex-1 overflow-y-auto pt-3 px-0 min-h-0">
          <div className="flex flex-col gap-[2px]">
            {sidebarItems.map((item, index) => {
              const isActive = location === item.href;
              
              return (
                <ButtonSidebar
                  key={`${item.label}-${index}`}
                  icon={<item.icon className="w-[18px] h-[18px]" />}
                  label={item.label}
                  isActive={isActive}
                  isExpanded={isExpanded}
                  href={item.href}
                  variant="secondary"
                />
              );
            })}
          </div>
        </div>

        {/* DIV INFERIOR - Solo botón de anclar pegado al fondo */}
        <div className="mt-auto border-t border-[var(--main-sidebar-border)] bg-[var(--main-sidebar-bg)] p-2">
          <ButtonSidebar
            icon={isDocked ? <PanelLeftClose className="w-[18px] h-[18px]" /> : <PanelLeftOpen className="w-[18px] h-[18px]" />}
            label={isDocked ? "Desanclar sidebar" : "Anclar sidebar"}
            isActive={false}
            isExpanded={isExpanded}
            onClick={handleDockToggle}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
}