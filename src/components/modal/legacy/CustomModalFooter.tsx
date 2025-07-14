// CustomModalFooter.tsx
import { Button } from "@/components/ui/button";

interface CustomModalFooterProps {
  onCancel: () => void;
  onSave?: () => void;
  onSubmit?: () => void | Promise<void>;
  cancelText?: string;
  saveText?: string;
  submitText?: string;
  saveLoading?: boolean;
  saveDisabled?: boolean;
  isLoading?: boolean;
  form?: string;
  saveProps?: {
    form?: string;
    type?: "button" | "submit";
    disabled?: boolean;
  };
}

export function CustomModalFooter({
  onCancel,
  onSave,
  onSubmit,
  cancelText = "Cancelar",
  saveText = "Guardar",
  submitText = "Guardar",
  saveLoading = false,
  saveDisabled = false,
  isLoading = false,
  form,
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
          type={saveProps?.type || (form ? "submit" : "button")}
          onClick={saveProps?.type === "submit" || form ? undefined : (onSubmit || onSave)}
          form={saveProps?.form || form}
          className="w-3/4"
          disabled={saveLoading || saveDisabled || isLoading || saveProps?.disabled}
        >
          {(saveLoading || isLoading) ? "Guardando..." : (submitText || saveText)}
        </Button>
      </div>
    </div>
  );
}
