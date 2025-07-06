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
  onEnterSubmit?: () => void;
}

export function CustomModalLayout({
  open,
  onClose,
  children,
  className,
  onEnterSubmit,
}: CustomModalLayoutProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "Escape") {
        onClose();
      }
      
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && onEnterSubmit) {
        e.preventDefault();
        onEnterSubmit();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose, onEnterSubmit]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/85 transition-opacity duration-600 ease-in-out"
        onClick={onClose}
        style={{ zIndex: 99998 }}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-[99999] flex flex-col bg-[var(--card-bg)] shadow-2xl transition-all duration-300 ease-in-out border border-[var(--card-border)]",
          // Mobile: fullscreen
          "w-full h-full",
          // Desktop: normal modal size with max width and rounded corners
          "md:w-auto md:h-auto md:max-w-2xl md:min-w-[600px] md:max-h-[90vh] md:rounded-lg",
          className,
        )}
        style={{ zIndex: 99999 }}
      >
        {/* Layout vertical con header/footer fijos */}
        <div className="flex flex-col h-full">
          {children?.header && (
            <div className="shrink-0">{children.header}</div>
          )}
          {children?.body && (
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {children.body}
            </div>
          )}
          {children?.footer && (
            <div className="shrink-0">{children.footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
