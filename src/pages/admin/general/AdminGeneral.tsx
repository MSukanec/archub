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
    { id: 'movimientos', label: 'Movimientos' },
    { id: 'unidades', label: 'Unidades de Venta' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'movimientos':
        return {
          label: "Nuevo Concepto",
          icon: Plus,
          onClick: () => {
            // TODO: Crear modal de creación de conceptos
            console.log('Crear nuevo concepto');
          }
        };
      case 'unidades':
        return {
          label: "Nueva Unidad",
          icon: Plus,
          onClick: () => {
            // TODO: Crear modal de creación de unidades
            console.log('Crear nueva unidad');
          }
        };
      default:
        return {
          label: "Nuevo Concepto",
          icon: Plus,
          onClick: () => console.log('Crear nuevo concepto')
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
    tabs,
    activeTab,
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