import { useState, useEffect } from "react";
import { TrendingUp, Plus, Home, Search, Filter, Bell } from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

// Importar los componentes separados
import IndirectList from './IndirectList';
import { IndirectPayments } from './IndirectPayments';

export default function Indirects() {
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

  // Función para crear costo indirecto
  const handleCreateIndirect = () => {
    openModal('indirect', {
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
          icon: <Home className="h-6 w-6" />,
          onClick: () => {} 
        },
        search: { 
          id: 'search', 
          label: 'Buscar', 
          icon: <Search className="h-6 w-6" />,
          onClick: () => {} 
        },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nuevo Costo Indirecto',
          onClick: handleCreateIndirect,
          variant: 'primary'
        },
        filter: { 
          id: 'filter', 
          label: 'Filtros', 
          icon: <Filter className="h-6 w-6" />,
          onClick: () => {}
        },
        notifications: { 
          id: 'notifications', 
          label: 'Notificaciones', 
          icon: <Bell className="h-6 w-6" />,
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
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' }
            ]
          },
          {
            key: 'type',
            label: 'Categoría',
            value: filterByType,
            onChange: setFilterByType,
            allOptionLabel: 'Todas las categorías',
            placeholder: 'Seleccionar categoría...',
            options: [
              { value: 'administrative', label: 'Administrativo' },
              { value: 'operational', label: 'Operacional' },
              { value: 'equipment', label: 'Equipos' },
              { value: 'other', label: 'Otros' }
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
      icon: TrendingUp,
      pageTitle: "Costos Indirectos",
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
        actionButton: {
          icon: Plus,
          label: "Nuevo Costo Indirecto",
          onClick: handleCreateIndirect
        }
      };
    }

    return baseProps;
  };

  return (
    <Layout headerProps={getHeaderProps()} wide>
      <div className="h-full">
        {activeTab === 'lista' && <IndirectList filterByStatus={filterByStatus} filterByType={filterByType} />}
        
        {activeTab === 'pagos' && userData?.preferences?.last_project_id && userData?.organization?.id && (
          <IndirectPayments 
            projectId={userData.preferences.last_project_id}
            organizationId={userData.organization.id}
          />
        )}
        
        {activeTab === 'pagos' && (!userData?.preferences?.last_project_id || !userData?.organization?.id) && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Selecciona un proyecto para ver los pagos de costos indirectos</p>
          </div>
        )}
      </div>
    </Layout>
  )
}