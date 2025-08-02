import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, DollarSign, Calendar, Building, Wallet } from "lucide-react";
import { FILTER_ICONS, FILTER_LABELS, ACTION_ICONS, ACTION_LABELS } from '@/constants/actionBarConstants';
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Table } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useMobile } from "@/hooks/use-mobile";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function FinancesSubcontracts() {
  const { data: userData } = useCurrentUser();
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  
  // Estado para controles del ActionBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');
  const [activeTab, setActiveTab] = useState('summary');

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de subcontratos con análisis de pagos
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null);
  const { data: subcontractAnalysis = [], isLoading: isLoadingAnalysis } = useSubcontractAnalysis(userData?.preferences?.last_project_id || null);

  // Query para obtener los pagos de subcontratos
  const { data: subcontractPayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['subcontract-payments', userData?.preferences?.last_project_id],
    queryFn: async () => {
      if (!userData?.preferences?.last_project_id || !userData?.organization?.id) return [];
      
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
        .eq('movement.project_id', userData.preferences.last_project_id)
        .eq('movement.organization_id', userData.organization.id)
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
    enabled: !!userData?.preferences?.last_project_id && !!userData?.organization?.id
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'en_proceso': { variant: 'default' as const, label: 'En Proceso' },
      'completado': { variant: 'default' as const, label: 'Completado' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
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

  // Combinar subcontratos con su análisis financiero
  const enrichedSubcontracts = subcontracts.map(subcontract => {
    const analysis = subcontractAnalysis.find(a => a.id === subcontract.id);
    return {
      ...subcontract,
      analysis
    };
  });

  // Columnas de la tabla
  const columns = [
    {
      key: 'title',
      label: 'Título',
      width: '20%',
      render: (subcontract: any) => (
        <div className="font-medium">{subcontract.title}</div>
      )
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '12%',
      render: (subcontract: any) => {
        if (!subcontract.start_date) return '-';
        return format(new Date(subcontract.start_date), 'dd/MM/yyyy', { locale: es });
      }
    },
    {
      key: 'contact',
      label: 'Proveedor',
      width: '16%',
      render: (subcontract: any) => {
        const contact = subcontract.contact;
        if (!contact) return '-';
        
        const contactName = contact.full_name || 
          `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        
        return (
          <div>
            <div className="font-medium">{contactName}</div>
            {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
          </div>
        );
      }
    },
    {
      key: 'amount_total',
      label: 'Monto Total',
      width: '12%',
      render: (subcontract: any) => {
        const amountARS = subcontract.amount_total || 0;
        const amountUSD = amountARS / (subcontract.exchange_rate || 1);
        // Determinar la moneda original del subcontrato
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'pago_fecha',
      label: 'Pago a la Fecha',
      width: '12%',
      render: (subcontract: any) => {
        const pagoARS = subcontract.analysis?.pagoALaFecha || 0;
        const pagoUSD = subcontract.analysis?.pagoALaFechaUSD || 0;
        return formatSingleCurrency(pagoARS, pagoUSD, 'ARS'); // Los pagos siempre en moneda mixta
      }
    },
    {
      key: 'saldo',
      label: 'Saldo',
      width: '12%',
      render: (subcontract: any) => {
        const saldoARS = subcontract.analysis?.saldo || 0;
        const saldoUSD = subcontract.analysis?.saldoUSD || 0;
        return formatSingleCurrency(saldoARS, saldoUSD, 'ARS'); // Los saldos siempre en moneda mixta
      }
    },
    {
      key: 'status',
      label: 'Estado',
      width: '10%',
      render: (subcontract: any) => getStatusBadge(subcontract.status)
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '14%',
      sortable: false,
      render: (subcontract: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              openModal('subcontract', {
                projectId: userData?.preferences?.last_project_id,
                organizationId: userData?.organization?.id,
                userId: userData?.user?.id,
                subcontractId: subcontract.id,
                isEditing: true
              });
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Subcontrato',
                description: `¿Estás seguro de que deseas eliminar el subcontrato "${subcontract.title}"?`,
                confirmText: 'Eliminar',
                mode: 'dangerous',
                onConfirm: () => {
                  deleteSubcontract.mutate(subcontract.id);
                }
              });
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    
    // Buscar en el nombre del contacto usando la misma lógica de renderizado
    const contact = subcontract.contact;
    const contactName = contact?.full_name || 
      `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
    const contactMatch = contactName?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  // Filtrar pagos por búsqueda
  const filteredPayments = subcontractPayments.filter(payment => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = payment.subcontract_title?.toLowerCase().includes(searchLower);
    const contactMatch = payment.contact_name?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  // Configurar tabs para el header
  const headerTabs = [
    {
      id: 'summary',
      label: 'Resumen de Subcontratos',
      isActive: activeTab === 'summary'
    },
    {
      id: 'payments',
      label: 'Detalle de Pagos',
      isActive: activeTab === 'payments'
    }
  ];

  const headerProps = {
    title: "Subcontratos",
    tabs: headerTabs,
    onTabChange: setActiveTab
  };

  return (
    <Layout 
      wide={false}
      headerProps={headerProps}
    >
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktopRow
          filters={[
            {
              key: 'currency',
              title: 'Moneda',
              label: FILTER_LABELS.CURRENCY,
              icon: FILTER_ICONS.CURRENCY,
              value: currencyView === 'pesificado' ? 'Peso Argentino' : 
                     currencyView === 'dolarizado' ? 'Dólar Estadounidense' :
                     'Todo',
              setValue: (value) => {
                if (value === 'Peso Argentino') setCurrencyView('pesificado')
                else if (value === 'Dólar Estadounidense') setCurrencyView('dolarizado')
                else setCurrencyView('discriminado')
              },
              options: ['Peso Argentino', 'Dólar Estadounidense'],
              defaultLabel: 'Todo'
            }
          ]}
          actions={[
            {
              label: 'Crear Subcontrato',
              icon: ACTION_ICONS.NEW,
              onClick: handleCreateSubcontract,
              variant: 'default'
            }
          ]}
        />

        {/* Contenido condicional por tab */}
        {activeTab === 'summary' && (
          filteredSubcontracts.length === 0 && !isLoading && !isLoadingAnalysis ? (
            <EmptyState
              icon={<Package className="w-12 h-12 text-muted-foreground" />}
              title="Aún no tienes subcontratos creados"
              description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
            />
          ) : (
            <div className="space-y-4">
              <Table
                columns={columns}
                data={filteredSubcontracts}
                isLoading={isLoading || isLoadingAnalysis}
                className="bg-card"
                defaultSort={{ key: 'title', direction: 'asc' }}
              />
            </div>
          )
        )}

        {activeTab === 'payments' && (
          filteredPayments.length === 0 && !isLoadingPayments ? (
            <EmptyState
              icon={<DollarSign className="w-12 h-12 text-muted-foreground" />}
              title="Aún no hay pagos registrados"
              description="Los pagos a subcontratistas aparecerán aquí una vez que se registren movimientos financieros asociados a los subcontratos."
            />
          ) : (
            <div className="space-y-4">
              <Table
                columns={paymentsColumns}
                data={filteredPayments}
                isLoading={isLoadingPayments}
                className="bg-card"
                defaultSort={{ key: 'movement_date', direction: 'desc' }}
              />
            </div>
          )
        )}
      </div>
    </Layout>
  );
}