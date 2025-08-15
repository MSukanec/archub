import { useState } from "react";
import { Package, Plus, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Layout } from '@/components/layout/desktop/Layout';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";

export default function ConstructionSubcontracts() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

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

  // Función para convertir montos según la vista seleccionada
  const convertAmount = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    if (currencyView === 'discriminado') {
      return originalCurrency === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return originalCurrency === 'USD' ? amountUSD * (subcontracts[0]?.exchange_rate || 1) : amountARS;
    } else if (currencyView === 'dolarizado') {
      return originalCurrency === 'ARS' ? amountARS / (subcontracts[0]?.exchange_rate || 1) : amountUSD;
    }
    return amountARS;
  };

  // Función para formatear montos con el símbolo correcto
  const formatSingleCurrency = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amountARS, amountUSD, originalCurrency);
    
    if (currencyView === 'discriminado') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: originalCurrency === 'USD' ? 'USD' : 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    } else if (currencyView === 'pesificado') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    } else if (currencyView === 'dolarizado') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertedAmount);
  };



  // Combinar datos de subcontratos con análisis de pagos
  const enrichedSubcontracts = subcontracts.map(subcontract => {
    const analysis = subcontractAnalysis.find(a => a.id === subcontract.id);
    return {
      ...subcontract,
      analysis: analysis || {
        pagoALaFecha: 0,
        pagoALaFechaUSD: 0,
        saldo: subcontract.amount_total || 0,
        saldoUSD: (subcontract.amount_total || 0) / (subcontract.exchange_rate || 1)
      }
    };
  });



  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    const codeMatch = subcontract.code?.toLowerCase().includes(searchLower);
    
    return titleMatch || codeMatch;
  });

  const headerProps = {
    icon: Package,
    title: "Subcontratos",
    showHeaderSearch: true,
    headerSearchValue: searchQuery,
    onHeaderSearchChange: setSearchQuery,
    showCurrencySelector: true,
    currencyView: currencyView,
    onCurrencyViewChange: setCurrencyView,
    actionButton: {
      icon: Plus,
      label: "Nuevo Subcontrato",
      onClick: handleCreateSubcontract
    }
  };

  // Router navigation
  const [, setLocation] = useLocation();

  // Función para editar subcontrato
  const handleEdit = (subcontract: any) => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: true,
      subcontract
    });
  };

  // Función para eliminar subcontrato
  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este subcontrato?')) {
      deleteSubcontract.mutate(id);
    }
  };

  // Función para ver detalle
  const handleView = (id: string) => {
    setLocation(`/construction/subcontracts/${id}`);
  };

  // Formateo de moneda
  const formatCurrency = (amount: number, currency: string, exchangeRate: number) => {
    const value = currencyView === 'dolarizado' 
      ? (amount / exchangeRate)
      : amount;
    
    const symbol = currencyView === 'dolarizado' ? 'US$' : '$';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currencyView === 'dolarizado' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace(/[A-Z]{3}\s*/, symbol + ' ');
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'title',
      label: 'Subcontrato',
      render: (subcontract: any) => (
        <div>
          <div className="font-medium">{subcontract.title}</div>
          {subcontract.code && (
            <div className="text-xs text-muted-foreground">{subcontract.code}</div>
          )}
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Subcontratista',
      render: (subcontract: any) => {
        // Buscar la oferta ganadora si el subcontrato está adjudicado
        if (subcontract.status === 'awarded' && subcontract.subcontract_bids) {
          const winningBid = subcontract.subcontract_bids.find((bid: any) => bid.is_winner);
          if (winningBid && winningBid.contact) {
            const contactName = winningBid.contact.full_name || 
              `${winningBid.contact.first_name || ''} ${winningBid.contact.last_name || ''}`.trim();
            return (
              <div>
                <div className="font-medium">{contactName}</div>
                {winningBid.contact.email && <div className="text-xs text-muted-foreground">{winningBid.contact.email}</div>}
              </div>
            );
          }
        }
        
        // Mostrar contacto original si no hay oferta ganadora
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
      key: 'status',
      label: 'Estado',
      render: (subcontract: any) => {
        const status = subcontract.status;
        let badgeStyle = {};
        let displayText = '';
        
        switch (status) {
          case 'draft':
            badgeStyle = { 
              backgroundColor: '#f3f4f6', 
              color: '#374151',
              border: '1px solid #d1d5db'
            };
            displayText = 'Borrador';
            break;
          case 'active':
            badgeStyle = { 
              backgroundColor: '#3b82f6', // Azul
              color: 'white',
              border: 'none'
            };
            displayText = 'Activo';
            break;
          case 'awarded':
            badgeStyle = { 
              backgroundColor: 'var(--accent)', // Verde accent
              color: 'white',
              border: 'none'
            };
            displayText = 'Adjudicado';
            break;
          case 'completed':
            badgeStyle = { 
              backgroundColor: '#22c55e', // Verde
              color: 'white',
              border: 'none'
            };
            displayText = 'Completado';
            break;
          case 'cancelled':
            badgeStyle = { 
              backgroundColor: '#ef4444', // Rojo
              color: 'white',
              border: 'none'
            };
            displayText = 'Cancelado';
            break;
          default:
            badgeStyle = { 
              backgroundColor: '#f3f4f6', 
              color: '#374151',
              border: '1px solid #d1d5db'
            };
            displayText = status || 'Sin estado';
        }
        
        return (
          <Badge style={badgeStyle} className="border-0">
            {displayText}
          </Badge>
        );
      }
    },
    {
      key: 'amount',
      label: 'Monto Total',
      render: (subcontract: any) => {
        const amountARS = subcontract.amount_total || 0;
        const amountUSD = amountARS / (subcontract.exchange_rate || 1);
        // Determinar la moneda original del subcontrato
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'paid_amount',
      label: 'A la Fecha',
      render: (subcontract: any) => {
        const analysis = subcontract.analysis;
        if (!analysis) return '-';
        
        const paidARS = analysis.pagoALaFecha || 0;
        const paidUSD = analysis.pagoALaFechaUSD || 0;
        // Usar la misma moneda original que el monto total
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(paidARS, paidUSD, originalCurrency);
      }
    },
    {
      key: 'balance',
      label: 'Saldo',
      render: (subcontract: any) => {
        const analysis = subcontract.analysis;
        if (!analysis) return '-';
        
        const balanceARS = analysis.saldo || 0;
        const balanceUSD = analysis.saldoUSD || 0;
        // Usar la misma moneda original que el monto total
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(balanceARS, balanceUSD, originalCurrency);
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (subcontract: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(subcontract.id)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(subcontract)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(subcontract.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading || isLoadingAnalysis) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando subcontratos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div>
        {filteredSubcontracts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12 text-muted-foreground" />}
            title="Aún no tienes subcontratos creados"
            description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
            action={
              <Button onClick={handleCreateSubcontract}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Subcontrato
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            data={filteredSubcontracts}
            isLoading={isLoading}
            className="bg-card"
          />
        )}
      </div>
    </Layout>
  );
}