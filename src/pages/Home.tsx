import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/desktop/Layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from "@/lib/supabase";
import { Home as HomeIcon, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Suggestion {
  label: string;
  action: string;
}

interface GreetingData {
  greeting: string;
  suggestions: Suggestion[];
}

export default function Home() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  
  const [greetingData, setGreetingData] = useState<GreetingData | null>(null);
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

        const data: GreetingData = await response.json();
        setGreetingData(data);
      } catch (err: any) {
        console.error('Error fetching greeting:', err);
        setError(err.message || "Error al cargar el saludo");
        // Fallback genérico
        setGreetingData({
          greeting: `¡Hola, ${userData?.user_data?.first_name || 'Usuario'}! ¿Cómo estás hoy?`,
          suggestions: [
            { label: "Explorar cursos", action: "/learning/courses" },
            { label: "Ver proyectos", action: "/organization/projects" }
          ]
        });
      } finally {
        setIsLoadingGreeting(false);
      }
    };

    if (userData?.user?.id) {
      fetchGreeting();
    }
  }, [userData?.user?.id, userData?.user_data?.first_name]);

  // Manejar click en sugerencia
  const handleSuggestionClick = (action: string) => {
    // Determinar el nivel del sidebar según la ruta
    if (action.startsWith('/learning')) {
      setSidebarLevel('learning');
    } else if (action.startsWith('/organization')) {
      setSidebarLevel('organization');
    } else if (action.startsWith('/project')) {
      setSidebarLevel('project');
    } else {
      setSidebarLevel('general');
    }
    
    navigate(action);
  };

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
                  "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight",
                  "bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent",
                  "leading-tight px-4"
                )}>
                  {greetingData?.greeting || ""}
                </h1>

                {error && (
                  <p className="text-sm text-muted-foreground/60">
                    (Modo offline)
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Sugerencias de acción */}
          {!isLoadingGreeting && greetingData?.suggestions && greetingData.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-6"
            >
              {/* Título de sección */}
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Acciones sugeridas
                </p>
              </div>

              {/* Grid de sugerencias */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {greetingData.suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + (index * 0.1), duration: 0.4 }}
                  >
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-auto py-6 px-6",
                        "flex flex-col items-start gap-3",
                        "hover:bg-accent/5 hover:border-accent/30",
                        "transition-all duration-200",
                        "group"
                      )}
                      onClick={() => handleSuggestionClick(suggestion.action)}
                      data-testid={`button-suggestion-${index}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium text-left flex-1">
                          {suggestion.label}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                      </div>
                    </Button>
                  </motion.div>
                ))}
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
