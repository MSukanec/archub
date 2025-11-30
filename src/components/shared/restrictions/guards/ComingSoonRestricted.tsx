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
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Wrapper que bloquea interacción y muestra el badge */}
          <div className="relative w-full inline-block overflow-visible">
            {/* Overlay invisible que bloquea clicks */}
            <div className="absolute inset-0 pointer-events-auto z-10" />
            
            {/* Contenido con opacidad reducida */}
            <div className="opacity-60 pointer-events-none">
              {children}
            </div>
            
            {/* Badge de candado NEGRO esquina superior derecha */}
            <div className="absolute -top-2 -right-2 bg-black dark:bg-gray-900 rounded-full p-1 flex items-center justify-center border border-white dark:border-gray-800 z-20">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="bg-black text-white border-black z-[9999]">
          Próximamente
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ComingSoonRestricted;
