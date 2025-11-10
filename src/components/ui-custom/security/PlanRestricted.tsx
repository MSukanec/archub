import React, { useState } from "react";
import { useLocation } from "wouter";
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
  BottomSheetFooter
} from '@/components/ui/bottom-sheet';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useMobile } from '@/hooks/use-mobile';

interface PlanRestrictedProps {
  feature?: string;
  current?: number;
  reason?: "coming_soon" | "general_mode" | string;
  functionName?: string;
  size?: "small" | "large";
  adminBypass?: boolean;
  children: React.ReactNode;
}

export function PlanRestricted({
  feature,
  current,
  reason,
  functionName,
  size = "small",
  adminBypass = false,
  children,
}: PlanRestrictedProps) {
  const { can, limit } = usePlanFeatures();
  const { data: userData } = useCurrentUser();
  const isAdmin = useIsAdmin();
  const { selectedProjectId } = useProjectContext();
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);

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

  // CASO: COMING SOON
  // Los admins SÍ pueden acceder (bypass), usuarios normales NO
  if (reason === "coming_soon") {
    if (isAdmin) {
      // Admin bypass: permitir acceso pero con opacidad reducida
      return (
        <div className="opacity-40">
          {children}
        </div>
      );
    }
    
    // Usuario normal: bloquear completamente
    return (
      <div className="opacity-40 pointer-events-none cursor-not-allowed">
        {React.cloneElement(children as React.ReactElement, {
          disableHover: true,
          onClick: undefined
        })}
      </div>
    );
  }

  // CASO: RESTRICCIÓN DE PLAN - Overlay con blur + Badge + Popover
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === organizationId,
  );
  const currentPlan = currentOrganization?.plan?.name || "free";
  
  // Determinar el plan requerido basado en el feature
  const getRequiredPlan = (): 'pro' | 'teams' => {
    if (!feature) return 'pro';
    
    // Features que requieren Teams
    const teamsFeatures = [
      'max_members',
      'team_collaboration',
      'advanced_permissions',
    ];
    
    if (teamsFeatures.some(f => feature.includes(f))) {
      return 'teams';
    }
    
    return 'pro';
  };

  const requiredPlan = getRequiredPlan();
  
  // Colores según el plan requerido
  const planColors = {
    pro: 'hsl(213, 100%, 33%)',    // Azul
    teams: 'hsl(271, 76%, 53%)',   // Morado
  };

  const planBgColor = planColors[requiredPlan];
  const planName = requiredPlan === 'pro' ? 'Pro' : 'Teams';

  // VERSIÓN SMALL: Badge pequeño con solo candado
  if (size === 'small') {
    // MOBILE: Usar BottomSheet
    if (isMobile) {
      return (
        <>
          <div 
            className="relative inline-flex cursor-pointer overflow-visible"
            onClick={() => setOpen(true)}
          >
            {/* Contenido deshabilitado */}
            <div className="opacity-60 pointer-events-none">
              {React.cloneElement(children as React.ReactElement, {
                disabled: true,
                className: `${(children as React.ReactElement).props.className || ''} cursor-pointer`,
              })}
            </div>
            
            {/* Badge pequeño - DENTRO del contenedor */}
            <Badge 
              className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg"
              style={{ 
                backgroundColor: planBgColor,
                color: 'white'
              }}
            >
              <Lock className="w-3 h-3" />
            </Badge>
          </div>
          
          <BottomSheet open={open} onOpenChange={setOpen}>
            <BottomSheetContent>
              <BottomSheetHeader>
                <BottomSheetTitle>Función de Plan {planName}</BottomSheetTitle>
              </BottomSheetHeader>
              <BottomSheetBody>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ 
                        backgroundColor: `${planBgColor}20`,
                      }}
                    >
                      <Lock 
                        className="w-5 h-5" 
                        style={{ color: planBgColor }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {feature 
                          ? `Esta función requiere el plan ${planName}. Tu plan actual: ${currentPlan}.`
                          : `Esta función no está disponible en tu plan actual.`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {current !== undefined && feature && (
                    <div className="text-sm text-muted-foreground border-t pt-3">
                      Has alcanzado el límite de tu plan: {current} / {limit(feature)}
                    </div>
                  )}
                </div>
              </BottomSheetBody>
              <BottomSheetFooter>
                <Button 
                  className="w-full"
                  style={{ 
                    backgroundColor: planBgColor,
                    color: 'white'
                  }}
                  onClick={() => {
                    setOpen(false);
                    setLocation('/pricing');
                  }}
                >
                  Ver Planes
                </Button>
              </BottomSheetFooter>
            </BottomSheetContent>
          </BottomSheet>
        </>
      );
    }
    
    // DESKTOP: Mantener Popover actual
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative inline-flex cursor-pointer overflow-visible">
            {/* Contenido deshabilitado */}
            <div className="opacity-60 pointer-events-none">
              {React.cloneElement(children as React.ReactElement, {
                disabled: true,
                className: `${(children as React.ReactElement).props.className || ''} cursor-pointer`,
              })}
            </div>
            
            {/* Badge pequeño - DENTRO del contenedor */}
            <Badge 
              className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg"
              style={{ 
                backgroundColor: planBgColor,
                color: 'white'
              }}
            >
              <Lock className="w-3 h-3" />
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
              <div 
                className="p-2 rounded-lg"
                style={{ 
                  backgroundColor: `${planBgColor}20`,
                }}
              >
                <Lock 
                  className="w-5 h-5" 
                  style={{ color: planBgColor }}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">
                  Función de Plan {planName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {feature 
                    ? `Esta función requiere el plan ${planName}. Tu plan actual: ${currentPlan}.`
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
                style={{ 
                  backgroundColor: planBgColor,
                  color: 'white'
                }}
                onClick={() => {
                  setLocation('/pricing');
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

  // VERSIÓN LARGE: Overlay con blur + Badge centrado con texto y botón
  return (
    <div className="relative w-full">
      {/* Contenido con blur */}
      <div className="relative w-full">
        <div className="opacity-50 blur-[0.8px] pointer-events-none select-none">
          {children}
        </div>
        
        {/* Overlay oscuro semi-transparente */}
        <div className="absolute inset-0 bg-background/50 dark:bg-background/70 rounded-xl" />
      </div>
      
      {/* Badge centrado - UNA LÍNEA HORIZONTAL */}
      <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
        <div 
          className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-xl"
          style={{ 
            backgroundColor: planBgColor,
          }}
        >
          {/* Candado con borde circular blanco */}
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-full border-2"
            style={{ borderColor: 'white' }}
          >
            <Lock className="w-4 h-4 text-white" />
          </div>
          
          {/* Texto blanco */}
          <span className="text-sm font-medium text-white">
            Requiere Plan {planName}
          </span>
          
          {/* Botón blanco con texto negro */}
          <Button 
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100 border-0 font-medium shadow-sm"
            onClick={() => {
              setLocation('/pricing');
            }}
          >
            Ver Planes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PlanRestricted;
