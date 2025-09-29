import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

type RestrictionType = "coming-soon" | "plan";

interface PlanRestrictedProps {
  type: RestrictionType;
  feature?: string;
  current?: number;
  reason?: "coming_soon" | "general_mode" | string;
  functionName?: string;
  badgeOnly?: boolean;
  adminBypass?: boolean;
  children: React.ReactNode;
}

export function PlanRestricted({
  type,
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
    if (selectedProjectId === null) {
      isRestricted = true;
      restrictionKey = "general_mode";
    }
  } else if (reason) {
    isRestricted = true;
    restrictionKey = reason;
  } else if (feature) {
    if (current !== undefined) {
      const featureLimit = limit(feature);

      const organizationId = userData?.preferences?.last_organization_id;
      const currentOrganization = userData?.organizations?.find(
        (org) => org.id === organizationId,
      );
      const currentPlan = currentOrganization?.plan;

      if (featureLimit !== Infinity && current >= featureLimit) {
        isRestricted = true;
        restrictionKey = feature;
      }
    } else {
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

  // TIPO: COMING SOON - Badge simple "Próximamente"
  if (type === "coming-soon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-flex">
              <div className="opacity-50 cursor-not-allowed">
                {React.cloneElement(children as React.ReactElement, {
                  disabled: true,
                  className: `${(children as React.ReactElement).props.className || ''} opacity-60 cursor-not-allowed text-muted-foreground hover:text-muted-foreground hover:bg-transparent`,
                  onClick: (e: React.MouseEvent) => {
                    if (adminBypass && isAdmin) {
                      return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                  }
                })}
              </div>
              {/* Badge "Próximamente" */}
              <Badge 
                className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 h-5 bg-blue-500 hover:bg-blue-500 border-blue-600"
                variant="default"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Próximamente
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="text-xs px-3 py-2 bg-black text-white border-gray-600 shadow-xl z-[9999]" 
            style={{ zIndex: 9999 }}
          >
            Esta función estará disponible próximamente
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // TIPO: PLAN - Sistema completo con candado, popover, upgrade
  if (type === "plan") {
    const organizationId = userData?.preferences?.last_organization_id;
    const currentOrganization = userData?.organizations?.find(
      (org) => org.id === organizationId,
    );
    const currentPlan = currentOrganization?.plan || "free";
    
    // Determinar el plan requerido
    const requiredPlan = restrictionKey.includes("premium") ? "premium" : "pro";
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative inline-flex cursor-pointer">
            <div className="opacity-60 pointer-events-none">
              {React.cloneElement(children as React.ReactElement, {
                disabled: true,
                className: `${(children as React.ReactElement).props.className || ''} opacity-70 cursor-pointer`,
              })}
            </div>
            {/* Badge con candado */}
            <Badge 
              className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 h-5 bg-amber-500 hover:bg-amber-500 border-amber-600 cursor-pointer"
              variant="default"
            >
              <Lock className="w-3 h-3 mr-1" />
              {requiredPlan === "premium" ? "Premium" : "Pro"}
            </Badge>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-4" 
          side="right"
          align="start"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  Función de Plan {requiredPlan === "premium" ? "Premium" : "Pro"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {feature 
                    ? `Esta función requiere el plan ${requiredPlan === "premium" ? "Premium" : "Pro"}. Tu plan actual: ${currentPlan}.`
                    : `Esta función no está disponible en tu plan actual.`
                  }
                </p>
              </div>
            </div>
            
            {current !== undefined && feature && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Has alcanzado el límite de tu plan: {current} / {limit(feature)}
              </div>
            )}
            
            <div className="flex gap-2 pt-2 border-t">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => {
                  // TODO: Abrir modal de upgrade o navegar a pricing
                  console.log("Upgrade to", requiredPlan);
                }}
              >
                Mejorar Plan
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // TODO: Ver comparación de planes
                  console.log("Ver planes");
                }}
              >
                Ver Planes
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Fallback - no debería llegar aquí
  return <>{children}</>;
}

export default PlanRestricted;