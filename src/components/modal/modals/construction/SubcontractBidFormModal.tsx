import React, { useState, useEffect } from 'react';
import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FileText } from 'lucide-react';
import { z } from 'zod';

const bidFormSchema = z.object({
  supplier_name: z.string().min(1, 'El nombre del proveedor es requerido'),
  supplier_email: z.string().email('Email inválido').optional().or(z.literal('')),
  supplier_phone: z.string().optional(),
  status: z.string(),
  total_amount: z.string().optional(),
  currency_code: z.string(),
  is_lump_sum: z.boolean(),
  received_at: z.string().optional(),
  notes: z.string().optional()
});

type BidFormData = z.infer<typeof bidFormSchema>;

interface SubcontractBidFormModalProps {
  modalData?: any;
  onClose: () => void;
}

export function SubcontractBidFormModal({
  modalData,
  onClose
}: SubcontractBidFormModalProps) {
  // Extraer datos de modalData
  const subcontract_id = modalData?.subcontractId;
  const bid_id = modalData?.bidId;
  const mode = modalData?.isEditing ? 'edit' : 'create';
  const initialData = modalData?.initialData;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      supplier_name: initialData?.supplier_name || '',
      supplier_email: initialData?.supplier_email || '',
      supplier_phone: initialData?.supplier_phone || '',
      status: initialData?.status || 'pending',
      total_amount: initialData?.total_amount?.toString() || '',
      currency_code: initialData?.currency_code || 'ARS',
      is_lump_sum: initialData?.is_lump_sum ?? true,
      received_at: initialData?.received_at ? new Date(initialData.received_at).toISOString().slice(0, 16) : '',
      notes: initialData?.notes || ''
    }
  });

  const onSubmit = async (data: BidFormData) => {
    setIsLoading(true);

    try {
      // TODO: Implementar guardado de oferta
      console.log('Saving bid:', {
        ...data,
        subcontract_id,
        total_amount: data.total_amount ? parseFloat(data.total_amount) : null
      });

      toast({
        title: mode === 'create' ? 'Oferta creada' : 'Oferta actualizada',
        description: 'Los cambios se han guardado correctamente'
      });

      onClose();
    } catch (error) {
      console.error('Error saving bid:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la oferta',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Proveedor *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Constructora ABC S.A."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="contacto@constructora.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplier_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+54 11 1234-5678"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="received">Recibida</SelectItem>
                    <SelectItem value="withdrawn">Retirada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="total_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Total</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                    <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="received_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Recepción</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Comentarios adicionales sobre la oferta..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );

  const headerContent = (
    <FormModalHeader 
      title={mode === 'create' ? 'Nueva Oferta' : 'Editar Oferta'}
      icon={FileText}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={mode === 'create' ? 'Crear Oferta' : 'Actualizar Oferta'}
      onRightClick={form.handleSubmit(onSubmit)}
      rightLoading={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
    />
  );
}
