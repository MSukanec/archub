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
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite';
import DatePicker from '@/components/ui-custom/DatePicker';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FileText } from 'lucide-react';
import { z } from 'zod';
import { useContacts } from '@/hooks/use-contacts';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useCurrencies } from '@/hooks/use-currencies';
import { useQuery } from '@tanstack/react-query';

const bidFormSchema = z.object({
  contact_id: z.string().min(1, 'El proveedor es requerido'),
  amount: z.string().min(1, 'El monto es requerido'),
  currency_id: z.string().min(1, 'La moneda es requerida'),
  exchange_rate: z.string().optional(),
  submitted_at: z.date().optional(),
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
  const onSuccess = modalData?.onSuccess;
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  
  // Obtener miembros de la organización para el created_by
  const { data: members } = useQuery({
    queryKey: ['organization-members', userData?.organization?.id],
    queryFn: async () => {
      const response = await fetch(`/api/organization-members?organization_id=${userData?.organization?.id}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!userData?.organization?.id
  });
  const { data: contacts, isLoading: isContactsLoading } = useContacts();
  const { data: currencies, isLoading: isCurrenciesLoading } = useCurrencies();
  
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      contact_id: initialData?.contact_id || '',
      amount: initialData?.amount?.toString() || '',
      currency_id: initialData?.currency_id || '',
      exchange_rate: initialData?.exchange_rate?.toString() || '',
      submitted_at: initialData?.submitted_at ? new Date(initialData.submitted_at) : undefined,
      notes: initialData?.notes || ''
    }
  });

  const onSubmit = async (data: BidFormData) => {
    setIsLoading(true);

    try {
      const bidData = {
        subcontract_id: subcontract_id,
        contact_id: data.contact_id,
        amount: parseFloat(data.amount),
        currency_id: data.currency_id,
        exchange_rate: data.exchange_rate ? parseFloat(data.exchange_rate) : 1,
        submitted_at: data.submitted_at ? data.submitted_at.toISOString().split('T')[0] : null,
        notes: data.notes || null,
        status: 'pending',
        ...(mode === 'create' && { 
          created_by: members?.find((m: any) => m.user_id === userData?.user?.id)?.id || null 
        })
      };

      console.log('Saving bid:', bidData);
      console.log('UserData:', userData?.user?.id);
      console.log('Member found:', members?.find((m: any) => m.user_id === userData?.user?.id));

      const response = await fetch('/api/subcontract-bids', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mode === 'edit' ? { ...bidData, id: bid_id } : bidData),
      });

      if (!response.ok) {
        throw new Error('Failed to save bid');
      }

      toast({
        title: mode === 'create' ? 'Oferta creada' : 'Oferta actualizada',
        description: 'Los cambios se han guardado correctamente'
      });

      if (onSuccess) {
        onSuccess();
      }
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

  // Preparar opciones de contactos
  const contactOptions = contacts?.map(contact => ({
    value: contact.id,
    label: contact.company_name || contact.full_name || `${contact.first_name} ${contact.last_name}`.trim()
  })) || [];

  // Preparar opciones de monedas
  const currencyOptions = currencies?.map(currency => ({
    value: currency.id,
    label: `${currency.name} (${currency.code})`
  })) || [];

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Fecha de Cotización - Proveedor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="submitted_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Recepción</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Seleccionar fecha..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subcontratista *</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={contactOptions}
                    placeholder="Seleccionar proveedor..."
                    searchPlaceholder="Buscar proveedor..."
                    emptyMessage="No se encontraron proveedores."
                    disabled={isContactsLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Moneda - Monto Total */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda *</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={currencyOptions}
                    placeholder="Seleccionar moneda..."
                    searchPlaceholder="Buscar moneda..."
                    emptyMessage="No se encontraron monedas."
                    disabled={isCurrenciesLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Total *</FormLabel>
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
        </div>

        {/* Cotización */}
        <FormField
          control={form.control}
          name="exchange_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cotización (Opcional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="Ej: 1.0000"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notas */}
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
