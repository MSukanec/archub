import React from 'react';
import { Button } from "@/components/ui/button";

interface FormModalFooterProps {
  cancelText?: string;
  submitText: string;
  onSubmit: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function FormModalFooter({
  cancelText,
  submitText,
  onSubmit,
  onCancel,
  isLoading = false,
}: FormModalFooterProps) {
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto">
      <div className="flex gap-2 w-full">
        {cancelText && onCancel ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="w-1/4"
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              onClick={onSubmit}
              className="w-3/4"
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : submitText}
            </Button>
          </>
        ) : (
          <Button
            type="submit"
            onClick={onSubmit}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : submitText}
          </Button>
        )}
      </div>
    </div>
  );
}
