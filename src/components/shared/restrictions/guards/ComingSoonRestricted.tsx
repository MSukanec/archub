import React from "react";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComingSoonRestrictedProps {
  children: React.ReactNode;
}

export function ComingSoonRestricted({ children }: ComingSoonRestrictedProps) {
  // Clonar el elemento hijo y agregable un badge de candado
  const childElement = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement, {
        // Agregar overlay y badge al elemento hijo
        className: `${(children as React.ReactElement)?.props?.className || ""} relative pointer-events-none opacity-60 cursor-not-allowed`,
      })
    : children;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            {childElement}
            {/* Badge de candado NEGRO en la esquina superior derecha */}
            <div className="absolute -top-2 -right-2 bg-black dark:bg-gray-900 rounded-full p-1 flex items-center justify-center border border-white dark:border-gray-800">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black text-white border-black">
          Próximamente
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ComingSoonRestricted;
