import { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminGeneralMovementConcepts from './AdminGeneralMovementConcepts';
import AdminGeneralUnitPresentations from './AdminGeneralUnitPresentations';

const AdminGeneral = () => {
  const [activeTab, setActiveTab] = useState('movimientos');
  const { openModal } = useGlobalModalStore();

  const tabs = [
    { id: 'movimientos', label: 'Movimientos', isActive: activeTab === 'movimientos' },
    { id: 'unidades', label: 'Unidades de Venta', isActive: activeTab === 'unidades' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'movimientos':
        return {
          label: "Nuevo Concepto",
          icon: Plus,
          onClick: () => openModal('movement-concept')
        };
      case 'unidades':
        return {
          label: "Nueva Unidad",
          icon: Plus,
          onClick: () => openModal('unit-presentation-form', { editingUnitPresentation: null })
        };
      default:
        return {
          label: "Nuevo Concepto",
          icon: Plus,
        };
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'movimientos':
        return <AdminGeneralMovementConcepts />;
      case 'unidades':
        return <AdminGeneralUnitPresentations />;
      default:
        return <AdminGeneralMovementConcepts />;
    }
  };

  const headerProps = {
    title: 'General',
    icon: Settings,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {renderTabContent()}
      </div>
    </Layout>
  );
};

export default AdminGeneral;