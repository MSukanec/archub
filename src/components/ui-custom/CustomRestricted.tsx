import React, { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { getRestrictionMessage } from "@/utils/restrictions";
import { useLocation } from "wouter";

interface CustomRestrictedProps {
  feature?: string;
  current?: number;
  reason?: "coming_soon" | string;
  children: React.ReactNode;
}

export function CustomRestricted({
  feature,
  current,
  reason,
  children,
}: CustomRestrictedProps) {
  const { can, limit } = usePlanFeatures();
  const [, navigate] = useLocation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Remover debug logs

  // Determinar si está restringido
  let isRestricted = false;
  let restrictionKey = "";

  if (reason) {
    // Si hay un reason específico, usar ese
    isRestricted = true;
    restrictionKey = reason;
  } else if (feature) {
    // Verificar límites si se proporcionó current
    if (current !== undefined) {
      const featureLimit = limit(feature);
      // Verificar límite
      
      // Restringir si se alcanzó o superó el límite
      if (featureLimit !== Infinity && current >= featureLimit) {
        isRestricted = true;
        restrictionKey = feature;
      }
    } else {
      // Si no hay current, verificar si la feature está permitida (para features booleanas)
      const featureAllowed = can(feature);
      if (!featureAllowed) {
        isRestricted = true;
        restrictionKey = feature;
      }
    }
  }

  // Si no está restringido, renderizar directamente los children
  if (!isRestricted) {
    return <>{children}</>;
  }

  // Obtener el mensaje de restricción
  const restriction = getRestrictionMessage(restrictionKey);

  const handleActionClick = () => {
    if (restriction.actionUrl) {
      navigate(restriction.actionUrl);
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* Contenido bloqueado - sin efectos hover */}
      <div className="relative opacity-50 pointer-events-none [&_*]:hover:bg-transparent [&_*]:hover:text-inherit [&_*]:hover:scale-100 [&_*]:hover:shadow-none">
        {children}
      </div>

      {/* Overlay con candado que activa hover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/5 cursor-pointer group"
            onMouseEnter={() => setIsPopoverOpen(true)}
            onMouseLeave={() => setIsPopoverOpen(false)}
          >
            <div className="bg-white rounded-full p-1.5 shadow-sm border border-gray-500 group-hover:shadow-md transition-shadow">
              <Lock className="h-3 w-3 text-gray-500" />
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-4 bg-white border shadow-lg" side="top">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Función bloqueada</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {restriction.message}
                </p>
                {current !== undefined && feature && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Límite actual: {current}/{limit(feature) === Infinity ? '∞' : limit(feature)}
                  </p>
                )}
              </div>
            </div>
            
            {restriction.actionLabel && restriction.actionUrl && (
              <Button onClick={handleActionClick} size="sm" className="w-full">
                {restriction.actionLabel}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CustomRestricted;
