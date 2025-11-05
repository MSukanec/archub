/**
 * 🤖 AIPanel - Panel de chat IA integrado en RightSidebar
 * 
 * Componente que muestra un chat conversacional con IA:
 * - Vista inicial: Saludo personalizado + ideas pre-establecidas
 * - Vista con conversación: Burbujas de chat + input
 */

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sparkles, User } from 'lucide-react';
import { SmartChatInput } from '@/components/ui-custom/fields/SmartChatInput';
import { MessageContent } from '@/components/ai/MessageContent';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIPanelProps {
  userId: string;
  userFullName: string;
  userAvatarUrl?: string;
  onClose: () => void;
}

const SUGGESTED_IDEAS = [
  "Dime los ingresos que tuvimos este mes.",
  "Crea un nuevo presupuesto para un baño completo.",
  "Qué cantidad de ladrillos tenemos comprados actualmente?"
];

export function AIPanel({ userId, userFullName, userAvatarUrl, onClose }: AIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  
  // Obtener primera letra del nombre para el avatar
  const userInitial = userFullName?.charAt(0)?.toUpperCase() || 'U';

  // Cargar historial al montar
  useEffect(() => {
    loadHistory();
  }, []);

  // Auto-scroll hacia abajo cuando cambian los mensajes
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  const loadHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
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
        if (data?.messages) {
          const formattedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading AI history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    
    if (!textToSend || isSending) return;

    setIsSending(true);
    
    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: textToSend })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      const data = await response.json();
      
      // Agregar respuesta de la IA
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Mostrar error como mensaje de la IA
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `❌ Error: ${error.message || 'No se pudo enviar el mensaje'}`
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleIdeaClick = (idea: string) => {
    handleSendMessage(idea);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen">
      {/* HEADER */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm !text-white">Asistente IA</h3>
        </div>
      </div>
      
      <Separator className="bg-[var(--main-sidebar-fg)] opacity-20" />

      {/* CONTENIDO */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      ) : hasMessages ? (
        // Vista con conversación
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {/* Mensajes normales: viejos arriba, nuevos abajo */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarUrl} alt={userFullName} />
                      <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Burbuja de mensaje */}
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[75%]",
                    message.role === 'user'
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--main-sidebar-button-hover-bg)] text-white'
                  )}
                >
                  <div className="text-sm">
                    {message.role === 'assistant' ? (
                      <MessageContent content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Indicador de carga */}
            {isSending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-[var(--main-sidebar-button-hover-bg)] text-white">
                  <div className="flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse delay-150">●</span>
                    <span className="animate-pulse delay-300">●</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Elemento invisible para auto-scroll */}
            <div ref={scrollEndRef} />
          </div>
        </ScrollArea>
      ) : (
        // Vista inicial (sin mensajes)
        <div className="flex-1 px-4 py-6 flex flex-col">
          <div className="flex flex-col items-center justify-center flex-1">
            {/* Avatar IA */}
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            {/* Saludo */}
            <h2 className="text-xl font-semibold !text-white mb-1">
              Hola {userFullName.split(' ')[0] || 'Usuario'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              ¿En qué puedo ayudarte?
            </p>

            {/* Ideas pre-establecidas */}
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Comienza con una instrucción</p>
              {SUGGESTED_IDEAS.map((idea, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleIdeaClick(idea)}
                  disabled={isSending}
                  className="w-full justify-start text-left h-auto py-2 px-3 text-xs hover:bg-[var(--main-sidebar-button-hover-bg)] hover:text-white border-[var(--main-sidebar-fg)]/20"
                  data-testid={`button-ai-idea-${index}`}
                >
                  {idea}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INPUT - Siempre al fondo */}
      <div className="p-4 pt-3 border-t border-[var(--main-sidebar-fg)]/20">
        <SmartChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={() => handleSendMessage()}
          placeholder="Escribe tu mensaje..."
          disabled={isSending}
        />
      </div>
    </div>
  );
}
