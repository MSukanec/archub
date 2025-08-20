import React from "react";
import { Building, Brush, HardHat, DollarSign, BookOpen, User, Crown, Menu, UserCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MobileMenu } from "./MobileMenu";
import { useMobileMenuStore } from "./useMobileMenuStore";

interface Tab {
  id: string;
  label: string;
  isActive: boolean;
}

interface HeaderMobileProps {
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
  tabs?: Tab[];
  onTabChange?: (tabId: string) => void;
}

export function HeaderMobile({
  icon,
  title,
  tabs,
  onTabChange,
}: HeaderMobileProps = {}) {
  const { isOpen: isMobileMenuOpen, openMenu, closeMenu } = useMobileMenuStore();

  const [location] = useLocation();

  const getCurrentSectionLabel = () => {
    if (location === "/") return "Gestión de Organizaciones";
    if (location.startsWith("/design")) return "Diseño";
    if (location.startsWith("/construction/subcontracts")) return "Subcontratos";
    if (location.startsWith("/construction")) return "Construcción";
    if (location.startsWith("/finances")) return "Finanzas";
    if (location.startsWith("/recursos")) return "Recursos";
    if (location.startsWith("/profile")) return "Perfil";
    if (location.startsWith("/settings")) return "Configuración";
    if (location.startsWith("/admin")) return "Administración";
    if (location.startsWith("/organization")) return "Organización";
    return "Archub";
  };

  const getBreadcrumbIcon = () => {
    if (location === "/" || location.startsWith("/organization")) return <Building className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/design")) return <Brush className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/construction")) return <HardHat className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/finances")) return <DollarSign className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/recursos")) return <BookOpen className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/profile")) return <User className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/admin")) return <Crown className="w-5 h-5 text-[var(--accent)]" />;
    if (location.startsWith("/settings")) return <Settings className="w-5 h-5 text-[var(--accent)]" />;
    return <Building className="w-5 h-5 text-[var(--accent)]" />;
  };

  const isProjectBasedSection = location.startsWith("/design") || location.startsWith("/construction") || location.startsWith("/finances");

  return (
    <>
      <div className="md:hidden sticky top-0 z-50 bg-[var(--layout-bg)] border-b border-[var(--menues-border)]">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Title */}
          <div className="flex-1 flex items-center justify-start px-2">
            <div className="flex items-center space-x-3">
              {/* Siempre mostrar icono - usar el prop o el automático */}
              <div className="flex-shrink-0">
                {icon ? (
                  <div className="text-[var(--accent)]">
                    {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType)}
                  </div>
                ) : (
                  getBreadcrumbIcon()
                )}
              </div>
              <h1 className="text-lg font-normal text-[var(--layout-text)] truncate">
                {title || getCurrentSectionLabel()}
              </h1>
            </div>
          </div>

          {/* Right: ONLY Menu Icon */}
          <Menu 
            className="w-10 h-10 text-[var(--layout-text)] cursor-pointer hover:text-[var(--accent)] transition-colors" 
            onClick={openMenu}
          />
        </div>

        {/* Tabs Row */}
        {tabs && tabs.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200
                    ${tab.isActive 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'bg-[var(--card-bg)] text-[var(--menues-fg)] border border-[var(--menues-border)] hover:bg-[var(--card-hover-bg)]'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMenu} />
      )}
    </>
  );
}