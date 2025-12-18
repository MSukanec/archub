import { useState, useEffect, useMemo } from 'react';
import { Table } from '@/components/shared/table'
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, Building, Crown, Award, Eye } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal';

import { useToast } from '@/hooks/use-toast';
import AdminOrganizationRow from '@/features/organization/components/admin/AdminOrganizationRow';
import { OrganizationDetailDrawer } from '@/features/admin';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
  plan_id: string;
  created_by: string;
  settings: {
    is_founder?: boolean;
    [key: string]: any;
  } | null;
  plan: {
    id: string;
    name: string;
  } | null;
  creator: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  } | null;
  members_count: number;
  projects_count: number;
  last_seen_at: string | null;
}

// Componente para mostrar la última actividad (simplificado: solo punto)
function LastActivityCell({ lastSeen }: { lastSeen: string | null }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const { isOnline, tooltip } = useMemo(() => {
    if (!lastSeen) return { isOnline: false, tooltip: 'Sin actividad registrada' };
    
    const lastSeenTime = new Date(lastSeen).getTime();
    const now = Date.now();
    const diffMs = now - lastSeenTime;
    
    if (diffMs <= 90_000) {
      return { isOnline: true, tooltip: format(new Date(lastSeen), 'dd/MM/yyyy HH:mm:ss', { locale: es }) };
    }
    
    return { 
      isOnline: false, 
      tooltip: format(new Date(lastSeen), 'dd/MM/yyyy HH:mm:ss', { locale: es })
    };
  }, [lastSeen, tick]);

  return (
    <div className="flex items-center" title={tooltip}>
      <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-[var(--plan-free-bg)]' : 'bg-muted-foreground'}`} />
    </div>
  );
}

// Hook para obtener todas las organizaciones (admin) desde backend optimizado
function useAllOrganizations() {
  return useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');
      
      const response = await fetch('/api/admin/organizations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }
      
      return response.json();
    },
    staleTime: 30000,
    refetchInterval: 60000
  });
}

const AdminAdminOrganizations = () => {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { openModal } = useGlobalModalStore();

  const { data: organizations, isLoading } = useAllOrganizations();

  // Calculate statistics
  const stats = {
    total: organizations?.length || 0,
    free: organizations?.filter(org => org.plan?.name === 'Free').length || 0,
    pro: organizations?.filter(org => org.plan?.name === 'Pro').length || 0,
    teams: organizations?.filter(org => org.plan?.name === 'Teams').length || 0
  };

  const handleViewDetails = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsDrawerOpen(true);
  };
  
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrganization(null);
    queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
  };

  const handleEdit = (organization: Organization) => {
    openModal('admin-organization', { organization, isEditing: true });
  };

  const handleDelete = (organization: Organization) => {
    openModal('delete-confirmation', {
      title: 'Desactivar Organización',
      description: `¿Estás seguro de que deseas desactivar la organización "${organization.name}"? Esta acción cambiará su estado a inactivo.`,
      itemName: organization.name,
      onConfirm: () => deleteOrganizationMutation.mutate(organization.id),
      dangerous: true
    });
  };

  const deleteOrganizationMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('organizations')
        .update({ is_active: false })
        .eq('id', organizationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      toast({
        title: 'Organización desactivada',
        description: 'La organización ha sido desactivada correctamente.'
      });
    },
    onError: (error) => {
      console.error('Error deactivating organization:', error);
      toast({
        title: 'Error',
        description: 'No se pudo desactivar la organización. Inténtalo de nuevo.',
        variant: 'destructive'
      });
    }
  });

  // Filtrar organizaciones
  const filteredOrganizations = organizations?.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && org.is_active) ||
      (statusFilter === 'inactive' && !org.is_active);
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'system' && org.is_system) ||
      (typeFilter === 'regular' && !org.is_system);
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleClearFilters = () => {
    setSearchValue('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const customFilters = (
    <div className="space-y-4 w-72">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select defaultValue="date-desc">
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Fecha (más reciente)</SelectItem>
            <SelectItem value="date-asc">Fecha (más antigua)</SelectItem>
            <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Estado</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Tipo</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const tableColumns = [
    {
      key: 'last_activity',
      label: 'Última Actividad',
      width: '14%',
      render: (organization: Organization) => <LastActivityCell lastSeen={organization.last_seen_at} />
    },
    {
      key: 'founder',
      label: 'Fundador',
      width: '5%',
      render: (organization: Organization) => (
        organization.settings?.is_founder ? (
          <div title="Organización Fundadora">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
        ) : null
      )
    },
    {
      key: 'name',
      label: 'Organización',
      width: '24%',
      render: (organization: Organization) => (
        <div>
          <div className="font-bold text-sm">{organization.name}</div>
          <div className="text-sm text-muted-foreground">
            {organization.creator?.full_name || 'Desconocido'}
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      width: '10%',
      render: (organization: Organization) => {
        const planName = organization.plan?.name || 'Sin plan';
        let bgColor = '';
        
        if (planName === 'Free') {
          bgColor = 'bg-[var(--plan-free-bg)]';
        } else if (planName === 'Pro') {
          bgColor = 'bg-[var(--plan-pro-bg)]';
        } else if (planName === 'Teams') {
          bgColor = 'bg-[var(--plan-teams-bg)]';
        }
        
        return (
          <Badge 
            variant="default"
            className={`${bgColor} text-white hover:${bgColor}/90`}
          >
            {planName}
          </Badge>
        );
      },
    },
    {
      key: 'members',
      label: 'Miembros',
      width: '8%',
      render: (organization: Organization) => (
        <span className="text-sm">{organization.members_count}</span>
      ),
    },
    {
      key: 'projects',
      label: 'Proyectos',
      width: '8%',
      render: (organization: Organization) => (
        <span className="text-sm">{organization.projects_count}</span>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      width: '10%',
      render: (organization: Organization) => (
        <div className="flex items-center gap-2">
          <Badge 
            variant="default"
            className="bg-[var(--plan-free-bg)] text-white hover:bg-[var(--plan-free-bg)]/90"
          >
            {organization.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
          {organization.is_system && (
            <Badge variant="outline" className="text-sm">
              <Crown className="w-3 h-3 mr-1" />
              Sistema
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Fecha de creación',
      width: '12%',
      render: (organization: Organization) => (
        <span className="text-sm">
          {organization.created_at ? format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es }) : 'No disponible'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Organizations Table */}
      <Table
        columns={tableColumns}
        data={filteredOrganizations}
        isLoading={isLoading}
        onRowClick={(organization) => handleViewDetails(organization)}
        rowActions={(organization) => [
          {
            icon: Eye,
            label: 'Ver Detalles',
            onClick: () => handleViewDetails(organization)
          },
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(organization)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(organization),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(organization) => (
          <AdminOrganizationRow
            organization={organization}
            onClick={() => handleEdit(organization)}
            density="normal"
          />
        )}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron organizaciones</p>
            <p className="text-sm">No hay organizaciones que coincidan con los filtros aplicados.</p>
          </div>
        }
      />
      
      <OrganizationDetailDrawer
        organization={selectedOrganization}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default AdminAdminOrganizations;