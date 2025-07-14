import React, { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useModalPanelStore } from "./modalPanelStore";

interface FormModalLayoutProps {
  viewPanel?: ReactNode;
  editPanel?: ReactNode;
  subformPanel?: ReactNode;
  onClose: () => void;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
}

export function FormModalLayout({
  viewPanel,
  editPanel,
  subformPanel,
  onClose,
  headerContent,
  footerContent,
  className,
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className={cn(
          "bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl",
          "w-full h-full rounded-none", // Mobile: full viewport
          "md:w-auto md:h-auto md:max-w-screen-2xl md:max-h-[90vh] md:rounded-lg md:mx-auto md:my-12", // Desktop: centered with max width
          "flex flex-col",
          className,
        )}
      >
        {/* Header */}
        {headerContent && (
          <div className="border-b border-[var(--card-border)] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">{headerContent}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 m-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Current Panel Content */}
        <div className="flex-1 overflow-y-auto">
          {getCurrentPanel()}
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
