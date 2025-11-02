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
        "relative flex items-end gap-2",
        "w-full rounded-full",
        "bg-background border-2 transition-all duration-200",
        isFocused ? "border-accent/50" : "border-border",
        "px-4 py-2",
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
          "flex-shrink-0 p-2 rounded-full",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-accent/10 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "self-end mb-1"
        )}
        aria-label="Grabar audio"
        data-testid="button-mic"
      >
        <Mic className="w-5 h-5" />
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
          "text-base leading-6",
          "placeholder:text-muted-foreground/60",
          "focus:outline-none",
          "disabled:cursor-not-allowed",
          "py-3 px-2",
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
          "w-10 h-10",
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
        <Send className="w-5 h-5" />
      </Button>
    </div>
  );
}
