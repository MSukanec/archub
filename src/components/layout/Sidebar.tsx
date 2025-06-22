import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Home,
  Users,
  Building,
  Sun,
  Moon,
  UserCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

// Ítems del sidebar (por ahora solo organización)
const organizationItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Contactos", href: "/contactos", icon: Users },
  {
    label: "Gestión de Organizaciones",
    href: "/organizaciones",
    icon: Building,
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const { data: userData } = useCurrentUser();

  // Mutaciones
  const toggleThemeMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.preferences?.id) return;
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
        "fixed top-10 left-0 z-40 h-[calc(100vh-40px)] border-r transition-all duration-300",
        "bg-[var(--sidebar-bg)] border-[var(--sidebar-border)]",
        isHovered ? "w-52" : "w-10",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="flex flex-col items-start gap-1 p-2">
        {organizationItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href}>
              <button
                className={cn(
                  "group relative flex items-center h-8 w-8 rounded-md transition-all duration-200",
                  "hover:bg-[var(--sidebar-hover-bg)]",
                  isActive &&
                    "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]",
                )}
              >
                <Icon className="h-5 w-5 mx-auto text-[var(--sidebar-text)] group-hover:text-[var(--sidebar-active-text)]" />
                <span
                  className={cn(
                    "absolute left-full ml-2 text-sm text-muted",
                    "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200",
                  )}
                >
                  {label}
                </span>
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Separador inferior */}
      <div className="mt-auto border-t border-[var(--sidebar-border)] p-2 flex flex-col gap-1">
        {/* Cambiar tema */}
        <button
          onClick={() => toggleThemeMutation.mutate()}
          className="group relative flex items-center h-8 w-8 rounded-md transition-all duration-200 hover:bg-[var(--sidebar-hover-bg)]"
        >
          {userData?.preferences?.theme === "dark" ? (
            <Sun className="h-5 w-5 mx-auto text-[var(--sidebar-text)]" />
          ) : (
            <Moon className="h-5 w-5 mx-auto text-[var(--sidebar-text)]" />
          )}
          <span className="absolute left-full ml-2 text-sm opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            Cambiar tema
          </span>
        </button>

        {/* Perfil */}
        <Link href="/perfil">
          <button className="group relative flex items-center h-8 w-8 rounded-md transition-all duration-200 hover:bg-[var(--sidebar-hover-bg)]">
            {userData?.user?.avatar_url ? (
              <img
                src={userData.user.avatar_url}
                className="h-5 w-5 rounded-full mx-auto"
              />
            ) : (
              <UserCircle className="h-5 w-5 mx-auto text-[var(--sidebar-text)]" />
            )}
            <span className="absolute left-full ml-2 text-sm opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              Mi perfil
            </span>
          </button>
        </Link>

        {/* Configuración */}
        <Link href="/configuracion">
          <button className="group relative flex items-center h-8 w-8 rounded-md transition-all duration-200 hover:bg-[var(--sidebar-hover-bg)]">
            <Settings className="h-5 w-5 mx-auto text-[var(--sidebar-text)]" />
            <span className="absolute left-full ml-2 text-sm opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              Configuración
            </span>
          </button>
        </Link>
      </div>
    </aside>
  );
}
