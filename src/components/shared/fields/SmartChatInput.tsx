import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Search, ArrowUp, Mic, MicOff } from "lucide-react";
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
  placeholder = "¿Qué quieres hacer?",
  disabled = false,
  className
}: SmartChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

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

  // Inicializar Web Speech API
  useEffect(() => {
    // Verificar si el navegador soporta Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("🎤 Web Speech API no está soportada en este navegador");
      return;
    }

    // Crear instancia de reconocimiento de voz solo una vez
    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Se detiene automáticamente después de detectar silencio
      recognition.interimResults = true; // Mostrar resultados parciales mientras habla
      recognition.lang = "es-AR"; // Español (Argentina)

      recognitionRef.current = recognition;
    }

    // Actualizar los event handlers con las últimas referencias
    const recognition = recognitionRef.current;

    // Evento cuando se detecta voz
    recognition.onresult = (event: any) => {
      let transcript = "";
      
      // Concatenar todos los resultados
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      console.log("🎤 Transcripción:", transcript);
      
      // Actualizar el input con el texto transcripto
      onChange(value + (value ? " " : "") + transcript);
    };

    // Evento cuando termina de escuchar
    recognition.onend = () => {
      console.log("🎤 Reconocimiento de voz finalizado");
      setIsListening(false);
    };

    // Evento de error
    recognition.onerror = (event: any) => {
      console.error("🎤 Error en reconocimiento de voz:", event.error);
      setIsListening(false);
    };

    // Cleanup al desmontar
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [value, onChange, isListening]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit();
      }
    }
  };

  // Toggle reconocimiento de voz
  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      console.warn("🎤 Reconocimiento de voz no disponible");
      return;
    }

    if (isListening) {
      console.log("🎤 Deteniendo reconocimiento de voz...");
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      console.log("🎤 Iniciando reconocimiento de voz...");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("🎤 Error al iniciar reconocimiento:", error);
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
        "px-4 sm:px-5 py-3 sm:py-3.5",
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

      {/* Botón de micrófono */}
      <button
        type="button"
        onClick={toggleVoiceRecognition}
        disabled={disabled}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-full",
          "transition-all duration-200",
          isListening 
            ? "bg-red-500 text-white animate-pulse" 
            : "bg-muted hover:bg-[hsl(var(--accent))] text-muted-foreground hover:text-[hsl(var(--accent-foreground))]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label={isListening ? "Detener grabación" : "Iniciar grabación de voz"}
        data-testid="button-voice-input"
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Botón de enviar (derecha) */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        className={cn(
          "flex-shrink-0 p-1.5 rounded-full",
          "bg-muted hover:bg-[hsl(var(--accent))] transition-all duration-200",
          "text-muted-foreground hover:text-[hsl(var(--accent-foreground))]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
        aria-label="Enviar mensaje"
        data-testid="button-send-message"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}
