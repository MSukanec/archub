import { useState, useEffect } from "react";
import { Handshake, Plus, Home, Search, Filter, Bell } from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

// Importar los componentes separados
import SubcontractList from './SubcontractList';
import { SubcontractPayments } from './SubcontractPayments';

export default function Subcontracts() {
  const [activeTab, setActiveTab] = useState('lista')
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();

  // Estados específicos para controles de header en tab Lista
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Mobile action bar
  const { 
    setActions, 
    setShowActionBar, 
    clearActions,
    setFilterConfig 
  } = useActionBarMobile()
  const isMobile = useMobile()

  // Filter states for mobile
  const [filterByStatus, setFilterByStatus] = useState('all')
  const [filterByType, setFilterByType] = useState('all')

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    });
  };

  // Clear filters function
  const handleClearFilters = () => {
    setFilterByStatus('all')
    setFilterByType('all')
  }

  // Configure mobile action bar only for lista tab
  useEffect(() => {
    if (isMobile && activeTab === 'lista') {
      setActions({
        home: { 
          id: 'home', 
          label: 'Inicio', 
          icon: Home,
          onClick: () => {} 
        },
        search: { 
          id: 'search', 
          label: 'Buscar', 
          icon: Search,
          onClick: () => {} 
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Nuevo Subcontrato',
          onClick: handleCreateSubcontract,
          variant: 'primary'
        },
        filter: { 
          id: 'filter', 
          label: 'Filtros', 
          icon: Filter,
          onClick: () => {}
        },
        notifications: { 
          id: 'notifications', 
          label: 'Notificaciones', 
          icon: Bell,
          onClick: () => {} 
        },
      })
      setShowActionBar(true)
    } else if (isMobile) {
      // Clear action bar for other tabs
      clearActions()
    }

    return () => {
      if (isMobile && activeTab === 'lista') {
        clearActions()
      }
    }
  }, [isMobile, activeTab, openModal])

  // Configure filter config separately
  useEffect(() => {
    if (isMobile && activeTab === 'lista') {
      setFilterConfig({
        filters: [
          {
            key: 'status',
            label: 'Estado',
            value: filterByStatus,
            onChange: setFilterByStatus,
            allOptionLabel: 'Todos los estados',
            placeholder: 'Seleccionar estado...',
            options: [
              { value: 'pending', label: 'Pendiente' },
              { value: 'awarded', label: 'Adjudicado' },
              { value: 'in_progress', label: 'En Progreso' },
              { value: 'completed', label: 'Completado' },
              { value: 'cancelled', label: 'Cancelado' }
            ]
          },
          {
            key: 'type',
            label: 'Tipo',
            value: filterByType,
            onChange: setFilterByType,
            allOptionLabel: 'Todos los tipos',
            placeholder: 'Seleccionar tipo...',
            options: [
              { value: 'construction', label: 'Construcción' },
              { value: 'supplies', label: 'Suministros' },
              { value: 'services', label: 'Servicios' },
              { value: 'consulting', label: 'Consultoría' }
            ]
          }
        ],
        onClearFilters: handleClearFilters
      })
    }
  }, [isMobile, activeTab, filterByStatus, filterByType, setFilterConfig])

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
        {activeTab === 'lista' && <SubcontractList filterByStatus={filterByStatus} filterByType={filterByType} />}
        
        {activeTab === 'pagos' && userData?.preferences?.last_project_id && userData?.organization?.id && (
          <SubcontractPayments 
            projectId={userData.preferences.last_project_id}
            organizationId={userData.organization.id}
          />
        )}
        
        {activeTab === 'pagos' && (!userData?.preferences?.last_project_id || !userData?.organization?.id) && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Selecciona un proyecto para ver los pagos de subcontratos</p>
          </div>
        )}
      </div>
    </Layout>
  )
}