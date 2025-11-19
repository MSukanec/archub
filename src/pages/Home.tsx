import { useEffect } from "react";
import { Layout } from "@/layout/desktop/Layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { Home as HomeIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";

export default function Home() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();

  // Mantener el sidebar en modo general
  useEffect(() => {
    setSidebarLevel('general');
  }, [setSidebarLevel]);

  // Mostrar loading si el usuario está cargando
  if (userLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const headerProps = {
    icon: HomeIcon,
    title: "Inicio"
  };

  const firstName = userData?.user_data?.first_name || userData?.user?.full_name || 'Usuario';

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight",
            "bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
          )}
        >
          Hola, {firstName}
        </motion.h1>
      </div>
    </Layout>
  );
}
