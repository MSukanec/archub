import React, { useState, useEffect } from 'react'
import { Receipt, Plus, Users, Home, Bell, Search, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layout/desktop/Layout'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { supabase } from '@/lib/supabase'
import ClientListTab from './ClientListTab'
import { ClientObligations } from './ClientObligations'
import { ClientPaymentPlans } from './ClientPaymentPlans'
import { ClientPayments } from './ClientPayments'
import { useNavigationStore } from '@/stores/navigationStore'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { useLocation } from 'wouter'
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted'

export function Clients() {
  const [activeTab, setActiveTab] = useState("list")
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()
  const { setSidebarContext } = useNavigationStore()
  const [, navigate] = useLocation()
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
          onClick: () => openModal('project-client'),
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
  
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.organization?.id

  // Fetch existing payment plan for the project to determine button text
  const { data: existingPaymentPlan } = useQuery({
    queryKey: ['project-payment-plan', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return null
      
      const { data, error } = await supabase
        .from('project_payment_plans')
        .select(`
          *,
          payment_plans(
            id,
            name,
            description
          )
        `)
        .eq('project_id', projectId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - no payment plan exists
          return null
        }
        console.error('Error fetching payment plan:', error)
        return null
      }

      return data
    },
    enabled: !!projectId
  })

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
      label: "Historial de Pagos",
      isActive: activeTab === "details"
    },
    {
      id: "monthly-installments",
      label: "Plan de Pagos",
      isActive: activeTab === "monthly-installments"
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
    icon: Users,
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
        onClick: () => openModal('project-client', {
          projectId,
          organizationId
        })
      }
    }),
    ...(activeTab === "monthly-installments" && {
      actionButton: {
        label: existingPaymentPlan ? "Cambiar Plan de Pago" : "Nuevo Plan de Pagos",
        icon: Plus,
        onClick: () => openModal('client-payment-plans', {
          projectId,
          organizationId,
          existingPaymentPlan
        })
      }
    }),
    ...(activeTab === "details" && {
      actionButton: {
        label: "Nuevo Aporte",
        icon: Plus,
        onClick: () => openModal('installment', {
          projectId,
          organizationId,
          subcategoryId: 'f3b96eda-15d5-4c96-ade7-6f53685115d3' // Subcategoría para Aportes de Terceros
        })
      }
    })
  }

  if (!projectId || !organizationId) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Selecciona un proyecto para ver los aportes de clientes</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      <div className="space-y-4">
        {activeTab === "list" && (
          <ClientListTab 
            projectId={projectId}
          />
        )}

        {activeTab === "obligations" && (
          <ClientObligations 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}

        {activeTab === "details" && (
          <ClientPayments 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}

        {activeTab === "monthly-installments" && (
          <PlanRestricted reason="coming_soon">
            <ClientPaymentPlans 
              projectId={projectId}
              organizationId={organizationId}
            />
          </PlanRestricted>
        )}
      </div>
    </Layout>
  )
}