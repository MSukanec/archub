import React, { useState } from "react";
import { Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetBody,
  BottomSheetFooter,
} from "@/components/ui/bottom-sheet";
import { useMobile } from "@/hooks/use-mobile";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
interface BlockedRestrictedProps {
  isBlocked: boolean;
  title?: string;
  message?: string;
  children: React.ReactNode;
}
export function BlockedRestricted({
  isBlocked,
  title = "No disponible",
  message = "Este contenido no está disponible en este momento.",
  children,
}: BlockedRestrictedProps) {
  const isAdmin = useIsAdmin();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);
  if (!isBlocked) {
    return <>{children}</>;
  }
  if (isAdmin) {
    return (
      <div className="opacity-60">
        {children}
      </div>
    );
  }
  if (isMobile) {
    return (
      <>
        <div
          className="relative inline-flex cursor-pointer overflow-visible"
          onClick={() => setOpen(true)}
          data-testid="button-blocked-content"
        >
          <div className="opacity-40 pointer-events-none">
            {React.cloneElement(children as React.ReactElement, {
              disabled: true,
              className: `${(children as React.ReactElement).props.className || ""} cursor-pointer`,
            })}
          </div>
          <Badge
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg bg-muted-foreground text-background"
          >
            <Ban className="w-3 h-3" />
          </Badge>
        </div>
        <BottomSheet open={open} onOpenChange={setOpen}>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>{title}</BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetBody>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Ban className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Entendido
              </Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      </>
    );
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className="relative inline-flex cursor-pointer overflow-visible"
          data-testid="button-blocked-content"
        >
          <div className="opacity-40 pointer-events-none">
            {React.cloneElement(children as React.ReactElement, {
              disabled: true,
              className: `${(children as React.ReactElement).props.className || ""} cursor-pointer`,
            })}
          </div>
          <Badge
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg bg-muted-foreground text-background"
          >
            <Ban className="w-3 h-3" />
          </Badge>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" side="top" align="center">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Ban className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
              <p className="text-xs text-muted-foreground">
                {message}
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
export default BlockedRestricted;
