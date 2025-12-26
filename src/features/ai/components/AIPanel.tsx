/**
 * 🤖 AIPanel - Panel de chat IA
 * 
 * Componente presentacional que muestra un chat conversacional con IA:
 * - Vista inicial: Saludo personalizado + ideas pre-establecidas
 * - Vista con conversación: Burbujas de chat + input
 * 
 * Refactorizado para usar Services → Hooks → Component pattern (FSD)
 */
import { useEffect, useState, useRef, type KeyboardEvent } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sparkles, ArrowUp } from 'lucide-react';
import { MessageContent } from './MessageContent';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAIHistory } from '../hooks/use-ai-history';
import { useAIChat } from '../hooks/use-ai-chat';
import type { ChatMessage } from '../types';
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const getSessionKey = () => `ai_has_interacted_${userId}`;
  
  const [hasInteracted, setHasInteracted] = useState(() => {
    try {
      const stored = sessionStorage.getItem(getSessionKey());
      return stored === 'true';
    } catch {
      return false;
    }
  });
  
  const { data: historyData, isLoading: isLoadingHistory } = useAIHistory(hasInteracted);
  const chatMutation = useAIChat();
  
  const userInitial = userFullName?.charAt(0)?.toUpperCase() || 'U';
  useEffect(() => {
    // Solo setear messages desde historial si están vacíos (primera carga)
    if (historyData?.messages && messages.length === 0) {
      setMessages(historyData.messages);
    }
  }, [historyData, messages.length]);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, [inputValue]);
  const hasMessages = messages.length > 0;
  useEffect(() => {
    if (scrollAreaRef.current && hasMessages) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
    }
  }, [messages, hasMessages]);
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    
    if (!textToSend || chatMutation.isPending) return;
    if (!hasInteracted) {
      setHasInteracted(true);
      try {
        sessionStorage.setItem(getSessionKey(), 'true');
      } catch (error) {
        console.error('Error saving to sessionStorage:', error);
      }
    }
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    chatMutation.mutate(textToSend, {
      onSuccess: (data) => {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.response
        };
        setMessages(prev => [...prev, assistantMessage]);
      },
      onError: (error) => {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `❌ Error: ${error.message || 'No se pudo enviar el mensaje'}`
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    });
  };
  const handleIdeaClick = (idea: string) => {
    handleSendMessage(idea);
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter'&& !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !chatMutation.isPending) {
        handleSendMessage();
      }
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* CONTENIDO */}
      {isLoadingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Cargando...</div>
        </div>
      ) : hasMessages ? (
        // Vista con conversación
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {/* Indicador de carga - aparece arriba de todo (mensaje más nuevo) */}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
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
            
            {/* Mensajes en orden inverso: más nuevos arriba, más viejos abajo */}
            {[...messages].reverse().map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === 'user'? 'flex-row-reverse': 'flex-row'
                )}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === 'user'? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatarUrl} alt={userFullName} />
                      <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-[var(--accent)] flex items-center justify-center">
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
                      : 'bg-[var(--main-sidebar-button-hover-bg)] text-[var(--main-sidebar-fg)]'
                  )}
                >
                  <div className="text-sm">
                    {message.role === 'assistant'? (
                      <MessageContent content={message.content} />
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        // Vista inicial (sin mensajes)
        <div className="flex-1 px-4 py-6 flex flex-col">
          <div className="flex flex-col items-center justify-center flex-1">
            {/* Avatar IA */}
            <div className="h-16 w-16 rounded-full bg-[var(--accent)] flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            {/* Saludo */}
            <h2 className="text-xl font-semibold text-[var(--main-sidebar-fg)] mb-1">
              Hola {userFullName.split('')[0] || 'Usuario'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              ¿En qué puedo ayudarte?
            </p>
            {/* Ideas pre-establecidas */}
            <div className="w-full space-y-3">
              {SUGGESTED_IDEAS.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => handleIdeaClick(idea)}
                  disabled={chatMutation.isPending}
                  className="w-full text-left px-4 py-2 rounded-full border border-[var(--main-sidebar-fg)] text-[var(--main-sidebar-fg)] text-xs leading-relaxed hover:bg-[var(--main-sidebar-button-hover-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid={`button-ai-idea-${index}`}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* INPUT - Siempre al fondo */}
      <Separator />
      <div className="p-4 pb-3">
        <div className="relative flex items-center gap-2 rounded-lg bg-[var(--main-sidebar-button-hover-bg)] px-3 py-1.5">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            disabled={chatMutation.isPending}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent",
              "text-sm leading-5 text-[var(--main-sidebar-fg)] placeholder:text-muted-foreground",
              "focus:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-[120px] overflow-y-auto"
            )}
            style={{
              minHeight: '24px',
              height: '24px',
              scrollbarWidth: 'thin'
            }}
            data-testid="input-ai-message"
          />
          
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || chatMutation.isPending}
            className={cn(
              "flex-shrink-0 p-1.5 rounded-full",
              "bg-[var(--accent)] hover:opacity-90 transition-opacity",
              "text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            aria-label="Enviar mensaje"
            data-testid="button-send-ai-message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
