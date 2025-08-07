import React from 'react';
import { Button } from "@/components/ui/button";

interface FormModalFooterProps {
  leftLabel?: string;      // Texto del botón izquierdo (opcional)
  onLeftClick?: () => void;
  rightLabel?: string;     // Texto del botón derecho o único
  onRightClick?: () => void;
  // Nueva API simplificada para casos comunes
  cancelText?: string;
  submitText?: string;
  onSubmit?: () => void;
  submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  submitDisabled?: boolean;
  showLoadingSpinner?: boolean;
}

export function FormModalFooter({
  leftLabel,
  onLeftClick,
  rightLabel,
  onRightClick,
  // Nueva API
  cancelText,
  submitText,
  onSubmit,
  submitVariant = "default",
  submitDisabled = false,
  showLoadingSpinner = false,
}: FormModalFooterProps) {
  // Si usamos la nueva API, usa esos valores
  const finalLeftLabel = cancelText || leftLabel;
  const finalRightLabel = submitText || rightLabel;
  const finalOnLeftClick = onLeftClick; // Permite manejar el cierre desde el componente padre
  const finalOnRightClick = onSubmit || onRightClick;
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto relative z-0">
      <div className="flex gap-2 w-full">
        {finalLeftLabel && finalOnLeftClick ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={finalOnLeftClick}
              className="w-1/4"
            >
              {finalLeftLabel}
            </Button>
            <Button
              type="button"
              variant={submitVariant}
              onClick={finalOnRightClick}
              className="w-3/4"
              disabled={submitDisabled}
            >
              {showLoadingSpinner ? 'Cargando...' : finalRightLabel}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant={submitVariant}
            onClick={finalOnRightClick}
            className="w-full"
            disabled={submitDisabled}
          >
            {showLoadingSpinner ? 'Cargando...' : finalRightLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
