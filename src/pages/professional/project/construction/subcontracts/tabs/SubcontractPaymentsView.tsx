import React, { useState, useMemo, useEffect } from 'react';
import { DollarSign, Wallet } from 'lucide-react';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { SubcontractPaymentsChart } from '@/components/charts/SubcontractPaymentsChart';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatCurrency as globalFormatCurrency } from "@/lib/currency-formatter";
import { useCurrentUser } from "@/hooks/use-current-user";

interface SubcontractPaymentsViewProps {
  subcontract: any;
}

export function SubcontractPaymentsView({ subcontract }: SubcontractPaymentsViewProps) {
  const { data: userData } = useCurrentUser();
  
  // Obtener la moneda por defecto de la organización
  const { data: defaultCurrency } = useQuery({
    queryKey: ['default-currency', userData?.organization?.id],
    queryFn: async () => {
      if (!userData?.organization?.id) return null;
      
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('id', userData.preferences?.default_currency)
        .single();
        
      if (error) return null;
      return data;
    },
    enabled: !!userData?.organization?.id && !!userData?.preferences?.default_currency
  });
  
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');
  
  // Actualizar la vista de moneda cuando se cargue la moneda por defecto
  useEffect(() => {
    if (defaultCurrency) {
      // Si la moneda por defecto es USD, mostrar en dólares, si no, en pesos/moneda local
      const newView = defaultCurrency.code === 'USD' ? 'dolarizado' : 'pesificado';
      setCurrencyView(newView);
    }
  }, [defaultCurrency]);

  // Query para obtener los pagos específicos de este subcontrato
  const { data: subcontractPayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['subcontract-payments', subcontract.id],
    queryFn: async () => {
      if (!subcontract.id || !userData?.organization?.id) return [];
      
      const { data, error } = await supabase
        .from('movement_subcontracts')
        .select(`
          id,
          movements!inner(
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
            contact:contacts(id, first_name, last_name, full_name, company_name)
          )
        `)
        .eq('subcontract_id', subcontract.id)
        .eq('movements.organization_id', userData.organization?.id)
        .order('movements(movement_date)', { ascending: false });

      if (error) {
        return [];
      }

      return (data || []).map((item: any) => {
        const contact = item.subcontract.contact;
        const contactName = contact 
          ? (contact.full_name || contact.company_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim())
          : 'Sin adjudicar';

        return {
          id: item.id,
          movement_date: item.movements.movement_date,
          amount: item.movements.amount, // Usar amount directamente del movement
          exchange_rate: item.movements.exchange_rate || 1,
          subcontract_title: item.subcontract.title,
          contact_name: contactName,
          wallet_name: item.movements.wallet?.wallets?.name || 'Sin billetera',
          currency_name: item.movements.currency.name,
          currency_symbol: item.movements.currency.symbol,
          currency_code: item.movements.currency.code
        };
      });
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

  // Generar datos para el gráfico de pagos por mes
  const generatePaymentsChartData = () => {
    if (!subcontractPayments || subcontractPayments.length === 0) return [];
    
    // Agrupar pagos por mes
    const paymentsByMonth = subcontractPayments.reduce((acc, payment) => {
      const date = new Date(payment.movement_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const formattedMonth = format(date, 'MMM-yy', { locale: es });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          formattedMonth,
          amount: 0
        };
      }
      
      // Convertir a la moneda por defecto de la organización
      const amount = defaultCurrency?.code === 'USD' 
        ? payment.amount / payment.exchange_rate
        : payment.amount;
        
      acc[monthKey].amount += amount;
      return acc;
    }, {} as Record<string, { month: string; formattedMonth: string; amount: number }>);
    
    // Convertir a array y ordenar por fecha
    return Object.values(paymentsByMonth)
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const paymentsChartData = generatePaymentsChartData();

  // Calcular el total acumulado hasta cada pago
  const paymentsWithProgress = useMemo(() => {
    if (subcontractPayments.length === 0 || !subcontract.amount_total) return [];
    
    let accumulatedAmount = 0;
    return subcontractPayments.map((payment, index) => {
      accumulatedAmount += payment.amount || 0;
      const progressPercentage = (accumulatedAmount / subcontract.amount_total) * 100;
      
      return {
        ...payment,
        accumulatedAmount,
        progressPercentage: Math.min(progressPercentage, 100) // No puede ser más del 100%
      };
    });
  }, [subcontractPayments, subcontract.amount_total]);

  // Columnas para la tabla de pagos con el orden correcto
  const paymentsColumns = [
    {
      key: 'movement_date',
      label: 'Fecha',
      width: '16.66%',
      render: (payment: any) => {
        return format(new Date(payment.movement_date), 'dd/MM/yyyy', { locale: es });
      }
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '16.66%',
      render: (payment: any) => (
        <Badge variant="outline">
          {payment.currency_symbol} {payment.currency_name}
        </Badge>
      )
    },
    {
      key: 'wallet_name',
      label: 'Billetera',
      width: '16.66%',
      render: (payment: any) => (
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-muted-foreground" />
          {payment.wallet_name}
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '16.66%',
      render: (payment: any) => {
        // Mostrar siempre en la moneda original del pago
        return (
          <div className="font-medium">
            {formatCurrency(payment.amount, payment.currency_symbol)}
          </div>
        );
      }
    },
    {
      key: 'exchange_rate',
      label: 'Cotización',
      width: '16.66%',
      render: (payment: any) => (
        <div className="text-sm text-muted-foreground">
          {payment.exchange_rate ? payment.exchange_rate.toFixed(2) : '1.00'}
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Avance Total',
      width: '16.66%',
      render: (payment: any) => {
        const percentage = payment.progressPercentage;
        // Color gradient de rojo a verde
        const getColor = (percent: number) => {
          if (percent <= 25) return '#ef4444'; // rojo
          if (percent <= 50) return '#f97316'; // naranja
          if (percent <= 75) return '#eab308'; // amarillo
          return '#22c55e'; // verde
        };
        
        return (
          <div className="space-y-1">
            <div className="relative w-full bg-gray-200 rounded-full h-6 flex items-center">
              <div 
                className="h-6 rounded-full transition-all duration-300 flex items-center justify-center"
                style={{ 
                  backgroundColor: getColor(percentage),
                  width: `${Math.max(percentage, 15)}%`, // Mínimo 15% para mostrar el texto
                  minWidth: '40px'
                }}
              >
                <span className="text-xs font-medium text-white px-1">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      }
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
      {/* Gráfico de pagos por mes */}
      <SubcontractPaymentsChart
        data={paymentsChartData}
        isLoading={isLoadingPayments}
        currencySymbol={defaultCurrency?.symbol || '$'}
        title={`Pagos del Subcontrato: ${subcontract.title}`}
      />

      {/* Tabla de pagos del subcontrato */}
      <Table
        columns={paymentsColumns}
        data={paymentsWithProgress}
        isLoading={isLoadingPayments}
        className="bg-card"
      />
    </div>
  );
}