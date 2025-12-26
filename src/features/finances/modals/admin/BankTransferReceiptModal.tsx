import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useGlobalModalStore } from "@/components/modal";
import { useModalPanelStore } from "@/components/modal";
import { FormModalLayout } from "@/components/modal";
import { FormModalHeader } from "@/components/modal";
import { FormModalFooter } from "@/components/modal";
import { FormModalBody } from "@/components/modal";
import { Receipt, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
interface BankTransferReceiptModalProps {
  btpId: string;
  paymentId: string;
  hasReceipt?: boolean;
}
export default function BankTransferReceiptModal({
  btpId,
  paymentId,
  hasReceipt = true,
}: BankTransferReceiptModalProps) {
  const { closeModal } = useGlobalModalStore();
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);
  const { data: signedUrlData, isLoading: loadingUrl, error: urlError } = useQuery({
    queryKey: ['/api/admin/bank-transfer/receipt', btpId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/admin/bank-transfer/receipt/${btpId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch receipt');
      }
      return response.json() as Promise<{ signed_url: string }>;
    },
    enabled: !!btpId && hasReceipt,
    staleTime: 30 * 60 * 1000,
  });
  const receiptUrl = signedUrlData?.signed_url || null;
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
      closeModal();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aprobar el pago',
        variant: 'destructive',
      });
    },
  });
  const handleSubmit = () => {
    approvePaymentMutation.mutate(paymentId);
  };
  const handleCancel = () => {
    closeModal();
  };
  const isPDF = receiptUrl?.toLowerCase().endsWith('.pdf');
  const headerContent = (
    <FormModalHeader 
      title="Comprobante de Transferencia"
      icon={Receipt}
    />
  );
  const editPanel = (
    <FormModalBody columns={1} className="p-0">
      <div className="w-full px-6 py-4" style={{ height: 'calc(100vh - 250px)', minHeight: '500px'}}>
        {!hasReceipt ? (
          <div className="w-full h-full border rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <div className="flex flex-col items-center gap-3 text-center px-8">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Receipt className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-amber-800 dark:text-amber-200 font-medium">Sin comprobante adjunto</p>
              <p className="text-amber-600 dark:text-amber-400 text-sm max-w-md">
                Este pago no tiene un comprobante de transferencia adjunto. 
                Puedes aprobarlo igualmente si el usuario te confirmó el pago por otro medio.
              </p>
            </div>
          </div>
        ) : loadingUrl ? (
          <div className="w-full h-full border rounded-lg flex items-center justify-center bg-muted">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Cargando comprobante...</p>
            </div>
          </div>
        ) : urlError ? (
          <div className="w-full h-full border rounded-lg flex items-center justify-center bg-muted">
            <p className="text-red-500">Error al cargar el comprobante</p>
          </div>
        ) : receiptUrl ? (
          isPDF ? (
            <iframe
              src={receiptUrl}
              className="w-full h-full border rounded-lg"
              title="Comprobante de pago"
            />
          ) : (
            <img
              src={receiptUrl}
              alt="Comprobante de pago"
              className="w-full h-full object-contain border rounded-lg bg-muted"
            />
          )
        ) : (
          <div className="w-full h-full border rounded-lg flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">No hay comprobante disponible</p>
          </div>
        )}
      </div>
    </FormModalBody>
  );
  const isLoadingReceipt = hasReceipt && loadingUrl;
  
  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={handleCancel}
      submitText="Aprobar Pago"
      onSubmit={handleSubmit}
      submitDisabled={approvePaymentMutation.isPending || isLoadingReceipt}
      showLoadingSpinner={approvePaymentMutation.isPending}
    />
  );
  return (
    <FormModalLayout
      wide={true}
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={closeModal}
    />
  );
}
