import React, { useState } from 'react';
import { DollarSign, Wallet } from 'lucide-react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatCurrency as globalFormatCurrency } from "@/lib/currency-formatter";
import { useCurrentUser } from "@/hooks/use-current-user";

interface SubcontractPaymentsViewProps {
  subcontract: any;
}

export function SubcontractPaymentsView({ subcontract }: SubcontractPaymentsViewProps) {
  const { data: userData } = useCurrentUser();
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('dolarizado');

  // Query para obtener los pagos específicos de este subcontrato
  const { data: subcontractPayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['subcontract-payments', subcontract.id],
    queryFn: async () => {
      if (!subcontract.id || !userData?.organization?.id) return [];
      
      const { data, error } = await supabase
        .from('movement_subcontracts')
        .select(`
          id,
          movement:movements!inner(
            id,
            movement_date,
            amount,
            exchange_rate,
            currency:currencies!inner(id, name, code, symbol),
            wallet:organization_wallets!inner(
              wallets!inner(id, name)
            )
          ),
          subcontract:subcontracts!inner(
            id,
            title,
            contact:contacts!inner(id, first_name, last_name, full_name)
          )
        `)
        .eq('subcontract_id', subcontract.id)
        .eq('movement.organization_id', userData.organization?.id)
        .order('movement(movement_date)', { ascending: false });

      if (error) {
        console.error('Error fetching subcontract payments:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        movement_date: item.movement.movement_date,
        amount: item.movement.amount,
        exchange_rate: item.movement.exchange_rate || 1,
        subcontract_title: item.subcontract.title,
        contact_name: item.subcontract.contact?.full_name || 
          `${item.subcontract.contact?.first_name || ''} ${item.subcontract.contact?.last_name || ''}`.trim(),
        wallet_name: item.movement.wallet?.wallets?.name || 'Sin billetera',
        currency_name: item.movement.currency.name,
        currency_symbol: item.movement.currency.symbol,
        currency_code: item.movement.currency.code
      }));
    },
    enabled: !!subcontract.id && !!userData?.organization?.id
  });

  const formatCurrency = (amount: number, symbol: string = '$') => {
    return globalFormatCurrency(amount, symbol);
  };

  // Función para convertir montos según la vista de moneda
  const convertAmount = (amountARS: number, amountUSD: number, currencyCode: string) => {
    if (currencyView === 'discriminado') {
      return currencyCode === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return amountARS; // Siempre mostrar en ARS
    } else if (currencyView === 'dolarizado') {
      return amountUSD; // Siempre mostrar en USD
    }
    return amountARS;
  };

  const formatSingleCurrency = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amountARS, amountUSD, originalCurrency);
    
    if (currencyView === 'discriminado') {
      return formatCurrency(convertedAmount, originalCurrency === 'USD' ? 'US$' : '$');
    } else if (currencyView === 'pesificado') {
      return formatCurrency(convertedAmount, '$');
    } else if (currencyView === 'dolarizado') {
      return formatCurrency(convertedAmount, 'US$');
    }
    return formatCurrency(convertedAmount, '$');
  };

  // Columnas para la tabla de pagos
  const paymentsColumns = [
    {
      key: 'subcontract_title',
      label: 'Subcontrato',
      width: '20%',
      render: (payment: any) => (
        <div className="font-medium">{payment.subcontract_title}</div>
      )
    },
    {
      key: 'movement_date',
      label: 'Fecha',
      width: '12%',
      render: (payment: any) => {
        return format(new Date(payment.movement_date), 'dd/MM/yyyy', { locale: es });
      }
    },
    {
      key: 'contact_name',
      label: 'Proveedor',
      width: '16%',
      render: (payment: any) => (
        <div className="font-medium">{payment.contact_name}</div>
      )
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '12%',
      render: (payment: any) => {
        const amountARS = payment.amount;
        const amountUSD = payment.amount / payment.exchange_rate;
        const originalCurrency = payment.currency_code === 'USD' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'wallet_name',
      label: 'Billetera',
      width: '12%',
      render: (payment: any) => (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          {payment.wallet_name}
        </div>
      )
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '10%',
      render: (payment: any) => (
        <Badge variant="outline">
          {payment.currency_symbol} {payment.currency_name}
        </Badge>
      )
    },
    {
      key: 'exchange_rate',
      label: 'T.C.',
      width: '8%',
      render: (payment: any) => (
        <div className="text-sm text-muted-foreground">
          {payment.exchange_rate.toFixed(2)}
        </div>
      )
    }
  ];

  if (subcontractPayments.length === 0 && !isLoadingPayments) {
    return (
      <EmptyState
        icon={<DollarSign className="w-12 h-12 text-muted-foreground" />}
        title="Sin pagos registrados"
        description="Aún no hay pagos registrados para este subcontrato. Los pagos aparecerán aquí una vez que se registren movimientos financieros asociados a este subcontrato."
        action={
          <Button asChild>
            <a href="/finances">
              Ir a Finanzas
            </a>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabla de pagos del subcontrato */}
      <Table
        columns={paymentsColumns}
        data={subcontractPayments}
        isLoading={isLoadingPayments}
        className="bg-card"
      />
    </div>
  );
}