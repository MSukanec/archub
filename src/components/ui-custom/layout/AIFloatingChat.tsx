import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartChatInput } from "@/components/ui-custom/fields/SmartChatInput";
import { MessageContent } from "@/components/ai/MessageContent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIFloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar historial al montar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch('/api/ai/history', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.messages) {
            setChatMessages(data.messages.map((msg: any) => ({
              role: msg.role,
              content: msg.content
            })));
          }
        }
      } catch (error) {
        console.error('Error loading AI history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Auto-scroll al final cuando hay nuevos mensajes O cuando se abre
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      // Pequeño delay para asegurar que el DOM se haya renderizado
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [chatMessages, isOpen]);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    try {
      setIsSendingMessage(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
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
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: errorData.error || "Has alcanzado tu límite de prompts gratuitos. Actualiza tu plan para continuar."
          };
          setChatMessages(prev => [...prev, assistantMessage]);
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

  return (
    <div 
      className="fixed bottom-8 right-8 z-[100]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Botón flotante con efecto de respiración */}
      <motion.button
        className="relative h-12 w-12 rounded-full bg-gradient-to-br from-accent to-accent/80 shadow-lg flex items-center justify-center group"
        animate={{
          scale: [1, 1.02, 1],
          boxShadow: [
            "0 4px 15px rgba(var(--accent-rgb), 0.2)",
            "0 6px 20px rgba(var(--accent-rgb), 0.3)",
            "0 4px 15px rgba(var(--accent-rgb), 0.2)",
          ],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1],
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="h-5 w-5 text-accent-foreground" />
        
        {/* Pulso exterior */}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.6, 1],
          }}
        />
      </motion.button>

      {/* Popover del chat - se abre hacia arriba */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full right-0 mb-4 w-96 bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
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
            <div className="px-4 py-3 border-b border-border bg-accent/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-sm">Asistente IA</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Área de mensajes */}
            <div className="h-[400px] flex flex-col">
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      ¡Hola! Soy tu asistente de IA.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pregúntame cualquier cosa sobre tus proyectos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex",
                          msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2",
                            msg.role === 'user'
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted"
                          )}
                        >
                          {msg.role === 'assistant' ? (
                            <MessageContent content={msg.content} />
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicador de "pensando..." */}
                    {isSendingMessage && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Elemento invisible para hacer scroll */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input de mensaje */}
              <div className="p-3 border-t border-border bg-muted/30">
                <SmartChatInput
                  value={inputMessage}
                  onChange={setInputMessage}
                  onSubmit={handleSendMessage}
                  placeholder="Escribe tu mensaje..."
                  disabled={isSendingMessage}
                />
              </div>
            </div>

            {/* Disclaimer */}
            <div className="px-3 py-2 bg-muted/50 border-t border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                Archub puede cometer errores. Comprueba la información importante.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
