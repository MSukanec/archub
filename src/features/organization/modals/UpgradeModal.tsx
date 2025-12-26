import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpCircle, ShieldAlert, Check, Gift } from "lucide-react";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { FormModalLayout } from "@/components/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpgradeForm, type UpgradeFormData, type UseUpgradeFormProps } from "../forms/UpgradeForm";

interface UpgradeModalProps {
  modalData?: UpgradeFormData;
  onClose: () => void;
}

function formatLimit(value: number | null | undefined): string {
  if (value === null || value === undefined || value === -1 || value >= 9999) return 'Ilimitados';
  return String(value);
}

function formatStorage(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return '—';
  if (mb >= 1024) {
    const gb = (mb / 1024).toFixed(0);
    return `${gb} GB`;
  }
  return `${mb} MB`;
}

function formatFileSize(mb: number | null | undefined): string {
  if (mb === null || mb === undefined) return '—';
  if (mb >= 1024) {
    const gb = (mb / 1024).toFixed(1);
    return `${gb} GB`;
  }
  return `${mb} MB`;
}

export function UpgradeModal({ modalData, onClose }: UpgradeModalProps) {
  const formData = modalData || {
    currentPlan: { name: '', slug: '' },
    targetPlan: { name: '', slug: '', monthly_amount: 0, annual_amount: 0, features: {} },
    billingPeriod: 'annual' as const,
    isManualPlan: false
  };

  const {
    prorationData,
    isLoadingProration,
    prorationError,
    validationError,
    isManualPlan,
    hasProration,
    isConfirmDisabled,
    handleConfirm,
    userData,
  } = useUpgradeForm({ formData, onClose });

  const { currentPlan, targetPlan, billingPeriod } = formData;
  const isAnnual = billingPeriod === 'annual';

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
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Resumen de Precio
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Precio {targetPlan.name} ({isAnnual ? 'Anual' : 'Mensual'})
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  USD ${(isAnnual ? targetPlan.annual_amount : targetPlan.monthly_amount).toFixed(2)}
                </span>
              </div>

              {isLoadingProration && currentPlan.slug !== 'free' && (
                <div className="flex justify-between items-center text-gray-500">
                  <span className="flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    Calculando crédito...
                  </span>
                  <Skeleton className="h-4 w-16" />
                </div>
              )}

              {!isLoadingProration && hasProration && prorationData?.credit && (
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
                  {isLoadingProration ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      USD ${(prorationData?.finalPrice?.usd ?? (isAnnual ? targetPlan.annual_amount : targetPlan.monthly_amount)).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isAnnual && !userData?.organization?.settings?.is_founder && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    Beneficios de Fundador Incluidos
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Con tu suscripción anual recibirás acceso anticipado a nuevas funciones, 
                    un curso de capacitación exclusivo y más beneficios permanentes.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Incluido en {targetPlan.name}:
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>{formatLimit(targetPlan.features?.max_projects)} proyectos</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>{formatStorage(targetPlan.features?.max_storage_mb)} de almacenamiento</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>Archivos de hasta {formatFileSize(targetPlan.features?.max_file_size_mb)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-green-500" />
                <span>{formatLimit(targetPlan.features?.max_members)} miembros</span>
              </div>
            </div>
          </div>
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
      onLeftClick={onClose}
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
      onClose={onClose}
      isEditing={true}
    />
  );
}
