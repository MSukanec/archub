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
          <div className="relative w-full inline-block overflow-visible cursor-not-allowed">
            {/* Overlay invisible que bloquea clicks */}
            <div className="absolute inset-0 pointer-events-auto z-10" />
            
            {/* Contenido con opacidad reducida */}
            <div className="opacity-50 pointer-events-none">
              {children}
            </div>
            
            {/* Badge pequeño y sutil - ícono de candado en la esquina inferior derecha */}
            <div className="absolute -bottom-1 -right-1 bg-yellow-500 dark:bg-yellow-600 rounded-full p-0.5 flex items-center justify-center border border-yellow-600 dark:border-yellow-700 z-[9999] shadow-lg pointer-events-none">
              <Lock className="w-2.5 h-2.5 text-gray-900" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="bg-gray-900 text-white border-gray-800 z-[9999]">
          Próximamente
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ComingSoonRestricted;
