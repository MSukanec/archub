import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { DollarSign, Plus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { BudgetListTab } from './view/BudgetListTab';
import { useBudgets } from "@/hooks/use-budgets";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function BudgetView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('Lista');
  
  const { data: budgets, isLoading } = useBudgets();
  const budget = budgets?.find(b => b.id === id);
  const { openModal } = useGlobalModalStore();

  const headerTabs = [
    {
      id: 'Lista',
      label: 'Lista',
      isActive: activeTab === 'Lista'
    }
  ];

  const headerProps = {
    icon: DollarSign,
    title: budget?.name || "Presupuesto",
    showBackButton: true,
    onBackClick: () => {
      navigate('/professional/budgets');
    },
    isViewMode: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: {
      icon: Plus,
      label: "Agregar Item",
      onClick: () => {
        // TODO: Implementar modal para agregar item
        console.log('Agregar item al presupuesto');
      }
    }
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

  if (!budget) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-muted-foreground">Presupuesto no encontrado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            El presupuesto con ID {id} no existe o no tienes permisos para verlo.
          </p>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Lista':
        return (
          <BudgetListTab
            budget={budget}
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