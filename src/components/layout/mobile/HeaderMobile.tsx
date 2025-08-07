import React from "react";
import { Building, Building2, Folder, Menu } from "lucide-react";
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
    if (location.startsWith("/teams")) return "Equipos";
    if (location.startsWith("/profile")) return "Perfil";
    if (location.startsWith("/settings")) return "Configuración";
    if (location.startsWith("/admin")) return "Administración";
    if (location.startsWith("/organization")) return "Organización";
    return "Archub";
  };

  const getBreadcrumbIcon = () => {
  };

  const isProjectBasedSection = location.startsWith("/design") || location.startsWith("/construction") || location.startsWith("/finances");

  return (
    <>
        {/* Left: Title */}
            {icon && (
                {React.isValidElement(icon) ? icon : React.createElement(icon as React.ComponentType)}
              </div>
            )}
              {title || getCurrentSectionLabel()}
            </h1>
          </div>
        </div>

        {/* Right: ONLY Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={openMenu}
        >
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <MobileMenu isOpen={isMobileMenuOpen} onClose={closeMenu} />
      )}
    </>
  );
}