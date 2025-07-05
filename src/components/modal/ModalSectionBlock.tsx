import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalSectionBlockProps {
  title: string;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  icon?: React.ReactNode;
  hideIfEmpty?: boolean;
  isEmpty?: boolean;
  className?: string;
}

export default function ModalSectionBlock({
  title,
  children,
  onAdd,
  addLabel = "Añadir",
  icon,
  hideIfEmpty = false,
  isEmpty = false,
  className
}: ModalSectionBlockProps) {
  // Si está configurado para ocultarse cuando está vacío y está vacío, no renderizar nada
  if (hideIfEmpty && isEmpty) {
    return null;
  }

  const IconComponent = icon || <PlusCircle className="h-4 w-4" />;

  return (
    <div 
      className={cn(
        "border border-[var(--muted)] rounded-xl p-4 space-y-2",
        "bg-[var(--muted)]/30",
        "transition-colors duration-200",
        className
      )}
    >
      {/* Header con título y botón añadir */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--muted-foreground)]">
          {title}
        </h3>
        
        {onAdd && (
          <Button
            variant="link"
            size="sm"
            onClick={onAdd}
            className={cn(
              "h-auto p-0",
              "text-sm font-medium",
              "text-[var(--foreground)] hover:text-[var(--accent)]",
              "hover:underline",
              "flex items-center gap-1.5"
            )}
            aria-label={`${addLabel} ${title.toLowerCase()}`}
          >
            {IconComponent}
            {addLabel}
          </Button>
        )}
      </div>

      {/* Contenido de la sección */}
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}