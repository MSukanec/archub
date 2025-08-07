import { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Table } from '@/components/ui-custom/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Trash2, Building, Crown } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { useToast } from '@/hooks/use-toast';

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

export default function AdminOrganizations() {
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
        <Select defaultValue="date-desc">
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

        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="regular">Regulares</SelectItem>
            <SelectItem value="system">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );



  const columns = [
    {
      key: 'created_at' as keyof Organization,
      label: 'Fecha',
      width: '14.28%',
      render: (org: Organization) => (
          {format(new Date(org.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name' as keyof Organization,
      label: 'Organización',
      width: '14.28%',
      render: (org: Organization) => (
          {org.is_system && (
          )}
        </div>
      )
    },
    {
      key: 'creator' as keyof Organization,
      label: 'Creador',
      width: '14.28%',
      render: (org: Organization) => (
            {org.creator?.avatar_url ? (
              <img 
                src={org.creator.avatar_url} 
                alt={org.creator.full_name || org.creator.email}
              />
            ) : (
                {org.creator?.full_name?.charAt(0) || org.creator?.email?.charAt(0) || '?'}
              </div>
            )}
          </div>
              {org.creator?.full_name || 'Sin nombre'}
            </span>
              {org.creator?.email || 'Sin email'}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'plan' as keyof Organization,
      label: 'Plan',
      width: '14.28%',
      render: (org: Organization) => {
        return org.plan ? (
          <Badge 
            variant="secondary" 
            style={{
              backgroundColor: org.plan.name?.toLowerCase() === 'free' ? 'var(--plan-free-bg)' :
                             org.plan.name?.toLowerCase() === 'pro' ? 'var(--plan-pro-bg)' :
                             org.plan.name?.toLowerCase() === 'teams' ? 'var(--plan-teams-bg)' :
                             'var(--plan-free-bg)'
            }}
          >
            {org.plan.name}
          </Badge>
        ) : (
          <Badge 
            variant="secondary" 
            style={{ backgroundColor: 'var(--plan-free-bg)' }}
          >
            Free
          </Badge>
        );
      }
    },
    {
      key: 'members_count' as keyof Organization,
      label: 'Miembros',
      width: '14.28%',
      render: (org: Organization) => (
      )
    },
    {
      key: 'is_active' as keyof Organization,
      label: 'Estado',
      width: '14.28%',
      render: (org: Organization) => (
          {org.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      key: 'id' as keyof Organization,
      label: 'Acciones',
      width: '14.28%',
      render: (org: Organization) => (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEdit(org)}
          >
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDelete(org)}
          >
          </Button>
        </div>
      )
    }
  ];

  const headerProps = {
    title: 'Organizaciones',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: handleClearFilters
  };

  return (
    <Layout wide headerProps={headerProps}>
        {/* Statistics Cards */}
              <div>
              </div>
            </div>
          </Card>
          
              <div>
              </div>
            </div>
          </Card>
          
              <div>
              </div>
            </div>
          </Card>
          
              <div>
              </div>
            </div>
          </Card>
        </div>

        <Table
          data={filteredOrganizations}
          columns={columns}
          isLoading={isLoading}
        />


      </div>
    </Layout>
  );
}