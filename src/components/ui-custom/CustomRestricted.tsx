import React, { useState } from "react";
import { Lock, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { getRestrictionMessage } from "@/utils/restrictions";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useProjectContext } from "@/stores/projectContext";

interface CustomRestrictedProps {
  feature?: string;
  current?: number;
  reason?: "coming_soon" | "general_mode" | string;
  functionName?: string;
  children: React.ReactNode;
}

export function CustomRestricted({
  feature,
  current,
  reason,
  functionName,
  children,
}: CustomRestrictedProps) {
  const { can, limit } = usePlanFeatures();
  const [, navigate] = useLocation();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Datos del usuario para debug
  const { data: userData } = useCurrentUser();
  
  // Verificar proyecto seleccionado
  const { selectedProjectId } = useProjectContext();

  // Verificar si el usuario es administrador
  const isAdmin = useIsAdmin();

  // Determinar si está restringido
  let isRestricted = false;
  let restrictionKey = "";

  if (reason === "general_mode") {
    // Verificar si estamos en modo general (sin proyecto seleccionado)
    if (selectedProjectId === null) {
      isRestricted = true;
      restrictionKey = "general_mode";
    }
  } else if (reason) {
    // Si hay un reason específico, usar ese
    isRestricted = true;
    restrictionKey = reason;
  } else if (feature) {
    // Verificar límites si se proporcionó current
    if (current !== undefined) {
      const featureLimit = limit(feature);

      // Obtener plan igual que en usePlanFeatures
      const organizationId = userData?.preferences?.last_organization_id;
      const currentOrganization = userData?.organizations?.find(org => org.id === organizationId);
      const currentPlan = currentOrganization?.plan;

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



  // Plan restrictions (max_members, max_projects, etc.) apply to admins too
  const isPlanRestriction = feature && (feature.startsWith('max_') || ['max_members', 'max_projects', 'max_organizations'].includes(feature));

  // Si es administrador, permitir acceso EXCEPTO para restricciones de plan y "general_mode"
  // Las restricciones de plan se aplican incluso a administradores
  if (isAdmin && reason !== "general_mode" && !isPlanRestriction) {

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

  // Determinar icono y estilo según el tipo de restricción
  const isGeneralMode = restrictionKey === "general_mode";
  const BadgeIcon = isGeneralMode ? Building : Lock;
  const badgeStyle = isGeneralMode ? {
    backgroundColor: 'var(--accent)',
    borderColor: 'var(--accent)'
  } : {
    backgroundColor: 'black',
    borderColor: 'black'
  };

  return (
    <div className="relative w-full">
      {/* Contenido bloqueado - sin efectos hover */}
      <div className="relative opacity-50 pointer-events-none [&_*]:hover:bg-transparent [&_*]:hover:text-inherit [&_*]:hover:scale-100 [&_*]:hover:shadow-none">
        {children}
      </div>

      {/* Overlay con badge que activa hover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/5 cursor-pointer group"
            onMouseEnter={() => setIsPopoverOpen(true)}
            onMouseLeave={() => setIsPopoverOpen(false)}
          >
            <div 
              className="rounded-full p-1.5 shadow-sm border group-hover:shadow-md transition-shadow"
              style={badgeStyle}
            >
              <BadgeIcon className={`h-3 w-3 ${isGeneralMode ? 'text-white' : 'text-white'}`} />
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-64 p-3 shadow-xl rounded-2xl"
          style={{
            backgroundColor: isGeneralMode ? 'var(--accent)' : 'hsl(0, 0%, 10%)',
            border: isGeneralMode ? '1px solid var(--accent)' : '1px solid hsl(0, 0%, 25%)',
            borderRadius: '16px'
          }}
          side="top"
        >
          <div className="flex items-start gap-2">
            <div 
              className="rounded-full p-1 flex-shrink-0"
              style={{
                backgroundColor: isGeneralMode ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--accent), 0.2)',
              }}
            >
              <BadgeIcon 
                className="h-3 w-3" 
                style={{ color: isGeneralMode ? 'white' : 'hsl(var(--accent))' }}
              />
            </div>
            <div className="flex-1">
              <h4 
                className="font-medium text-sm" 
                style={{ color: isGeneralMode ? 'white' : 'hsl(0, 0%, 95%)' }}
              >
                {isGeneralMode 
                  ? (functionName ? `${functionName} - Requiere Proyecto` : 'Requiere Proyecto')
                  : (functionName ? `${functionName} - Función Bloqueada` : 'Función Bloqueada')
                }
              </h4>
              <p 
                className="text-xs mt-1"
                style={{ color: isGeneralMode ? 'rgba(255, 255, 255, 0.8)' : 'hsl(0, 0%, 70%)' }}
              >
                {isGeneralMode 
                  ? 'Esta sección está únicamente disponible con un proyecto seleccionado.'
                  : restriction.message
                }
              </p>
              {!isGeneralMode && restriction.actionLabel && restriction.actionUrl && (
                <button
                  onClick={handleActionClick}
                  className="text-xs hover:underline mt-1"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  {restriction.actionLabel}
                </button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default CustomRestricted;
