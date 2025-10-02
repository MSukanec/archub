import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Package } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { MaterialCostsTab } from './MaterialCostsTab';
import { MaterialBasicDataTab } from './MaterialBasicDataTab';
import { useMaterial } from "@/hooks/use-materials";

export default function MaterialsView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Datos Básicos');
  
  const { data: material, isLoading } = useMaterial(id || '');

  const headerTabs = [
    {
      id: 'Datos Básicos',
      label: 'Datos Básicos',
      isActive: activeTab === 'Datos Básicos'
    },
    {
      id: 'Costos',
      label: 'Costos',
      isActive: activeTab === 'Costos'
    }
  ];

  const headerProps = {
    icon: Package,
    title: material?.name || "Material",
    showBackButton: true,
    onBackClick: () => {
      navigate('/analysis');
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab
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

  if (!material) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Material no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El material con ID {id} no existe o no tienes permisos para verlo.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Datos Básicos':
        return (
          <MaterialBasicDataTab
            material={material}
            onTabChange={setActiveTab}
          />
        );
      case 'Costos':
        return (
          <MaterialCostsTab
            material={material}
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
