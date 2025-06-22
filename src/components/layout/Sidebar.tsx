import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Settings,
  Moon,
  Sun,
  UserCircle,
  Home,
  Users,
  Building,
  FileText,
  DollarSign,
  FolderOpen,
  Palette,
  HardHat,
  Calculator,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setDocked, setHovered } = useSidebarStore();
  const { currentSidebarContext } = useNavigationStore();

  const isExpanded = isDocked || isHovered;

  // Different navigation items based on context
  const sidebarContexts = {
    organization: [
      { icon: Home, label: "Dashboard", href: "/dashboard" },
      { icon: Users, label: "Contactos", href: "/contactos" },
      {
        icon: Building,
        label: "Gestión de Organizaciones",
        href: "/organizaciones",
      },
    ],
    project: [
      { icon: FolderOpen, label: "Gestión de Proyectos", href: "/proyectos" },
      { icon: FileText, label: "Bitácora de Obra", href: "/bitacora" },
      { icon: DollarSign, label: "Movimientos", href: "/movimientos" },
    ],
    design: [
      { icon: Palette, label: "Planos", href: "/planos" },
      { icon: FileText, label: "Especificaciones", href: "/especificaciones" },
      { icon: Building, label: "Modelos 3D", href: "/modelos" },
    ],
    construction: [
      { icon: HardHat, label: "Avances de Obra", href: "/avances" },
      { icon: FileText, label: "Reportes Diarios", href: "/reportes" },
      { icon: Users, label: "Equipos de Trabajo", href: "/equipos" },
    ],
    finance: [
      { icon: DollarSign, label: "Presupuestos", href: "/presupuestos" },
      { icon: Calculator, label: "Costos", href: "/costos" },
      { icon: FileText, label: "Facturas", href: "/facturas" },
    ],
  };

  const navigationItems =
    sidebarContexts[currentSidebarContext] || sidebarContexts.organization;

  // Theme toggle mutation
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !userData?.preferences?.id) {
        throw new Error("Missing required data");
      }

      const newTheme = userData.preferences.theme === "dark" ? "light" : "dark";

      const { error } = await supabase
        .from("user_preferences")
        .update({ theme: newTheme })
        .eq("id", userData.preferences.id);

      if (error) throw error;

      return newTheme;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[var(--menues-bg)] border-r border-[var(--menues-border)] flex flex-col z-40 text-[var(--menues-fg)]",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-[240px]" : "w-[40px]",
      )}
      style={{
        backgroundColor: "var(--menues-bg)",
        borderColor: "var(--menues-border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo - SIEMPRE cuadrado */}
      <div className="flex items-center justify-center w-full h-[40px] border-b border-[var(--menues-border)]">
        {/* Icono o logo simple */}
        <span className="text-[var(--menues-fg)] text-sm font-bold">🏗️</span>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-2 px-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <button
            key={item.href}
            className={cn(
              "flex items-center w-full h-8 rounded-md transition-all duration-300 ease-in-out mb-1",
              location === item.href
                ? "bg-[var(--menues-active-bg)] text-[var(--menues-active-fg)] font-semibold"
                : "hover:bg-[var(--menues-hover-bg)] hover:text-[var(--menues-hover-fg)] transition-colors",
            )}
            onClick={() => navigate(item.href)}
            title={!isExpanded ? item.label : undefined}
          >
            <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
              <item.icon className="h-5 w-5 text-[var(--menues-fg)]" />
            </div>
            {isExpanded && (
              <span className="ml-2 text-sm whitespace-nowrap overflow-hidden text-[var(--menues-fg)]">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sección inferior: sin cambios */}
      <div className="py-2 px-1 border-t border-[var(--menues-border)]">
        {/* Configuración, Tema, Perfil... */}
      </div>
    </aside>
  );
}
