import React from 'react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Badge } from '@/components/ui/badge';
import { Trophy, Building, Calendar, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SubcontractAwardModalProps {
  modalData?: {
    subcontract: any;
    winningBid: any;
    onSuccess?: () => void;
  };
  onClose: () => void;
}

export function SubcontractAwardModal({
  modalData,
  onClose
}: SubcontractAwardModalProps) {
  const { subcontract, winningBid, onSuccess } = modalData || {};
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount || !currency) return '—';
    
    const formatter = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  };

  const handleConfirmAward = async () => {
    if (!subcontract?.id || !winningBid?.id) {
      toast({
        title: "Error",
        description: "Datos incompletos para la adjudicación",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      // Realizar adjudicación completa
      const response = await fetch(`/api/subcontracts/${subcontract.id}/award`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          winner_bid_id: winningBid.id,
          amount_total: winningBid.amount,
          currency_id: winningBid.currency_id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al adjudicar el subcontrato');
      }

      const contactName = winningBid.contacts?.company_name || 
                          winningBid.contacts?.full_name || 
                          `${winningBid.contacts?.first_name || ''} ${winningBid.contacts?.last_name || ''}`.trim() ||
                          'Sin nombre';
      
      toast({
        title: "Subcontrato adjudicado",
        description: `El subcontrato ha sido adjudicado exitosamente a ${contactName}`
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Error awarding subcontract:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo adjudicar el subcontrato",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      {/* Resumen de adjudicación */}
      <div className="bg-muted/30 border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <h3 className="font-semibold">Resumen de Adjudicación</h3>
        </div>
        
        <div className="space-y-4">
          {/* Proveedor ganador */}
          <div className="flex items-start gap-3">
            <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Proveedor ganador</p>
              <p className="text-sm text-muted-foreground">
                {winningBid?.contacts?.company_name || 
                 winningBid?.contacts?.full_name || 
                 `${winningBid?.contacts?.first_name || ''} ${winningBid?.contacts?.last_name || ''}`.trim() ||
                 'Sin nombre'}
              </p>
            </div>
          </div>

          {/* Monto total */}
          <div className="flex items-start gap-3">
            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Monto total</p>
              <p className="text-lg font-bold" style={{ color: 'var(--accent)' }}>
                {formatCurrency(winningBid?.amount, winningBid?.currencies?.code)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {winningBid?.currencies?.code || 'Sin moneda'}
                </Badge>
                {winningBid?.exchange_rate && winningBid.exchange_rate !== 1 && (
                  <span className="text-xs text-muted-foreground">
                    TC: {winningBid.exchange_rate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fecha de presentación */}
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Fecha de presentación</p>
              <p className="text-sm text-muted-foreground">
                {winningBid?.submitted_at 
                  ? format(new Date(winningBid.submitted_at), 'dd/MM/yyyy', { locale: es })
                  : '—'
                }
              </p>
            </div>
          </div>

          {/* Notas adicionales */}
          {winningBid?.notes && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Notas de la oferta</p>
                <p className="text-sm text-muted-foreground">
                  {winningBid.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Advertencia */}
      <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-destructive flex-shrink-0" />
          <h4 className="font-medium text-destructive">Importante</h4>
        </div>
        <p className="text-sm text-muted-foreground">
          Al confirmar la adjudicación, el subcontrato cambiará su estado a "Adjudicado" y 
          no podrá ser modificado. Esta acción es irreversible.
        </p>
      </div>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Confirmar Adjudicación"
      description="Revisa los detalles antes de confirmar la adjudicación del subcontrato"
      icon={Trophy}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isLoading ? "Adjudicando..." : "Confirmar Adjudicación"}
      onRightClick={handleConfirmAward}
      rightDisabled={isLoading}
      rightVariant="default"
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={null}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={false}
      onClose={onClose}
    />
  );
}