import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, DollarSign, Calendar, Building, Wallet, Coins } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction';
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
import { useProjectContext } from "@/stores/projectContext";

interface SubcontractPayment {
  id: string;
  movement_date: string;
  amount: number;
  exchange_rate: number;
  subcontract_title: string;
  contact_name: string;
  wallet_name: string;
  currency_name: string;
  currency_symbol: string;
  currency_code: string;
}

export default function FinancesSubcontracts() {
  const { data: userData } = useCurrentUser();
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  const { selectedProjectId } = useProjectContext();
  
  // Estado para controles
  const [searchValue, setSearchValue] = useState('');
  const [filterByContact, setFilterByContact] = useState("all");
  const [filterByCurrency, setFilterByCurrency] = useState("all"); 
  const [activeTab, setActiveTab] = useState('summary');

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: selectedProjectId,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de subcontratos con análisis de pagos
  const { data: subcontracts = [], isLoading } = useSubcontracts(selectedProjectId);
  const { data: subcontractAnalysis = [], isLoading: isLoadingAnalysis } = useSubcontractAnalysis(selectedProjectId);
  
  // Debug logs
  console.log("🔍 FinancesSubcontracts Debug:", {
    selectedProjectId,
    subcontracts: subcontracts.length,
    subcontractAnalysis: subcontractAnalysis.length,
    isLoading,
    isLoadingAnalysis
  });

  // Query para obtener los pagos de subcontratos
  const { data: subcontractPayments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ['subcontract-payments', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId || !userData?.organization?.id) return [];
      
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
        .eq('movement.project_id', selectedProjectId)
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
    enabled: !!selectedProjectId && !!userData?.organization?.id
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

  // Combinar subcontratos con su análisis financiero
  const enrichedSubcontracts = subcontracts.map(subcontract => {
    const analysis = subcontractAnalysis.find(a => a.subcontrato === subcontract.id);
    return {
      ...subcontract,
      analysis
    };
  });

  // Columnas para la tabla de resumen de subcontratos
  const summaryColumns = [
    {
      key: 'title',
      label: 'Título',
      width: '20%',
      sortable: true
    },
    {
      key: 'contact',
      label: 'Proveedor',
      width: '15%',
      render: (subcontract: any) => {
        const contact = subcontract.contact;
        const displayName = contact?.full_name || 
          `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim() || 
          'Sin proveedor';
        return displayName;
      }
    },
    {
      key: 'start_date',
      label: 'Fecha de Inicio',
      width: '12%',
      render: (subcontract: any) => {
        return subcontract.start_date 
          ? format(new Date(subcontract.start_date), 'dd/MM/yyyy', { locale: es })
          : '-';
      }
    },
    {
      key: 'end_date',
      label: 'Fecha de Finalización',
      width: '12%',
      render: (subcontract: any) => {
        return subcontract.end_date 
          ? format(new Date(subcontract.end_date), 'dd/MM/yyyy', { locale: es })
          : '-';
      }
    },
    {
      key: 'total_amount',
      label: 'Monto Total',
      width: '12%',
      render: (subcontract: any) => {
        const totalARS = subcontract.analysis?.montoTotal || 0;
        return formatCurrency(totalARS, '$');
      }
    },
    {
      key: 'paid_amount',
      label: 'Monto Pagado',
      width: '12%',
      render: (subcontract: any) => {
        const pagoARS = subcontract.analysis?.pagoALaFecha || 0;
        return formatCurrency(pagoARS, '$');
      }
    },
    {
      key: 'saldo',
      label: 'Saldo',
      width: '12%',
      render: (subcontract: any) => {
        const saldoARS = subcontract.analysis?.saldo || 0;
        return formatCurrency(saldoARS, '$');
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

  // Columnas para la tabla de detalle de pagos
  const paymentsColumns = [
    {
      key: 'movement_date',
      label: 'Fecha',
      width: '12%',
      sortable: true,
      render: (payment: SubcontractPayment) => {
        return format(new Date(payment.movement_date), 'dd/MM/yyyy', { locale: es });
      }
    },
    {
      key: 'subcontract_title',
      label: 'Subcontrato',
      width: '20%',
      sortable: true
    },
    {
      key: 'contact_name',
      label: 'Proveedor',
      width: '18%',
      sortable: true
    },
    {
      key: 'wallet_name',
      label: 'Billetera',
      width: '15%',
      sortable: true
    },
    {
      key: 'currency_name',
      label: 'Moneda',
      width: '15%',
      sortable: true
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '12%',
      sortable: true,
      render: (payment: SubcontractPayment) => {
        return formatCurrency(payment.amount, payment.currency_symbol);
      }
    },
    {
      key: 'exchange_rate',
      label: 'Cotización',
      width: '8%',
      sortable: true,
      render: (payment: SubcontractPayment) => {
        return payment.currency_code === 'USD' ? `$${payment.exchange_rate.toLocaleString('es-AR')}` : '-';
      }
    }
  ];

  // Filtrar subcontratos
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchValue.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    
    const contact = subcontract.contact;
    const contactName = contact?.full_name || 
      `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
    const contactMatch = contactName?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  // Filtrar pagos
  const filteredPayments = subcontractPayments.filter(payment => {
    const searchLower = searchValue.toLowerCase();
    return payment.subcontract_title?.toLowerCase().includes(searchLower) ||
           payment.contact_name?.toLowerCase().includes(searchLower);
  });

  // Crear tabs para el header
  const headerTabs = [
    {
      id: "summary",
      label: "Resumen de Subcontratos",
      isActive: activeTab === "summary"
    },
    {
      id: "payments",
      label: "Detalle de Pagos", 
      isActive: activeTab === "payments"
    }
  ];

  const headerProps = {
    title: "Subcontratos",
    tabs: headerTabs,
    onTabChange: setActiveTab
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando subcontratos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      {/* Feature Introduction */}
      <FeatureIntroduction
        icon={<Package className="h-6 w-6" />}
        title="Gestión de Subcontratos"
        features={[
          { icon: <Package className="h-4 w-4" />, title: "Subcontratos Detallados", description: "Gestión completa de subcontratos con seguimiento de estados y fechas" },
          { icon: <DollarSign className="h-4 w-4" />, title: "Control Financiero", description: "Seguimiento de montos, pagos realizados y saldos pendientes" },
          { icon: <Calendar className="h-4 w-4" />, title: "Fechas de Ejecución", description: "Control de cronograma con fechas de inicio y finalización" },
          { icon: <Building className="h-4 w-4" />, title: "Detalle de Pagos", description: "Registro detallado de todos los pagos realizados a subcontratistas" }
        ]}
      />

      {/* Action Bar Desktop */}
      <ActionBarDesktop
        title="Gestión de Subcontratos"
        icon={<Package className="w-6 h-6" />}
        features={[
          {
            icon: <Package className="w-5 h-5" />,
            title: "Subcontratos Detallados",
            description: "Gestión completa de subcontratos con seguimiento de estados, fechas y control de proveedores especializados."
          },
          {
            icon: <DollarSign className="w-5 h-5" />,
            title: "Control Financiero Completo",
            description: "Seguimiento detallado de montos contratados, pagos realizados y saldos pendientes con análisis financiero integrado."
          },
          {
            icon: <Calendar className="w-5 h-5" />,
            title: "Cronograma de Ejecución",
            description: "Control de fechas de inicio y finalización de subcontratos para optimización de tiempos de obra."
          },
          {
            icon: <Building className="w-5 h-5" />,
            title: "Detalle de Pagos",
            description: "Registro completo de todos los pagos realizados con detalle de fechas, billeteras, monedas y cotizaciones."
          }
        ]}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        primaryActionLabel="Nuevo Subcontrato"
        onPrimaryActionClick={handleCreateSubcontract}
      />

      {/* Contenido condicional por tab */}
      {activeTab === "summary" && (
        filteredSubcontracts.length === 0 && !isLoadingAnalysis ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="Aún no tienes subcontratos creados"
            description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
          />
        ) : (
          <div className="space-y-4">
            <Table
              columns={summaryColumns}
              data={filteredSubcontracts}
              isLoading={isLoading || isLoadingAnalysis}
              className="bg-card"
              defaultSort={{ key: 'title', direction: 'asc' }}
            />
          </div>
        )
      )}

      {activeTab === "payments" && (
        filteredPayments.length === 0 && !isLoadingPayments ? (
          <EmptyState
            icon={<DollarSign className="h-8 w-8" />}
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
    </Layout>
  );
}