import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

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
  placeholder = "¿Qué te gustaría saber hoy?",
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
    
    // Calcular nueva altura (max 150px aprox 6 líneas)
    const newHeight = Math.min(textarea.scrollHeight, 150);
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

  return (
    <div 
      className={cn(
        "relative flex items-center gap-3",
        "w-full rounded-2xl",
        "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl",
        "border border-white/20 dark:border-white/10",
        "px-4 sm:px-5 py-3.5 sm:py-4",
        "transition-all duration-300",
        isFocused && "shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-white/30 dark:border-white/20",
        !isFocused && "shadow-[0_2px_8px_rgb(0,0,0,0.04),inset_0_1px_0_rgb(255,255,255,0.2)]",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      style={{
        boxShadow: isFocused 
          ? '0 8px 30px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.05)'
          : '0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.03)'
      }}
      data-testid="smart-chat-input-container"
    >
      {/* Ícono de búsqueda (izquierda) */}
      <div className="flex-shrink-0 text-muted-foreground/60">
        <Search className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

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
          "text-foreground/90 placeholder:text-muted-foreground/50",
          "focus:outline-none",
          "disabled:cursor-not-allowed",
          "max-h-[150px] overflow-y-auto"
        )}
        style={{
          minHeight: '20px',
          scrollbarWidth: 'thin'
        }}
        data-testid="input-chat-message"
      />

      {/* Atajo de teclado (derecha) */}
      <div className="flex-shrink-0 flex items-center gap-1 text-muted-foreground/40 text-xs">
        <Command className="w-3 h-3" />
        <span>+</span>
        <span className="font-mono">/</span>
      </div>
    </div>
  );
}
