import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import FormModalBody from "@/components/modal/form/FormModalBody";
import { Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface BankTransferReceiptModalProps {
  receiptUrl: string | null;
  paymentId: string;
}

export default function BankTransferReceiptModal({
  receiptUrl,
  paymentId,
}: BankTransferReceiptModalProps) {
  const { closeModal } = useGlobalModalStore();
  const { setPanel } = useModalPanelStore();
  const { toast } = useToast();
  
  useEffect(() => {
    setPanel('edit');
  }, [setPanel]);

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
      <div className="w-full px-6 py-4" style={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
        {receiptUrl ? (
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

  const footerContent = (
    <FormModalFooter
      cancelText="Cancelar"
      onLeftClick={handleCancel}
      submitText="Aprobar Pago"
      onSubmit={handleSubmit}
      submitDisabled={approvePaymentMutation.isPending || !receiptUrl}
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
