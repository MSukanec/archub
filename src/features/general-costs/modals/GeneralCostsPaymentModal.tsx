import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { FormModalHeader } from '@/components/modal/form/FormModalHeader';
import { FormModalFooter } from '@/components/modal/form/FormModalFooter';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useOrganizationWallets } from '@/hooks/use-organization-wallets';
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore';
import { useGeneralCosts } from '../hooks/use-general-costs';
import { useCreateGeneralCostPayment } from '../hooks/use-create-general-cost-payment';
import { useUpdateGeneralCostPayment } from '../hooks/use-update-general-cost-payment';
import { generalCostPaymentSchema, type GeneralCostPaymentFormData } from '../schemas';

interface GeneralCostsPaymentModalProps {
  modalData: {
    organizationId: string;
    editingPayment?: any;
  };
  onClose: () => void;
}

export function GeneralCostsPaymentModal({ modalData, onClose }: GeneralCostsPaymentModalProps) {
  const { organizationId, editingPayment } = modalData;
  const { data: userData } = useCurrentUser();
  const { toast } = useToast();
  const { setPanel } = useModalPanelStore();

  const form = useForm<GeneralCostPaymentFormData>({
    resolver: zodResolver(generalCostPaymentSchema),
    defaultValues: {
      payment_date: new Date(),
      general_cost_id: '',
      currency_id: '',
      wallet_id: '',
      amount: 0,
      exchange_rate: undefined,
      notes: '',
      reference: '',
      status: 'confirmed',
    }
  });

  // Hooks to get data
  const { data: currencies, isLoading: currenciesLoading } = useOrganizationCurrencies(organizationId);
  const { data: generalCosts, isLoading: generalCostsLoading } = useGeneralCosts(organizationId);
  const { data: wallets, isLoading: walletsLoading } = useOrganizationWallets(organizationId);
  
  // Loading state for all necessary data
  const isLoading = currenciesLoading || generalCostsLoading || walletsLoading;

  // Initialize panel mode
  React.useEffect(() => {
    if (editingPayment) {
      setPanel('view');
    } else {
      setPanel('edit');
    }
  }, [editingPayment, setPanel]);

  // Load data for editing
  React.useEffect(() => {
    if (editingPayment && currencies) {
      const paymentDate = editingPayment.payment_date ? new Date(editingPayment.payment_date) : new Date();
      
      form.reset({
        payment_date: paymentDate,
        general_cost_id: editingPayment.general_cost_id || '',
        currency_id: editingPayment.currency_id || '',
        wallet_id: editingPayment.wallet_id || '',
        amount: editingPayment.amount || 0,
        exchange_rate: editingPayment.exchange_rate || undefined,
        notes: editingPayment.notes || '',
        reference: editingPayment.reference || '',
        status: editingPayment.status || 'confirmed',
      });
    }
  }, [editingPayment, form, currencies]);

  // Initialize default values
  React.useEffect(() => {
    if (!editingPayment) {
      // Use the first currency available by default
      if (currencies && currencies.length > 0) {
        const defaultCurrency = currencies.find(c => c.is_default)?.currency?.id;
        if (defaultCurrency) {
          form.setValue('currency_id', defaultCurrency);
        } else if (currencies[0].currency?.id) {
          form.setValue('currency_id', currencies[0].currency.id);
        }
      }
      
      // Use the default wallet
      if (wallets && wallets.length > 0) {
        const defaultWallet = wallets.find(w => w.is_default);
        if (defaultWallet && defaultWallet.wallets?.id) {
          form.setValue('wallet_id', defaultWallet.wallets.id);
        } else if (wallets[0].wallets?.id) {
          form.setValue('wallet_id', wallets[0].wallets.id);
        }
      }
    }
  }, [currencies, wallets, editingPayment, form]);

  // Mutations
  const createPaymentMutation = useCreateGeneralCostPayment();
  const updatePaymentMutation = useUpdateGeneralCostPayment();

  const onSubmit = async (data: GeneralCostPaymentFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: 'Error',
        description: 'Organization ID not found',
        variant: 'destructive',
      });
      return;
    }

    // Validate that the wallet exists
    if (!data.wallet_id) {
      toast({
        title: 'Error',
        description: 'Wallet ID is required',
        variant: 'destructive',
      });
      return;
    }

    const selectedWallet = wallets?.find(w => w.wallets?.id === data.wallet_id);
    if (!selectedWallet) {
      toast({
        title: 'Error',
        description: `Wallet with ID ${data.wallet_id} not found`,
        variant: 'destructive',
      });
      return;
    }

    // The wallet_id from the form is the ID of the wallet, but we need the organization_wallets.id
    const organizationWallet = wallets?.find(w => w.wallets?.id === data.wallet_id);
    if (!organizationWallet) {
      toast({
        title: 'Error',
        description: `Organization wallet not found for wallet ID: ${data.wallet_id}`,
        variant: 'destructive',
      });
      return;
    }

    const paymentData = {
      organization_id: userData.organization.id,
      payment_date: data.payment_date.toISOString().split('T')[0],
      currency_id: data.currency_id,
      wallet_id: organizationWallet.id,
      amount: data.amount,
      notes: data.notes || null,
      exchange_rate: data.exchange_rate || 1,
      reference: data.reference || null,
      general_cost_id: data.general_cost_id || null,
      status: data.status || 'confirmed',
      created_by: userData?.memberships?.find(m => m.organization_id === userData?.organization?.id)?.id || null,
    };

    try {
      if (editingPayment) {
        await updatePaymentMutation.mutateAsync({
          id: editingPayment.id,
          organizationId: userData.organization.id,
          updates: paymentData,
        });
      } else {
        await createPaymentMutation.mutateAsync(paymentData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const isPending = createPaymentMutation.isPending || updatePaymentMutation.isPending;

  const formContent = (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4 px-6 py-4">
            {/* Payment Date */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Pago</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-payment-date"
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* General Cost Select */}
            <FormField
              control={form.control}
              name="general_cost_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gasto General (Opcional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={generalCostsLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-general-cost">
                        <SelectValue placeholder="Seleccionar gasto general" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {generalCosts?.map((gc) => (
                        <SelectItem key={gc.id} value={gc.id}>
                          {gc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Currency Select */}
            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={currenciesLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies?.map((oc) => (
                        <SelectItem key={oc.currency?.id} value={oc.currency?.id || ''}>
                          {oc.currency?.code} - {oc.currency?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wallet Select */}
            <FormField
              control={form.control}
              name="wallet_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billetera</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={walletsLoading}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-wallet">
                        <SelectValue placeholder="Seleccionar billetera" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets?.map((ow) => (
                        <SelectItem key={ow.wallets?.id} value={ow.wallets?.id || ''}>
                          <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            {ow.wallets?.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      data-testid="input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exchange Rate */}
            <FormField
              control={form.control}
              name="exchange_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cambio (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      placeholder="1.0000"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      data-testid="input-exchange-rate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference */}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de recibo, factura, etc."
                      {...field}
                      data-testid="input-reference"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      className="resize-none"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
      </form>
    </Form>
  );

  return (
    <FormModalLayout 
      onClose={onClose}
      headerContent={
        <FormModalHeader
          icon={DollarSign}
          title={editingPayment ? 'Editar Pago' : 'Registrar Pago'}
        />
      }
      editPanel={formContent}
      footerContent={
        <FormModalFooter
          cancelText="Cancelar"
          onLeftClick={onClose}
          submitText={editingPayment ? 'Actualizar' : 'Registrar'}
          onSubmit={() => form.handleSubmit(onSubmit)()}
          isSubmitting={isPending}
        />
      }
    />
  );
}
