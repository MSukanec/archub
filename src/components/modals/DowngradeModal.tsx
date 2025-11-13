import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowDownCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  subscriptionEndDate?: string; // ISO date string
  isManualPlan: boolean; // Si es plan asignado manualmente (no tiene suscripción)
}

export function DowngradeModal({
  isOpen,
  onClose,
  currentPlan,
  targetPlan,
  subscriptionEndDate,
  isManualPlan
}: DowngradeModalProps) {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const scheduleDowngradeMutation = useMutation({
    mutationFn: async () => {
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
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error al programar downgrade",
        description: error.message || "No se pudo programar el cambio de plan",
        variant: "destructive"
      });
    }
  });

  const handleConfirm = () => {
    if (isManualPlan) {
      // Para planes manuales, mostrar mensaje de contactar soporte
      toast({
        title: "Contacta a soporte",
        description: "Para cambiar tu plan asignado manualmente, contacta a nuestro equipo de soporte.",
      });
      onClose();
    } else {
      scheduleDowngradeMutation.mutate();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "el final de tu período de facturación";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <ArrowDownCircle className="h-6 w-6 text-orange-600 dark:text-orange-500" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Cambiar a {targetPlan.name}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                De {currentPlan.name} a {targetPlan.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Advertencia de cuándo se hace efectivo */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Cambio programado
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {isManualPlan ? (
                    "Tu plan ha sido asignado manualmente. Contacta a soporte para realizar cambios."
                  ) : (
                    <>
                      Tu plan cambiará a <span className="font-semibold">{targetPlan.name}</span> el{" "}
                      <span className="font-semibold">{formatDate(subscriptionEndDate)}</span>.
                      Seguirás disfrutando de {currentPlan.name} hasta esa fecha.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Advertencias sobre funcionalidades que perderá */}
          {!isManualPlan && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Ten en cuenta lo siguiente:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                    {currentPlan.name === 'Teams' && targetPlan.name === 'Pro' && (
                      <>
                        <li>Perderás acceso a múltiples usuarios/asientos</li>
                        <li>Solo el administrador tendrá acceso</li>
                        <li>Se reducirán los límites de proyectos y almacenamiento</li>
                      </>
                    )}
                    {currentPlan.name === 'Pro' && targetPlan.name === 'Free' && (
                      <>
                        <li>Se reducirán tus límites de proyectos a 3</li>
                        <li>Almacenamiento limitado a 500 MB</li>
                        <li>Perderás acceso a funciones avanzadas</li>
                      </>
                    )}
                    {currentPlan.name === 'Teams' && targetPlan.name === 'Free' && (
                      <>
                        <li>Perderás acceso a múltiples usuarios</li>
                        <li>Límites drásticamente reducidos (3 proyectos, 500 MB)</li>
                        <li>Perderás todas las funciones avanzadas</li>
                      </>
                    )}
                    <li>No se realizará ningún reembolso del período actual</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={scheduleDowngradeMutation.isPending}
            data-testid="button-cancel-downgrade"
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={scheduleDowngradeMutation.isPending}
            data-testid="button-confirm-downgrade"
          >
            {isManualPlan ? "Contactar Soporte" : "Programar Cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
