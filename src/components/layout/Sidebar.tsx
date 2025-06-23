import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
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
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useNavigationStore } from "@/stores/navigationStore";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location, navigate] = useLocation();
  const { data: userData } = useCurrentUser();
  const { isDocked, isHovered, setDocked, setHovered } = useSidebarStore();
  const { currentSidebarContext } = useNavigationStore();

  const isExpanded = isDocked || isHovered;

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
  };

  const navigationItems =
    sidebarContexts[currentSidebarContext] || sidebarContexts.organization;

  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      const newTheme =
        userData?.preferences?.theme === "dark" ? "light" : "dark";

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
      className={`fixed top-9 left-0 h-[calc(100vh-36px)] border-r bg-[var(--menues-bg)] border-[var(--menues-border)] transition-all z-40 flex flex-col ${
        isExpanded ? "w-[240px]" : "w-[40px]"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Navegación */}
      <div className="flex-1 p-1 flex flex-col gap-1">
        {navigationItems.map((item) => (
          <SidebarButton
            key={item.href}
            icon={item.icon}
            label={item.label}
            isActive={location === item.href}
            isExpanded={isExpanded}
            onClick={() => navigate(item.href)}
          />
        ))}
      </div>

      {/* Parte inferior */}
      <div className="border-t border-[var(--menues-border)] p-1 flex flex-col gap-1">
        {/* Configuración */}
        <SidebarButton
          icon={Settings}
          label="Configuración"
          isActive={location === "/configuracion"}
          isExpanded={isExpanded}
          onClick={() => navigate("/configuracion")}
        />

        {/* Cambiar tema */}
        <SidebarButton
          icon={userData?.preferences?.theme === "dark" ? Sun : Moon}
          label="Cambiar tema"
          isExpanded={isExpanded}
          onClick={() => toggleThemeMutation.mutate()}
        />

        {/* Perfil */}
        <SidebarButton
          icon={UserCircle}
          label="Mi Perfil"
          isActive={location === "/perfil"}
          isExpanded={isExpanded}
          onClick={() => navigate("/perfil")}
          avatarUrl={userData?.user?.avatar_url}
        />
      </div>
    </aside>
  );
}
