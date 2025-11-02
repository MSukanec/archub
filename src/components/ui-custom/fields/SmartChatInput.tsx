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
  variant?: "default" | "minimal";
}

export function SmartChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Escribe un mensaje...",
  disabled = false,
  className,
  variant = "default"
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

  // Variant minimal - para la página de Home con fondo
  if (variant === "minimal") {
    return (
      <div 
        className={cn(
          "relative flex items-end gap-1.5",
          "w-full rounded-full",
          "bg-background/60 backdrop-blur-md border border-border",
          "transition-all duration-200",
          isFocused && "border-accent/50 bg-background/80",
          "px-3 py-2",
          "shadow-lg",
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
            "text-muted-foreground hover:text-foreground",
            "hover:bg-accent/10 transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "self-end mb-0.5"
          )}
          aria-label="Grabar audio"
          data-testid="button-mic"
        >
          <Mic className="w-4 h-4" />
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
            "text-sm leading-5",
            "placeholder:text-muted-foreground/50",
            "text-foreground",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
            "py-2 px-2",
            "max-h-[200px] overflow-y-auto"
          )}
          style={{
            minHeight: '20px',
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
            "w-8 h-8",
            "bg-accent/80 hover:bg-accent",
            "text-accent-foreground",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            "transition-all duration-200",
            "shadow-md hover:shadow-lg",
            "self-end mb-0.5",
            "border border-accent/50"
          )}
          aria-label="Enviar mensaje"
          data-testid="button-send-message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Variant default - para el resto de la app
  return (
    <div 
      className={cn(
        "relative flex items-end gap-1 sm:gap-2",
        "w-full rounded-full",
        "bg-background border-2 transition-all duration-200",
        isFocused ? "border-accent/50" : "border-border",
        "px-2 sm:px-4 py-2",
        "shadow-sm hover:shadow-md",
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
          "flex-shrink-0 p-1.5 sm:p-2 rounded-full",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-accent/10 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "self-end mb-1"
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
          "text-sm sm:text-base leading-5 sm:leading-6",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none",
          "disabled:cursor-not-allowed",
          "py-2 sm:py-3 px-1 sm:px-2",
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
          "w-8 h-8 sm:w-10 sm:h-10",
          "bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90",
          "text-accent-foreground",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "transition-all duration-200",
          "shadow-sm hover:shadow-md",
          "self-end mb-1"
        )}
        aria-label="Enviar mensaje"
        data-testid="button-send-message"
      >
        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>
    </div>
  );
}
