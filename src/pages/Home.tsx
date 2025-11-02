import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/desktop/Sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useSidebarStore } from "@/stores/sidebarStore";
import { useThemeStore } from "@/stores/themeStore";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartChatInput } from "@/components/ui-custom/fields/SmartChatInput";
import { useMobile } from "@/hooks/use-mobile";
import { HeaderMobile } from "@/components/layout/mobile/HeaderMobile";
import { ActionBarMobile } from "@/components/layout/mobile/ActionBarMobile";
import { useActionBarMobile } from "@/components/layout/mobile/ActionBarMobileContext";

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
  const { isDocked, isHovered } = useSidebarStore();
  const { isDark } = useThemeStore();
  const isMobile = useMobile();
  const { showActionBar } = useActionBarMobile();
  
  const [greetingData, setGreetingData] = useState<GreetingData | null>(null);
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasActiveConversation, setHasActiveConversation] = useState(false);

  const isExpanded = isDocked || isHovered;

  // Mantener el sidebar en modo general
  useEffect(() => {
    setSidebarLevel('general');
  }, [setSidebarLevel]);

  // Sincronizar dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Cargar historial de chat al montar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          setIsLoadingHistory(false);
          return;
        }

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

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          throw new Error("No se pudo obtener la sesión del usuario");
        }

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
    
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setChatMessages(prev => [...prev, newUserMessage]);
    
    setHasActiveConversation(true);
    
    try {
      setIsSendingMessage(true);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error("No se pudo obtener la sesión del usuario");
      }

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
      
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  // Mobile view - mantener layout normal en mobile
  if (isMobile) {
    return (
      <HeaderMobile icon={undefined} title="Inicio">
        <main className={`transition-all duration-300 ease-in-out flex-1 overflow-auto px-4 py-3 pb-12 pt-5 ${showActionBar ? "pb-20" : "pb-8"}`}>
          <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12 overflow-x-hidden">
            <div className="max-w-4xl w-full space-y-8">
              {/* Contenido del chat - mismo que desktop pero adaptado */}
              <MobileChatContent
                isLoadingGreeting={isLoadingGreeting}
                isSendingMessage={isSendingMessage}
                hasActiveConversation={hasActiveConversation}
                chatMessages={chatMessages}
                greetingData={greetingData}
                error={error}
                userData={userData}
                inputMessage={inputMessage}
                setInputMessage={setInputMessage}
                handleSendMessage={handleSendMessage}
                showFullHistory={showFullHistory}
                setShowFullHistory={setShowFullHistory}
                handleSuggestionClick={handleSuggestionClick}
              />
            </div>
          </div>
        </main>
      </HeaderMobile>
    );
  }

  // Desktop view - custom layout con fondo
  return (
    <div className="h-screen flex relative">
      {/* Background Image - cubre toda la pantalla */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url(/Background.jpg)`,
        }}
      />

      {/* Sidebar - flotando sobre el fondo */}
      <div className="relative z-20">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out relative z-10 overflow-y-auto",
          isExpanded ? "ml-64" : "ml-16"
        )}
      >
        {/* Contenedor con padding igual que otras páginas */}
        <div className="p-3">
          <div className="rounded-xl overflow-hidden h-[calc(100vh-24px)]" style={{ backgroundColor: "var(--layout-bg)" }}>
            {/* Content centrado */}
            <div className="h-full flex flex-col items-center justify-center px-8 py-12 overflow-y-auto">
              <div className="max-w-3xl w-full space-y-8">
            
            {/* Área donde "habla la IA": Saludo inicial O última respuesta */}
            <div className="text-center space-y-6">
              {isLoadingGreeting ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-12 bg-white/10 rounded-lg w-3/4 mx-auto"></div>
                  <div className="h-12 bg-white/5 rounded-lg w-2/3 mx-auto"></div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="space-y-6"
                >
                  {isSendingMessage ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <span className="text-sm text-white/80 ml-2">Pensando...</span>
                    </div>
                  ) : hasActiveConversation && chatMessages.length > 0 ? (
                    (() => {
                      const lastAssistantMessage = [...chatMessages]
                        .reverse()
                        .find(msg => msg.role === 'assistant');
                      
                      return lastAssistantMessage ? (
                        <div className="max-w-2xl mx-auto">
                          <p className="text-lg md:text-xl font-medium leading-relaxed text-white/95 px-4">
                            {lastAssistantMessage.content}
                          </p>
                        </div>
                      ) : null;
                    })()
                  ) : (
                    <>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight px-4">
                        {greetingData?.greeting || ""}
                      </h1>

                      {error && (
                        <p className="text-sm text-white/50">
                          (Modo offline)
                        </p>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Input de mensaje - versión minimalista */}
            {!isLoadingGreeting && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="space-y-2 max-w-xl mx-auto"
              >
                <SmartChatInput
                  value={inputMessage}
                  onChange={setInputMessage}
                  onSubmit={handleSendMessage}
                  placeholder="Escribe un mensaje..."
                  disabled={isSendingMessage}
                  variant="minimal"
                />

                {chatMessages.length > 0 && (
                  <div className="text-center pt-1">
                    <button
                      onClick={() => setShowFullHistory(!showFullHistory)}
                      className="text-xs text-white/60 hover:text-white/90 transition-colors"
                      data-testid="button-toggle-history"
                    >
                      {showFullHistory ? "Ocultar historial completo" : "Ver historial completo"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Historial completo */}
            {!isLoadingGreeting && showFullHistory && chatMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-xl mx-auto"
              >
                <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm" data-testid="chat-messages-container">
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
                            : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
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

            {/* Sugerencias de acción - Botones Glossy */}
            {!isLoadingGreeting && !hasActiveConversation && greetingData?.suggestions && greetingData.suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60 uppercase tracking-wide">
                    Acciones sugeridas
                  </p>
                </div>

                <div className="space-y-3 max-w-xl mx-auto">
                  {greetingData.suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + (index * 0.1), duration: 0.4 }}
                    >
                      <button
                        className={cn(
                          "w-full h-auto min-h-[60px] py-4 px-6",
                          "flex items-center justify-between gap-3",
                          // Glassmorphism effect
                          "bg-white/10 backdrop-blur-md",
                          "border border-white/20",
                          "rounded-2xl",
                          "hover:bg-white/20 hover:border-white/30",
                          "transition-all duration-300",
                          "group text-left",
                          // Shine effect
                          "relative overflow-hidden",
                          "before:absolute before:inset-0",
                          "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                          "before:translate-x-[-200%]",
                          "hover:before:translate-x-[200%]",
                          "before:transition-transform before:duration-700"
                        )}
                        onClick={() => handleSuggestionClick(suggestion.action)}
                        data-testid={`button-suggestion-${index}`}
                      >
                        <span className="text-sm font-medium flex-1 leading-relaxed text-white whitespace-normal break-words">
                          {suggestion.label}
                        </span>
                        <ArrowRight className="w-4 h-4 flex-shrink-0 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para mobile (reutiliza la lógica del chat)
function MobileChatContent({ 
  isLoadingGreeting, 
  isSendingMessage, 
  hasActiveConversation, 
  chatMessages, 
  greetingData, 
  error, 
  userData,
  inputMessage,
  setInputMessage,
  handleSendMessage,
  showFullHistory,
  setShowFullHistory,
  handleSuggestionClick
}: any) {
  return (
    <>
      <div className="text-center space-y-6">
        {isLoadingGreeting ? (
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
            {isSendingMessage ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-sm text-muted-foreground ml-2">Pensando...</span>
              </div>
            ) : hasActiveConversation && chatMessages.length > 0 ? (
              (() => {
                const lastAssistantMessage = [...chatMessages]
                  .reverse()
                  .find((msg: any) => msg.role === 'assistant');
                
                return lastAssistantMessage ? (
                  <div className="max-w-2xl mx-auto">
                    <p className="text-lg md:text-xl font-medium leading-relaxed text-foreground/90 px-4">
                      {lastAssistantMessage.content}
                    </p>
                  </div>
                ) : null;
              })()
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight px-4">
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

      {!isLoadingGreeting && showFullHistory && chatMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-lg border border-border/50 bg-muted/20" data-testid="chat-messages-container">
            {[...chatMessages].reverse().map((msg: any, index: number) => (
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

      {!isLoadingGreeting && !hasActiveConversation && greetingData?.suggestions && greetingData.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Acciones sugeridas
            </p>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {greetingData.suggestions.map((suggestion: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + (index * 0.1), duration: 0.4 }}
              >
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-auto min-h-[56px] py-3 sm:py-4 px-4 sm:px-5",
                    "flex items-center justify-between gap-3",
                    "hover:bg-accent hover:text-accent-foreground hover:border-accent",
                    "transition-all duration-200",
                    "group text-left"
                  )}
                  onClick={() => handleSuggestionClick(suggestion.action)}
                  data-testid={`button-suggestion-${index}`}
                >
                  <span className="text-sm sm:text-base font-medium flex-1 leading-snug sm:leading-relaxed group-hover:text-accent-foreground whitespace-normal break-words">
                    {suggestion.label}
                  </span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-muted-foreground group-hover:text-accent-foreground group-hover:translate-x-1 transition-all" />
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );
}
