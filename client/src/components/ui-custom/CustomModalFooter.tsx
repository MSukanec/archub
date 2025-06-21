// CustomModalFooter.tsx
import { Button } from "@/components/ui/button";

interface CustomModalFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  disabled?: boolean;
}

export function CustomModalFooter({
  onCancel,
  onSubmit,
  cancelLabel = "Cancelar",
  submitLabel = "Guardar",
  disabled = false,
}: CustomModalFooterProps) {
  return (
    <div className="p-3 border-t border-[var(--card-border)] mt-auto">
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-1/4"
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          onClick={onSubmit}
          className="w-3/4"
          disabled={disabled}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
