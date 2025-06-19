// CustomModalLayout.tsx
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface CustomModalLayoutProps {
  open: boolean;
  onClose: () => void;
  children: {
    header: React.ReactNode;
    body: React.ReactNode;
    footer: React.ReactNode;
  };
  className?: string;
}

export function CustomModalLayout({
  open,
  onClose,
  children,
  className,
}: CustomModalLayoutProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 flex flex-col bg-[--layout-bg] shadow-2xl transition-all duration-300 ease-in-out",
          "h-full w-full max-w-xl",
          className,
        )}
      >
        {/* Layout vertical con header/footer fijos */}
        <div className="flex flex-col h-full">
          <div className="shrink-0">{children.header}</div>
          <div className="flex-1 min-h-0 overflow-y-auto">{children.body}</div>
          <div className="shrink-0">{children.footer}</div>
        </div>
      </div>
    </div>
  );
}
