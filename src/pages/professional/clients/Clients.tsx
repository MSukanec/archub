import React, { useState, useEffect } from 'react'
import { Receipt, Plus, Users, Home, Bell, Search, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layout/desktop/Layout'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { supabase } from '@/lib/supabase'
import { ClientObligations } from './ClientObligations'
import { ClientPaymentPlans } from './ClientPaymentPlans'
import { ClientPayments } from './ClientPayments'
import { useNavigationStore } from '@/stores/navigationStore'
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext'
import { useMobile } from '@/hooks/use-mobile'
import { useLocation } from 'wouter'

export function Clients() {
  const [activeTab, setActiveTab] = useState("obligations")
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
      id: "obligations",
      label: "Compromisos de Pago",
      isActive: activeTab === "obligations"
    },
    {
      id: "monthly-installments",
      label: "Plan de Pagos",
      isActive: activeTab === "monthly-installments"
    },
    {
      id: "details",
      label: "Historial de Pagos",
      isActive: activeTab === "details"
    }
  ]

  const headerProps = {
    title: "Clientes",
    icon: Users,
    tabs: headerTabs,
    onTabChange: setActiveTab,
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
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Selecciona un proyecto para ver los aportes de clientes</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-4">
        {activeTab === "obligations" && (
          <ClientObligations 
            projectId={projectId}
            organizationId={organizationId}
          />
        )}

        {activeTab === "monthly-installments" && (
          <ClientPaymentPlans 
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
      </div>
    </Layout>
  )
}