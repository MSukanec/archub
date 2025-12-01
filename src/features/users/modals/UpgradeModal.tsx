import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpCircle, ShieldAlert, Sparkles, Check, Gift } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from "@/stores/projectContext";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { FormModalLayout } from "@/components/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

interface UpgradeModalProps {
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
    billingPeriod: 'monthly' | 'annual';
    isManualPlan: boolean;
  };
  onClose: () => void;
}

interface ProrationResult {
  hasActiveSubscription: boolean;
  currentPlan: {
    id: string;
    name: string;
    slug: string;
  } | null;
  currentSubscription: {
    id: string;
    started_at: string;
    expires_at: string;
    billing_period: string;
    amount: number;
    currency: string;
  } | null;
  credit: {
    daysRemaining: number;
    totalDays: number;
    percentageRemaining: number;
    creditAmount: number;
    creditCurrency: string;
  } | null;
  targetPlan: {
    id: string;
    name: string;
    slug: string;
    priceUSD: number;
    priceARS: number;
  };
  finalPrice: {
    usd: number;
    ars: number;
  };
  savings: {
    usd: number;
    ars: number;
  };
}

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

export function UpgradeModal({ modalData, onClose }: UpgradeModalProps) {
  const { toast } = useToast();
  const { currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const [, navigate] = useLocation();
  
  const [prorationData, setProrationData] = useState<ProrationResult | null>(null);
  const [isLoadingProration, setIsLoadingProration] = useState(true);
  const [prorationError, setProrationError] = useState<Error | null>(null);

  const { currentPlan, targetPlan, billingPeriod, isManualPlan } = modalData || {
    currentPlan: { name: '', slug: '' },
    targetPlan: { name: '', slug: '', monthly_amount: 0, annual_amount: 0 },
    billingPeriod: 'annual' as const,
    isManualPlan: false
  };

  useEffect(() => {
    const loadProration = async () => {
      if (!currentOrganizationId || !targetPlan.slug) {
        setIsLoadingProration(false);
        return;
      }

      try {
        setIsLoadingProration(true);
        setProrationError(null);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setIsLoadingProration(false);
          return;
        }

        const response = await fetch('/api/checkout/calculate-proration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            organization_id: currentOrganizationId,
            target_plan_slug: targetPlan.slug,
            billing_period: billingPeriod,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to calculate proration');
        }
        
        const data = await response.json();
        setProrationData(data.data);
      } catch (error) {
        console.error('[UpgradeModal] Proration error:', error);
        setProrationError(error as Error);
      } finally {
        setIsLoadingProration(false);
      }
    };

    loadProration();
  }, [currentOrganizationId, targetPlan.slug, billingPeriod]);

  const isOwner = useMemo(() => {
    if (!userData?.user?.id || !userData?.organization) {
      return false;
    }
    return userData.organization.owner_id === userData.user.id;
  }, [userData?.user?.id, userData?.organization?.owner_id]);

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

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    if (validationError || isManualPlan) return;
    navigate(`/subscription/checkout?plan=${targetPlan.slug}&billing=${billingPeriod}`);
    onClose();
  };

  const targetFeatures = PLAN_FEATURES[targetPlan.slug?.toLowerCase()] || [];
  const currentFeatures = PLAN_FEATURES[currentPlan.slug?.toLowerCase()] || [];
  const newFeatures = targetFeatures.filter(f => !currentFeatures.includes(f));

  const hasProration = prorationData?.hasActiveSubscription && prorationData?.credit && prorationData.credit.creditAmount > 0;
  const isAnnual = billingPeriod === 'annual';

  const isConfirmDisabled = !!validationError || isManualPlan || isLoadingProration;

  const editPanel = (
    <div className="space-y-4">
      {validationError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Permisos insuficientes</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {isManualPlan && !validationError && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Plan asignado manualmente</AlertTitle>
          <AlertDescription>
            Este plan solo puede gestionarse por soporte. Contacta al equipo de Seencel para cambios.
          </AlertDescription>
        </Alert>
      )}

      {prorationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al calcular</AlertTitle>
          <AlertDescription>No se pudo calcular el precio. Intenta de nuevo.</AlertDescription>
        </Alert>
      )}

      {!validationError && !isManualPlan && (
        <>
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                  Mejora tu Plan
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Estás por mejorar de <strong>{currentPlan.name}</strong> a{" "}
                  <strong>{targetPlan.name}</strong>. El cambio será inmediato.
                </p>
              </div>
            </div>
          </div>

          {isLoadingProration ? (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
          ) : prorationData && (
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Resumen de Precio
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Precio {targetPlan.name} ({isAnnual ? 'Anual' : 'Mensual'})
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">
                    USD ${prorationData.targetPlan.priceUSD.toFixed(2)}
                  </span>
                </div>

                {hasProration && prorationData.credit && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      Crédito por {prorationData.credit.daysRemaining} días restantes
                    </span>
                    <span className="font-medium">
                      - USD ${prorationData.savings.usd.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 dark:text-gray-100 font-semibold">
                      Total a pagar
                    </span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      USD ${prorationData.finalPrice.usd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAnnual && (
            <div className="bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                    Beneficios de Fundador Incluidos
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Con tu suscripción anual recibirás acceso anticipado a nuevas funciones, 
                    un curso de capacitación exclusivo y más beneficios permanentes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {newFeatures.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Nuevas características que obtendrás:
              </h4>
              <div className="space-y-2">
                {newFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Acceso Inmediato</AlertTitle>
            <AlertDescription>
              Una vez completado el pago, tendrás acceso inmediato a todas las 
              funciones de {targetPlan.name}. Tu período de facturación comenzará hoy.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader
      title={`Mejorar a ${targetPlan.name}`}
      description="Revisa los detalles de tu mejora de plan antes de continuar"
      icon={ArrowUpCircle}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isLoadingProration ? "Calculando..." : "Continuar al Pago"}
      onRightClick={handleConfirm}
      isSubmitting={false}
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
