import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BottomSheetFooter,
} from "@/components/ui/bottom-sheet";
import { usePlanFeatures } from "@/hooks/usePlanFeatures";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { useMobile } from "@/hooks/use-mobile";
import { PlanUpgradeModal } from "@/features/organization";

interface PlanRestrictedProps {
  feature?: string;
  current?: number;
  reason?: "general_mode" | string;
  functionName?: string;
  size?: "small" | "large";
  useUpgradeModal?: boolean;
  modalImage?: string;
  modalTitle?: string;
  modalDescription?: string;
  children: React.ReactNode;
}

export function PlanRestricted({
  feature,
  current,
  reason,
  functionName,
  size = "small",
  useUpgradeModal = false,
  modalImage,
  modalTitle,
  modalDescription,
  children,
}: PlanRestrictedProps) {
  const { can, limit } = usePlanFeatures();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const [, setLocation] = useLocation();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);

  // Determine if content is restricted
  // NOTE: Admins del sistema también están sujetos a las restricciones de plan
  const isRestricted = useMemo(() => {
    if (reason === "general_mode") {
      return selectedProjectId === null;
    }
    if (reason) {
      return true;
    }
    if (feature) {
      if (current !== undefined) {
        const featureLimit = limit(feature);
        return featureLimit !== Infinity && current >= featureLimit;
      }
      return !can(feature);
    }
    return false;
  }, [reason, selectedProjectId, feature, current, can, limit]);

  if (!isRestricted) {
    return <>{children}</>;
  }

  // Prepare plan info
  const organizationId = userData?.preferences?.last_organization_id;
  const currentOrganization = userData?.organizations?.find(
    (org) => org.id === organizationId
  );
  const currentPlan = currentOrganization?.plan?.name || "free";

  const getRequiredPlan = (): "pro" | "teams" => {
    if (!feature) return "pro";
    const teamsFeatures = [
      "max_members",
      "team_collaboration",
      "advanced_permissions",
    ];
    if (teamsFeatures.some((f) => feature.includes(f))) {
      return "teams";
    }
    return "pro";
  };

  const requiredPlan = getRequiredPlan();
  const planColors = {
    pro: "hsl(213, 100%, 33%)",
    teams: "hsl(271, 76%, 53%)",
  };
  const planBgColor = planColors[requiredPlan];
  const planName = requiredPlan === "pro" ? "Pro" : "Teams";

  // NEW UPGRADE MODAL
  if (useUpgradeModal) {
    return (
      <>
        <div
          className="relative inline-flex cursor-pointer overflow-visible"
          onClick={() => setOpen(true)}
          data-testid="button-restricted-feature"
        >
          <div className="opacity-60 pointer-events-none">
            {React.cloneElement(children as React.ReactElement, {
              disabled: true,
              className: `${(children as React.ReactElement).props.className || ""} cursor-pointer`,
            })}
          </div>
          <Badge
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg"
            style={{
              backgroundColor: planBgColor,
              color: "white",
            }}
          >
            <Lock className="w-3 h-3" />
          </Badge>
        </div>
        <PlanUpgradeModal
          open={open}
          onOpenChange={setOpen}
          requiredPlan={requiredPlan}
          featureTitle={modalTitle || `Función de Plan ${planName}`}
          featureDescription={
            modalDescription ||
            `Esta función requiere el plan ${planName}. Actualiza tu plan para desbloquear esta característica.`
          }
          featureImage={modalImage || "/features/ft-projects-512.webp"}
          currentLimit={feature ? limit(feature) : undefined}
          currentValue={current}
        />
      </>
    );
  }

  // SMALL SIZE
  if (size === "small") {
    if (isMobile) {
      return (
        <>
          <div
            className="relative inline-flex cursor-pointer overflow-visible"
            onClick={() => setOpen(true)}
          >
            <div className="opacity-60 pointer-events-none">
              {React.cloneElement(children as React.ReactElement, {
                disabled: true,
                className: `${(children as React.ReactElement).props.className || ""} cursor-pointer`,
              })}
            </div>
            <Badge
              className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg"
              style={{
                backgroundColor: planBgColor,
                color: "white",
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
                          : `Esta función no está disponible en tu plan actual.`}
                      </p>
                    </div>
                  </div>
                  {current !== undefined && feature && (
                    <div className="text-sm text-muted-foreground border-t pt-3">
                      Has alcanzado el límite de tu plan: {current} /{" "}
                      {limit(feature)}
                    </div>
                  )}
                </div>
              </BottomSheetBody>
              <BottomSheetFooter>
                <Button
                  type="button"
                  className="w-full"
                  style={{
                    backgroundColor: planBgColor,
                    color: "white",
                  }}
                  onClick={() => {
                    setOpen(false);
                    setLocation("/settings/pricing-plan");
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

    // DESKTOP: Popover
    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative inline-flex cursor-pointer overflow-visible">
            <div className="opacity-60 pointer-events-none">
              {React.cloneElement(children as React.ReactElement, {
                disabled: true,
                className: `${(children as React.ReactElement).props.className || ""} cursor-pointer`,
              })}
            </div>
            <Badge
              className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 h-5 cursor-pointer border-0 shadow-lg"
              style={{
                backgroundColor: planBgColor,
                color: "white",
              }}
            >
              <Lock className="w-3 h-3" />
            </Badge>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" side="right" align="start">
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
                    : `Esta función no está disponible en tu plan actual.`}
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
                type="button"
                size="sm"
                className="flex-1"
                style={{
                  backgroundColor: planBgColor,
                  color: "white",
                }}
                onClick={() => {
                  setLocation("/settings/pricing-plan");
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

  // LARGE SIZE - with overlay
  return (
    <div className="relative w-full">
      <div className="relative w-full">
        <div className="opacity-50 blur-[0.8px] pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-background/50 dark:bg-background/70 rounded-xl" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-full shadow-xl"
          style={{
            backgroundColor: planBgColor,
          }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full border-2"
            style={{ borderColor: "white" }}
          >
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white">
            Requiere Plan {planName}
          </span>
          <Button
            type="button"
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100 border-0 font-medium shadow-sm"
            onClick={() => {
              setLocation("/settings/pricing-plan");
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
