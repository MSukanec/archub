import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Eye, AlertCircle, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Tabs } from '@/components/ui-custom/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface BankTransferPayment {
  id: string;
  user_id: string;
  course_price_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt_url: string | null;
  created_at: string;
  users: {
    id: string;
    full_name: string | null;
    email: string;
  };
  course_prices: {
    id: string;
    amount: number;
    currency_code: string;
    months: number;
    courses: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

const AdminPaymentsTransfersTab = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [receiptModal, setReceiptModal] = useState<{ open: boolean; url: string | null }>({ open: false, url: null });
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; payment: BankTransferPayment | null; action: 'approve' | 'reject' }>({ 
    open: false, 
    payment: null, 
    action: 'approve' 
  });

  const { toast } = useToast();

  const { data: payments = [], isLoading } = useQuery<BankTransferPayment[]>({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve payment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      toast({
        title: 'Pago aprobado',
        description: 'El pago ha sido aprobado y el usuario ha sido inscrito al curso.',
      });
      setConfirmAction({ open: false, payment: null, action: 'approve' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aprobar el pago',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = (payment: BankTransferPayment) => {
    setConfirmAction({ open: true, payment, action: 'approve' });
  };

  const handleViewReceipt = (url: string | null) => {
    if (!url) {
      toast({
        title: 'Sin comprobante',
        description: 'Este pago no tiene comprobante adjunto',
        variant: 'destructive',
      });
      return;
    }
    setReceiptModal({ open: true, url });
  };

  const filteredPayments = statusFilter === 'all' 
    ? payments 
    : payments.filter(p => p.status === statusFilter);

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '12%',
      render: (payment: BankTransferPayment) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(payment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      width: '20%',
      render: (payment: BankTransferPayment) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {payment.users?.full_name || 'Sin nombre'}
          </span>
          <span className="text-xs text-muted-foreground">{payment.users?.email}</span>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Producto',
      width: '25%',
      render: (payment: BankTransferPayment) => (
        <span className="text-sm">{payment.course_prices?.courses?.title || 'N/A'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '12%',
      render: (payment: BankTransferPayment) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: payment.currency,
              minimumFractionDigits: 0,
            }).format(payment.amount)}
          </span>
          <span className="text-xs text-muted-foreground">{payment.currency}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      width: '13%',
      render: (payment: BankTransferPayment) => {
        if (payment.status === 'pending') {
          return (
            <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-text))] border-[hsl(var(--warning))]">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pendiente
            </Badge>
          );
        }
        if (payment.status === 'approved') {
          return (
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aprobado
            </Badge>
          );
        }
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '18%',
      render: (payment: BankTransferPayment) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleViewReceipt(payment.receipt_url)}
            data-testid={`button-view-receipt-${payment.id}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          {payment.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => handleApprove(payment)}
              data-testid={`button-approve-${payment.id}`}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aprobar
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const filterTabs = [
    { value: 'all', label: `Todos (${payments.length})` },
    { value: 'pending', label: `Pendientes (${pendingCount})` },
    { value: 'approved', label: `Aprobados (${payments.filter(p => p.status === 'approved').length})` },
    { value: 'rejected', label: `Rechazados (${payments.filter(p => p.status === 'rejected').length})` },
  ];

  return (
    <div className="space-y-4">
      {/* Filtros con Tabs */}
      <Tabs
        tabs={filterTabs}
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
      />

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        emptyStateConfig={{
          icon: <Inbox />,
          title: isLoading ? 'Cargando...' : 'No hay pagos',
          description: statusFilter === 'all' 
            ? 'No se han registrado pagos por transferencia bancaria.'
            : `No hay pagos ${statusFilter === 'pending' ? 'pendientes' : statusFilter === 'approved' ? 'aprobados' : 'rechazados'}.`
        }}
      />

      {/* Modal de comprobante */}
      <Dialog open={receiptModal.open} onOpenChange={(open) => setReceiptModal({ open, url: null })}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Transferencia</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {receiptModal.url && (
              receiptModal.url.endsWith('.pdf') ? (
                <iframe
                  src={receiptModal.url}
                  className="w-full h-[600px] border rounded"
                  title="Comprobante de pago"
                />
              ) : (
                <img
                  src={receiptModal.url}
                  alt="Comprobante de pago"
                  className="w-full h-auto max-h-[600px] object-contain border rounded"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmación */}
      <AlertDialog open={confirmAction.open} onOpenChange={(open) => !open && setConfirmAction({ open, payment: null, action: 'approve' })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Pago</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas aprobar este pago?
              <br />
              <br />
              El usuario <strong>{confirmAction.payment?.users?.full_name || confirmAction.payment?.users?.email}</strong> será inscrito automáticamente en el curso <strong>{confirmAction.payment?.course_prices?.courses?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction.payment) {
                  approvePaymentMutation.mutate(confirmAction.payment.id);
                }
              }}
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPaymentsTransfersTab;
