import React, { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, Edit, Trash2, User, Eye, UserCheck, FileText, Calendar } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { Link, useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useClientDashboard,
  useDeleteProjectClient,
  mapToClientSummaries,
  type ProjectClientSummary,
  type CurrencyFinancial,
} from '@/features/clients'

interface ClientListTabProps {
  projectId?: string;
}

export default function ClientListTab({ projectId }: ClientListTabProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Prefetch contacts and client roles for faster modal opening
  useQuery({
    queryKey: [`/api/contacts?organization_id=${organizationId}`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  useQuery({
    queryKey: [`/api/client-roles`],
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  // Use feature hook to get dashboard data with financial summaries
  const { data: dashboardData, isLoading } = useClientDashboard(activeProjectId || undefined, organizationId);

  // Transform dashboard data using mappers (no inline calculations)
  const projectClients = useMemo(() => {
    if (!dashboardData) return [];
    return mapToClientSummaries(dashboardData.clients, dashboardData.financialSummaries);
  }, [dashboardData]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!dashboardData) {
      return {
        totalClients: 0,
        activeCommitments: 0,
        recentPayments: 0,
      };
    }

    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const recentPayments = dashboardData.payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= oneMonthAgo && paymentDate <= now;
    });

    return {
      totalClients: dashboardData.clients.length,
      activeCommitments: dashboardData.commitments.length,
      recentPayments: recentPayments.length,
    };
  }, [dashboardData]);

  // Delete mutation using feature hook
  const deleteClientMutation = useDeleteProjectClient();

  const handleDelete = async (client: ProjectClientSummary) => {
    if (!activeProjectId || !organizationId) {
      toast({
        title: 'No disponible',
        description: 'Para eliminar un cliente, selecciona un proyecto específico',
        variant: 'destructive',
      });
      return;
    }

    const clientName = client.contacts 
      ? `${client.contacts.first_name} ${client.contacts.last_name}`.trim()
      : 'Cliente';
    
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Cliente',
      description: 'Se eliminará este cliente del proyecto. Esta acción no se puede deshacer.',
      itemName: clientName,
      itemType: 'cliente',
      onConfirm: async () => {
        try {
          await deleteClientMutation.mutateAsync({
            clientId: client.id,
            organizationId,
            projectId: activeProjectId!,
          });
          toast({
            title: 'Cliente eliminado',
            description: 'El cliente ha sido eliminado del proyecto correctamente',
          });
        } catch (error: any) {
          toast({
            title: 'Error al eliminar cliente',
            description: error.message,
            variant: 'destructive',
          });
        }
      },
    });
  };

  const handleView = (client: ProjectClientSummary) => {
    // Prefetch client data before opening modal for instant display
    if (activeProjectId && organizationId) {
      queryClient.prefetchQuery({
        queryKey: [`/api/projects/${activeProjectId}/clients/${client.id}?organization_id=${organizationId}`],
        staleTime: 2 * 60 * 1000,
      });
    }
    
    openModal('project-client', {
      projectId: activeProjectId,
      clientId: client.id,
      mode: 'view',
    });
  };

  const handleEdit = (client: ProjectClientSummary) => {
    // Prefetch client data before opening modal for instant display
    if (activeProjectId && organizationId) {
      queryClient.prefetchQuery({
        queryKey: [`/api/projects/${activeProjectId}/clients/${client.id}?organization_id=${organizationId}`],
        staleTime: 2 * 60 * 1000,
      });
    }
    
    openModal('project-client', {
      projectId: activeProjectId,
      clientId: client.id,
    });
  };

  const handleEditContact = (client: ProjectClientSummary) => {
    if (!client.contacts) {
      toast({
        title: 'Error',
        description: 'Este cliente no tiene un contacto asociado',
        variant: 'destructive',
      });
      return;
    }

    openModal('contact', {
      isEditing: true,
      editingContact: {
        id: client.contacts.id,
        organization_id: organizationId,
        first_name: client.contacts.first_name,
        last_name: client.contacts.last_name,
        email: client.contacts.email,
        phone: client.contacts.phone,
        created_at: new Date().toISOString(),
      },
    });
  };

  const handleAddClient = () => {
    openModal('project-client', {
      projectId: activeProjectId,
    });
  };

  // Show message only if there's no organization (shouldn't happen)
  if (!organizationId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No se pudo cargar la información de la organización</p>
      </div>
    )
  }

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: CurrencyFinancial['currency']) => {
    if (!currency) return `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${currency.symbol}${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to render multi-currency amounts
  const renderMultiCurrency = (client: ProjectClientSummary, field: keyof Pick<CurrencyFinancial, 'total_committed_amount' | 'total_paid_amount' | 'balance_due'>) => {
    if (client.financialByCurrency.length === 0) return '-';
    
    // Always show first currency
    const currencyData = client.financialByCurrency[0];
    if (!currencyData) return '-';
    
    const amount = currencyData[field];
    
    return (
      <div className="flex flex-col">
        <span className="font-semibold" style={{ fontSize: '14px' }}>
          {formatCurrency(amount, currencyData.currency)}
        </span>
      </div>
    );
  };

  // Table columns
  const columns = [
    {
      key: 'full_name',
      label: 'Cliente',
      width: '220px',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        const avatarUrl = client.contacts?.linked_user?.avatar_url;
        const initials = client.contacts?.first_name?.[0] && client.contacts?.last_name?.[0]
          ? `${client.contacts.first_name[0]}${client.contacts.last_name[0]}`
          : client.contacts?.first_name?.[0] || '?';
        
        const displayName = client.contacts?.company_name || 
                           client.contacts?.full_name || 
                           `${client.contacts?.first_name || ''} ${client.contacts?.last_name || ''}`.trim();
        
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
              <AvatarFallback>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">{displayName || '-'}</span>
              {client.role?.name && (
                <span className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 'normal' }}>
                  {client.role.name}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'Mail',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        return client.contacts?.email || '-';
      },
    },
    {
      key: 'phone',
      label: 'Teléfono',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        return client.contacts?.phone || '-';
      },
    },
    {
      key: 'notes',
      label: 'Notas',
      width: '400px',
      sortable: false,
      render: (client: ProjectClientSummary) => {
        if (!client.notes) return '-';
        const truncated = client.notes.length > 100 
          ? client.notes.substring(0, 100) + '...' 
          : client.notes;
        return <span className="text-muted-foreground">{truncated}</span>;
      },
    },
    {
      key: 'is_primary',
      label: 'Primario',
      sortable: true,
      align: 'center' as const,
      render: (client: ProjectClientSummary) => {
        return client.is_primary ? (
          <span className="text-green-600 dark:text-green-400 font-medium">Sí</span>
        ) : (
          <span className="text-muted-foreground">No</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      sortable: true,
      render: (client: ProjectClientSummary) => {
        const statusMap: Record<string, { label: string; color: string }> = {
          active: { label: 'Activo', color: 'text-green-600 dark:text-green-400' },
          inactive: { label: 'Inactivo', color: 'text-muted-foreground' },
          pending: { label: 'Pendiente', color: 'text-orange-600 dark:text-orange-400' },
        };
        
        const status = statusMap[client.status] || { label: client.status, color: 'text-muted-foreground' };
        return <span className={`font-medium ${status.color}`}>{status.label}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 3 KPIs con datos reales */}
      {projectClients.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Clientes - Ocupa 2 columnas */}
          <StatCard data-testid="stat-card-total-clients" className="col-span-2">
            <StatCardTitle showArrow={false}>
              <Users className="w-4 h-4 inline mr-1" />
              Total Clientes
            </StatCardTitle>
            <StatCardValue>
              {metrics.totalClients}
            </StatCardValue>
            <StatCardMeta>
              Clientes en el proyecto
            </StatCardMeta>
          </StatCard>

          {/* KPI 2: Compromisos Activos - Ocupa 1 columna */}
          <StatCard data-testid="stat-card-active-commitments">
            <StatCardTitle showArrow={false}>
              <FileText className="w-4 h-4 inline mr-1" />
              Compromisos
            </StatCardTitle>
            <StatCardValue>
              {metrics.activeCommitments}
            </StatCardValue>
            <StatCardMeta>
              Compromisos activos
            </StatCardMeta>
          </StatCard>

          {/* KPI 3: Pagos Recientes - Ocupa 1 columna */}
          <StatCard data-testid="stat-card-recent-payments">
            <StatCardTitle showArrow={false}>
              <Calendar className="w-4 h-4 inline mr-1" />
              Recientes
            </StatCardTitle>
            <StatCardValue>
              {metrics.recentPayments}
            </StatCardValue>
            <StatCardMeta>
              Pagos del último mes
            </StatCardMeta>
          </StatCard>
        </div>
      )}

      <Table
        columns={columns}
        data={projectClients}
        isLoading={isLoading}
        showDoubleHeader={false}
        emptyStateConfig={{
          icon: <Users className="h-12 w-12 text-muted-foreground" />,
          title: 'No hay clientes en este proyecto',
          description: (
            <>
              Agrega clientes para gestionar la información del proyecto. Recuerda que un cliente, antes debe ser un{' '}
              <button
                onClick={() => {
                  setSidebarLevel('organization');
                  navigate('/contacts');
                }}
                className="hover:underline font-bold cursor-pointer"
                style={{ color: 'var(--accent)' }}
              >
                contacto
              </button>
              .
            </>
          ),
          action: (
            <Button
              onClick={handleAddClient}
              size="sm"
              data-testid="button-add-client-empty"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Cliente
            </Button>
          ),
        }}
        primaryRowAction={(client: ProjectClientSummary) => ({
          icon: Eye,
          onClick: () => handleView(client),
          label: 'Ver cliente',
        })}
        rowActions={(client: ProjectClientSummary) => [
          {
            label: 'Editar Cliente',
            icon: Edit,
            onClick: () => handleEdit(client),
          },
          {
            label: 'Editar Contacto',
            icon: User,
            onClick: () => handleEditContact(client),
          },
          {
            label: 'Eliminar',
            icon: Trash2,
            onClick: () => handleDelete(client),
            variant: 'destructive',
          },
        ]}
      />
    </div>
  )
}
