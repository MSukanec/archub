import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowDownCircle, Calendar, ShieldAlert, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export function DowngradeModal({ modalData, onClose }: DowngradeModalProps) {
  const { toast } = useToast();
  const { currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { currentPlan, targetPlan, subscriptionEndDate, isManualPlan } = modalData || {
    currentPlan: { name: '', slug: '' },
    targetPlan: { name: '', slug: '', monthly_amount: 0, annual_amount: 0 },
    isManualPlan: false
  };

  // Check if user is admin in current organization
  const isAdmin = useMemo(() => {
    if (!currentOrganizationId || !userData?.memberships) {
      return false;
    }
    
    const membership = userData.memberships.find(
      m => m.organization_id === currentOrganizationId
    );
    
    if (!membership) {
      return false;
    }
    
    const roleName = membership.role?.name?.toLowerCase();
    return roleName === 'admin' || roleName === 'administrator';
  }, [currentOrganizationId, userData?.memberships]);

  // Validation checks
  const validationError = useMemo(() => {
    if (!targetPlan?.slug) {
      return "Plan de destino no válido";
    }
    
    if (!currentOrganizationId) {
      return "No se ha seleccionado una organización";
    }
    
    if (!userData?.memberships || userData.memberships.length === 0) {
      return "No se pudo verificar tu membresía";
    }
    
    const membership = userData.memberships.find(
      m => m.organization_id === currentOrganizationId
    );
    
    if (!membership) {
      return "No tienes membresía en esta organización";
    }
    
    if (!isAdmin) {
      return "Solo los administradores pueden cambiar el plan";
    }
    
    return null;
  }, [targetPlan?.slug, currentOrganizationId, userData?.memberships, isAdmin]);

  const scheduleDowngradeMutation = useMutation({
    mutationFn: async () => {
      setInlineError(null);
      
      return await apiRequest('/api/subscriptions/schedule-downgrade', 'POST', {
        target_plan_slug: targetPlan.slug
      });
    },
    onSuccess: () => {
      toast({
        title: "Downgrade programado",
        description: `Tu plan cambiará a ${targetPlan.name} al finalizar el período actual.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/current-user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      handleClose();
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
      isRightDisabled={isConfirmDisabled}
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
