// CustomModalLayout.tsx
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ModalChildren {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
}

interface CustomModalLayoutProps {
  open: boolean;
  onClose: () => void;
  children: ModalChildren;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/85 transition-opacity duration-600 ease-in-out"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 bg-[var(--card-bg)] shadow-2xl transition-all duration-300 ease-in-out border border-[var(--card-border)]",
          // Mobile: fullscreen
          "w-full h-full flex flex-col",
          // Desktop: normal modal size with max width and rounded corners
          "md:w-auto md:h-auto md:max-w-2xl md:min-w-[600px] md:max-h-[90vh] md:rounded-lg md:flex md:flex-col",
          className,
        )}
      >
        {children?.header && (
          <div className="flex-shrink-0">{children.header}</div>
        )}
        {children?.body && (
          <div className="flex-1 overflow-y-auto min-h-0">{children.body}</div>
        )}
        {children?.footer && (
          <div className="flex-shrink-0">{children.footer}</div>
        )}
      </div>
    </div>
  );
}
