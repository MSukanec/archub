import { useState, useRef, useEffect } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartChatInput } from '@/components/ui-custom/fields/SmartChatInput';
import { MessageContent } from '@/components/ai/MessageContent';
import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { isProOrTeams } from '@/utils/planHelpers';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function FloatingAIChat() {
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Estados del chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const hasLoadedHistoryRef = useRef(false);
  
  // Get current organization plan
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === organizationId
  );
  const planCode = currentOrganization?.plan?.name || 'free';
  const isPro = isProOrTeams(planCode);
  
  // Detectar si ActionBarMobile está visible para ajustar posición del botón
  const { showActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  
  // Ajustar posición del botón: bottom-20 si ActionBarMobile está visible, bottom-6 si no
  const buttonBottomClass = isMobile && showActionBar ? 'bottom-20' : 'bottom-6';
  
  // Mensajes de ejemplo para usuarios FREE
  const exampleMessages: ChatMessage[] = [
    { role: 'user', content: '¿Cuál es el presupuesto total del proyecto Samurai Rodriguez?' },
    { role: 'assistant', content: 'El proyecto Samurai Rodriguez tiene un presupuesto total de $2,450,000 ARS. Actualmente se ha gastado el 68% del presupuesto ($1,666,000 ARS), quedando un saldo disponible de $784,000 ARS.' },
    { role: 'user', content: '¿Cuánto le debo al proveedor Constructora del Sur?' },
    { role: 'assistant', content: 'Según los registros, le debes $340,000 ARS a Constructora del Sur. Esta deuda corresponde a 3 facturas pendientes de pago del último mes.' }
  ];
  
  // Mostrar mensajes de ejemplo si es FREE, sino mostrar el historial real
  const displayMessages = isPro ? chatMessages : exampleMessages;

  // Auto-scroll al final cuando cambian los mensajes
  useEffect(() => {
    if (messagesEndRef.current && chatMessages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSendingMessage]);

  // Auto-scroll al final cuando se abre el popover o termina de cargar
  useEffect(() => {
    if (isOpen && !isLoadingHistory && messagesEndRef.current && chatMessages.length > 0) {
      // Usar setTimeout para asegurar que el DOM esté renderizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [isOpen, isLoadingHistory, chatMessages.length]);

  // Cargar historial de mensajes
  useEffect(() => {
    const loadHistory = async () => {
      if (!userId || hasLoadedHistoryRef.current) return;
      
      try {
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

        if (response.ok) {
          const data = await response.json();
          if (data.messages) {
            const formattedMessages = data.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            }));
            setChatMessages(formattedMessages);
          }
        }
        
        hasLoadedHistoryRef.current = true;
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    if (userId && !hasLoadedHistoryRef.current) {
      loadHistory();
    }
  }, [userId]);

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
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
        if (response.status === 429) {
          const errorData = await response.json();
          // Agregar mensaje de error como respuesta de la IA
          const errorMessage: ChatMessage = { 
            role: 'assistant', 
            content: errorData.error || "Has alcanzado tu límite de prompts gratuitos. Actualiza a PRO para acceso ilimitado."
          };
          setChatMessages(prev => [...prev, { role: 'user', content: userMessage }, errorMessage]);
          setIsSendingMessage(false);
          return;
        }
        throw new Error("Error al enviar el mensaje");
      }

      const data = await response.json();
      
      const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
      const assistantMessage: ChatMessage = { role: 'assistant', content: data.response };
      setChatMessages(prev => [...prev, newUserMessage, assistantMessage]);
      
    } catch (err: any) {
      console.error('Error sending message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  if (!userId) return null;

  return (
    <div 
      className={cn("fixed right-6 z-50", buttonBottomClass)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón flotante con efecto de respiración */}
      <button
        className={cn(
          "relative h-14 w-14 rounded-full",
          "bg-accent text-accent-foreground",
          "flex items-center justify-center",
          "transition-all duration-500",
          "hover:scale-105",
          "animate-breathe",
          "shadow-glow"
        )}
        data-testid="button-floating-ai"
      >
        <Sparkles className="h-6 w-6" />
        
        {/* Pulso de resplandor animado */}
        <span className="absolute inset-0 rounded-full bg-accent opacity-40 animate-ping-slow" />
      </button>

      {/* Popover de chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full right-0 mb-4 w-96 bg-background border border-border rounded-lg shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Asistente IA</span>
              </div>
            </div>

            {/* Mensajes */}
            <div className="relative h-96 overflow-y-auto p-4 space-y-3">
              {isLoadingHistory && isPro ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size="md" />
                </div>
              ) : displayMessages.length === 0 && isPro ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Pregunta lo que necesites
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mostrar mensajes en orden cronológico (más antiguos arriba, más recientes abajo) */}
                  {displayMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2",
                          msg.role === 'user'
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted border border-border"
                        )}
                      >
                        <div className="text-xs leading-relaxed">
                          {msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            <MessageContent content={msg.content} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de carga */}
                  {isSendingMessage && isPro && (
                    <div className="flex justify-start">
                      <div className="bg-muted border border-border rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Elemento invisible para hacer scroll */}
                  <div ref={messagesEndRef} />
                </>
              )}
              
              {/* Overlay blur para usuarios FREE */}
              {!isPro && (
                <div className="absolute inset-0 bg-background/60 dark:bg-background/80 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Función disponible en planes Pro o Teams
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/20">
              <SmartChatInput
                value={inputMessage}
                onChange={setInputMessage}
                onSubmit={handleSendMessage}
                placeholder={isPro ? "Escribe un mensaje..." : "Disponible en Pro o Teams"}
                disabled={isSendingMessage || !isPro}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                Archub puede cometer errores. Comprueba la información importante.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2), 
                        0 0 25px rgba(var(--accent-rgb), 0.1);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3), 
                        0 0 35px rgba(var(--accent-rgb), 0.15);
          }
        }

        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }

        .animate-breathe {
          animation: breathe 4.5s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 4.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .shadow-glow {
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.2), 
                      0 0 25px rgba(var(--accent-rgb), 0.1);
        }
      `}</style>
    </div>
  );
}
