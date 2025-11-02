import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Send, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SmartChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SmartChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Escribe un mensaje...",
  disabled = false,
  className
}: SmartChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea al escribir
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto para recalcular
    textarea.style.height = 'auto';
    
    // Calcular nueva altura (max 200px aprox 8 líneas)
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  const handleMicClick = () => {
    // TODO: Implementar funcionalidad de micrófono
    console.log('Mic clicked');
  };

  return (
    <div 
      className={cn(
        "relative flex items-end gap-1 sm:gap-2",
        "w-full rounded-2xl sm:rounded-3xl",
        "bg-white/5 dark:bg-white/[0.03]",
        "backdrop-blur-xl",
        "border transition-all duration-200",
        isFocused 
          ? "border-white/20 dark:border-white/[0.15] shadow-xl shadow-black/10" 
          : "border-white/10 dark:border-white/[0.08] shadow-lg shadow-black/5",
        "px-3 sm:px-5 py-2 sm:py-2.5",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      data-testid="smart-chat-input-container"
    >
      {/* Botón de micrófono (izquierda) */}
      <button
        type="button"
        onClick={handleMicClick}
        disabled={disabled}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-full",
          "text-foreground/50 hover:text-foreground/80",
          "hover:bg-white/10 dark:hover:bg-white/5 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "self-end mb-0.5"
        )}
        aria-label="Grabar audio"
        data-testid="button-mic"
      >
        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Textarea expansible */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none bg-transparent",
          "text-sm sm:text-base font-medium leading-snug sm:leading-relaxed",
          "placeholder:text-foreground/40",
          "text-foreground/90",
          "focus:outline-none",
          "disabled:cursor-not-allowed",
          "py-2 sm:py-2.5 px-1 sm:px-2",
          "max-h-[200px] overflow-y-auto"
        )}
        style={{
          minHeight: '24px',
          scrollbarWidth: 'thin'
        }}
        data-testid="input-chat-message"
      />

      {/* Botón de enviar (derecha) */}
      <Button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        size="icon"
        className={cn(
          "flex-shrink-0 rounded-full",
          "w-8 h-8 sm:w-9 sm:h-9",
          "bg-accent hover:bg-accent/90",
          "text-accent-foreground",
          "disabled:opacity-30 disabled:cursor-not-allowed",
          "transition-all duration-200",
          "shadow-md hover:shadow-lg",
          "self-end mb-0.5"
        )}
        aria-label="Enviar mensaje"
        data-testid="button-send-message"
      >
        <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
      </Button>
    </div>
  );
}
