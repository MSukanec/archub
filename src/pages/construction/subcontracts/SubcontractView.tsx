import { useState } from "react";
import { useParams, useLocation } from "wouter";

import { Layout } from '@/components/layout/desktop/Layout';
import { SubcontractDashboardView } from './tabs/SubcontractDashboardView';
import { useSubcontract } from "@/hooks/use-subcontracts";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function SubcontractView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Resumen');
  
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
      id: 'Documentos',
      label: 'Documentos',
      isActive: activeTab === 'Documentos'
    }
  ];

  const headerProps = {
    title: subcontract?.title || "Subcontrato",
    showBackButton: true,
    onBackClick: () => navigate('/construction/subcontracts'),
    tabs: headerTabs,
    onTabChange: setActiveTab
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
          />
        );
      case 'Alcance':
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-muted-foreground">Alcance</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vista de alcance en construcción
            </p>
          </div>
        );
      case 'Ofertas':
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-muted-foreground">Ofertas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vista de ofertas en construcción
            </p>
          </div>
        );
      case 'Documentos':
        return (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-muted-foreground">Documentos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vista de documentos en construcción
            </p>
          </div>
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