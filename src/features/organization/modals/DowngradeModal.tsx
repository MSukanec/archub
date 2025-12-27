import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowDownCircle, Calendar, ShieldAlert, X, FolderX, UserX, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/features/users/hooks";
import { useProjectContext } from "@/stores/projectContext";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { FormModalLayout } from "@/components/modal";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface DowngradeModalProps {
  modalData?: {
    currentPlan: {
      name: string;
      slug: string;
    };
    targetPlan: {
      name: string;
      slug: string;
      monthly_amount: number;
      annual_amount: number;
    };
    subscriptionEndDate?: string;
    isManualPlan: boolean;
  };
  onClose: () => void;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

// Plan features mapping
const PLAN_FEATURES: Record<string, string[]> = {
  teams: [
    "Múltiples usuarios y asientos",
    "Gestión avanzada de equipos",
    "Reportes personalizados",
    "Integraciones premium",
    "Soporte prioritario"
  ],
  pro: [
    "Proyectos ilimitados",
    "Almacenamiento extendido",
    "Reportes básicos",
    "Integraciones estándar",
    "Soporte estándar"
  ],
  free: []
};

interface PlanLimits {
  maxProjects: number;
  maxMembers: number;
}

interface UsageStats {
  projectsCount: number;
  membersCount: number;
  currentPlanLimits: PlanLimits;
  currentPlanName: string;
  targetPlanLimits?: PlanLimits;
  targetPlanName?: string;
}

export function DowngradeModal({ modalData, onClose }: DowngradeModalProps) {
  const { toast } = useToast();
  const { currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const { currentPlan, targetPlan, subscriptionEndDate, isManualPlan } = modalData || {
    currentPlan: { name: '', slug: '' },
    targetPlan: { name: '', slug: '', monthly_amount: 0, annual_amount: 0 },
    isManualPlan: false
  };

  // Fetch usage stats to calculate impact (includes target plan limits from DB)
  const { data: usageStats, isLoading: isLoadingStats } = useQuery<UsageStats>({
    queryKey: ['/api/organizations', currentOrganizationId, 'usage-stats', targetPlan.slug],
    queryFn: async () => {
      const url = `/api/organizations/${currentOrganizationId}/usage-stats?targetPlan=${encodeURIComponent(targetPlan.slug)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch usage stats');
      return response.json();
    },
    enabled: !!currentOrganizationId && !!targetPlan.slug,
  });

  // Calculate impact based on target plan limits (from DB)
  const impact = useMemo(() => {
    if (!usageStats || !usageStats.targetPlanLimits) {
      return { projectsAtRisk: 0, membersAtRisk: 0, hasImpact: false };
    }
    
    const targetLimits = usageStats.targetPlanLimits;
    
    const projectsAtRisk = targetLimits.maxProjects === Infinity 
      ? 0 
      : Math.max(0, usageStats.projectsCount - targetLimits.maxProjects);
    
    const membersAtRisk = targetLimits.maxMembers === Infinity 
      ? 0 
      : Math.max(0, usageStats.membersCount - targetLimits.maxMembers);
    
    return {
      projectsAtRisk,
      membersAtRisk,
      hasImpact: projectsAtRisk > 0 || membersAtRisk > 0,
      currentProjects: usageStats.projectsCount,
      currentMembers: usageStats.membersCount,
      projectLimit: targetLimits.maxProjects === Infinity ? '∞' : targetLimits.maxProjects,
      memberLimit: targetLimits.maxMembers === Infinity ? '∞' : targetLimits.maxMembers,
    };
  }, [usageStats]);

  // Check if user is the organization owner
  const isOwner = useMemo(() => {
    if (!userData?.user?.id || !userData?.organization) {
      return false;
    }
    
    return userData.organization.owner_id === userData.user.id;
  }, [userData?.user?.id, userData?.organization?.owner_id]);

  // Validation checks
  const validationError = useMemo(() => {
    if (!targetPlan?.slug) {
      return "Plan de destino no válido";
    }
    
    if (!currentOrganizationId) {
      return "No se ha seleccionado una organización";
    }
    
    if (!userData?.user) {
      return "No se pudo verificar tu identidad";
    }
    
    if (!userData?.organization) {
      return "No se pudo verificar la organización";
    }
    
    if (!isOwner) {
      return "Solo el propietario de la organización puede cambiar el plan";
    }
    
    return null;
  }, [targetPlan?.slug, currentOrganizationId, userData?.user, userData?.organization, isOwner]);

  const scheduleDowngradeMutation = useMutation({
    mutationFn: async () => {
      setInlineError(null);
      
      return await apiRequest('POST', '/api/subscriptions/schedule-downgrade', {
        targetPlanSlug: targetPlan.slug
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/current-user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      queryClient.invalidateQueries({ queryKey: ['current-subscription', currentOrganizationId] });
      handleClose();
      setLocation('/organization/billing');
      toast({
        title: "Cambio de plan programado",
        description: `Tu plan cambiará a ${targetPlan.name} al finalizar el período de facturación actual.`,
      });
    },
    onError: (error: any) => {
      let errorMessage = "No se pudo programar el cambio de plan";
      let errorCode = "UNKNOWN";

      const apiError = error as ApiErrorResponse;
      
      if (apiError.error?.message) {
        errorMessage = apiError.error.message;
        errorCode = apiError.error.code || "UNKNOWN";
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }

      setInlineError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleClose = () => {
    setInlineError(null);
    onClose();
  };

  const handleConfirm = () => {
    if (validationError || isManualPlan) return;
    scheduleDowngradeMutation.mutate();
  };

  // Get features that will be lost
  const currentFeatures = PLAN_FEATURES[currentPlan.slug.toLowerCase()] || [];
  const targetFeatures = PLAN_FEATURES[targetPlan.slug.toLowerCase()] || [];
  const lostFeatures = currentFeatures.filter(f => !targetFeatures.includes(f));

  const isConfirmDisabled = 
    scheduleDowngradeMutation.isPending || 
    !!validationError || 
    isManualPlan;

  // Edit panel content
  const editPanel = (
    <div className="space-y-4">
      {/* Validation Error Alert */}
      {validationError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permisos insuficientes</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Manual Plan Warning */}
      {isManualPlan && !validationError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Plan asignado manualmente</AlertTitle>
          <AlertDescription>
            Este plan solo puede gestionarse por soporte. Contacta al equipo de Seencel para cambios.
          </AlertDescription>
        </Alert>
      )}

      {/* Inline API Error */}
      {inlineError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al programar el cambio</AlertTitle>
          <AlertDescription>{inlineError}</AlertDescription>
        </Alert>
      )}

      {/* Downgrade Info */}
      {!validationError && !isManualPlan && (
        <>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ArrowDownCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Cambio de Plan Programado
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Tu plan cambiará de <strong>{currentPlan.name}</strong> a{" "}
                  <strong>{targetPlan.name}</strong> al finalizar tu período de facturación actual.
                </p>
              </div>
            </div>
          </div>

          {/* Effective Date */}
          {subscriptionEndDate && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Fecha efectiva
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(subscriptionEndDate), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resource Impact Warning */}
          {isLoadingStats ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : impact.hasImpact && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Impacto en tus recursos
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Al cambiar al plan {targetPlan.name}, algunos de tus recursos quedarán bloqueados:
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {impact.projectsAtRisk > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 rounded-md px-3 py-2">
                        <FolderX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>
                          <strong>{impact.projectsAtRisk}</strong> proyecto{impact.projectsAtRisk > 1 ? 's' : ''} bloqueado{impact.projectsAtRisk > 1 ? 's' : ''}
                          <span className="text-amber-600 dark:text-amber-400 ml-1">
                            ({impact.currentProjects} actual{impact.currentProjects !== 1 ? 'es' : ''} → límite: {impact.projectLimit})
                          </span>
                        </span>
                      </div>
                    )}
                    {impact.membersAtRisk > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/30 rounded-md px-3 py-2">
                        <UserX className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span>
                          <strong>{impact.membersAtRisk}</strong> miembro{impact.membersAtRisk > 1 ? 's' : ''} bloqueado{impact.membersAtRisk > 1 ? 's' : ''}
                          <span className="text-amber-600 dark:text-amber-400 ml-1">
                            ({impact.currentMembers} actual{impact.currentMembers !== 1 ? 'es' : ''} → límite: {impact.memberLimit})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Los recursos bloqueados quedarán inaccesibles pero no se eliminarán. Podrás recuperar el acceso mejorando tu plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Features Lost */}
          {lostFeatures.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Características que perderás:
              </h4>
              <div className="space-y-2">
                {lostFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <X className="h-4 w-4 text-red-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              Seguirás teniendo acceso a todas las funciones de {currentPlan.name} hasta{" "}
              {subscriptionEndDate
                ? format(new Date(subscriptionEndDate), 'dd MMMM yyyy', { locale: es })
                : 'el final de tu período de facturación'}. 
              Después de esa fecha, tu plan cambiará automáticamente a {targetPlan.name}.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );

  // Header
  const headerContent = (
    <FormModalHeader
      title={`Cambiar a ${targetPlan.name}`}
      description="Programa el cambio de tu plan de suscripción al finalizar tu período actual"
      icon={ArrowDownCircle}
    />
  );

  // Footer
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={scheduleDowngradeMutation.isPending ? "Procesando..." : "Confirmar Cambio"}
      onRightClick={handleConfirm}
      isSubmitting={scheduleDowngradeMutation.isPending}
      submitDisabled={isConfirmDisabled}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div></div>}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
      isEditing={true}
    />
  );
}
