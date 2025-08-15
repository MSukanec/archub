import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Plus, FileText } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { SubcontractDashboardView } from './tabs/SubcontractDashboardView';
import { SubcontractScopeView } from './tabs/SubcontractScopeView';
import { SubcontractBidsView } from './tabs/SubcontractBidsView';
import { SubcontractAwardedView } from './tabs/SubcontractAwardedView';
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

  // Datos simulados para el desarrollo - TODO: reemplazar con datos reales
  const mockProject = { name: 'Proyecto Demo' };
  const mockBids: any[] = [];
  const mockWinnerBid = null;
  const mockProvider = null;

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
    }
  ];

  const headerProps = {
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
        console.log('Upload contract functionality to be implemented');
      },
      disabled: true
    } : undefined
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
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
      <Layout headerProps={headerProps}>
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
            project={mockProject}
            bids={mockBids}
            winnerBid={mockWinnerBid}
            provider={mockProvider}
            onTabChange={setActiveTab}
          />
        );
      case 'Alcance':
        return (
          <SubcontractScopeView 
            subcontract={subcontract}
            project={mockProject}
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
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
}