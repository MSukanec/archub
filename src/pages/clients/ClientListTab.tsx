import React, { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast'
import { Users, Plus, Edit, Trash2, User, Eye, UserCheck, FileText, Calendar, Send, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useNavigationStore } from '@/stores/navigationStore'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard'
import { useGlobalModalStore } from '@/components/modal'
import { IdentityBadge } from '@/components/shared/IdentityBadge'
import { Link, useLocation } from 'wouter'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseLocalDate } from '@/lib/date-utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMobile } from '@/hooks/use-mobile'
import ClientRow from '@/features/clients/components/ClientRow'
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

type EnrichedClient = ProjectClientSummary & { clientName: string };

export default function ClientListTab({ projectId }: ClientListTabProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const { selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const { setSidebarLevel } = useNavigationStore();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isMobile = useMobile();
  
  const organizationId = userData?.organization?.id
  const activeProjectId = projectId || selectedProjectId

  // Prefetch contacts (LIGHT mode) and client roles for faster modal opening
  useQuery({
    queryKey: [`/api/contacts?organization_id=${organizationId}&mode=light`],
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

  // Enrich projectClients with computed clientName field for sorting
  // Priority: full_name > first_name + last_name > company_name
  const enrichedClients = useMemo<EnrichedClient[]>(() => {
    return projectClients.map(client => ({
      ...client,
      clientName: client.contacts?.full_name || 
                  `${client.contacts?.first_name || ''} ${client.contacts?.last_name || ''}`.trim() || 
                  client.contacts?.company_name || '-'
    }));
  }, [projectClients]);

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
      const paymentDate = parseLocalDate(payment.payment_date)!;
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

    // Prefetch contact data before opening modal
    if (organizationId && client.contacts.id) {
      queryClient.prefetchQuery({
        queryKey: [`/api/contacts/${client.contacts.id}?organization_id=${organizationId}`],
        staleTime: 2 * 60 * 1000,
      });
    }

    openModal('contact', {
      contactId: client.contacts.id,
      mode: 'edit',
    });
  };

  const handleAddClient = () => {
    openModal('project-client', {
      projectId: activeProjectId,
    });
  };

  // Send portal access mutation
  const sendAccessMutation = useMutation({
    mutationFn: async (projectClientId: string) => {
      const response = await apiRequest('POST', `/api/client-portal/send-access/${projectClientId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Acceso enviado',
        description: `Se envió el enlace de acceso a ${data.sentTo}`,
      });
    },
    onError: (error: any) => {
      const errorData = error?.message ? JSON.parse(error.message) : {};
      if (errorData.code === 'NO_EMAIL') {
        toast({
          title: 'Sin email',
          description: 'Este cliente no tiene email registrado. Edita el contacto para agregar uno.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error al enviar',
          description: errorData.error || 'No se pudo enviar el acceso al portal',
          variant: 'destructive',
        });
      }
    },
  });

  const handleSendAccess = (client: ProjectClientSummary) => {
    if (!client.contacts?.email) {
      toast({
        title: 'Sin email',
        description: 'Este cliente no tiene email registrado. Edita el contacto para agregar uno.',
        variant: 'destructive',
      });
      return;
    }
    sendAccessMutation.mutate(client.id);
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
      key: 'clientName',
      label: 'Cliente',
      sortable: true,
      render: (client: EnrichedClient) => {
        // Get avatar URL from contact image
        const avatarUrl = client.contacts?.image_bucket && client.contacts?.image_path 
          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${client.contacts.image_bucket}/${client.contacts.image_path}`
          : null;
        
        // Priority: full_name > first_name + last_name > company_name
        const displayName = client.contacts?.full_name || 
                           `${client.contacts?.first_name || ''} ${client.contacts?.last_name || ''}`.trim() ||
                           client.contacts?.company_name;
        
        // Build badges array for role
        const badgesArray = client.role?.name ? [{ label: client.role.name, variant: 'secondary' as const }] : undefined;
        
        return (
          <IdentityBadge 
            name={displayName || '-'}
            avatarUrl={avatarUrl}
            size="sm"
            subLabel={client.role?.name || undefined}
            badges={badgesArray}
          />
        );
      },
    },
    {
      key: 'email',
      label: 'Mail',
      sortable: true,
      render: (client: EnrichedClient) => {
        return client.contacts?.email || '-';
      },
    },
    {
      key: 'phone',
      label: 'Teléfono',
      sortable: true,
      render: (client: EnrichedClient) => {
        return client.contacts?.phone || '-';
      },
    },
    {
      key: 'notes',
      label: 'Notas',
      sortable: false,
      render: (client: EnrichedClient) => {
        if (!client.notes) return '-';
        const truncated = client.notes.length > 100 
          ? client.notes.substring(0, 100) + '...' 
          : client.notes;
        return <span className="text-muted-foreground">{truncated}</span>;
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

      {isMobile ? (
        <div className="space-y-3 pb-20">
          {enrichedClients.map(client => (
            <ClientRow
              key={client.id}
              client={client}
              onClick={handleView}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              data-testid={`client-row-${client.id}`}
            />
          ))}
        </div>
      ) : (
        <Table
          columns={columns}
          data={enrichedClients}
          isLoading={isLoading}
          showDoubleHeader={false}
          defaultSort={{ key: 'clientName', direction: 'asc' }}
          onRowClick={handleView}
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
          rowActions={(client: EnrichedClient) => [
            {
              label: 'Enviar Acceso al Portal',
              icon: Send,
              onClick: () => handleSendAccess(client),
              disabled: !client.contacts?.email || sendAccessMutation.isPending,
            },
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
      )}
    </div>
  )
}
