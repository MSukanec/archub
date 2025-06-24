import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
import { getRestrictionMessage } from '@/utils/restrictions';
import { useLocation } from 'wouter';

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
  children
}: CustomRestrictedProps) {
  const { can, limit } = usePlanFeatures();
  const [, navigate] = useLocation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Determinar si está restringido
  let isRestricted = false;
  let restrictionKey = '';

  if (reason) {
    // Si hay un reason específico, usar ese
    isRestricted = true;
    restrictionKey = reason;
  } else if (feature) {
    // Verificar si la feature está permitida
    const featureAllowed = can(feature);
    
    if (!featureAllowed) {
      isRestricted = true;
      restrictionKey = feature;
    } else if (current !== undefined) {
      // Verificar límites si se proporcionó current
      const featureLimit = limit(feature);
      if (featureLimit !== Infinity && current >= featureLimit) {
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
    <div className="relative">
      {/* Contenido con efecto de restricción */}
      <div className="relative blur-[2px] pointer-events-none opacity-60">
        {children}
      </div>

      {/* Overlay con candado */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button 
            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors rounded-md cursor-pointer"
            onClick={() => setIsPopoverOpen(true)}
          >
            <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-sm">Funcionalidad restringida</h4>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {restriction.message}
            </p>
            
            {restriction.actionLabel && restriction.actionUrl && (
              <Button 
                onClick={handleActionClick}
                size="sm"
                className="w-full"
              >
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