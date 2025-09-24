import { useState } from 'react';
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { TableActionButtons } from '@/components/ui-custom/tables-and-trees/TableActionButtons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, Building, Crown } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

import { useToast } from '@/hooks/use-toast';
import AdminOrganizationRow from '@/components/ui/data-row/rows/AdminOrganizationRow';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
  is_system: boolean;
  plan_id: string;
  created_by: string;
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
}

// Hook para obtener todas las organizaciones (admin)
function useAllOrganizations() {
  return useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');

      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          created_at,
          is_active,
          is_system,
          plan_id,
          created_by
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }

      // Obtener los planes y usuarios creadores
      const planIds = Array.from(new Set(data.map(org => org.plan_id).filter(Boolean)));
      const creatorIds = Array.from(new Set(data.map(org => org.created_by).filter(Boolean)));
      
      const [plansResult, usersResult] = await Promise.all([
        planIds.length > 0 ? supabase!
          .from('plans')
          .select('id, name')
          .in('id', planIds) : { data: [], error: null },
        creatorIds.length > 0 ? supabase!
          .from('users')
          .select('id, full_name, email, avatar_url')
          .in('id', creatorIds) : { data: [], error: null }
      ]);

      // Mapear organizaciones con sus relaciones
      const organizationsWithPlans = data.map(org => ({
        ...org,
        plan: plansResult.data?.find(plan => plan.id === org.plan_id) || null,
        creator: usersResult.data?.find(user => user.id === org.created_by) || null
      }));

      console.log('Organizations with plans:', organizationsWithPlans);

      // Obtener conteos de miembros y proyectos para cada organización
      const organizationsWithCounts = await Promise.all(
        organizationsWithPlans.map(async (org) => {
          const [membersResult, projectsResult] = await Promise.all([
            supabase!
              .from('organization_members')
              .select('id', { count: 'exact' })
              .eq('organization_id', org.id),
            supabase!
              .from('projects')
              .select('id', { count: 'exact' })
              .eq('organization_id', org.id)
          ]);

          return {
            ...org,
            members_count: membersResult.count || 0,
            projects_count: projectsResult.count || 0
          };
        })
      );

      return organizationsWithCounts;
    }
  });
}

const AdminCommunityOrganizations = () => {
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
      key: 'name',
      label: 'Organización',
      width: '32%',
      render: (organization: Organization) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
            <Building className="w-4 h-4 text-accent" />
          </div>
          <div>
            <div className="font-medium">{organization.name}</div>
            <div className="text-xs text-muted-foreground">
              {organization.creator?.full_name || 'Usuario desconocido'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      width: '10%',
      render: (organization: Organization) => (
        <Badge variant={organization.plan?.name === 'Free' ? 'secondary' : 'default'}>
          {organization.plan?.name || 'Sin plan'}
        </Badge>
      ),
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
            variant={organization.is_active ? 'default' : 'secondary'}
            className={organization.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}
          >
            {organization.is_active ? 'Activa' : 'Inactiva'}
          </Badge>
          {organization.is_system && (
            <Badge variant="outline" className="text-xs">
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
    {
      key: 'actions',
      label: '',
      width: '8%',
      render: (organization: Organization) => (
        <TableActionButtons
          onEdit={() => handleEdit(organization)}
          onDelete={() => handleDelete(organization)}
        />
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
            <p className="text-xs">No hay organizaciones que coincidan con los filtros aplicados.</p>
          </div>
        }
      />
    </div>
  );
};

export default AdminCommunityOrganizations;