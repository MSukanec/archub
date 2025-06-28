// CustomModalFooter.tsx
import { Button } from "@/components/ui/button";

interface CustomModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  cancelText?: string;
  saveText?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  isLoading?: boolean;
  saveProps?: {
    form?: string;
    type?: "button" | "submit";
    disabled?: boolean;
  };
}

export function CustomModalFooter({
  onCancel,
  onSave,
  cancelText = "Cancelar",
  saveText = "Guardar",
  saveLoading = false,
  saveDisabled = false,
  isLoading = false,
  saveProps,
}: CustomModalFooterProps) {
  return (
    <div className="p-2 border-t border-[var(--card-border)] mt-auto">
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-1/4"
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          onClick={onSave}
          className="w-3/4"
          disabled={saveLoading || saveDisabled || isLoading}
        >
          {(saveLoading || isLoading) ? "Guardando..." : saveText}
        </Button>
      </div>
    </div>
  );
}
