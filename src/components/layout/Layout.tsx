import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  wide?: boolean;
  headerProps?: {
    title?: string;
    showSearch?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    showFilters?: boolean;
    filters?: { label: string; onClick: () => void }[];
    customFilters?: React.ReactNode;
    onClearFilters?: () => void;
    actions?: React.ReactNode;
  };
}

export function Layout({ children, wide = false, headerProps }: LayoutProps) {
  const { isDark, setTheme } = useThemeStore();
  const { data } = useCurrentUser();
  const { isDocked, isHovered } = useSidebarStore();

  const isExpanded = isDocked || isHovered;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Sincronizar tema desde la base de datos cuando se carga el usuario (solo una vez)
  useEffect(() => {
    if (data?.preferences?.theme) {
      const dbTheme = data.preferences.theme;
      const shouldBeDark = dbTheme === "dark";

      // Solo actualizar si es diferente al estado actual
      if (shouldBeDark !== isDark) {
        setTheme(shouldBeDark);
      }
    }
  }, [data?.preferences?.theme]);

  return (
    <div className="min-h-screen bg-background">
      <Header {...headerProps} />
      <Sidebar />
      <main
        className={cn(
          "transition-all duration-300 ease-in-out flex-1 overflow-auto"
        )}
        style={{
          marginLeft: isExpanded ? "240px" : "40px",
          marginTop: "36px",
        }}
      >
        <div className={cn(
          "px-6 py-6 space-y-6",
          wide ? "w-full" : "max-w-[1440px] mx-auto"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
