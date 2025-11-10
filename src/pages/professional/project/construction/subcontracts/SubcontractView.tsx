import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Plus, FileText, FileSignature } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Layout } from '@/components/layout/desktop/Layout';
import { SubcontractDashboardView } from './tabs/SubcontractDashboardView';
import { SubcontractScopeView } from './tabs/SubcontractScopeView';
import { SubcontractBidsView } from './tabs/SubcontractBidsView';
import { SubcontractAwardedView } from './tabs/SubcontractAwardedView';
import { SubcontractPaymentsView } from './tabs/SubcontractPaymentsView';
import { SubcontractHistoryView } from './tabs/SubcontractHistoryView';
import { useSubcontract } from "@/hooks/use-subcontracts";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function SubcontractView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Resumen');
  const { openModal } = useGlobalModalStore();
  
  const { data: userData } = useCurrentUser();
  const { data: subcontract, isLoading } = useSubcontract(id || '');

  // Obtener ofertas del subcontrato
  const { data: subcontractBids = [] } = useQuery({
    queryKey: ['subcontract-bids', id],
    queryFn: async () => {
      const response = await fetch(`/api/subcontract-bids/${id}`);
      if (!response.ok) throw new Error('Failed to fetch bids');
      return response.json();
    },
    enabled: !!id
  });

  // Calcular datos derivados
  const winnerBid = useMemo(() => {
    if (!subcontract?.winner_bid_id) return null;
    return subcontractBids.find((bid: any) => bid.id === subcontract.winner_bid_id) || null;
  }, [subcontractBids, subcontract?.winner_bid_id]);

  // TODO: Implementar query para obtener proyecto
  const project = null; // Conectar con subcontract.project_id
  const provider = winnerBid?.contacts || null;

  const headerTabs = [
    {
      id: 'Resumen',
      label: 'Resumen',
      isActive: activeTab === 'Resumen'
    },
    {
      id: 'Alcance',
      label: 'Alcance',
      isActive: activeTab === 'Alcance'
    },
    {
      id: 'Ofertas',
      label: 'Ofertas',
      isActive: activeTab === 'Ofertas'
    },
    {
      id: 'Contratado',
      label: 'Contratado',
      isActive: activeTab === 'Contratado'
    },
    {
      id: 'Pagos',
      label: 'Pagos',
      isActive: activeTab === 'Pagos'
    },
    {
      id: 'Historial',
      label: 'Historial',
      isActive: activeTab === 'Historial'
    }
  ];

  const headerProps = {
    icon: FileSignature,
    title: subcontract?.title || "Subcontrato",
    showBackButton: true,
    onBackClick: () => navigate('/construction/subcontracts'),
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: activeTab === 'Alcance' ? {
      label: "Agregar Tareas",
      icon: Plus,
      onClick: () => {
        openModal('subcontract-task', {
          subcontractId: id,
          projectId: subcontract?.project_id,
          onSuccess: () => {
            // Refrescar datos si es necesario
          }
        });
      }
    } : activeTab === 'Ofertas' ? {
      label: "Nueva Oferta",
      icon: Plus,
      onClick: () => {
        openModal('subcontract-bid', {
          subcontractId: id,
          isEditing: false
        });
      }
    } : activeTab === 'Contratado' ? {
      label: "Subir Contrato",
      icon: FileText,
      onClick: () => {
        // TODO: Implement contract upload functionality
      },
      disabled: true
    } : undefined
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  if (!subcontract) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Subcontrato no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El subcontrato con ID {id} no existe o no tienes permisos para verlo.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Resumen':
        return (
          <SubcontractDashboardView
            subcontract={subcontract}
            project={project}
            bids={subcontractBids}
            winnerBid={winnerBid}
            provider={provider}
            onTabChange={setActiveTab}
          />
        );
      case 'Alcance':
        return (
          <SubcontractScopeView 
            subcontract={subcontract}
            project={project}
          />
        );
      case 'Ofertas':
        return (
          <SubcontractBidsView 
            subcontract={subcontract}
          />
        );
      case 'Contratado':
        return (
          <SubcontractAwardedView 
            subcontract={subcontract}
            onTabChange={setActiveTab}
          />
        );
      case 'Pagos':
        return (
          <SubcontractPaymentsView 
            subcontract={subcontract}
          />
        );
      case 'Historial':
        return (
          <SubcontractHistoryView 
            subcontract={subcontract}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout headerProps={headerProps} wide>
      {renderTabContent()}
    </Layout>
  );
}