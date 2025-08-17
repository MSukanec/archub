import { useState } from "react";
import { Handshake, Plus } from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

// Importar el componente separado
import SubcontractList from './SubcontractList';

export default function Subcontracts() {
  const [activeTab, setActiveTab] = useState('lista')
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();

  // Estados específicos para controles de header en tab Lista
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

  // Props del header que cambian según la tab activa
  const getHeaderProps = () => {
    const baseProps = {
      icon: Handshake,
      pageTitle: "Subcontratos",
      tabs: [
        { id: 'lista', label: 'Lista', isActive: activeTab === 'lista' },
        { id: 'pagos', label: 'Pagos', isActive: activeTab === 'pagos' }
      ],
      onTabChange: setActiveTab
    };

    // Solo agregar controles específicos para la tab Lista
    if (activeTab === 'lista') {
      return {
        ...baseProps,
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
    }

    return baseProps;
  };

  return (
    <Layout headerProps={getHeaderProps()} wide>
      <div className="h-full">
        {activeTab === 'lista' && <SubcontractList />}
        
        {activeTab === 'pagos' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Contenido de Pagos - Próximamente</p>
          </div>
        )}
      </div>
    </Layout>
  )
}