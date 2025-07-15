import React from 'react';
import { Button } from "@/components/ui/button";

interface FormModalFooterProps {
  leftLabel?: string;        // Texto del botón izquierdo (opcional) - Cancelar
  onLeftClick?: () => void;
  centerLabel?: string;      // Texto del botón central (opcional) - Reemplazar
  onCenterClick?: () => void;
  rightLabel: string;        // Texto del botón derecho o único - Eliminar/Guardar
  onRightClick: () => void;
}

export function FormModalFooter({
  leftLabel,
  onLeftClick,
  centerLabel,
  onCenterClick,
  rightLabel,
  onRightClick,
}: FormModalFooterProps) {
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto">
      <div className="flex gap-2 w-full">
        {leftLabel && onLeftClick && centerLabel && onCenterClick ? (
          // 3 botones: Cancelar (25%) + Reemplazar (37.5%) + Eliminar (37.5%)
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={onLeftClick}
              className="w-1/4"
            >
              {leftLabel}
            </Button>
            <Button
              type="button"
              onClick={onCenterClick}
              className="flex-1"
            >
              {centerLabel}
            </Button>
            <Button
              type="button"
              onClick={onRightClick}
              className="flex-1"
            >
              {rightLabel}
            </Button>
          </>
        ) : leftLabel && onLeftClick ? (
          // 2 botones: Cancelar (25%) + Guardar (75%)
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={onLeftClick}
              className="w-1/4"
            >
              {leftLabel}
            </Button>
            <Button
              type="button"
              onClick={onRightClick}
              className="w-3/4"
            >
              {rightLabel}
            </Button>
          </>
        ) : (
          // 1 botón: Guardar (100%)
          <Button
            type="button"
            onClick={onRightClick}
            className="w-full"
          >
            {rightLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
