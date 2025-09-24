import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

interface PlanRestrictedProps {
  feature?: string;
  current?: number;
  reason?: "coming_soon" | "general_mode" | string;
  functionName?: string;
  badgeOnly?: boolean; // New prop for mobile badge mode
  adminBypass?: boolean; // Allow admins to click through while maintaining visual restriction
  children: React.ReactNode;
}

export function PlanRestricted({
  feature,
  current,
  reason,
  functionName,
  badgeOnly = false,
  adminBypass = false,
  children,
}: PlanRestrictedProps) {
  const { can, limit } = usePlanFeatures();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { selectedProjectId } = useProjectContext();



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
      const currentOrganization = userData?.organizations?.find(
        (org) => org.id === organizationId,
      );
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

  // Si no está restringido, renderizar directamente
  if (!isRestricted) {
    return <>{children}</>;
  }
  
  // Si está restringido y es badge-only mode, usar tooltip pequeño con estilo disabled
  if (badgeOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative opacity-50 cursor-not-allowed">
              {React.cloneElement(children as React.ReactElement, {
                disabled: true,
                className: `${(children as React.ReactElement).props.className || ''} opacity-60 cursor-not-allowed text-muted-foreground hover:text-muted-foreground hover:bg-transparent`,
                onClick: (e: React.MouseEvent) => {
                  // Si es admin con bypass, permitir el click
                  if (adminBypass && isAdmin) {
                    return; // Permitir comportamiento normal
                  }
                  // Para usuarios comunes, prevenir el click
                  e.preventDefault();
                  e.stopPropagation();
                }
              })}
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="text-xs px-3 py-2 bg-black text-white border-gray-600 shadow-xl z-[9999]" 
            style={{ zIndex: 9999 }}
          >
            próximamente
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Para funciones "coming soon" usar tooltip simple con estilo disabled
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative opacity-50 cursor-not-allowed">
            {React.cloneElement(children as React.ReactElement, {
              disabled: true,
              className: `${(children as React.ReactElement).props.className || ''} opacity-60 cursor-not-allowed text-muted-foreground hover:text-muted-foreground hover:bg-transparent`,
              onClick: (e: React.MouseEvent) => {
                // Si es admin con bypass, permitir el click
                if (adminBypass && isAdmin) {
                  return; // Permitir comportamiento normal
                }
                // Para usuarios comunes, prevenir el click
                e.preventDefault();
                e.stopPropagation();
              }
            })}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="text-xs px-3 py-2 bg-black text-white border-gray-600 shadow-xl z-[9999]" 
          style={{ zIndex: 9999 }}
        >
          próximamente
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PlanRestricted;
