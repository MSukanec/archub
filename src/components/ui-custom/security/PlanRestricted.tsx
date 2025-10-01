import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useIsAdmin } from "@/hooks/use-admin-permissions";

interface PlanRestrictedProps {
  feature?: string;
  current?: number;
  reason?: "coming_soon" | "general_mode" | string;
  functionName?: string;
  badgeOnly?: boolean;
  adminBypass?: boolean;
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

  if (reason === "coming_soon") {
    isRestricted = true;
    restrictionKey = "coming_soon";
  } else if (reason === "general_mode") {
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

  // ADMIN BYPASS: Los administradores siempre pueden acceder aunque se vea disabled
  if (isAdmin) {
    return (
      <div className="opacity-40">
        {children}
      </div>
    );
  }

  // CASO: COMING SOON - Solo deshabilitar sin decoración
  if (reason === "coming_soon") {
    return (
      <div className="opacity-40 pointer-events-none cursor-not-allowed">
        {React.cloneElement(children as React.ReactElement, {
          disableHover: true,
          onClick: undefined
        })}
      </div>
    );
  }

  // CASO: RESTRICCIÓN DE PLAN - Popover con upgrade
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
                console.log("Upgrade to", requiredPlan);
              }}
            >
              Mejorar Plan
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
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

export default PlanRestricted;