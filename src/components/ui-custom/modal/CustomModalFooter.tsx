// CustomModalFooter.tsx
import { Button } from "@/components/ui/button";

interface CustomModalFooterProps {
  onCancel: () => void;
  onSave: () => void;
  cancelText?: string;
  saveText?: string;
  saveLoading?: boolean;
}

export function CustomModalFooter({
  onCancel,
  onSave,
  cancelText = "Cancelar",
  saveText = "Guardar",
  saveLoading = false,
}: CustomModalFooterProps) {
  return (
    <div className="p-3 border-t border-[var(--card-border)] mt-auto">
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
          disabled={saveLoading}
        >
          {saveLoading ? "Guardando..." : saveText}
        </Button>
      </div>
    </div>
  );
}
