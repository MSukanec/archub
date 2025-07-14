import React from 'react';
import { Button } from "@/components/ui/button";

interface FormModalFooterProps {
  leftLabel?: string;      // Texto del botón izquierdo (opcional)
  onLeftClick?: () => void;
  rightLabel: string;      // Texto del botón derecho o único
  onRightClick: () => void;
}

export function FormModalFooter({
  leftLabel,
  onLeftClick,
  rightLabel,
  onRightClick,
}: FormModalFooterProps) {
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto">
      <div className="flex gap-2 w-full">
        {leftLabel && onLeftClick ? (
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
