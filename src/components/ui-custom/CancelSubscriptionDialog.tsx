import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
  planName: string;
  expiresAt?: string;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  planName,
  expiresAt,
}: CancelSubscriptionDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const CONFIRM_WORD = 'CANCELAR';
  const isConfirmed = confirmText === CONFIRM_WORD;

  const handleConfirm = () => {
    if (isConfirmed && !loading) {
      onConfirm();
      setConfirmText('');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setConfirmText('');
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">Cancelar Suscripción</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-2">
            <p className="text-base">
              ¿Estás seguro que deseas cancelar tu suscripción al plan <span className="font-semibold">{planName}</span>?
            </p>
            
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">
                Qué sucede cuando cancelas:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Tu suscripción se cancelará inmediatamente</li>
                <li>
                  {expiresAt 
                    ? `Mantendrás acceso a las funciones premium hasta ${new Date(expiresAt).toLocaleDateString('es-AR')}`
                    : 'Mantendrás acceso a las funciones premium hasta el final del período de facturación actual'
                  }
                </li>
                <li>No se renovará automáticamente</li>
                <li>Después de la fecha de expiración, tu plan volverá a Free</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-cancel" className="text-sm font-medium">
                Para confirmar, escribe <span className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded">{CONFIRM_WORD}</span> a continuación:
              </Label>
              <Input
                id="confirm-cancel"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder={CONFIRM_WORD}
                className="font-mono"
                autoComplete="off"
                data-testid="input-confirm-cancel"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} data-testid="button-cancel-dialog">
            Volver
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={!isConfirmed || loading}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-cancel"
          >
            {loading ? 'Cancelando...' : 'Cancelar Suscripción'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
