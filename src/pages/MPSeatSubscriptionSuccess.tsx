import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function MPSeatSubscriptionSuccess() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preferenceId = params.get('preference_id');
    const preapprovalId = params.get('preapproval_id');
    const status = params.get('status');

    if (!preferenceId && !preapprovalId) {
      setError('Parámetros de pago no encontrados');
      setTimeout(() => setLocation('/organization/members'), 3000);
      return;
    }

    const apiUrl = `/api/checkout/mp/seat-subscription-success?${params.toString()}`;
    
    window.location.href = apiUrl;
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <p className="text-muted-foreground text-sm">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-lg font-medium">Procesando tu pago...</p>
        <p className="text-muted-foreground text-sm">Por favor espera mientras confirmamos tu suscripción.</p>
      </div>
    </div>
  );
}
