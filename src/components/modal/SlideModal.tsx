import React, { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  SlideNavigationProvider,
  useSlideNavigation,
} from "./useSlideNavigation";

interface SlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  views?: Record<string, React.ReactNode>;
  initialView?: string;
  useCustomLayout?: boolean;
  children?: React.ReactNode;
}

export default function SlideModal({
  isOpen,
  onClose,
  views,
  initialView = "main",
  useCustomLayout = false,
  children,
}: SlideModalProps) {
  // fallback para evitar error si views es undefined
  const safeViews = views ?? { main: null };
  const viewKeys = Object.keys(safeViews);

  // previene scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "p-0 max-w-lg w-full bg-background rounded-xl shadow-xl overflow-hidden",
          "transition-all duration-300 ease-in-out",
        )}
      >
        {useCustomLayout ? (
          children
        ) : (
          <SlideNavigationProvider initialView={initialView}>
            <SlideModalContent views={safeViews} />
          </SlideNavigationProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SlideModalContent({
  views,
}: {
  views: Record<string, React.ReactNode>;
}) {
  const { activeView, direction } = useSlideNavigation();
  const viewKeys = Object.keys(views);

  return (
    <div className="relative w-full h-full">
      <div className="relative overflow-hidden">
        {viewKeys.map((viewKey) => (
          <div
            key={viewKey}
            className={cn(
              "absolute inset-0 transition-transform duration-300 ease-in-out w-full",
              {
                "translate-x-0 z-10": activeView === viewKey,
                "translate-x-full z-0":
                  direction === "forward" && activeView !== viewKey,
                "-translate-x-full z-0":
                  direction === "backward" && activeView !== viewKey,
              },
            )}
          >
            {views[viewKey]}
          </div>
        ))}
      </div>
    </div>
  );
}
