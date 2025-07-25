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
    // Debug logging temporal
    console.log("🔍 CustomRestricted DEBUG:", {
      reason,
      selectedProjectId,
      isRestricted: selectedProjectId === null,
      functionName
    });
    
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

  // Si no está restringido, renderizar directamente los children
  if (!isRestricted) {
    return <>{children}</>;
  }

  // Plan restrictions (max_members, max_projects, etc.) apply to admins too
  const isPlanRestriction =
    feature &&
    (feature.startsWith("max_") ||
      ["max_members", "max_projects", "max_organizations"].includes(feature));

  // Si es administrador, permitir acceso EXCEPTO para restricciones de plan y "general_mode"
  // Las restricciones de plan se aplican incluso a administradores
  if (isAdmin && reason !== "general_mode" && !isPlanRestriction) {
    return <>{children}</>;
  }

  // Lógica dinámica para determinar el plan objetivo
  let dynamicRestriction = getRestrictionMessage(restrictionKey);

  // Para max_projects, determinar dinámicamente el plan objetivo
  if (restrictionKey === "max_projects") {
    const organizationId = userData?.preferences?.last_organization_id;
    const currentOrganization = userData?.organizations?.find(
      (org) => org.id === organizationId,
    );
    const currentPlan = currentOrganization?.plan?.name;

    if (currentPlan === "Free") {
      // Free → Pro
      dynamicRestriction = {
        ...dynamicRestriction,
        message:
          "Has alcanzado el límite de 2 proyectos de tu plan Free. Actualiza a Pro para 25 proyectos.",
        actionLabel: "Actualizar a Pro",
        planType: "pro" as const,
        iconColor: "white",
        backgroundColor: "hsl(213, 100%, 30%)",
        borderColor: "hsl(213, 100%, 30%)",
      };
    } else if (currentPlan === "Pro") {
      // Pro → Teams
      dynamicRestriction = {
        ...dynamicRestriction,
        message:
          "Has alcanzado el límite de 25 proyectos de tu plan Pro. Actualiza a Teams para proyectos ilimitados.",
        actionLabel: "Actualizar a Teams",
        planType: "teams" as const,
        iconColor: "white",
        backgroundColor: "hsl(271, 76%, 53%)",
        borderColor: "hsl(271, 76%, 53%)",
      };
    }
  }

  // Para max_kanban_boards, determinar dinámicamente el plan objetivo
  if (restrictionKey === "max_kanban_boards") {
    const organizationId = userData?.preferences?.last_organization_id;
    const currentOrganization = userData?.organizations?.find(
      (org) => org.id === organizationId,
    );
    const currentPlan = currentOrganization?.plan?.name;

    if (currentPlan === "Free") {
      // Free → Pro
      dynamicRestriction = {
        ...dynamicRestriction,
        message:
          "Has alcanzado el límite de 1 tablero Kanban de tu plan Free. Actualiza a Pro para 25 tableros.",
        actionLabel: "Actualizar a Pro",
        planType: "pro" as const,
        iconColor: "white",
        backgroundColor: "hsl(213, 100%, 30%)",
        borderColor: "hsl(213, 100%, 30%)",
      };
    } else if (currentPlan === "Pro") {
      // Pro → Teams
      dynamicRestriction = {
        ...dynamicRestriction,
        message:
          "Has alcanzado el límite de 25 tableros Kanban de tu plan Pro. Actualiza a Teams para tableros ilimitados.",
        actionLabel: "Actualizar a Teams",
        planType: "teams" as const,
        iconColor: "white",
        backgroundColor: "hsl(271, 76%, 53%)",
        borderColor: "hsl(271, 76%, 53%)",
      };
    }
  }

  const handleActionClick = () => {
    if (dynamicRestriction.actionUrl) {
      navigate(dynamicRestriction.actionUrl);
    }
    setIsPopoverOpen(false);
  };

  // Determinar icono y estilo según el tipo de restricción
  const isGeneralMode = restrictionKey === "general_mode";
  const BadgeIcon = isGeneralMode ? Building : Lock;

  // Determinar estilo según el plan específico
  let badgeStyle,
    popoverBgColor,
    popoverBorderColor,
    iconColor,
    textColor,
    subtextColor;

  if (isGeneralMode) {
    badgeStyle = {
      backgroundColor: "var(--accent)",
      borderColor: "var(--accent)",
    };
    popoverBgColor = "var(--accent)";
    popoverBorderColor = "var(--accent)";
    iconColor = "white";
    textColor = "white";
    subtextColor = "rgba(255, 255, 255, 0.8)";
  } else if (dynamicRestriction.planType === "teams") {
    // Estilo específico para plan Teams (morado)
    badgeStyle = {
      backgroundColor: dynamicRestriction.backgroundColor,
      borderColor: dynamicRestriction.borderColor,
    };
    popoverBgColor = dynamicRestriction.backgroundColor;
    popoverBorderColor = dynamicRestriction.borderColor;
    iconColor = "white";
    textColor = "white";
    subtextColor = "rgba(255, 255, 255, 0.9)";
  } else if (dynamicRestriction.planType === "pro") {
    // Estilo específico para plan Pro (azul)
    badgeStyle = {
      backgroundColor: dynamicRestriction.backgroundColor,
      borderColor: dynamicRestriction.borderColor,
    };
    popoverBgColor = dynamicRestriction.backgroundColor;
    popoverBorderColor = dynamicRestriction.borderColor;
    iconColor = "white";
    textColor = "white";
    subtextColor = "rgba(255, 255, 255, 0.9)";
  } else {
    // Estilo por defecto (negro)
    badgeStyle = { backgroundColor: "black", borderColor: "black" };
    popoverBgColor = "hsl(0, 0%, 10%)";
    popoverBorderColor = "hsl(0, 0%, 25%)";
    iconColor = "white";
    textColor = "hsl(0, 0%, 95%)";
    subtextColor = "hsl(0, 0%, 70%)";
  }

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
              style={{
                ...badgeStyle,
                // Forzar que el badge siempre tenga fondo circular visible
                border: `1px solid ${badgeStyle.borderColor}`,
                backgroundColor: badgeStyle.backgroundColor,
              }}
            >
              <BadgeIcon className="h-3 w-3" style={{ color: iconColor }} />
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-64 p-3 shadow-xl rounded-2xl"
          style={{
            backgroundColor: popoverBgColor,
            border: `1px solid ${popoverBorderColor}`,
            borderRadius: "16px",
          }}
          side="top"
          sideOffset={-2}
          onMouseEnter={() => setIsPopoverOpen(true)}
          onMouseLeave={() => setIsPopoverOpen(false)}
        >
          <div className="flex items-start gap-2">
            <div
              className="rounded-full p-1 flex-shrink-0"
              style={{
                backgroundColor: isGeneralMode
                  ? "rgba(255, 255, 255, 0.2)"
                  : dynamicRestriction.planType === "teams"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "hsl(var(--accent), 0.2)",
              }}
            >
              <BadgeIcon
                className="h-3 w-3"
                style={{
                  color: isGeneralMode
                    ? "white"
                    : dynamicRestriction.planType === "teams"
                      ? "white"
                      : "hsl(var(--accent))",
                }}
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm" style={{ color: textColor }}>
                {isGeneralMode
                  ? functionName
                    ? `${functionName} - Requiere Proyecto`
                    : "Requiere Proyecto"
                  : functionName
                    ? `${functionName} - Función Bloqueada`
                    : "Función Bloqueada"}
              </h4>
              <p className="text-xs mt-1" style={{ color: subtextColor }}>
                {isGeneralMode
                  ? "Esta sección está únicamente disponible con un proyecto seleccionado."
                  : dynamicRestriction.message}
              </p>
              {!isGeneralMode &&
                dynamicRestriction.actionLabel &&
                dynamicRestriction.actionUrl && (
                  <button
                    onClick={handleActionClick}
                    className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors hover:bg-white/10"
                    style={{
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      backgroundColor: "transparent",
                    }}
                  >
                    {dynamicRestriction.actionLabel}
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
