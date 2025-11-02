import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/desktop/Layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { supabase } from "@/lib/supabase";
import { Home as HomeIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartChatInput } from "@/components/ui-custom/fields/SmartChatInput";

interface Suggestion {
  label: string;
  action: string;
}

interface GreetingData {
  greeting: string;
  suggestions: Suggestion[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  
  const [greetingData, setGreetingData] = useState<GreetingData | null>(null);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  // Controla si hay conversación ACTIVA en esta sesión (no cuenta historial cargado)
  const [hasActiveConversation, setHasActiveConversation] = useState(false);

  // Mantener el sidebar en modo general
  useEffect(() => {
    setSidebarLevel('general');
  }, [setSidebarLevel]);

  // Cargar historial de chat al montar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);

        // Obtener el token del usuario
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          // Si no hay sesión, simplemente no cargar historial
          setIsLoadingHistory(false);
          return;
        }

        // Llamar al endpoint de historial
        const response = await fetch('/api/ai/history', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Error fetching history');
          setIsLoadingHistory(false);
          return;
        }

        const data = await response.json();
        
        // Inicializar chatMessages con el historial
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
          setChatMessages(formattedMessages);
        }
      } catch (err: any) {
        console.error('Error loading history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (userData?.user?.id) {
      loadHistory();
    }
  }, [userData?.user?.id]);

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

  // Nota: Auto-scroll eliminado porque con historial invertido (más recientes arriba),
  // el comportamiento natural del scroll ya muestra los mensajes más recientes primero

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

  // Enviar mensaje de chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Agregar mensaje del usuario al chat
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);
    
    // Marcar que ahora hay conversación activa en esta sesión
    setHasActiveConversation(true);
    
    try {
      setIsSendingMessage(true);

      // Obtener el token del usuario
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("No se pudo obtener la sesión del usuario");
      }

      // Llamar al endpoint de chat
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages
        })
      });

      if (!response.ok) {
        throw new Error("Error al enviar el mensaje");
      }

      const data = await response.json();
      
      // Agregar respuesta de la IA al chat
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Agregar mensaje de error
      const errorMessage: ChatMessage = { 
        role: 'assistant', 
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente." 
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };


  if (userLoading || isLoadingHistory) {
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
      <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12 overflow-x-hidden">
        {/* Contenedor principal centrado */}
        <div className="max-w-4xl w-full space-y-8">
          
          {/* Área donde "habla la IA": Saludo inicial O última respuesta */}
          <div className="text-center space-y-6">
            {isLoadingGreeting ? (
              // Skeleton loader
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-muted/30 rounded-lg w-3/4 mx-auto"></div>
                <div className="h-12 bg-muted/20 rounded-lg w-2/3 mx-auto"></div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-6"
              >
                {/* Si está enviando mensaje, mostrar "Pensando..." */}
                {isSendingMessage ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <span className="text-sm text-muted-foreground ml-2">Pensando...</span>
                  </div>
                ) : hasActiveConversation && chatMessages.length > 0 ? (
                  (() => {
                    // Encontrar el último mensaje de la IA
                    const lastAssistantMessage = [...chatMessages]
                      .reverse()
                      .find(msg => msg.role === 'assistant');
                    
                    return lastAssistantMessage ? (
                      <div className="max-w-2xl mx-auto">
                        <p className={cn(
                          "text-lg md:text-xl font-medium leading-relaxed",
                          "text-foreground/90",
                          "px-4"
                        )}>
                          {lastAssistantMessage.content}
                        </p>
                      </div>
                    ) : null;
                  })()
                ) : (
                  // Si NO hay conversación activa, mostrar el saludo
                  <>
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
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Input de mensaje (siempre visible después del saludo/respuesta) */}
          {!isLoadingGreeting && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="space-y-2 max-w-2xl mx-auto"
            >
              <SmartChatInput
                value={inputMessage}
                onChange={setInputMessage}
                onSubmit={handleSendMessage}
                placeholder="Escribe un mensaje..."
                disabled={isSendingMessage}
              />

              {/* Toggle para ver historial completo */}
              {chatMessages.length > 0 && (
                <div className="text-center pt-1">
                  <button
                    onClick={() => setShowFullHistory(!showFullHistory)}
                    className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                    data-testid="button-toggle-history"
                  >
                    {showFullHistory ? "Ocultar historial completo" : "Ver historial completo"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Historial completo (solo si showFullHistory es true) */}
          {!isLoadingGreeting && showFullHistory && chatMessages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto"
            >
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-lg border border-border/50 bg-muted/20" data-testid="chat-messages-container">
                {[...chatMessages].reverse().map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                    data-testid={`chat-message-${msg.role}-${index}`}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-3",
                        msg.role === 'user'
                          ? "bg-accent text-accent-foreground"
                          : "bg-card border border-border text-card-foreground"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Sugerencias de acción (solo si NO hay conversación activa) */}
          {!isLoadingGreeting && !hasActiveConversation && greetingData?.suggestions && greetingData.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="space-y-3 max-w-2xl mx-auto"
            >
              {greetingData.suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + (index * 0.1), duration: 0.4 }}
                  onClick={() => handleSuggestionClick(suggestion.action)}
                  className={cn(
                    "w-full rounded-2xl",
                    "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
                    "border border-white/20 dark:border-white/10",
                    "px-4 sm:px-5 py-3.5 sm:py-4",
                    "flex items-center justify-between gap-3",
                    "transition-all duration-300",
                    "hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/30 dark:hover:border-white/20",
                    "group text-left cursor-pointer"
                  )}
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.03)'
                  }}
                  data-testid={`button-suggestion-${index}`}
                >
                  <span className="text-sm font-normal flex-1 leading-relaxed text-foreground/80 group-hover:text-foreground whitespace-normal break-words">
                    {suggestion.label}
                  </span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-muted-foreground/60 group-hover:text-foreground/80 group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
