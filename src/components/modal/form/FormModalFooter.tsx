import React from 'react';

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
    <div className="p-2 h-10 mt-auto border-t border-[var(--card-border)]">
      <div className="flex gap-2 w-full h-full">
        {leftLabel && onLeftClick ? (
          <>
            <button
              onClick={onLeftClick}
              className="w-1/4 h-full text-xs px-2 rounded bg-background border hover:bg-accent transition-colors"
            >
              {leftLabel}
            </button>
            <button
              onClick={onRightClick}
              className="w-3/4 h-full text-xs px-2 rounded bg-lime-500 text-white hover:bg-lime-600 transition-colors"
            >
              {rightLabel}
            </button>
          </>
        ) : (
          <button
            onClick={onRightClick}
            className="w-full h-full text-xs px-2 rounded bg-lime-500 text-white hover:bg-lime-600 transition-colors"
          >
            {rightLabel}
          </button>
        )}
      </div>
    </div>
  );
}
