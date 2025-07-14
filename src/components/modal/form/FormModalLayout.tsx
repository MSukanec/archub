import React, { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalPanelStore } from "./modalPanelStore";
import FormModalBody from "./FormModalBody";

interface FormModalLayoutProps {
  viewPanel?: ReactNode;
  editPanel?: ReactNode;
  subformPanel?: ReactNode;
  onClose: () => void;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  columns?: number;
}

export function FormModalLayout({
  viewPanel,
  editPanel,
  subformPanel,
  onClose,
  headerContent,
  footerContent,
  className,
  columns = 2,
}: FormModalLayoutProps) {
  const { currentPanel } = useModalPanelStore();

  const getCurrentPanel = () => {
    switch (currentPanel) {
      case "view":
        return viewPanel;
      case "edit":
        return editPanel;
      case "subform":
        return subformPanel;
      default:
        return viewPanel;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={cn(
          "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl",
          "w-full h-full rounded-none", // Mobile: full viewport
          "md:w-auto md:h-auto md:min-w-[600px] md:max-w-screen-2xl md:max-h-[90vh] md:rounded-lg md:mx-auto md:my-12", // Desktop: centered with max width
          "flex flex-col",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {headerContent && (
          <div className="shrink-0 relative">
            {headerContent}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Current Panel Content */}
        <div className="flex-1 overflow-hidden">
          <FormModalBody columns={columns}>{getCurrentPanel()}</FormModalBody>
        </div>

        {/* Footer */}
        {footerContent && (
          <div className="shrink-0">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
}
