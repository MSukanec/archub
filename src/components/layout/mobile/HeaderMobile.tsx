import React from "react";
import { Building, Brush, HardHat, DollarSign, BookOpen, User, Crown, Menu, UserCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MobileMenu } from "./MobileMenu";
import { useMobileMenuStore } from "./useMobileMenuStore";

interface HeaderMobileProps {
  icon?: React.ComponentType<any> | React.ReactNode;
  title?: string;
}

export function HeaderMobile({
  icon,
  title,
}: HeaderMobileProps = {}) {
  const { isOpen: isMobileMenuOpen, openMenu, closeMenu } = useMobileMenuStore();

  const [location] = useLocation();

  const getCurrentSectionLabel = () => {
    if (location === "/") return "Gestión de Organizaciones";
    if (location.startsWith("/design")) return "Diseño";
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
      <div className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[var(--menues-border)] bg-[var(--layout-bg)] sticky top-0 z-50">
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

        {/* Right: ONLY Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={openMenu}
          className="p-2"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMenu} />
      )}
    </>
  );
}