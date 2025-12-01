import React, { useState, useEffect } from 'react'
import { Receipt, Plus, Home, Bell, Search, Filter } from 'lucide-react'
import { LuHandshake } from 'react-icons/lu'
import { DashboardLayout as Layout } from "@/layouts"
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal'
import ClientDashboardTab from './ClientDashboardTab'
import ClientListTab from './ClientListTab'
import ClientObligationsTab from './ClientObligationsTab'
import ClientPaymentsTab from './ClientPaymentsTab'
import ClientScheduleTab from './ClientScheduleTab'
import ClientSettingsTab from './ClientSettingsTab'
import { useNavigationStore } from '@/stores/navigationStore'
import { useActionBarMobile } from '@/layouts'
import { useMobile } from '@/hooks/use-mobile'
import { useLocation, useSearch } from 'wouter'
import { useProjectContext } from '@/stores/projectContext'

export function Clients() {
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const tabFromUrl = urlParams.get('tab') || 'list';
  const [activeTab, setActiveTab] = useState(tabFromUrl)
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const { setSidebarContext } = useNavigationStore()
  const [, navigate] = useLocation()
  const { selectedProjectId } = useProjectContext()
  const { 
    setActions, 
    setShowActionBar, 
    clearActions, 
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile()
  const isMobile = useMobile()

  // Establecer contexto del sidebar al montar el componente
  useEffect(() => {
    setSidebarContext('finances')
  }, [])

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: {
          id: 'home',
          icon: Home,
          label: 'Inicio',
          onClick: () => {
            navigate('/dashboard');
          },
        },
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Nuevo Compromiso',
          onClick: () => openModal('client-commitment', {
            projectId: selectedProjectId,
            organizationId: userData?.organization?.id
          }),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
      });
      setShowActionBar(true);
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile]) // Remove unstable function dependencies

  // Note: Search and filter functionality is handled automatically by the MobileActionBar component
  // The buttons don't need special configuration - the popovers are built into the ActionBar
  
  const projectId = selectedProjectId
  const organizationId = userData?.organization?.id

  // Crear tabs para el header
  const headerTabs = [
    {
      id: "list",
      label: "Lista de Clientes",
      isActive: activeTab === "list"
    },
    {
      id: "obligations",
      label: "Compromisos de Pago",
      isActive: activeTab === "obligations"
    },
    {
      id: "details",
      label: "Pagos",
      isActive: activeTab === "details"
    },
    {
      id: "schedule",
      label: "Cronograma de Pagos",
      isActive: activeTab === "schedule",
      disabled: true
    },
    {
      id: "settings",
      label: "Ajustes",
      isActive: activeTab === "settings"
    }
  ]

  const handleContactsLink = () => {
    // Cleanup mobile action bar before navigation
    if (isMobile) {
      clearActions();
      setShowActionBar(false);
    }
    setSidebarContext('organization');
    navigate('/contacts');
  };

  const headerProps = {
    title: "Clientes",
    icon: LuHandshake,
    description: (
      <>
        Gestiona los clientes del proyecto. Antes de ser cliente, debe ser un{' '}
        <button
          onClick={handleContactsLink}
          className="hover:underline font-semibold cursor-pointer"
          style={{ color: 'var(--accent)' }}
          data-testid="link-to-contacts"
        >
          contacto
        </button>
        .
      </>
    ),
    tabs: headerTabs,
    onTabChange: setActiveTab,
    organizationId: userData?.organization?.id,
    showMembers: true,
    showProjectSelector: true,
    ...(activeTab === "list" && {
      actionButton: {
        label: "Agregar Cliente",
        icon: Plus,
        onClick: () => openModal('project-client', {
          projectId,
          organizationId
        })
      }
    }),
    ...(activeTab === "obligations" && {
      actionButton: {
        label: "Nuevo Compromiso",
        icon: Plus,
        onClick: () => openModal('client-commitment', {
          projectId,
          organizationId,
          mode: 'create'
        })
      }
    }),
    ...(activeTab === "details" && {
      actionButton: {
        label: "Nuevo Pago",
        icon: Plus,
        onClick: () => openModal('client-payment', {
          projectId,
          organizationId
        })
      }
    }),
    ...(activeTab === "schedule" && {
      actionButton: {
        label: "Nueva Cuota",
        icon: Plus,
        onClick: () => openModal('client-schedule-item', {
          projectId,
          organizationId,
          mode: 'create'
        })
      }
    })
  }

  if (!organizationId) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">No se pudo cargar la información de la organización</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-4">
        {activeTab === "list" && (
          <ClientListTab 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "obligations" && (
          <ClientObligationsTab 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "details" && (
          <ClientPaymentsTab 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "schedule" && (
          <ClientScheduleTab 
            projectId={projectId || undefined}
          />
        )}

        {activeTab === "settings" && (
          <ClientSettingsTab />
        )}
      </div>
    </Layout>
  )
}