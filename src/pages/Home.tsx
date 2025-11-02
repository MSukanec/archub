import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/desktop/Layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from "@/lib/supabase";
import { Home as HomeIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Home() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  
  const [greeting, setGreeting] = useState<string>("");
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mantener el sidebar en modo general
  useEffect(() => {
    setSidebarLevel('general');
  }, [setSidebarLevel]);

  // Fetch del saludo de IA
  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        setIsLoadingGreeting(true);
        setError(null);

        // Obtener el token del usuario
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          throw new Error("No se pudo obtener la sesión del usuario");
        }

        // Llamar al endpoint de saludo
        const response = await fetch('/api/ai/home_greeting', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al obtener el saludo");
        }

        const data = await response.json();
        setGreeting(data.greeting);
      } catch (err: any) {
        console.error('Error fetching greeting:', err);
        setError(err.message || "Error al cargar el saludo");
        // Fallback genérico
        setGreeting(`¡Hola, ${userData?.user_data?.first_name || 'Usuario'}! ¿Cómo estás hoy?`);
      } finally {
        setIsLoadingGreeting(false);
      }
    };

    if (userData?.user?.id) {
      fetchGreeting();
    }
  }, [userData?.user?.id, userData?.user_data?.first_name]);

  if (userLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const headerProps = {
    icon: HomeIcon,
    title: "Inicio"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12">
        {/* Contenedor principal centrado */}
        <div className="max-w-4xl w-full space-y-12">
          {/* Saludo principal con IA */}
          <div className="text-center space-y-6">
            {isLoadingGreeting ? (
              // Skeleton loader
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="w-6 h-6 text-accent/60" />
                  <span className="text-sm text-muted-foreground">Archubita está pensando...</span>
                </div>
                <div className="h-12 bg-muted/30 rounded-lg w-3/4 mx-auto"></div>
                <div className="h-12 bg-muted/20 rounded-lg w-2/3 mx-auto"></div>
              </div>
            ) : (
              // Saludo animado
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Ícono de Archubita */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                    <Sparkles className="w-8 h-8 text-accent" />
                  </div>
                </motion.div>

                {/* Mensaje de saludo */}
                <h1 className={cn(
                  "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight",
                  "bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent",
                  "leading-tight"
                )}>
                  {greeting}
                </h1>

                {error && (
                  <p className="text-sm text-muted-foreground/60">
                    (Modo offline)
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Espacio para sugerencias futuras de IA */}
          {!isLoadingGreeting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-4"
            >
              {/* Placeholder para sugerencias de acción */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground/60 mb-8">
                  {/* Este espacio se usará para mostrar recomendaciones personalizadas */}
                </p>
              </div>

              {/* Grid de acciones sugeridas (placeholder) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {/* Los cards de sugerencias aparecerán aquí dinámicamente */}
              </div>
            </motion.div>
          )}
        </div>

        {/* Indicador sutil de IA */}
        {!isLoadingGreeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="text-xs text-muted-foreground/40 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" />
              Generado con Archubita
            </p>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
